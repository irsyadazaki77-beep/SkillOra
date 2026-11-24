import { Router, Response } from "express";
import { AuthenticatedRequest, requireAuth, requireRegistered } from "../middlewares/authMiddleware.js";
import { BillingService } from "../services/billingService.js";

const router = Router();

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
    const result = await BillingService.confirmOrder(req.userId!, req.params.orderCode);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: err.message } });
  }
});

export default router;
