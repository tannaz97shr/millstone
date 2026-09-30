"use client";

import { useEffect } from "react";
import { shellContent } from "@/shared/content/shell";
import { logError } from "@/shared/utils/logError";

const content = shellContent.error;

export interface ErrorFallbackProps {
  error: Error & { digest?: string };
  retry: () => void;
  /** Where the error was caught, for the log. */
  context: string;
}

export function ErrorFallback({ error, retry, context }: ErrorFallbackProps) {
  useEffect(() => {
    logError(error, context);
  }, [error, context]);

  return (
    <main role="alert" className="mx-auto flex max-w-160 flex-col gap-4 px-4 py-12">
      <h1 className="page-title">{content.title}</h1>
      <p>{content.body}</p>
      <button
        type="button"
        onClick={() => retry()}
        className="body-strong h-control self-start rounded-md bg-crust px-6 text-on-crust hover:bg-crust-deep"
      >
        {content.retry}
      </button>
    </main>
  );
}
