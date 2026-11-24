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

  return (
    <div className="space-y-6 py-2">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 print:hidden">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <FileText className="w-4 h-4" />
            <span>CV ATS Builder & Audit AI · Gemini 4</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Penyusun CV ATS Terintegrasi HRD
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Bangun CV terstruktur, audit kecocokan kata kunci ATS terhadap lowongan nyata di Bursa Kerja, dan lampirkan langsung saat melamar ke mitra HRD.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleImportVerifiedProfile}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Award className="w-4 h-4 text-emerald-400" /> Impor Profil Skillora
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "Menyimpan..." : "Simpan CV"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Cetak / PDF
          </button>
        </div>
      </div>

      {/* Saved CV Selector Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Dokumen CV ({savedCvs.length}):
          </span>
          {loadingList ? (
            <span className="text-xs text-slate-400">Memuat...</span>
          ) : (
            savedCvs.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => handleSelectCv(doc)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  draft.id === doc.id
                    ? "bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
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
          className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Buat CV Baru
        </button>
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Structured Editor (7 Cols) */}
        <div className="lg:col-span-7 space-y-5 print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Informasi Utama & Ringkasan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Judul Dokumen CV
                </label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Target Posisi / Role
                </label>
                <input
                  type="text"
                  value={draft.targetRole}
                  onChange={(e) => setDraft({ ...draft, targetRole: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Ringkasan Profesional (Summary)
              </label>
              <textarea
                rows={3}
                value={draft.summary}
                onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                Keahlian Teknis & Kata Kunci ATS
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkillTag())}
                  placeholder="Tambah skill (mis. React, PostgreSQL, Financial Modeling)..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={addSkillTag}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Tambah
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {draft.skills.map((sk) => (
                  <span
                    key={sk}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700"
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
                      className="text-slate-400 hover:text-rose-500 cursor-pointer"
                      aria-label={`Hapus ${sk}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Experiences */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Pengalaman Kerja / Organisasi
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
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Pengalaman
              </button>
            </div>

            <div className="space-y-4">
              {draft.experiences.map((exp, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-500">Pengalaman #{idx + 1}</span>
                    {draft.experiences.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            experiences: prev.experiences.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
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
                      className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
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
                      className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
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
                      className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
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
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Education & Projects */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Pendidikan & Proyek Unggulan
              </h2>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    projects: [...prev.projects, { name: "", link: "", impact: "" }],
                  }))
                }
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Proyek
              </button>
            </div>

            {draft.education.map((edu, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800"
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
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
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
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
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
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
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
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            ))}

            <div className="space-y-2.5 pt-2">
              {draft.projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800"
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
                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
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
                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
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
                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: AI ATS Audit & Printable Sheet (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* AI Audit Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 print:hidden">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" /> Audit ATS Gemini AI
              </h2>
              {feedback && (
                <span className="font-display text-xl font-bold text-emerald-600 tabular-nums">
                  {feedback.atsScore}/100
                </span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>Target Lowongan Mitra (Opsional)</span>
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
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
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Wand2 className="w-4 h-4" />
              <span>{analyzing ? "Menganalisis Kata Kunci & Dampak..." : "Audit & Optimasi CV Sekarang"}</span>
            </button>

            {feedback && (
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <p className="font-bold text-emerald-600 flex items-center gap-1 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Kata Kunci Cocok ({feedback.keywordMatches.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {feedback.keywordMatches.map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {feedback.missingKeywords.length > 0 && (
                  <div>
                    <p className="font-bold text-amber-600 flex items-center gap-1 mb-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Kata Kunci Disarankan (Klik untuk Tambah)
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
                          className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium hover:bg-amber-100 cursor-pointer"
                        >
                          + {kw}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-800 dark:text-indigo-200">
                      Saran Ringkasan AI Siap Pakai
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDraft((prev) => ({ ...prev, summary: feedback.improvedSummary }));
                        showToast?.("Ringkasan AI diterapkan ke CV.", "success");
                      }}
                      className="font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Terapkan
                    </button>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {feedback.improvedSummary}
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Rekomendasi Perbaikan Poin Pengalaman
                  </p>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400 list-disc pl-4">
                    {feedback.bulletImprovements.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Live Printable ATS Preview */}
          <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4 print:border-0 print:shadow-none print:p-0">
            <div className="border-b-2 border-slate-900 pb-3">
              <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                {profile.name}
              </h2>
              <p className="text-xs font-semibold text-slate-600">
                {draft.targetRole} · {profile.email || "kandidat@skillora.app"} · Terverifikasi Skillora Level {profile.level}
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Ringkasan</h3>
              <p className="text-xs leading-relaxed text-slate-800">{draft.summary}</p>
            </div>

            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Keahlian</h3>
              <p className="text-xs text-slate-800">{draft.skills.join(" • ")}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Pengalaman</h3>
              {draft.experiences.map((exp, i) => (
                <div key={i} className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>
                      {exp.role || "Peran"} — {exp.company || "Instansi"}
                    </span>
                    <span className="text-slate-500">{exp.period}</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                    {(exp.bullets || []).filter(Boolean).map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Pendidikan</h3>
              {draft.education.map((edu, i) => (
                <div key={i} className="flex justify-between text-xs text-slate-800">
                  <span>
                    <strong>{edu.school}</strong> — {edu.degree} {edu.gpa ? `(IPK ${edu.gpa})` : ""}
                  </span>
                  <span className="text-slate-500">{edu.year}</span>
                </div>
              ))}
            </div>

            {draft.projects.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Proyek & Sertifikasi
                </h3>
                {draft.projects.map((p, i) => (
                  <div key={i} className="text-xs text-slate-800">
                    <strong>{p.name}</strong> — {p.impact}
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
