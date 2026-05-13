/// <reference types="vitest/globals" />
// =============================================================================
// Test Setup
// Global test configuration and matchers
// =============================================================================

import "@testing-library/jest-dom/vitest";

// ---------------------------------------------------------------------------
// T01: localStorage polyfill
// jsdom ships a localStorage implementation but its Storage prototype methods
// (clear, getItem, setItem, removeItem) can become detached when the jsdom
// environment is partially reset between test files. Re-attach a minimal
// in-memory implementation before every test so all tests start with a clean,
// fully-functional localStorage.
// ---------------------------------------------------------------------------

function createLocalStorageMock(): Storage {
  let store: Record<string, string> = {};
  return {
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
}

beforeEach(() => {
  // Only install the polyfill when the jsdom localStorage.clear method is
  // missing or non-functional. Tests that install their own mock via
  // Object.defineProperty (e.g. cooldown.test.ts) are intentionally left alone.
  if (typeof window !== "undefined" && typeof window.localStorage?.clear !== "function") {
    Object.defineProperty(window, "localStorage", {
      value: createLocalStorageMock(),
      writable: true,
      configurable: true,
    });
  }
});
