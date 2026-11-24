import type { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function globalErrorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = typeof err?.statusCode === "number" ? err.statusCode : 500;
  const code = err?.code || (statusCode >= 500 ? "SERVER_ERROR" : "BAD_REQUEST");
  const isProd = process.env.NODE_ENV === "production";

  if (statusCode >= 500) {
    console.error("[API Error]", err);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message:
        isProd && statusCode >= 500
          ? "Terjadi kesalahan internal pada server. Silakan coba lagi nanti."
          : err?.message || "Terjadi kesalahan pada permintaan.",
    },
  });
}
