// Free-text search for the admin (AC-A3). Firestore can't match substrings,
// so each order stores the words staff might type as `searchTokens`, and a
// query is turned into the same kind of words. Pure: no Firestore here.

/** A name word matches from its first 2 letters ("pr" finds Priya). */
export const MIN_NAME_PREFIX = 2;
/** Phone digits match from the last 3 ("156" finds 0491 570 156). */
export const MIN_PHONE_SUFFIX = 3;
/** Or from the first 4, for someone typing the number from the start. */
export const MIN_PHONE_PREFIX = 4;
/** Long words are cut here, in tokens and queries alike. */
export const MAX_WORD_LENGTH = 24;

export interface SearchableOrder {
  orderNumber: string;
  contactName: string;
  /** Digits only, as stored. */
  contactPhone: string;
}

const isDigits = (word: string) => /^\d+$/.test(word);

/** Lowercased letter-and-digit words; accents are dropped ("Zoë" → "zoe"). */
function words(text: string): string[] {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((word) => word.slice(0, MAX_WORD_LENGTH));
}

function prefixes(word: string, min: number): string[] {
  const out: string[] = [];
  for (let length = min; length <= word.length; length += 1) out.push(word.slice(0, length));
  return out;
}

function suffixes(word: string, min: number): string[] {
  const out: string[] = [];
  for (let length = min; length <= word.length; length += 1) out.push(word.slice(word.length - length));
  return out;
}

/** "MS-1042" → "1042". */
function orderDigits(orderNumber: string): string {
  return orderNumber.replace(/\D/g, "");
}

/** Every word an order can be found by, without duplicates. */
export function buildSearchTokens(order: SearchableOrder): string[] {
  const tokens = new Set<string>();
  const number = orderDigits(order.orderNumber);
  if (number) {
    tokens.add(number);
    tokens.add(`ms${number}`);
  }
  for (const word of words(order.contactName)) {
    if (word.length < MIN_NAME_PREFIX) {
      tokens.add(word);
      continue;
    }
    for (const prefix of prefixes(word, MIN_NAME_PREFIX)) tokens.add(prefix);
  }
  const phone = order.contactPhone.replace(/\D/g, "");
  if (phone) {
    for (const suffix of suffixes(phone, MIN_PHONE_SUFFIX)) tokens.add(suffix);
    for (const prefix of prefixes(phone, MIN_PHONE_PREFIX)) tokens.add(prefix);
  }
  return [...tokens];
}

/**
 * What staff typed, as tokens to look up. An order matches when it has every
 * one of them. Order numbers ("MS-1042", "ms 1042") and phone numbers typed
 * with spaces, dashes, brackets or +61 become one digit word each. Words too
 * short to be a token are dropped; an empty result means "nothing to search".
 */
export function parseSearchQuery(query: string): string[] {
  let text = query.trim().toLowerCase();
  // +61 4xx… → 04xx…
  text = text.replace(/\+\s*61\s*\(?0?\)?\s*(?=\d)/g, "0");
  // MS-1042, ms 1042 → 1042
  text = text.replace(/\bms[\s-]*(?=\d)/g, "");
  // Phone formatting between digits: "0491 570 156", "(03) 7010-1120".
  text = text.replace(/\(\s*(\d+)\s*\)/g, "$1");
  text = text.replace(/(?<=\d)[\s.\-()]+(?=\d)/g, "");

  const result = new Set<string>();
  for (const word of words(text)) {
    const min = isDigits(word) ? MIN_PHONE_SUFFIX : MIN_NAME_PREFIX;
    if (word.length >= min) result.add(word);
  }
  return [...result];
}

/** The token to ask Firestore for: the longest is the most selective. */
export function primarySearchToken(tokens: readonly string[]): string | null {
  return tokens.reduce<string | null>((best, token) => (!best || token.length > best.length ? token : best), null);
}

export function matchesAllTokens(orderTokens: readonly string[], queryTokens: readonly string[]): boolean {
  const have = new Set(orderTokens);
  return queryTokens.every((token) => have.has(token));
}
