import { connection } from "next/server";
import { listAdminReservations, listPayments } from "@/lib/server/admin";
import { AdminPageHeader, EmptyState, StatusBadge } from "@/components/admin/admin-ui";
import { PaymentForm } from "@/components/admin/payment-form";
import { formatUSD } from "@/lib/utils";

export const instant = false;

export default async function AdminPaymentsPage() {
  await connection();
  const [payments, reservations] = await Promise.all([
    listPayments(100),
    listAdminReservations({ limit: 100 }),
  ]);

  const references = reservations.map((reservation) => reservation.reference);
  const completedTotal = payments
    .filter((payment) => payment.status === "completed")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        eyebrow="Payments"
        title="Payments."
        description="Record payments received outside the site. The server refuses a completed payment that exceeds the booking balance."
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="flex min-w-0 flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Recent payments</h2>
            <p className="text-[0.76rem] text-charcoal/60">
              {formatUSD(completedTotal)} completed in this list
            </p>
          </div>

          {payments.length === 0 ? (
            <EmptyState>No payments have been recorded yet.</EmptyState>
          ) : (
            <div className="overflow-x-auto border border-stone/80 bg-white">
              <table className="w-full min-w-[44rem] border-collapse text-left text-[0.84rem]">
                <thead>
                  <tr className="border-b border-stone/70 text-[0.64rem] uppercase tracking-[0.12em] text-charcoal/55">
                    <th className="px-4 py-3 font-medium">Booking</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Recorded</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-stone/50 last:border-b-0">
                      <td className="px-4 py-3">{payment.bookingReference}</td>
                      <td className="px-4 py-3 capitalize text-charcoal/75">
                        {payment.method.replace("_", " ")}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={payment.status} />
                      </td>
                      <td className="px-4 py-3 text-[0.72rem] text-charcoal/60">
                        {payment.transactionReference || "—"}
                      </td>
                      <td className="px-4 py-3 text-[0.72rem] text-charcoal/60">
                        {payment.recordedByName ?? "System"}
                        <br />
                        {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">{formatUSD(payment.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="border border-stone/80 bg-white p-6">
          <h2 className="font-display text-2xl">Record a payment</h2>
          <p className="mb-5 mt-1 text-[0.82rem] text-charcoal/65">
            Use the booking reference from the reservations list.
          </p>
          <PaymentForm references={references} />
        </aside>
      </div>
    </div>
  );
}
