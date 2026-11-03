import { connection } from "next/server";
import { listStaff } from "@/lib/server/accounts";
import { getSessionUser } from "@/lib/server/auth";
import { AdminPageHeader, StatusBadge } from "@/components/admin/admin-ui";
import { StaffForm } from "@/components/admin/staff-form";
import { StaffStatusControl } from "@/components/admin/staff-status-control";

export const instant = false;

export default async function AdminStaffPage() {
  await connection();
  const current = await getSessionUser();
  if (!current) return null;

  const staff = await listStaff();

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        eyebrow="Team"
        title="Team accounts."
        description="Staff can manage reservations, apartments, customers, payments and reports. Only admins can create accounts or change access. Roles cannot be changed here."
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="flex min-w-0 flex-col gap-4">
          <h2 className="font-display text-2xl">Team directory</h2>

          <div className="overflow-x-auto border border-stone/80 bg-white">
            <table className="w-full min-w-[46rem] border-collapse text-left text-[0.84rem]">
              <thead>
                <tr className="border-b border-stone/70 text-[0.64rem] uppercase tracking-[0.12em] text-charcoal/55">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Access</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id} className="border-b border-stone/50 last:border-b-0">
                    <td className="px-4 py-4">
                      <p>{member.fullName}</p>
                      <p className="text-[0.68rem] text-charcoal/55">
                        Joined {new Date(member.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-charcoal/75">{member.email}</p>
                      <p className="text-[0.7rem] text-charcoal/55">{member.phone}</p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={member.role} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={member.status} />
                    </td>
                    <td className="px-4 py-4">
                      {member.id === current.id ? (
                        <span className="text-[0.72rem] text-charcoal/55">Your account</span>
                      ) : (
                        <StaffStatusControl id={member.id} status={member.status} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="border border-stone/80 bg-white p-6">
          <h2 className="font-display text-2xl">Add a staff member</h2>
          <p className="mb-5 mt-1 text-[0.82rem] leading-relaxed text-charcoal/65">
            Share the temporary password securely. Staff can sign in immediately and change it from
            their profile.
          </p>
          <StaffForm />
        </aside>
      </div>
    </div>
  );
}
