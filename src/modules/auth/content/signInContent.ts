// A1 staff sign-in. The layout is C8's sign-in (Account.dc.html) at admin
// size; A1 itself wasn't designed (spec 13), so the intro, the lock message
// and the forgotten-password line are new.

export const signInContent = {
  metadataTitle: "Sign in · Millstone admin",
  title: "Sign in",
  intro: "Sign in with your staff email to see your branch's orders.",
  email: {
    label: "Email",
    required: "Enter your email address, like name@example.com.",
  },
  password: {
    label: "Password",
    required: "Enter your password.",
  },
  submit: "Sign in",
  submitting: "Signing in…",
  /** AC-U2: never says whether the email or the password was wrong. */
  invalid: "That email and password don't match. Check them and try again.",
  forgotten: "Forgotten your password? Ask the owner to reset it.",
  locked: "Too many tries. Wait 15 minutes and try again, or ask the owner.",
  failed: "We couldn't sign you in just now. Check the connection and try again.",
} as const;
