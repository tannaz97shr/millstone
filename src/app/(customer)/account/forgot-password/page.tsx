import type { Metadata } from "next";
import { BackLink } from "@/modules/account/components/BackLink";
import { accountContent } from "@/modules/account/content/accountContent";
import { signInPlace } from "@/modules/account/lib/signInContext";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { routes } from "@/shared/routes";

const content = accountContent.forgot;

export const metadata: Metadata = { title: content.metadataTitle };

// Undesigned: the site sends no email, so there's no reset link yet (the
// designed reset screens wait for an email provider; see specs/known-issues.md).
// "Back to sign in" keeps where sign-in was going to return to.
export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { returnTo } = await searchParams;
  const place = signInPlace(typeof returnTo === "string" ? returnTo : null);
  return (
    <div className="flex flex-col gap-4">
      <BackLink href={routes.account.signIn(place.returnTo)}>{content.backToSignIn}</BackLink>
      <div className="flex flex-col gap-5">
        <h1 className="page-title">{content.title}</h1>
        <p>{content.body}</p>
        <ButtonLink href={routes.home} variant="primary" block>
          {content.startOrder}
        </ButtonLink>
      </div>
    </div>
  );
}
