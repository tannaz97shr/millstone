import tokens from "@design/system/tokens.json";

// Email clients ignore CSS variables, so the email inlines literal colours.
// They come from tokens.json, the same source as the site's theme.

type ColorName =
  | "flour"
  | "flour-raised"
  | "flour-sunk"
  | "line"
  | "line-strong"
  | "ink"
  | "ink-muted"
  | "crust"
  | "on-crust"
  | "wheat"
  | "sage"
  | "sage-soft";

function color(name: ColorName): string {
  const token = tokens.color.tokens.find((t) => t.name === name);
  if (!token || !token.value.startsWith("#")) throw new Error(`tokens.json has no colour "${name}"`);
  return token.value;
}

export const emailColors = {
  page: color("flour"),
  card: color("flour-raised"),
  sunk: color("flour-sunk"),
  line: color("line"),
  lineStrong: color("line-strong"),
  ink: color("ink"),
  inkMuted: color("ink-muted"),
  link: color("crust"),
  onCrust: color("on-crust"),
  wheat: color("wheat"),
  sage: color("sage"),
  sageSoft: color("sage-soft"),
} as const;

/** AC-C11: web fonts rarely load in mail apps, so each stack falls back to Georgia or Arial. */
export const emailFonts = {
  serif: "Bitter, Georgia, 'Times New Roman', serif",
  sans: "'Atkinson Hyperlegible', Arial, Helvetica, sans-serif",
} as const;
