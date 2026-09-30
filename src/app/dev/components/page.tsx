import type { Metadata } from "next";
import { DevComponentsPage } from "@/modules/dev-components/components/DevComponentsPage";
import { devComponentsContent } from "@/modules/dev-components/content/devComponents";

export const metadata: Metadata = {
  title: devComponentsContent.metadataTitle,
};

export default function Page() {
  return <DevComponentsPage />;
}
