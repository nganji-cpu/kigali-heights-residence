"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/reservations", label: "Reservations" },
  { href: "/dashboard/drafts", label: "Saved drafts" },
  { href: "/dashboard/profile", label: "Profile" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="border-b border-stone/70 bg-canvas">
      <div className="shell flex gap-6 overflow-x-auto no-scrollbar">
        {links.map((link) => {
          const active =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 border-b-2 py-4 text-[0.8rem] transition-colors",
                active
                  ? "border-bronze text-charcoal"
                  : "border-transparent text-charcoal/65 hover:text-charcoal",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
