import { describe, expect, test } from "bun:test";
import { decideCronAuth } from "./cronAuth";

const SECRET = "a-long-enough-test-secret-0123456789";

describe("decideCronAuth", () => {
  test("the exact bearer header is allowed", () => {
    expect(decideCronAuth(`Bearer ${SECRET}`, SECRET)).toBe("allowed");
  });

  test("no header, a wrong secret, another scheme or extra spaces are denied", () => {
    expect(decideCronAuth(null, SECRET)).toBe("denied");
    expect(decideCronAuth("", SECRET)).toBe("denied");
    expect(decideCronAuth(`Bearer ${SECRET}x`, SECRET)).toBe("denied");
    expect(decideCronAuth(SECRET, SECRET)).toBe("denied");
    expect(decideCronAuth(`Basic ${SECRET}`, SECRET)).toBe("denied");
    expect(decideCronAuth(`Bearer  ${SECRET}`, SECRET)).toBe("denied");
    expect(decideCronAuth(`bearer ${SECRET}`, SECRET)).toBe("denied");
  });

  test("an unset, blank or short secret turns the job off, whatever the header says", () => {
    expect(decideCronAuth("Bearer ", undefined)).toBe("not_configured");
    expect(decideCronAuth("Bearer ", "")).toBe("not_configured");
    expect(decideCronAuth("Bearer    ", "   ")).toBe("not_configured");
    expect(decideCronAuth("Bearer short", "short")).toBe("not_configured");
  });
});
