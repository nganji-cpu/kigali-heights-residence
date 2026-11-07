"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Search } from "lucide-react";
import { postJson } from "@/lib/api-client";
import type { AuthUser } from "@/types";

export function AdminTopNav({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/admin/bookings?search=${encodeURIComponent(searchQuery.trim())}`);
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    await postJson("/api/admin/auth/logout", {});
    router.push("/admin/login");
    router.refresh();
    setSigningOut(false);
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-stone/70 bg-white/95 px-5 backdrop-blur sm:px-8">
      <div className="flex flex-1 items-center gap-4 max-w-md">
        <form onSubmit={handleSearch} className="relative w-full">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-charcoal/45" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reservations by ref, name or email..."
            className="w-full border border-stone/80 bg-stone/15 py-1.5 pl-9 pr-4 text-[0.82rem] text-charcoal placeholder:text-charcoal/45 focus:border-bronze focus:bg-white focus:outline-none transition-colors"
          />
        </form>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick notification links */}
        <Link
          href="/admin/messages"
          title="Contact messages"
          className="relative p-2 text-charcoal/65 hover:text-charcoal transition-colors"
        >
          <Bell className="size-4" />
        </Link>

        {/* User profile chip */}
        <div className="hidden sm:flex items-center gap-2.5 border-l border-stone/70 pl-4">
          <div className="flex size-7 items-center justify-center rounded-full bg-charcoal text-[0.72rem] font-medium text-ivory">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-[0.78rem] font-medium leading-none text-charcoal">
              {user.fullName}
            </span>
            <span className="text-[0.64rem] uppercase tracking-wider text-charcoal/50">
              {user.role}
            </span>
          </div>
        </div>

        {/* Logout button */}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          title="Sign out"
          className="p-2 text-charcoal/60 hover:text-red-700 transition-colors disabled:opacity-50"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}
