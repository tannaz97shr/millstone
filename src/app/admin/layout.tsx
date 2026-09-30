import type { Metadata } from "next";
import { SiteHeader } from "@/shared/components/organisms/SiteHeader/SiteHeader";
import { shellContent } from "@/shared/content/shell";
import { routes } from "@/shared/routes";

export const metadata: Metadata = {
  title: shellContent.metadata.adminTitle,
};

// Staff admin: tablet-first, counter sizes via data-context="admin", space-8 gutter.
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div data-context="admin" className="flex min-h-dvh flex-col">
      <SiteHeader variant="admin" homeHref={routes.admin.home} />
      <main className="flex flex-1 flex-col gap-8 px-8 py-8">{children}</main>
    </div>
  );
}
