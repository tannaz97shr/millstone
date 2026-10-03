// Single source of truth for page paths. Never hand-build a path elsewhere;
// add a helper here for anything with params.

export const routes = {
  home: "/",
  /** C2: a branch's menu, optionally for a pickup date ("YYYY-MM-DD"). */
  menu: (branchId: string, date?: string | null) => {
    const path = `/menu/${encodeURIComponent(branchId)}`;
    return date ? `${path}?${new URLSearchParams({ date })}` : path;
  },
  cart: "/cart",
  checkout: "/checkout",
  admin: {
    home: "/admin",
  },
  dev: {
    tokens: "/dev/tokens",
    components: "/dev/components",
  },
} as const;
