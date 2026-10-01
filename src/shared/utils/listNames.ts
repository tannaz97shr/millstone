// Joined by hand rather than with Intl.ListFormat: runtimes disagree on the
// comma before "and" for en-AU, and the server and browser must match.
const AND = " and ";
const SEPARATOR = ", ";

/** "Sourdough rye loaf", "A and B", "A, B and C". */
export function listNames(names: readonly string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(SEPARATOR)}${AND}${names[names.length - 1]}`;
}
