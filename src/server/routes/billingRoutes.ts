import crypto from "crypto";
import { Router, Response } from "express";
import { AuthenticatedRequest, requireAuth, requireRegistered } from "../middlewares/authMiddleware.js";
import { BillingService } from "../services/billingService.js";

const router = Router();

function verifyBillingWebhookSignature(orderCode: string, signatureHeader?: string): boolean {
  const secret = process.env.BILLING_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const expected = crypto.createHmac("sha256", secret).update(orderCode).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(signatureHeader.trim(), "utf8");
  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

router.get("/billing/catalog", (req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, data: BillingService.getCatalog() });
});

router.get("/billing/history", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = await BillingService.getHistory(req.userId!);
    return res.json({ success: true, data: history });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
  }
});

router.post("/billing/orders", requireRegistered, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, paymentMethod } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "productId wajib diisi" } });
    }
    const order = await BillingService.createOrder(req.userId!, productId, paymentMethod);
    return res.json({ success: true, data: order });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: err.message } });
  }
});

router.post("/billing/orders/:orderCode/confirm", requireRegistered, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    const signature = req.headers["x-billing-signature"] as string | undefined;

    if (isProduction && !verifyBillingWebhookSignature(req.params.orderCode, signature)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Konfirmasi pembayaran langsung dinonaktifkan di produksi. Diperlukan verifikasi webhook payment gateway.",
        },
      });
    }

    const result = await BillingService.confirmOrder(req.userId!, req.params.orderCode);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: err.message } });
  }
});

router.post("/billing/webhook", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderCode, userId } = req.body || {};
    const signature = req.headers["x-billing-signature"] as string | undefined;
    if (!orderCode || !userId) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "orderCode dan userId wajib diisi." } });
    }
    if (!verifyBillingWebhookSignature(String(orderCode), signature)) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Signature webhook tidak valid." } });
    }
    const result = await BillingService.confirmOrder(String(userId), String(orderCode));
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: err.message } });
  }
});

export default router;
