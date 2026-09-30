import { Button } from "@/shared/components/atoms/Button/Button";
import { Notice } from "@/shared/components/molecules/Notice/Notice";
import { devComponentsContent } from "../../content/devComponents";
import { DismissibleNotice } from "../demos/ControlledDemos";
import { PreviewSection } from "../PreviewSection";

const content = devComponentsContent;
const copy = content.notice;

export function NoticeSection() {
  return (
    <PreviewSection id="notice" title={content.sections.notice}>
      <DismissibleNotice />
      <Notice icon="check" title={copy.neutralCheckTitle}>
        {copy.neutralCheckBody}
      </Notice>
      <Notice tone="error" title={copy.errorTitle}>
        {copy.errorBody}
      </Notice>
      <Notice
        tone="success"
        className="self-start"
        action={
          <Button icon="refund" aria-label={copy.undoLabel}>
            {copy.undo}
          </Button>
        }
      >
        <strong>{copy.success}</strong>
      </Notice>
      <Notice tone="warning" role="note" title={copy.warningTitle}>
        {copy.warningBody}
      </Notice>
      <Notice tone="info" role="note">
        {copy.info}
      </Notice>
    </PreviewSection>
  );
}
