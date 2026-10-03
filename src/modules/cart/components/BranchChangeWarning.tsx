"use client";

import { Button } from "@/shared/components/atoms/Button/Button";
import { Dialog } from "@/shared/components/organisms/Dialog/Dialog";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { cartContent } from "../content/cartContent";
import type { RemovedLine } from "../lib/cartLogic";
import type { BranchChangeTarget } from "../hooks/useChangeBranch";

const content = cartContent.warning;

export interface BranchChangeWarningProps {
  open: boolean;
  /** The checked branch change; null while closed. */
  target: BranchChangeTarget | null;
  currentName: string;
  onConfirm: () => void;
  onKeep: () => void;
}

function LineList({ lines }: { lines: RemovedLine[] }) {
  return (
    <ul className="flex flex-col gap-1 rounded-md bg-flour-sunk px-4 py-3">
      {lines.map((line) => (
        <li key={line.id} className="body-strong tabular-nums">
          {content.line(line.quantity, line.name)}
        </li>
      ))}
    </ul>
  );
}

/**
 * CartBranchWarning: the new branch doesn't make some items (or has them sold
 * out that day). Nothing changes until "Change to …"; Keep, Escape and a tap
 * outside leave the order as it was.
 */
export function BranchChangeWarning({ open, target, currentName, onConfirm, onKeep }: BranchChangeWarningProps) {
  // Same element either way, so closing runs the dialog's focus restore.
  if (!target) return <Dialog open={false} onClose={onKeep} title="" role="alertdialog" />;

  const { branch, preview, date } = target;
  const { notMadeHere, soldOut } = preview;
  const soldOutSentence =
    soldOut.length > 0
      ? content.soldOut(branch.name, formatPickupDay(date), soldOut.length, notMadeHere.length > 0)
      : null;
  // The first sentence is the dialog's description; a second one sits with its list.
  const description = notMadeHere.length > 0 ? content.notMadeHere(branch.name, notMadeHere.length) : soldOutSentence;

  return (
    <Dialog
      open={open}
      role="alertdialog"
      onClose={onKeep}
      title={content.title(branch.name)}
      description={description}
      actions={
        <>
          <Button variant="primary" onClick={onConfirm}>
            {content.confirm(branch.name)}
          </Button>
          <Button onClick={onKeep}>{content.keep(currentName)}</Button>
        </>
      }
    >
      {notMadeHere.length > 0 ? (
        <>
          <LineList lines={notMadeHere} />
          {soldOutSentence && (
            <>
              <p>{soldOutSentence}</p>
              <LineList lines={soldOut} />
            </>
          )}
        </>
      ) : (
        <LineList lines={soldOut} />
      )}
    </Dialog>
  );
}
