import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../../server';
import { db } from '../../db/index';
import { certificates } from '../../db/schema';
import { eq } from 'drizzle-orm';

describe('Certificate Verification API', () => {
  const mockCertId = 'CERT-TEST-12345';
  const revokedCertId = 'CERT-REVOKED-67890';

  beforeAll(async () => {
    await db.insert(certificates).values([
      {
        certificateId: mockCertId,
        userId: 1, // Assume user 1 exists, if not we'd mock it
        courseId: 'test-course',
        recipientName: 'Tester',
        status: 'valid'
      },
      {
        certificateId: revokedCertId,
        userId: 1,
        courseId: 'test-course-2',
        recipientName: 'Tester Revoked',
        status: 'revoked'
      }
    ]).onConflictDoNothing();
  });

  afterAll(async () => {
    await db.delete(certificates).where(eq(certificates.certificateId, mockCertId));
    await db.delete(certificates).where(eq(certificates.certificateId, revokedCertId));
  });

  it('should return 404 for non-existent certificate (forgery attempt)', async () => {
    const res = await request(app).get('/api/public/certificates/FAKE-CERT-111');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 403 for revoked certificate', async () => {
    const res = await request(app).get(`/api/public/certificates/${revokedCertId}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.status).toBe('revoked');
  });

  it('should return 200 and certificate data for valid certificate', async () => {
    const res = await request(app).get(`/api/public/certificates/${mockCertId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.certificate.recipientName).toBe('Tester');
  });
});
