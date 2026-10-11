import { BackLink } from "@/modules/account/components/BackLink";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { routes } from "@/shared/routes";
import { recurringContent } from "../content/recurringContent";

const content = recurringContent.notFound;

/** Not this account's, gone, or a malformed ID: one answer for all (undesigned). */
export function RecurringNotFound() {
  return (
    <div className="flex flex-col gap-6">
      <BackLink href={routes.account.recurring.list}>{recurringContent.detail.back}</BackLink>
      <div className="flex flex-col items-start gap-4">
        <h1 className="page-title">{content.title}</h1>
        <p>{content.body}</p>
        <ButtonLink href={routes.account.recurring.list} variant="secondary">
          {content.back}
        </ButtonLink>
      </div>
    </div>
  );
}
