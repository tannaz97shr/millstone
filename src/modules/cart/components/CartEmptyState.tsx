import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { Card } from "@/shared/components/atoms/Card/Card";
import type { IsoDate } from "@/shared/domain";
import { routes } from "@/shared/routes";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { cartContent } from "../content/cartContent";

const content = cartContent.empty;

export interface CartEmptyStateProps {
  /** The cart's branch and day; null when there's no cart (or its branch is gone). */
  place: { branchId: string; branchName: string; date: IsoDate } | null;
  titleId: string;
}

/** "Your order is empty", naming the branch and day, with a way back to the menu. */
export function CartEmptyState({ place, titleId }: CartEmptyStateProps) {
  return (
    <Card className="flex flex-col items-start gap-4 px-4 py-6">
      <h2 id={titleId} className="branch-name">
        {content.title}
      </h2>
      <p className="text-ink-muted">
        {place ? content.body(place.branchName, formatPickupDay(place.date)) : content.noBranchBody}
      </p>
      <ButtonLink href={place ? routes.menu(place.branchId, place.date) : routes.home} variant="primary">
        {place ? content.back : content.noBranchBack}
      </ButtonLink>
    </Card>
  );
}
