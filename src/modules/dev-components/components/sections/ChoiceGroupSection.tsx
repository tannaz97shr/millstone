import { ChoiceGroup } from "@/shared/components/molecules/ChoiceGroup/ChoiceGroup";
import { devComponentsContent } from "../../content/devComponents";
import { ControlledChoiceGroup } from "../demos/ControlledDemos";
import { Demo, PreviewSection } from "../PreviewSection";

const content = devComponentsContent;
const reason = content.choiceGroup.reason;

export function ChoiceGroupSection() {
  return (
    <PreviewSection id="choice-group" title={content.sections.choiceGroup}>
      <Demo caption={content.captions.nothingChosen} stack>
        <ControlledChoiceGroup />
      </Demo>
      <Demo caption={content.captions.withError} stack>
        <ControlledChoiceGroup requireChoice />
      </Demo>
      <Demo caption={content.captions.uncontrolled} stack>
        <ChoiceGroup label={reason.label} options={[...reason.options]} defaultValue="customer" />
      </Demo>
    </PreviewSection>
  );
}
