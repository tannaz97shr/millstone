import { devComponentsContent } from "../content/devComponents";
import { ButtonSection } from "./sections/ButtonSection";
import { ChoiceGroupSection } from "./sections/ChoiceGroupSection";
import { LabelsSection } from "./sections/LabelsSection";
import { NoticeSection } from "./sections/NoticeSection";
import { QuantityStepperSection } from "./sections/QuantityStepperSection";
import { TextFieldSection } from "./sections/TextFieldSection";
import { ToggleSection } from "./sections/ToggleSection";

const content = devComponentsContent;

export function DevComponentsPage() {
  return (
    <main className="mx-auto flex w-full max-w-300 flex-col gap-12 px-4 py-12 md:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="page-title">{content.title}</h1>
        <p className="text-ink-muted">{content.intro}</p>
      </header>
      <ButtonSection />
      <LabelsSection />
      <TextFieldSection />
      <QuantityStepperSection />
      <ToggleSection />
      <ChoiceGroupSection />
      <NoticeSection />
    </main>
  );
}
