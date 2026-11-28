import React, { useState } from "react";
import {
  Compass,
  Download,
  Copy,
  Check,
  Sun,
  Moon,
  ShieldCheck,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  SkilloraLogo,
  SkilloraLogoIcon,
  SkilloraCompassSeal,
  SKILLORA_BRAND,
  getSkilloraLogoSvgString,
  LogoExportOptions,
} from "./SkilloraLogo";
import { ROUTES } from "../routes";

interface BrandIdentityViewProps {
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
  standalone?: boolean;
}

const BRAND_COLORS = [
  {
    name: "Midnight Navy",
    role: "Warna Fondasi & Otoritas",
    hex: "#0A1628",
    rgb: "10, 22, 40",
    sampleClass: "bg-[#0A1628] text-white",
  },
  {
    name: "Compass Emerald",
    role: "Aksen Pertumbuhan & Arah Karier",
    hex: "#00B87C",
    rgb: "0, 184, 124",
    sampleClass: "bg-[#00B87C] text-white",
  },
  {
    name: "North Star Gold",
    role: "Bintang Pencapaian & Segel Sertifikasi",
    hex: "#F59E0B",
    rgb: "245, 158, 11",
    sampleClass: "bg-[#F59E0B] text-slate-950",
  },
  {
    name: "Alabaster Slate",
    role: "Permukaan Bersih & Dokumen Resmi",
    hex: "#F8FAFC",
    rgb: "248, 250, 252",
    sampleClass: "bg-[#F8FAFC] text-slate-900 border border-zinc-200",
  },
];

export function BrandIdentityView({ showToast, standalone = false }: BrandIdentityViewProps) {
  const [previewSurface, setPreviewSurface] = useState<"light" | "dark">("dark");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (id: string, value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    showToast?.(`${label} berhasil disalin!`, "success");
    setTimeout(() => setCopiedId(null), 1800);
  };

  const downloadSvgAsset = (filename: string, options: LogoExportOptions) => {
    const svgString = getSkilloraLogoSvgString(options);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast?.(`Aset vektor ${filename}.svg berhasil diunduh.`, "success");
  };

  const downloadPngAsset = (filename: string, options: LogoExportOptions) => {
    const svgString = getSkilloraLogoSvgString(options);
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const targetWidth = options.variant === "icon" || options.variant === "seal" ? 1024 : 1400;
      const aspectRatio = img.naturalHeight && img.naturalWidth ? img.naturalHeight / img.naturalWidth : 1;
      const targetHeight = Math.round(targetWidth * aspectRatio);

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        canvas.toBlob((pngBlob) => {
          if (pngBlob) {
            const pngUrl = URL.createObjectURL(pngBlob);
            const link = document.createElement("a");
            link.href = pngUrl;
            link.download = `${filename}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(pngUrl);
            showToast?.(`Aset PNG resolusi tinggi (${targetWidth}px) berhasil diunduh.`, "success");
          }
        }, "image/png");
      }
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      showToast?.("Gagal mengonversi SVG ke PNG pada browser ini.", "error");
    };

    img.src = url;
  };

  const assetPacks: Array<{
    id: string;
    title: string;
    subtitle: string;
    filename: string;
    options: LogoExportOptions;
    render: () => React.ReactNode;
    surfaceDark?: boolean;
  }> = [
    {
      id: "full-light",
      title: "Logo Utama + Tagline (Terang)",
      subtitle: "Untuk dokumen resmi, proposal mitra, CV, dan header terang",
      filename: "skillora-logo-full-light",
      options: { variant: "full", theme: "light", includeTagline: true },
      surfaceDark: false,
      render: () => <SkilloraLogo variant="full" size="md" darkMode={false} showTagline={true} compactTagline={true} />,
    },
    {
      id: "full-dark",
      title: "Logo Utama + Tagline (Gelap)",
      subtitle: "Untuk banner acara, presentasi pitch deck, dan antarmuka gelap",
      filename: "skillora-logo-full-dark",
      options: { variant: "full", theme: "dark", includeTagline: true },
      surfaceDark: true,
      render: () => <SkilloraLogo variant="full" size="md" darkMode={true} showTagline={true} compactTagline={true} />,
    },
    {
      id: "icon-mark",
      title: "Ikon Monogram & Kompas Karier",
      subtitle: "Ikon aplikasi PWA, favicon, avatar profil resmi, dan badge mikro",
      filename: "skillora-monogram-compass-icon",
      options: { variant: "icon" },
      surfaceDark: previewSurface === "dark",
      render: () => <SkilloraLogoIcon size={64} />,
    },
    {
      id: "official-seal",
      title: "Segel Verifikasi Sertifikat Resmi",
      subtitle: "Stempel resmi untuk Sertifikat Kelulusan, Dossier Portofolio & CV ATS",
      filename: "skillora-official-compass-seal",
      options: { variant: "seal" },
      surfaceDark: previewSurface === "dark",
      render: () => <SkilloraCompassSeal size={84} label="GRADE A+" sublabel="SKILLORA VERIFIED" />,
    },
  ];

  return (
    <div className={`min-h-screen ${standalone ? "bg-zinc-50 dark:bg-zinc-950 py-8 px-4 sm:px-6" : ""}`}>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {standalone && (
          <div className="flex items-center justify-between">
            <Link
              to={ROUTES.learning.root}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Skillora
            </Link>
            <SkilloraLogo variant="full" size="sm" />
          </div>
        )}

        {/* Hero Brand Showcase */}
        <section className="rounded-2xl bg-[#0A1628] text-white border border-slate-800 p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400">
                <Compass className="w-4 h-4" />
                <span>Identitas Brand Resmi · Edisi 2026</span>
              </div>
              <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Monogram Geometris Modern &amp; Kompas Karier
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                <strong className="text-white">{SKILLORA_BRAND.name}</strong> —{" "}
                <span className="text-emerald-300 font-semibold">{SKILLORA_BRAND.tagline}</span>.
                Identitas visual ini memadukan presisi monogram huruf <strong>S</strong> dengan jarum kompas yang menunjuk ke arah timur laut ($45^\circ$) sebagai penanda arah pertumbuhan kompetensi dan kesiapan kerja industri.
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    downloadSvgAsset("skillora-logo-full-dark", {
                      variant: "full",
                      theme: "dark",
                      includeTagline: true,
                    })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00B87C] hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Unduh Paket Logo SVG
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadPngAsset("skillora-monogram-compass-icon", {
                      variant: "icon",
                    })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  Unduh Ikon PNG (1024px)
                </button>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl">
              <SkilloraLogo variant="full" size="xl" darkMode={true} showTagline={true} />
            </div>
          </div>
        </section>

        {/* Filosofi & Anatomi Logo */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-zinc-900 dark:text-white">
                Anatomi &amp; Filosofi Simbol
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Setiap elemen geometris dirancang agar tetap tajam mulai dari favicon 16px hingga spanduk dan sertifikat cetak.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-2">
              <ShieldCheck className="w-5 h-5 text-[#0A1628] dark:text-slate-200" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Perisai Oktagonal Navy</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Bingkai midnight navy (#0A1628) merepresentasikan fondasi kompetensi yang kokoh, kredibilitas sertifikasi, dan tata kelola profesional.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-2">
              <Compass className="w-5 h-5 text-[#00B87C]" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Monogram S &amp; Jarum 45°</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Pita huruf S geometris berpadu dengan jarum kompas mengarah ke timur laut (North-East Ascent) sebagai simbol lompatan karier terarah.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-2">
              <Sparkles className="w-5 h-5 text-[#F59E0B]" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Poros &amp; Bintang Utara</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Titik poros emas di tengah dan bintang empat sudut di puncak menandai standar emas lulusan, kejelasan tujuan, dan validitas.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-2">
              <Award className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Segel Sertifikasi Resmi</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Stempel lingkaran khusus untuk memvalidasi Sertifikat Kompetensi, CV ATS Terverifikasi, dan Dossier Portofolio Publik.
              </p>
            </div>
          </div>
        </section>

        {/* Varian & Unduh Aset Logo */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-zinc-900 dark:text-white">
                Varian Logo &amp; Unduh Media Kit
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Unduh langsung dalam format vektor (.SVG) atau gambar transparan resolusi tinggi (.PNG).
              </p>
            </div>

            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setPreviewSurface("light")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  previewSurface === "light"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                Latar Terang
              </button>
              <button
                type="button"
                onClick={() => setPreviewSurface("dark")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  previewSurface === "dark"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                Latar Gelap
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assetPacks.map((pack) => {
              const svgStr = getSkilloraLogoSvgString(pack.options);
              return (
                <div
                  key={pack.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col"
                >
                  <div
                    className={`h-40 flex items-center justify-center p-6 border-b border-zinc-200 dark:border-zinc-800 transition-colors ${
                      pack.surfaceDark
                        ? "bg-[#0A1628] text-white"
                        : "bg-slate-50 text-slate-900"
                    }`}
                  >
                    {pack.render()}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{pack.title}</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{pack.subtitle}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => downloadSvgAsset(pack.filename, pack.options)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        SVG
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadPngAsset(pack.filename, pack.options)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PNG HD
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyText(pack.id, svgStr, `Kode SVG ${pack.title}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer ml-auto"
                      >
                        {copiedId === pack.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        Salin SVG
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Palet Warna & Aturan Penggunaan */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-3">
            <h2 className="font-display text-lg font-bold text-zinc-900 dark:text-white">
              Sistem Palet Warna Resmi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BRAND_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => handleCopyText(c.hex, c.hex, `Kode warna ${c.name}`)}
                  className="text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 hover:border-emerald-500/50 transition-colors cursor-pointer group"
                >
                  <div className={`h-14 rounded-lg mb-3 px-3 flex items-end justify-between py-2 ${c.sampleClass}`}>
                    <span className="font-mono text-xs font-bold">{c.hex}</span>
                    {copiedId === c.hex ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                    )}
                  </div>
                  <p className="font-bold text-xs text-zinc-900 dark:text-white">{c.name}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{c.role} · RGB({c.rgb})</p>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-3">
            <h2 className="font-display text-lg font-bold text-zinc-900 dark:text-white">
              Panduan Penggunaan (Do&apos;s &amp; Don&apos;ts)
            </h2>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3 text-xs">
              <div className="space-y-2">
                <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Diperbolehkan
                </p>
                <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400 pl-5 list-disc">
                  <li>Gunakan varian gelap di atas permukaan gelap (#0A1628 / #09090B) dan varian terang di latar putih/slate.</li>
                  <li>Pertahankan ruang kosong (*clear space*) minimal 25% dari tinggi ikon di sekeliling logo.</li>
                  <li>Gunakan *Official Compass Seal* hanya pada sertifikat, portofolio, dan CV terverifikasi Skillora.</li>
                </ul>
              </div>
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-2">
                <p className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Dihindari
                </p>
                <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400 pl-5 list-disc">
                  <li>Jangan mengubah orientasi jarum kompas selain sudut baku $45^\circ$ timur laut.</li>
                  <li>Jangan meregangkan rasio aspek (*stretch*) atau mengganti palet warna di luar standar.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default BrandIdentityView;
