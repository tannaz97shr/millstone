"use client";

import { fontVariables } from "./fonts";
import { ErrorFallback } from "@/shared/components/organisms/ErrorFallback/ErrorFallback";
import "./globals.css";

// Replaces the root layout when it fails, so it brings its own <html> and <body>.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en-AU" className={fontVariables}>
      <body>
        <ErrorFallback error={error} retry={retry} context="app/global-error" />
      </body>
    </html>
  );
}
