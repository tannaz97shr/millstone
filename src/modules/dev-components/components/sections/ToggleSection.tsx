import { Toggle } from "@/shared/components/atoms/Toggle/Toggle";
import { devComponentsContent } from "../../content/devComponents";
import { ControlledToggle } from "../demos/ControlledDemos";
import { Demo, PreviewSection } from "../PreviewSection";

const content = devComponentsContent;
const copy = content.toggle;

export function ToggleSection() {
  return (
    <PreviewSection id="toggle" title={content.sections.toggle}>
      <Demo caption={content.captions.controlled}>
        <ControlledToggle />
      </Demo>
      <Demo caption={content.captions.uncontrolled} stack>
        <Toggle label={copy.product} onText={copy.onText} offText={copy.offText} />
        <Toggle />
      </Demo>
      <Demo caption={content.captions.disabled} stack>
        <Toggle
          label={copy.disabledProduct}
          onText={copy.onText}
          offText={copy.offText}
          defaultChecked
          disabled
        />
      </Demo>
    </PreviewSection>
  );
}
