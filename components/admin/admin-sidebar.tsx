"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BedDouble,
  CalendarCheck,
  CreditCard,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { Wordmark } from "@/components/layout/wordmark";
import { postJson } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/types";

const primaryLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/admin/bookings", label: "Reservations", icon: CalendarCheck, adminOnly: false },
  { href: "/admin/clients", label: "Clients", icon: Users, adminOnly: false },
  { href: "/admin/messages", label: "Messages", icon: Inbox, adminOnly: false },
  { href: "/admin/service-requests", label: "Service Requests", icon: Sparkles, adminOnly: false },
  { href: "/admin/settings", label: "Settings", icon: Settings, adminOnly: false },
];

const secondaryLinks = [
  { href: "/admin/payments", label: "Payments", icon: CreditCard, adminOnly: false },
  { href: "/admin/rooms", label: "Apartments", icon: BedDouble, adminOnly: false },
  { href: "/admin/staff", label: "Team", icon: UserCog, adminOnly: true },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, adminOnly: false },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminSidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visiblePrimary = primaryLinks.filter((link) => !link.adminOnly || user.role === "admin");
  const visibleSecondary = secondaryLinks.filter((link) => !link.adminOnly || user.role === "admin");

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    await postJson("/api/admin/auth/logout", {});
    router.push("/admin/login");
    router.refresh();
    setSigningOut(false);
  }

  const navContent = (
    <>
      <div className="border-b border-stone/70 px-6 py-6">
        <Wordmark compact />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[0.66rem] uppercase tracking-[0.16em] text-charcoal/55">
            Operations portal
          </p>
          <span className="inline-flex items-center border border-bronze/40 bg-bronze/10 px-2 py-0.5 text-[0.62rem] uppercase tracking-wider text-bronze">
            {user.role}
          </span>
        </div>
      </div>

      <nav aria-label="Operations Primary" className="flex flex-1 flex-col gap-1 px-3 py-5">
        <span className="px-3 pb-1 text-[0.62rem] uppercase tracking-[0.14em] text-charcoal/45 font-medium">
          Main Menu
        </span>
        {visiblePrimary.map((link) => {
          const Icon = link.icon;
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-[0.84rem] transition-colors rounded-none",
                active
                  ? "bg-charcoal text-ivory font-medium"
                  : "text-charcoal/70 hover:bg-stone/30 hover:text-charcoal",
              )}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}

        <div className="my-2 border-t border-stone/50" />

        <span className="px-3 pb-1 text-[0.62rem] uppercase tracking-[0.14em] text-charcoal/45 font-medium">
          Hospitality Ops
        </span>
        {visibleSecondary.map((link) => {
          const Icon = link.icon;
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-[0.82rem] transition-colors",
                active
                  ? "bg-charcoal text-ivory font-medium"
                  : "text-charcoal/65 hover:bg-stone/30 hover:text-charcoal",
              )}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-stone/70 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="truncate text-[0.82rem] font-medium text-charcoal">{user.fullName}</p>
            <p className="truncate text-[0.7rem] text-charcoal/55">{user.email}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 pt-2 border-t border-stone/40">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.74rem] text-charcoal/65 underline-offset-4 hover:text-bronze hover:underline"
          >
            ↗ Public residence website
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 text-left text-[0.76rem] text-charcoal/75 transition-colors hover:text-red-700 disabled:opacity-50"
          >
            <LogOut aria-hidden="true" className="size-3.5" />
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar toggle */}
      <div className="flex items-center justify-between border-b border-stone/70 bg-canvas px-4 py-3 lg:hidden">
        <Wordmark compact />
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          className="p-2 text-charcoal"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex bg-charcoal/60 lg:hidden"
        >
          <div className="flex w-72 flex-col bg-canvas shadow-xl">
            {navContent}
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="flex-1"
          />
        </div>
      ) : null}

      {/* Desktop static sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-stone/70 bg-canvas lg:flex lg:min-h-screen lg:flex-col">
        {navContent}
      </aside>
    </>
  );
}
