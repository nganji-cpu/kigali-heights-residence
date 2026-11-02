import type { Metadata } from "next";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { PasswordForm } from "@/components/dashboard/password-form";
import { getSessionUser } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Profile" };
export const instant = false;

export default async function ProfilePage() {
  await connection();
  const user = await getSessionUser();
  if (!user) return null;

  return (
    <>
      <PageHeader
        eyebrow="My account"
        title="Profile & security."
        description="Keep your contact details current and update the password used to sign in."
      />

      <section className="shell grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
        <div className="flex flex-col gap-6 border border-stone/80 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-1.5">
            <h2 className="font-display text-2xl">Contact details</h2>
            <p className="text-[0.88rem] text-charcoal/70">
              We use these details for reservation updates.
            </p>
          </div>
          <ProfileForm user={user} />
        </div>

        <div className="flex flex-col gap-6 border border-stone/80 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-1.5">
            <h2 className="font-display text-2xl">Password</h2>
            <p className="text-[0.88rem] text-charcoal/70">
              Changing your password signs out every other session.
            </p>
          </div>
          <PasswordForm />
        </div>
      </section>
    </>
  );
}
