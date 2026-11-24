import { useEffect, useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Gem,
  Award,
  CreditCard,
  QrCode,
  Receipt,
  History,
  ShieldCheck,
  X,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { BillingProduct, OrderRecord, Profile, WalletLedgerEntry } from "../types";
import { billingApi } from "../api/apiClient";

interface PusatUpgradeViewProps {
  profile?: Profile;
  onProfileUpdate?: (updated: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

export function PusatUpgradeView({ profile, onProfileUpdate, showToast }: PusatUpgradeViewProps) {
  const [catalog, setCatalog] = useState<BillingProduct[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [ledger, setLedger] = useState<WalletLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"catalog" | "orders" | "ledger">("catalog");
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "va_bca" | "va_mandiri" | "ewallet">("qris");
  const [activeInvoice, setActiveInvoice] = useState<OrderRecord | null>(null);
  const [creatingOrderId, setCreatingOrderId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const loadBilling = async () => {
    setLoading(true);
    try {
      const [catRes, histRes] = await Promise.all([billingApi.getCatalog(), billingApi.getHistory()]);
      setCatalog(catRes || []);
      setOrders(histRes?.orders || []);
      setLedger(histRes?.ledger || []);
    } catch (err: any) {
      showToast?.(err?.message || "Gagal memuat katalog billing.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
  }, []);

  const handleCreateOrder = async (product: BillingProduct) => {
    setCreatingOrderId(product.id);
    try {
      const order = await billingApi.createOrder(product.id, paymentMethod);
      setActiveInvoice(order);
      await loadBilling();
    } catch (err: any) {
      showToast?.(err?.message || "Gagal membuat invoice transaksi.", "error");
    } finally {
      setCreatingOrderId(null);
    }
  };

  const handleConfirmPayment = async () => {
    if (!activeInvoice) return;
    setConfirming(true);
    try {
      const res = await billingApi.confirmOrder(activeInvoice.orderCode);
      if (res?.profile && onProfileUpdate) {
        onProfileUpdate(res.profile);
      }
      setOrders(res?.orders || []);
      setLedger(res?.ledger || []);
      setActiveInvoice(null);
      showToast?.("Pembayaran berhasil dikonfirmasi! Manfaat langsung aktif di akun Anda.", "success");
    } catch (err: any) {
      showToast?.(err?.message || "Gagal mengonfirmasi pembayaran.", "error");
    } finally {
      setConfirming(false);
    }
  };

  const formatIdr = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

  const isPro = profile?.subscriptionTier === "pro";

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-2 font-sans">
      {/* Header & Account Wallet Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Billing, Langganan Pro & Buku Kas Dompet</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
            {isPro ? "Keanggotaan Skillora PRO Aktif" : "Tingkatkan Akses ke Skillora PRO"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Buka Mock Interview Suara AI tanpa batas, Asesmen Adaptif CAT penuh, Kredit Sertifikat Industri, serta top up saldo Gems dengan pencatatan buku kas teraudit.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Status Paket</span>
            <span className={`text-sm font-bold mt-0.5 block ${isPro ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-white"}`}>
              {isPro ? "PRO Member" : "Gratis"}
            </span>
          </div>
          <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Saldo Gems</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block tabular-nums">
              {(profile?.gems ?? 0).toLocaleString("id-ID")}
            </span>
          </div>
          <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Kredit Sertifikat</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block tabular-nums">
              {profile?.certCredits ?? 1}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs + Payment Method Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start">
          {[
            { id: "catalog" as const, label: "Paket & Top Up", icon: CreditCard },
            { id: "orders" as const, label: `Invoice (${orders.length})`, icon: Receipt },
            { id: "ledger" as const, label: `Buku Kas Dompet (${ledger.length})`, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  active
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "catalog" && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Metode Bayar:</span>
            <select
              aria-label="Pilih metode pembayaran"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <option value="qris">QRIS Instan (Semua E-Wallet/Bank)</option>
              <option value="va_bca">Virtual Account BCA</option>
              <option value="va_mandiri">Virtual Account Mandiri</option>
              <option value="ewallet">GoPay / OVO / DANA</option>
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          Memuat data billing & riwayat transaksi...
        </div>
      ) : activeTab === "catalog" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {catalog.map((item) => {
            const isPlan = item.type.startsWith("pro");
            return (
              <div
                key={item.id}
                className={`rounded-2xl p-6 flex flex-col justify-between border shadow-xs transition-all ${
                  isPlan
                    ? "bg-white dark:bg-slate-900 border-emerald-500/50 dark:border-emerald-500/40"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                      {item.type === "gems_pack" ? (
                        <Gem className="w-4 h-4 text-emerald-500" />
                      ) : item.type === "cert_voucher" ? (
                        <Award className="w-4 h-4 text-amber-500" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      )}
                      <span>
                        {item.type === "gems_pack"
                          ? "Paket Gems"
                          : item.type === "cert_voucher"
                          ? "Kredit Sertifikat"
                          : "Langganan PRO"}
                      </span>
                    </div>
                    {item.badge && (
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">{item.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{item.subtitle}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-2xl font-display font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {formatIdr(item.priceIdr)}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {item.proDaysGranted ? `Aktif ${item.proDaysGranted} hari` : "Pembelian satu kali"}
                    </div>
                  </div>

                  <ul className="space-y-2 pt-1">
                    {item.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  disabled={creatingOrderId === item.id}
                  onClick={() => handleCreateOrder(item)}
                  className={`mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                    isPlan
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white"
                  }`}
                >
                  {creatingOrderId === item.id ? "Membuat Invoice..." : "Buat Invoice Pembayaran"}
                </button>
              </div>
            );
          })}
        </div>
      ) : activeTab === "orders" ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">Belum ada riwayat invoice transaksi.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Kode Invoice</th>
                    <th className="px-4 py-3">Produk</th>
                    <th className="px-4 py-3">Metode</th>
                    <th className="px-4 py-3">Nominal</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orders.map((ord) => (
                    <tr key={ord.orderCode} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">{ord.orderCode}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{ord.productName}</td>
                      <td className="px-4 py-3 uppercase text-slate-500">{ord.paymentMethod}</td>
                      <td className="px-4 py-3 font-bold tabular-nums text-slate-900 dark:text-white">{formatIdr(ord.amountIdr)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            ord.status === "paid"
                              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                              : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {ord.status === "paid" ? "Lunas" : "Menunggu"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {ord.status !== "paid" ? (
                          <button
                            onClick={() => setActiveInvoice(ord)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                          >
                            Bayar / Konfirmasi
                          </button>
                        ) : (
                          <span className="text-slate-400">Terkonfirmasi</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          {ledger.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">Belum ada mutasi dompet tercatat di wallet ledger.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Keterangan</th>
                    <th className="px-4 py-3">Aset</th>
                    <th className="px-4 py-3">Mutasi</th>
                    <th className="px-4 py-3 text-right">Saldo Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ledger.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-slate-500 tabular-nums">
                        {new Date(row.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{row.reason}</td>
                      <td className="px-4 py-3 uppercase text-slate-500">{row.currency}</td>
                      <td className="px-4 py-3 font-bold tabular-nums">
                        <span className={`inline-flex items-center gap-1 ${row.delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {row.delta >= 0 ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          {row.delta >= 0 ? `+${row.delta}` : row.delta}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                        {row.balanceAfter}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Checkout Confirmation Modal */}
      {activeInvoice && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase text-emerald-600">Invoice Pembayaran</p>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">{activeInvoice.orderCode}</h3>
              </div>
              <button
                onClick={() => setActiveInvoice(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Tutup invoice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Paket / Produk</span>
                <span className="font-bold text-slate-900 dark:text-white">{activeInvoice.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metode Pembayaran</span>
                <span className="font-bold uppercase text-slate-900 dark:text-white">{activeInvoice.paymentMethod}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Total Tagihan</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatIdr(activeInvoice.amountIdr)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
              <QrCode className="w-12 h-12 text-slate-700 dark:text-slate-200 mx-auto" />
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {activeInvoice.paymentMethod === "qris"
                  ? "Scan QRIS Skillora atau konfirmasi settlement transaksi instan di bawah."
                  : `Nomor Virtual Account: ${activeInvoice.metadata?.virtualAccount || "8801099281723"}`}
              </div>
              <p className="text-[11px] font-mono text-slate-400 break-all">
                {activeInvoice.metadata?.qrisPayload?.slice(0, 48)}...
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveInvoice(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Nanti Saja
              </button>
              <button
                disabled={confirming}
                onClick={handleConfirmPayment}
                className="flex-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {confirming ? "Memverifikasi Settlement..." : "Konfirmasi Pembayaran Lunas"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PusatUpgradeView;
