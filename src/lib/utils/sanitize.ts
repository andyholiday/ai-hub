// =============================================================================
// HTML Sanitization Utility
// Provides XSS-safe HTML sanitization using DOMPurify via isomorphic-dompurify.
// Works in both SSR (Node.js) and CSR (Browser) environments.
// =============================================================================

import DOMPurify from "isomorphic-dompurify";

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

/**
 * Allowed HTML tags for sanitized content.
 * Covers standard Markdown output elements (headings, lists, tables, code blocks,
 * inline formatting, links, images, and structural elements).
 */
const ALLOWED_TAGS: string[] = [
  // Headings
  "h1", "h2", "h3", "h4", "h5", "h6",
  // Block elements
  "p", "div", "span", "br", "hr",
  "blockquote", "pre", "code",
  // Lists
  "ul", "ol", "li",
  // Tables
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  // Inline formatting
  "strong", "em", "b", "i", "u", "s", "mark", "sub", "sup",
  // Links and media
  "a", "img",
  // Description lists
  "dl", "dt", "dd",
];

/**
 * Allowed HTML attributes.
 * Restricts to safe attributes only -- no event handlers, no style injection.
 */
const ALLOWED_ATTR: string[] = [
  "class",
  "href",
  "src",
  "alt",
  "title",
  "target",
  "rel",
  "width",
  "height",
  "loading",
  // Table attributes
  "colspan",
  "rowspan",
  "scope",
  // Code language class (e.g. language-js)
  "lang",
];

// -----------------------------------------------------------------------------
// DOMPurify Hooks
// -----------------------------------------------------------------------------

/**
 * After sanitizing each element, enforce secure link attributes:
 * - All <a> tags get target="_blank" and rel="noopener noreferrer"
 * - All <img> tags get loading="lazy" if not already set
 */
DOMPurify.addHook("afterSanitizeAttributes", (node: Element) => {
  // Secure all anchor tags
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }

  // Lazy-load images by default
  if (node.tagName === "IMG" && !node.getAttribute("loading")) {
    node.setAttribute("loading", "lazy");
  }
});

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Sanitizes an HTML string, removing all potentially dangerous content.
 *
 * Allows a safe subset of HTML tags and attributes suitable for rendering
 * Markdown-generated content. Automatically enforces secure link attributes
 * (target="_blank", rel="noopener noreferrer") on all anchor tags.
 *
 * @param html - The raw HTML string to sanitize
 * @returns Sanitized HTML string safe for use with dangerouslySetInnerHTML
 *
 * @example
 * ```tsx
 * import { sanitizeHtml } from "@/lib/utils/sanitize";
 *
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(rawHtml) }} />
 * ```
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Disallow any URI schemes other than http, https, mailto
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    // Return a string (not a DOM node)
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  }) as string;
}

/**
 * Checks whether a given HTML string contains potentially dangerous content.
 * Useful for validation or logging purposes.
 *
 * @param html - The HTML string to check
 * @returns true if the HTML was modified (i.e. contained dangerous content)
 */
export function containsUnsafeHtml(html: string): boolean {
  const sanitized = sanitizeHtml(html);
  return sanitized !== html;
}
