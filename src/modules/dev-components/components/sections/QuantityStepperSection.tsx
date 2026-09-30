import { QuantityStepper } from "@/shared/components/molecules/QuantityStepper/QuantityStepper";
import { devComponentsContent } from "../../content/devComponents";
import { ControlledStepper } from "../demos/ControlledDemos";
import { Demo, PreviewSection } from "../PreviewSection";

const content = devComponentsContent;
const copy = content.quantityStepper;

export function QuantityStepperSection() {
  return (
    <PreviewSection id="quantity-stepper" title={content.sections.quantityStepper}>
      <Demo caption={content.captions.controlled}>
        <ControlledStepper />
      </Demo>
      <Demo caption={content.captions.atOne}>
        <QuantityStepper defaultValue={1} label={copy.product} />
      </Demo>
      <Demo caption={content.captions.atMin}>
        <QuantityStepper defaultValue={0} label={copy.product} />
      </Demo>
      <Demo caption={content.captions.atMax}>
        <QuantityStepper defaultValue={99} label={copy.maxProduct} />
      </Demo>
    </PreviewSection>
  );
}
