import type { Weekday } from "@/shared/domain";
import { WeekdayPicker } from "@/shared/components/molecules/WeekdayPicker/WeekdayPicker";
import { devComponentsContent } from "../../content/devComponents";
import { ControlledWeekdayPicker } from "../demos/PickerDemos";
import { Demo, PreviewSection } from "../PreviewSection";

const content = devComponentsContent;
const copy = content.weekdayPicker;

export interface WeekdayPickerSectionProps {
  closedWeekdays: Weekday[];
  recurringDays: Weekday[];
}

export function WeekdayPickerSection({ closedWeekdays, recurringDays }: WeekdayPickerSectionProps) {
  return (
    <PreviewSection id="weekday-picker" title={content.sections.weekdayPicker}>
      <Demo caption={content.captions.closedDays} stack>
        <ControlledWeekdayPicker closedWeekdays={closedWeekdays} initial={recurringDays} />
      </Demo>
      <Demo caption={content.captions.withError} stack>
        <ControlledWeekdayPicker closedWeekdays={closedWeekdays} requireChoice />
      </Demo>
      <Demo caption={content.captions.uncontrolled} stack>
        <WeekdayPicker label={copy.label} defaultValue={recurringDays} />
      </Demo>
      <Demo caption={content.captions.disabled} stack>
        <WeekdayPicker label={copy.label} defaultValue={recurringDays} disabled />
      </Demo>
    </PreviewSection>
  );
}
