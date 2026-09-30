import { ControlSamples } from "./ControlSamples";
import { devTokensContent } from "../content/devTokens";
import {
  colorTokens,
  radiusTokens,
  shadowTokens,
  spacingStep,
  spacingTokens,
  tokenSuffix,
  typeGroups,
  typeStyleClass,
} from "../lib/tokens";

const content = devTokensContent;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="section-title border-b border-line pb-2">{title}</h2>
      {children}
    </section>
  );
}

export function DevTokensPage() {
  return (
    <main className="mx-auto flex w-full max-w-300 flex-col gap-12 px-4 py-12 md:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="page-title">{content.title}</h1>
        <p className="text-ink-muted">{content.intro}</p>
      </header>

      <Section title={content.sections.palette}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {colorTokens.map((token) => (
            <li key={token.name} className="flex flex-col gap-2">
              <div
                data-testid={`swatch-${token.name}`}
                className="h-16 rounded-md border border-line"
                style={{ backgroundColor: `var(--color-${token.name})` }}
              />
              <div>
                <p className="body-strong">{token.name}</p>
                <p className="caption text-ink-muted">{token.value}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={content.sections.type}>
        {typeGroups.map((group) => (
          <div key={group.name} className="flex flex-col gap-4">
            <h3 className="product-name text-ink-muted">{group.name}</h3>
            <ul className="flex flex-col gap-4">
              {group.styles.map((style) => (
                <li key={style.name} className="flex flex-col gap-1 border-b border-line pb-4">
                  <p data-testid={`type-${style.name}`} className={typeStyleClass[style.name]}>
                    {style.sample}
                  </p>
                  <p className="caption text-ink-muted">
                    {style.name} · {style.family} · {style.fontSize}/{style.lineHeight} ·{" "}
                    {style.fontWeight}
                    {style.letterSpacing ? ` · ${style.letterSpacing}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>

      <Section title={content.sections.spacing}>
        <ul className="flex flex-col gap-2">
          {spacingTokens.map((token) => (
            <li key={token.name} className="flex items-center gap-4">
              <span className="caption w-28 shrink-0">
                {token.name} · {token.value}
              </span>
              <span
                className="h-4 bg-crust"
                style={{ width: `calc(var(--spacing) * ${spacingStep(token.name)})` }}
              />
            </li>
          ))}
        </ul>
      </Section>

      <Section title={content.sections.radius}>
        <ul className="flex flex-wrap gap-6">
          {radiusTokens.map((token) => (
            <li key={token.name} className="flex flex-col gap-2">
              <div
                className="size-20 border border-line-strong bg-flour-sunk"
                style={{ borderRadius: `var(--radius-${tokenSuffix(token.name, "radius")})` }}
              />
              <p className="caption">
                {token.name} · {token.value}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={content.sections.shadow}>
        <ul className="flex flex-wrap gap-8">
          {shadowTokens.map((token) => (
            <li key={token.name} className="flex flex-col gap-3">
              <div
                className="h-20 w-40 rounded-lg bg-flour-raised"
                style={{ boxShadow: `var(--shadow-${tokenSuffix(token.name, "shadow")})` }}
              />
              <p className="caption">{token.name}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={content.sections.controls}>
        <div className="grid gap-6 lg:grid-cols-2">
          <ControlSamples context="customer" />
          <ControlSamples context="admin" />
        </div>
      </Section>
    </main>
  );
}
