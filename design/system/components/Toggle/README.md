# Toggle

An on/off switch that always writes its state out in words beside the switch, for non-technical staff.

**Props:** `label`, `checked` + `onChange` or `defaultChecked`, `onText` / `offText` (default "On" / "Off" — say what it means: "On the menu" / "Off the menu"), `disabled`.

- Use on the admin's branch-availability list and for settings that take effect immediately. It is not for form submissions — use ChoiceGroup there.
- On is `crust` with the state text in `crust`; off is an empty `flour-sunk` track. Position, fill and the words all change, never colour alone.
- On the admin it is 72 × 40 inside a 64px row.
