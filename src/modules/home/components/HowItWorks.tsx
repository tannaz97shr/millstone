import { homeContent } from "../content/homeContent";

const content = homeContent;

export interface HowItWorksProps {
  /** "2pm" when every branch shares the cutoff, otherwise null. */
  cutoff: string | null;
}

export function HowItWorks({ cutoff }: HowItWorksProps) {
  const steps = [
    content.steps.branch,
    { title: content.steps.day.title, body: content.steps.day.body(cutoff) },
    content.steps.pay,
  ];

  return (
    <section aria-labelledby="how-title" className="flex flex-col gap-4">
      <h2 id="how-title" className="section-title">
        {content.howTitle}
      </h2>
      <ol className="flex flex-col gap-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-flour-sunk font-serif text-[20px] font-bold"
            >
              {index + 1}
            </span>
            <div className="flex flex-col">
              <span className="body-strong">{step.title}</span>
              <span className="text-ink-muted">{step.body}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
