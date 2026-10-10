// C5 Checkout, from design/customer/Checkout.dc.html, CheckoutErrors.dc.html
// and CheckoutPayFailed.dc.html.

export const checkoutContent = {
  page: {
    back: "Your order",
    title: "Checkout",
    /** Not designed, as on C4. */
    loading: "Loading your order…",
    checking: (day: string) => `Checking prices for ${day}…`,
    /** Not designed: the moment between Place order succeeding and C7 opening. */
    opening: "Your order is placed. Opening your confirmation…",
    loadError: "We couldn't load your order's prices. Check your connection and try again.",
    retry: "Try again",
    /** CheckoutPayFailed: back from the payment page without paying (AC-C6). */
    paymentCancelled: {
      title: "Your payment wasn't completed",
      body: "You haven't been charged, and your order and details are just as you left them. Try again, or choose Pay at pickup.",
    },
  },

  summary: {
    title: (day: string, branch: string) => `Pickup ${day} at ${branch}`,
    edit: "Edit",
    editLabel: "Edit your order",
    line: (quantity: number, name: string) => `${quantity} × ${name}`,
  },

  details: {
    title: "Your details",
    guestNote: "No account needed. We'll only use these to reach you about this order.",
    /** CheckoutSignedIn.dc.html. */
    signedIn: (name: string) =>
      `Signed in as ${name}. We've filled these in from your account. Changes here are just for this order.`,
    haveAccount: "Have an account?",
    signIn: "Sign in",
    name: { label: "Name" },
    phone: { label: "Mobile number", hint: "So we can call if something changes." },
    email: {
      label: "Email",
      hint: "We'll send your confirmation here.",
      /** Undesigned: the live site sends no email yet (no provider). */
      hintNoEmail: "So we can reach you about your order.",
    },
    notes: { label: "Notes for the bakery", hint: "Like “Sliced, please”." },
  },

  payment: {
    regionLabel: "Payment",
    question: "How would you like to pay?",
    online: {
      label: "Pay online now",
      hint: "Pay by card on a secure payment page, then come back here.",
    },
    atPickup: { label: "Pay at pickup", hint: "Pay at the counter when you collect your order." },
    /** Not designed: shown only while payments run on Stripe's test keys. */
    testNote: {
      title: "Test payments only.",
      body: "No real money moves. To try paying online, use card 4242 4242 4242 4242 with any future date and any CVC.",
    },
  },

  bar: {
    label: "Place your order",
    total: "Total",
    place: "Place order",
    continueToPayment: "Continue to payment",
    /** Not designed. */
    placing: "Placing your order…",
    /** Not designed: on the way to the payment page. */
    openingPayment: "Opening the payment page…",
    errorSummary: (count: number) =>
      count === 1 ? "Fix the 1 thing marked above." : `Fix the ${count} things marked above.`,
  },

  /** What the server said after Place order. None of these are designed. */
  outcome: {
    priceChanged: (total: string) =>
      `Some prices have changed since you started. Your total is now ${total}. Check your order, then place it again.`,
    failed: {
      title: "We couldn't place your order",
      body: "Check your connection and try again. Everything you've typed is still here.",
      retry: "Try again",
    },
    rateLimited: {
      /** `minutes` from Retry-After; null when unknown (the limit's window is an hour). */
      body: (minutes: number | null) =>
        `You've tried a lot of times from this connection. Your order and details are still here. Try again in ${
          minutes === null ? "an hour" : minutes === 1 ? "1 minute" : `${minutes} minutes`
        }, or call `,
      call: (branch: string) => `${branch} on `,
      after: " to order.",
    },
    paymentUnavailable: {
      title: "We couldn't open the payment page",
      body: "You haven't been charged. Try again, or choose Pay at pickup.",
      retry: "Try again",
      atPickup: "Pay at pickup",
    },
    keyMismatch: {
      title: (orderNumber: string) => `Your earlier order ${orderNumber} was already placed`,
      body: "It went through before you changed your order. See that order, or place what's in your order now as a new one.",
      see: (orderNumber: string) => `See order ${orderNumber}`,
      placeNew: "Place as a new order",
    },
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
