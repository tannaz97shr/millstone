// Finding what can take keyboard focus. Used when focus has to be moved by
// hand: after a Notice is dismissed, and inside the Sheet and Dialog.

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function isReachable(element: HTMLElement): boolean {
  if (element.closest("[inert]")) return false;
  // A radio that isn't the checked one of its group is skipped by Tab.
  if (element instanceof HTMLInputElement && element.type === "radio" && !element.checked) {
    const group = element.form ?? document;
    const checked = group.querySelector(
      `input[type="radio"][name="${CSS.escape(element.name)}"]:checked`,
    );
    if (checked) return false;
  }
  return element.getClientRects().length > 0;
}

/** Everything inside `root` that Tab can reach, in document order. */
export function focusableWithin(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isReachable);
}

/** The first thing Tab would reach after `element`, skipping anything inside it. */
export function nextFocusableAfter(element: HTMLElement): HTMLElement | null {
  return (
    focusableWithin(document).find(
      (candidate) =>
        !element.contains(candidate) &&
        (element.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
    ) ?? null
  );
}

/** Focus an element that isn't normally focusable (a heading, a region) without adding a tab stop. */
export function focusWithoutTabStop(element: HTMLElement): void {
  if (!element.hasAttribute("tabindex")) element.setAttribute("tabindex", "-1");
  element.focus();
}
