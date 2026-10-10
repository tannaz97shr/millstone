import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";

/** The account screens' back link, above the title (the shared header stays above it). */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    // -ml-2: the quiet button's text lines up with the design's 8px header inset.
    <ButtonLink href={href} variant="quiet" icon="left" className="-ml-2 self-start">
      {children}
    </ButtonLink>
  );
}
