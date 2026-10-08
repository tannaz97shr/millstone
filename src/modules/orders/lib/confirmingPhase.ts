// C6's polling while an online order waits for the payment webhook. Pure, so
// every boundary is unit-tested; useOrderConfirmationQuery carries it out.

/** Confirming (every 2s) for the first 20s, then ConfirmingSlow (every 5s) for 5 minutes, then only on request. */
export const CONFIRMING_TIMING = {
  fastForMs: 20_000,
  fastEveryMs: 2_000,
  slowForMs: 5 * 60_000,
  slowEveryMs: 5_000,
} as const;

/**
 * fast: C6 Confirming. slow: ConfirmingSlow, still polling. stopped:
 * ConfirmingSlow without polling; Check again (or coming back to the tab) asks once more.
 */
export type ConfirmingPhase = "fast" | "slow" | "stopped";

export function confirmingPhase(elapsedMs: number): ConfirmingPhase {
  if (elapsedMs < CONFIRMING_TIMING.fastForMs) return "fast";
  if (elapsedMs < CONFIRMING_TIMING.fastForMs + CONFIRMING_TIMING.slowForMs) return "slow";
  return "stopped";
}

/** How often to ask in this phase; false stops polling. */
export function confirmingInterval(phase: ConfirmingPhase): number | false {
  if (phase === "fast") return CONFIRMING_TIMING.fastEveryMs;
  if (phase === "slow") return CONFIRMING_TIMING.slowEveryMs;
  return false;
}

/** Milliseconds until the phase changes, or null once polling has stopped. */
export function msUntilNextPhase(elapsedMs: number): number | null {
  const phase = confirmingPhase(elapsedMs);
  if (phase === "fast") return CONFIRMING_TIMING.fastForMs - elapsedMs;
  if (phase === "slow") return CONFIRMING_TIMING.fastForMs + CONFIRMING_TIMING.slowForMs - elapsedMs;
  return null;
}

/** Check again: the start time that gives a fresh 5 minutes of slow polling from `nowMs`. */
export function checkAgainStart(nowMs: number): number {
  return nowMs - CONFIRMING_TIMING.fastForMs;
}
