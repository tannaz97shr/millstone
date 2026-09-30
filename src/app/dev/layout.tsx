import { notFound } from "next/navigation";
import { devPagesEnabled } from "@/shared/utils/devPages";

// Every /dev page is a 404 in production unless built with DEV_PAGES=true.
export default function DevLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!devPagesEnabled()) notFound();
  return children;
}
