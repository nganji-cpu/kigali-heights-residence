import { connection } from "next/server";
import { getReportSummary } from "@/lib/server/admin";
import { requireAdminPage } from "@/lib/server/auth";
import { AdminPageHeader, EmptyState, StatCard, StatusBadge } from "@/components/admin/admin-ui";
import { formatUSD } from "@/lib/utils";

export const instant = false;

function monthLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return period;
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

export default async function AdminReportsPage() {
  await connection();
  await requireAdminPage();
  const report = await getReportSummary();

  const maxReservations = Math.max(1, ...report.periodRows.map((row) => row.reservations));
  const maxRoomRevenue = Math.max(1, ...report.roomRows.map((row) => row.revenue));
  const totalReservations = report.statusRows.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        eyebrow="Reports"
        title="Performance."
        description="Reservation volume, payment revenue and apartment performance. Revenue counts completed payments only."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Completed revenue" value={formatUSD(report.revenue)} />
        <StatCard label="Reservations tracked" value={totalReservations} />
        <StatCard
          label="Confirmed"
          value={report.statusRows.find((row) => row.status === "confirmed")?.count ?? 0}
        />
        <StatCard
          label="Pending"
          value={report.statusRows.find((row) => row.status === "pending")?.count ?? 0}
        />
      </section>

      <section className="flex flex-col gap-4 border border-stone/80 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Reservations by month</h2>
          <p className="text-[0.72rem] text-charcoal/55">Last six months</p>
        </div>
        {report.periodRows.every((row) => row.reservations === 0) ? (
          <EmptyState>No reservations in the last six months.</EmptyState>
        ) : (
          <div className="flex items-end gap-4 overflow-x-auto pt-2">
            {report.periodRows.map((row) => (
              <div key={row.period} className="flex min-w-16 flex-1 flex-col items-center gap-2">
                <span className="text-[0.72rem] text-charcoal/60">{row.reservations}</span>
                <div
                  className="w-full max-w-16 bg-bronze/70"
                  style={{
                    height: `${Math.max(6, (row.reservations / maxReservations) * 140)}px`,
                  }}
                  aria-label={`${monthLabel(row.period)}: ${row.reservations} reservations`}
                />
                <span className="text-[0.68rem] text-charcoal/60">{monthLabel(row.period)}</span>
                <span className="text-[0.64rem] text-charcoal/45">{formatUSD(row.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4 border border-stone/80 bg-white p-6">
          <h2 className="font-display text-2xl">Reservation status</h2>
          {report.statusRows.length === 0 ? (
            <EmptyState>No reservations recorded.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-3">
              {report.statusRows.map((row) => (
                <li key={row.status} className="flex items-center justify-between gap-4">
                  <StatusBadge status={row.status} />
                  <span className="text-[0.9rem]">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-4 border border-stone/80 bg-white p-6">
          <h2 className="font-display text-2xl">Top customers</h2>
          {report.customerRows.length === 0 ? (
            <EmptyState>No customer reservations yet.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-3">
              {report.customerRows.map((row) => (
                <li key={row.label} className="flex items-center justify-between gap-4 text-[0.88rem]">
                  <span>{row.label}</span>
                  <span className="text-charcoal/70">{formatUSD(row.value)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-4 border border-stone/80 bg-white p-6">
        <h2 className="font-display text-2xl">Apartment performance</h2>
        {report.roomRows.length === 0 ? (
          <EmptyState>No apartments recorded.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-4">
            {report.roomRows.map((row) => (
              <li key={row.roomName} className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[0.84rem]">
                  <span>{row.roomName}</span>
                  <span className="text-charcoal/60">
                    {row.reservations} reservations · {formatUSD(row.revenue)}
                  </span>
                </div>
                <div className="h-2 w-full bg-stone/30">
                  <div
                    className="h-full bg-charcoal/70"
                    style={{ width: `${Math.max(2, (row.revenue / maxRoomRevenue) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
