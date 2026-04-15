import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const txWhere = session.role === "partner" ? { createdById: session.id } : {};
  const batchWhere = session.role === "partner" ? { clientId: session.id } : {};

  const [
    totalBatches, pendingBatches, processingBatches, completedBatches,
    totalCandidates, clearedCandidates, adverseCandidates,
    recentActions,
  ] = await Promise.all([
    prisma.batch.count({ where: batchWhere }),
    prisma.batch.count({ where: { ...batchWhere, status: "pending" } }),
    prisma.batch.count({ where: { ...batchWhere, status: "processing" } }),
    prisma.batch.count({ where: { ...batchWhere, status: "completed" } }),
    prisma.candidate.count({ where: session.role === "partner" ? { batch: { clientId: session.id } } : {} }),
    prisma.candidate.count({ where: { ...(session.role === "partner" ? { batch: { clientId: session.id } } : {}), score: "CLEAR" } }),
    prisma.candidate.count({ where: { ...(session.role === "partner" ? { batch: { clientId: session.id } } : {}), score: "ADVERSE" } }),
    prisma.batch.findMany({
      where: batchWhere,
      include: {
        client: { select: { name: true, company: true } },
        _count: { select: { candidates: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 min-w-0">
        <DashboardClient
          session={session}
          stats={{
            totalBatches, pendingBatches, processingBatches, completedBatches,
            totalCandidates, clearedCandidates, adverseCandidates,
          }}
          recentBatches={recentActions.map(b => ({
            id: b.id,
            batchRef: b.batchRef,
            status: b.status,
            source: b.source,
            priority: b.priority,
            totalCount: b.totalCount,
            processedCount: b.processedCount,
            submittedAt: b.submittedAt.toISOString(),
            completedAt: b.completedAt?.toISOString() || null,
            client: b.client,
            _count: b._count,
          }))}
        />
      </main>
    </div>
  );
}
