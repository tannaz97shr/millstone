"use client";

import { OrderCall } from "@/modules/account/components/OrderCall";
import { useFocusOnShow } from "@/modules/account/hooks/useFocusOnShow";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { recurringContent } from "../content/recurringContent";
import type { RecurringProblem } from "../lib/recurringProblems";

/** A refused change on C11 or C12, focused when it appears so it's read straight away. */
export function RecurringProblemNotice({ problem }: { problem: (RecurringProblem & { key: number }) | null }) {
  const ref = useFocusOnShow<HTMLDivElement>(problem?.key ?? null);
  if (!problem) return null;
  return (
    <div ref={ref} className="focus-visible:shadow-none">
      <Notice tone="error">
        {problem.callPhone ? (
          <OrderCall before={problem.text} phone={problem.callPhone} after={recurringContent.detail.callAfter} />
        ) : (
          problem.text
        )}
      </Notice>
    </div>
  );
}
