import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { getSessionUser } from "@/lib/server/auth";
import { listBookingsForUser } from "@/lib/server/repository";
import { formatDateLong, formatUSD } from "@/lib/utils";

export const metadata: Metadata = { title: "My reservations" };
export const instant = false;

export default async function ReservationsPage() {
  await connection();
  const user = await getSessionUser();
  if (!user) return null;

  const bookings = await listBookingsForUser(user.id, 100);

  return (
    <>
      <PageHeader
        eyebrow="My account"
        title="Your reservations."
        description="Every reservation linked to your account, newest first. Reserved dates are held once the residence team confirms them."
      >
        <ButtonLink href="/book" size="sm">
          New reservation
        </ButtonLink>
      </PageHeader>

      <section className="shell py-14">
        {bookings.length === 0 ? (
          <div className="border border-stone/80 bg-white p-8 text-[0.95rem] text-charcoal/70">
            No reservations yet.{" "}
            <Link href="/book" className="text-charcoal underline-offset-4 hover:text-bronze hover:underline">
              Reserve your first stay
            </Link>
            .
          </div>
        ) : (
          <div className="overflow-x-auto border border-stone/80 bg-white">
            <table className="w-full min-w-[46rem] border-collapse text-left text-[0.88rem]">
              <thead>
                <tr className="border-b border-stone/70 text-[0.68rem] uppercase tracking-[0.12em] text-charcoal/60">
                  <th className="px-5 py-4 font-medium">Reference</th>
                  <th className="px-5 py-4 font-medium">Apartment</th>
                  <th className="px-5 py-4 font-medium">Dates</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 text-right font-medium">Total</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.reference} className="border-b border-stone/50 last:border-b-0">
                    <td className="px-5 py-4 text-charcoal/70">{booking.reference}</td>
                    <td className="px-5 py-4">{booking.room.name}</td>
                    <td className="px-5 py-4 text-charcoal/70">
                      {formatDateLong(booking.checkIn)} — {formatDateLong(booking.checkOut)}
                    </td>
                    <td className="px-5 py-4 capitalize">{booking.status}</td>
                    <td className="px-5 py-4 text-right">{formatUSD(booking.price.total)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/dashboard/reservations/${booking.reference}`}
                        className="text-charcoal underline-offset-4 hover:text-bronze hover:underline"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
