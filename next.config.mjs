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
};

export default nextConfig;
