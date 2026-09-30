import { SiteHeader } from "@/shared/components/organisms/SiteHeader/SiteHeader";
import { routes } from "@/shared/routes";

// Customer site: mobile-first, one column, space-4 page gutter.
export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-160 flex-col">
      <SiteHeader variant="customer" homeHref={routes.home} />
      <main className="flex flex-1 flex-col gap-8 px-4 pt-4 pb-8">{children}</main>
    </div>
  );
}
