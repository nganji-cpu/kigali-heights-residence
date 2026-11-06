import { connection } from "next/server";
import { requireAdminPage } from "@/lib/server/auth";

export const instant = false;

export default async function AdminStaffLayout({ children }: LayoutProps<"/admin/staff">) {
  await connection();
  await requireAdminPage(["admin"]);
  return <>{children}</>;
}
