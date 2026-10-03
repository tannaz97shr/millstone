import { AdminPlaceholder } from "@/modules/admin-shell/components/AdminPlaceholder";
import { adminShellContent } from "@/modules/admin-shell/content/adminShellContent";

// A4: built in the availability step.
export default function AdminAvailabilityPage() {
  return <AdminPlaceholder {...adminShellContent.placeholders.availability} />;
}
