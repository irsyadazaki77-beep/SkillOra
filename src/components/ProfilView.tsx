import { useState, FormEvent } from "react";
import { motion } from "motion/react";
import {
  User,
  Mail,
  Save,
  Shield,
  Gem,
  Flame,
  Award,
  BookOpen,
  CheckCircle2,
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

export function ProfilView({ profile, onSettingsSaved, showToast }: ProfilViewProps) {
  const navigate = useNavigate();
  const [name, setName] = useState(profile.name || "");
  const [roleTitle, setRoleTitle] = useState(profile.role || "Mahasiswa & Talenta Karir");
  const [email, setEmail] = useState(profile.email || "user@skillora.id");
  const [bio, setBio] = useState(profile.bio || "Saya sedang mengembangkan kompetensi industri terverifikasi di platform Skillora.");
  const [saving, setSaving] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Role activation inputs
  const [targetRole, setTargetRole] = useState<"student" | "mentor" | "recruiter">(
    (profile.accountRole as "student" | "mentor" | "recruiter") || "student"
  );
  const [companyName, setCompanyName] = useState(profile.company?.name || "");
  const [companyIndustry, setCompanyIndustry] = useState(profile.company?.industry || "Teknologi Informasi");
  const [mentorSpecialty, setMentorSpecialty] = useState(profile.mentorSpecialty || "Fullstack Web & Persiapan Karir");
  const [mentorHeadline, setMentorHeadline] = useState(profile.mentorHeadline || "Praktisi Industri & Mentor Skillora");

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
        role: roleTitle.trim(),
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

  const stats = [
    {
      label: "Total XP",
      value: `${(profile.xp || 0).toLocaleString("id-ID")} XP`,
      icon: Flame,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40",
    },
    {
      label: "Sertifikat Resmi",
      value: `${certs.length} Sertifikat`,
      icon: Award,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      label: "Biaya Sertifikasi",
      value: "100% Gratis",
      icon: BookOpen,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40",
    },
    {
      label: "Akses Pelajar",
      value: profile.subscriptionTier === "pro" ? "Supporter & Gratis" : "Terbuka Penuh",
      icon: Sparkles,
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40",
    },
  ];

  return (
    <div className="w-full py-1 sm:py-2 font-sans space-y-6 relative z-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
            Profil, Peran &amp; Kredensial
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Kelola identitas profesional, ganti portal peran (Mahasiswa / Mentor / HRD), dan pantau sertifikat terverifikasi Anda.
          </p>
        </div>
        <button
          onClick={() => navigate(ROUTES.upgrade)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 self-start cursor-pointer transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span>{profile.subscriptionTier === "pro" ? "Kelola Status Sponsor" : "Beasiswa & Mitra HRD"}</span>
        </button>
      </header>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((st, idx) => {
          const IconComp = st.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-xs"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${st.color}`}>
                <IconComp className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{st.label}</p>
                <p className="text-sm md:text-base font-bold text-slate-900 dark:text-white truncate tabular-nums">{st.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-xs">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-4xl mx-auto border border-slate-200 dark:border-slate-700 mb-3">
              {profile.selectedAvatar || profile.avatar || "🦁"}
            </div>
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">{profile.name}</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{profile.role}</p>

            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700">
              <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                Portal Aktif:{" "}
                {accountRole === "recruiter"
                  ? "Recruiter / HRD"
                  : accountRole === "mentor"
                  ? "Mentor / Dosen"
                  : accountRole === "admin"
                  ? "Administrator"
                  : "Mahasiswa"}
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/40">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="font-bold text-xs tabular-nums">{profile.streak || 0} Hari</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/40">
                <Gem className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                <span className="font-bold text-xs tabular-nums">{profile.gems || 0} Gems</span>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Keahlian Terverifikasi ({skills.length})</span>
            </h3>
            {skills.length === 0 ? (
              <p className="text-xs text-slate-500">Belum ada keahlian tercatat. Selesaikan kursus atau tambahkan di CV ATS Builder.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((sk, idx) => {
                  const skName = typeof sk === "string" ? sk : (sk as any).name;
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>{skName}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Certificates */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Sertifikat Terbit ({certs.length})</span>
            </h3>
            {certs.length === 0 ? (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-500">
                Belum ada sertifikat resmi. Luluskan proyek portofolio di menu Sertifikasi untuk menerbitkan sertifikat QR terverifikasi.
              </div>
            ) : (
              <div className="space-y-2">
                {certs.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{c.courseTitle}</p>
                      <p className="text-[11px] font-mono text-slate-500 truncate">{c.verificationCode}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/verify/${c.id}`)}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <span>Verifikasi</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Role / Portal Access Switcher */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  Portal Akun Multi-Peran (RBAC)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Akses Mahasiswa, Mentor, atau HRD</span>
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
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-2 ${active ? "text-emerald-600" : "text-slate-400"}`} />
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{opt.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>

              {targetRole === "recruiter" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nama Perusahaan Mitra *</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Contoh: PT Mandiri Teknologi"
                      className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sektor Industri</label>
                    <input
                      type="text"
                      value={companyIndustry}
                      onChange={(e) => setCompanyIndustry(e.target.value)}
                      placeholder="Contoh: Finansial & Teknologi"
                      className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {targetRole === "mentor" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Headline Mentor</label>
                    <input
                      type="text"
                      value={mentorHeadline}
                      onChange={(e) => setMentorHeadline(e.target.value)}
                      placeholder="Contoh: Principal Software Architect"
                      className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Spesialisasi Mentoring</label>
                    <input
                      type="text"
                      value={mentorSpecialty}
                      onChange={(e) => setMentorSpecialty(e.target.value)}
                      placeholder="Contoh: React, Backend API, System Design"
                      className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  {accountRole === targetRole ? "Portal ini sedang aktif pada akun Anda." : "Klik terapkan untuk mengaktifkan workspace peran."}
                </span>
                <button
                  type="button"
                  disabled={switchingRole}
                  onClick={handleSwitchPortalRole}
                  className="px-4 py-2 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {switchingRole ? "Mengaktifkan..." : "Aktifkan Portal Peran"}
                </button>
              </div>
            </div>
          </div>

          {/* Biodata Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">Pengaturan Biodata Profil</h3>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {validationError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Nama Lengkap</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Alamat Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Title / Target Jabatan</label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="Contoh: Frontend Engineer / Mahasiswa Teknik Informatika"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Ringkasan Bio</label>
                    <span className="text-xs text-slate-400 tabular-nums">{bio.length}/250</span>
                  </div>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={250}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-sm text-slate-900 dark:text-white resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saving ? "Menyimpan..." : "Simpan Biodata"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilView;

