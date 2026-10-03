// C5 Checkout, from design/customer/Checkout.dc.html and CheckoutErrors.dc.html.

export const checkoutContent = {
  placeholder: {
    title: "Checkout",
    body: "Checkout is being built. This page is a placeholder.",
    back: "Back to your order",
  },

  /** Field errors, shared by the form and the server's schema. Each says how to fix it. */
  errors: {
    name: "Enter your name.",
    /** Not designed. */
    nameTooLong: "Enter a name of 100 characters or fewer.",
    phone: "Enter a 10-digit mobile number, like 0491 570 156.",
    email: "Enter an email address, like name@example.com.",
    /** Not designed: the textarea's maxLength normally stops this. */
    notesTooLong: "Keep notes to 500 characters or fewer.",
    paymentMethod: "Choose how you'd like to pay.",
  },
} as const;
