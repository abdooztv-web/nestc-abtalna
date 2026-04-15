"use client";

import Link from "next/link";
import { Header } from "@/components/header";
import { formatDate, cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

const SOURCE_COLORS: Record<string, string> = {
  abtalna: "bg-primary-fixed text-primary",
  wuzzuf: "bg-secondary-container text-secondary",
  direct: "bg-surface-container-high text-on-surface-variant",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-surface-container-high text-on-surface-variant" },
  processing: { label: "Processing", color: "bg-primary-fixed text-primary" },
  completed: { label: "Completed", color: "bg-secondary-container text-secondary" },
  cancelled: { label: "Cancelled", color: "bg-error-container text-error" },
};

type RecentBatch = {
  id: string;
  batchRef: string;
  status: string;
  source: string;
  priority: string;
  totalCount: number;
  processedCount: number;
  submittedAt: string;
  completedAt: string | null;
  client: { name: string; company: string | null };
  _count: { candidates: number };
};

type Stats = {
  totalBatches: number;
  pendingBatches: number;
  processingBatches: number;
  completedBatches: number;
  totalCandidates: number;
  clearedCandidates: number;
  adverseCandidates: number;
};

export function DashboardClient({
  session,
  stats,
  recentBatches,
}: {
  session: SessionUser;
  stats: Stats;
  recentBatches: RecentBatch[];
}) {
  return (
    <>
      <Header userName={session.name} userRole={session.role} />
      <div className="p-8 max-w-[1600px] mx-auto space-y-8">

        {/* Stat Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <StatCard label="Total Batches" value={stats.totalBatches} icon="inventory_2" sub={`${stats.totalCandidates} candidates total`} />
          <StatCard label="Pending Review" value={stats.pendingBatches} icon="pending_actions" valueColor="text-primary" sub="Awaiting NESTC action" subColor="text-tertiary" />
          <StatCard label="In Processing" value={stats.processingBatches} icon="sync" valueColor="text-secondary" progress={stats.totalBatches > 0 ? (stats.processingBatches / stats.totalBatches) * 100 : 0} />
          <StatCard label="Completed" value={stats.completedBatches} icon="task_alt" sub="On track with SLA" subColor="text-secondary" />
        </section>

        {/* Candidate Outcome Stats */}
        <section className="grid grid-cols-3 gap-4">
          <div className="bg-secondary-container rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: 24 }}>check_circle</span>
            </div>
            <div>
              <p className="text-3xl font-black text-secondary">{stats.clearedCandidates}</p>
              <p className="text-[11px] uppercase tracking-widest font-bold text-secondary/70">Candidates Cleared</p>
            </div>
          </div>
          <div className="bg-tertiary-fixed/50 rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-tertiary/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 24 }}>warning</span>
            </div>
            <div>
              <p className="text-3xl font-black text-tertiary">
                {stats.totalCandidates - stats.clearedCandidates - stats.adverseCandidates}
              </p>
              <p className="text-[11px] uppercase tracking-widest font-bold text-tertiary/70">Under Review</p>
            </div>
          </div>
          <div className="bg-error-container/50 rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-error/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-error" style={{ fontSize: 24 }}>cancel</span>
            </div>
            <div>
              <p className="text-3xl font-black text-error">{stats.adverseCandidates}</p>
              <p className="text-[11px] uppercase tracking-widest font-bold text-error/70">Adverse Findings</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Recent Batches Table */}
          <div className="xl:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold tracking-tight text-on-surface">Recent Batches</h3>
              <div className="flex gap-2">
                <Link
                  href="/batches"
                  className="bg-surface-container-high px-4 py-2 text-[11px] font-bold uppercase tracking-widest rounded hover:bg-surface-container-highest transition-colors"
                >
                  View All
                </Link>
                <Link
                  href="/batches/new"
                  className="precision-gradient text-white px-4 py-2 text-[11px] font-bold uppercase tracking-widest rounded flex items-center gap-2"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>upload_file</span>
                  Import CSV
                </Link>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
              {recentBatches.length === 0 ? (
                <div className="p-16 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined" style={{ fontSize: 48 }}>inventory_2</span>
                  <p className="text-sm mt-3 font-medium">No batches yet</p>
                  <Link href="/batches/new" className="inline-block mt-4 precision-gradient text-white px-5 py-2 text-[11px] font-bold uppercase tracking-widest rounded">
                    Import First Batch
                  </Link>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant/10">
                      {["Batch ID", "Client", "Source", "Candidates", "Progress", "Status", "Date", "Actions"].map(h => (
                        <th key={h} className="px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {recentBatches.map(batch => {
                      const pct = batch.totalCount > 0 ? Math.round((batch.processedCount / batch.totalCount) * 100) : 0;
                      const cfg = STATUS_CONFIG[batch.status] || STATUS_CONFIG.pending;
                      return (
                        <tr key={batch.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-on-surface">{batch.batchRef}</p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 precision-gradient rounded flex items-center justify-center text-[10px] font-black text-white">
                                {(batch.client.company || batch.client.name).charAt(0)}
                              </div>
                              <span className="text-sm font-medium">{batch.client.company || batch.client.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              SOURCE_COLORS[batch.source] || SOURCE_COLORS.direct
                            )}>
                              {batch.source}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm font-bold">{batch.totalCount}</p>
                            <p className="text-[10px] text-on-surface-variant">{batch.processedCount} scored</p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 min-w-[80px]">
                              <div className="flex-1 h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                                <div className="h-full precision-gradient" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs font-bold text-on-surface-variant">{pct}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              cfg.color
                            )}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-on-surface-variant">{formatDate(batch.submittedAt)}</td>
                          <td className="px-5 py-4">
                            <div className="flex gap-1">
                              <Link
                                href={`/batches/${batch.id}`}
                                className="p-1.5 hover:bg-primary-container hover:text-white rounded transition-colors text-on-surface-variant"
                                title="View"
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

          {/* Right: Flow Explanation */}
          <aside className="space-y-5">
            <h3 className="text-xl font-extrabold tracking-tight text-on-surface">Verification Flow</h3>
            <div className="bg-surface-container-low rounded-xl p-6 space-y-4">
              {[
                { icon: "upload_file", step: "01", title: "Batch Submitted", desc: "Partner uploads CSV with candidate list", color: "text-primary" },
                { icon: "sync", step: "02", title: "NESTC Processes", desc: "Agents verify each candidate via court records", color: "text-secondary" },
                { icon: "rate_review", step: "03", title: "Score Issued", desc: "Each candidate gets: CLEAR / CONSIDER / ADVERSE", color: "text-tertiary" },
                { icon: "webhook", step: "04", title: "Results Sent", desc: "Webhook fires to Abtalna / Wuzzuf system automatically", color: "text-primary" },
                { icon: "verified", step: "05", title: "Badge Issued", desc: "Cleared workers receive Verified Badge on platform", color: "text-secondary" },
              ].map((item, idx, arr) => (
                <div key={item.step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn("w-8 h-8 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0", item.color)}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{item.icon}</span>
                    </div>
                    {idx < arr.length - 1 && <div className="w-px flex-1 bg-outline-variant/30 mt-1 min-h-[16px]" />}
                  </div>
                  <div className="pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest">{item.step}</span>
                      <p className="text-sm font-bold text-on-surface">{item.title}</p>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Dark stats card */}
            <div className="bg-inverse-surface rounded-xl p-6 text-inverse-on-surface">
              <h4 className="text-[11px] uppercase tracking-widest font-black mb-4 opacity-70">Batch Source Split</h4>
              <div className="space-y-3 text-xs font-bold">
                <div>
                  <div className="flex justify-between mb-1"><span>Abtalna</span><span>—</span></div>
                  <div className="h-1 bg-white/10 rounded-full"><div className="h-full bg-primary-fixed w-[60%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between mb-1"><span>Wuzzuf</span><span>—</span></div>
                  <div className="h-1 bg-white/10 rounded-full"><div className="h-full bg-secondary-fixed w-[30%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between mb-1"><span>Direct</span><span>—</span></div>
                  <div className="h-1 bg-white/10 rounded-full"><div className="h-full bg-tertiary-fixed w-[10%]" /></div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function StatCard({
  label, value, icon, sub, subColor = "text-primary", valueColor = "text-on-surface", progress,
}: {
  label: string; value: number; icon: string; sub?: string; subColor?: string;
  valueColor?: string; progress?: number;
}) {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col justify-between group hover:bg-primary-container transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest font-bold text-on-surface-variant group-hover:text-primary-fixed mb-1">{label}</p>
          <h2 className={cn("text-4xl font-black tracking-tighter group-hover:text-white", valueColor)}>{value}</h2>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant/30 group-hover:text-white/30" style={{ fontSize: 28 }}>{icon}</span>
      </div>
      {progress !== undefined ? (
        <div className="mt-4 w-full bg-outline-variant/20 h-1.5 rounded-full overflow-hidden">
          <div className="precision-gradient h-full group-hover:bg-white/40" style={{ width: `${progress}%` }} />
        </div>
      ) : sub ? (
        <div className={cn("mt-4 flex items-center font-bold text-xs group-hover:text-white", subColor)}>
          <span>{sub}</span>
        </div>
      ) : null}
    </div>
  );
}
