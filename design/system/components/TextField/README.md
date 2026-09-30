# TextField

A labelled text input or textarea with an optional hint and an error written as a sentence.

**Props:** `label` (required), `hint`, `error` (a sentence telling people how to fix it), `optional` (adds "(optional)" — required is the default and is not marked), `multiline`, `type`, and any `<input>`/`<textarea>` attribute (`value`, `onChange`, `autoComplete`, `inputMode`…).

- The label always sits above the field — never placeholder-as-label.
- Errors say what to do: "Enter a 10-digit mobile number, like 0491 570 006", not "Invalid phone".
- Use `autoComplete` (`name`, `email`, `tel`) on checkout so phones fill them in.
- On the admin (`data-context="admin"`) it grows to 64px with 20px text — use it for search and the cancel-reason text.
