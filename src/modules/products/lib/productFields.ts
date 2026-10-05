import type { Cents } from "@/shared/domain";
import { PRODUCT_ID_MAX_LENGTH } from "@/modules/catalog/lib/productParams";

// Pure rules for A5's fields, shared by the form (React Hook Form) and the
// API. No Firestore, no React.

export const PRODUCT_NAME_MAX = 60;
export const PRODUCT_DESCRIPTION_MAX = 160;
export const CATEGORY_NAME_MAX = 30;
/** $999.99: well above anything a bakery sells, low enough to catch a slipped finger. */
export const PRICE_MAX_CENTS = 99_999;

const PRICE_INPUT = /^\$?\s*(\d{1,3}(?:,\d{3})*|\d+)(?:\.(\d{1,2}))?$/;

/**
 * "9.50", "$9.5", "9" → cents; null for anything else, zero or over the
 * maximum. Dollars with up to two decimals, as the field's hint says.
 */
export function parsePriceInput(input: string): Cents | null {
  const match = PRICE_INPUT.exec(input.trim());
  if (!match) return null;
  const dollars = Number(match[1].replaceAll(",", ""));
  const cents = Number((match[2] ?? "").padEnd(2, "0"));
  const total = dollars * 100 + cents;
  return total > 0 && total <= PRICE_MAX_CENTS ? total : null;
}

/** 950 → "9.50", for the price field's starting value. */
export function formatPriceInput(cents: Cents): string {
  return (cents / 100).toFixed(2);
}

/** Collapses inner spaces: "  Cakes   &  tarts " → "Cakes & tarts". */
export function tidyText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/**
 * A typed category that matches an existing one, ignoring case and spacing,
 * becomes that one ("breads" → "Breads"), so the menu never shows two headings.
 */
export function normaliseCategory(typed: string, existing: readonly string[]): string {
  const tidy = tidyText(typed);
  return existing.find((name) => name.toLocaleLowerCase("en-AU") === tidy.toLocaleLowerCase("en-AU")) ?? tidy;
}

/** How many IDs to try for one name before giving up ("rye", "rye-2" … "rye-20"). */
export const SLUG_ATTEMPTS = 20;

/** "Olive fougasse" → "olive-fougasse"; leaves room for a "-20" suffix. */
export function productSlug(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "") // accents split off by NFKD: "é" → "e"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, PRODUCT_ID_MAX_LENGTH - 3)
    .replace(/-+$/g, "");
  return slug || "product";
}

/** The doc IDs to try in turn for a new product: the slug, then "-2", "-3"… */
export function slugCandidates(name: string): string[] {
  const base = productSlug(name);
  return Array.from({ length: SLUG_ATTEMPTS }, (_, i) => (i === 0 ? base : `${base}-${i + 1}`));
}
