import { useState, FormEvent } from "react";
import {
  User,
  Mail,
  Save,
  Shield,
  Gem,
  Flame,
  Award,
  AlertCircle,
  Sparkles,
  Building2,
  GraduationCap,
  BookOpenCheck,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Profile } from "../types";
import { userApi } from "../api/apiClient";
import { ROUTES } from "../routes";

interface ProfilViewProps {
  profile: Profile;
  onSettingsSaved: (updatedProfile: Profile) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

function getInitials(name: string): string {
  const words = (name || "SK").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (name || "SK").slice(0, 2).toUpperCase();
}

export function ProfilView({ profile, onSettingsSaved, showToast }: ProfilViewProps) {
  const navigate = useNavigate();
  const [name, setName] = useState(profile.name || "");
  const [roleTitle, setRoleTitle] = useState(profile.role || "Mahasiswa & Talenta Karir");
  const [email, setEmail] = useState(profile.email || "user@skillora.id");
  const [bio, setBio] = useState(
    profile.bio || "Saya sedang mengembangkan kompetensi industri terverifikasi di platform Skillora."
  );
  const [saving, setSaving] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Role activation inputs
  const [targetRole, setTargetRole] = useState<"student" | "mentor" | "recruiter">(
    (profile.accountRole as "student" | "mentor" | "recruiter") || "student"
  );
  const [companyName, setCompanyName] = useState(profile.company?.name || "");
  const [companyIndustry, setCompanyIndustry] = useState(profile.company?.industry || "Teknologi Informasi");
  const [mentorSpecialty, setMentorSpecialty] = useState(
    profile.mentorSpecialty || "Fullstack Web & Persiapan Karir"
  );
  const [mentorHeadline, setMentorHeadline] = useState(
    profile.mentorHeadline || "Praktisi Industri & Mentor Skillora"
  );

  const accountRole = profile.accountRole || "student";
  const certs = Array.isArray(profile.certificates) ? profile.certificates : [];
  const skills = Array.isArray(profile.skills) ? profile.skills : [];

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim() || name.trim().length < 3) {
      setValidationError("Nama lengkap minimal 3 karakter.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setValidationError("Format email tidak valid.");
      return;
    }
    if (bio.length > 250) {
      setValidationError("Bio singkat maksimal 250 karakter.");
      return;
    }

    setSaving(true);
    try {
      const res = await userApi.updateSettings({
        name: name.trim(),
        email: email.trim(),
        bio: bio.trim(),
      });
      if (res?.profile) {
        onSettingsSaved(res.profile);
      }
      showToast("Biodata profil tersimpan ke database PostgreSQL!", "success");
    } catch (err: any) {
      showToast(err?.message || "Gagal memperbarui profil.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchPortalRole = async () => {
    if (targetRole === "recruiter" && !companyName.trim()) {
      showToast("Isi nama perusahaan mitra terlebih dahulu untuk mengaktifkan Portal HRD.", "error");
      return;
    }
    setSwitchingRole(true);
    try {
      const res = await userApi.registerRole({
        accountRole: targetRole,
        companyName: targetRole === "recruiter" ? companyName.trim() : undefined,
        companyIndustry: targetRole === "recruiter" ? companyIndustry.trim() : undefined,
        mentorSpecialty: targetRole === "mentor" ? mentorSpecialty.trim() : undefined,
        mentorHeadline: targetRole === "mentor" ? mentorHeadline.trim() : undefined,
      });
      if (res?.profile) {
        onSettingsSaved(res.profile);
        showToast(
          targetRole === "recruiter"
            ? "Portal HRD & Rekrutmen berhasil diaktifkan!"
            : targetRole === "mentor"
            ? "Portal Mentor & LMS berhasil diaktifkan!"
            : "Mode akun Mahasiswa diaktifkan.",
          "success"
        );
        if (targetRole === "recruiter") navigate(ROUTES.recruiter.root);
        if (targetRole === "mentor") navigate(ROUTES.mentor.root);
      }
    } catch (err: any) {
      showToast(err?.message || "Gagal mengaktifkan peran portal.", "error");
    } finally {
      setSwitchingRole(false);
    }
  };

  const roleLabel =
    accountRole === "recruiter"
      ? "Recruiter / HRD"
      : accountRole === "mentor"
      ? "Mentor / Dosen"
      : accountRole === "admin"
      ? "Administrator"
      : "Mahasiswa";

  const inputClass =
    "w-full h-9 px-3 bg-zinc-50/70 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-emerald-500 text-xs sm:text-sm text-zinc-950 dark:text-zinc-100 transition-colors";

  return (
    <div className="w-full pb-16 lg:pb-8 font-sans space-y-6">
      {/* Editorial Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-zinc-200/90 dark:border-zinc-800/90">
        <div className="space-y-1">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Akun &amp; Kredensial
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Profil, Peran &amp; Kredensial
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            Kelola identitas profesional, ganti portal peran (Mahasiswa / Mentor / HRD), dan pantau sertifikat terverifikasi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(ROUTES.upgrade)}
          className="h-9 px-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs font-medium flex items-center gap-1.5 self-start sm:self-auto cursor-pointer whitespace-nowrap shrink-0 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{profile.subscriptionTier === "pro" ? "Kelola Status Sponsor" : "Beasiswa & Mitra HRD"}</span>
        </button>
      </header>

      {/* Unified 4-Column Hairline KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-zinc-200/80 dark:divide-zinc-800/80">
        <div className="p-4 sm:p-5">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Total XP</span>
          <span className="font-mono text-lg sm:text-xl font-semibold text-zinc-950 dark:text-zinc-50 tabular-nums mt-1 block">
            {(profile.xp || 0).toLocaleString("id-ID")} XP
          </span>
        </div>
        <div className="p-4 sm:p-5">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Sertifikat Resmi</span>
          <span className="font-mono text-lg sm:text-xl font-semibold text-zinc-950 dark:text-zinc-50 tabular-nums mt-1 block">
            {certs.length} sertifikat
          </span>
        </div>
        <div className="p-4 sm:p-5">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Konsistensi &amp; Saldo</span>
          <span className="font-mono text-sm sm:text-base font-semibold text-zinc-950 dark:text-zinc-50 tabular-nums mt-1.5 flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              {profile.streak || 0} hari
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
              <Gem className="w-3.5 h-3.5" />
              {profile.gems || 0}
            </span>
          </span>
        </div>
        <div className="p-4 sm:p-5">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Akses Pelajar</span>
          <span className="text-sm sm:text-base font-semibold text-emerald-700 dark:text-emerald-400 mt-1.5 block">
            {profile.subscriptionTier === "pro" ? "Supporter & Terbuka" : "Terbuka Penuh"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Unified Identity, Skills & Certificates Panel */}
        <aside className="lg:col-span-4 bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
          {/* Identity */}
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-mono text-base font-semibold flex items-center justify-center shrink-0">
                {getInitials(profile.name)}
              </div>
              <div className="min-w-0">
                <h2 className="font-display font-semibold text-base text-zinc-950 dark:text-zinc-50 truncate">
                  {profile.name}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{profile.role}</p>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-1">
                  <Shield className="w-3 h-3" />
                  <span>{roleLabel} · Lv.{profile.level}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="p-5 space-y-2.5">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
              Keahlian terverifikasi ({skills.length})
            </h3>
            {skills.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Belum ada keahlian tercatat. Selesaikan kursus atau tambahkan di CV ATS Builder.
              </p>
            ) : (
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {skills.map((sk) => (typeof sk === "string" ? sk : (sk as any).name)).join(" · ")}
              </p>
            )}
          </div>

          {/* Certificates */}
          <div className="p-5 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 tabular-nums">
              <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Sertifikat terbit ({certs.length})</span>
            </h3>
            {certs.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Belum ada sertifikat resmi. Luluskan proyek atau ujian akhir untuk menerbitkan sertifikat terverifikasi.
              </p>
            ) : (
              <div className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
                {certs.map((c) => (
                  <div
                    key={c.id}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-xs text-zinc-900 dark:text-zinc-100 truncate">
                        {c.courseTitle}
                      </p>
                      <p className="text-[11px] font-mono text-zinc-500 truncate">{c.verificationCode}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/verify/${c.id}`)}
                      className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <span>Verifikasi</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Role / Portal Access Switcher */}
          <section className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-display font-semibold text-sm text-zinc-950 dark:text-zinc-50">
                  Portal Akun Multi-Peran
                </h3>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Akses Mahasiswa, Mentor, atau HRD
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "student" as const, label: "Mahasiswa", desc: "Belajar, CV ATS, Interview", icon: GraduationCap },
                  { id: "mentor" as const, label: "Mentor / Dosen", desc: "Kelola LMS & Review Proyek", icon: BookOpenCheck },
                  { id: "recruiter" as const, label: "Recruiter / HRD", desc: "Lowongan & Pipeline ATS", icon: Building2 },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const active = targetRole === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTargetRole(opt.id)}
                      className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        active
                          ? "border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/25"
                          : "border-zinc-200/90 dark:border-zinc-800/90 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 mb-2 ${
                          active ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                        }`}
                      />
                      <div className="text-xs font-semibold text-zinc-950 dark:text-zinc-100">{opt.label}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>

              {targetRole === "recruiter" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                      Nama Perusahaan Mitra *
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Contoh: PT Mandiri Teknologi"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                      Sektor Industri
                    </label>
                    <input
                      type="text"
                      value={companyIndustry}
                      onChange={(e) => setCompanyIndustry(e.target.value)}
                      placeholder="Contoh: Finansial & Teknologi"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {targetRole === "mentor" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                      Headline Mentor
                    </label>
                    <input
                      type="text"
                      value={mentorHeadline}
                      onChange={(e) => setMentorHeadline(e.target.value)}
                      placeholder="Contoh: Principal Software Architect"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                      Spesialisasi Mentoring
                    </label>
                    <input
                      type="text"
                      value={mentorSpecialty}
                      onChange={(e) => setMentorSpecialty(e.target.value)}
                      placeholder="Contoh: React, Backend API, System Design"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {accountRole === targetRole
                    ? "Portal ini sedang aktif pada akun Anda."
                    : "Klik terapkan untuk mengaktifkan workspace peran."}
                </span>
                <button
                  type="button"
                  disabled={switchingRole}
                  onClick={handleSwitchPortalRole}
                  className="h-9 px-4 bg-zinc-950 dark:bg-zinc-100 hover:opacity-90 text-white dark:text-zinc-950 rounded-lg text-xs font-medium transition-opacity cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  {switchingRole ? "Mengaktifkan..." : "Aktifkan Portal Peran"}
                </button>
              </div>
            </div>
          </section>

          {/* Biodata Form */}
          <section className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-display font-semibold text-sm text-zinc-950 dark:text-zinc-50">
                Pengaturan Biodata Profil
              </h3>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {validationError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block">
                    Title / Target Jabatan
                  </label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="Contoh: Frontend Engineer / Mahasiswa Teknik Informatika"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Ringkasan Bio
                    </label>
                    <span className="text-xs font-mono text-zinc-400 tabular-nums">{bio.length}/250</span>
                  </div>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={250}
                    className="w-full p-3 bg-zinc-50/70 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-emerald-500 text-xs sm:text-sm text-zinc-950 dark:text-zinc-100 resize-none leading-relaxed transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
                <button
                  type="submit"
                  disabled={saving}
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Menyimpan..." : "Simpan Biodata"}</span>
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ProfilView;
