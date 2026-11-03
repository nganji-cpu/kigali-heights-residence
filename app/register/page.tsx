import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Create a Kigali Heights Residence account to save reservation drafts and manage your stays.",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      eyebrow="Your account"
      title="Keep your stay in one place."
      description="Create an account to save a reservation as you plan, hold your dates once confirmed, and return to your details at any time."
      image={{
        src: "/images/room-penthouse.jpg",
        alt: "Penthouse living space opening onto a terrace above Kigali",
      }}
      footer={
        <p>
          Already registered?{" "}
          <Link
            href="/login"
            className="text-charcoal underline-offset-4 hover:text-bronze hover:underline"
          >
            Sign in
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
      <RegisterForm />
    </AuthLayout>
  );
}
