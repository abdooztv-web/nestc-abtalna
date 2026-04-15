"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type HeaderProps = {
  userName: string;
  userRole: string;
  onSearch?: (q: string) => void;
};

export function Header({ userName, userRole, onSearch }: HeaderProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    onSearch?.(e.target.value);
  }

  const roleLabel =
    userRole === "admin" ? "Super Admin" : userRole === "nestc_agent" ? "NESTC Agent" : "Partner";

  return (
    <header className="bg-surface flex justify-between items-center w-full px-6 h-16 sticky top-0 z-40 border-b border-outline-variant/20">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96 max-w-full">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            style={{ fontSize: 18 }}
          >
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="Search by name, transaction ID..."
            className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:outline-none rounded-lg pl-10 pr-4 py-2 text-sm"
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 flex items-center justify-center hover:bg-surface-container rounded-full transition-colors relative">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20 }}>
              notifications
            </span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-9 h-9 flex items-center justify-center hover:bg-surface-container rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20 }}>
              settings
            </span>
          </button>
        </div>
        <div className="h-6 w-px bg-outline-variant/30" />
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-on-surface leading-tight">{userName}</p>
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold">{roleLabel}</p>
          </div>
          <div className="w-9 h-9 precision-gradient rounded-full flex items-center justify-center text-white text-sm font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
