import Link from "next/link";
import { shellContent } from "@/shared/content/shell";

export type SiteHeaderVariant = "customer" | "admin";

export interface SiteHeaderProps {
  variant?: SiteHeaderVariant;
  /** Where the wordmark links to. */
  homeHref: string;
  /** Shown at the right, e.g. the customer's Sign in / My account. */
  action?: React.ReactNode;
}

const variantClasses: Record<SiteHeaderVariant, string> = {
  customer: "min-h-13 px-4 pt-2",
  admin: "h-20 px-8 bg-flour-raised border-b-2 border-line",
};

export function SiteHeader({ variant = "customer", homeHref, action }: SiteHeaderProps) {
  return (
    <header className={`flex items-center justify-between gap-3 ${variantClasses[variant]}`}>
      <Link href={homeHref} className="brand-name rounded-sm no-underline">
        {shellContent.brandName}
      </Link>
      {action}
    </header>
  );
}
