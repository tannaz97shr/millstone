import type { IsoDate } from "@/shared/domain";
import { formatPickupDay } from "@/shared/utils/pickup-dates";
import { devComponentsContent } from "../../content/devComponents";
import {
  CancelDialogDemo,
  ConfirmPaymentDialogDemo,
  SheetDemo,
  WarningDialogDemo,
} from "../demos/ModalDemos";
import { Demo, PreviewSection } from "../PreviewSection";

const content = devComponentsContent;

export function SheetSection() {
  return (
    <PreviewSection id="sheet" title={content.sections.sheet}>
      <Demo caption={content.captions.sheet}>
        <SheetDemo />
      </Demo>
    </PreviewSection>
  );
}

export interface DialogSectionProps {
  pickupDate: IsoDate;
}

export function DialogSection({ pickupDate }: DialogSectionProps) {
  return (
    <PreviewSection id="dialog" title={content.sections.dialog}>
      <Demo caption={content.captions.customerDialog}>
        <WarningDialogDemo />
      </Demo>
      <Demo caption={content.captions.confirmPayment}>
        <ConfirmPaymentDialogDemo />
      </Demo>
      <Demo caption={content.captions.cancelOrder}>
        <CancelDialogDemo pickupDay={formatPickupDay(pickupDate)} />
      </Demo>
    </PreviewSection>
  );
}
