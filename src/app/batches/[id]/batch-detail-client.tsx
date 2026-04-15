"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

const SCORE_CONFIG = {
  CLEAR: {
    label: "Clear",
    color: "bg-secondary-container text-secondary border-secondary/20",
    icon: "check_circle",
    description: "No criminal record found",
    btnClass: "bg-secondary text-white hover:bg-secondary/90",
  },
  CONSIDER: {
    label: "Consider",
    color: "bg-tertiary-fixed text-tertiary border-tertiary/20",
    icon: "warning",
    description: "Record found — employer review needed",
    btnClass: "bg-tertiary text-white hover:bg-tertiary/90",
  },
  ADVERSE: {
    label: "Adverse",
    color: "bg-error-container text-error border-error/20",
    icon: "cancel",
    description: "Disqualifying record found",
    btnClass: "bg-error text-white hover:bg-error/90",
  },
} as const;

type Score = keyof typeof SCORE_CONFIG;

type Candidate = {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  dateOfBirth: string | null;
  nationalId: string | null;
  phone: string | null;
  address: string | null;
  positionApplied: string | null;
  status: string;
  score: string | null;
  scoreNotes: string | null;
  scoredAt: string | null;
  scoredBy: { name: string } | null;
};

type Batch = {
  id: string;
  batchRef: string;
  status: string;
  source: string;
  priority: string;
  totalCount: number;
  processedCount: number;
  notes: string | null;
  webhookUrl: string | null;
  webhookFired: boolean;
  webhookStatus: number | null;
  submittedAt: string;
  completedAt: string | null;
  client: { name: string; company: string | null; source: string | null };
  assignedTo: { id: string; name: string } | null;
  candidates: Candidate[];
};

export function BatchDetailClient({
  session,
  batch: initialBatch,
  agents,
}: {
  session: SessionUser;
  batch: Batch;
  agents: { id: string; name: string }[];
}) {
  const [batch, setBatch] = useState(initialBatch);
  const [scoring, setScoring] = useState<string | null>(null);
  const [scoreModal, setScoreModal] = useState<Candidate | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "scored">("all");
  const [completing, setCompleting] = useState(false);
  const [completionMsg, setCompletionMsg] = useState("");

  const canScore = session.role === "admin" || session.role === "nestc_agent";

  const candidates = batch.candidates.filter((c) => {
    if (filter === "pending") return !c.score;
    if (filter === "scored") return !!c.score;
    return true;
  });

  const scoredCount = batch.candidates.filter((c) => !!c.score).length;
  const clearCount = batch.candidates.filter((c) => c.score === "CLEAR").length;
  const considerCount = batch.candidates.filter((c) => c.score === "CONSIDER").length;
  const adverseCount = batch.candidates.filter((c) => c.score === "ADVERSE").length;
  const allScored = scoredCount === batch.candidates.length;
  const pct = batch.totalCount > 0 ? Math.round((scoredCount / batch.totalCount) * 100) : 0;

  async function scoreCandidate(candidateId: string, score: Score, notes: string) {
    setScoring(candidateId);
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, scoreNotes: notes }),
      });
      const data = await res.json();
      if (res.ok) {
        setBatch((prev) => ({
          ...prev,
          processedCount: prev.processedCount + 1,
          candidates: prev.candidates.map((c) =>
            c.id === candidateId
              ? { ...c, score, scoreNotes: notes, status: "completed", scoredAt: new Date().toISOString(), scoredBy: { name: session.name } }
              : c
          ),
        }));
        setScoreModal(null);
      }
    } finally {
      setScoring(null);
    }
  }

  async function handleAssign(agentId: string) {
    const res = await fetch(`/api/batches/${batch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedToId: agentId || null, status: agentId ? "processing" : "pending" }),
    });
    if (res.ok) {
      const agent = agents.find(a => a.id === agentId);
      setBatch(prev => ({
        ...prev,
        status: agentId ? "processing" : "pending",
        assignedTo: agent ? { id: agent.id, name: agent.name } : null,
      }));
    }
  }

  async function completeBatch() {
    setCompleting(true);
    setCompletionMsg("");
    try {
      const res = await fetch(`/api/batches/${batch.id}/complete`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setBatch(prev => ({ ...prev, status: "completed", completedAt: new Date().toISOString() }));
        if (data.webhookResult?.success) {
          setCompletionMsg("Batch completed. Webhook sent successfully to client.");
        } else if (data.webhookResult) {
          setCompletionMsg(`Batch completed. Webhook failed: ${data.webhookResult.error || "HTTP " + data.webhookResult.status}`);
        } else {
          setCompletionMsg("Batch completed. No webhook configured.");
        }
      } else {
        setCompletionMsg(`Error: ${data.error}`);
      }
    } finally {
      setCompleting(false);
    }
  }

  return (
    <>
      <Header userName={session.name} userRole={session.role} />
      <div className="p-6 max-w-[1400px] mx-auto space-y-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/batches" className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-sm transition-colors">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
              Batches
            </Link>
            <div className="h-4 w-px bg-outline-variant" />
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">Batch Reference</p>
              <p className="text-xl font-black text-on-surface">{batch.batchRef}</p>
            </div>
            <span className={cn(
              "inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
              batch.status === "pending" ? "bg-surface-container-high text-on-surface-variant" :
              batch.status === "processing" ? "bg-primary-fixed text-primary" :
              batch.status === "completed" ? "bg-secondary-container text-secondary" :
              "bg-error-container text-error"
            )}>
              {batch.status}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {canScore && batch.status !== "completed" && (
              <div className="flex items-center gap-2">
                <label className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">Assign to:</label>
                <select
                  value={batch.assignedTo?.id || ""}
                  onChange={(e) => handleAssign(e.target.value)}
                  className="text-sm bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none rounded-lg px-3 py-1.5"
                >
                  <option value="">— Unassigned —</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}
            {canScore && allScored && batch.status !== "completed" && (
              <button
                onClick={completeBatch}
                disabled={completing}
                className="precision-gradient text-white px-5 py-2 text-[11px] font-bold uppercase tracking-widest rounded flex items-center gap-2 disabled:opacity-60"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>send</span>
                {completing ? "Completing..." : "Complete & Send Results"}
              </button>
            )}
          </div>
        </div>

        {completionMsg && (
          <div className={cn(
            "p-4 rounded-lg text-sm font-medium flex items-center gap-2",
            completionMsg.includes("Error") || completionMsg.includes("failed")
              ? "bg-error-container text-on-error-container"
              : "bg-secondary-container text-secondary"
          )}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {completionMsg.includes("Error") || completionMsg.includes("failed") ? "error" : "check_circle"}
            </span>
            {completionMsg}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main — Candidate Table */}
          <div className="xl:col-span-3 space-y-4">
            {/* Progress + Score Summary */}
            <div className="bg-surface-container-lowest rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] uppercase tracking-widest font-bold text-on-surface-variant">Scoring Progress</p>
                <p className="text-sm font-bold text-on-surface">{scoredCount} / {batch.totalCount} candidates</p>
              </div>
              <div className="h-2 bg-outline-variant/20 rounded-full overflow-hidden mb-4">
                <div className="h-full precision-gradient rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {([["CLEAR", clearCount], ["CONSIDER", considerCount], ["ADVERSE", adverseCount]] as [Score, number][]).map(([score, count]) => {
                  const cfg = SCORE_CONFIG[score];
                  return (
                    <div key={score} className={cn("p-3 rounded-lg border flex items-center gap-3", cfg.color)}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{cfg.icon}</span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider">{cfg.label}</p>
                        <p className="text-xl font-black">{count}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 border-b border-outline-variant/30">
              {(["all", "pending", "scored"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors",
                    filter === f ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  {f === "all" ? `All (${batch.candidates.length})` :
                   f === "pending" ? `Pending (${batch.candidates.filter(c => !c.score).length})` :
                   `Scored (${scoredCount})`}
                </button>
              ))}
            </div>

            {/* Candidate List */}
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
              {candidates.length === 0 ? (
                <div className="p-10 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined" style={{ fontSize: 32 }}>inbox</span>
                  <p className="text-sm mt-2">No candidates in this view</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant/10">
                      {["#", "Candidate", "DOB", "National ID", "Position", "Score", "Scored By", canScore ? "Action" : ""].filter(Boolean).map((h) => (
                        <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {candidates.map((c, idx) => {
                      const scored = !!c.score;
                      const scoreCfg = scored ? SCORE_CONFIG[c.score as Score] : null;
                      return (
                        <tr key={c.id} className={cn(
                          "transition-colors",
                          scored ? "hover:bg-surface-container-low/30" : "hover:bg-primary-fixed/10"
                        )}>
                          <td className="px-4 py-3 text-xs text-on-surface-variant font-mono">{String(idx + 1).padStart(2, "0")}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-bold text-on-surface">
                              {c.firstName} {c.middleName ? `${c.middleName} ` : ""}{c.lastName}
                            </p>
                            {c.phone && <p className="text-[10px] text-on-surface-variant">{c.phone}</p>}
                            {c.address && <p className="text-[10px] text-on-surface-variant truncate max-w-[160px]">{c.address}</p>}
                          </td>
                          <td className="px-4 py-3 text-sm">{c.dateOfBirth || "—"}</td>
                          <td className="px-4 py-3 text-xs font-mono">{c.nationalId || "—"}</td>
                          <td className="px-4 py-3 text-sm">{c.positionApplied || "—"}</td>
                          <td className="px-4 py-3">
                            {scoreCfg ? (
                              <div className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase", scoreCfg.color)}>
                                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{scoreCfg.icon}</span>
                                {scoreCfg.label}
                              </div>
                            ) : (
                              <span className="text-[10px] text-on-surface-variant">Pending</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {c.scoredBy ? (
                              <div>
                                <p className="text-xs font-medium">{c.scoredBy.name}</p>
                                {c.scoredAt && <p className="text-[10px] text-on-surface-variant">{formatDate(c.scoredAt)}</p>}
                              </div>
                            ) : <span className="text-[10px] text-on-surface-variant">—</span>}
                          </td>
                          {canScore && (
                            <td className="px-4 py-3">
                              {!scored ? (
                                <button
                                  onClick={() => setScoreModal(c)}
                                  disabled={scoring === c.id || batch.status === "completed"}
                                  className="precision-gradient text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded flex items-center gap-1 disabled:opacity-40"
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>rate_review</span>
                                  Score
                                </button>
                              ) : (
                                <button
                                  onClick={() => setScoreModal(c)}
                                  disabled={batch.status === "completed"}
                                  className="text-[10px] text-on-surface-variant hover:text-primary transition-colors disabled:opacity-40"
                                >
                                  Edit
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right Panel — Batch Info */}
          <div className="space-y-4">
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
              <div className="px-5 py-4 bg-surface-container-low border-b border-outline-variant/20">
                <h3 className="text-[11px] uppercase tracking-widest font-bold text-on-surface">Batch Info</h3>
              </div>
              <div className="p-5 space-y-3 text-xs">
                <InfoRow label="Reference" value={batch.batchRef} mono />
                <InfoRow label="Client" value={batch.client.company || batch.client.name} />
                <InfoRow label="Source" value={batch.source.charAt(0).toUpperCase() + batch.source.slice(1)} />
                <InfoRow label="Priority" value={batch.priority.charAt(0).toUpperCase() + batch.priority.slice(1)} />
                <InfoRow label="Submitted" value={formatDate(batch.submittedAt)} />
                {batch.completedAt && <InfoRow label="Completed" value={formatDate(batch.completedAt)} />}
                {batch.assignedTo && <InfoRow label="Assigned To" value={batch.assignedTo.name} />}
                {batch.notes && (
                  <div className="pt-2 border-t border-outline-variant/20">
                    <p className="text-on-surface-variant mb-1">Notes</p>
                    <p className="text-on-surface">{batch.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Webhook Status */}
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
              <div className="px-5 py-4 bg-surface-container-low border-b border-outline-variant/20">
                <h3 className="text-[11px] uppercase tracking-widest font-bold text-on-surface">Webhook / Trigger</h3>
              </div>
              <div className="p-5 space-y-3">
                {batch.webhookUrl ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>webhook</span>
                      <p className="text-xs font-bold text-on-surface truncate">{batch.webhookUrl}</p>
                    </div>
                    {batch.webhookFired ? (
                      <div className={cn(
                        "flex items-center gap-2 p-2 rounded-lg text-xs font-bold",
                        batch.webhookStatus && batch.webhookStatus < 300
                          ? "bg-secondary-container text-secondary"
                          : "bg-error-container text-error"
                      )}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          {batch.webhookStatus && batch.webhookStatus < 300 ? "check_circle" : "error"}
                        </span>
                        {batch.webhookStatus && batch.webhookStatus < 300
                          ? `Sent · HTTP ${batch.webhookStatus}`
                          : `Failed · HTTP ${batch.webhookStatus || "—"}`}
                      </div>
                    ) : (
                      <p className="text-xs text-on-surface-variant">Will fire when batch is completed.</p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-on-surface-variant">No webhook configured for this batch.</p>
                )}

                {/* Payload preview */}
                {batch.status === "completed" && (
                  <details className="group mt-2">
                    <summary className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant cursor-pointer hover:text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined group-open:rotate-90 transition-transform" style={{ fontSize: 14 }}>chevron_right</span>
                      Payload Preview
                    </summary>
                    <pre className="mt-2 text-[10px] bg-inverse-surface text-inverse-on-surface p-3 rounded-lg overflow-x-auto">
{JSON.stringify({
  event: "batch.completed",
  batchRef: batch.batchRef,
  summary: { clear: clearCount, consider: considerCount, adverse: adverseCount },
  totalCandidates: batch.totalCount,
}, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Modal */}
      {scoreModal && (
        <ScoreModal
          candidate={scoreModal}
          onClose={() => setScoreModal(null)}
          onScore={scoreCandidate}
          loading={scoring === scoreModal.id}
        />
      )}
    </>
  );
}

function ScoreModal({
  candidate,
  onClose,
  onScore,
  loading,
}: {
  candidate: Candidate;
  onClose: () => void;
  onScore: (id: string, score: Score, notes: string) => void;
  loading: boolean;
}) {
  const [score, setScore] = useState<Score | "">(candidate.score as Score || "");
  const [notes, setNotes] = useState(candidate.scoreNotes || "");

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-lowest rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <div>
            <h3 className="text-[11px] uppercase tracking-widest font-bold text-on-surface">Score Candidate</h3>
            <p className="text-sm font-bold text-primary mt-0.5">
              {candidate.firstName} {candidate.lastName}
            </p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* Candidate quick info */}
          <div className="grid grid-cols-2 gap-3 text-xs p-3 bg-surface-container rounded-lg">
            {candidate.nationalId && <div><span className="text-on-surface-variant">National ID: </span><span className="font-bold">{candidate.nationalId}</span></div>}
            {candidate.dateOfBirth && <div><span className="text-on-surface-variant">DOB: </span><span className="font-bold">{candidate.dateOfBirth}</span></div>}
            {candidate.positionApplied && <div><span className="text-on-surface-variant">Position: </span><span className="font-bold">{candidate.positionApplied}</span></div>}
            {candidate.address && <div><span className="text-on-surface-variant">Address: </span><span className="font-bold">{candidate.address}</span></div>}
          </div>

          {/* Score Selection */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-on-surface-variant mb-3">
              Verification Result *
            </label>
            <div className="space-y-2">
              {(Object.entries(SCORE_CONFIG) as [Score, typeof SCORE_CONFIG[Score]][]).map(([s, cfg]) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScore(s)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                    score === s
                      ? `${cfg.color} border-current`
                      : "border-outline-variant/30 hover:border-outline-variant bg-surface-container-low"
                  )}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{cfg.icon}</span>
                  <div>
                    <p className="text-sm font-bold">{cfg.label}</p>
                    <p className="text-xs text-on-surface-variant">{cfg.description}</p>
                  </div>
                  {score === s && (
                    <span className="ml-auto material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-on-surface-variant mb-1.5">
              Screening Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add details about the criminal record check findings..."
              className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none rounded-lg px-4 py-2.5 text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => score && onScore(candidate.id, score, notes)}
              disabled={!score || loading}
              className="flex-1 precision-gradient text-white py-2.5 text-[11px] font-bold uppercase tracking-widest rounded flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Score"}
            </button>
            <button
              onClick={onClose}
              className="bg-surface-container-high px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-on-surface-variant">{label}</span>
      <span className={cn("font-medium text-on-surface", mono && "font-mono")}>{value}</span>
    </div>
  );
}
