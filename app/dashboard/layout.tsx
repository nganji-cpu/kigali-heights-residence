import type { Metadata } from "next";
import { connection } from "next/server";
import { requirePageUser } from "@/lib/server/auth";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export const metadata: Metadata = {
  title: "My account",
  description: "Manage your reservations, saved drafts and profile details.",
};

export const instant = false;

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  await connection();
  await requirePageUser();
  return (
    <>
      <DashboardNav />
      {children}
    </>
  );
}
