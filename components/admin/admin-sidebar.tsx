"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BedDouble,
  CalendarCheck,
  CreditCard,
  LayoutDashboard,
  LogOut,
  UserCog,
  Users,
} from "lucide-react";
import { Wordmark } from "@/components/layout/wordmark";
import { postJson } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/types";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, adminOnly: false },
  { href: "/admin/reservations", label: "Reservations", icon: CalendarCheck, adminOnly: false },
  { href: "/admin/rooms", label: "Apartments", icon: BedDouble, adminOnly: false },
  { href: "/admin/customers", label: "Customers", icon: Users, adminOnly: false },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, adminOnly: false },
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

  const visibleLinks = links.filter((link) => !link.adminOnly || user.role === "admin");

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    await postJson("/api/auth/logout", {});
    router.push("/login");
    router.refresh();
    setSigningOut(false);
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-stone/70 bg-canvas lg:flex lg:min-h-screen lg:flex-col">
        <div className="border-b border-stone/70 px-6 py-6">
          <Wordmark compact />
          <p className="mt-3 text-[0.66rem] uppercase tracking-[0.16em] text-charcoal/55">
            Operations portal
          </p>
        </div>

        <nav aria-label="Operations" className="flex flex-1 flex-col gap-1 px-3 py-5">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-[0.85rem] transition-colors",
                  active
                    ? "bg-charcoal text-ivory"
                    : "text-charcoal/70 hover:bg-stone/30 hover:text-charcoal",
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-stone/70 px-4 py-4">
          <p className="truncate text-[0.82rem] text-charcoal">{user.fullName}</p>
          <p className="text-[0.68rem] uppercase tracking-[0.12em] text-charcoal/55">
            {user.role}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <Link
              href="/"
              className="text-[0.74rem] text-charcoal/65 underline-offset-4 hover:text-charcoal hover:underline"
            >
              View public site
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center gap-2 text-left text-[0.74rem] text-charcoal/65 transition-colors hover:text-bronze disabled:opacity-45"
            >
              <LogOut aria-hidden="true" className="size-3.5" />
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header + horizontal nav */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between border-b border-stone/70 bg-canvas px-5 py-4">
          <div className="flex flex-col gap-1">
            <Wordmark compact />
            <span className="text-[0.6rem] uppercase tracking-[0.16em] text-charcoal/55">
              Operations
            </span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-[0.74rem] text-charcoal/70 transition-colors hover:text-bronze disabled:opacity-45"
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
        <nav aria-label="Operations" className="border-b border-stone/70 bg-canvas">
          <div className="flex gap-1 overflow-x-auto px-3 py-2 no-scrollbar">
            {visibleLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-2 px-3 py-2 text-[0.76rem]",
                    active ? "bg-charcoal text-ivory" : "text-charcoal/70 hover:text-charcoal",
                  )}
                >
                  <Icon aria-hidden="true" className="size-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
