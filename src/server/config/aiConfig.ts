/**
 * Centralized Gemini AI model configuration.
 * Override via GEMINI_MODEL and GEMINI_LIVE_MODEL environment variables.
 */
export const AI_MODELS = {
  text: process.env.GEMINI_MODEL || "gemini-4-hydrogen",
  live: process.env.GEMINI_LIVE_MODEL || "gemini-3.8-live",
} as const;
