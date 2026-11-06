import type { Metadata } from "next";
import { connection } from "next/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopNav } from "@/components/admin/admin-top-nav";
import { getSessionUser } from "@/lib/server/auth";

export const metadata: Metadata = {
  title: "Operations portal | Kigali Heights Residence",
  description: "Operations and hospitality administration portal.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await connection();
  const user = await getSessionUser();

  // For unauthenticated pages like /admin/login, render without admin sidebar/topnav
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-ivory lg:flex">
      <AdminSidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopNav user={user} />
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[92rem] px-5 py-8 sm:px-8 sm:py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
