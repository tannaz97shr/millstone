// C1 Home, from design/customer/Home.dc.html.

export const homeContent = {
  title: "Order ahead, pick up at the counter",
  intro:
    "Choose your Millstone, pick a day, and your order will be waiting for you. No need to call.",

  howTitle: "How it works",
  steps: {
    branch: {
      title: "Choose your branch",
      body: "Each of our three bakeries takes its own orders.",
    },
    day: {
      title: "Pick a day and your bakes",
      /** `cutoff` is "2pm" when every branch shares it, otherwise null. */
      body: (cutoff: string | null) =>
        cutoff
          ? `Order by ${cutoff} for next-day pickup. Come in any time that day.`
          : "Order by your branch's cutoff for next-day pickup. Come in any time that day.",
    },
    pay: {
      title: "Pay online or at pickup",
      body: "Pay now by card, or at the counter when you collect.",
    },
  },

  branchTitle: "Choose your branch",
  branchQuestion: "Which Millstone will you pick up from?",
  branchCutoff: (cutoff: string) => `Order by ${cutoff} for next-day pickup`,
  cartNotice: (itemCount: string) =>
    `Your order has ${itemCount}. If the branch you choose doesn't make something in it, we'll take it out and tell you what.`,
  back: (branch: string) => `Back to the ${branch} menu`,

  go: (branch: string) => `See the ${branch} menu`,
  chooseFirst: "Choose a branch first",

  loading: "Loading our branches…",
  loadError: "We couldn't load our branches. Check your connection and try again.",
  retry: "Try again",
} as const;
