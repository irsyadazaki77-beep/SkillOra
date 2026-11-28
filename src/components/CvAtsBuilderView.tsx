import React, { useState, useEffect } from "react";
import {
  FileText,
  Save,
  Sparkles,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Award,
  Wand2,
  Briefcase,
} from "lucide-react";
import { cvApi, jobApi } from "../api/apiClient";
import { CvAtsFeedback, CvDocument, JobVacancy, Profile } from "../types";
import { playSound } from "../utils/sound";
import { SkilloraLogoIcon } from "./SkilloraLogo";

interface CvAtsBuilderViewProps {
  profile: Profile;
  jobs?: JobVacancy[];
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

const createEmptyCv = (profile: Profile): CvDocument => ({
  title: `CV ATS — ${profile.role || "Kandidat Profesional"}`,
  targetRole: profile.role || "Frontend & Fullstack Developer",
  summary:
    profile.bio ||
    `Profesional dan mahasiswa terverifikasi dengan keahlian pada ${(profile.skills || []).slice(0, 4).join(", ") || "pengembangan aplikasi web dan analitik bisnis"}. Berfokus pada kualitas pengiriman produk serta kolaborasi lintas tim.`,
  experiences: [
    {
      role: "Software Engineering / Project Contributor",
      company: "Skillora Industry Lab",
      period: "2025 - Sekarang",
      bullets: [
        "Mengembangkan aplikasi web terintegrasi REST API dan database PostgreSQL dengan standar produksi",
        "Menyelesaikan proyek studi kasus terverifikasi bersama tim kolaborasi",
      ],
    },
  ],
  education: [
    {
      school: "Universitas / Institut Mitra",
      degree: "S1 Teknik Informatika / Sistem Informasi",
      year: "2022 - 2026",
      gpa: "3.75",
    },
  ],
  projects: [
    {
      name: "Sistem Informasi & Portofolio Industri",
      link: "https://github.com/skillora-portfolio",
      impact: "Lulus rubrik evaluasi mentor dengan skor kompetensi tinggi",
    },
  ],
  skills: Array.isArray(profile.skills) ? [...profile.skills] : ["TypeScript", "React", "SQL"],
});

export function CvAtsBuilderView({ profile, jobs: propJobs, showToast }: CvAtsBuilderViewProps) {
  const [savedCvs, setSavedCvs] = useState<CvDocument[]>([]);
  const [draft, setDraft] = useState<CvDocument>(() => createEmptyCv(profile));
  const [jobsList, setJobsList] = useState<JobVacancy[]>(propJobs || []);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [feedback, setFeedback] = useState<CvAtsFeedback | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  const loadData = async () => {
    setLoadingList(true);
    try {
      const docs = await cvApi.list();
      setSavedCvs(Array.isArray(docs) ? docs : []);
      if (docs && docs.length > 0 && !draft.id) {
        setDraft(docs[0]);
        if (docs[0].atsFeedback) setFeedback(docs[0].atsFeedback);
      }
    } catch {
      // keep default draft
    } finally {
      setLoadingList(false);
    }

    if (!propJobs || propJobs.length === 0) {
      try {
        const fetchedJobs = await jobApi.getJobs();
        setJobsList(Array.isArray(fetchedJobs) ? fetchedJobs : []);
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectCv = (doc: CvDocument) => {
    setDraft(doc);
    setFeedback(doc.atsFeedback || null);
  };

  const handleCreateNew = () => {
    setDraft(createEmptyCv(profile));
    setFeedback(null);
  };

  const handleImportVerifiedProfile = () => {
    const existing = new Set(draft.skills.map((s) => s.toLowerCase()));
    const mergedSkills = [...draft.skills];
    for (const sk of profile.skills || []) {
      if (!existing.has(sk.toLowerCase())) {
        mergedSkills.push(sk);
        existing.add(sk.toLowerCase());
      }
    }
    const certProjects = (profile.certificates || []).map((c) => ({
      name: `Sertifikasi: ${c.courseTitle}`,
      link: `${window.location.origin}/verify/${c.id}`,
      impact: `Lulus evaluasi kompetensi dengan skor ${c.score}/100 (${c.partner})`,
    }));

    const existingProjectNames = new Set(draft.projects.map((p) => p.name));
    const mergedProjects = [
      ...draft.projects,
      ...certProjects.filter((p) => !existingProjectNames.has(p.name)),
    ];

    setDraft((prev) => ({ ...prev, skills: mergedSkills, projects: mergedProjects }));
    showToast?.("Skill & sertifikat terverifikasi Skillora diimpor ke CV.", "success");
  };

  const handleSave = async () => {
    if (!draft.targetRole.trim() || !draft.summary.trim()) {
      showToast?.("Target peran dan ringkasan wajib diisi.", "error");
      return;
    }
    setSaving(true);
    try {
      const saved = await cvApi.save(draft);
      setDraft((prev) => ({ ...prev, id: saved.id }));
      const docs = await cvApi.list();
      setSavedCvs(Array.isArray(docs) ? docs : []);
      playSound("claim");
      showToast?.("Dokumen CV ATS berhasil disimpan ke database!", "success");
    } catch (err: any) {
      showToast?.(err?.message || "Gagal menyimpan CV.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await cvApi.analyze({
        cvId: draft.id,
        targetJobId: selectedJobId || undefined,
        cvDraft: draft,
      });
      setFeedback(result);
      setDraft((prev) => ({ ...prev, atsScore: result.atsScore, atsFeedback: result }));
      playSound("success");
      showToast?.(`Audit ATS selesai! Skor Kecocokan: ${result.atsScore}/100`, "success");
    } catch (err: any) {
      showToast?.(err?.message || "Gagal melakukan audit ATS dengan Gemini AI.", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const addSkillTag = () => {
    const clean = newSkill.trim();
    if (!clean) return;
    if (!draft.skills.includes(clean)) {
      setDraft((prev) => ({ ...prev, skills: [...prev.skills, clean] }));
    }
    setNewSkill("");
  };

  const inputClass =
    "w-full h-9 px-3 rounded-lg bg-zinc-50/70 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-emerald-500 transition-colors";
  const textareaClass =
    "w-full p-3 rounded-lg bg-zinc-50/70 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-emerald-500 transition-colors leading-relaxed";

  return (
    <div className="space-y-6 pb-16 lg:pb-8">
      {/* Editorial Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-5 border-b border-zinc-200/90 dark:border-zinc-800/90 print:hidden">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>CV ATS Builder &amp; Audit AI</span>
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
            Penyusun CV ATS Terintegrasi HRD
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Bangun CV terstruktur, audit kecocokan kata kunci ATS terhadap lowongan mitra, dan lampirkan langsung saat melamar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleImportVerifiedProfile}
            className="h-9 px-3.5 rounded-lg bg-white dark:bg-[#111114] hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Impor Profil
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="h-9 px-3.5 rounded-lg bg-white dark:bg-[#111114] hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-500" />
            Cetak / PDF
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Menyimpan..." : "Simpan CV"}
          </button>
        </div>
      </header>

      {/* Saved CV Selector Strip */}
      <div className="bg-white dark:bg-[#111114] rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mr-1 tabular-nums">
            Dokumen tersimpan ({savedCvs.length}):
          </span>
          {loadingList ? (
            <span className="text-xs text-zinc-400">Memuat...</span>
          ) : (
            savedCvs.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => handleSelectCv(doc)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer tabular-nums ${
                  draft.id === doc.id
                    ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-950 dark:border-zinc-100"
                    : "bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {doc.title} {doc.atsScore ? `(${doc.atsScore})` : ""}
              </button>
            ))
          )}
        </div>
        <button
          type="button"
          onClick={handleCreateNew}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Buat CV Baru
        </button>
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Structured Editor (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111114] rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 divide-y divide-zinc-200/80 dark:divide-zinc-800/80 print:hidden">
          {/* Section 1: Summary & Skills */}
          <div className="p-5 sm:p-6 space-y-4">
            <h2 className="font-display text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Informasi Utama &amp; Ringkasan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1.5">
                  Judul Dokumen CV
                </label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1.5">
                  Target Posisi / Role
                </label>
                <input
                  type="text"
                  value={draft.targetRole}
                  onChange={(e) => setDraft({ ...draft, targetRole: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1.5">
                Ringkasan Profesional
              </label>
              <textarea
                rows={3}
                value={draft.summary}
                onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                className={textareaClass}
              />
            </div>

            {/* Skills */}
            <div className="space-y-2.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block">
                Keahlian Teknis &amp; Kata Kunci ATS
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkillTag())}
                  placeholder="Tambah skill (mis. React, PostgreSQL, Financial Modeling)..."
                  className={`flex-1 ${inputClass}`}
                />
                <button
                  type="button"
                  onClick={addSkillTag}
                  className="h-9 px-3.5 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
                >
                  Tambah
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {draft.skills.map((sk) => (
                  <span
                    key={sk}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-medium border border-zinc-200/80 dark:border-zinc-800"
                  >
                    {sk}
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          skills: prev.skills.filter((item) => item !== sk),
                        }))
                      }
                      className="text-zinc-400 hover:text-rose-500 cursor-pointer"
                      aria-label={`Hapus ${sk}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Experiences */}
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Pengalaman Kerja &amp; Organisasi
              </h2>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    experiences: [
                      ...prev.experiences,
                      { role: "", company: "", period: "", bullets: [""] },
                    ],
                  }))
                }
                className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Pengalaman
              </button>
            </div>

            <div className="space-y-4">
              {draft.experiences.map((exp, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-zinc-500 font-mono tabular-nums">
                      Pengalaman #{idx + 1}
                    </span>
                    {draft.experiences.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            experiences: prev.experiences.filter((_, i) => i !== idx),
                          }))
                        }
                        aria-label="Hapus pengalaman"
                        className="text-zinc-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      placeholder="Peran / Jabatan"
                      value={exp.role}
                      onChange={(e) => {
                        const updated = [...draft.experiences];
                        updated[idx] = { ...exp, role: e.target.value };
                        setDraft({ ...draft, experiences: updated });
                      }}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      placeholder="Perusahaan / Organisasi"
                      value={exp.company}
                      onChange={(e) => {
                        const updated = [...draft.experiences];
                        updated[idx] = { ...exp, company: e.target.value };
                        setDraft({ ...draft, experiences: updated });
                      }}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      placeholder="Periode (2025 - 2026)"
                      value={exp.period}
                      onChange={(e) => {
                        const updated = [...draft.experiences];
                        updated[idx] = { ...exp, period: e.target.value };
                        setDraft({ ...draft, experiences: updated });
                      }}
                      className={inputClass}
                    />
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Satu poin dampak per baris..."
                    value={(exp.bullets || []).join("\n")}
                    onChange={(e) => {
                      const updated = [...draft.experiences];
                      updated[idx] = {
                        ...exp,
                        bullets: e.target.value.split("\n"),
                      };
                      setDraft({ ...draft, experiences: updated });
                    }}
                    className={textareaClass}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Education & Projects */}
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Pendidikan &amp; Proyek Unggulan
              </h2>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    projects: [...prev.projects, { name: "", link: "", impact: "" }],
                  }))
                }
                className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Proyek
              </button>
            </div>

            {draft.education.map((edu, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3.5 rounded-xl bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80"
              >
                <input
                  type="text"
                  placeholder="Institusi"
                  value={edu.school}
                  onChange={(e) => {
                    const next = [...draft.education];
                    next[idx] = { ...edu, school: e.target.value };
                    setDraft({ ...draft, education: next });
                  }}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="Gelar / Jurusan"
                  value={edu.degree}
                  onChange={(e) => {
                    const next = [...draft.education];
                    next[idx] = { ...edu, degree: e.target.value };
                    setDraft({ ...draft, education: next });
                  }}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="Tahun"
                  value={edu.year}
                  onChange={(e) => {
                    const next = [...draft.education];
                    next[idx] = { ...edu, year: e.target.value };
                    setDraft({ ...draft, education: next });
                  }}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="IPK (opsional)"
                  value={edu.gpa || ""}
                  onChange={(e) => {
                    const next = [...draft.education];
                    next[idx] = { ...edu, gpa: e.target.value };
                    setDraft({ ...draft, education: next });
                  }}
                  className={inputClass}
                />
              </div>
            ))}

            <div className="space-y-2.5 pt-1">
              {draft.projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80"
                >
                  <input
                    type="text"
                    placeholder="Nama Proyek"
                    value={proj.name}
                    onChange={(e) => {
                      const next = [...draft.projects];
                      next[idx] = { ...proj, name: e.target.value };
                      setDraft({ ...draft, projects: next });
                    }}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Tautan GitHub / Demo"
                    value={proj.link || ""}
                    onChange={(e) => {
                      const next = [...draft.projects];
                      next[idx] = { ...proj, link: e.target.value };
                      setDraft({ ...draft, projects: next });
                    }}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Hasil / Dampak Terukur"
                    value={proj.impact}
                    onChange={(e) => {
                      const next = [...draft.projects];
                      next[idx] = { ...proj, impact: e.target.value };
                      setDraft({ ...draft, projects: next });
                    }}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: AI ATS Audit & Printable Sheet (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* AI Audit Panel */}
          <div className="bg-white dark:bg-[#111114] rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 p-5 space-y-4 print:hidden">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-sm font-semibold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Audit ATS Otomatis
              </h2>
              {feedback && (
                <span className="font-mono text-lg font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {feedback.atsScore}/100
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                <span>Target Lowongan Mitra (Opsional)</span>
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className={inputClass}
              >
                <option value="">Umum — Sesuai Target Role ({draft.targetRole})</option>
                {jobsList.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} — {j.company}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{analyzing ? "Menganalisis Kata Kunci..." : "Audit & Optimasi CV"}</span>
            </button>

            {feedback && (
              <div className="space-y-4 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 text-xs">
                <div>
                  <p className="font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-1.5 tabular-nums">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Kata kunci cocok ({feedback.keywordMatches.length})
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {feedback.keywordMatches.join(" · ")}
                  </p>
                </div>

                {feedback.missingKeywords.length > 0 && (
                  <div>
                    <p className="font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> Kata kunci disarankan (klik untuk tambah)
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {feedback.missingKeywords.map((kw) => (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => {
                            if (!draft.skills.includes(kw)) {
                              setDraft((prev) => ({ ...prev, skills: [...prev.skills, kw] }));
                              showToast?.(`"${kw}" ditambahkan ke daftar skill CV.`, "info");
                            }
                          }}
                          className="px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 font-medium hover:bg-amber-100 dark:hover:bg-amber-950/50 cursor-pointer transition-colors"
                        >
                          + {kw}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3.5 rounded-lg bg-zinc-50/80 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Saran Ringkasan Siap Pakai
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDraft((prev) => ({ ...prev, summary: feedback.improvedSummary }));
                        showToast?.("Ringkasan AI diterapkan ke CV.", "success");
                      }}
                      className="font-medium text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Terapkan
                    </button>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {feedback.improvedSummary}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                    Rekomendasi Perbaikan Poin Pengalaman
                  </p>
                  <ul className="space-y-1 text-zinc-600 dark:text-zinc-400 list-disc pl-4">
                    {feedback.bulletImprovements.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Live Printable ATS Preview */}
          <div className="bg-white text-zinc-900 rounded-xl border border-zinc-200/90 p-6 sm:p-7 space-y-4 print:border-0 print:shadow-none print:p-0">
            <div className="border-b-2 border-zinc-900 pb-3 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold tracking-tight text-zinc-950">
                  {profile.name}
                </h2>
                <p className="text-xs font-medium text-zinc-600 mt-0.5">
                  {draft.targetRole} · {profile.email || "kandidat@skillora.app"} · Level {profile.level}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 pt-0.5">
                <SkilloraLogoIcon size={26} />
                <div className="text-right leading-tight hidden sm:block">
                  <span className="block text-[10px] font-bold tracking-tight text-zinc-950">
                    Skill<span className="text-emerald-600">ora</span> Verified
                  </span>
                  <span className="block text-[9px] font-mono text-zinc-500">ATS Standard</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-[11px] font-semibold text-zinc-500 border-b border-zinc-200 pb-0.5">
                Ringkasan
              </h3>
              <p className="text-xs leading-relaxed text-zinc-800 pt-0.5">{draft.summary}</p>
            </div>

            <div className="space-y-1">
              <h3 className="text-[11px] font-semibold text-zinc-500 border-b border-zinc-200 pb-0.5">
                Keahlian
              </h3>
              <p className="text-xs text-zinc-800 pt-0.5">{draft.skills.join(" · ")}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-[11px] font-semibold text-zinc-500 border-b border-zinc-200 pb-0.5">
                Pengalaman
              </h3>
              {draft.experiences.map((exp, i) => (
                <div key={i} className="space-y-1 text-xs pt-0.5">
                  <div className="flex justify-between gap-2 font-semibold text-zinc-900">
                    <span>
                      {exp.role || "Peran"} — {exp.company || "Instansi"}
                    </span>
                    <span className="text-zinc-500 font-mono tabular-nums shrink-0">{exp.period}</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-zinc-700">
                    {(exp.bullets || []).filter(Boolean).map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-[11px] font-semibold text-zinc-500 border-b border-zinc-200 pb-0.5">
                Pendidikan
              </h3>
              {draft.education.map((edu, i) => (
                <div key={i} className="flex justify-between gap-2 text-xs text-zinc-800 pt-0.5">
                  <span>
                    <strong className="font-semibold">{edu.school}</strong> — {edu.degree}{" "}
                    {edu.gpa ? `(IPK ${edu.gpa})` : ""}
                  </span>
                  <span className="text-zinc-500 font-mono tabular-nums shrink-0">{edu.year}</span>
                </div>
              ))}
            </div>

            {draft.projects.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-[11px] font-semibold text-zinc-500 border-b border-zinc-200 pb-0.5">
                  Proyek &amp; Sertifikasi
                </h3>
                {draft.projects.map((p, i) => (
                  <div key={i} className="text-xs text-zinc-800 pt-0.5">
                    <strong className="font-semibold">{p.name}</strong> — {p.impact}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CvAtsBuilderView;
