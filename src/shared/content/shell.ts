// Copy for the app shell: brand, metadata, error boundaries and the
// placeholder pages that later steps replace.

export const shellContent = {
  brandName: "Millstone",
  metadata: {
    title: "Millstone",
    adminTitle: "Millstone admin",
    description: "Order ahead from Millstone and pick up at the counter.",
  },
  error: {
    title: "This page didn't load",
    body: "Try again. If it still won't load, call your branch and we'll sort your order out.",
    retry: "Try again",
  },
  notFound: {
    title: "We couldn't find that page",
    body: "The link may be old, or the branch may have moved. Start again from our branches.",
    home: "See our branches",
  },
  placeholders: {
    adminHome: {
      title: "Orders",
      body: "The order list is being built. This page is a placeholder.",
    },
  },
} as const;
