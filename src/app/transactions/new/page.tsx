import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { NewTransactionClient } from "./new-transaction-client";

export default async function NewTransactionPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 min-w-0">
        <NewTransactionClient session={session} />
      </main>
    </div>
  );
}
