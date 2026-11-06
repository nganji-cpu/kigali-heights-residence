import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { Wordmark } from "@/components/layout/wordmark";

export const metadata: Metadata = {
  title: "Administrator Sign In | Kigali Heights Residence",
  description: "Secure administrator access to the operations management system.",
  robots: { index: false, follow: false },
};

export const instant = false;

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  await connection();
  const user = await getSessionUser();
  if (user && (user.role === "admin" || user.role === "staff")) {
    redirect("/admin");
  }

  const params = await searchParams;
  const nextPath = firstValue(params.next) || "/admin";

  return (
    <div className="flex min-h-screen flex-col justify-center bg-ivory py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
          <Wordmark />
        </div>
        <p className="eyebrow text-charcoal/60 mb-2">Operations Access</p>
        <h1 className="font-display text-3xl sm:text-4xl text-charcoal">
          Administration Portal
        </h1>
        <p className="mt-2 text-sm text-charcoal/65">
          Sign in with your verified management credentials.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="border border-stone/80 bg-white p-8 shadow-sm">
          <AdminLoginForm nextPath={nextPath} />
        </div>

        <p className="mt-6 text-center text-xs text-charcoal/50">
          Authorized personnel only. All access attempts are rate-limited and logged.
        </p>
      </div>
    </div>
  );
}
