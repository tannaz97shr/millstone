import { BackLink } from "@/modules/account/components/BackLink";
import { accountContent } from "@/modules/account/content/accountContent";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { routes } from "@/shared/routes";

const content = accountContent.order;

// An order ID under /account/orders that isn't this account's, or doesn't
// exist: said in the account's terms (undesigned), still a 404.
export default function AccountOrderNotFound() {
  return (
    <div className="flex flex-col gap-6">
      <BackLink href={routes.account.home}>{content.back}</BackLink>
      <div className="flex flex-col items-start gap-4">
        <h1 className="page-title">{content.notFoundTitle}</h1>
        <p>{content.notFound}</p>
        <ButtonLink href={routes.account.home} variant="secondary">
          {content.backToAccount}
        </ButtonLink>
      </div>
    </div>
  );
}
