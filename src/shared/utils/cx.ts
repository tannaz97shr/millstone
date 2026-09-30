/** Joins class names, skipping falsy ones. No merging: later classes don't override earlier ones. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
