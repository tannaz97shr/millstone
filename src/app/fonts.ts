import localFont from "next/font/local";

// Files copied from design/system/fonts. Exposed as --font-bitter and
// --font-atkinson; globals.css builds --font-serif and --font-sans from them.

export const bitter = localFont({
  src: [
    { path: "./fonts/bitter-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/bitter-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-bitter",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

export const atkinson = localFont({
  src: [
    { path: "./fonts/atkinson-hyperlegible-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/atkinson-hyperlegible-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/atkinson-hyperlegible-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-atkinson",
  display: "swap",
});

export const fontVariables = `${bitter.variable} ${atkinson.variable}`;
