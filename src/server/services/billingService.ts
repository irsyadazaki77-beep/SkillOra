import { db } from "../../db/index.js";
import { orders, walletLedger, users, notifications } from "../../db/schema.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { eq, desc, and } from "drizzle-orm";

export interface BillingProduct {
  id: string;
  type:
    | "sponsor_scholarship"
    | "hrd_partner"
    | "supporter"
    | "pro_monthly"
    | "pro_yearly"
    | "gems_pack"
    | "cert_voucher";
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
    id: "sponsor_scholarship_1",
    type: "sponsor_scholarship",
    name: "Sponsori 1 Pelajar Prasejahtera",
    subtitle: "Subsisdi silang penuh agar 1 pelajar tanpa biaya mendapat bimbingan AI & jalur karier gratis.",
    priceIdr: 49000,
    gemsGranted: 200,
    badge: "Dampak Sosial",
    features: [
      "Seluruh kursus, ujian, & sertifikat tetap 100% gratis untuk pelajar",
      "Mendanai biaya server & kuota AI mentor bagi peserta beasiswa",
      "Lencana Kontributor Pendidikan Terbuka + +200 Bonus Gems",
    ],
  },
  {
    id: "sponsor_scholarship_10",
    type: "sponsor_scholarship",
    name: "Beasiswa Komunitas & Kampus (10 Pelajar)",
    subtitle: "Program CSR & alumni untuk mendukung 10 pembelajar aktif hingga lulus proyek portofolio.",
    priceIdr: 399000,
    gemsGranted: 800,
    badge: "Best Impact",
    features: [
      "Mendukung 10 pembelajar prasejahtera pada jalur Software, AI, atau BUMN",
      "Laporan ringkas dampak kelulusan & proyek terverifikasi",
      "+800 Bonus Gems komunitas pada buku kas teraudit",
    ],
  },
  {
    id: "hrd_talent_pass",
    type: "hrd_partner",
    name: "Mitra Rekrutmen HRD Perusahaan (B2B)",
    subtitle: "Paket rekrutmen resmi untuk menemukan talenta teruji dari proyek & lab SkillOra.",
    priceIdr: 499000,
    proDaysGranted: 30,
    badge: "Untuk Perusahaan",
    features: [
      "Pencarian talenta terverifikasi lintas portofolio & nilai lab",
      "Badge Mitra Industri Resmi di Portal HRD & lowongan kerja",
      "Undangan wawancara terarah langsung ke kandidat siap kerja",
    ],
  },
  {
    id: "supporter_plus",
    type: "supporter",
    name: "Supporter Ekosistem Gratis",
    subtitle: "Dukungan sukarela agar SkillOra terus bebas paywall bagi pencari kerja tanpa biaya.",
    priceIdr: 25000,
    gemsGranted: 150,
    features: [
      "100% sukarela — seluruh materi & sertifikat tetap gratis tanpa paket ini",
      "+150 Gems apresiasi untuk item Toko Skillora & avatar eksklusif",
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
    const txResult = await db.transaction(async (tx) => {
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
        return { alreadyPaid: true, order };
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

      return { alreadyPaid: false, order: paidOrder };
    });

    const profile = await UserRepository.getFullProfile(userId);
    const history = await BillingService.getHistory(userId);
    return { alreadyPaid: txResult.alreadyPaid, order: txResult.order, profile, ...history };
  }
}
