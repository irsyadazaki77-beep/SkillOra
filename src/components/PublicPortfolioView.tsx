import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ShieldCheck,
  Award,
  Terminal,
  ExternalLink,
  GraduationCap,
  Trophy,
  Flame,
  ArrowLeft,
  CheckCircle2,
  FolderGit2,
} from "lucide-react";
import { PublicPortfolioData } from "../types";
import { fetchPublicPortfolio } from "../api/apiClient";
import { SkilloraLogo } from "./SkilloraLogo";

export function PublicPortfolioView() {
  const { slug } = useParams();
  const [data, setData] = useState<PublicPortfolioData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setError("Slug portofolio tidak valid.");
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchPublicPortfolio(slug)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err: any) => {
        setError(err?.message || "Portofolio tidak ditemukan atau disetel privat.");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-zinc-950 dark:text-zinc-100">
      {/* Top Public Verification Bar */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <SkilloraLogo variant="full" size="sm" />
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            Verified Talent Dossier
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {loading ? (
          <div className="space-y-4">
            <div className="h-44 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-52 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-pulse" />
              <div className="h-52 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-pulse" />
            </div>
          </div>
        ) : error || !data ? (
          <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center space-y-4">
            <ShieldCheck className="w-10 h-10 text-zinc-400 mx-auto" />
            <h1 className="font-display text-xl font-bold">Portofolio Tidak Tersedia</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Skillora
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Candidate Hero Dossier */}
            <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-3xl shrink-0">
                    {data.avatar}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Terverifikasi Skillora
                      </span>
                      {data.stats.jobReadyVerified && (
                        <>
                          <span>·</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
                            Siap Kerja Terverifikasi ✓
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span>Lv.{data.level}</span>
                      <span>·</span>
                      <span className="uppercase">Liga {data.leagueTier}</span>
                    </div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                      {data.name}
                    </h1>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {data.headline}
                    </p>
                    {(data.campusName || data.majorName) && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {[data.campusName, data.majorName].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-zinc-600 dark:text-zinc-400 shrink-0">
                  <span className="inline-flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    {data.xp.toLocaleString("id-ID")} XP
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    {data.streak} hari
                  </span>
                </div>
              </div>

              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-3xl">
                {data.bio}
              </p>

              {/* Verified KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div>
                  <span className="text-xs text-zinc-500 block">Lab Interaktif Lulus</span>
                  <span className="font-mono text-2xl font-bold tabular-nums">
                    {data.stats.passedLabs}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block">Rata-Rata Skor Lab</span>
                  <span className="font-mono text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {data.stats.avgLabScore > 0 ? `${data.stats.avgLabScore}/100` : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block">Sertifikat QR</span>
                  <span className="font-mono text-2xl font-bold tabular-nums">
                    {data.stats.verifiedCertificates}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block">Asesmen Adaptif</span>
                  <span className="font-mono text-2xl font-bold tabular-nums">
                    {data.stats.avgAssessmentScore > 0 ? `${data.stats.avgAssessmentScore}/100` : "—"}
                  </span>
                </div>
              </div>

              {/* Verified Skills */}
              {data.skills.length > 0 && (
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Kompetensi Terverifikasi
                  </p>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {data.skills.join(" · ")}
                  </p>
                </div>
              )}
            </section>

            {/* Two-Column Proof of Work: Lab Scores & Verified Certificates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Interactive Coding & Case Labs */}
              <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
                <h2 className="font-display text-base font-bold flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Bukti Evaluasi Interactive Lab
                </h2>
                {data.labHighlights.length === 0 ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Belum ada hasil Interactive Lab yang dipublikasikan.
                  </p>
                ) : (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {data.labHighlights.map((lab) => (
                      <div key={lab.challengeId} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {lab.title}
                          </p>
                          <p className="text-[11px] font-mono text-zinc-500 uppercase">{lab.track}</p>
                        </div>
                        <span className="font-mono text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">
                          {lab.score}/100
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Verified Certificates */}
              <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
                <h2 className="font-display text-base font-bold flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Sertifikat Terverifikasi
                </h2>
                {data.certificates.length === 0 ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Belum ada sertifikat diterbitkan.
                  </p>
                ) : (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {data.certificates.map((cert) => (
                      <div key={cert.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {cert.courseTitle}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                            {cert.partner} · {cert.issueDate}
                          </p>
                        </div>
                        <Link
                          to={`/verify/${cert.id}`}
                          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 shrink-0"
                        >
                          Verifikasi <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Verified Capstone Projects */}
            {data.projects.length > 0 && (
              <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
                <h2 className="font-display text-base font-bold flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Proyek Capstone Lulus Review
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.projects.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold truncate">{p.title}</h3>
                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {p.score}/100
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{p.notes}</p>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        Lihat Repositori / Demo <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default PublicPortfolioView;
