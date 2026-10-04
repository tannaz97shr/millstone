// The admin's header, and what staff see on the owner-only page.

export const adminShellContent = {
  nav: {
    label: "Admin",
    orders: "Orders",
    availability: "Availability",
    products: "Products",
  },
  user: {
    allBranches: "All branches",
    owner: "Signed in as owner",
    staff: (branchName: string) => `Staff · ${branchName}`,
  },
  signOut: "Sign out",
  signOutFailed: "We couldn't sign you out. Check the connection and try again.",
  ownerOnly: {
    title: "This page is for the owner",
    body: "Only the owner can add or change products. Ask them if something needs changing.",
    back: "Back to orders",
  },
} as const;
