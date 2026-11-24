import { useEffect, useState } from "react";
import { X, MapPin, Briefcase, CheckCircle2, DollarSign, FileText, CalendarClock, MessageSquare, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CvDocument, JobVacancy } from "../../../types";
import { cvApi } from "../../../api/apiClient";
import { ROUTES } from "../../../routes";
import { playSound } from "../../../utils/sound";

interface JobDetailModalProps {
  job: JobVacancy | null;
  isOpen: boolean;
  onClose: () => void;
  isBookmarked: boolean;
  applicationStatus?: string;
  onToggleBookmark: (jobId: string) => void;
  onApply: (jobId: string, cvDocumentId?: number | null, coverNote?: string) => void;
  userSkills: string[];
}

export function JobDetailModal({
  job,
  isOpen,
  onClose,
  isBookmarked,
  applicationStatus = "Belum Dilamar",
  onToggleBookmark,
  onApply,
  userSkills,
}: JobDetailModalProps) {
  const navigate = useNavigate();
  const [cvList, setCvList] = useState<CvDocument[]>([]);
  const [selectedCvId, setSelectedCvId] = useState<number | "">("");
  const [coverNote, setCoverNote] = useState("");
  const [loadingCvs, setLoadingCvs] = useState(false);

  const isApplied = applicationStatus !== "Belum Dilamar";

  useEffect(() => {
    if (!isOpen || !job || isApplied) return;
    let active = true;
    setLoadingCvs(true);
    cvApi
      .list()
      .then((docs) => {
        if (!active) return;
        const safeDocs = Array.isArray(docs) ? docs : [];
        setCvList(safeDocs);
        if (safeDocs.length > 0 && safeDocs[0].id) {
          setSelectedCvId(safeDocs[0].id);
        }
      })
      .catch(() => {
        if (active) setCvList([]);
      })
      .finally(() => {
        if (active) setLoadingCvs(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, job, isApplied]);

  if (!isOpen || !job) return null;

  const getMissingSkills = (jobSkills: string[]) => {
    return jobSkills.filter(
      (sk) => !userSkills.some((us) => us.includes(sk.toLowerCase()) || sk.toLowerCase().includes(us))
    );
  };

  const getMatchedSkills = (jobSkills: string[]) => {
    return jobSkills.filter((sk) =>
      userSkills.some((us) => us.includes(sk.toLowerCase()) || sk.toLowerCase().includes(us))
    );
  };

  const missingSkills = getMissingSkills(job.requiredSkills || []);
  const matchedSkills = getMatchedSkills(job.requiredSkills || []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl shrink-0">
              {job.logo || "🏢"}
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white leading-tight">
                {job.title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{job.company}</p>
            </div>
          </div>
          <button
            onClick={() => {
              playSound("click");
              onClose();
            }}
            aria-label="Tutup modal lowongan"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow custom-scrollbar">
          {/* Metadata */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 tabular-nums">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span>{job.salary ? job.salary : "Kompensasi Kompetitif"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 font-semibold tabular-nums">
              <Briefcase className="w-4 h-4" />
              <span>Kecocokan {job.matchPercentage || 0}%</span>
            </div>
          </div>

          {/* Applied HR Status & Interview Schedule */}
          {isApplied && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Status Pipeline HRD
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {applicationStatus}
                </span>
              </div>
              {job.interviewAt && (
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 font-medium">
                  <CalendarClock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    Jadwal Wawancara: <strong>{job.interviewAt}</strong>
                  </span>
                </div>
              )}
              {job.hrNotes && (
                <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/60 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
                  <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900 dark:text-white mb-0.5">Catatan Recruiter:</span>
                    <p>{job.hrNotes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Ikhtisar Pekerjaan</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {job.description}
            </p>
          </div>

          {/* Skills Analysis */}
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Analisis Keahlian Kandidat
            </h3>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60 space-y-4">
              {matchedSkills.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                    Skill yang Cocok ({matchedSkills.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {matchedSkills.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {missingSkills.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                    Skill yang Perlu Ditingkatkan ({missingSkills.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {missingSkills.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md border border-slate-300 dark:border-slate-600"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Application Attachments (CV ATS + Cover Note) */}
          {!isApplied && (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Lampirkan Dokumen Lamaran
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(ROUTES.career.cvBuilder);
                  }}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  + Kelola di CV ATS Builder
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih CV ATS Tersimpan
                </label>
                {loadingCvs ? (
                  <p className="text-xs text-slate-500">Memuat daftar CV tersimpan...</p>
                ) : cvList.length > 0 ? (
                  <select
                    aria-label="Pilih CV ATS"
                    value={selectedCvId}
                    onChange={(e) => setSelectedCvId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Kirim profil Skillora standar tanpa lampiran CV</option>
                    {cvList.map((cv) => (
                      <option key={cv.id} value={cv.id}>
                        {cv.title} ({cv.targetRole}) {cv.atsScore ? `• Skor ATS ${cv.atsScore}%` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    Belum ada dokumen CV ATS tersimpan. Profil Skillora & sertifikat terverifikasi Anda akan dikirim otomatis.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Catatan Singkat untuk HRD (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Ceritakan minat Anda atau tautan demo proyek relevan untuk posisi ini..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap justify-between items-center gap-3 sticky bottom-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleBookmark(job.id)}
              className={`font-bold px-4 py-2.5 rounded-xl text-xs transition-all border flex items-center gap-2 cursor-pointer ${
                isBookmarked
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {isBookmarked ? "Tersimpan" : "Simpan Lowongan"}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(ROUTES.career.voiceInterview);
              }}
              className="font-bold px-4 py-2.5 rounded-xl text-xs transition-all border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 flex items-center gap-1.5 cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              Latihan Voice Interview
            </button>
          </div>

          <button
            onClick={() => {
              if (!isApplied) {
                onApply(job.id, selectedCvId === "" ? null : Number(selectedCvId), coverNote.trim() || undefined);
              }
            }}
            disabled={isApplied}
            className={`font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 ${
              isApplied
                ? "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md cursor-pointer"
            }`}
          >
            {isApplied ? applicationStatus : "Kirim Lamaran Sekarang"}
          </button>
        </div>
      </div>
    </div>
  );
}
