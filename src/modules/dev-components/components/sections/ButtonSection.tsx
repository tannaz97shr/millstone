import { Button } from "@/shared/components/atoms/Button/Button";
import { devComponentsContent } from "../../content/devComponents";
import { Demo, PreviewSection } from "../PreviewSection";

const content = devComponentsContent;
const copy = content.button;

export function ButtonSection() {
  return (
    <PreviewSection id="button" title={content.sections.button}>
      <Demo caption={content.captions.variants}>
        <Button variant="primary">{copy.primary}</Button>
        <Button variant="secondary">{copy.secondary}</Button>
        <Button variant="quiet">{copy.quiet}</Button>
        <Button variant="danger">{copy.danger}</Button>
        <Button variant="ready">{copy.ready}</Button>
      </Demo>
      <Demo caption={content.captions.withIcon}>
        <Button variant="quiet" icon="left">
          {copy.quiet}
        </Button>
        <Button variant="secondary" icon="plus">
          {copy.secondary}
        </Button>
        <Button variant="danger" icon="cross">
          {copy.danger}
        </Button>
        <Button variant="ready" icon="check">
          {copy.ready}
        </Button>
      </Demo>
      <Demo caption={content.captions.disabled}>
        <Button variant="primary" disabled>
          {copy.disabled}
        </Button>
        <Button variant="secondary" disabled>
          {copy.secondary}
        </Button>
      </Demo>
      <Demo caption={content.captions.block} stack>
        <Button variant="primary" block>
          {copy.block}
        </Button>
      </Demo>
      <Demo caption={content.captions.counter}>
        <Button variant="primary" icon="check" counter data-testid="counter-button">
          {copy.counterReady}
        </Button>
        <Button variant="ready" icon="check" counter data-testid="counter-button">
          {copy.counterCollected}
        </Button>
      </Demo>
    </PreviewSection>
  );
}
