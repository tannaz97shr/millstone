"use client";

import { ErrorFallback } from "@/shared/components/organisms/ErrorFallback/ErrorFallback";

export default function ErrorBoundary({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorFallback error={error} retry={retry} context="app/error" />;
}
