import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ButtonLink } from "@/components/ui/button";
import { getSessionUser } from "@/lib/server/auth";
import { getBookingForUser } from "@/lib/server/repository";
import { formatDateLong, formatUSD } from "@/lib/utils";

export const metadata: Metadata = { title: "Reservation details" };
export const instant = false;

const statusCopy: Record<string, string> = {
  pending:
    "Your reservation has been received and is waiting for the residence team to confirm it.",
  confirmed: "Your stay is confirmed. We look forward to welcoming you.",
  cancelled: "This reservation was cancelled. The dates are no longer held.",
  draft: "This reservation is still a draft.",
};

export default async function ReservationDetailPage({
  params,
}: PageProps<"/dashboard/reservations/[reference]">) {
  await connection();
  const user = await getSessionUser();
  if (!user) return null;

  const { reference } = await params;
  if (!/^KHR-[A-Z0-9]{4,20}$/.test(reference)) notFound();

  const booking = await getBookingForUser(user.id, reference);
  if (!booking) notFound();

  return (
    <section className="shell py-14">
      <div className="mb-8">
        <Link
          href="/dashboard/reservations"
          className="text-[0.78rem] text-charcoal/65 underline-offset-4 hover:text-bronze hover:underline"
        >
          ← All reservations
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-8 border border-stone/80 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-2 border-b border-stone/70 pb-6">
            <span className="eyebrow">Reference</span>
            <p className="font-display text-4xl tracking-[0.04em]">{booking.reference}</p>
            <p className="text-[0.85rem] capitalize text-charcoal/70">{booking.status}</p>
          </div>

          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {[
              { label: "Apartment", value: `${booking.room.name} · Level ${booking.room.floor}` },
              {
                label: "Guests",
                value: `${booking.guests} ${booking.guests === 1 ? "guest" : "guests"}`,
              },
              { label: "Arrival", value: formatDateLong(booking.checkIn) },
              { label: "Departure", value: formatDateLong(booking.checkOut) },
              { label: "Nights", value: String(booking.nights) },
              { label: "Lead guest", value: booking.guest.name },
              { label: "Email", value: booking.guest.email },
              { label: "Phone", value: booking.guest.phone },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1.5">
                <dt className="text-[0.66rem] uppercase tracking-[0.12em] text-charcoal/60">
                  {item.label}
                </dt>
                <dd className="text-[0.95rem]">{item.value}</dd>
              </div>
            ))}
          </dl>

          {booking.guest.requests ? (
            <div className="flex flex-col gap-2 border-t border-stone/70 pt-6">
              <h2 className="text-[0.66rem] uppercase tracking-[0.12em] text-charcoal/60">
                Requests
              </h2>
              <p className="text-[0.92rem] leading-relaxed text-charcoal/75">
                {booking.guest.requests}
              </p>
            </div>
          ) : null}

          <p className="border-t border-stone/70 pt-6 text-[0.85rem] leading-relaxed text-charcoal/70">
            {statusCopy[booking.status] ?? ""}
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 border border-stone/80 bg-canvas p-6">
            <h2 className="font-display text-2xl">Price breakdown</h2>
            <ul className="flex flex-col gap-3">
              {booking.price.lines.map((line) => (
                <li key={line.label} className="flex items-start justify-between gap-4">
                  <span className="flex flex-col">
                    <span className="text-[0.9rem]">{line.label}</span>
                    {line.detail ? (
                      <span className="text-[0.72rem] text-charcoal/60">{line.detail}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-[0.9rem]">{formatUSD(line.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-stone/70 pt-4">
              <span className="text-[0.78rem] uppercase tracking-[0.12em] text-charcoal/60">
                Total
              </span>
              <span className="font-display text-2xl">{formatUSD(booking.price.total)}</span>
            </div>
            <p className="text-[0.72rem] leading-relaxed text-charcoal/60">
              Calculated by the residence from the apartment and service rates. No payment was
              taken online.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/services" variant="secondary" size="sm">
              Add a guest service
            </ButtonLink>
            <ButtonLink href="/contact" variant="ghost" size="sm">
              Contact the team
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
