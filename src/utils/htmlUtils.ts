/**
 * Escapes untrusted text before interpolating into HTML document templates.
 */
export function escapeHtml(input?: string | null): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
