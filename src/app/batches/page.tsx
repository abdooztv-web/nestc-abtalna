import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";
import { BatchListClient } from "./batch-list-client";

export default async function BatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { status } = await searchParams;

  const where = session.role === "partner" ? { clientId: session.id } : {};
  const [pending, processing, completed] = await Promise.all([
    prisma.batch.count({ where: { ...where, status: "pending" } }),
    prisma.batch.count({ where: { ...where, status: "processing" } }),
    prisma.batch.count({ where: { ...where, status: "completed" } }),
  ]);

  // Get agents for assignment
  const agents = session.role !== "partner"
    ? await prisma.user.findMany({
        where: { role: { in: ["nestc_agent", "admin"] } },
        select: { id: true, name: true },
      })
    : [];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 min-w-0">
        <BatchListClient
          session={session}
          counts={{ pending, processing, completed }}
          agents={agents}
          initialStatus={status || "pending"}
        />
      </main>
    </div>
  );
}
