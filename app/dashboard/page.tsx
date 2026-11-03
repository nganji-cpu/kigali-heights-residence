import Link from "next/link";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { getSessionUser } from "@/lib/server/auth";
import { listDraftsForUser } from "@/lib/server/drafts";
import { listBookingsForUser } from "@/lib/server/repository";
import { formatDateLong, formatUSD } from "@/lib/utils";

export const instant = false;

function statusLabel(status: string) {
  switch (status) {
    case "confirmed":
      return "Confirmed";
    case "pending":
      return "Pending confirmation";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export default async function DashboardPage() {
  await connection();
  const user = await getSessionUser();
  if (!user) return null;

  const [bookings, drafts] = await Promise.all([
    listBookingsForUser(user.id, 10),
    listDraftsForUser(user.id),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="My account"
        title={`Hello, ${user.fullName.split(" ")[0]}.`}
        description="Your reservations, saved drafts and account details in one place."
      />

      <section className="shell grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-12">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-3xl">Your reservations</h2>
              <ButtonLink href="/book" size="sm">
                New reservation
              </ButtonLink>
            </div>

            {bookings.length === 0 ? (
              <div className="border border-stone/80 bg-white p-6 text-[0.92rem] text-charcoal/70">
                You do not have any reservations yet.{" "}
                <Link href="/book" className="text-charcoal underline-offset-4 hover:text-bronze hover:underline">
                  Start a reservation
                </Link>
                .
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-stone/70 border border-stone/80 bg-white">
                {bookings.map((booking) => (
                  <article key={booking.reference} className="grid gap-4 p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-display text-xl">{booking.room.name}</p>
                        <span className="text-[0.7rem] uppercase tracking-[0.12em] text-charcoal/60">
                          {statusLabel(booking.status)}
                        </span>
                      </div>
                      <p className="text-[0.88rem] text-charcoal/70">
                        {formatDateLong(booking.checkIn)} — {formatDateLong(booking.checkOut)} ·{" "}
                        {booking.nights} {booking.nights === 1 ? "night" : "nights"} · {booking.guests}{" "}
                        {booking.guests === 1 ? "guest" : "guests"}
                      </p>
                      <p className="text-[0.78rem] text-charcoal/60">Reference {booking.reference}</p>
                    </div>
                    <div className="flex flex-col items-start gap-3 sm:items-end">
                      <p className="text-[0.95rem]">{formatUSD(booking.price.total)}</p>
                      <Link
                        href={`/dashboard/reservations/${booking.reference}`}
                        className="text-[0.78rem] text-charcoal underline-offset-4 hover:text-bronze hover:underline"
                      >
                        View details
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <h2 className="font-display text-3xl">Saved drafts</h2>
            {drafts.length === 0 ? (
              <div className="border border-stone/80 bg-white p-6 text-[0.92rem] text-charcoal/70">
                No unfinished reservations saved.
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
                        · {draft.guests} {draft.guests === 1 ? "guest" : "guests"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/book?draft=${draft.id}`}
                        className="text-[0.78rem] text-charcoal underline-offset-4 hover:text-bronze hover:underline"
                      >
                        Resume
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 border border-stone/80 bg-white p-6">
            <h3 className="font-display text-2xl">Profile</h3>
            <dl className="flex flex-col gap-3 text-[0.9rem]">
              <div>
                <dt className="text-[0.7rem] uppercase tracking-[0.12em] text-charcoal/60">Name</dt>
                <dd className="mt-1">{user.fullName}</dd>
              </div>
              <div>
                <dt className="text-[0.7rem] uppercase tracking-[0.12em] text-charcoal/60">Email</dt>
                <dd className="mt-1">{user.email}</dd>
              </div>
              <div>
                <dt className="text-[0.7rem] uppercase tracking-[0.12em] text-charcoal/60">Phone</dt>
                <dd className="mt-1">{user.phone}</dd>
              </div>
            </dl>
            <div className="flex flex-col gap-2 border-t border-stone/70 pt-4">
              <Link href="/dashboard/profile" className="text-[0.78rem] text-charcoal underline-offset-4 hover:text-bronze hover:underline">
                Edit profile or password
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
