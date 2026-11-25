export type VideoEmbedKind = "youtube" | "vimeo" | "video" | "unsupported";

export interface ParsedVideoSource {
  kind: VideoEmbedKind;
  embedUrl: string | null;
  originalUrl: string;
}

/**
 * Normalizes a lesson video URL (YouTube, Vimeo, or direct MP4/WebM/OGG)
 * into a safe embed URL, blocking unsafe schemes such as javascript:.
 */
export function parseVideoUrl(rawUrl?: string | null): ParsedVideoSource | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return null;
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

  // YouTube standard, short, embed, and shorts links
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    let videoId = parsed.searchParams.get("v");
    if (!videoId && parsed.pathname.startsWith("/embed/")) {
      videoId = parsed.pathname.split("/embed/")[1]?.split("/")[0] || null;
    }
    if (!videoId && parsed.pathname.startsWith("/shorts/")) {
      videoId = parsed.pathname.split("/shorts/")[1]?.split("/")[0] || null;
    }
    if (videoId && /^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
      return {
        kind: "youtube",
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
        originalUrl: trimmed,
      };
    }
  }

  if (host === "youtu.be") {
    const videoId = parsed.pathname.replace(/^\/+/, "").split("/")[0];
    if (videoId && /^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
      return {
        kind: "youtube",
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
        originalUrl: trimmed,
      };
    }
  }

  // Vimeo links
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const match = parsed.pathname.match(/\/(?:video\/)?(\d+)/);
    if (match?.[1]) {
      return {
        kind: "vimeo",
        embedUrl: `https://player.vimeo.com/video/${match[1]}`,
        originalUrl: trimmed,
      };
    }
  }

  // Direct HTML5 video files
  const lowerPath = parsed.pathname.toLowerCase();
  if (lowerPath.endsWith(".mp4") || lowerPath.endsWith(".webm") || lowerPath.endsWith(".ogg")) {
    return {
      kind: "video",
      embedUrl: trimmed,
      originalUrl: trimmed,
    };
  }

  return {
    kind: "unsupported",
    embedUrl: null,
    originalUrl: trimmed,
  };
}
