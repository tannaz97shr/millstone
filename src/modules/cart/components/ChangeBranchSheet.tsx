"use client";

import type { BranchSummary } from "@/modules/branches/types/branchSummary";
import { Button } from "@/shared/components/atoms/Button/Button";
import { ChoiceGroup } from "@/shared/components/molecules/ChoiceGroup/ChoiceGroup";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { Sheet } from "@/shared/components/organisms/Sheet/Sheet";
import { cartContent } from "../content/cartContent";

const content = cartContent.changeBranch;

export interface ChangeBranchSheetProps {
  open: boolean;
  branches: readonly BranchSummary[];
  current: BranchSummary;
  pending: BranchSummary;
  checking: boolean;
  failed: boolean;
  onChoose: (branchId: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/** CartBranchSheet: pick another branch. "Keep {current}" until another one is picked. */
export function ChangeBranchSheet({
  open,
  branches,
  current,
  pending,
  checking,
  failed,
  onChoose,
  onConfirm,
  onCancel,
}: ChangeBranchSheetProps) {
  const primaryLabel = checking
    ? content.checking(pending.name)
    : pending.id === current.id
      ? content.keep(current.name)
      : content.pickUpFrom(pending.name);

  return (
    <Sheet
      open={open}
      onClose={onCancel}
      title={content.title}
      actions={
        <>
          <Button variant="primary" block aria-busy={checking} onClick={onConfirm}>
            {primaryLabel}
          </Button>
          <Button block onClick={onCancel}>
            {content.cancel}
          </Button>
        </>
      }
    >
      <ChoiceGroup
        label={content.question}
        options={branches.map((b) => ({ value: b.id, label: b.name }))}
        value={pending.id}
        onChange={onChoose}
        name="cart-branch"
      />
      <p className="caption text-ink-muted">{content.note}</p>
      {failed && <Notice tone="error">{content.loadError(pending.name)}</Notice>}
    </Sheet>
  );
}
