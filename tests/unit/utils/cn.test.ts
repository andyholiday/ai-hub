// =============================================================================
// Tests: cn utility (Class Name Merger)
// =============================================================================

import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils/cn";

describe("cn", () => {
  it("should merge simple class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes via clsx syntax", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("should resolve Tailwind conflicts (last wins)", () => {
    // twMerge should resolve conflicting Tailwind classes
    const result = cn("px-4", "px-8");
    expect(result).toBe("px-8");
  });

  it("should handle undefined and null inputs", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });

  it("should handle empty string inputs", () => {
    expect(cn("foo", "", "bar")).toBe("foo bar");
  });

  it("should handle array inputs", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("should handle object inputs (truthy values)", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("should return empty string for no inputs", () => {
    expect(cn()).toBe("");
  });

  it("should resolve complex Tailwind conflicts", () => {
    // p-4 and p-2 conflict, last wins
    const result = cn("p-4 text-red-500", "p-2 text-blue-500");
    expect(result).toBe("p-2 text-blue-500");
  });
});
