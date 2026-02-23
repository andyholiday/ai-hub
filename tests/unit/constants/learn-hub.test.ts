// =============================================================================
// Tests: Learn Hub Constants
// =============================================================================

import { describe, it, expect } from "vitest";
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from "@/constants/learn-hub";

// ---------------------------------------------------------------------------
// DIFFICULTY_LABELS
// ---------------------------------------------------------------------------

describe("DIFFICULTY_LABELS", () => {
  it("should have all three difficulty keys", () => {
    expect(DIFFICULTY_LABELS).toHaveProperty("beginner");
    expect(DIFFICULTY_LABELS).toHaveProperty("intermediate");
    expect(DIFFICULTY_LABELS).toHaveProperty("advanced");
  });

  it("should have exactly 3 entries", () => {
    expect(Object.keys(DIFFICULTY_LABELS)).toHaveLength(3);
  });

  it("should have correct German labels", () => {
    expect(DIFFICULTY_LABELS.beginner).toBe("Einsteiger");
    expect(DIFFICULTY_LABELS.intermediate).toBe("Fortgeschritten");
    expect(DIFFICULTY_LABELS.advanced).toBe("Experte");
  });
});

// ---------------------------------------------------------------------------
// DIFFICULTY_COLORS
// ---------------------------------------------------------------------------

describe("DIFFICULTY_COLORS", () => {
  it("should have all three difficulty keys", () => {
    expect(DIFFICULTY_COLORS).toHaveProperty("beginner");
    expect(DIFFICULTY_COLORS).toHaveProperty("intermediate");
    expect(DIFFICULTY_COLORS).toHaveProperty("advanced");
  });

  it("should have exactly 3 entries", () => {
    expect(Object.keys(DIFFICULTY_COLORS)).toHaveLength(3);
  });

  it("should map to correct color values", () => {
    expect(DIFFICULTY_COLORS.beginner).toBe("green");
    expect(DIFFICULTY_COLORS.intermediate).toBe("gold");
    expect(DIFFICULTY_COLORS.advanced).toBe("red");
  });
});
