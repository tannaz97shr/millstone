import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountHeaderLink } from "@/modules/account/components/AccountHeaderLink";
import { StorageOwner } from "@/modules/account/components/StorageOwner";
import { prefetchAccountSession } from "@/modules/account/lib/prefetchAccountSession";
import { SignInCartNotice } from "@/modules/cart/components/SignInCartNotice";
import { SiteHeader } from "@/shared/components/organisms/SiteHeader/SiteHeader";
import { getQueryClient } from "@/shared/lib/query/getQueryClient";
import { routes } from "@/shared/routes";

// Customer site: mobile-first, one column, space-4 page gutter, and no
// sideways scroll whatever is typed into a name or email. Who's signed
// in is known on the server, so the header and the cart's owner are right
// from the first render. That makes every customer page per request, which
// they already were (pickup dates follow the clock).
export default async function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  const queryClient = getQueryClient();
  await prefetchAccountSession(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StorageOwner />
      {/* wrap-anywhere: a long email or name breaks onto the next line instead of widening the page. */}
      <div className="mx-auto flex min-h-dvh w-full max-w-160 flex-col wrap-anywhere">
        <SiteHeader variant="customer" homeHref={routes.home} action={
            // It reads the URL's query (useSearchParams), which Next.js wants inside Suspense.
            <Suspense fallback={null}>
              <AccountHeaderLink />
            </Suspense>
          } />
        <main className="flex flex-1 flex-col gap-8 px-4 pt-4 pb-8">{children}</main>
      </div>
      <SignInCartNotice />
    </HydrationBoundary>
  );
}
