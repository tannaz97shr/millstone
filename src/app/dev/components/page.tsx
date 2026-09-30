import type { Metadata } from "next";
import { DevComponentsPage } from "@/modules/dev-components/components/DevComponentsPage";
import { devComponentsContent } from "@/modules/dev-components/content/devComponents";
import { buildSampleDates } from "@/modules/dev-components/lib/sampleData";

export const metadata: Metadata = {
  title: devComponentsContent.metadataTitle,
};

// Rendered per request so the sample dates follow the real clock and cutoff.
export const dynamic = "force-dynamic";

export default function Page() {
  return <DevComponentsPage dates={buildSampleDates(new Date())} />;
}
