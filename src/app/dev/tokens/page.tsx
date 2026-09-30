import type { Metadata } from "next";
import { DevTokensPage } from "@/modules/dev-tokens/components/DevTokensPage";
import { devTokensContent } from "@/modules/dev-tokens/content/devTokens";

export const metadata: Metadata = {
  title: devTokensContent.metadataTitle,
};

export default function Page() {
  return <DevTokensPage />;
}
