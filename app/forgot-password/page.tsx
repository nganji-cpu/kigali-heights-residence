import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a link to reset your Kigali Heights Residence password.",
  robots: { index: false, follow: false },
};

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

async function ForgotPasswordContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const portal = firstValue(params.portal) === "admin" ? "admin" : "customer";
  return <ForgotPasswordForm portal={portal} />;
}

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <AuthLayout
      eyebrow="Account help"
      title="Reset your password."
      description="Enter the email on your account and we will send a single-use link to choose a new password."
      image={{
        src: "/images/room-executive.jpg",
        alt: "Executive apartment living room with warm evening light",
      }}
      footer={<p>For your security, the same message is shown whether or not an account exists.</p>}
    >
      <Suspense fallback={<div className="py-4 text-sm text-charcoal/60">Loading...</div>}>
        <ForgotPasswordContent searchParams={searchParams} />
      </Suspense>
    </AuthLayout>
  );
}
