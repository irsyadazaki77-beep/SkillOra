import { useEffect, useState } from "react";
import {
  Building2,
  Briefcase,
  Users,
  Search,
  Plus,
  CheckCircle2,
  Award,
  ExternalLink,
  X,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Profile, RecruiterOverview } from "../types";
import { recruiterApi } from "../api/apiClient";

interface PortalHrdViewProps {
  profile: Profile;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

const PIPELINE_STAGES = ["Terkirim", "Screening", "Interview", "Ditawarkan", "Ditolak"];

export function PortalHrdView({ showToast }: PortalHrdViewProps) {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<RecruiterOverview | null>(null);
  const [talents, setTalents] = useState<any[]>([]);
  const [talentQuery, setTalentQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pipeline" | "jobs" | "talent" | "company">("pipeline");

  // Company form
  const [compName, setCompName] = useState("");
  const [compIndustry, setCompIndustry] = useState("");
  const [compLocation, setCompLocation] = useState("");
  const [compDesc, setCompDesc] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);

  // Create job form
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [jobSalary, setJobSalary] = useState("Rp 10.000.000 - Rp 15.000.000");
  const [jobLocation, setJobLocation] = useState("Jakarta (Hybrid)");
  const [jobType, setJobType] = useState("Full-time");
  const [jobSkills, setJobSkills] = useState("React, TypeScript, SQL");
  const [jobDesc, setJobDesc] = useState("");
  const [creatingJob, setCreatingJob] = useState(false);

  // Selected applicant drawer
  const [selectedApplicant, setSelectedApplicant] = useState<RecruiterOverview["applicants"][number] | null>(null);
  const [hrStatus, setHrStatus] = useState("Screening");
  const [hrNotes, setHrNotes] = useState("");
  const [interviewAt, setInterviewAt] = useState("");
  const [updatingApp, setUpdatingApp] = useState(false);

  // Cert verifier quick lookup & direct talent invite
  const [certLookupId, setCertLookupId] = useState("");
  const [inviteTarget, setInviteTarget] = useState<any | null>(null);
  const [inviteJobTitle, setInviteJobTitle] = useState("Junior Full-Stack Developer");
  const [inviteMessage, setInviteMessage] = useState(
    "Halo! Kami tertarik dengan portofolio & sertifikat terverifikasi Anda di SkillOra dan ingin mengundang ke tahap wawancara awal."
  );
  const [sendingInvite, setSendingInvite] = useState(false);

  const handleSendInvite = async () => {
    if (!inviteTarget || !inviteJobTitle.trim() || !inviteMessage.trim()) return;
    setSendingInvite(true);
    try {
      const res = await recruiterApi.inviteTalent({
        candidateId: inviteTarget.id,
        jobTitle: inviteJobTitle.trim(),
        message: inviteMessage.trim(),
        companyName: compName.trim() || undefined,
      });
      showToast(`Undangan wawancara terkirim ke ${res.candidateName} untuk posisi ${res.jobTitle}!`, "success");
      setInviteTarget(null);
    } catch (err: any) {
      showToast(err?.message || "Gagal mengirim undangan wawancara.", "error");
    } finally {
      setSendingInvite(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [ov, tl] = await Promise.all([recruiterApi.getOverview(), recruiterApi.searchTalent()]);
      setOverview(ov);
      setTalents(tl || []);
      if (ov?.company) {
        setCompName(ov.company.name || "");
        setCompIndustry(ov.company.industry || "");
        setCompLocation(ov.company.location || "");
        setCompDesc(ov.company.description || "");
      }
    } catch (err: any) {
      showToast(err?.message || "Gagal memuat Portal HRD. Pastikan peran akun Recruiter/HRD aktif.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearchTalent = async () => {
    try {
      const list = await recruiterApi.searchTalent(talentQuery.trim() || undefined);
      setTalents(list || []);
    } catch (err: any) {
      showToast(err?.message || "Gagal mencari talenta.", "error");
    }
  };

  const handleCreateJob = async () => {
    if (!jobTitle.trim() || !jobSalary.trim() || !jobLocation.trim()) {
      showToast("Judul posisi, gaji, dan lokasi wajib diisi.", "error");
      return;
    }
    setCreatingJob(true);
    try {
      await recruiterApi.createJob({
        title: jobTitle.trim(),
        salary: jobSalary.trim(),
        location: jobLocation.trim(),
        jobType,
        requiredSkills: jobSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        description:
          jobDesc.trim() || `Bergabung sebagai ${jobTitle.trim()} dan kembangkan produk digital berskala nasional.`,
      });
      setShowJobModal(false);
      setJobTitle("");
      setJobDesc("");
      showToast("Lowongan kerja berhasil diterbitkan ke Bursa Kerja!", "success");
      await loadData();
    } catch (err: any) {
      showToast(err?.message || "Gagal menerbitkan lowongan.", "error");
    } finally {
      setCreatingJob(false);
    }
  };

  const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
    try {
      await recruiterApi.updateJob(jobId, { status: currentStatus === "active" ? "closed" : "active" });
      showToast("Status lowongan diperbarui.", "success");
      await loadData();
    } catch (err: any) {
      showToast(err?.message || "Gagal memperbarui status lowongan.", "error");
    }
  };

  const handleSaveCompany = async () => {
    if (!compName.trim()) {
      showToast("Nama perusahaan wajib diisi.", "error");
      return;
    }
    setSavingCompany(true);
    try {
      await recruiterApi.upsertCompany({
        name: compName.trim(),
        industry: compIndustry.trim(),
        location: compLocation.trim(),
        description: compDesc.trim(),
      });
      showToast("Profil perusahaan mitra berhasil disimpan.", "success");
      await loadData();
    } catch (err: any) {
      showToast(err?.message || "Gagal menyimpan perusahaan.", "error");
    } finally {
      setSavingCompany(false);
    }
  };

  const handleOpenApplicant = (app: RecruiterOverview["applicants"][number]) => {
    setSelectedApplicant(app);
    setHrStatus(app.status || "Screening");
    setHrNotes(app.hrNotes || "");
    setInterviewAt(app.interviewAt ? app.interviewAt.slice(0, 16) : "");
  };

  const handleUpdateApplicant = async () => {
    if (!selectedApplicant) return;
    setUpdatingApp(true);
    try {
      await recruiterApi.updateApplicationStatus(selectedApplicant.applicationId, {
        status: hrStatus,
        hrNotes: hrNotes.trim(),
        interviewAt: interviewAt ? new Date(interviewAt).toISOString() : null,
      });
      showToast(`Status pelamar diperbarui ke '${hrStatus}'.`, "success");
      setSelectedApplicant(null);
      await loadData();
    } catch (err: any) {
      showToast(err?.message || "Gagal memperbarui status kandidat.", "error");
    } finally {
      setUpdatingApp(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        Memuat Portal HRD & Rekrutmen...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-2 font-sans">
      {/* Header & Metrics */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <Building2 className="w-4 h-4" />
            <span>Portal Mitra HRD & Applicant Tracking System</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white mt-1">
            {overview?.company?.name || "Portal Rekrutmen Mitra"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola lowongan aktif, seleksi kandidat melalui pipeline ATS, periksa CV ATS pelamar, dan rekrut talenta bersertifikat.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Lowongan Aktif</span>
            <span className="text-lg font-display font-bold text-slate-900 dark:text-white tabular-nums">
              {overview?.metrics.activeJobs ?? 0}
            </span>
          </div>
          <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Total Pelamar</span>
            <span className="text-lg font-display font-bold text-slate-900 dark:text-white tabular-nums">
              {overview?.metrics.totalApplicants ?? 0}
            </span>
          </div>
          <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Tahap Interview</span>
            <span className="text-lg font-display font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {overview?.metrics.interviewStage ?? 0}
            </span>
          </div>
          <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Offering</span>
            <span className="text-lg font-display font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {overview?.metrics.offeredStage ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          {[
            { id: "pipeline" as const, label: `Pipeline Pelamar (${overview?.applicants.length ?? 0})`, icon: Users },
            { id: "jobs" as const, label: `Lowongan (${overview?.jobs.length ?? 0})`, icon: Briefcase },
            { id: "talent" as const, label: "Cari Talenta Terverifikasi", icon: Award },
            { id: "company" as const, label: "Profil Perusahaan", icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowJobModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Publikasikan Lowongan Baru</span>
        </button>
      </div>

      {/* TAB: PIPELINE */}
      {activeTab === "pipeline" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          {!overview?.applicants.length ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Belum ada pelamar masuk pada lowongan Anda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Kandidat</th>
                    <th className="px-4 py-3">Posisi Dilamar</th>
                    <th className="px-4 py-3">Kompetensi & Sertifikasi</th>
                    <th className="px-4 py-3">Tahap ATS</th>
                    <th className="px-4 py-3 text-right">Aksi HRD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {overview.applicants.map((app) => (
                    <tr key={app.applicationId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{app.candidate.avatar}</span>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{app.candidate.name}</div>
                            <div className="text-[11px] text-slate-500">
                              Lv. {app.candidate.level} • {app.candidate.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{app.jobTitle}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {app.candidate.skills.slice(0, 3).map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                            >
                              {s}
                            </span>
                          ))}
                          {app.cv && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                              CV ATS {app.cv.atsScore || 75}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-md font-bold text-[11px] bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenApplicant(app)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-emerald-600 text-white font-bold text-[11px] cursor-pointer"
                        >
                          Kelola Pipeline
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: JOBS */}
      {activeTab === "jobs" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overview?.jobs.map((j) => (
            <div
              key={j.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">{j.title}</h3>
                    <p className="text-xs text-slate-500">
                      {j.company} • {j.location} • {j.jobType}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      j.status === "active"
                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {j.status === "active" ? "Aktif" : "Ditutup"}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{j.salary}</p>
                <p className="text-xs text-slate-500 line-clamp-2">{j.description}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-300 tabular-nums">{j.applicantCount} Pelamar</span>
                <button
                  onClick={() => handleToggleJobStatus(j.id, j.status)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold cursor-pointer"
                >
                  {j.status === "active" ? "Tutup Lowongan" : "Buka Kembali"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: TALENT SEARCH & CERT VERIFICATION */}
      {activeTab === "talent" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={talentQuery}
                  onChange={(e) => setTalentQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchTalent()}
                  placeholder="Cari talenta berdasarkan nama atau keahlian (React, Python, SQL)..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
              <button
                onClick={handleSearchTalent}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cari Talenta
              </button>
            </div>

            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex gap-2">
              <input
                type="text"
                value={certLookupId}
                onChange={(e) => setCertLookupId(e.target.value)}
                placeholder="Verifikasi ID Sertifikat..."
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
              <button
                onClick={() => certLookupId.trim() && navigate(`/verify/${certLookupId.trim()}`)}
                className="px-3.5 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
              >
                <span>Cek</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {talents.map((t) => (
              <div
                key={t.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl">{t.avatar}</span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{t.name}</h4>
                      <p className="text-xs text-slate-500 truncate">{t.role}</p>
                    </div>
                  </div>
                  {t.jobReadyVerified && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold shrink-0">
                      Siap Kerja ✓
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                  Lv.{t.level} • {t.xp.toLocaleString("id-ID")} XP • {t.certificateCount ?? t.certificatesCount ?? 0} Sertifikat{t.atsScore ? ` • ATS ${t.atsScore}` : ""}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(t.skills || []).slice(0, 5).map((s: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    {t.portfolioSlug && (
                      <button
                        type="button"
                        onClick={() => navigate(`/portfolio/${t.portfolioSlug}`)}
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Portofolio</span>
                      </button>
                    )}
                    {t.certificates?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => navigate(`/verify/${t.certificates[0].id}`)}
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sertifikat</span>
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setInviteTarget(t)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                  >
                    Undang Wawancara
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: COMPANY */}
      {activeTab === "company" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-2xl space-y-4">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">Profil Perusahaan Mitra</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Nama Perusahaan *</label>
              <input
                type="text"
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Sektor Industri</label>
              <input
                type="text"
                value={compIndustry}
                onChange={(e) => setCompIndustry(e.target.value)}
                className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 dark:text-slate-300">Lokasi Kantor</label>
              <input
                type="text"
                value={compLocation}
                onChange={(e) => setCompLocation(e.target.value)}
                className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 dark:text-slate-300">Tentang Perusahaan</label>
              <textarea
                rows={3}
                value={compDesc}
                onChange={(e) => setCompDesc(e.target.value)}
                className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl resize-none"
              />
            </div>
          </div>
          <button
            disabled={savingCompany}
            onClick={handleSaveCompany}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            {savingCompany ? "Menyimpan..." : "Simpan Profil Perusahaan"}
          </button>
        </div>
      )}

      {/* MODAL: CREATE JOB */}
      {showJobModal && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">Terbitkan Lowongan Kerja</h3>
              <button onClick={() => setShowJobModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Judul Posisi *</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Contoh: Backend Engineer (Node.js & PostgreSQL)"
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Rentang Gaji *</label>
                  <input
                    type="text"
                    value={jobSalary}
                    onChange={(e) => setJobSalary(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Lokasi Kerja *</label>
                  <input
                    type="text"
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Tipe Kontrak</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Magang">Magang / Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Skill Wajib (pisahkan koma)</label>
                  <input
                    type="text"
                    value={jobSkills}
                    onChange={(e) => setJobSkills(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Deskripsi Pekerjaan</label>
                <textarea
                  rows={3}
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  placeholder="Tanggung jawab utama dan kualifikasi kandidat..."
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowJobModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                disabled={creatingJob}
                onClick={handleCreateJob}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {creatingJob ? "Menerbitkan..." : "Publikasikan Lowongan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: APPLICANT PIPELINE & CV ATS INSPECTOR */}
      {selectedApplicant && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase text-emerald-600">{selectedApplicant.jobTitle}</p>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  {selectedApplicant.candidate.name}
                </h3>
              </div>
              <button onClick={() => setSelectedApplicant(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedApplicant.coverNote && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
                <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">Catatan Lamaran Kandidat:</div>
                <p className="text-slate-600 dark:text-slate-400">{selectedApplicant.coverNote}</p>
              </div>
            )}

            {selectedApplicant.cv && (
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> {selectedApplicant.cv.title}
                  </span>
                  <span className="tabular-nums">Skor ATS: {selectedApplicant.cv.atsScore || 75}/100</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300">{selectedApplicant.cv.summary}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedApplicant.cv.skills?.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Tahap Pipeline</label>
                <select
                  value={hrStatus}
                  onChange={(e) => setHrStatus(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  {PIPELINE_STAGES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Jadwal Interview (Opsional)</label>
                <input
                  type="datetime-local"
                  value={interviewAt}
                  onChange={(e) => setInterviewAt(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300">Catatan Evaluasi HRD</label>
              <textarea
                rows={3}
                value={hrNotes}
                onChange={(e) => setHrNotes(e.target.value)}
                placeholder="Catatan screening atau instruksi jadwal wawancara untuk kandidat..."
                className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedApplicant(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
              <button
                disabled={updatingApp}
                onClick={handleUpdateApplicant}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {updatingApp ? "Memperbarui..." : "Simpan Status Kandidat"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: INVITE VERIFIED TALENT */}
      {inviteTarget && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase text-emerald-600">Direct Talent Invite</p>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Undang {inviteTarget.name}
                </h3>
              </div>
              <button onClick={() => setInviteTarget(null)} className="p-1 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Posisi yang Ditawarkan</label>
                <input
                  type="text"
                  value={inviteJobTitle}
                  onChange={(e) => setInviteJobTitle(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Pesan Undangan &amp; Jadwal</label>
                <textarea
                  rows={4}
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setInviteTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                disabled={sendingInvite || !inviteJobTitle.trim() || !inviteMessage.trim()}
                onClick={handleSendInvite}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
              >
                {sendingInvite ? "Mengirim..." : "Kirim Undangan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PortalHrdView;
