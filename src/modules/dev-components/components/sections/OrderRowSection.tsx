import { devComponentsContent } from "../../content/devComponents";
import { OrderRowDemo } from "../demos/OrderRowDemo";
import { Demo, PreviewSection } from "../PreviewSection";

const content = devComponentsContent;

/** Admin only: OrderRow is built for the counter tablet. */
export function OrderRowSection() {
  return (
    <PreviewSection id="order-row" title={content.sections.orderRow} adminOnly>
      <Demo caption={content.captions.everyStatus} stack>
        <OrderRowDemo />
      </Demo>
    </PreviewSection>
  );
}
