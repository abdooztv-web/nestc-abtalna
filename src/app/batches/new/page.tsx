import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { NewBatchClient } from "./new-batch-client";

export default async function NewBatchPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 min-w-0">
        <NewBatchClient session={session} />
      </main>
    </div>
  );
}
