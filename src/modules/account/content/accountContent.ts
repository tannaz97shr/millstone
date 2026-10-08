// C8 (sign in, create an account), C9 (My account) and C7's "Save your
// details". Copy is from design/customer/Account.dc.html, AccountArea.dc.html
// and Confirmation.dc.html unless marked undesigned.

export const accountContent = {
  errors: {
    name: "Enter your name.",
    nameTooLong: "Enter a name of 100 characters or fewer.",
    phone: "Enter a 10-digit mobile number, like 0491 570 156.",
    email: "Enter your email address, like name@example.com.",
    passwordRequired: "Enter your password.",
    passwordTooShort: "Use at least 8 characters.",
    /** Undesigned: past the 200-character cap. */
    passwordTooLong: "Use 200 characters or fewer.",
  },
} as const;
