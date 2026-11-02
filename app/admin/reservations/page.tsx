import { connection } from "next/server";
import { listAdminReservations } from "@/lib/server/admin";
import { AdminPageHeader, EmptyState, StatusBadge } from "@/components/admin/admin-ui";
import { ReservationStatusControl } from "@/components/admin/reservation-status-control";
import { formatDateLong, formatUSD } from "@/lib/utils";
import type { BookingStatus } from "@/types";

export const instant = false;

const statuses = ["all", "pending", "confirmed", "cancelled"] as const;

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function AdminReservationsPage({
  searchParams,
}: PageProps<"/admin/reservations">) {
  await connection();
  const params = await searchParams;
  const rawStatus = firstValue(params.status);
  const status = statuses.includes(rawStatus as (typeof statuses)[number])
    ? (rawStatus as BookingStatus | "all")
    : "all";
  const search = firstValue(params.search).trim().slice(0, 80);

  const reservations = await listAdminReservations({ status, search: search || undefined });

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        eyebrow="Reservations"
        title="Reservations."
        description="Pending reservations hold their dates. Confirm a stay once payment or approval is arranged; cancel to release the dates."
      />

      <form method="get" className="flex flex-wrap items-end gap-3 border border-stone/80 bg-white p-4">
        <label className="flex flex-col gap-1.5 text-[0.7rem] text-charcoal/65">
          Status
          <select
            name="status"
            defaultValue={status}
            className="border border-stone/90 bg-white px-3 py-2 text-[0.82rem] text-charcoal focus:border-bronze focus:outline-none"
          >
            {statuses.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All statuses" : option[0].toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[0.7rem] text-charcoal/65">
          Search
          <input
            name="search"
            defaultValue={search}
            placeholder="Reference, name or email"
            className="w-64 border border-stone/90 bg-white px-3 py-2 text-[0.82rem] text-charcoal focus:border-bronze focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="border border-charcoal bg-charcoal px-4 py-2.5 text-[0.78rem] text-ivory transition-colors hover:bg-ink"
        >
          Filter
        </button>
      </form>

      {reservations.length === 0 ? (
        <EmptyState>No reservations match those filters.</EmptyState>
      ) : (
        <div className="overflow-x-auto border border-stone/80 bg-white">
          <table className="w-full min-w-[64rem] border-collapse text-left text-[0.84rem]">
            <thead>
              <tr className="border-b border-stone/70 text-[0.64rem] uppercase tracking-[0.12em] text-charcoal/55">
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Apartment</th>
                <th className="px-4 py-3 font-medium">Stay</th>
                <th className="px-4 py-3 font-medium">Total / paid</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Update</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.reference} className="border-b border-stone/50 last:border-b-0">
                  <td className="px-4 py-4">
                    <p className="text-charcoal">{reservation.reference}</p>
                    <p className="text-[0.68rem] text-charcoal/55">
                      {new Date(reservation.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p>{reservation.guestName}</p>
                    <p className="text-[0.7rem] text-charcoal/55">{reservation.guestEmail}</p>
                    <p className="text-[0.7rem] text-charcoal/55">{reservation.guestPhone}</p>
                  </td>
                  <td className="px-4 py-4 text-charcoal/75">{reservation.roomName}</td>
                  <td className="px-4 py-4 text-charcoal/75">
                    <p>{formatDateLong(reservation.checkIn)}</p>
                    <p>{formatDateLong(reservation.checkOut)}</p>
                    <p className="text-[0.7rem] text-charcoal/55">
                      {reservation.nights} nights · {reservation.guests} guests
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p>{formatUSD(reservation.total)}</p>
                    <p className="text-[0.7rem] text-charcoal/55">
                      {formatUSD(reservation.paidTotal)} paid · {formatUSD(reservation.balance)} due
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={reservation.status} />
                  </td>
                  <td className="px-4 py-4">
                    <ReservationStatusControl
                      reference={reservation.reference}
                      status={reservation.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
