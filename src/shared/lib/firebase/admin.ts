import "server-only";
import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { isUsingEmulator, readFirebaseEnv } from "./env";

// Server-only Firebase Admin. Initialised lazily and once, so hot reloads and
// scripts reuse the same app.

function firebaseApp(): App {
  if (getApps().length > 0) return getApp();

  const env = readFirebaseEnv();
  // With FIRESTORE_EMULATOR_HOST / FIREBASE_STORAGE_EMULATOR_HOST set, the SDK
  // routes to the emulator by itself and needs no credentials.
  const credential =
    !isUsingEmulator(env) && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY
      ? cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        })
      : undefined;

  return initializeApp({
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
    credential,
  });
}

let db: Firestore | undefined;

export function getDb(): Firestore {
  db ??= getFirestore(firebaseApp());
  return db;
}

export function getBucket() {
  return getStorage(firebaseApp()).bucket();
}
