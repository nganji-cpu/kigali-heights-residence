import type { Metadata } from "next";
import { connection } from "next/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requirePageRole } from "@/lib/server/auth";

export const metadata: Metadata = {
  title: "Operations portal",
  description: "Manage reservations, apartments, customers and payments.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await connection();
  const user = await requirePageRole(["admin", "staff"]);

  return (
    <div className="min-h-screen bg-ivory lg:flex">
      <AdminSidebar user={user} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[92rem] px-5 py-8 sm:px-8 sm:py-10">{children}</div>
      </main>
    </div>
  );
}
