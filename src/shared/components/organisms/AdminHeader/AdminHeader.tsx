"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { shellContent } from "@/shared/content/shell";
import { Button } from "../../atoms/Button/Button";

export interface AdminNavItem {
  href: string;
  label: string;
}

export interface AdminHeaderProps {
  /** Where the wordmark links to. */
  homeHref: string;
  /** Accessible name of the nav, e.g. "Admin". */
  navLabel: string;
  nav: AdminNavItem[];
  /** The branch in bold, e.g. "Northcote" or "All branches". */
  branchLabel: string;
  /** Who is signed in, e.g. "Staff · Northcote". */
  userLabel: string;
  signOutLabel: string;
  onSignOut: () => void;
  signingOut?: boolean;
}

function isCurrent(pathname: string, href: string, homeHref: string): boolean {
  if (href === homeHref) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The admin's top bar (A2 design): wordmark, nav with the current page
 * underlined in crust, who is signed in, and Sign out. Every item is a
 * visible word; nothing hides in a menu. It sticks to the top of the
 * viewport, so the side panel (80px down) always sits right under it.
 */
export function AdminHeader({
  homeHref,
  navLabel,
  nav,
  branchLabel,
  userLabel,
  signOutLabel,
  onSignOut,
  signingOut = false,
}: AdminHeaderProps) {
  const pathname = usePathname();
  return (
    <header
      data-admin-header
      className="sticky top-0 z-20 flex h-20 shrink-0 items-center gap-6 border-b-2 border-line bg-flour-raised px-8"
    >
      <Link href={homeHref} className="brand-name rounded-sm no-underline">
        {shellContent.brandName}
      </Link>
      <nav aria-label={navLabel} className="flex grow items-stretch gap-1 self-stretch">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isCurrent(pathname, item.href, homeHref) ? "page" : undefined}
            className="inline-flex min-h-tap items-center border-b-4 border-transparent px-4 text-[20px] font-bold text-ink-muted no-underline hover:text-ink aria-[current=page]:border-crust aria-[current=page]:text-ink"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex flex-col items-end">
        <span className="admin-strong">{branchLabel}</span>
        <span className="admin-caption text-ink-muted">{userLabel}</span>
      </div>
      <Button variant="secondary" onClick={onSignOut} aria-disabled={signingOut || undefined}>
        {signOutLabel}
      </Button>
    </header>
  );
}
