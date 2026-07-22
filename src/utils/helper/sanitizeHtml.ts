import DOMPurify from "isomorphic-dompurify";

/**
 * Strict allowlist-based HTML sanitizer for AI-generated content.
 * Regex-based stripping (e.g. removing only <script>/<style>) is insufficient
 * because it misses vectors like <img onerror>, <iframe>, SVG onload handlers,
 * event attributes and data: URIs. DOMPurify with a strict allowlist removes
 * every tag and attribute that is not explicitly permitted.
 */

// Basic text-formatting tags only. No images, links, iframes, or media.
const ALLOWED_TAGS = ["p", "strong", "b", "em", "i", "br", "ul", "ol", "li"];

// Strip every attribute: onerror/onload/onclick handlers, style, href, src...
const ALLOWED_ATTR: string[] = [];

export function sanitizeAiHtml(dirty: string): string {
	if (!dirty) return "";
	return DOMPurify.sanitize(dirty, {
		ALLOWED_TAGS,
		ALLOWED_ATTR,
		ALLOW_DATA_ATTR: false,
		ALLOW_ARIA_ATTR: false,
		KEEP_CONTENT: true,
	}) as string;
}
