import { connection } from "next/server";
import { listCustomers } from "@/lib/server/accounts";
import { AdminPageHeader, EmptyState, StatusBadge } from "@/components/admin/admin-ui";
import { formatUSD } from "@/lib/utils";

export const instant = false;

export default async function AdminCustomersPage() {
  await connection();
  const customers = await listCustomers();

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        eyebrow="Customers"
        title="Registered customers."
        description="Accounts created through the public registration form. Totals include pending and confirmed reservations."
      />

      {customers.length === 0 ? (
        <EmptyState>No customer accounts have been registered yet.</EmptyState>
      ) : (
        <div className="overflow-x-auto border border-stone/80 bg-white">
          <table className="w-full min-w-[50rem] border-collapse text-left text-[0.85rem]">
            <thead>
              <tr className="border-b border-stone/70 text-[0.64rem] uppercase tracking-[0.12em] text-charcoal/55">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Reservations</th>
                <th className="px-4 py-3 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-stone/50 last:border-b-0">
                  <td className="px-4 py-4">{customer.fullName}</td>
                  <td className="px-4 py-4">
                    <p className="text-charcoal/75">{customer.email}</p>
                    <p className="text-[0.7rem] text-charcoal/55">{customer.phone}</p>
                  </td>
                  <td className="px-4 py-4 text-charcoal/70">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={customer.status} />
                  </td>
                  <td className="px-4 py-4 text-right">{customer.reservationCount}</td>
                  <td className="px-4 py-4 text-right">{formatUSD(customer.totalSpent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
