import tokens from "@design/system/tokens.json";

// Expected values come from tokens.json; the page paints each sample with the
// Tailwind theme so any drift between the two is visible side by side.

export interface ColorToken {
  name: string;
  value: string;
  usage: string;
}

export interface TypeStyle {
  name: TypeStyleName;
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
  sample: string;
  family: "serif" | "sans";
}

export interface SizeToken {
  name: string;
  value: string;
  usage: string;
}

// Literal class names so Tailwind generates each @utility.
export const typeStyleClass = {
  "page-title": "page-title",
  "section-title": "section-title",
  "product-name": "product-name",
  body: "body",
  "body-strong": "body-strong",
  price: "price",
  caption: "caption",
  "admin-title": "admin-title",
  "admin-order-number": "admin-order-number",
  "admin-body": "admin-body",
  "admin-strong": "admin-strong",
  "admin-caption": "admin-caption",
} as const;

export type TypeStyleName = keyof typeof typeStyleClass;

function isTypeStyleName(name: string): name is TypeStyleName {
  return name in typeStyleClass;
}

export const colorTokens: ColorToken[] = tokens.color.tokens;

export const typeGroups = tokens.type.groups.map((group) => ({
  name: group.name,
  styles: group.styles.flatMap((style): TypeStyle[] => {
    if (!isTypeStyleName(style.name)) return [];
    const family = ("family" in style ? style.family : group.family) === "serif" ? "serif" : "sans";
    return [
      {
        name: style.name,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        fontWeight: style.fontWeight,
        letterSpacing: "letterSpacing" in style ? style.letterSpacing : undefined,
        sample: style.sample,
        family,
      },
    ];
  }),
}));

export const spacingTokens: SizeToken[] = tokens.spacing.tokens;
export const radiusTokens: SizeToken[] = tokens.radius.tokens;
export const shadowTokens: SizeToken[] = tokens.shadow.tokens;
export const sizeTokens: SizeToken[] = tokens.size.tokens;

export function sizeTokenValue(name: string): string {
  return sizeTokens.find((token) => token.name === name)?.value ?? "";
}

/** "space-6" → 6, the multiplier of the 4px --spacing base. */
export function spacingStep(name: string): number {
  return Number(name.replace("space-", ""));
}

/** "radius-md" → "md", "shadow-card" → "card". */
export function tokenSuffix(name: string, prefix: string): string {
  return name.replace(`${prefix}-`, "");
}
