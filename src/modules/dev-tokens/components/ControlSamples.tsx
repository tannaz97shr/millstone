import { MeasuredHeight } from "./MeasuredHeight";
import { devTokensContent } from "../content/devTokens";
import { sizeTokenValue } from "../lib/tokens";

const content = devTokensContent.controls;

export interface ControlSamplesProps {
  context: "customer" | "admin";
}

/** The same controls in either context; sizes come from data-context. */
export function ControlSamples({ context }: ControlSamplesProps) {
  const isAdmin = context === "admin";
  const controlH = sizeTokenValue(isAdmin ? "control-h-admin" : "control-h");
  const tapMin = sizeTokenValue(isAdmin ? "tap-min-admin" : "tap-min");
  const inputId = `dev-input-${context}`;

  return (
    <div
      data-context={isAdmin ? "admin" : undefined}
      data-testid={`controls-${context}`}
      className="flex flex-col gap-4 rounded-lg border border-line bg-flour-raised p-4 shadow-card"
    >
      <h3 className="product-name">{isAdmin ? content.adminHeading : content.customerHeading}</h3>
      <p data-testid="body-sample">{content.bodySample}</p>

      <MeasuredHeight expected={controlH}>
        <button
          type="button"
          className="h-control rounded-md bg-crust px-6 font-bold text-on-crust hover:bg-crust-deep"
        >
          {content.primaryButton}
        </button>
      </MeasuredHeight>

      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="font-bold">
          {content.inputLabel}
        </label>
        <MeasuredHeight expected={controlH}>
          <input
            id={inputId}
            type="tel"
            placeholder={content.inputPlaceholder}
            className="h-control w-64 max-w-full rounded-md border border-line-strong bg-flour-raised px-4 placeholder:text-ink-muted"
          />
        </MeasuredHeight>
      </div>

      <MeasuredHeight expected={tapMin}>
        <button
          type="button"
          aria-label={content.tapTargetLabel}
          className="flex size-tap items-center justify-center rounded-md border border-line-strong bg-flour-raised font-bold"
        >
          {content.tapTarget}
        </button>
      </MeasuredHeight>

      {isAdmin && (
        <MeasuredHeight expected={sizeTokenValue("action-h-admin")}>
          <div className="flex gap-3">
            <button
              type="button"
              className="h-action rounded-md bg-sage px-8 font-bold text-on-sage"
            >
              {content.readyButton}
            </button>
            <button
              type="button"
              className="h-action rounded-md bg-crust px-8 font-bold text-on-crust hover:bg-crust-deep"
            >
              {content.collectedButton}
            </button>
          </div>
        </MeasuredHeight>
      )}
    </div>
  );
}
