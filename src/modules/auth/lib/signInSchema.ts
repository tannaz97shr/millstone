import { z } from "zod";
import { signInContent } from "../content/signInContent";

// One schema for the A1 form, the sign-in API body and the credentials
// provider, so all three accept the same input.

const EMAIL_MAX = 254;
const PASSWORD_MAX = 200;

export const signInFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, signInContent.email.required)
    .max(EMAIL_MAX, signInContent.email.required)
    .pipe(z.email(signInContent.email.required)),
  password: z
    .string()
    .min(1, signInContent.password.required)
    .max(PASSWORD_MAX, signInContent.password.required),
});

export type SignInFormValues = z.input<typeof signInFormSchema>;
export type SignInFormOutput = z.output<typeof signInFormSchema>;

/** The sign-in API body: the form plus where to go afterwards. */
export const signInRequestSchema = signInFormSchema.extend({
  returnTo: z.string().max(2000).optional(),
});

export type SignInRequest = z.input<typeof signInRequestSchema>;

export interface SignInResponse {
  /** A safe admin path to open next. */
  redirectTo: string;
}
