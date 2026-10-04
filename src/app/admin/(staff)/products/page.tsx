import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { connection } from "next/server";
import { adminShellContent } from "@/modules/admin-shell/content/adminShellContent";
import { getStaffPageSession } from "@/modules/auth/lib/staffPageSession";
import { ProductsScreen } from "@/modules/products/components/ProductsScreen";
import { prefetchAdminProducts } from "@/modules/products/lib/prefetchAdminProducts";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { EmptyState } from "@/shared/components/molecules/EmptyState/EmptyState";
import { getQueryClient } from "@/shared/lib/query/getQueryClient";
import { routes } from "@/shared/routes";

const content = adminShellContent;

// A5, owner only. Staff reaching it by URL get a plain explanation; the real
// guard is requireOwnerSession() on every products API route.
export default async function AdminProductsPage() {
  await connection();
  const actor = await getStaffPageSession();
  if (actor.role !== "owner") {
    return (
      <div className="px-8 py-8">
        <EmptyState
          headingLevel="h1"
          title={content.ownerOnly.title}
          action={<ButtonLink href={routes.admin.home}>{content.ownerOnly.back}</ButtonLink>}
        >
          {content.ownerOnly.body}
        </EmptyState>
      </div>
    );
  }

  const queryClient = getQueryClient();
  await prefetchAdminProducts(queryClient);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductsScreen />
    </HydrationBoundary>
  );
}
