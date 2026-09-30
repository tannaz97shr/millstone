import { TextField } from "@/shared/components/molecules/TextField/TextField";
import { devComponentsContent } from "../../content/devComponents";
import { PreviewSection } from "../PreviewSection";

const content = devComponentsContent;
const copy = content.textField;

export function TextFieldSection() {
  return (
    <PreviewSection id="text-field" title={content.sections.textField}>
      <TextField label={copy.name.label} autoComplete="name" />
      <TextField label={copy.name.label} autoComplete="name" error={copy.name.error} />
      <TextField
        label={copy.phone.label}
        hint={copy.phone.hint}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        defaultValue={copy.phone.value}
        error={copy.phone.error}
      />
      <TextField label={copy.email.label} hint={copy.email.hint} type="email" autoComplete="email" />
      <TextField label={copy.notes.label} hint={copy.notes.hint} optional multiline rows={2} />
      <TextField label={copy.disabled.label} defaultValue={copy.disabled.value} disabled />
      <TextField
        label={copy.search.label}
        placeholder={copy.search.placeholder}
        type="search"
        inputMode="search"
      />
    </PreviewSection>
  );
}
