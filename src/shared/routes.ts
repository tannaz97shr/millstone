// Single source of truth for page paths. Never hand-build a path elsewhere;
// add a helper here for anything with params.

export const routes = {
  home: "/",
  admin: {
    home: "/admin",
  },
  dev: {
    tokens: "/dev/tokens",
  },
} as const;
