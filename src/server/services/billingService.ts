import { db } from "../../db/index.js";
import { orders, walletLedger, users, notifications } from "../../db/schema.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { eq, desc, and } from "drizzle-orm";

export interface BillingProduct {
  id: string;
  type: "pro_monthly" | "pro_yearly" | "gems_pack" | "cert_voucher";
  name: string;
  subtitle: string;
  priceIdr: number;
  gemsGranted?: number;
  certCreditsGranted?: number;
  proDaysGranted?: number;
  badge?: string;
  features: string[];
}

export const BILLING_CATALOG: BillingProduct[] = [
  {
    id: "pro_monthly",
    type: "pro_monthly",
    name: "Skillora Pro Bulanan",
    subtitle: "Akses penuh AI Career Suite, Mock Interview Suara & Asesmen Adaptif Tanpa Batas",
    priceIdr: 79000,
    gemsGranted: 150,
    certCreditsGranted: 2,
    proDaysGranted: 30,
    badge: "Populer",
    features: [
      "Mock Interview Suara AI real-time tanpa batas kuota",
      "Asesmen AI Adaptif CAT & diagnostik skill-gap mendalam",
      "CV ATS Builder + Optimasi Bullet AI per lowongan",
      "+150 Bonus Gems & +2 Kredit Sertifikat Resmi",
    ],
  },
  {
    id: "pro_yearly",
    type: "pro_yearly",
    name: "Skillora Pro Tahunan",
    subtitle: "Hemat 37% untuk akselerasi karir penuh selama 12 bulan",
    priceIdr: 599000,
    gemsGranted: 600,
    certCreditsGranted: 10,
    proDaysGranted: 365,
    badge: "Hemat 37%",
    features: [
      "Semua benefit Skillora Pro selama 365 hari penuh",
      "Prioritas matchmaking talent ke HRD Perusahaan Mitra",
      "+600 Bonus Gems & +10 Kredit Sertifikat Industri",
      "Lencana eksklusif Skillora Pro Member di profil",
    ],
  },
  {
    id: "gems_150",
    type: "gems_pack",
    name: "Paket 150 Gems Starter",
    subtitle: "Top up Gems instan untuk Toko Skillora & sesi mentoring 1-on-1",
    priceIdr: 25000,
    gemsGranted: 150,
    features: [
      "150 Gems langsung masuk ke dompet akun",
      "Gunakan untuk Streak Freeze, XP Booster 2x, atau Booking Mentor",
    ],
  },
  {
    id: "gems_500",
    type: "gems_pack",
    name: "Paket 500 Gems Akselerator",
    subtitle: "Saldo Gems besar untuk mentoring intensif & item Toko lengkap",
    priceIdr: 69000,
    gemsGranted: 500,
    badge: "Best Value",
    features: [
      "500 Gems langsung dikreditkan dengan audit wallet ledger",
      "Setara hingga 10x sesi mentoring premium",
    ],
  },
  {
    id: "cert_voucher_3",
    type: "cert_voucher",
    name: "Bundle 3 Kredit Sertifikat Industri",
    subtitle: "Kredit penerbitan sertifikat terverifikasi untuk lulusan proyek",
    priceIdr: 99000,
    certCreditsGranted: 3,
    features: [
      "+3 Kredit Sertifikat Resmi dengan kode verifikasi publik",
      "Cocok untuk verifikasi portofolio lintas jalur kompetensi",
    ],
  },
];

export class BillingService {
  static getCatalog() {
    return BILLING_CATALOG;
  }

  static async getHistory(userId: string) {
    const userRow = await UserRepository.getOrCreateUser(userId, "user@skillora.app", "Siswa");

    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userRow.id))
      .orderBy(desc(orders.createdAt))
      .limit(30);

    const ledger = await db
      .select()
      .from(walletLedger)
      .where(eq(walletLedger.userId, userRow.id))
      .orderBy(desc(walletLedger.createdAt))
      .limit(40);

    return {
      orders: userOrders.map((o) => ({
        orderCode: o.orderCode,
        productType: o.productType,
        productId: o.productId,
        productName: o.productName,
        amountIdr: o.amountIdr,
        paymentMethod: o.paymentMethod,
        status: o.status,
        paidAt: o.paidAt ? o.paidAt.toISOString() : null,
        createdAt: o.createdAt ? o.createdAt.toISOString() : new Date().toISOString(),
      })),
      ledger: ledger.map((l) => ({
        id: l.id,
        currency: l.currency,
        delta: l.delta,
        balanceAfter: l.balanceAfter,
        reason: l.reason,
        referenceId: l.referenceId,
        createdAt: l.createdAt ? l.createdAt.toISOString() : new Date().toISOString(),
      })),
    };
  }

  static async createOrder(userId: string, productId: string, paymentMethod = "qris") {
    const product = BILLING_CATALOG.find((p) => p.id === productId);
    if (!product) throw new Error("Produk atau paket langganan tidak ditemukan.");

    const userRow = await UserRepository.getOrCreateUser(userId, "user@skillora.app", "Siswa");
    const orderCode = `INV-SK-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const [created] = await db
      .insert(orders)
      .values({
        orderCode,
        userId: userRow.id,
        productType: product.type,
        productId: product.id,
        productName: product.name,
        amountIdr: product.priceIdr,
        paymentMethod: ["qris", "va_bca", "va_mandiri", "ewallet"].includes(paymentMethod) ? paymentMethod : "qris",
        status: "pending",
        metadata: {
          virtualAccount: `88010${Math.floor(100000000 + Math.random() * 900000000)}`,
          qrisPayload: `00020101021226580013ID.CO.SKILLORA.WWW0215${orderCode}540${product.priceIdr}5802ID`,
        },
      })
      .returning();

    return {
      orderCode: created.orderCode,
      productId: created.productId,
      productName: created.productName,
      amountIdr: created.amountIdr,
      paymentMethod: created.paymentMethod,
      status: created.status,
      metadata: created.metadata,
      createdAt: created.createdAt ? created.createdAt.toISOString() : new Date().toISOString(),
    };
  }

  static async confirmOrder(userId: string, orderCode: string) {
    return await db.transaction(async (tx) => {
      const [userRow] = await tx.select().from(users).where(eq(users.uid, userId)).for("update");
      if (!userRow) throw new Error("Pengguna tidak ditemukan.");

      const [order] = await tx
        .select()
        .from(orders)
        .where(and(eq(orders.orderCode, orderCode), eq(orders.userId, userRow.id)))
        .for("update");

      if (!order) throw new Error("Invoice transaksi tidak ditemukan.");

      // Idempotency: return cleanly if already settled
      if (order.status === "paid") {
        const profile = await UserRepository.getFullProfile(userId);
        const history = await BillingService.getHistory(userId);
        return { alreadyPaid: true, order, profile, ...history };
      }

      const product = BILLING_CATALOG.find((p) => p.id === order.productId);
      if (!product) throw new Error("Konfigurasi produk invoice tidak valid.");

      let newGems = userRow.gems;
      let newCertCredits = userRow.certCredits ?? 1;
      let newTier = userRow.subscriptionTier;
      let newExpiresAt = userRow.subscriptionExpiresAt;

      if (product.gemsGranted && product.gemsGranted > 0) {
        newGems += product.gemsGranted;
        await tx.insert(walletLedger).values({
          userId: userRow.id,
          currency: "gems",
          delta: product.gemsGranted,
          balanceAfter: newGems,
          reason: `Pembayaran ${product.name}`,
          referenceId: order.orderCode,
        });
      }

      if (product.certCreditsGranted && product.certCreditsGranted > 0) {
        newCertCredits += product.certCreditsGranted;
        await tx.insert(walletLedger).values({
          userId: userRow.id,
          currency: "cert_credits",
          delta: product.certCreditsGranted,
          balanceAfter: newCertCredits,
          reason: `Kredit Sertifikat: ${product.name}`,
          referenceId: order.orderCode,
        });
      }

      if (product.proDaysGranted && product.proDaysGranted > 0) {
        const baseMs =
          userRow.subscriptionExpiresAt && userRow.subscriptionExpiresAt.getTime() > Date.now()
            ? userRow.subscriptionExpiresAt.getTime()
            : Date.now();
        newExpiresAt = new Date(baseMs + product.proDaysGranted * 24 * 60 * 60 * 1000);
        newTier = "pro";
      }

      await tx
        .update(users)
        .set({
          gems: newGems,
          certCredits: newCertCredits,
          subscriptionTier: newTier,
          subscriptionExpiresAt: newExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userRow.id));

      const [paidOrder] = await tx
        .update(orders)
        .set({
          status: "paid",
          paidAt: new Date(),
        })
        .where(eq(orders.id, order.id))
        .returning();

      await tx.insert(notifications).values({
        userId: userRow.id,
        text: `💳 Pembayaran '${product.name}' (${order.orderCode}) berhasil dikonfirmasi!`,
        type: "system",
        read: false,
      });

      const profile = await UserRepository.getFullProfile(userId);
      const history = await BillingService.getHistory(userId);
      return { alreadyPaid: false, order: paidOrder, profile, ...history };
    });
  }
}
