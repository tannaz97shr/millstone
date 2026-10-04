"use client";

import { useCallback, useEffect, useState } from "react";
import type { OrderId } from "@/shared/domain";
import type { AdminOrderRow } from "../types/adminOrder";

/** Marks each row's wrapper, so focus can be traced back to its order. */
export const ORDER_ROW_ATTRIBUTE = "data-order-row";

/**
 * Rows someone is touching stay put (AC-A4, design: "swaps rows in place").
 * The row with focus in it and the row open in the panel are held: if a
 * refresh or this tablet's own action takes one off the list, the screen
 * keeps it in its slot (see lib/heldRows) until focus moves to something
 * else or the panel closes. The list's own order never moves an existing row.
 */
export function useStableRows() {
  // Last known data of each held row, for when it's gone from the server's list.
  const [focusHeld, setFocusHeld] = useState<AdminOrderRow | null>(null);
  const [panelHeld, setPanelHeld] = useState<AdminOrderRow | null>(null);

  // Focus moving anywhere outside the held row lets it go. A document listener,
  // because a focused button that unmounts (Ready, once the order is ready)
  // never fires blur.
  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const rowId = target?.closest(`[${ORDER_ROW_ATTRIBUTE}]`)?.getAttribute(ORDER_ROW_ATTRIBUTE) ?? null;
      setFocusHeld((current) => (current && current.id !== rowId ? null : current));
    };
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, []);

  /** Focus entered this row. */
  const holdFocused = useCallback((row: AdminOrderRow) => {
    setFocusHeld((current) => (current?.id === row.id ? current : row));
  }, []);

  const holdOpen = useCallback((row: AdminOrderRow) => setPanelHeld(row), []);
  const releaseOpen = useCallback((orderId: OrderId) => {
    setPanelHeld((current) => (current?.id === orderId ? null : current));
  }, []);

  return { focusHeld, panelHeld, holdFocused, holdOpen, releaseOpen };
}
