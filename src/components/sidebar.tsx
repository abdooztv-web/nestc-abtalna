"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: "dashboard", label: "Batch Overview" },
  { href: "/batches?status=pending", icon: "pending_actions", label: "Pending Verifications", base: "/batches" },
  { href: "/batches?status=processing", icon: "sync", label: "Processing" },
  { href: "/batches?status=completed", icon: "task_alt", label: "Completed" },
  { href: "/batches/new", icon: "upload_file", label: "Import Batch (CSV)" },
  { href: "/transactions/new", icon: "add_circle", label: "New Single Request" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  function isActive(item: typeof navItems[0]) {
    if (item.href === "/dashboard") return pathname === "/dashboard";
    if (item.href === "/batches/new") return pathname === "/batches/new";
    if (item.href === "/transactions/new") return pathname === "/transactions/new";
    // For batch status tabs, check both pathname and potential query
    if (item.base === "/batches" || item.href.startsWith("/batches?")) {
      return pathname.startsWith("/batches") && pathname !== "/batches/new";
    }
    return pathname.startsWith(item.href.split("?")[0]);
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-container-low flex flex-col py-6 z-50">
      {/* Logo */}
      <div className="px-6 mb-10 flex items-center gap-3">
        <div className="w-10 h-10 precision-gradient rounded flex items-center justify-center">
          <span className="material-symbols-outlined text-white" style={{ fontSize: 20 }}>hub</span>
        </div>
        <div>
          <h1 className="text-lg font-black text-primary tracking-tight">Nestec</h1>
          <p className="uppercase tracking-wider text-[11px] font-bold text-on-surface-variant">Admin Engine</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5">
        {/* Section: Overview */}
        <p className="px-6 text-[9px] uppercase tracking-widest font-black text-on-surface-variant/50 mb-1">Overview</p>
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center px-6 py-3 transition-all duration-200",
            pathname === "/dashboard"
              ? "bg-white text-primary border-r-4 border-primary shadow-sm"
              : "text-on-surface-variant hover:bg-surface-container-high"
          )}
        >
          <span className="material-symbols-outlined mr-3" style={{ fontSize: 18 }}>dashboard</span>
          <span className="uppercase tracking-wider text-[11px] font-bold">Batch Overview</span>
        </Link>

        {/* Section: Verifications */}
        <p className="px-6 text-[9px] uppercase tracking-widest font-black text-on-surface-variant/50 mt-4 mb-1">Verifications</p>
        {[
          { href: "/batches?status=pending", icon: "pending_actions", label: "Pending", statusKey: "pending" },
          { href: "/batches?status=processing", icon: "sync", label: "Processing", statusKey: "processing" },
          { href: "/batches?status=completed", icon: "task_alt", label: "Completed", statusKey: "completed" },
        ].map((item) => {
          const active = pathname === "/batches" || (pathname.startsWith("/batches") && !pathname.startsWith("/batches/new") && !pathname.match(/\/batches\/[^/]+/));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-6 py-3 transition-all duration-200",
                pathname.startsWith("/batches") && !pathname.startsWith("/batches/new")
                  ? "text-primary bg-primary-fixed/20"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              <span className="material-symbols-outlined mr-3" style={{ fontSize: 18 }}>{item.icon}</span>
              <span className="uppercase tracking-wider text-[11px] font-bold">{item.label}</span>
            </Link>
          );
        })}

        {/* Section: Actions */}
        <p className="px-6 text-[9px] uppercase tracking-widest font-black text-on-surface-variant/50 mt-4 mb-1">Actions</p>
        <Link
          href="/batches/new"
          className={cn(
            "flex items-center px-6 py-3 transition-all duration-200",
            pathname === "/batches/new"
              ? "bg-white text-primary border-r-4 border-primary shadow-sm"
              : "text-on-surface-variant hover:bg-surface-container-high"
          )}
        >
          <span className="material-symbols-outlined mr-3" style={{ fontSize: 18 }}>upload_file</span>
          <span className="uppercase tracking-wider text-[11px] font-bold">Import CSV Batch</span>
        </Link>
        <Link
          href="/transactions/new"
          className={cn(
            "flex items-center px-6 py-3 transition-all duration-200",
            pathname === "/transactions/new"
              ? "bg-white text-primary border-r-4 border-primary shadow-sm"
              : "text-on-surface-variant hover:bg-surface-container-high"
          )}
        >
          <span className="material-symbols-outlined mr-3" style={{ fontSize: 18 }}>person_add</span>
          <span className="uppercase tracking-wider text-[11px] font-bold">Single Request</span>
        </Link>
      </nav>

      {/* Footer */}
      <div className="px-6 pt-4 mt-auto flex flex-col gap-1 border-t border-outline-variant/20">
        <a href="#" className="flex items-center py-2 text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined mr-3" style={{ fontSize: 16 }}>help</span>
          <span className="uppercase tracking-wider text-[10px] font-bold">Support</span>
        </a>
        <button
          onClick={handleSignOut}
          className="flex items-center py-2 text-on-surface-variant hover:text-error transition-colors w-full text-left"
        >
          <span className="material-symbols-outlined mr-3" style={{ fontSize: 16 }}>logout</span>
          <span className="uppercase tracking-wider text-[10px] font-bold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
