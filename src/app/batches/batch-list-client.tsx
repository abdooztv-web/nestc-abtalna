"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { formatDate, cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

const SOURCE_COLORS: Record<string, string> = {
  abtalna: "bg-primary-fixed text-primary",
  wuzzuf: "bg-secondary-container text-secondary",
  direct: "bg-surface-container-high text-on-surface-variant",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-error font-bold",
  high: "text-tertiary font-bold",
  standard: "text-on-surface-variant",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: "Pending", color: "bg-surface-container-high text-on-surface-variant", icon: "pending" },
  processing: { label: "Processing", color: "bg-primary-fixed text-primary", icon: "sync" },
  completed: { label: "Completed", color: "bg-secondary-container text-secondary", icon: "task_alt" },
  cancelled: { label: "Cancelled", color: "bg-error-container text-error", icon: "cancel" },
};

const TABS = [
  { key: "pending", label: "Pending Verifications", icon: "pending_actions" },
  { key: "processing", label: "Processing", icon: "sync" },
  { key: "completed", label: "Completed", icon: "task_alt" },
];

type Batch = {
  id: string;
  batchRef: string;
  status: string;
  source: string;
  priority: string;
  totalCount: number;
  processedCount: number;
  webhookFired: boolean;
  webhookStatus: number | null;
  submittedAt: string;
  completedAt: string | null;
  client: { name: string; company: string | null };
  assignedTo: { name: string } | null;
  _count: { candidates: number };
};

export function BatchListClient({
  session,
  counts,
  agents,
  initialStatus,
}: {
  session: SessionUser;
  counts: { pending: number; processing: number; completed: number };
  agents: { id: string; name: string }[];
  initialStatus: string;
}) {
  const [activeTab, setActiveTab] = useState(initialStatus);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status: activeTab });
    const res = await fetch(`/api/batches?${params}`);
    const data = await res.json();
    setBatches(data.batches || []);
    setLoading(false);
  }, [activeTab]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  const filtered = batches.filter((b) =>
    !search ||
    b.batchRef.toLowerCase().includes(search.toLowerCase()) ||
    b.client.company?.toLowerCase().includes(search.toLowerCase()) ||
    b.client.name.toLowerCase().includes(search.toLowerCase())
  );

  const tabCounts: Record<string, number> = {
    pending: counts.pending,
    processing: counts.processing,
    completed: counts.completed,
  };

  return (
    <>
      <Header userName={session.name} userRole={session.role} onSearch={setSearch} />
      <div className="p-8 max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">
              Verification Engine: Batches
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Manage and track background screening batches from clients
            </p>
          </div>
          <Link
            href="/batches/new"
            className="precision-gradient text-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded flex items-center gap-2"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload_file</span>
            Import Batch (CSV)
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "p-5 rounded-xl text-left transition-all",
                activeTab === tab.key
                  ? "bg-primary-container text-white shadow-sm"
                  : "bg-surface-container-lowest hover:bg-surface-container-low"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={cn(
                    "material-symbols-outlined",
                    activeTab === tab.key ? "text-white" : "text-on-surface-variant"
                  )}
                  style={{ fontSize: 22 }}
                >
                  {tab.icon}
                </span>
                <span className={cn(
                  "text-3xl font-black tracking-tighter",
                  activeTab === tab.key ? "text-white" : "text-on-surface"
                )}>
                  {tabCounts[tab.key]}
                </span>
              </div>
              <p className={cn(
                "text-[11px] uppercase tracking-widest font-bold",
                activeTab === tab.key ? "text-white/80" : "text-on-surface-variant"
              )}>
                {tab.label}
              </p>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] uppercase tracking-widest font-bold text-on-surface-variant">
              {TABS.find(t => t.key === activeTab)?.label} — {filtered.length} {filtered.length === 1 ? "batch" : "batches"}
            </h2>
            {session.role !== "partner" && (
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>info</span>
                Click a batch to score candidates
              </div>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-on-surface-variant">
                <span className="material-symbols-outlined" style={{ fontSize: 36 }}>sync</span>
                <p className="text-sm mt-2">Loading batches...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-16 text-center text-on-surface-variant">
                <span className="material-symbols-outlined" style={{ fontSize: 40 }}>inbox</span>
                <p className="text-sm mt-2 font-medium">No {activeTab} batches</p>
                {activeTab === "pending" && (
                  <Link
                    href="/batches/new"
                    className="inline-block mt-4 precision-gradient text-white px-4 py-2 text-[11px] font-bold uppercase tracking-widest rounded"
                  >
                    Import First Batch
                  </Link>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/10">
                    {["Batch ID", "Client", "Source", "Submission Date", "Scope", "Progress", "Priority", "Status", "Webhook", "Actions"].map((h) => (
                      <th key={h} className="px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filtered.map((batch) => {
                    const pct = batch.totalCount > 0
                      ? Math.round((batch.processedCount / batch.totalCount) * 100)
                      : 0;
                    const cfg = STATUS_CONFIG[batch.status] || STATUS_CONFIG.pending;
                    return (
                      <tr key={batch.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-on-surface">{batch.batchRef}</p>
                          <p className="text-[10px] text-on-surface-variant/70 font-mono">{batch.id.slice(0, 8)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-on-surface">
                            {batch.client.company || batch.client.name}
                          </p>
                          {batch.assignedTo && (
                            <p className="text-[10px] text-on-surface-variant">→ {batch.assignedTo.name}</p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            SOURCE_COLORS[batch.source] || SOURCE_COLORS.direct
                          )}>
                            {batch.source}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-on-surface-variant">
                          {formatDate(batch.submittedAt)}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold">{batch.totalCount} candidates</p>
                          <p className="text-[10px] text-on-surface-variant">{batch.processedCount} scored</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-outline-variant/20 rounded-full overflow-hidden min-w-[60px]">
                              <div
                                className="h-full precision-gradient rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-on-surface-variant">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn("text-xs", PRIORITY_COLORS[batch.priority] || "text-on-surface-variant")}>
                            {batch.priority.charAt(0).toUpperCase() + batch.priority.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            cfg.color
                          )}>
                            <span className="material-symbols-outlined" style={{ fontSize: 10 }}>{cfg.icon}</span>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {batch.webhookFired ? (
                            <span className={cn(
                              "flex items-center gap-1 text-[10px] font-bold",
                              batch.webhookStatus && batch.webhookStatus < 300 ? "text-secondary" : "text-error"
                            )}>
                              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                                {batch.webhookStatus && batch.webhookStatus < 300 ? "check_circle" : "error"}
                              </span>
                              {batch.webhookStatus || "Sent"}
                            </span>
                          ) : (
                            <span className="text-[10px] text-on-surface-variant">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-1">
                            <Link
                              href={`/batches/${batch.id}`}
                              className="p-1.5 hover:bg-primary-container hover:text-white rounded transition-colors text-on-surface-variant"
                              title="View & Score"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>visibility</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
