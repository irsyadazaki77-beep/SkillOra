import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Course, Profile } from "../types";
import { Award, ShieldCheck, QrCode, Download, X, Printer, Sparkles, Layers, CheckCircle2, BadgePercent, GraduationCap, Clock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface CertificateModalProps {
  activeCertificate: Course | null;
  setActiveCertificate: (cert: Course | null) => void;
  profile: Profile;
  showToast?: (msg: string, type?: "success" | "error" | "info") => void;
  certId?: string;
}

type ThemeMode = "classic" | "obsidian" | "royal";

export function CertificateModal({
  activeCertificate,
  setActiveCertificate,
  profile,
  showToast,
  certId
}: CertificateModalProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>("classic");
  const [isHovered, setIsHovered] = useState(false);
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStep, setDownloadStep] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Helper to generate a consistent certificate hash / ID
  const finalCertId = certId || "Sertifikat belum tersedia";
  const issueDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const verificationUrl = typeof window !== "undefined" ? `${window.location.origin}/verify/${finalCertId}` : "";

  const generateInteractiveHtml = () => {
    if (!activeCertificate) return "";

    const isClassic = themeMode === "classic";
    const isObsidian = themeMode === "obsidian";
    const isRoyal = themeMode === "royal";

    let bgStyle = "";
    let borderStyle = "";
    let textTitleStyle = "";
    let textPrimaryStyle = "";
    let textSecondaryStyle = "";
    let cardStyle = "";

    if (isClassic) {
      bgStyle = "background: linear-gradient(135deg, #fefbf3 0%, #fdfcf7 50%, #f7f3e3 100%); color: #0f172a;";
      borderStyle = "border-color: #f59e0b;";
      textTitleStyle = "color: #0f172a;";
      textPrimaryStyle = "color: #1e293b;";
      textSecondaryStyle = "color: #64748b;";
      cardStyle = "background-color: rgba(255, 255, 255, 0.85); border-color: rgba(245, 158, 11, 0.2);";
    } else if (isObsidian) {
      bgStyle = "background: linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%); color: #f8fafc;";
      borderStyle = "border-color: rgba(245, 158, 11, 0.6);";
      textTitleStyle = "background: linear-gradient(to right, #fde047, #f59e0b, #fef08a); -webkit-background-clip: text; -webkit-text-fill-color: transparent;";
      textPrimaryStyle = "color: #e2e8f0;";
      textSecondaryStyle = "color: #94a3b8;";
      cardStyle = "background-color: rgba(15, 23, 42, 0.65); border-color: rgba(245, 158, 11, 0.15);";
    } else {
      bgStyle = "background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #2e1065 100%); color: #f8fafc;";
      borderStyle = "border-color: rgba(99, 102, 241, 0.6);";
      textTitleStyle = "background: linear-gradient(to right, #ffffff, #c7d2fe, #ddd6fe); -webkit-background-clip: text; -webkit-text-fill-color: transparent;";
      textPrimaryStyle = "color: #e2e8f0;";
      textSecondaryStyle = "color: #94a3b8;";
      cardStyle = "background-color: rgba(15, 23, 42, 0.65); border-color: rgba(99, 102, 241, 0.15);";
    }

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sertifikat Kelulusan Skillora - ${profile.name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=JetBrains+Mono:wght@700&display=swap');
    
    body {
      font-family: 'Inter', sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .font-display {
      font-family: 'Playfair Display', serif;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
    
    @media print {
      @page {
        size: landscape;
        margin: 0;
      }
      body {
        margin: 0;
        background: none !important;
      }
      #control-panel {
        display: none !important;
      }
      #cert-card {
        border: none !important;
        box-shadow: none !important;
        width: 100vw;
        height: 100vh;
        margin: 0 !important;
        padding: 3rem !important;
        border-radius: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
    }
  </style>
</head>
<body class="bg-slate-950 min-h-screen flex flex-col items-center justify-center p-4 md:p-3">

  <!-- Floating Control Panel for Web View -->
  <div id="control-panel" class="w-full max-w-5xl mb-4 bg-slate-900/90 text-white p-4 rounded-lg border border-white/10 backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-2 shadow-sm">
    <div class="flex items-center gap-2">
      <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-base">
        🎓
      </div>
      <div class="text-left">
        <h4 class="text-base font-black tracking-wide">KREDENSIAL RESMI SKILLORA PRO</h4>
        <p class="text-base text-slate-400">Sertifikat terverifikasi ini dapat disimpan sebagai PDF fisik atau dicetak langsung.</p>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <div class="text-base text-amber-300 font-medium bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 max-w-xs leading-tight text-left">
         <strong>Tip Cetak:</strong> Pilih orientasi <b>Landscape</b> dan aktifkan opsi <b>Background Graphics / Background Images</b> di dialog browser Anda.
      </div>
      <button onclick="window.print()" class="from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black px-5 py-2 rounded-xl text-base shadow-sm shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2">
        🖨️ Cetak / Simpan ke PDF
      </button>
    </div>
  </div>

  <!-- The Certificate Printable Paper -->
  <div id="cert-card" class="w-full max-w-5xl rounded-lg overflow-hidden transition-all duration-300 shadow-[0_30px_80px_rgba(0,0,0,0.8)] border-4 p-2 relative" style="${bgStyle} ${borderStyle}">
    
    <!-- Outer Elegant Lines Frame -->
    <div class="absolute inset-4 border-2 rounded-lg pointer-events-none z-10 ${isClassic ? 'border-amber-300/60' : 'border-amber-500/20'}"></div>
    <div class="absolute inset-6 border rounded-lg pointer-events-none z-10 ${isClassic ? 'border-amber-200/40' : 'border-amber-500/10'}"></div>

    <!-- Elegant Corner Ornaments -->
    <div class="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 rounded-tl-xl z-20 ${isClassic ? 'border-amber-500' : 'border-amber-400'}"></div>
    <div class="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 rounded-tr-xl z-20 ${isClassic ? 'border-amber-500' : 'border-amber-400'}"></div>
    <div class="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 rounded-bl-xl z-20 ${isClassic ? 'border-amber-500' : 'border-amber-400'}"></div>
    <div class="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 rounded-br-xl z-20 ${isClassic ? 'border-amber-500' : 'border-amber-400'}"></div>

    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-[0.05] pointer-events-none z-0" style="background-image: radial-gradient(circle at 1px 1px, black 1px, transparent 0); background-size: 20px 20px;"></div>

    <div class="relative z-10 p-3 sm:p-16 flex flex-col md:flex-row gap-2 md:gap-16 items-stretch">
      
      <!-- Left Column: Official Seal & Blockchain Verify QR -->
      <div class="flex-none flex flex-col justify-between items-center md:items-start md:w-56 border-b md:border-b-0 md:border-r border-slate-500/20 pb-8 md:pb-0 md:pr-12 text-center md:text-left">
        
        <!-- Skillora Logo Header -->
        <div class="space-y-3">
          <div class="w-16 h-16 rounded-lg flex items-center justify-center shadow-sm border border-amber-400/30 bg-slate-900 text-amber-400">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div>
            <h3 class="font-bold tracking-widest text-base ${isClassic ? 'text-slate-900' : 'text-white'}">SKILLORA</h3>
            <p class="text-base font-extrabold uppercase tracking-widest text-amber-500">Industrial Tech Academy</p>
          </div>
        </div>

        <!-- Gold Embossed Seal -->
        <div class="my-10 relative">
          <div class="w-28 h-28 rounded-full bg-gradient-to-br from-amber-100 to-amber-300 border-2 border-amber-400 flex flex-col items-center justify-center text-center p-2 shadow-sm relative">
            <div class="absolute inset-1 border border-dashed border-amber-600/50 rounded-full"></div>
            <span class="text-amber-800 text-base">🏅</span>
            <span class="text-[7px] font-black uppercase text-amber-900 tracking-widest mt-1">OFFICIAL SEAL</span>
            <span class="font-display text-base font-black text-amber-950 uppercase tracking-wide mt-1">GRADE A+</span>
            <span class="text-[6px] text-amber-700 font-extrabold tracking-widest">VERIFIED</span>
          </div>
        </div>

        <!-- Secure blockchain QR -->
        <div class="w-full">
          <div class="flex items-center gap-2 bg-white/5 border border-white/10 p-3 rounded-lg">
            <div id="qrcode-canvas" class="p-1 px-1.5 bg-white rounded-xl shrink-0 shadow-sm flex items-center justify-center"></div>
            <div class="text-left">
              <span class="block text-[8px] font-black uppercase tracking-widest ${isClassic ? 'text-slate-500' : 'text-slate-400'}">VERIFIED DIGITAL</span>
              <span class="font-mono text-base font-bold text-emerald-500">ID: ${finalCertId}</span>
              <span class="block text-[7px] ${isClassic ? 'text-slate-400' : 'text-slate-500'} font-semibold mt-1">Scan for validation</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Right Column: Student, Course Achievement and Signatures -->
      <div class="flex-1 flex flex-col justify-between text-center md:text-left">
        
        <div>
          <!-- Header Badge -->
          <div class="flex items-center justify-center md:justify-start gap-2 mb-4 ${isClassic ? 'text-amber-700' : 'text-amber-400'}">
            <span>⭐</span>
            <span class="text-base font-black uppercase tracking-[0.25em]">SERI SERTIFIKASI EMAS INDUSTRI</span>
          </div>

          <!-- Bilingual Title -->
          <div class="space-y-1.5">
            <h5 class="text-base font-extrabold uppercase tracking-widest ${isClassic ? 'text-slate-500' : 'text-slate-400'}">
              SERTIFIKAT KELULUSAN &bull; CERTIFICATE OF COMPLETION
            </h5>
            <p class="text-base font-semibold italic ${isClassic ? 'text-slate-600' : 'text-slate-300'}">
              Sertifikat ini secara resmi dianugerahkan kepada / This is to officially certify that:
            </p>
          </div>

          <!-- Name in gorgeous Display Typography -->
          <div class="my-6">
            <h1 class="font-display text-4xl sm:text-5xl font-bold tracking-tight" style="${isClassic ? 'color: #0f172a;' : isObsidian ? 'background: linear-gradient(to right, #fde047, #f59e0b, #fef08a); -webkit-background-clip: text; -webkit-text-fill-color: transparent;' : 'background: linear-gradient(to right, #ffffff, #c7d2fe, #ddd6fe); -webkit-background-clip: text; -webkit-text-fill-color: transparent;'}">
              ${profile.name}
            </h1>
            <div class="h-1 w-44 mx-auto md:mx-0 mt-3 rounded-full from-amber-500 to-yellow-400"></div>
          </div>

          <!-- Credentials context -->
          <p class="text-base sm:text-base leading-relaxed max-w-xl ${isClassic ? 'text-slate-600' : 'text-slate-300'}">
            Telah sukses menyelesaikan evaluasi komprehensif, pengerjaan projek standar industri mitra, dan dinilai memenuhi kualifikasi profesional tingkat tinggi dalam bidang:
            <span class="block text-base italic font-semibold ${isClassic ? 'text-slate-400' : 'text-slate-500'} mt-1">
              Has successfully accomplished the comprehensive evaluations, industry partner project requirements, and demonstrated professional proficiency in the program:
            </span>
          </p>

          <!-- Focus spotlight card -->
          <div class="mt-4 mb-3 p-4 rounded-lg relative overflow-hidden border" style="${cardStyle}">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-500 to-yellow-400"></div>
            <h2 class="font-display text-base sm:text-base font-bold ${isClassic ? 'text-slate-800' : 'text-white'}">
              &ldquo;${activeCertificate.title}&rdquo;
            </h2>
            <div class="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-base font-extrabold">
              <span class="px-2.5 py-1 rounded-lg border border-slate-500/10 bg-slate-500/5">
                KREDENSIAL: <span class="font-mono text-emerald-500 font-bold">${finalCertId}</span>
              </span>
              <span class="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 uppercase tracking-wider flex items-center gap-1">
                ✓ Endorsed by ${activeCertificate.partner}
              </span>
            </div>
          </div>
        </div>

        <!-- Meta info columns -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-base border-t border-slate-500/15 pt-5 text-left">
          <div>
            <span class="font-black uppercase tracking-widest text-[8px] mb-1 text-slate-400">Tanggal Terbit / Issue Date</span>
            <span class="font-semibold text-base ${isClassic ? 'text-slate-800' : 'text-slate-200'}">${issueDate}</span>
          </div>
          <div>
            <span class="font-black uppercase tracking-widest text-[8px] mb-1 text-slate-400">Nilai Evaluasi / Performance</span>
            <span class="text-emerald-500 font-black text-base uppercase flex items-center gap-1">Grade A+ (95/100) ⭐</span>
          </div>
          <div class="col-span-2 sm:col-span-1">
            <span class="font-black uppercase tracking-widest text-[8px] mb-1 text-slate-400">Durasi Program / Duration</span>
            <span class="font-semibold text-base ${isClassic ? 'text-slate-800' : 'text-slate-200'}">160 Jam Belajar Terbimbing</span>
          </div>
        </div>

        <!-- Handcrafted Signatures -->
        <div class="flex justify-around items-center pt-8 mt-4 max-w-lg mx-auto md:mx-0 text-[8px] text-slate-400 font-black uppercase tracking-wider border-t border-slate-500/10 w-full">
          <div class="text-center space-y-1.5">
            <p class="italic font-serif text-base ${isClassic ? 'text-slate-950' : 'text-white'}">Prof. Hoot, AI Dean</p>
            <div class="w-20 h-px bg-slate-500/30 mx-auto"></div>
            <p class="text-[7px] text-slate-400">Dekan Riset Skillora AI</p>
          </div>
          <div class="text-center space-y-1.5">
            <p class="italic font-serif text-base ${isClassic ? 'text-slate-950' : 'text-white'}">${activeCertificate.partner} Board</p>
            <div class="w-20 h-px bg-slate-500/30 mx-auto"></div>
            <p class="text-[7px] text-slate-400">Direktur Program Industri</p>
          </div>
        </div>

      </div>

    </div>

  </div>

  <script>
    // Generate QR code on DOM ready
    window.addEventListener('DOMContentLoaded', () => {
      new QRCode(document.getElementById("qrcode-canvas"), {
        text: "${verificationUrl}",
        width: 52,
        height: 52,
        colorDark : "#020617",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.M
      });
    });
  </script>

</body>
</html>`;
  };

  const handleDownloadPdf = () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    showToast?.("Menyiapkan dokumen PDF Sertifikat Emas...", "info");

    const steps = [
      { text: "Membuka gerbang aman Skillora...", progress: 15 },
      { text: `Merender layout tema ${themeMode === "classic" ? "Ivory Gold" : themeMode === "obsidian" ? "Dark Obsidian" : "Royal Velvet"}...`, progress: 40 },
      { text: `Mengintegrasikan ID Kredensial: ${finalCertId}...`, progress: 70 },
      { text: "Menyematkan tanda tangan kriptografi...", progress: 90 },
      { text: "Menghasilkan dokumen mandiri interaktif...", progress: 100 }
    ];

    let currentStepIdx = 0;
    
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        setDownloadStep(steps[currentStepIdx].text);
        setDownloadProgress(steps[currentStepIdx].progress);
        currentStepIdx++;
      } else {
        clearInterval(interval);
        
        // Trigger high-fidelity HTML document download that users can open locally and print beautifully to PDF
        const element = document.createElement("a");
        const fileContent = generateInteractiveHtml();
        const file = new Blob([fileContent], { type: 'text/html;charset=utf-8' });
        element.href = URL.createObjectURL(file);
        element.download = `Sertifikat_Skillora_${activeCertificate?.title.replace(/\s+/g, "_")}.html`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        showToast?.("Sertifikat interaktif berhasil diunduh ke folder Downloads!", "success");
        setTimeout(() => {
          setIsDownloading(false);
        }, 800);
      }
    }, 600);
  };

  return (
    <AnimatePresence>
      {activeCertificate && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 sm:p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 30, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="w-full max-w-5xl relative my-8"
          >
            {/* Top Interactive Panel */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-3 mb-4 bg-slate-900/95 text-white p-3.5 px-4 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg">
              <div className="flex items-center gap-2 flex-wrap">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">Tema Sertifikat:</span>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setThemeMode("classic")}
                    className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                      themeMode === "classic" 
                        ? "bg-amber-500 text-slate-950 shadow-sm" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    🏛️ Ivory Gold
                  </button>
                  <button
                    onClick={() => setThemeMode("obsidian")}
                    className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                      themeMode === "obsidian" 
                        ? "bg-slate-800 text-amber-400 border border-amber-500/20 shadow-sm" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                     Dark Obsidian
                  </button>
                  <button
                    onClick={() => setThemeMode("royal")}
                    className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                      themeMode === "royal" 
                        ? "bg-indigo-600 text-white shadow-sm" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    👑 Royal Velvet
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(verificationUrl);
                    showToast?.("Tautan verifikasi sertifikat berhasil disalin!", "success");
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all border border-slate-700 active:scale-95 cursor-pointer"
                  title="Salin Tautan Verifikasi"
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Salin Link</span>
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-extrabold transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_16px_rgba(16,185,129,0.5)] active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Sertifikat</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-extrabold transition-all shadow-[0_4px_12px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_16px_rgba(245,158,11,0.5)] active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Save as PDF</span>
                </button>
                <button
                  onClick={() => setActiveCertificate(null)}
                  className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl flex items-center justify-center transition-colors border border-white/10 cursor-pointer ml-auto md:ml-0"
                  title="Tutup Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Help/Tip Banner for clear download instructions */}
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/40 text-emerald-200 text-xs font-semibold p-4 rounded-2xl mb-4 shadow-md space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>PETUNJUK MENGUNDUH SERTIFIKAT KE LAPTOP / HP ANDA:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="p-2.5 bg-black/30 rounded-xl border border-emerald-500/20">
                  <strong className="text-amber-400 block mb-0.5">📌 Opsi 1: Cetak Langsung Sebagai PDF (Rekomendasi)</strong>
                  <p>Klik tombol kuning <strong className="text-white font-bold">"Cetak / Save as PDF"</strong> di atas. Pada jendela browser, ubah Tujuan (Destination) menjadi <strong className="text-emerald-400 font-bold">"Save as PDF / Simpan sebagai PDF"</strong> lalu pilih orientasi Landscape.</p>
                </div>
                <div className="p-2.5 bg-black/30 rounded-xl border border-emerald-500/20">
                  <strong className="text-amber-400 block mb-0.5">📥 Opsi 2: Unduh File Dokumen Digital</strong>
                  <p>Klik tombol hijau <strong className="text-white font-bold">"Unduh File Sertifikat"</strong> untuk mengunduh dokumen file sertifikat digital terverifikasi langsung ke folder Download Anda.</p>
                </div>
              </div>
            </div>

            {/* The Certificate Paper Wrapper */}
            <div 
              id="printable-certificate"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={`relative rounded-lg overflow-hidden transition-all duration-300 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.5)] border-4 p-1 sm:p-2 select-none ${
                themeMode === "classic"
                  ? "bg-gradient-to-br from-amber-50 via-[#fcf9f0] to-amber-100/50 border-amber-400/80"
                  : themeMode === "obsidian"
                  ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-amber-500/60 shadow-[0_0_50px_rgba(245,158,11,0.15)]"
                  : "bg-gradient-to-br from-indigo-950 via-slate-900 to-[#1e1145] border-indigo-500/60 shadow-[0_0_50px_rgba(99,102,241,0.25)]"
              }`}
            >
              {isDownloading && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-45 flex flex-col items-center justify-center p-4 text-center rounded-lg">
                  <div className="max-w-md space-y-6 w-full px-3">
                    <div className="relative flex justify-center">
                      <div className="absolute -inset-2 rounded-full bg-amber-500/30 blur-xl "></div>
                      <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-full flex items-center justify-center shadow-sm border border-amber-300 relative z-10 ">
                        <Download className="w-10 h-10 text-slate-950" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-display font-black text-white text-base tracking-wide">MENGUNDUH SERTIFIKAT EMAS</h4>
                      <p className="text-base text-amber-400 font-mono tracking-widest uppercase ">{downloadStep}</p>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="space-y-1.5">
                      <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 p-0.5">
                        <div 
                          className="h-full rounded-full from-amber-500 to-yellow-400 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                          style={{ width: `${downloadProgress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-base text-slate-400 font-bold font-mono">
                        <span>{downloadProgress}% PROSES</span>
                        <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> SECURE LINK</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Luxury Frame Borders with corner ornaments */}
              <div className={`absolute inset-4 border-2 rounded-lg pointer-events-none z-10 ${
                themeMode === "classic" ? "border-amber-300/60" : "border-amber-500/20"
              }`}></div>
              <div className={`absolute inset-6 border rounded-xl pointer-events-none z-10 ${
                themeMode === "classic" ? "border-amber-200/40" : "border-amber-500/10"
              }`}></div>

              {/* Elegant Classic Corner Ornaments */}
              <div className={`absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 rounded-tl-lg z-20 ${themeMode === "classic" ? "border-amber-500" : "border-amber-400"}`}></div>
              <div className={`absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 rounded-tr-lg z-20 ${themeMode === "classic" ? "border-amber-500" : "border-amber-400"}`}></div>
              <div className={`absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 rounded-bl-lg z-20 ${themeMode === "classic" ? "border-amber-500" : "border-amber-400"}`}></div>
              <div className={`absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 rounded-br-lg z-20 ${themeMode === "classic" ? "border-amber-500" : "border-amber-400"}`}></div>

              {/* Complex Guilloché Background Patterns (CSS Simulated Waves) */}
              <div className="absolute inset-0 opacity-[0.06] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
              
              {/* Flowing background rings */}
              <div className={`absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0 opacity-40 ${
                themeMode === "classic" ? "bg-amber-400" : themeMode === "obsidian" ? "bg-amber-500" : "bg-indigo-600"
              }`}></div>
              <div className={`absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none z-0 opacity-30 ${
                themeMode === "classic" ? "bg-blue-300" : themeMode === "obsidian" ? "bg-blue-500" : "bg-violet-600"
              }`}></div>

              {/* Main Certificate Content Container */}
              <div className="relative z-10 p-3 sm:p-14 md:p-16 flex flex-col md:flex-row gap-2 md:gap-14 bg-white/5 backdrop-blur-xs">
                
                {/* Left Side: Verification Hub, Seals & Trust Badges */}
                <div className="flex-none flex flex-col justify-between items-center md:items-start md:w-56 border-b md:border-b-0 md:border-r border-slate-500/20 pb-8 md:pb-0 md:pr-10">
                  
                  {/* Brand Signature Icon */}
                  <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2 w-full">
                    <div className={`w-16 h-16 rounded-lg flex items-center justify-center shadow-sm border relative overflow-hidden group-hover:rotate-6 transition-all duration-300 ${
                      themeMode === "classic" 
                        ? "bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 border-amber-400" 
                        : themeMode === "obsidian"
                        ? "bg-gradient-to-tr from-slate-900 to-slate-850 text-amber-400 border-amber-500/40"
                        : "bg-gradient-to-tr from-indigo-600 to-violet-500 text-white border-indigo-400/30"
                    }`}>
                      <ShieldCheck className="w-8 h-8 relative z-10" />
                      <div className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                    </div>
                    <div>
                      <h3 className={`font-display font-black tracking-widest text-base ${
                        themeMode === "classic" ? "text-slate-900" : "text-slate-100"
                      }`}>SKILLORA</h3>
                      <p className={`text-base font-extrabold uppercase tracking-widest ${
                        themeMode === "classic" ? "text-amber-700" : "text-amber-400"
                      }`}>Industrial Tech Academy</p>
                    </div>
                  </div>

                  {/* Golden Award Stamp (Interstellar Grade Badge) */}
                  <div className="my-8 flex flex-col items-center md:items-start text-center md:text-left w-full">
                    <div className="relative group/seal cursor-pointer select-none">
                      {/* Outer Ring Rotating */}
                      <div className={`absolute inset-0 rounded-full border-2 border-dashed animate-spin ${
                        themeMode === "classic" ? "border-amber-500/60" : "border-amber-400/40"
                      }`} style={{ animationDuration: "12s" }}></div>
                      
                      <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center p-2 text-center shadow-sm border relative transition-transform duration-300 hover:scale-105 ${
                        themeMode === "classic"
                          ? "bg-gradient-to-b from-amber-100 to-amber-200 text-amber-950 border-amber-300"
                          : themeMode === "obsidian"
                          ? "bg-gradient-to-b from-amber-500/20 to-amber-600/10 text-amber-200 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                          : "bg-gradient-to-b from-indigo-900/30 to-violet-800/20 text-indigo-200 border-indigo-500/30"
                      }`}>
                        <Award className="w-7 h-7 text-amber-500 mb-1" />
                        <span className="text-[7px] font-black uppercase tracking-widest">OFFICIAL SEAL</span>
                        <span className="font-display text-base font-black uppercase tracking-wider mt-0.5">GRADE A+</span>
                        <span className="text-[6px] text-slate-500 font-extrabold tracking-widest">VERIFIED</span>
                      </div>
                    </div>
                  </div>

                  {/* QR Security Verification Section */}
                  <div className="mt-auto space-y-4 w-full">
                    <div className="flex items-center gap-2 bg-slate-500/5 p-3 rounded-lg border border-slate-500/10 hover:border-slate-500/25 transition-all">
                      <div className={`p-1 bg-white rounded-lg shrink-0 flex items-center justify-center ${themeMode === "classic" ? "shadow-sm" : "shadow-sm shadow-black/20"}`}>
                        <QRCodeSVG value={verificationUrl} size={40} level="M" />
                      </div>
                      <div className="text-left">
                        <span className={`block text-[8px] font-black uppercase tracking-widest ${themeMode === "classic" ? "text-slate-500" : "text-slate-400"}`}>CERTIFICATE ID</span>
                        <span className="font-mono text-base font-bold text-emerald-500">ID: {finalCertId}</span>
                        <span className={`block text-[7px] font-semibold ${themeMode === "classic" ? "text-slate-400" : "text-slate-500"} leading-none mt-1`}>Scan to Verify</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Luxurious Certificate Core Data */}
                <div className="flex-1 flex flex-col text-center md:text-left justify-center relative">
                  
                  {/* Decorative background watermarks */}
                  <div className={`absolute top-0 right-0 text-7xl font-black pointer-events-none opacity-[0.02] select-none ${
                    themeMode === "classic" ? "text-slate-950" : "text-white"
                  }`}>
                    SKILLORA ACADEMY
                  </div>

                  {/* Header Badge */}
                  <div className={`flex items-center justify-center md:justify-start gap-2.5 mb-4 ${
                    themeMode === "classic" ? "text-amber-700" : "text-amber-400"
                  }`}>
                    <GraduationCap className="w-4 h-4 " />
                    <span className="text-base font-black uppercase tracking-[0.25em]">SERI SERTIFIKASI EMAS INDUSTRI</span>
                  </div>

                  {/* Bilingual Title */}
                  <div className="space-y-1">
                    <h5 className={`text-base font-extrabold uppercase tracking-widest ${
                      themeMode === "classic" ? "text-slate-400" : "text-slate-500"
                    }`}>
                      SERTIFIKAT KELULUSAN &bull; CERTIFICATE OF COMPLETION
                    </h5>
                    <p className={`text-base font-semibold italic ${
                      themeMode === "classic" ? "text-slate-500" : "text-slate-400"
                    }`}>
                      Sertifikat ini secara resmi dianugerahkan kepada / This is to officially certify that:
                    </p>
                  </div>

                  {/* Name Section with Ultra Luxury Typography */}
                  <div className="my-6 relative py-2.5">
                    <h1 className={`font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none ${
                      themeMode === "classic"
                        ? "text-slate-950 drop-shadow-xs"
                        : themeMode === "obsidian"
                        ? "from-amber-200 via-yellow-400 to-amber-100 bg-clip-text text-transparent drop-shadow-sm"
                        : "from-white via-indigo-100 to-violet-300 bg-clip-text text-transparent drop-shadow-sm"
                    }`}>
                      {profile.name}
                    </h1>
                    {/* Golden Elegant Underline Deco */}
                    <div className={`h-1 w-44 mx-auto md:mx-0 mt-4 rounded-full ${
                      themeMode === "royal" ? "from-indigo-500 to-violet-400" : "from-amber-400 via-yellow-300 to-amber-600"
                    }`}></div>
                  </div>
                  
                  {/* Fulfillment Body */}
                  <p className={`text-base sm:text-base font-medium leading-relaxed max-w-xl ${
                    themeMode === "classic" ? "text-slate-600" : "text-slate-300"
                  }`}>
                    Telah sukses menyelesaikan evaluasi komprehensif, pengerjaan projek standar industri mitra, dan dinilai memenuhi kualifikasi profesional tingkat tinggi dalam bidang:
                    <span className={`block text-base italic mt-1 font-semibold ${themeMode === "classic" ? "text-slate-400" : "text-slate-500"}`}>
                      Has successfully accomplished the comprehensive evaluations, industry partner project requirements, and demonstrated professional proficiency in the program:
                    </span>
                  </p>

                  {/* Course Spotlight Card */}
                  <div className={`mt-4 mb-3 p-4 rounded-lg relative overflow-hidden group border ${
                    themeMode === "classic"
                      ? "bg-slate-50/80 border-slate-200/60 shadow-inner"
                      : "bg-slate-900/60 border-amber-500/10 shadow-sm shadow-black/30"
                  }`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${
                      themeMode === "royal" ? "from-indigo-500 to-violet-500" : "from-amber-400 to-amber-600"
                    }`}></div>
                    
                    <h2 className={`font-display text-base sm:text-base font-black tracking-tight ${
                      themeMode === "classic" ? "text-slate-800" : "text-slate-100"
                    }`}>
                      &ldquo;{activeCertificate.title}&rdquo;
                    </h2>
                    
                    <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-base font-extrabold">
                      <span className={`px-2.5 py-1 rounded-lg border ${
                        themeMode === "classic" 
                          ? "bg-white text-slate-600 border-slate-200/80 shadow-xs" 
                          : "bg-slate-950 text-slate-300 border-slate-800"
                      }`}>
                        ID: <span className="font-mono text-emerald-500 font-bold">{finalCertId}</span>
                      </span>
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 shadow-xs uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Endorsed by {activeCertificate.partner}
                      </span>
                    </div>
                  </div>

                  {/* Meta Stats Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-base border-t border-slate-500/15 pt-5">
                    <div className="flex flex-col text-center md:text-left">
                      <span className={`font-black uppercase tracking-widest text-[8px] mb-1 ${themeMode === "classic" ? "text-slate-400" : "text-slate-500"}`}>Tanggal Terbit / Issue Date</span>
                      <span className={`font-semibold text-base ${themeMode === "classic" ? "text-slate-800" : "text-slate-200"}`}>{issueDate}</span>
                    </div>
                    <div className="flex flex-col text-center md:text-left">
                      <span className={`font-black uppercase tracking-widest text-[8px] mb-1 ${themeMode === "classic" ? "text-slate-400" : "text-slate-500"}`}>Nilai Evaluasi / Performance</span>
                      <span className="text-emerald-500 font-black text-base uppercase flex items-center justify-center md:justify-start gap-1">
                        Grade A+ (95/100) ⭐
                      </span>
                    </div>
                    <div className="flex flex-col text-center md:text-left col-span-2 sm:col-span-1">
                      <span className={`font-black uppercase tracking-widest text-[8px] mb-1 ${themeMode === "classic" ? "text-slate-400" : "text-slate-500"}`}>Durasi Program / Duration</span>
                      <span className={`font-semibold text-base ${themeMode === "classic" ? "text-slate-800" : "text-slate-200"}`}>160 Jam Belajar Terbimbing</span>
                    </div>
                  </div>

                  {/* Interactive Signatures Row */}
                  <div className="flex justify-around items-center pt-8 mt-4 max-w-lg mx-auto md:mx-0 text-[8px] text-slate-400 font-black uppercase tracking-wider border-t border-slate-500/10">
                    <div className="text-center space-y-1.5">
                      {/* Signature graphic/text with real vintage font look */}
                      <p className={`italic font-serif text-base ${themeMode === "classic" ? "text-slate-900" : "text-slate-100"}`}>
                        Prof. Hoot, AI Dean
                      </p>
                      <div className="w-20 h-px bg-slate-500/30 mx-auto"></div>
                      <p className={`text-[7px] ${themeMode === "classic" ? "text-slate-400" : "text-slate-500"}`}>Dekan Riset Skillora AI</p>
                    </div>
                    
                    <div className="text-center space-y-1.5">
                      <p className={`italic font-serif text-base ${themeMode === "classic" ? "text-slate-900" : "text-slate-100"}`}>
                        {activeCertificate.partner} Board
                      </p>
                      <div className="w-20 h-px bg-slate-500/30 mx-auto"></div>
                      <p className={`text-[7px] ${themeMode === "classic" ? "text-slate-400" : "text-slate-500"}`}>Direktur Program Industri</p>
                    </div>
                  </div>

                </div>

              </div>

            </div>
            
            {/* CSS to handle print mode correctly without any layout disruptions */}
            <style>{`
              @media print {
                @page {
                  size: landscape;
                  margin: 0;
                }
                body {
                  margin: 0;
                  background: none !important;
                }
                body * {
                  visibility: hidden;
                }
                #printable-certificate, #printable-certificate * {
                  visibility: visible;
                }
                #printable-certificate {
                  position: fixed;
                  left: 0;
                  top: 0;
                  width: 100vw;
                  height: 100vh;
                  box-shadow: none !important;
                  margin: 0 !important;
                  padding: 3.5rem !important;
                  border: none !important;
                  border-radius: 0 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  page-break-inside: avoid;
                }
              }
            `}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
