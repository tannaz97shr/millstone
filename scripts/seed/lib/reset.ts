import { getBucket, getDb } from "@/shared/lib/firebase/admin";
import { REAL_PROJECTS_ALLOWED, type SeedTarget } from "./guard";

// `--reset`: wipes the target before seeding. Only ever reached through
// resolveSeedTarget, which allows the emulator or an allow-listed staging project.

/** Product photos live under this prefix (src/modules/products, setProductPhoto). */
const PRODUCT_PHOTOS_PREFIX = "products/";

/** Deletes every Firestore document in the emulator (emulator-only endpoint). */
async function resetEmulator(projectId: string, emulatorHost: string): Promise<void> {
  const url = `http://${emulatorHost}/emulator/v1/projects/${projectId}/databases/(default)/documents`;
  const response = await fetch(url, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`Emulator reset failed: ${response.status} ${response.statusText}`);
  }
}

/** Deletes every collection (with subcollections) and every product photo in a staging project. */
async function resetStagingProject(projectId: string): Promise<void> {
  if (!REAL_PROJECTS_ALLOWED.includes(projectId)) {
    throw new Error(`Reset refused: ${projectId} isn't an allowed staging project.`);
  }
  const db = getDb();
  const collections = await db.listCollections();
  for (const collection of collections) {
    await db.recursiveDelete(collection);
    console.log(`  deleted ${collection.id}`);
  }
  await getBucket().deleteFiles({ prefix: PRODUCT_PHOTOS_PREFIX });
  console.log(`  deleted Storage files under ${PRODUCT_PHOTOS_PREFIX}`);
}

/** Wipes the target and says what it wiped. */
export async function resetTarget(target: SeedTarget): Promise<void> {
  if (target.emulatorHost) {
    await resetEmulator(target.projectId, target.emulatorHost);
    console.log("Emulator Firestore wiped.");
    return;
  }
  await resetStagingProject(target.projectId);
  console.log(`${target.projectId}: Firestore and product photos wiped.`);
}
