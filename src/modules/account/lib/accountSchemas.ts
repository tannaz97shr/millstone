import { z } from "zod";
import { CONTACT_LIMITS, contactEmailField, mobileField, nameField } from "@/modules/checkout/lib/checkoutSchema";
import { orderIdParam } from "@/modules/orders/lib/orderParams";
import { accountContent } from "../content/accountContent";

// The account rules, shared by the C8/C9/C7 forms and the /api/account
// routes, so the browser and the server accept the same input. Name and
// mobile follow checkout's rules (AC-C4), since an account's details fill in
// checkout.

const errors = accountContent.errors;

export const PASSWORD_LIMITS = { min: 8, max: 200 } as const;

/** Trimmed and lowercased, the form stored on customers. */
export const accountEmailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(CONTACT_LIMITS.email, errors.email)
  .pipe(z.email(errors.email));

/** A password being set (sign-up, C7): at least 8 characters (AC-U1), nothing else required. */
export const newPasswordField = z
  .string()
  .min(PASSWORD_LIMITS.min, errors.passwordTooShort)
  .max(PASSWORD_LIMITS.max, errors.passwordTooLong);

/** A password being checked (sign-in): any non-empty string up to the cap. */
const currentPasswordField = z
  .string()
  .min(1, errors.passwordRequired)
  .max(PASSWORD_LIMITS.max, errors.passwordRequired);

/** Where to go afterwards; checked by safeCustomerReturnPath on the server. */
const returnToField = z.string().max(2000).optional();

export const customerSignInFormSchema = z.object({
  email: accountEmailField,
  password: currentPasswordField,
});
export type CustomerSignInFormValues = z.input<typeof customerSignInFormSchema>;
export type CustomerSignInFormOutput = z.output<typeof customerSignInFormSchema>;

export const customerSignInRequestSchema = customerSignInFormSchema.extend({ returnTo: returnToField });
export type CustomerSignInRequest = z.input<typeof customerSignInRequestSchema>;

export const signUpFormSchema = z.object({
  name: nameField,
  phone: mobileField,
  email: accountEmailField,
  password: newPasswordField,
});
export type SignUpFormValues = z.input<typeof signUpFormSchema>;
export type SignUpFormOutput = z.output<typeof signUpFormSchema>;

export const signUpRequestSchema = signUpFormSchema.extend({ returnTo: returnToField });
export type SignUpRequest = z.input<typeof signUpRequestSchema>;

/** C9 "Your details": checkout's fields and wording, as in AccountArea.dc.html. */
export const profileFormSchema = z.object({
  name: nameField,
  phone: mobileField,
  email: contactEmailField,
});
export type ProfileFormValues = z.input<typeof profileFormSchema>;
export type ProfileFormOutput = z.output<typeof profileFormSchema>;

/** C7 "Save your details": the order's link is the proof; only a password is typed. */
export const fromOrderRequestSchema = z.object({
  orderId: orderIdParam,
  password: newPasswordField,
});
export type FromOrderRequest = z.input<typeof fromOrderRequestSchema>;

/** Sign-in, sign-up and C7's save all answer with where the browser goes next. */
export interface AccountRedirectResponse {
  redirectTo: string;
}
