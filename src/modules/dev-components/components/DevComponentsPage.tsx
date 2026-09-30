import { devComponentsContent } from "../content/devComponents";
import type { SampleDates } from "../lib/sampleData";
import { ButtonSection } from "./sections/ButtonSection";
import { ChoiceGroupSection } from "./sections/ChoiceGroupSection";
import { DatePickerSection } from "./sections/DatePickerSection";
import { LabelsSection } from "./sections/LabelsSection";
import { DialogSection, SheetSection } from "./sections/ModalSections";
import { NoticeSection } from "./sections/NoticeSection";
import { OrderRowSection } from "./sections/OrderRowSection";
import { ProductCardSection } from "./sections/ProductCardSection";
import { QuantityStepperSection } from "./sections/QuantityStepperSection";
import { TextFieldSection } from "./sections/TextFieldSection";
import { ToggleSection } from "./sections/ToggleSection";
import { WeekdayPickerSection } from "./sections/WeekdayPickerSection";

const content = devComponentsContent;

export interface DevComponentsPageProps {
  /** Sample dates, worked out on the server from the pickup-date rules. */
  dates: SampleDates;
}

export function DevComponentsPage({ dates }: DevComponentsPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-300 flex-col gap-12 px-4 py-12 md:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="page-title">{content.title}</h1>
        <p className="text-ink-muted">{content.intro}</p>
      </header>
      <ButtonSection />
      <LabelsSection recurringDays={dates.recurringDays} />
      <TextFieldSection />
      <QuantityStepperSection />
      <ToggleSection />
      <ChoiceGroupSection />
      <NoticeSection />
      <WeekdayPickerSection
        closedWeekdays={dates.closedWeekdays}
        recurringDays={dates.recurringDays}
      />
      <DatePickerSection dates={dates} />
      <ProductCardSection dates={dates} />
      <OrderRowSection />
      <SheetSection />
      <DialogSection pickupDate={dates.chosen} />
    </main>
  );
}
