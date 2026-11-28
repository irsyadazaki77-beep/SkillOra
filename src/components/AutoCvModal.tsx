import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Copy, Download, Check, X, Sparkles, Award, Edit3, ShieldCheck, ArrowUpRight } from "lucide-react";
import { Profile } from "../types";
import { ROUTES } from "../routes";
import { playSound } from "../utils/sound";
import { motion } from "motion/react";
import { SkilloraLogoIcon } from "./SkilloraLogo";

interface AutoCvModalProps {
  profile: Profile;
  onClose: () => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

export function AutoCvModal({ profile, onClose, showToast }: AutoCvModalProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"ats" | "modern" | "markdown">("ats");

  // Editable Profile fields for CV Customization
  const [targetRole, setTargetRole] = useState(profile.role || "Fullstack Engineer / Management Trainee");
  const [summary, setSummary] = useState(
    `Pembelajar terverifikasi di platform Skillora dengan keahlian pengembangan aplikasi web modern, pemecahan masalah teknis, serta kesiapan seleksi kerja BUMN dan Tech Unicorn.`
  );
  const [workExp, setWorkExp] = useState(
    `• Software Engineering Intern | Skillora Labs (2026)\n  - Mengembangkan 12+ modul interaktif React, TypeScript, dan Node.js API\n  - Berkolaborasi dalam tim agile dan mengoptimalkan performa halaman hingga 35%`
  );

  // Certified Courses
  const certifiedItems = useMemo(() => {
    if (profile.certifiedCourses && profile.certifiedCourses.length > 0) {
      return profile.certifiedCourses;
    }
    return [
      { id: "c1", title: "React & TypeScript Masterclass", date: "2026-05-12", credentialId: "SKILLORA-88219" },
      { id: "c2", title: "Simulasi Tes TKD BUMN & TPA", date: "2026-06-20", credentialId: "SKILLORA-99104" }
    ];
  }, [profile]);

  const skillsList = useMemo(() => {
    if (profile.skills && profile.skills.length > 0) {
      return profile.skills.map((s: any) => (typeof s === "string" ? s : s.name));
    }
    return ["React.js", "TypeScript", "Tailwind CSS", "REST API", "Git", "Penalaran Logis TKD"];
  }, [profile]);

  // Generate ATS Text CV
  const atsCvText = useMemo(() => {
    return `==================================================
CURRICULUM VITAE (ATS-FRIENDLY STANDARD)
==================================================

1. DATA PRIBADI
--------------------------------------------------
Nama Lengkap : ${profile.name || "Mahasiswa Skillora"}
Email        : ${profile.email || "user@skillora.id"}
Posisi Target: ${targetRole}
Lokasi       : Indonesia
Total XP     : ${profile.xp || 0} XP (Skillora Certified Member)

2. RINGKASAN PROFIL
--------------------------------------------------
${summary}

3. KEAHLIAN TEKNIS & KOMPETENSI
--------------------------------------------------
• Keahlian Utama  : ${skillsList.join(", ")}
• Skor Kraepelin  : Konsistensi Tinggi (Tingkat Ketahanan Kerja Baik)
• Kuis Seleksi    : TKD BUMN & TPA Passed (Skor rata-rata > 80%)

4. PENGALAMAN & PROYEK PORTOPOLIO
--------------------------------------------------
${workExp}

5. SERTIFIKASI RESMI (SKILLORA CERTIFIED)
--------------------------------------------------
${certifiedItems.map((c: any, idx: number) => `${idx + 1}. ${c.title || c.name}
   • Tanggal Terbit : ${c.date || "2026"}
   • ID Kredensial  : ${c.credentialId || "SKILLORA-CERT-" + (idx + 100)}
   • Tautan Verifikasi: https://skillora.id/verify/${c.credentialId || "CERT-" + idx}`).join("\n\n")}

==================================================
Dibuat Otomatis via Skillora Career Platform
==================================================`;
  }, [profile, targetRole, summary, workExp, certifiedItems, skillsList]);

  // Generate Markdown CV
  const markdownCvText = useMemo(() => {
    return `# ${profile.name || "Mahasiswa Skillora"}
**Email:** ${profile.email || "user@skillora.id"} | **Target:** ${targetRole}

---

## 🚀 Ringkasan Profil
${summary}

## 🛠️ Keahlian Utama
${skillsList.map(s => `- **${s}**`).join("\n")}

## 💼 Pengalaman Kerja & Proyek
${workExp}

## 📜 Sertifikasi Terverifikasi
${certifiedItems.map((c: any) => `- **${c.title || c.name}** (ID: \`${c.credentialId || "SKILLORA-101"}\`) - *Terbit: ${c.date || "2026"}*`).join("\n")}

---
*Diproduksi oleh Skillora AI Auto-CV Builder*`;
  }, [profile, targetRole, summary, workExp, certifiedItems, skillsList]);

  const currentCvContent = selectedFormat === "markdown" ? markdownCvText : atsCvText;

  const handleCopy = () => {
    playSound("click");
    navigator.clipboard.writeText(currentCvContent);
    setCopied(true);
    if (showToast) showToast("Teks CV berhasil disalin ke clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    playSound("claim");
    const ext = selectedFormat === "markdown" ? "md" : "txt";
    const filename = `CV_${(profile.name || "Skillora").replace(/\s+/g, "_")}.${ext}`;
    const blob = new Blob([currentCvContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (showToast) showToast(`File ${filename} berhasil diunduh!`, "success");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-800 rounded-3xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
      >
        {/* Header */}
        <div className="p-5 bg-[#0A1628] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <SkilloraLogoIcon size={40} />
            <div>
              <h3 className="font-bold text-base">Pembuat CV ATS Skillora</h3>
              <p className="text-xs text-slate-300">Kompas Kompetensi &amp; Karier · Ekspor langsung ke format PDF/Teks ATS</p>
            </div>
          </div>
          <button aria-label="Aksi X" onClick={onClose} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Form Editor Column */}
          <div className="md:col-span-5 p-5 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 overflow-y-auto space-y-4 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-emerald-500" /> Kustomisasi CV
            </h4>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Target Posisi / Job Title</label>
              <input aria-label="Input field"
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full mt-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Ringkasan Eksekutif (Summary)</label>
              <textarea aria-label="Input field"
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full mt-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              ></textarea>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Pengalaman & Poin Pencapaian</label>
              <textarea aria-label="Input field"
                rows={4}
                value={workExp}
                onChange={(e) => setWorkExp(e.target.value)}
                className="w-full mt-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              ></textarea>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sertifikat & Skor Tes Skillora Anda terhubung otomatis.</span>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="md:col-span-7 flex flex-col bg-white dark:bg-slate-950 overflow-hidden">
            {/* Action Bar */}
            <div className="p-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <button
                  onClick={() => setSelectedFormat("ats")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedFormat === "ats" ? "bg-emerald-600 text-white" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  ATS Teks
                </button>
                <button
                  onClick={() => setSelectedFormat("markdown")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedFormat === "markdown" ? "bg-emerald-600 text-white" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  Markdown
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={handleCopy} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Tersalin" : "Salin"}</span>
                </button>
                <button onClick={handleDownloadFile} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs">
                  <Download className="w-3.5 h-3.5" /> Unduh
                </button>
              </div>
            </div>

            {/* Preview Document Area */}
            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {currentCvContent}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex flex-wrap justify-between items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1 font-medium">
            <Award className="w-4 h-4 text-emerald-500" /> Format ATS disesuaikan dengan standar HRD Indonesia.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(ROUTES.career.cvBuilder);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              <span>Buka CV ATS Builder & Audit AI</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold rounded-xl cursor-pointer">
              Tutup
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
