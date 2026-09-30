import { cx } from "@/shared/utils/cx";
import { devComponentsContent } from "../content/devComponents";

type Context = "customer" | "admin";

interface ContextFrameProps {
  context: Context;
  children: React.ReactNode;
}

/** The same samples under one context; admin sizes come from data-context. */
function ContextFrame({ context, children }: ContextFrameProps) {
  const isAdmin = context === "admin";
  return (
    <div
      data-context={isAdmin ? "admin" : undefined}
      data-testid={`frame-${context}`}
      className={cx(
        "flex flex-col gap-6 rounded-lg border border-line bg-flour p-4",
        isAdmin ? "admin:p-8" : "max-w-108",
      )}
    >
      <h3 className="caption font-bold text-ink-muted">
        {devComponentsContent.frames[context]}
      </h3>
      {children}
    </div>
  );
}

export interface PreviewSectionProps {
  id: string;
  title: string;
  /** For components used only on the admin, e.g. OrderRow. */
  adminOnly?: boolean;
  children: React.ReactNode;
}

/** A component's samples, rendered once per context. */
export function PreviewSection({ id, title, adminOnly = false, children }: PreviewSectionProps) {
  return (
    <section aria-labelledby={id} data-testid={`section-${id}`} className="flex flex-col gap-4">
      <h2 id={id} className="section-title border-b border-line pb-2">
        {title}
      </h2>
      {!adminOnly && <ContextFrame context="customer">{children}</ContextFrame>}
      <ContextFrame context="admin">{children}</ContextFrame>
    </section>
  );
}

export interface DemoProps {
  caption: string;
  /** Stack the samples instead of wrapping them in a row. */
  stack?: boolean;
  children: React.ReactNode;
}

export function Demo({ caption, stack = false, children }: DemoProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="caption text-ink-muted">{caption}</p>
      <div className={cx("flex gap-3", stack ? "flex-col" : "flex-wrap items-center")}>
        {children}
      </div>
    </div>
  );
}
