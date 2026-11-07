import Link from "next/link";
import { connection } from "next/server";
import { getAdminStats, listAdminReservations } from "@/lib/server/admin";
import { requireAdminPage } from "@/lib/server/auth";
import { AdminPageHeader, StatCard, StatusBadge } from "@/components/admin/admin-ui";
import { formatDateLong, formatUSD } from "@/lib/utils";

export const instant = false;

export default async function AdminOverviewPage() {
  await connection();
  const user = await requireAdminPage();

  const [stats, reservations] = await Promise.all([
    getAdminStats(),
    listAdminReservations({ limit: 8 }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        eyebrow="Overview"
        title={`Good to see you, ${user.fullName.split(" ")[0]}.`}
        description="Live figures from the reservation database. Confirmed and pending stays hold their dates; drafts never do."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Reservations"
          value={stats.totalReservations}
          hint={`${stats.pendingReservations} awaiting confirmation`}
        />
        <StatCard
          label="Confirmed"
          value={stats.confirmedReservations}
          hint={`${stats.cancelledReservations} cancelled`}
        />
        <StatCard
          label="Apartments"
          value={`${stats.availableRooms}/${stats.availableRooms + stats.occupiedRooms}`}
          hint={`${stats.occupiedRooms} marked occupied`}
        />
        <StatCard
          label="Registered customers"
          value={stats.registeredCustomers}
          hint="Customer accounts"
        />
        <StatCard label="Payments received" value={formatUSD(stats.revenue)} hint="Completed payments" />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Latest reservations</h2>
          <Link
            href="/admin/reservations"
            className="text-[0.76rem] text-charcoal/65 underline-offset-4 hover:text-bronze hover:underline"
          >
            View all
          </Link>
        </div>

        {reservations.length === 0 ? (
          <div className="border border-stone/80 bg-white p-6 text-[0.9rem] text-charcoal/65">
            No reservations have been recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto border border-stone/80 bg-white">
            <table className="w-full min-w-[44rem] border-collapse text-left text-[0.85rem]">
              <thead>
                <tr className="border-b border-stone/70 text-[0.64rem] uppercase tracking-[0.12em] text-charcoal/55">
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Guest</th>
                  <th className="px-4 py-3 font-medium">Apartment</th>
                  <th className="px-4 py-3 font-medium">Arrival</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.reference} className="border-b border-stone/50 last:border-b-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/reservations?search=${reservation.reference}`}
                        className="text-charcoal underline-offset-4 hover:text-bronze hover:underline"
                      >
                        {reservation.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{reservation.guestName}</td>
                    <td className="px-4 py-3 text-charcoal/70">{reservation.roomName}</td>
                    <td className="px-4 py-3 text-charcoal/70">{formatDateLong(reservation.checkIn)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={reservation.status} />
                    </td>
                    <td className="px-4 py-3 text-right">{formatUSD(reservation.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
