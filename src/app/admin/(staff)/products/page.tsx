import { AdminPlaceholder } from "@/modules/admin-shell/components/AdminPlaceholder";
import { adminShellContent } from "@/modules/admin-shell/content/adminShellContent";
import { getStaffPageSession } from "@/modules/auth/lib/staffPageSession";
import { ButtonLink } from "@/shared/components/atoms/ButtonLink/ButtonLink";
import { EmptyState } from "@/shared/components/molecules/EmptyState/EmptyState";
import { routes } from "@/shared/routes";

const content = adminShellContent;

// A5, owner only (built in the products step). Staff reaching it by URL get a
// plain explanation; the real guard is requireOwnerSession() on its API.
export default async function AdminProductsPage() {
  const actor = await getStaffPageSession();
  if (actor.role !== "owner") {
    return (
      <EmptyState
        headingLevel="h1"
        title={content.ownerOnly.title}
        action={<ButtonLink href={routes.admin.home}>{content.ownerOnly.back}</ButtonLink>}
      >
        {content.ownerOnly.body}
      </EmptyState>
    );
  }
  return <AdminPlaceholder {...content.placeholders.products} />;
}
