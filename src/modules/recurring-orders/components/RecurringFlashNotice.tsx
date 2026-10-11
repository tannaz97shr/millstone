"use client";

import { useFocusOnShow } from "@/modules/account/hooks/useFocusOnShow";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import type { Flash } from "../hooks/useRecurringActions";

/**
 * C12's message after a change ("Paused. We won't make any new orders…"): the
 * plain notice with a check and OK, as designed. It takes focus, since the
 * button that was pressed may be gone (Pause, End).
 */
export function RecurringFlashNotice({ flash, onDismiss }: { flash: Flash | null; onDismiss: () => void }) {
  const ref = useFocusOnShow<HTMLDivElement>(flash ? flash.key + 1 : null);
  if (!flash) return null;
  return (
    <div ref={ref} className="focus-visible:shadow-none">
      <Notice tone="neutral" icon="check" onDismiss={onDismiss}>
        {flash.message}
      </Notice>
    </div>
  );
}
