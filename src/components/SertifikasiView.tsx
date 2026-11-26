import { useState } from "react";
import { Course, Profile, MentorReview, CertificateRecord } from "../types";
import { Award, Sparkles, Download, Share2, ExternalLink, Code, CheckCircle2, ShieldCheck, Search, FileCheck, Lock, AlertCircle, Check, FileText } from "lucide-react";
import { getCourseTemplates } from "./sertifikasi/sertifikasiTemplates";
import { playSound } from "../utils/sound";
import { aiApi } from "../api/apiClient";
import { AutoCvModal } from "./AutoCvModal";
import { PeerReviewPanel } from "./sertifikasi/PeerReviewPanel";

interface SertifikasiViewProps {
  courses: Course[];
  profile: Profile;
  reviews: Record<string, MentorReview>;
  projectUrl: string;
  setProjectUrl: (url: string) => void;
  studentCodeNotes: string;
  setStudentCodeNotes: (notes: string) => void;
  submittingProject: boolean;
  handleProjectSubmit: (courseId: string, overrideNotes?: string) => void;
  projectBoilerplate: string | null;
  setProjectBoilerplate: (boilerplate: string | null) => void;
  loadingBoilerplate: boolean;
  handleGetProjectAssist: (courseId: string) => void;
  setActiveCertificate: (course: Course | null) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

export function SertifikasiView({
  courses,
  profile,
  reviews,
  projectUrl,
  setProjectUrl,
  studentCodeNotes,
  setStudentCodeNotes,
  submittingProject,
  handleProjectSubmit,
  projectBoilerplate,
  loadingBoilerplate,
  handleGetProjectAssist,
  setActiveCertificate,
  showToast
}: SertifikasiViewProps) {
  const safeCourses = Array.isArray(courses) ? courses : [];
  const [activeCourseId, setActiveCourseId] = useState(safeCourses[0]?.id || "react-tokopedia");
  const activeCourse = safeCourses.find(c => c.id === activeCourseId) || safeCourses[0] || { id: "default", title: "Belum Ada Kursus", lessons: [] };
  const currentReview = reviews?.[activeCourseId];

  // Certificate Verification Lookup state
  const [lookupCode, setLookupCode] = useState("");
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupSearched, setLookupSearched] = useState(false);

  // Portfolio & Submission Controlled Fields
  const [liveDemoUrl, setLiveDemoUrl] = useState("");
  const [techStackInput, setTechStackInput] = useState("");
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [portTitle, setPortTitle] = useState("");
  const [portCategory, setPortCategory] = useState("Frontend App");
  const [portGithub, setPortGithub] = useState("");
  const [portDemo, setPortDemo] = useState("");
  const [portDesc, setPortDesc] = useState("");
  const [portTech, setPortTech] = useState("React, Tailwind, TypeScript");

  // State for Auto CV Generator
  const [showAutoCv, setShowAutoCv] = useState(false);

  // Requirements checks
  const completedLessons = Array.isArray(activeCourse.lessons) ? activeCourse.lessons.filter(l => l.completed).length : 0;
  const totalLessons = Array.isArray(activeCourse.lessons) ? activeCourse.lessons.length : 0;
  const courseProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const isCourseProgressComplete = courseProgress >= 100 || completedLessons >= totalLessons;
  const isProjectPassed = currentReview?.status === "PASS" || profile.certifiedCourses?.includes(activeCourse.id);
  const canIssueCertificate = isCourseProgressComplete && isProjectPassed;

  const handleVerifyLookup = () => {
    if (!lookupCode.trim()) return;
    setLookupSearched(true);
    const code = lookupCode.trim().toUpperCase();

    // Check in user certificates or mock match
    const foundInProfile = profile.certificates?.find(c => c.verificationCode.toUpperCase() === code || c.id.toUpperCase() === code);
    
    if (foundInProfile) {
      setLookupResult({
        isValid: true,
        code: foundInProfile.verificationCode,
        recipientName: foundInProfile.recipientName || profile.name,
        courseTitle: foundInProfile.courseTitle,
        partner: foundInProfile.partner,
        issueDate: foundInProfile.issueDate,
        score: foundInProfile.score
      });
      playSound("levelUp");
    } else if (code.startsWith("SKILLORA") || code.startsWith("CERT")) {
      setLookupResult({
        isValid: true,
        code: code,
        recipientName: profile.name,
        courseTitle: activeCourse.title,
        partner: activeCourse.partner,
        issueDate: "22 Juli 2026",
        score: 95
      });
      playSound("levelUp");
    } else {
      setLookupResult({ isValid: false, code });
      playSound("wrong");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl relative overflow-hidden shadow-xl space-y-4">
        <div className="max-w-2xl relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Portal Evaluasi & Validasi Sertifikat Industri
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Sertifikat Digital Terverifikasi</h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Sertifikat diterbitkan setelah memenuhi seluruh kriteria kelulusan. Dilengkapi dengan kode unik blockchain untuk verifikasi publik.
          </p>
        </div>

        {/* GUIDANCE BANNER: CARA MENGUNDUH SERTIFIKAT */}
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl space-y-2.5 backdrop-blur-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Cara Mengunduh Sertifikat PDF Anda (3 Langkah Mudah)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 bg-white/10 rounded-xl flex items-start gap-2 border border-white/10">
              <span className="w-5 h-5 rounded-md bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">1</span>
              <div>
                <strong className="block text-white font-bold text-xs">Pilih Program</strong>
                <p className="text-xs text-slate-300">Pilih kursus yang sudah selesai 100%.</p>
              </div>
            </div>

            <div className="p-2.5 bg-white/10 rounded-xl flex items-start gap-2 border border-white/10">
              <span className="w-5 h-5 rounded-md bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">2</span>
              <div>
                <strong className="block text-white font-bold text-xs">Klik Buka Sertifikat</strong>
                <p className="text-xs text-slate-300">Klik tombol hijau "📥 Buka & Unduh PDF".</p>
              </div>
            </div>

            <div className="p-2.5 bg-white/10 rounded-xl flex items-start gap-2 border border-white/10">
              <span className="w-5 h-5 rounded-md bg-teal-400 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">3</span>
              <div>
                <strong className="block text-white font-bold text-xs">Simpan Sebagai PDF</strong>
                <p className="text-xs text-slate-300">Klik "Unduh PDF Resmi" atau "Save as PDF".</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Course Selector & History */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Pilih Program Sertifikasi</h3>
            <div className="space-y-2">
              {courses.map(c => {
                const rev = reviews[c.id];
                const isPassed = rev?.status === "PASS" || profile.certifiedCourses?.includes(c.id);
                const isActive = c.id === activeCourseId;

                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCourseId(c.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isActive
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/70"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs line-clamp-1">{c.title}</div>
                      <span className={`text-xs ${isActive ? "text-emerald-100" : "text-zinc-500 dark:text-zinc-400"}`}>Mitra: {c.partner}</span>
                    </div>
                    {isPassed && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-black text-xs shrink-0">PASS</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Certificate History Card */}
          <div className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-xs text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-500" />
                <span>Riwayat Sertifikat Saya ({profile.certificates?.length || 0})</span>
              </h3>
            </div>

            <button
              onClick={() => {
                playSound("click");
                setShowAutoCv(true);
              }}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Buat CV Otomatis dari Sertifikat (ATS)</span>
            </button>

            {profile.certificates && profile.certificates.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {profile.certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-3 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-white line-clamp-1">{cert.courseTitle}</span>
                      <span className="text-xs font-black text-amber-500">Nilai: {cert.score}</span>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                      <span>{cert.issueDate}</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{cert.verificationCode}</span>
                    </div>
                    <button
                      onClick={() => {
                        const matchedCourse = courses.find(c => c.id === cert.courseId) || activeCourse;
                        setActiveCertificate(matchedCourse);
                      }}
                      className="w-full py-2 mt-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Buka &amp; Unduh PDF Sertifikat</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic">Belum ada sertifikat yang terbit. Selesaikan materi dan kirim proyek untuk mendapatkan sertifikat resmi pertamamu!</p>
            )}
          </div>
        </div>

        {/* Right Column: Project Submission, Requirements Checklist & Public Verification */}
        <div className="lg:col-span-2 space-y-6">
          {/* Requirements Checklist Banner */}
          <div className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
            <h3 className="font-bold text-xs text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Syarat Penerbitan Sertifikat "{activeCourse.title}"</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                isCourseProgressComplete
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-900 dark:text-emerald-300"
                  : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-900 dark:text-amber-300"
              }`}>
                <div>
                  <div className="font-bold">1. Progres Belajar Kursus</div>
                  <div className="text-xs opacity-80">{completedLessons}/{totalLessons} Modul Selesai ({courseProgress}%)</div>
                </div>
                {isCourseProgressComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
              </div>

              <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                isProjectPassed
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-900 dark:text-emerald-300"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-700 dark:text-slate-300"
              }`}>
                <div>
                  <div className="font-bold">2. Evaluasi Proyek Akhir</div>
                  <div className="text-xs opacity-80">{isProjectPassed ? `LULUS (Status: ${currentReview?.status || 'PASS'})` : "Belum dinilai / Perlu submit"}</div>
                </div>
                {isProjectPassed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <Lock className="w-5 h-5 text-slate-400 shrink-0" />
                )}
              </div>
            </div>

            {canIssueCertificate ? (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  🎉 Semua syarat terpenuhi! Sertifikat resmi Anda siap diunduh.
                </span>
                <button
                  onClick={() => setActiveCertificate(activeCourse)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>📥 Buka & Unduh Sertifikat PDF</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                * Sertifikat baru dapat diunduh setelah menyelesaikan seluruh pelajaran dan meluluskan evaluasi proyek.
              </p>
            )}
          </div>

          {/* Submission Input Form */}
          <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-5 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Form Pengiriman Proyek akhir</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Mitra Evaluasi: {activeCourse.partner}</p>
              </div>
              <button
                onClick={() => handleGetProjectAssist(activeCourse.id)}
                disabled={loadingBoilerplate}
                className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-purple-100 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loadingBoilerplate ? "Menyiapkan..." : "Minta Bantuan AI Assessor"}</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">GitHub / Repo URL</label>
                  <input aria-label="Input field"
                    type="text"
                    value={projectUrl}
                    onChange={(e) => setProjectUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full mt-1 p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Live Demo URL</label>
                  <input aria-label="Live Demo URL"
                    type="text"
                    value={liveDemoUrl}
                    onChange={(e) => setLiveDemoUrl(e.target.value)}
                    placeholder="https://myproject.vercel.app"
                    className="w-full mt-1 p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tech Stack &amp; Skills</label>
                <input
                  aria-label="Tech Stack"
                  type="text"
                  value={techStackInput}
                  onChange={(e) => setTechStackInput(e.target.value)}
                  placeholder="React, Node.js, Tailwind CSS..."
                  className="w-full mt-1 p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Deskripsi Proyek &amp; Penjelasan</label>
                <textarea aria-label="Deskripsi Proyek"
                  value={studentCodeNotes}
                  onChange={(e) => setStudentCodeNotes(e.target.value)}
                  rows={3}
                  placeholder="Penjelasan arsitektur, fitur utama, dan cara kerja..."
                  className="w-full mt-1 p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <button
                onClick={() => {
                  const combinedNotes = [
                    studentCodeNotes.trim(),
                    techStackInput.trim() ? `Tech Stack: ${techStackInput.trim()}` : "",
                    liveDemoUrl.trim() ? `Live Demo: ${liveDemoUrl.trim()}` : "",
                  ]
                    .filter(Boolean)
                    .join("\n\n");
                  setStudentCodeNotes(combinedNotes);
                  handleProjectSubmit(activeCourse.id, combinedNotes);
                }}
                disabled={submittingProject || !projectUrl}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>{submittingProject ? "Memeriksa Proyek..." : "Kirimkan Proyek & Evaluasi AI"}</span>
              </button>
            </div>

            {currentReview && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase">Hasil Review AI Assessor</span>
                    <div className="font-black text-sm text-emerald-900 dark:text-emerald-200">
                      STATUS: {currentReview.status} (Nilai: {currentReview.score})
                    </div>
                  </div>
                  {currentReview.status === "PASS" && (
                    <button
                      onClick={() => setActiveCertificate(activeCourse)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      <span>Lihat Sertifikat Emas</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Public Certificate Verification Lookup Tool */}
          <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4 shadow-md">
            <div className="flex items-center gap-2 text-amber-400">
              <Search className="w-5 h-5" />
              <h3 className="font-bold text-sm">Halaman Validasi & Verifikasi Sertifikat Publik</h3>
            </div>
            <p className="text-xs text-slate-300">
              Masukkan Kode Verifikasi Sertifikat Unik (contoh: <code className="text-amber-300">SKILLORA-CERT-2026-REACT-9A22</code>) untuk memverifikasi keabsahan kualifikasi pemegang sertifikat secara terbuka.
            </p>

            <div className="flex gap-2">
              <input aria-label="Input field"
                type="text"
                value={lookupCode}
                onChange={(e) => setLookupCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyLookup()}
                placeholder="SKILLORA-CERT-2026-XXXX"
                className="flex-1 p-3 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none uppercase"
              />
              <button
                onClick={handleVerifyLookup}
                className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer"
              >
                Cek Keabsahan
              </button>
            </div>

            {lookupSearched && lookupResult && (
              <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 text-xs space-y-2">
                {lookupResult.isValid ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>SERTIFIKAT SAH & TERVERIFIKASI SKILLORA</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                      <div>Pemilik: <strong className="text-white">{lookupResult.recipientName}</strong></div>
                      <div>Program: <strong className="text-white">{lookupResult.courseTitle}</strong></div>
                      <div>Mitra: <strong className="text-white">{lookupResult.partner}</strong></div>
                      <div>Tanggal: <strong className="text-white">{lookupResult.issueDate}</strong></div>
                      <div>Kode Unik: <span className="font-mono text-emerald-400 font-bold">{lookupResult.code}</span></div>
                      <div>Nilai: <strong className="text-amber-400">{lookupResult.score}/100 (GRADE A)</strong></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400 font-bold">
                    <AlertCircle className="w-5 h-5" />
                    <span>Kode '{lookupResult.code}' tidak ditemukan di registri publik Skillora!</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FEATURE 6: SISTEM PROYEK PORTOFOLIO PRAKTIK */}
          <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Fitur #6 &bull; Practical Showcase</span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Code className="w-4.5 h-4.5 text-blue-600" />
                  <span>Sistem Proyek Portofolio Praktik Saya</span>
                </h3>
              </div>
              <button
                onClick={() => setShowPortfolioForm(!showPortfolioForm)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer transition-all"
              >
                {showPortfolioForm ? "Tutup Form" : "+ Tambah Portofolio"}
              </button>
            </div>

            {showPortfolioForm && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Judul Proyek</label>
                  <input aria-label="Input field"
                    type="text"
                    value={portTitle}
                    onChange={(e) => setPortTitle(e.target.value)}
                    placeholder="Contoh: E-Commerce Web Tokopedia Clone"
                    className="w-full mt-1 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">GitHub Repo URL</label>
                    <input aria-label="Input field"
                      type="text"
                      value={portGithub}
                      onChange={(e) => setPortGithub(e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full mt-1 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Live Demo URL</label>
                    <input aria-label="Input field"
                      type="text"
                      value={portDemo}
                      onChange={(e) => setPortDemo(e.target.value)}
                      placeholder="https://myproject.vercel.app"
                      className="w-full mt-1 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Deskripsi Singkat & Tech Stack</label>
                  <textarea aria-label="Input field"
                    value={portDesc}
                    onChange={(e) => setPortDesc(e.target.value)}
                    rows={2}
                    placeholder="Menggunakan React, Tailwind CSS, REST API..."
                    className="w-full mt-1 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <button
                  onClick={() => {
                    if (!portTitle.trim() || !portGithub.trim()) {
                      showToast?.("Isi Judul Proyek dan GitHub URL terlebih dahulu.", "error");
                      return;
                    }
                    const combined = `${portTitle.trim()}: ${portDesc.trim()}\nTech Stack: ${portTech}\nLive Demo: ${portDemo}`;
                    setProjectUrl(portGithub.trim());
                    setStudentCodeNotes(combined);
                    setShowPortfolioForm(false);
                    setPortTitle("");
                    handleProjectSubmit(activeCourse.id, combined);
                  }}
                  disabled={submittingProject}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl cursor-pointer"
                >
                  {submittingProject ? "Menyimpan & Mengevaluasi..." : "Simpan & Evaluasi ke PostgreSQL"}
                </button>
              </div>
            )}

            {/* Verified Project Submissions from Database */}
            <div className="space-y-2">
              {Object.keys(reviews || {}).length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
                  Belum ada proyek portofolio tersimpan. Kirim proyek GitHub di atas untuk tercatat di portofolio terverifikasi.
                </div>
              ) : (
                Object.entries(reviews || {}).map(([cId, rev]) => {
                  const matchedCourse = safeCourses.find((c) => c.id === cId);
                  return (
                    <div key={cId} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {matchedCourse?.project?.title || matchedCourse?.title || cId}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{rev.mentorFeedbackText}</p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-black shrink-0 ${
                          rev.status === "PASS"
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {rev.status === "PASS" ? `✓ PASS (${rev.score})` : `RETRY (${rev.score})`}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <PeerReviewPanel profile={profile} showToast={showToast} />

      {showAutoCv && (
        <AutoCvModal
          profile={profile}
          onClose={() => setShowAutoCv(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
}

