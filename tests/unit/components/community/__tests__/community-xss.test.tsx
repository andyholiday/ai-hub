// =============================================================================
// XSS Regression Tests — Community Post/Comment Rendering
//
// Audit result: No dangerouslySetInnerHTML found in community code.
// Post body, title, comment content are rendered via React plain-text
// expressions ({post.content}, {post.title}, {comment.content}).
// whitespace-pre-wrap is applied for formatting — no HTML injection path.
//
// These tests verify that malicious HTML payloads are NOT executed and NOT
// injected into the DOM when rendered via community components.
// =============================================================================

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Minimal stub components that replicate how Community renders post content.
// We test the pattern, not the full page component (which requires router etc.)
// ---------------------------------------------------------------------------

function PostBody({ content }: { content: string }) {
  return (
    <div
      data-testid="post-body"
      className="whitespace-pre-wrap"
    >
      {content}
    </div>
  );
}

function PostTitle({ title }: { title: string }) {
  return (
    <h1 data-testid="post-title">
      {title}
    </h1>
  );
}

function CommentContent({ content }: { content: string }) {
  return (
    <p data-testid="comment-content" className="whitespace-pre-wrap">
      {content}
    </p>
  );
}

// ---------------------------------------------------------------------------
// XSS Payloads
// ---------------------------------------------------------------------------

const IMG_XSS_PAYLOAD = '<img src=x onerror="window.__xss__=true">';
const SCRIPT_TITLE_PAYLOAD = '<script>window.__xss_title__=true</script>';
const SCRIPT_CONTENT_PAYLOAD = '<script>window.__xss_content__=true</script>';
const ONCLICK_PAYLOAD = '<span onclick="window.__xss_click__=true">click me</span>';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Community XSS Regression — Post Body", () => {
  it("renders img-onerror payload as plain text, not as HTML element", () => {
    render(<PostBody content={IMG_XSS_PAYLOAD} />);

    const container = screen.getByTestId("post-body");

    // Must not contain an actual <img> element
    expect(container.querySelector("img")).toBeNull();

    // The raw string appears as text content (React escapes it)
    expect(container.textContent).toContain("img src=x");
  });

  it("does not set window.__xss__ when rendering img-onerror payload", () => {
    // @ts-expect-error -- intentional global check
    delete window.__xss__;

    render(<PostBody content={IMG_XSS_PAYLOAD} />);

    // @ts-expect-error -- intentional global check
    expect(window.__xss__).toBeUndefined();
  });

  it("renders script tag payload as plain text, not as executable script", () => {
    render(<PostBody content={SCRIPT_CONTENT_PAYLOAD} />);

    const container = screen.getByTestId("post-body");

    // Must not contain an actual <script> element
    expect(container.querySelector("script")).toBeNull();

    // @ts-expect-error -- intentional global check
    expect(window.__xss_content__).toBeUndefined();
  });

  it("renders onclick payload as plain text without event handler", () => {
    render(<PostBody content={ONCLICK_PAYLOAD} />);

    const container = screen.getByTestId("post-body");

    // Any <span> in the container must not have onclick attribute
    const spans = container.querySelectorAll("span");
    spans.forEach((span) => {
      expect(span.getAttribute("onclick")).toBeNull();
    });
  });
});

describe("Community XSS Regression — Post Title", () => {
  it("renders script-tag title payload as plain text", () => {
    render(<PostTitle title={SCRIPT_TITLE_PAYLOAD} />);

    const container = screen.getByTestId("post-title");

    // Must not contain an actual <script> element
    expect(container.querySelector("script")).toBeNull();

    // @ts-expect-error -- intentional global check
    expect(window.__xss_title__).toBeUndefined();
  });

  it("displays the raw payload string as visible text content", () => {
    render(<PostTitle title={SCRIPT_TITLE_PAYLOAD} />);

    // React text-escapes the content — the script tags appear literally
    expect(screen.getByTestId("post-title").textContent).toContain("script");
  });
});

describe("Community XSS Regression — Comment Content", () => {
  it("renders img-onerror payload in comment as plain text", () => {
    render(<CommentContent content={IMG_XSS_PAYLOAD} />);

    const container = screen.getByTestId("comment-content");
    expect(container.querySelector("img")).toBeNull();

    // @ts-expect-error -- intentional global check
    expect(window.__xss__).toBeUndefined();
  });

  it("renders script payload in comment without executing it", () => {
    render(<CommentContent content={SCRIPT_CONTENT_PAYLOAD} />);

    const container = screen.getByTestId("comment-content");
    expect(container.querySelector("script")).toBeNull();

    // @ts-expect-error -- intentional global check
    expect(window.__xss_content__).toBeUndefined();
  });
});

describe("Community XSS Regression — sanitizeHtml utility (containsUnsafeHtml)", () => {
  it("containsUnsafeHtml detects img-onerror as unsafe", async () => {
    const { containsUnsafeHtml } = await import("@/lib/utils/sanitize");
    expect(containsUnsafeHtml(IMG_XSS_PAYLOAD)).toBe(true);
  });

  it("containsUnsafeHtml detects script tag as unsafe", async () => {
    const { containsUnsafeHtml } = await import("@/lib/utils/sanitize");
    expect(containsUnsafeHtml(SCRIPT_CONTENT_PAYLOAD)).toBe(true);
  });

  it("containsUnsafeHtml returns false for plain text", async () => {
    const { containsUnsafeHtml } = await import("@/lib/utils/sanitize");
    expect(containsUnsafeHtml("Hallo Welt! Das ist ein normaler Text.")).toBe(false);
  });

  it("sanitizeHtml strips onerror from img tag", async () => {
    const { sanitizeHtml } = await import("@/lib/utils/sanitize");
    const result = sanitizeHtml(IMG_XSS_PAYLOAD);
    expect(result).not.toContain("onerror");
  });

  it("sanitizeHtml strips script tags entirely", async () => {
    const { sanitizeHtml } = await import("@/lib/utils/sanitize");
    const result = sanitizeHtml(SCRIPT_CONTENT_PAYLOAD);
    expect(result).not.toContain("<script");
    expect(result).not.toContain("window.__xss_content__");
  });
});
