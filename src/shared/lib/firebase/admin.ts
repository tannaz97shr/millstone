import "server-only";
import { applicationDefault, cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { isUsingEmulator, privateKeyPem, readFirebaseEnv } from "./env";
import { dropBlankEmulatorVars } from "./firebaseTarget";

// Server-only Firebase Admin. Initialised lazily and once, so hot reloads and
// scripts reuse the same app.

function firebaseApp(): App {
  // Before every SDK call: the Storage client reads the environment when it's created.
  dropBlankEmulatorVars(process.env);
  if (getApps().length > 0) return getApp();

  const env = readFirebaseEnv();
  const options = {
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
  };

  // With FIRESTORE_EMULATOR_HOST / FIREBASE_STORAGE_EMULATOR_HOST set, the SDK
  // routes to the emulator by itself and needs no credentials. The key must be
  // left out entirely: the SDK rejects an explicit `credential: undefined`.
  if (isUsingEmulator(env)) return initializeApp(options);

  // Vercel passes the service account as variables; a local live run points
  // GOOGLE_APPLICATION_CREDENTIALS at its JSON file, which the SDK reads itself.
  const privateKey = privateKeyPem(env);
  if (env.FIREBASE_CLIENT_EMAIL && privateKey) {
    return initializeApp({
      ...options,
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
  return initializeApp({ ...options, credential: applicationDefault() });
}

let db: Firestore | undefined;

export function getDb(): Firestore {
  db ??= getFirestore(firebaseApp());
  return db;
}

export function getBucket() {
  return getStorage(firebaseApp()).bucket();
}
