"use client";

import { Notice } from "@/shared/components/molecules/Notice/Notice";
import type { AvailabilityMessage } from "../hooks/useAvailabilityActions";

export const AVAILABILITY_STATUS_ID = "availability-status";

const ORDER_NUMBER = /(MS-\d+)/;

/** Order numbers are read aloud: never split "MS-1044" across two lines. */
function keepOrderNumbersWhole(text: string): React.ReactNode {
  return text.split(ORDER_NUMBER).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export interface AvailabilityStatusBarProps {
  message: AvailabilityMessage | null;
  onDismissMessage: () => void;
  /** "13 products · 12 on the menu · 1 off", or "Loading Fitzroy…". */
  summary: string;
}

/**
 * The line between the header and the list (A4): the last action's message,
 * else the counts. Warnings and errors stay until OK or the next action. It
 * sticks under the admin header, so a message about a row far down the list
 * is still in view (the canvas keeps it in a fixed band).
 */
export function AvailabilityStatusBar({ message, onDismissMessage, summary }: AvailabilityStatusBarProps) {
  return (
    <div data-sticky-status className="sticky top-20 z-10 flex min-h-16 items-center bg-flour px-8 py-3">
      {message ? (
        <Notice
          tone={message.tone}
          className="py-1.5! pl-3!"
          onDismiss={message.tone === "success" ? undefined : onDismissMessage}
        >
          <span id={AVAILABILITY_STATUS_ID} tabIndex={-1} className="font-bold focus-visible:shadow-none">
            {keepOrderNumbersWhole(message.text)}
          </span>
        </Notice>
      ) : (
        <p
          id={AVAILABILITY_STATUS_ID}
          tabIndex={-1}
          role="status"
          className="text-[18px]/[24px] font-bold focus-visible:shadow-none"
        >
          {summary}
        </p>
      )}
    </div>
  );
}
