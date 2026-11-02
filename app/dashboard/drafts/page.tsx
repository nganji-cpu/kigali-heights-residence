import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/page-header";
import { DiscardDraftButton } from "@/components/dashboard/discard-draft-button";
import { getSessionUser } from "@/lib/server/auth";
import { listDraftsForUser } from "@/lib/server/drafts";
import { formatDateLong } from "@/lib/utils";

export const metadata: Metadata = { title: "Saved drafts" };
export const instant = false;

export default async function DraftsPage() {
  await connection();
  const user = await getSessionUser();
  if (!user) return null;

  const drafts = await listDraftsForUser(user.id);

  return (
    <>
      <PageHeader
        eyebrow="My account"
        title="Saved drafts."
        description="Resume an unfinished reservation. Drafts are re-checked against current prices and availability when you return."
      />

      <section className="shell py-14">
        {drafts.length === 0 ? (
          <div className="border border-stone/80 bg-white p-8 text-[0.95rem] text-charcoal/70">
            You have no saved drafts.{" "}
            <Link href="/book" className="text-charcoal underline-offset-4 hover:text-bronze hover:underline">
              Start a reservation
            </Link>
            .
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-stone/70 border border-stone/80 bg-white">
            {drafts.map((draft) => (
              <article key={draft.id} className="flex flex-wrap items-center justify-between gap-4 p-6">
                <div className="flex flex-col gap-2">
                  <p className="font-display text-xl">
                    {draft.roomName ?? "Apartment not selected"}
                  </p>
                  <p className="text-[0.88rem] text-charcoal/70">
                    {draft.checkIn && draft.checkOut
                      ? `${formatDateLong(draft.checkIn)} — ${formatDateLong(draft.checkOut)}`
                      : "Dates not set"}{" "}
                    · {draft.guests} {draft.guests === 1 ? "guest" : "guests"} · Step{" "}
                    {draft.currentStep + 1} of 4
                  </p>
                  <p className="text-[0.72rem] text-charcoal/60">
                    Last updated {new Date(draft.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/book?draft=${draft.id}`}
                    className="text-[0.78rem] text-charcoal underline-offset-4 hover:text-bronze hover:underline"
                  >
                    Resume draft
                  </Link>
                  <DiscardDraftButton draftId={draft.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
