import rateLimit from "express-rate-limit";

// General API Rate Limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per 15 minutes
  message: { error: "Terlalu banyak permintaan dari IP ini, coba lagi dalam 15 menit." },
  validate: { xForwardedForHeader: false, default: true }
});

// Strict AI Endpoints Rate Limiter
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Max 30 requests per 15 minutes per IP to prevent AI abuse
  message: { error: "Batas penggunaan AI tercapai. Silakan tunggu 15 menit sebelum mencoba lagi." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: true }
});
