import { describe, it, expect, vi } from "vitest";
import { fisherYatesShuffle } from "../utils/shuffle.js";
import { AI_MODELS } from "../config/aiConfig.js";
import { AppError, globalErrorHandler } from "../middlewares/errorHandler.js";

describe("Server Utilities & Middleware Tests", () => {
  it("fisherYatesShuffle preserves all items without mutating the source array", () => {
    const source = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const snapshot = [...source];
    const shuffled = fisherYatesShuffle(source);

    expect(source).toEqual(snapshot);
    expect(shuffled).toHaveLength(source.length);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(source);
  });

  it("AI_MODELS exposes configured text and live model names", () => {
    expect(typeof AI_MODELS.text).toBe("string");
    expect(AI_MODELS.text.length).toBeGreaterThan(0);
    expect(typeof AI_MODELS.live).toBe("string");
    expect(AI_MODELS.live.length).toBeGreaterThan(0);
  });

  it("globalErrorHandler hides internal 500 messages in production", () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const mockRes: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    try {
      globalErrorHandler(new Error("SQL syntax leak: SELECT * FROM users"), {} as any, mockRes, vi.fn());
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: "SERVER_ERROR",
            message: expect.not.stringContaining("SELECT * FROM users"),
          }),
        })
      );
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  it("globalErrorHandler returns structured AppError status and code", () => {
    const mockRes: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    globalErrorHandler(new AppError("Data tidak valid", 422, "VALIDATION_ERROR"), {} as any, mockRes, vi.fn());
    expect(mockRes.status).toHaveBeenCalledWith(422);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Data tidak valid",
      },
    });
  });
});
