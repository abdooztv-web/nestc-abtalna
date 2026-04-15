import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";
import { BatchDetailClient } from "./batch-detail-client";

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, company: true, source: true } },
      assignedTo: { select: { id: true, name: true } },
      candidates: {
        include: { scoredBy: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!batch) notFound();
  if (session.role === "partner" && batch.clientId !== session.id) redirect("/batches");

  const agents = session.role !== "partner"
    ? await prisma.user.findMany({
        where: { role: { in: ["nestc_agent", "admin"] } },
        select: { id: true, name: true },
      })
    : [];

  const serialized = {
    ...batch,
    submittedAt: batch.submittedAt.toISOString(),
    completedAt: batch.completedAt?.toISOString() || null,
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
    candidates: batch.candidates.map((c) => ({
      ...c,
      scoredAt: c.scoredAt?.toISOString() || null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 min-w-0">
        <BatchDetailClient session={session} batch={serialized} agents={agents} />
      </main>
    </div>
  );
}
