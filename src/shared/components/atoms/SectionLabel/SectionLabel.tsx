import { cx } from "@/shared/utils/cx";

export interface SectionLabelProps {
  id?: string;
  /** h3 inside a panel section by default. */
  as?: "h2" | "h3" | "h4";
  className?: string;
  children: React.ReactNode;
}

/** The small uppercase heading over a block of the admin side panel ("Customer", "Items"). */
export function SectionLabel({ id, as: Heading = "h3", className, children }: SectionLabelProps) {
  return (
    <Heading
      id={id}
      className={cx("text-[16px]/[22px] font-bold tracking-[0.06em] text-ink-muted uppercase", className)}
    >
      {children}
    </Heading>
  );
}
