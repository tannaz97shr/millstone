import { AdminPlaceholder } from "@/modules/admin-shell/components/AdminPlaceholder";
import { adminShellContent } from "@/modules/admin-shell/content/adminShellContent";

export default function AdminOrdersPage() {
  return <AdminPlaceholder {...adminShellContent.placeholders.orders} />;
}
