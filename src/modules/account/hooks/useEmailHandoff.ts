"use client";

import { useCallback, useEffect } from "react";
import type { FieldValues, Path, PathValue, UseFormReturn } from "react-hook-form";
import { handOffEmail, takeHandedOffEmail } from "../lib/emailHandoff";

/**
 * C8's two forms share the typed email: on arrival, an email handed over
 * from the other form fills in an empty Email field; `handOff` passes this
 * form's email on before following a link to the other.
 */
export function useEmailHandoff<Values extends FieldValues & { email: string }>(
  form: UseFormReturn<Values, unknown, unknown>,
) {
  const field = "email" as Path<Values>;
  useEffect(() => {
    const email = takeHandedOffEmail();
    if (email && !form.getValues(field)) form.setValue(field, email as PathValue<Values, Path<Values>>);
  }, [form, field]);

  return useCallback(() => handOffEmail(String(form.getValues(field) ?? "")), [form, field]);
}
