import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to manage your reservations at Kigali Heights Residence.",
};

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const nextPath = firstValue(params.next);

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
      <LoginForm nextPath={nextPath} />
    </AuthLayout>
  );
}
