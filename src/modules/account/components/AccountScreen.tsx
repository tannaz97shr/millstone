"use client";

import { Button } from "@/shared/components/atoms/Button/Button";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { LoadingMessage } from "@/shared/components/molecules/LoadState/LoadState";
import { routes } from "@/shared/routes";
import { accountContent } from "../content/accountContent";
import { useAccountSession } from "../hooks/useAccountSession";
import { useSignOut } from "../hooks/useSignOut";
import { AccountOrders } from "./AccountOrders";
import { BackLink } from "./BackLink";
import { ProfileSection } from "./ProfileSection";

const content = accountContent.myAccount;

/**
 * C9 My account (AccountArea.dc.html, MyAccountNew.dc.html): details, the
 * account's orders and Sign out. The Recurring orders section comes with
 * recurring orders (next step).
 */
export function AccountScreen() {
  const session = useAccountSession();
  const { signOut, failed, pending } = useSignOut();
  const profile = session.data?.customer;

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={routes.home}>{accountContent.back.home}</BackLink>
      <div className="flex flex-col gap-1">
        <h1 className="page-title">{content.title}</h1>
        {profile && <p className="text-ink-muted">{content.signedInAs(profile.email)}</p>}
      </div>
      {profile ? <ProfileSection profile={profile} /> : <LoadingMessage>{content.loading}</LoadingMessage>}
      <AccountOrders />
      <div className="flex flex-col items-start gap-3">
        {failed && <Notice tone="error">{content.signOutFailed}</Notice>}
        <Button variant="quiet" className="-ml-2" onClick={() => void signOut()} aria-disabled={pending || undefined}>
          {pending ? content.signingOut : content.signOut}
        </Button>
      </div>
    </div>
  );
}
