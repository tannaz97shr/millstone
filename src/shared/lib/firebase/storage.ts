import "server-only";
import { randomUUID } from "node:crypto";
import type { ProductImage } from "@/shared/domain";
import { logError } from "@/shared/utils/logError";
import { getBucket } from "./admin";

// Firebase Storage through the Admin SDK. storage.rules stay closed to
// clients: files are served by token-gated download URLs, which work without
// any rule. Paths are always built on the server.

const PRODUCTION_HOST = "https://firebasestorage.googleapis.com";

/** The Firebase download URL for an object, through the emulator when one is set. */
export function storageDownloadUrl(bucket: string, path: string, token: string): string {
  const emulator = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
  const host = emulator ? `http://${emulator}` : PRODUCTION_HOST;
  const params = new URLSearchParams({ alt: "media", token });
  return `${host}/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(path)}?${params}`;
}

/**
 * Saves an image under `path` with a fresh download token and returns where
 * it lives. Cached for a year: a replaced photo gets a new path, never new bytes.
 */
export async function uploadImage(path: string, bytes: Buffer, contentType: string): Promise<ProductImage> {
  const bucket = getBucket();
  const token = randomUUID();
  await bucket.file(path).save(bytes, {
    resumable: false,
    contentType,
    metadata: {
      cacheControl: "public, max-age=31536000, immutable",
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });
  return { path, url: storageDownloadUrl(bucket.name, path, token) };
}

/**
 * Deletes an object. Never throws: a file left behind costs a little storage,
 * a crash here would fail a save that already happened. Logged as a warning.
 */
export async function deleteStoredFile(path: string, context: string): Promise<boolean> {
  try {
    await getBucket().file(path).delete({ ignoreNotFound: true });
    return true;
  } catch (error) {
    logError(error, `deleteStoredFile ${path} (${context})`, { level: "warn" });
    return false;
  }
}
