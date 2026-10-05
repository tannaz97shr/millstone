import type { SeedTarget } from "./guard";

// `--reset`: wipes the emulator before seeding. resolveSeedTarget never
// allows it on a real project; this checks again, so nothing here can reach
// the live project.

/** Deletes every Firestore document in the emulator (emulator-only endpoint). */
async function resetEmulator(projectId: string, emulatorHost: string): Promise<void> {
  const url = `http://${emulatorHost}/emulator/v1/projects/${projectId}/databases/(default)/documents`;
  const response = await fetch(url, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`Emulator reset failed: ${response.status} ${response.statusText}`);
  }
}

/** Wipes the emulator and says so. Anything else is refused. */
export async function resetTarget(target: SeedTarget): Promise<void> {
  if (!target.emulatorHost) {
    throw new Error(`Reset refused: ${target.projectId} isn't the emulator.`);
  }
  await resetEmulator(target.projectId, target.emulatorHost);
  console.log("Emulator Firestore wiped.");
}
