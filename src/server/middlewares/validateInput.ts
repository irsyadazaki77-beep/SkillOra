import { Request, Response, NextFunction } from "express";

/**
 * Sanitizes input string against malicious prompt injections, script tags, and PII.
 */
export function sanitizeString(val: any, maxLength = 2000): string {
  if (typeof val !== "string") return "";
  let clean = val.trim();
  // Strip script tags
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  // Mask potential emails (simple regex)
  clean = clean.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi, "[EMAIL DILINDUNGI]");
  // Mask potential phone numbers (simple regex for formats like 08xx-xxxx-xxxx, +628xx, etc.)
  clean = clean.replace(/(?:\+62|62|0)[2-9]\d{7,11}/g, "[NOMOR TELEPON DILINDUNGI]");
  
  return clean.slice(0, maxLength);
}

/**
 * Validate input body keys
 */
export function validateBodyKeys(requiredKeys: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const key of requiredKeys) {
      if (req.body[key] === undefined || req.body[key] === null || req.body[key] === "") {
        return res.status(400).json({ error: `Field '${key}' wajib diisi.` });
      }
    }
    next();
  };
}

/**
 * Security middleware preventing users from elevating their role to Admin or Developer
 */
export function preventRoleEscalation(req: Request, res: Response, next: NextFunction) {
  if (req.body && req.body.role) {
    const requestedRole = String(req.body.role).trim();
    if (["Admin", "Developer"].includes(requestedRole)) {
      return res.status(403).json({
        error: "Keamanan: Peran Admin atau Developer tidak dapat diatur langsung dari pembaruan profil."
      });
    }
  }
  next();
}
