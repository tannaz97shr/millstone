"use client";

import { AdminHeader, type AdminNavItem } from "@/shared/components/organisms/AdminHeader/AdminHeader";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import type { StaffRole } from "@/shared/domain";
import { routes } from "@/shared/routes";
import { adminShellContent as content } from "../content/adminShellContent";
import { useSignOut } from "../hooks/useSignOut";

export interface StaffHeaderProps {
  role: StaffRole;
  /** The staff member's branch; null for the owner. */
  branchName: string | null;
}

/** The admin header for whoever is signed in. Products is in the nav for the owner only. */
export function StaffHeader({ role, branchName }: StaffHeaderProps) {
  const { signOut, signingOut, failed, dismissFailure } = useSignOut();
  const owner = role === "owner";
  const nav: AdminNavItem[] = [
    { href: routes.admin.home, label: content.nav.orders },
    { href: routes.admin.availability(), label: content.nav.availability },
    ...(owner ? [{ href: routes.admin.products, label: content.nav.products }] : []),
  ];

  return (
    <>
      <AdminHeader
        homeHref={routes.admin.home}
        navLabel={content.nav.label}
        nav={nav}
        branchLabel={owner || !branchName ? content.user.allBranches : branchName}
        userLabel={owner || !branchName ? content.user.owner : content.user.staff(branchName)}
        signOutLabel={content.signOut}
        onSignOut={() => void signOut()}
        signingOut={signingOut}
      />
      {failed && (
        <div className="px-8 pt-4">
          <Notice tone="error" onDismiss={dismissFailure}>
            {content.signOutFailed}
          </Notice>
        </div>
      )}
    </>
  );
}
