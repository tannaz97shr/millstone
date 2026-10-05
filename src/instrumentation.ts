// Runs once when the Next server starts. The Node-only part lives in its own
// file, so the Edge bundle (proxy.ts) never compiles it.

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { checkFirebaseBackend } = await import("./instrumentation-node");
    checkFirebaseBackend();
  }
}
