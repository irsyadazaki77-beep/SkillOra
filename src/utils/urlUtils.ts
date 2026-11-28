/**
 * Shared URL validation and sanitization helpers used across server and client
 * to ensure external links only use safe HTTP/HTTPS protocols.
 */

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export function isSafeHttpUrl(rawUrl: unknown): rawUrl is string {
  if (typeof rawUrl !== "string") return false;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > 2048) return false;

  try {
    const parsed = new URL(trimmed);
    return ALLOWED_PROTOCOLS.has(parsed.protocol.toLowerCase());
  } catch {
    return false;
  }
}

export function assertSafeHttpUrl(rawUrl: unknown, fieldLabel = "URL"): string {
  if (typeof rawUrl !== "string") {
    throw new Error(`${fieldLabel} tidak valid.`);
  }
  const trimmed = rawUrl.trim();
  if (!isSafeHttpUrl(trimmed)) {
    throw new Error(`${fieldLabel} harus menggunakan tautan http:// atau https:// yang valid.`);
  }
  return trimmed;
}

export function assertOptionalSafeHttpUrl(
  rawUrl: unknown,
  fieldLabel = "URL"
): string | undefined {
  if (rawUrl === undefined || rawUrl === null) return undefined;
  if (typeof rawUrl !== "string") {
    throw new Error(`${fieldLabel} tidak valid.`);
  }
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  if (!isSafeHttpUrl(trimmed)) {
    throw new Error(`${fieldLabel} harus menggunakan tautan http:// atau https:// yang valid.`);
  }
  return trimmed;
}

export function toSafeExternalUrl(rawUrl?: string | null): string | undefined {
  if (!rawUrl || typeof rawUrl !== "string") return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;

  // Allow safe internal relative paths without protocol tricks
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  return isSafeHttpUrl(trimmed) ? trimmed : undefined;
}
