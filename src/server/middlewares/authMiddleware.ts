import { Request, Response, NextFunction } from "express";
import { adminAuth } from "../../lib/firebase-admin.js";
import { UserRepository } from "../repositories/UserRepository.js";

export type AccountRole = "student" | "mentor" | "recruiter" | "admin";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  accountRole?: AccountRole;
  dbUserId?: number;
}

/**
 * User Identity Context Middleware
 * Populates req.userId, req.userEmail, req.userRole, req.accountRole if a valid token is provided.
 * Does NOT throw if token is missing.
 * Throws 401 if a token is present but invalid/malformed.
 */
export const userContextMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split("Bearer ")[1]?.trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Token format tidak valid" }
      });
    }

    if (token === "guest-demo-token") {
      req.userId = "user-dev-default";
      req.userEmail = "guest@skillora.app";
      req.userName = "Tamu Skillora";
      req.userRole = "Guest";
      req.accountRole = "student";

      try {
        const guestRow = await UserRepository.getOrCreateUser(req.userId, req.userEmail, req.userName);
        if (guestRow) {
          req.dbUserId = guestRow.id;
          req.accountRole = (guestRow.accountRole as AccountRole) || "student";
        }
      } catch (err) {
        console.warn("Guest creation warning:", err);
      }
      return next();
    }

    try {
      if (adminAuth) {
        const decodedToken = await adminAuth.verifyIdToken(token);
        if (decodedToken && decodedToken.uid) {
          req.userId = decodedToken.uid;
          req.userEmail = decodedToken.email || "user@skillora.app";
          req.userName = decodedToken.name || decodedToken.email || "Siswa";

          const userRow = await UserRepository.getOrCreateUser(req.userId, req.userEmail, req.userName);
          req.userRole = userRow.role;
          req.accountRole = (userRow.accountRole as AccountRole) || "student";
          req.dbUserId = userRow.id;
          return next();
        }
      }

      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Verifikasi token gagal atau layanan Firebase Admin tidak tersedia." }
      });
    } catch (err: any) {
      console.warn("Token verification failed:", err.message);
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: `Token tidak valid atau kedaluwarsa: ${err.message}` }
      });
    }
  }

  return next();
};

export const optionalAuth = userContextMiddleware;

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Autentikasi diperlukan. Silakan login terlebih dahulu." }
    });
  }
  next();
};

export const requireAuthToken = requireAuth;

export const requireRegistered = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Autentikasi diperlukan." }
    });
  }

  if (req.userRole === "Guest" || req.userId === "user-dev-default" || req.userEmail === "guest@skillora.app") {
    return res.status(403).json({
      success: false,
      error: { code: "FORBIDDEN", message: "Aksi ditolak. Tamu / Mode Demo tidak memiliki izin untuk melakukan perubahan data." }
    });
  }

  next();
};

export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Autentikasi diperlukan." }
    });
  }

  try {
    const userRow = await UserRepository.getOrCreateUser(req.userId, req.userEmail || "user@skillora.app", req.userName || "Siswa");
    const role = userRow.role;
    const accRole = userRow.accountRole;

    if (!["Admin", "Developer"].includes(role) && accRole !== "admin") {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Akses ditolak. Diperlukan hak akses Admin/Developer." }
      });
    }

    req.userRole = role;
    req.accountRole = (accRole as AccountRole) || "admin";
    next();
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: err.message }
    });
  }
};

/**
 * Role-Based Access Control (RBAC) guard reading authoritative accountRole from PostgreSQL.
 */
export const requireAccountRole = (...allowedRoles: AccountRole[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Autentikasi diperlukan." }
      });
    }

    if (req.userRole === "Guest" || req.userId === "user-dev-default") {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Silakan masuk dengan akun terdaftar untuk mengakses portal peran ini." }
      });
    }

    try {
      const userRow = await UserRepository.getOrCreateUser(req.userId, req.userEmail || "user@skillora.app", req.userName || "Siswa");
      const accRole = (userRow.accountRole as AccountRole) || "student";
      const isLegacyAdmin = ["Admin", "Developer"].includes(userRow.role);

      if (!allowedRoles.includes(accRole) && accRole !== "admin" && !isLegacyAdmin) {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: `Akses ditolak. Fitur ini khusus untuk peran: ${allowedRoles.join(", ")}.`
          }
        });
      }

      req.accountRole = accRole;
      req.userRole = userRow.role;
      req.dbUserId = userRow.id;
      next();
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message }
      });
    }
  };
};
