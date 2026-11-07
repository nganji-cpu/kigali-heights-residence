import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to manage your reservations at Kigali Heights Residence.",
};

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function LoginPageContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const nextPath = firstValue(params.next);

  return <LoginForm nextPath={nextPath} />;
}

export default function LoginPage({ searchParams }: PageProps) {
  return (
    <AuthLayout
      eyebrow="Your account"
      title="Welcome back."
      description="Sign in to hold a reservation, pick up a saved draft or review your upcoming stay."
      image={{
        src: "/images/room-executive.jpg",
        alt: "Executive apartment living room with warm evening light",
      }}
      footer={
        <p>
          Planning a first stay?{" "}
          <Link
            href="/register"
            className="text-charcoal underline-offset-4 hover:text-bronze hover:underline"
          >
            Create an account
          </Link>{" "}
          or{" "}
          <Link
            href="/rooms"
            className="text-charcoal underline-offset-4 hover:text-bronze hover:underline"
          >
            browse the apartments
          </Link>
          .
        </p>
      }
    >
      <Suspense fallback={<div className="py-4 text-sm text-charcoal/60">Loading sign in...</div>}>
        <LoginPageContent searchParams={searchParams} />
      </Suspense>
    </AuthLayout>
  );
}