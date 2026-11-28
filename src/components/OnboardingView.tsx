import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Briefcase,
  GraduationCap,
  ArrowUpCircle,
  Award,
  CheckCircle2,
  ArrowRight,
  Building2,
  BookOpenCheck,
  Users,
} from "lucide-react";
import { Profile } from "../types";
import { userApi } from "../api/apiClient";
import { SkilloraLogo } from "./SkilloraLogo";

interface OnboardingViewProps {
  profile: Profile;
  onComplete: (updatedProfile: Profile) => void;
}

export function OnboardingView({ profile, onComplete }: OnboardingViewProps) {
  const [step, setStep] = useState(1);
  const [accountRole, setAccountRole] = useState<"student" | "mentor" | "recruiter">("student");
  const [selectedGoal, setSelectedGoal] = useState("kerja");
  const [selectedLevel, setSelectedLevel] = useState("menengah");

  // Extra metadata for Mentor / Recruiter
  const [companyName, setCompanyName] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("Teknologi & Digital");
  const [mentorSpecialty, setMentorSpecialty] = useState("Frontend Engineering & UI/UX");
  const [mentorHeadline, setMentorHeadline] = useState("Senior Industry Practitioner");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const roles = [
    {
      id: "student" as const,
      icon: GraduationCap,
      title: "Mahasiswa & Talenta Karir",
      desc: "Ikuti kursus terstruktur, asesmen AI adaptif, bangun CV ATS, mock interview suara, dan lamar kerja.",
    },
    {
      id: "mentor" as const,
      icon: BookOpenCheck,
      title: "Mentor / Dosen Industri",
      desc: "Kelola kurikulum LMS, tinjau proyek portofolio mahasiswa, terbitkan sertifikat, dan buka sesi mentoring 1-on-1.",
    },
    {
      id: "recruiter" as const,
      icon: Building2,
      title: "Recruiter / HRD Mitra",
      desc: "Publikasikan lowongan kerja, kelola pipeline kandidat ATS, cari talenta tersertifikasi, dan jadwalkan wawancara.",
    },
  ];

  const goals = [
    { id: "kerja", icon: Briefcase, title: "Siap Kerja & Magang", desc: "Fokus pada portfolio, CV ATS, dan penyaluran kerja HRD." },
    { id: "kuliah", icon: GraduationCap, title: "Penunjang Akademik", desc: "Pendalaman materi kuliah & proyek praktik nyata." },
    { id: "upskill", icon: ArrowUpCircle, title: "Akselerasi & BUMN", desc: "Asesmen adaptif TKD/Psikotes dan simulasi wawancara." },
    { id: "sertifikasi", icon: Award, title: "Sertifikasi Kompetensi", desc: "Lulus proyek industri dan verifikasi kredensial publik." },
  ];

  const levels = [
    { id: "pemula", title: "Pemula Mutlak", desc: "Baru memulai dari fondasi teori dan praktik dasar." },
    { id: "menengah", title: "Paham Dasar", desc: "Sudah memahami dasar, siap mengerjakan proyek & asesmen." },
    { id: "lanjutan", title: "Berpengalaman", desc: "Fokus tantangan tingkat lanjut, interview HR, dan rekrutmen." },
  ];

  const handleFinish = async () => {
    setErrorMsg(null);
    if (accountRole === "recruiter" && !companyName.trim()) {
      setErrorMsg("Nama perusahaan wajib diisi untuk akun Recruiter / HRD.");
      return;
    }

    setSaving(true);
    try {
      const roleLabel =
        accountRole === "recruiter"
          ? `HRD / Recruiter — ${companyName.trim()}`
          : accountRole === "mentor"
          ? mentorHeadline.trim() || "Mentor & Dosen Skillora"
          : "Mahasiswa & Talenta Karir";

      const data = await userApi.completeOnboarding({
        learningGoal: accountRole === "student" ? selectedGoal : accountRole,
        selectedLevelPref: selectedLevel,
        role: roleLabel,
        accountRole,
        companyName: accountRole === "recruiter" ? companyName.trim() : undefined,
        companyIndustry: accountRole === "recruiter" ? companyIndustry.trim() : undefined,
        mentorSpecialty: accountRole === "mentor" ? mentorSpecialty.trim() : undefined,
        mentorHeadline: accountRole === "mentor" ? mentorHeadline.trim() : undefined,
      });

      if (data?.profile) {
        onComplete(data.profile);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || "Gagal menyimpan profil onboarding ke server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-8 font-sans">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative min-h-[540px] flex flex-col">
        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 w-full">
          <motion.div
            className="h-full bg-emerald-600"
            initial={{ width: "33%" }}
            animate={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="flex-1 p-6 sm:p-10 flex flex-col">
          <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <SkilloraLogo variant="full" size="sm" showTagline={true} compactTagline={true} />
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              Langkah {step} / 3
            </span>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="flex flex-col h-full"
              >
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                    Langkah 1 dari 3 • Identitas Platform
                  </p>
                  <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                    Pilih Peran Utama Anda di Skillora
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Setiap peran membuka workspace khusus dan dapat diperbarui kapan saja di pengaturan profil.
                  </p>
                </div>

                <div className="space-y-3 mb-auto">
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const isSelected = accountRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setAccountRole(r.id)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 cursor-pointer ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30"
                            : "border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div
                          className={`p-2.5 rounded-lg shrink-0 ${
                            isSelected
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{r.title}</h4>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{r.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors cursor-pointer"
                  >
                    <span>Lanjutkan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="flex flex-col h-full"
              >
                {accountRole === "student" ? (
                  <>
                    <div className="mb-6">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                        Langkah 2 dari 3 • Fokus Karir Mahasiswa
                      </p>
                      <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                        Apa tujuan utama Anda saat ini?
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        AI akan menyusun jalur belajar, asesmen adaptif, dan rekomendasi lowongan sesuai target.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-auto">
                      {goals.map((g) => {
                        const Icon = g.icon;
                        const isSelected = selectedGoal === g.id;
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => setSelectedGoal(g.id)}
                            className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col items-start gap-2.5 cursor-pointer ${
                              isSelected
                                ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30"
                                : "border-slate-200 dark:border-slate-800 hover:border-emerald-300"
                            }`}
                          >
                            <div
                              className={`p-2 rounded-lg ${
                                isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{g.title}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{g.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : accountRole === "mentor" ? (
                  <>
                    <div className="mb-6">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                        Langkah 2 dari 3 • Profil Mentor & Dosen
                      </p>
                      <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                        Lengkapi Kredensial Mentor Anda
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Profil ini tampil kepada mahasiswa di katalog mentoring 1-on-1 dan peninjauan proyek.
                      </p>
                    </div>
                    <div className="space-y-4 mb-auto">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Jabatan / Headline Profesional</label>
                        <input
                          type="text"
                          value={mentorHeadline}
                          onChange={(e) => setMentorHeadline(e.target.value)}
                          placeholder="Contoh: Staff Frontend Engineer @ Tokopedia"
                          className="w-full mt-1.5 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bidang Keahlian Utama</label>
                        <input
                          type="text"
                          value={mentorSpecialty}
                          onChange={(e) => setMentorSpecialty(e.target.value)}
                          placeholder="Contoh: React, System Design, Data Science, Persiapan BUMN"
                          className="w-full mt-1.5 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-6">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                        Langkah 2 dari 3 • Identitas Perusahaan Mitra
                      </p>
                      <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                        Daftarkan Organisasi HRD Anda
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Lowongan yang Anda terbitkan akan langsung tampil di Bursa Kerja Skillora dan terhubung ke pipeline ATS.
                      </p>
                    </div>
                    <div className="space-y-4 mb-auto">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nama Perusahaan / Instansi *</label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Contoh: PT Nusantara Digital Tbk"
                          className="w-full mt-1.5 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sektor Industri</label>
                        <input
                          type="text"
                          value={companyIndustry}
                          onChange={(e) => setCompanyIndustry(e.target.value)}
                          placeholder="Contoh: Fintech, E-Commerce, BUMN Energi"
                          className="w-full mt-1.5 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="mt-8 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer"
                  >
                    <span>Selanjutnya</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col h-full"
              >
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                    Langkah 3 dari 3 • Kalibrasi Pengalaman
                  </p>
                  <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                    {accountRole === "student" ? "Pilih Level Kesiapan Anda" : "Konfirmasi Aktivasi Portal"}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    {accountRole === "student"
                      ? "Menentukan titik awal asesmen AI adaptif dan rekomendasi kurikulum Anda."
                      : "Semua modul PostgreSQL siap digunakan secara penuh untuk akun Anda."}
                  </p>
                </div>

                <div className="space-y-3 mb-auto">
                  {levels.map((l) => {
                    const isSelected = selectedLevel === l.id;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setSelectedLevel(l.id)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30"
                            : "border-slate-200 dark:border-slate-800 hover:border-emerald-300"
                        }`}
                      >
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{l.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{l.desc}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? "border-emerald-600" : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleFinish}
                    className="flex-1 max-w-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {saving ? "Menyiapkan Workspace..." : "Masuk ke Platform Skillora"}
                    <Users className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default OnboardingView;
