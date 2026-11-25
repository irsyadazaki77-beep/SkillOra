import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import publicRoutes from "../routes/publicRoutes.js";
import { db } from "../../db/index.js";

vi.mock("../../db/index.js", () => ({
  db: {
    query: {
      certificates: {
        findFirst: vi.fn(),
      },
    },
  },
}));

describe("Certificate Verification API", () => {
  const testApp = express();
  testApp.use("/api", publicRoutes);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 for non-existent certificate (forgery attempt)", async () => {
    vi.mocked(db.query.certificates.findFirst).mockResolvedValueOnce(undefined);
    const res = await request(testApp).get("/api/public/certificates/FAKE-CERT-111");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("should return 403 for revoked certificate", async () => {
    vi.mocked(db.query.certificates.findFirst).mockResolvedValueOnce({
      certificateId: "CERT-REVOKED-67890",
      userId: 1,
      courseId: "test-course-2",
      recipientName: "Tester Revoked",
      status: "revoked",
    } as any);

    const res = await request(testApp).get("/api/public/certificates/CERT-REVOKED-67890");
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.status).toBe("revoked");
  });

  it("should return 200 and certificate data for valid certificate", async () => {
    vi.mocked(db.query.certificates.findFirst).mockResolvedValueOnce({
      certificateId: "CERT-TEST-12345",
      userId: 1,
      courseId: "test-course",
      recipientName: "Tester",
      status: "valid",
    } as any);

    const res = await request(testApp).get("/api/public/certificates/CERT-TEST-12345");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.certificate.recipientName).toBe("Tester");
  });
});
