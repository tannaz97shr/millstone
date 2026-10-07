// Runs in the browser before hydration. Zod's first object parse probes
// `new Function("")` to pick its JIT path; the production CSP (no
// 'unsafe-eval', next.config.mjs) reports that probe as a violation even
// though Zod catches it. jitless skips the probe and the JIT.
import { z } from "zod";

z.config({ jitless: true });
