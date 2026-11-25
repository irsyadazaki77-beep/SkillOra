import { Router } from "express";
import { db } from "../../db/index.js";
import { certificates } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { CareerExpansionService } from "../services/careerExpansionService.js";

const router = Router();

router.get("/public/certificates/:id", async (req, res) => {
  try {
    const certId = req.params.id;
    const cert = await db.query.certificates.findFirst({
      where: eq(certificates.certificateId, certId),
    });

    if (!cert) {
      return res.status(404).json({ success: false, error: "Sertifikat tidak ditemukan." });
    }

    if (cert.status === 'revoked') {
      return res.status(403).json({ success: false, error: "Sertifikat telah dicabut (revoked).", status: 'revoked' });
    }

    res.json({
      success: true,
      certificate: cert
    });
  } catch (error) {
    console.error("Error verifying certificate:", error);
    res.status(500).json({ success: false, error: "Terjadi kesalahan server saat memverifikasi sertifikat." });
  }
});

router.get("/public/portfolio/:slug", async (req, res) => {
  try {
    const portfolio = await CareerExpansionService.getPublicPortfolio(req.params.slug);
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: { message: "Portofolio tidak ditemukan atau disetel privat oleh pemiliknya." },
      });
    }
    return res.json({ success: true, data: portfolio });
  } catch (error) {
    console.error("Error fetching public portfolio:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Terjadi kesalahan server saat memuat portofolio." },
    });
  }
});

export default router;
