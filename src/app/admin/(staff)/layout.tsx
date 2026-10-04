import { AdminSessionGuard } from "@/modules/admin-shell/components/AdminSessionGuard";
import { StaffHeader } from "@/modules/admin-shell/components/StaffHeader";
import { getStaffPageSession } from "@/modules/auth/lib/staffPageSession";
import { getBranchOrThrow } from "@/modules/branches/lib/listBranches";

// Every signed-in admin page. proxy.ts has already sent anyone without a
// session to A1; this re-checks the account (it may have been removed) and
// shows who is signed in. API routes still check for themselves.
export default async function StaffLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const actor = await getStaffPageSession();
  const branch = actor.branchId ? await getBranchOrThrow(actor.branchId) : null;
  return (
    <>
      <StaffHeader role={actor.role} branchName={branch?.name ?? null} />
      <AdminSessionGuard />
      {/* Each page sets its own padding: A2's filter band runs edge to edge. */}
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
