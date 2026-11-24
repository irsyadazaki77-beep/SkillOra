import { describe, it, expect, vi, beforeEach } from "vitest";
import { userContextMiddleware, requireAuth, requireRegistered, requireAdmin, AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import { adminAuth } from "../../lib/firebase-admin.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { UserService } from "../services/userService.js";

// Mock dependencies
vi.mock("../../lib/firebase-admin.js", () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
  },
}));

vi.mock("../repositories/UserRepository.js", () => ({
  UserRepository: {
    getOrCreateUser: vi.fn(),
    getFullProfile: vi.fn(),
    updateUserRow: vi.fn(),
  },
}));

describe("Security Hardening Regression Tests", () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: any;
  let nextFunction: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      headers: {},
      body: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    nextFunction = vi.fn();
  });

  // 1. Missing Token Test
  it("should handle missing token: req.userId remains undefined and requireAuth fails with 401", async () => {
    // Run userContextMiddleware with no header
    await userContextMiddleware(mockReq as AuthenticatedRequest, mockRes, nextFunction);

    expect(mockReq.userId).toBeUndefined();
    expect(nextFunction).toHaveBeenCalled();

    // Now attempt requireAuth
    nextFunction.mockClear();
    await requireAuth(mockReq as AuthenticatedRequest, mockRes, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "UNAUTHORIZED",
        }),
      })
    );
  });

  // 2. Invalid Token Test
  it("should handle invalid token: returns 401 and rejects signature", async () => {
    mockReq.headers = { authorization: "Bearer invalid-sig-token" };
    vi.mocked(adminAuth.verifyIdToken).mockRejectedValueOnce(new Error("Signature verification failed"));

    await userContextMiddleware(mockReq as AuthenticatedRequest, mockRes, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "UNAUTHORIZED",
          message: expect.stringContaining("Signature verification failed"),
        }),
      })
    );
  });

  // 3. Malformed Token Test
  it("should handle malformed token: returns 401", async () => {
    mockReq.headers = { authorization: "Bearer " }; // Empty token

    await userContextMiddleware(mockReq as AuthenticatedRequest, mockRes, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  // 4. Valid User Test
  it("should handle valid user token: resolves identity and permits access", async () => {
    mockReq.headers = { authorization: "Bearer valid-firebase-token" };
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValueOnce({
      uid: "user-123",
      email: "siswa@skillora.app",
      name: "Siswa Berprestasi",
    } as any);

    vi.mocked(UserRepository.getOrCreateUser).mockResolvedValueOnce({
      id: 12,
      uid: "user-123",
      role: "Pelajar Siap Kerja",
    } as any);

    await userContextMiddleware(mockReq as AuthenticatedRequest, mockRes, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockReq.userId).toBe("user-123");
    expect(mockReq.userEmail).toBe("siswa@skillora.app");
    expect(mockReq.userRole).toBe("Pelajar Siap Kerja");

    // requireAuth passes
    nextFunction.mockClear();
    await requireAuth(mockReq as AuthenticatedRequest, mockRes, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });

  // 5. Guest Token Test (Explicit)
  it("should handle explicit guest token and block writing mutations", async () => {
    mockReq.headers = { authorization: "Bearer guest-demo-token" };
    vi.mocked(UserRepository.getOrCreateUser).mockResolvedValueOnce({
      id: 1,
      uid: "user-dev-default",
      role: "Guest",
    } as any);

    await userContextMiddleware(mockReq as AuthenticatedRequest, mockRes, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockReq.userId).toBe("user-dev-default");
    expect(mockReq.userRole).toBe("Guest");

    // requireAuth should pass for guest
    nextFunction.mockClear();
    await requireAuth(mockReq as AuthenticatedRequest, mockRes, nextFunction);
    expect(nextFunction).toHaveBeenCalled();

    // requireRegistered must reject guest with 403
    nextFunction.mockClear();
    await requireRegistered(mockReq as AuthenticatedRequest, mockRes, nextFunction);
    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "FORBIDDEN",
        }),
      })
    );
  });

  // 6. User Trying Role Escalation Test
  it("should block user trying role escalation", async () => {
    vi.mocked(UserRepository.getOrCreateUser).mockResolvedValueOnce({
      id: 12,
      uid: "user-123",
      role: "Pelajar Siap Kerja",
    } as any);

    // Attempting settings update with role property
    const attackPayload = {
      name: "Attacker",
      role: "Admin",
    };

    await expect(
      UserService.updateSettings("user-123", attackPayload)
    ).rejects.toThrow("Aksi ditolak: Anda tidak diizinkan memodifikasi parameter sistem.");

    // Attempting syncUser with gems parameter
    const attackPayload2 = {
      gems: 9999,
    };

    await expect(
      UserService.syncUser("user-123", attackPayload2)
    ).rejects.toThrow("Aksi ditolak: Anda tidak diizinkan memodifikasi parameter sistem.");
  });

  // 7. User Trying to Access Developer Route Test
  it("should block standard user trying to access developer routes with 403", async () => {
    mockReq.userId = "user-123";
    mockReq.userEmail = "siswa@skillora.app";
    mockReq.userName = "Siswa";

    // Standard role return
    vi.mocked(UserRepository.getOrCreateUser).mockResolvedValueOnce({
      id: 12,
      uid: "user-123",
      role: "Pelajar Siap Kerja",
    } as any);

    await requireAdmin(mockReq as AuthenticatedRequest, mockRes, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "FORBIDDEN",
          message: expect.stringContaining("Diperlukan hak akses Admin/Developer"),
        }),
      })
    );
  });

  // 8. Valid Admin/Developer Route Access Test
  it("should permit access to developer/admin routes for authorized staff", async () => {
    mockReq.userId = "admin-999";
    mockReq.userEmail = "admin@skillora.app";
    mockReq.userName = "Super Admin";

    // Admin role return
    vi.mocked(UserRepository.getOrCreateUser).mockResolvedValueOnce({
      id: 99,
      uid: "admin-999",
      role: "Admin",
    } as any);

    await requireAdmin(mockReq as AuthenticatedRequest, mockRes, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  // 9. Guest Demo Token Blocked in Production
  it("should reject guest-demo-token when NODE_ENV is production and ALLOW_GUEST_DEMO is not true", async () => {
    const prevNodeEnv = process.env.NODE_ENV;
    const prevAllow = process.env.ALLOW_GUEST_DEMO;
    process.env.NODE_ENV = "production";
    delete process.env.ALLOW_GUEST_DEMO;

    try {
      mockReq.headers = { authorization: "Bearer guest-demo-token" };
      await userContextMiddleware(mockReq as AuthenticatedRequest, mockRes, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: "UNAUTHORIZED" }),
        })
      );
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
      if (prevAllow !== undefined) process.env.ALLOW_GUEST_DEMO = prevAllow;
    }
  });

  // 10. Locked Avatar Bypass Prevention
  it("should reject setAvatar if avatar is not in unlockedAvatars", async () => {
    vi.mocked(UserRepository.getOrCreateUser).mockResolvedValueOnce({
      id: 12,
      uid: "user-123",
      unlockedAvatars: ["🦁"],
    } as any);

    await expect(UserService.setAvatar("user-123", "🚀")).rejects.toThrow(
      "Avatar belum dibuka"
    );
  });
});
