import type { Metadata } from "next";
import { BackLink } from "@/modules/account/components/BackLink";
import { CustomerSignInForm } from "@/modules/account/components/CustomerSignInForm";
import { accountContent } from "@/modules/account/content/accountContent";
import { signInPlace } from "@/modules/account/lib/signInContext";

export const metadata: Metadata = { title: accountContent.signIn.metadataTitle };

// C8 sign in. proxy.ts sends a customer who's already signed in straight on
// to returnTo; a staff session sees the form (it counts as signed out here).
export default async function CustomerSignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { returnTo } = await searchParams;
  const place = signInPlace(typeof returnTo === "string" ? returnTo : null);
  return (
    <div className="flex flex-col gap-4">
      <BackLink href={place.backHref}>{accountContent.back[place.context]}</BackLink>
      <CustomerSignInForm place={place} />
    </div>
  );
}
