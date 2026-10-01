import type { Metadata } from "next";
import { fontVariables } from "./fonts";
import { shellContent } from "@/shared/content/shell";
import { QueryProvider } from "@/shared/lib/query/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: shellContent.metadata.title,
  description: shellContent.metadata.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" className={fontVariables}>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
