// C7 Confirmation and C13 email: the same details in the same words, from
// design/customer/Confirmation.dc.html (ConfGuestPickup) and Email.dc.html.

export const confirmationContent = {
  page: {
    /** Not designed: C7 loading in the browser, or failing to. */
    loading: "Loading your order…",
    loadError: "We couldn't load your order. Check your connection and try again.",
    retry: "Try again",
    notFound: "We couldn't find that order. Check the link in your confirmation email.",
  },

  title: "Your order is in",
  /** "Ready from" (spec 13) isn't in the canvases; it joins the design's sentence. */
  intro: (firstName: string, branch: string, readyFrom: string, day: string) =>
    `Thanks, ${firstName}. We'll have it ready at ${branch} from ${readyFrom} on ${day}.`,

  orderNumber: {
    regionLabel: "Order number",
    label: "Order number",
    hint: "Say this number at the counter when you pick up.",
  },

  pickup: {
    title: "Pickup",
    branchName: (branch: string) => `Millstone ${branch}`,
    directions: "Get directions",
  },

  items: {
    /** The email's heading; C7 lists them inside the Pickup card. */
    title: "Your order",
    line: (quantity: number, name: string) => `${quantity} × ${name}`,
    total: "Total",
  },

  payment: {
    paid: { label: "Paid", note: () => "Paid online. Nothing to pay at the counter." },
    unpaid: {
      label: "Pay at pickup",
      note: (total: string) => `Pay ${total} at the counter when you collect.`,
    },
  },

  change: {
    title: "Need to change or cancel?",
    call: (branch: string) => `Call ${branch} on `,
    after: ". Orders can't be changed online.",
  },

  emailed: "We've emailed these details to ",
  backToMenu: "Back to the menu",

  email: {
    fromName: (branch: string) => `Millstone ${branch}`,
    /** AC-C11. */
    subject: (orderNumber: string, day: string) => `Your Millstone order ${orderNumber} for ${day}`,
    /** AC-C11's wording, as in Email.dc.html. */
    preheader: {
      paid: (branch: string) => `Pickup at ${branch}. Paid online, nothing to pay at the counter.`,
      unpaid: (branch: string, total: string) => `Pickup at ${branch}. Pay ${total} when you collect.`,
    },
    wordmark: "Millstone",
    footer: {
      branches: "Millstone bakeries in Northcote, Fitzroy and Brunswick.",
      why: (orderNumber: string) =>
        `You're getting this email because you placed order ${orderNumber} with Millstone. It's about your order only, so there's nothing to unsubscribe from.`,
    },
  },
} as const;
