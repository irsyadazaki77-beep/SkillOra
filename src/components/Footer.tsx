import { Link } from "react-router-dom";
import { Shield, Award, Sparkles, BookOpen } from "lucide-react";
import { SkilloraLogo } from "./SkilloraLogo";
import { ROUTES } from "../routes";

export function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800/80 text-zinc-400 pt-12 pb-24 lg:pb-10 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Brand Mission Summary */}
        <div className="lg:col-span-4 space-y-4 text-center lg:text-left">
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <SkilloraLogo variant="full" size="md" darkMode={true} showTagline={true} compactTagline={true} />
          </div>
          <p className="leading-relaxed text-zinc-400 text-xs sm:text-sm max-w-md mx-auto lg:mx-0">
            Navigasi Kompetensi &amp; Akselerator Karier Industri. Pelatihan 2026, simulasi seleksi BUMN/CPNS, dan sertifikasi portofolio terbuka tanpa biaya.
          </p>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1 text-[11px] font-mono text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
              Rp 0 Kelas &amp; Sertifikat
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-500" />
              Verifikasi QR Terbuka
            </span>
          </div>
        </div>

        {/* Navigation Map */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-left">
          <div>
            <span className="font-display text-xs font-bold uppercase tracking-wider text-zinc-200 block mb-3">
              Pembelajaran
            </span>
            <ul className="space-y-2.5 text-xs font-medium text-zinc-400">
              <li><Link to={ROUTES.learning.catalog} className="hover:text-emerald-400 transition-colors">Katalog Kursus</Link></li>
              <li><Link to={ROUTES.learning.lmsWorkspace} className="hover:text-emerald-400 transition-colors">Ruang LMS Terfokus</Link></li>
              <li><Link to={ROUTES.lab.root} className="hover:text-emerald-400 transition-colors">Lab Interaktif AI</Link></li>
              <li><Link to={ROUTES.learning.project} className="hover:text-emerald-400 transition-colors">Proyek &amp; Sertifikat</Link></li>
            </ul>
          </div>

          <div>
            <span className="font-display text-xs font-bold uppercase tracking-wider text-zinc-200 block mb-3">
              Persiapan Karier
            </span>
            <ul className="space-y-2.5 text-xs font-medium text-zinc-400">
              <li><Link to={ROUTES.career.jobs} className="hover:text-emerald-400 transition-colors">Bursa Kerja Mitra</Link></li>
              <li><Link to={ROUTES.career.cvBuilder} className="hover:text-emerald-400 transition-colors">CV ATS Builder</Link></li>
              <li><Link to={ROUTES.career.voiceInterview} className="hover:text-emerald-400 transition-colors">Mock Interview Suara</Link></li>
              <li><Link to={ROUTES.career.simulation} className="hover:text-emerald-400 transition-colors">Simulasi TKD &amp; STAR</Link></li>
            </ul>
          </div>

          <div>
            <span className="font-display text-xs font-bold uppercase tracking-wider text-zinc-200 block mb-3">
              Komunitas
            </span>
            <ul className="space-y-2.5 text-xs font-medium text-zinc-400">
              <li><Link to={ROUTES.arena.root} className="hover:text-emerald-400 transition-colors">Arena Battle &amp; Liga</Link></li>
              <li><Link to={ROUTES.community.forum} className="hover:text-emerald-400 transition-colors">Forum Diskusi</Link></li>
              <li><Link to={ROUTES.community.collaboration} className="hover:text-emerald-400 transition-colors">Ruang Kolaborasi</Link></li>
              <li><Link to={ROUTES.community.event} className="hover:text-emerald-400 transition-colors">Event &amp; Webinar</Link></li>
            </ul>
          </div>

          <div>
            <span className="font-display text-xs font-bold uppercase tracking-wider text-zinc-200 block mb-3">
              Dampak &amp; Brand
            </span>
            <ul className="space-y-2.5 text-xs font-medium text-zinc-400">
              <li><Link to={ROUTES.brand} className="hover:text-emerald-400 transition-colors">Identitas Brand &amp; Logo</Link></li>
              <li><Link to={ROUTES.upgrade} className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1"><Sparkles className="w-3 h-3 text-emerald-400" /> Sponsor &amp; HRD</Link></li>
              <li><Link to={ROUTES.career.scholarship} className="hover:text-emerald-400 transition-colors">Pusat Beasiswa</Link></li>
              <li><Link to={ROUTES.faq} className="hover:text-emerald-400 transition-colors">Pusat Bantuan (FAQ)</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto border-t border-zinc-800/80 pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-zinc-500">
        <p>© 2026 Skillora — Navigasi Kompetensi &amp; Akselerator Karier Industri.</p>
        <div className="flex items-center gap-4">
          <Link to={ROUTES.brand} className="hover:text-emerald-400 transition-colors">Media Kit &amp; Logo</Link>
          <Link to={ROUTES.faq} className="hover:text-zinc-300 transition-colors">Ketentuan</Link>
          <span className="flex items-center gap-1.5 text-zinc-400">
            <Shield className="w-3.5 h-3.5 text-emerald-500" /> Didukung Mitra &amp; Beasiswa Terbuka
          </span>
        </div>
      </div>
    </footer>
  );
}
