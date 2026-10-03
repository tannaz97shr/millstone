import { cartContent } from "@/modules/cart/content/cartContent";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { BottomBar } from "@/shared/components/organisms/BottomBar/BottomBar";
import type { Cents, IsoDate } from "@/shared/domain";
import { routes } from "@/shared/routes";
import { formatCents } from "@/shared/utils/money";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { menuContent } from "../content/menuContent";

const content = menuContent.orderBar;

export interface OrderBarProps {
  count: number;
  totalCents: Cents;
  date: IsoDate;
}

/** The sticky "2 items · Pickup Wed 30 Sep · $15.10 · View cart" bar. */
export function OrderBar({ count, totalCents, date }: OrderBarProps) {
  return (
    <BottomBar tone="warm" aria-label={content.label}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="caption">
            {content.summary(cartContent.itemCount(count), formatPickupDay(date))}
          </span>
          <span aria-live="polite" className="price">
            {formatCents(totalCents)}
          </span>
        </div>
        <ButtonLink href={routes.cart} variant="primary">
          {content.viewCart}
        </ButtonLink>
      </div>
    </BottomBar>
  );
}
