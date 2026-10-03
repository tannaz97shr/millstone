import type { Metadata } from "next";
import { shellContent } from "@/shared/content/shell";

export const metadata: Metadata = {
  title: shellContent.metadata.adminTitle,
};

// Staff admin: tablet-first, counter sizes via data-context="admin". The
// signed-in pages add the header in (staff)/layout.tsx; A1 has its own.
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div data-context="admin" className="flex min-h-dvh flex-col">
      {children}
    </div>
  );
}
