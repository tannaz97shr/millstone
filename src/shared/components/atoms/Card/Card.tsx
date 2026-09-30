import { cx } from "@/shared/utils/cx";

export interface CardProps {
  /** none: the content brings its own padding (lists with dividers, media). */
  padding?: "none" | "md";
  /** For a labelled region, e.g. a section with an aria-label. */
  as?: "div" | "section" | "article";
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
  children: React.ReactNode;
}

/** The raised surface most screens are built from: flour-raised, a hairline and a quiet shadow. */
export function Card({
  padding = "md",
  as: Element = "div",
  className,
  children,
  ...aria
}: CardProps) {
  return (
    <Element
      {...aria}
      className={cx(
        "rounded-lg border border-line bg-flour-raised shadow-card",
        padding === "md" && "p-4",
        className,
      )}
    >
      {children}
    </Element>
  );
}
