import { DatePicker } from "@/shared/components/molecules/DatePicker/DatePicker";
import { devComponentsContent } from "../../content/devComponents";
import type { SampleDates } from "../../lib/sampleData";
import { ControlledDatePicker } from "../demos/PickerDemos";
import { Demo, PreviewSection } from "../PreviewSection";

const content = devComponentsContent;
const copy = content.datePicker;

export interface DatePickerSectionProps {
  dates: SampleDates;
}

export function DatePickerSection({ dates }: DatePickerSectionProps) {
  return (
    <PreviewSection id="date-picker" title={content.sections.datePicker}>
      <Demo caption={content.captions.strip} stack>
        <ControlledDatePicker dates={dates} layout="strip" />
      </Demo>
      <Demo caption={content.captions.stripUnavailable} stack>
        <DatePicker
          label={copy.stripLabel}
          note={copy.stripNote}
          defaultValue={dates.earliest}
          earliest={dates.earliest}
          start={dates.today}
          days={14}
          unavailable={[dates.soldOutDay]}
          closedWeekdays={dates.closedWeekdays}
        />
      </Demo>
      <Demo caption={content.captions.month} stack>
        <ControlledDatePicker dates={dates} layout="month" />
      </Demo>
    </PreviewSection>
  );
}
