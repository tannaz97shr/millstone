"use client";

import { Notice } from "../Notice/Notice";

export interface StatusMessage {
  tone: "success" | "warning" | "error";
  text: string;
}

export interface StatusLineProps {
  /** On the message or the summary, so a screen can move focus to it. */
  id: string;
  message: StatusMessage | null;
  onDismissMessage: () => void;
  /** Shown when there's no message, e.g. "13 products · 12 on the menu". */
  summary: string;
}

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

/**
 * The admin line under a page's top band (A4, A5): the last action's message,
 * else a summary. Warnings and errors stay until OK or the next action. It
 * sticks under the admin header, so a message about a row far down the list
 * is still in view (the canvases keep it in a fixed band).
 */
export function StatusLine({ id, message, onDismissMessage, summary }: StatusLineProps) {
  return (
    <div data-sticky-status className="sticky top-20 z-10 flex min-h-16 items-center bg-flour px-8 py-3">
      {message ? (
        <Notice
          tone={message.tone}
          className="py-1.5! pl-3!"
          onDismiss={message.tone === "success" ? undefined : onDismissMessage}
        >
          <span id={id} tabIndex={-1} className="font-bold focus-visible:shadow-none">
            {keepOrderNumbersWhole(message.text)}
          </span>
        </Notice>
      ) : (
        <p id={id} tabIndex={-1} role="status" className="text-[18px]/[24px] font-bold focus-visible:shadow-none">
          {summary}
        </p>
      )}
    </div>
  );
}
