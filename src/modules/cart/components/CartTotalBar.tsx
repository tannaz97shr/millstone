import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { BottomBar } from "@/shared/components/organisms/BottomBar/BottomBar";
import type { Cents } from "@/shared/domain";
import { routes } from "@/shared/routes";
import { formatCents } from "@/shared/utils/money";
import { cartContent } from "../content/cartContent";

const content = cartContent.bar;

export interface CartTotalBarProps {
  count: number;
  totalCents: Cents;
}

/** "Total · 5 items  $20.70" and Go to checkout. */
export function CartTotalBar({ count, totalCents }: CartTotalBarProps) {
  return (
    <BottomBar aria-label={content.label} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="body-strong">
          {content.total}
          <span className="font-normal text-ink-muted">{content.count(cartContent.itemCount(count))}</span>
        </span>
        <span aria-live="polite" className="price">
          {formatCents(totalCents)}
        </span>
      </div>
      <ButtonLink href={routes.checkout} variant="primary" block>
        {content.checkout}
      </ButtonLink>
    </BottomBar>
  );
}
