import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { StatusMessage } from "@/components/ui/status-message";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Choose a new password for your Kigali Heights Residence account.",
  robots: { index: false, follow: false },
};

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

async function ResetPasswordContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const token = firstValue(params.token).trim();
  const portal = firstValue(params.portal) === "admin" ? "admin" : "customer";

  if (!token) {
    return (
      <StatusMessage tone="error" title="This link is incomplete">
        The reset link is missing its token.{" "}
        <Link
          href={portal === "admin" ? "/forgot-password?portal=admin" : "/forgot-password"}
          className="underline underline-offset-4 hover:text-bronze"
        >
          Request a new one
        </Link>
        .
      </StatusMessage>
    );
  }

  return <ResetPasswordForm token={token} portal={portal} />;
}

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <AuthLayout
      eyebrow="Account help"
      title="Choose a new password."
      description="Pick a password you have not used elsewhere. Resetting it signs you out of every other device."
      image={{
        src: "/images/room-executive.jpg",
        alt: "Executive apartment living room with warm evening light",
      }}
      footer={<p>Reset links work once and expire after 30 minutes.</p>}
    >
      <Suspense fallback={<div className="py-4 text-sm text-charcoal/60">Loading...</div>}>
        <ResetPasswordContent searchParams={searchParams} />
      </Suspense>
    </AuthLayout>
  );
}
