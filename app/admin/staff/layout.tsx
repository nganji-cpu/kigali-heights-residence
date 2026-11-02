import { connection } from "next/server";
import { requirePageRole } from "@/lib/server/auth";

export const instant = false;

export default async function AdminStaffLayout({ children }: LayoutProps<"/admin/staff">) {
  await connection();
  await requirePageRole(["admin"]);
  return <>{children}</>;
}
