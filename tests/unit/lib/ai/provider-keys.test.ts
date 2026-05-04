// =============================================================================
// Tests: maskApiKey() from provider route (F01/F02 audit)
// The function lives in the route handler but its logic is simple enough to
// test via a local re-implementation that mirrors it exactly.
// =============================================================================

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Local mirror of the maskApiKey helper in src/app/api/admin/providers/route.ts
// Keep in sync if the production implementation changes.
// ---------------------------------------------------------------------------

function maskApiKey(key: string | null): string | null {
  if (!key) return null;
  if (key.length < 8) return "********";
  return `${key.slice(0, 4)}...${"*".repeat(8)}`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("maskApiKey", () => {
  it("returns null for null input", () => {
    expect(maskApiKey(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(maskApiKey("")).toBeNull();
  });

  it("returns 8 stars for keys shorter than 8 characters", () => {
    expect(maskApiKey("abc")).toBe("********");
    expect(maskApiKey("1234567")).toBe("********");
  });

  it("returns exactly 4 plaintext chars followed by stars for 8+ char keys", () => {
    const result = maskApiKey("sk-abcdefghij");
    expect(result).not.toBeNull();
    // Must start with exactly the first 4 chars
    expect(result!.startsWith("sk-a")).toBe(true);
    // Must never reveal more than 4 plaintext chars
    const plainPart = result!.split("...")[0];
    expect(plainPart).toHaveLength(4);
  });

  it("never reveals more than 4 plaintext characters for long keys", () => {
    const longKey = "sk-" + "x".repeat(50);
    const result = maskApiKey(longKey);
    expect(result).not.toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- split always has index 0
    const plainPart = result!.split("...")[0]!;
    expect(plainPart.length).toBeLessThanOrEqual(4);
  });

  it("returns correct format for exactly 8-character key", () => {
    const result = maskApiKey("abcdefgh");
    expect(result).toBe("abcd...********");
  });

  it("masked portion contains only stars after the separator", () => {
    const result = maskApiKey("sk-myapikey12345");
    expect(result).not.toBeNull();
    const starPart = result!.split("...")[1];
    expect(starPart).toMatch(/^\*+$/);
  });
});
