// =============================================================================
// Tests: HTML Sanitization Utility
// =============================================================================

import { describe, it, expect } from "vitest";
import { sanitizeHtml, containsUnsafeHtml } from "@/lib/utils/sanitize";

// ---------------------------------------------------------------------------
// sanitizeHtml - XSS Prevention
// ---------------------------------------------------------------------------

describe("sanitizeHtml", () => {
  it("should remove script tags", () => {
    const dirty = '<p>Hello</p><script>alert("xss")</script>';
    const clean = sanitizeHtml(dirty);

    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("alert");
    expect(clean).toContain("<p>Hello</p>");
  });

  it("should remove onclick handlers", () => {
    const dirty = '<button onclick="alert(1)">Click me</button>';
    const clean = sanitizeHtml(dirty);

    expect(clean).not.toContain("onclick");
    expect(clean).not.toContain("alert");
  });

  it("should remove onerror handlers on images", () => {
    const dirty = '<img src="x" onerror="alert(1)" />';
    const clean = sanitizeHtml(dirty);

    expect(clean).not.toContain("onerror");
    expect(clean).not.toContain("alert");
  });

  it("should remove javascript: URIs from links", () => {
    const dirty = '<a href="javascript:alert(1)">Click</a>';
    const clean = sanitizeHtml(dirty);

    expect(clean).not.toContain("javascript:");
  });

  // -------------------------------------------------------------------------
  // Safe HTML Passthrough
  // -------------------------------------------------------------------------

  it("should allow safe HTML tags (p, strong, em, a)", () => {
    const safe =
      '<p>This is <strong>bold</strong> and <em>italic</em> with a <a href="https://example.com">link</a>.</p>';
    const clean = sanitizeHtml(safe);

    expect(clean).toContain("<p>");
    expect(clean).toContain("<strong>bold</strong>");
    expect(clean).toContain("<em>italic</em>");
    expect(clean).toContain("<a ");
    expect(clean).toContain('href="https://example.com"');
  });

  it("should allow heading tags", () => {
    const html = "<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>";
    const clean = sanitizeHtml(html);

    expect(clean).toContain("<h1>Title</h1>");
    expect(clean).toContain("<h2>Subtitle</h2>");
    expect(clean).toContain("<h3>Section</h3>");
  });

  it("should allow list elements", () => {
    const html = "<ul><li>Item 1</li><li>Item 2</li></ul>";
    const clean = sanitizeHtml(html);

    expect(clean).toContain("<ul>");
    expect(clean).toContain("<li>Item 1</li>");
  });

  it("should allow code blocks", () => {
    const html = '<pre><code class="language-js">const x = 1;</code></pre>';
    const clean = sanitizeHtml(html);

    expect(clean).toContain("<pre>");
    expect(clean).toContain("<code");
    expect(clean).toContain("const x = 1;");
  });

  // -------------------------------------------------------------------------
  // Link Security
  // -------------------------------------------------------------------------

  it("should add target=_blank and rel=noopener noreferrer to links", () => {
    const html = '<a href="https://example.com">Link</a>';
    const clean = sanitizeHtml(html);

    expect(clean).toContain('target="_blank"');
    expect(clean).toContain('rel="noopener noreferrer"');
  });

  // -------------------------------------------------------------------------
  // Image Lazy Loading
  // -------------------------------------------------------------------------

  it("should add loading=lazy to images", () => {
    const html = '<img src="https://example.com/img.png" alt="test" />';
    const clean = sanitizeHtml(html);

    expect(clean).toContain('loading="lazy"');
  });
});

// ---------------------------------------------------------------------------
// containsUnsafeHtml
// ---------------------------------------------------------------------------

describe("containsUnsafeHtml", () => {
  it("should return true for HTML with script tags", () => {
    expect(containsUnsafeHtml('<p>OK</p><script>alert("xss")</script>')).toBe(
      true,
    );
  });

  it("should return false for safe HTML", () => {
    expect(containsUnsafeHtml("<p>This is <strong>safe</strong>.</p>")).toBe(
      false,
    );
  });
});
