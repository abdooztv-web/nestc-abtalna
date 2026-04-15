import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";
import { TransactionDetailClient } from "./transaction-detail-client";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, company: true } },
      assignedTo: { select: { id: true, name: true } },
      components: true,
      actionHistory: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      documents: {
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!transaction) notFound();

  if (session.role === "partner" && transaction.createdById !== session.id) {
    redirect("/dashboard");
  }

  const serialized = {
    ...transaction,
    dateOfOrder: transaction.dateOfOrder.toISOString(),
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
    components: transaction.components.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    actionHistory: transaction.actionHistory.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
    documents: transaction.documents.map((d) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
    })),
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 min-w-0">
        <TransactionDetailClient session={session} transaction={serialized} />
      </main>
    </div>
  );
}
