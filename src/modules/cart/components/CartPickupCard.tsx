import type { BranchSummary } from "@/modules/branches/types/branchSummary";
import { Button } from "@/shared/components/atoms/Button/Button";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { Card } from "@/shared/components/atoms/Card/Card";
import type { IsoDate } from "@/shared/domain";
import { routes } from "@/shared/routes";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { cartContent } from "../content/cartContent";

const content = cartContent.pickup;

export interface CartPickupCardProps {
  branch: BranchSummary;
  date: IsoDate;
  onChangeBranch: () => void;
}

function PickupRow({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 flex-col">
        <span className="caption text-ink-muted">{label}</span>
        <span className="branch-name">{value}</span>
      </div>
      {children}
    </div>
  );
}

/** Branch with Change (the sheet) and pickup day with Change (back to the menu, keeping the cart). */
export function CartPickupCard({ branch, date, onChangeBranch }: CartPickupCardProps) {
  return (
    <Card as="section" padding="none" aria-label={content.regionLabel} className="flex flex-col">
      <PickupRow label={content.from} value={branch.name}>
        <Button onClick={onChangeBranch} aria-label={content.changeBranchLabel(branch.name)}>
          {content.change}
        </Button>
      </PickupRow>
      <hr className="mx-4 border-line" />
      <PickupRow label={content.day} value={formatPickupDay(date)}>
        <ButtonLink href={routes.menu(branch.id, date)} aria-label={content.changeDayLabel}>
          {content.change}
        </ButtonLink>
      </PickupRow>
    </Card>
  );
}
