import { expect, test } from "bun:test";
import { devPagesAllowed } from "./devPagesPolicy";

test("on in development, off in a production build", () => {
  expect(devPagesAllowed({ NODE_ENV: "development" })).toBe(true);
  expect(devPagesAllowed({ NODE_ENV: "production" })).toBe(false);
});

test("DEV_PAGES=true turns them on for a local production build", () => {
  expect(devPagesAllowed({ NODE_ENV: "production", DEV_PAGES: "true" })).toBe(true);
  expect(devPagesAllowed({ NODE_ENV: "production", DEV_PAGES: "1" })).toBe(false);
});

test("never on a Vercel production deployment, whatever DEV_PAGES says", () => {
  expect(devPagesAllowed({ NODE_ENV: "production", VERCEL_ENV: "production", DEV_PAGES: "true" })).toBe(false);
  expect(devPagesAllowed({ NODE_ENV: "development", VERCEL_ENV: "production" })).toBe(false);
});
