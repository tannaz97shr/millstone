import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Product photos are Firebase Storage download URLs for this project's bucket
// (src/shared/lib/firebase/storage.ts). Next reads .env* files before this.
const bucket = process.env.FIREBASE_STORAGE_BUCKET;
const bucketPath = bucket ? `/v0/b/${encodeURIComponent(bucket)}/o/**` : "/v0/b/**";
const storageEmulator = process.env.FIREBASE_STORAGE_EMULATOR_HOST;

/** @type {import('next').NextConfig['images']['remotePatterns']} */
const remotePatterns = [{ protocol: "https", hostname: "firebasestorage.googleapis.com", pathname: bucketPath }];
if (storageEmulator) {
  const [hostname, port] = storageEmulator.split(":");
  remotePatterns.push({ protocol: "http", hostname, port, pathname: bucketPath });
}

// A minimal Content Security Policy that works with static rendering (no
// nonces; see node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md,
// "Without Nonces"). Images come through /_next/image, and A5's preview of a
// chosen photo is a blob: URL; fonts are self-hosted by next/font. Production
// builds only: `next dev` needs eval and its own websocket.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: contentSecurityPolicy }] : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root so a stray lockfile higher up the tree isn't picked.
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
  },
  images: {
    remotePatterns,
    // Next 16 refuses to optimise images from local addresses. The Storage
    // emulator is one (127.0.0.1:9199), so allow them only while it's in use.
    dangerouslyAllowLocalIP: Boolean(storageEmulator),
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
