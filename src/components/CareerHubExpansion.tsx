import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowUpRight,
  Globe,
  Copy,
  Check,
  ExternalLink,
  GraduationCap,
  Users,
  CheckCircle2,
  Save,
} from "lucide-react";
import { CampusCohortItem, Profile, TalentMatchJob } from "../types";
import { careerExpansionApi } from "../api/apiClient";

export function TalentMatchSection({
  onSelectJobId,
}: {
  onSelectJobId?: (jobId: string) => void;
}) {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<TalentMatchJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    careerExpansionApi
      .getTalentMatch()
      .then((list) => setMatches(Array.isArray(list) ? list : []))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 h-40 animate-pulse" />
    );
  }

  if (matches.length === 0) return null;

  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
            Smart Talent Matching · Skor Berbasis Bukti Nyata
          </p>
          <h2 className="font-display text-lg font-bold text-zinc-950 dark:text-white">
            Kecocokan Lowongan Teratas untuk Profil Anda
          </h2>
        </div>
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
          Bobot: Skill (70%) · Lab (+15%) · Sertifikat (+15%)
        </span>
      </div>

      <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg">
        {matches.slice(0, 4).map((m) => (
          <div
            key={m.jobId}
            className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors"
          >
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{m.company}</span>
                <span>·</span>
                <span>{m.location}</span>
                <span>·</span>
                <span>{m.salary}</span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">{m.title}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {m.matchedSkills.length > 0 && (
                  <span>
                    Cocok: <strong className="text-emerald-700 dark:text-emerald-400">{m.matchedSkills.join(", ")}</strong>
                  </span>
                )}
                {m.matchedSkills.length > 0 && m.missingSkills.length > 0 && " · "}
                {m.missingSkills.length > 0 && (
                  <span>
                    Gap: <strong className="text-amber-700 dark:text-amber-400">{m.missingSkills.join(", ")}</strong>
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <span className="font-mono text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 block">
                  {m.matchScore}%
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  Skill {m.skillMatchScore} + Lab {m.labBonus} + Cert {m.certBonus}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {onSelectJobId && (
                  <button
                    onClick={() => onSelectJobId(m.jobId)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold cursor-pointer"
                  >
                    Lihat & Lamar
                  </button>
                )}
                <button
                  onClick={() => navigate(m.recommendedPath)}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center justify-end gap-0.5 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  Tutup Gap
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PortfolioSettingsPanel({
  profile,
  onProfileUpdate,
  showToast,
}: {
  profile: Profile;
  onProfileUpdate?: (p: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}) {
  const defaultSlug =
    profile.portfolioSlug ||
    `${(profile.name || "pelajar")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}`;

  const [slug, setSlug] = useState(defaultSlug);
  const [isPublic, setIsPublic] = useState(profile.portfolioPublic !== false);
  const [headline, setHeadline] = useState(profile.portfolioHeadline || profile.role || "");
  const [campusName, setCampusName] = useState(profile.campusName || "");
  const [majorName, setMajorName] = useState(profile.majorName || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = `${window.location.origin}/portfolio/${slug || defaultSlug}`;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await careerExpansionApi.updatePortfolioSettings({
        portfolioSlug: slug,
        portfolioPublic: isPublic,
        portfolioHeadline: headline,
        campusName,
        majorName,
        bio,
      });
      if (res.profile) {
        onProfileUpdate?.(res.profile);
        if (res.profile.portfolioSlug) setSlug(res.profile.portfolioSlug);
      }
      showToast?.("Pengaturan Portofolio Publik tersimpan.", "success");
    } catch (err: any) {
      showToast?.(err?.message || "Gagal menyimpan portofolio.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="space-y-1">
          <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
            Public Verified Portfolio
          </p>
          <h2 className="font-display text-xl font-bold text-zinc-950 dark:text-white">
            Dossier Kandidat Publik Tanpa Login
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl">
            Bagikan satu tautan bersih kepada HRD yang langsung menampilkan skor Interactive Lab, sertifikat QR terverifikasi, proyek capstone, dan divisi Liga Anda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(publicUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
              showToast?.("Tautan portofolio disalin ke clipboard.", "info");
            }}
            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Tersalin" : "Salin URL"}
          </button>
          <a
            href={`/portfolio/${slug || defaultSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5" />
            Pratinjau Publik
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1.5">
          <label className="font-semibold text-zinc-700 dark:text-zinc-300">URL Slug Portofolio</label>
          <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
            <span className="px-2.5 text-zinc-400 font-mono text-[11px]">/portfolio/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="flex-1 py-2 pr-3 bg-transparent font-mono text-zinc-950 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-zinc-700 dark:text-zinc-300">Headline Profesional</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Contoh: Frontend Engineer · React & TypeScript"
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-zinc-700 dark:text-zinc-300">Asal Kampus / Institusi</label>
          <input
            type="text"
            value={campusName}
            onChange={(e) => setCampusName(e.target.value)}
            placeholder="Contoh: Institut Teknologi Bandung"
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-zinc-700 dark:text-zinc-300">Jurusan / Program Studi</label>
          <input
            type="text"
            value={majorName}
            onChange={(e) => setMajorName(e.target.value)}
            placeholder="Contoh: Teknik Informatika"
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <label className="font-semibold text-zinc-700 dark:text-zinc-300">Ringkasan Diri (Bio)</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Jelaskan fokus rekayasa, pencapaian proyek, dan peran karier yang Anda tuju..."
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4 pt-2">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 accent-emerald-600"
            />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Izinkan HRD dan publik mengakses halaman portofolio ini tanpa login
            </span>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Menyimpan..." : "Simpan Pengaturan Portofolio"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function CampusHubPanel({
  profile,
  onProfileUpdate,
  showToast,
}: {
  profile: Profile;
  onProfileUpdate?: (p: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}) {
  const [cohorts, setCohorts] = useState<CampusCohortItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    careerExpansionApi
      .listCampusCohorts()
      .then((list) => setCohorts(Array.isArray(list) ? list : []))
      .catch(() => setCohorts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleJoin = async (cohortId: string) => {
    setJoiningId(cohortId);
    try {
      const res = await careerExpansionApi.joinCampusCohort(cohortId, profile.majorName || undefined);
      setCohorts(res.cohorts);
      if (res.profile) onProfileUpdate?.(res.profile);
      showToast?.("Berhasil bergabung dengan cohort kampus!", "success");
    } catch (err: any) {
      showToast?.(err?.message || "Gagal bergabung cohort kampus.", "error");
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-1.5">
        <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
          Campus & Cohort Hub Indonesia
        </p>
        <h2 className="font-display text-xl font-bold text-zinc-950 dark:text-white">
          Terhubung dengan Program Kesiapan Karier Kampus
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-2xl">
          Bergabung dengan cohort kampus Anda untuk memantau indeks kesiapan karier kolektif, membawa nama institusi di Liga Mingguan, dan menampilkannya pada Portofolio Publik.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cohorts.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    {c.city}
                  </span>
                  <span className="tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                    Readiness {c.avgReadiness}%
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-zinc-950 dark:text-white">
                  {c.campusName}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{c.programTitle}</p>
                <p className="text-[11px] font-mono text-zinc-500 flex items-center gap-3 pt-1">
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3 h-3" /> {c.activeStudents} mahasiswa
                  </span>
                  <span>·</span>
                  <span>{c.certifiedCount} tersertifikasi</span>
                </p>
              </div>

              <button
                disabled={joiningId === c.id || c.isJoined}
                onClick={() => handleJoin(c.id)}
                className={`w-full py-2 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  c.isJoined
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 cursor-default"
                    : "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:opacity-90"
                }`}
              >
                {c.isJoined ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Kampus Anda Saat Ini
                  </>
                ) : joiningId === c.id ? (
                  "Bergabung..."
                ) : (
                  "Gabung Cohort Kampus"
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
