import type { Metadata } from "next";
import { BackLink } from "@/modules/account/components/BackLink";
import { SignUpForm } from "@/modules/account/components/SignUpForm";
import { accountContent } from "@/modules/account/content/accountContent";
import { signInPlace } from "@/modules/account/lib/signInContext";

export const metadata: Metadata = { title: accountContent.signUp.metadataTitle };

// C8 create an account. Signed-in customers are sent on by proxy.ts.
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { returnTo } = await searchParams;
  const place = signInPlace(typeof returnTo === "string" ? returnTo : null);
  return (
    <div className="flex flex-col gap-4">
      <BackLink href={place.backHref}>{accountContent.back[place.context]}</BackLink>
      <SignUpForm place={place} />
    </div>
  );
}
