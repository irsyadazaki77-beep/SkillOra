import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Award,
  Calendar,
  BookOpen,
  ExternalLink,
  Plus,
  CheckCircle2,
  ClipboardCheck,
  Video,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Course, MentorSubmissionItem, MentoringBooking, MentoringSlot, Profile } from "../types";
import { mentorApi, mentoringApi } from "../api/apiClient";
import { ROUTES } from "../routes";
import { toSafeExternalUrl } from "../utils/urlUtils";

interface PortalMentorViewProps {
  profile: Profile;
  courses: Course[];
  onCoursesUpdated: (updatedCourses: Course[]) => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

export function PortalMentorView({ profile, showToast }: PortalMentorViewProps) {
  const [activeTab, setActiveTab] = useState<"submissions" | "mentoring">("submissions");
  const [submissions, setSubmissions] = useState<MentorSubmissionItem[]>([]);
  const [slots, setSlots] = useState<MentoringSlot[]>([]);
  const [bookings, setBookings] = useState<MentoringBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Review drawer state
  const [reviewingItem, setReviewingItem] = useState<MentorSubmissionItem | null>(null);
  const [reviewScore, setReviewScore] = useState(85);
  const [reviewStatus, setReviewStatus] = useState<"PASS" | "RETRY">("PASS");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  // New slot state
  const [slotTopic, setSlotTopic] = useState("");
  const [slotSchedule, setSlotSchedule] = useState("");
  const [slotGems, setSlotGems] = useState("40");
  const [slotQuota, setSlotQuota] = useState("4");
  const [creatingSlot, setCreatingSlot] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subsRes, slotsRes, bookRes] = await Promise.all([
        mentorApi.getSubmissions(),
        mentoringApi.getSlots(),
        mentoringApi.getMyBookings(),
      ]);
      setSubmissions(subsRes || []);
      setSlots(slotsRes || []);
      setBookings(bookRes || []);
    } catch (err: any) {
      showToast(err?.message || "Gagal memuat data Portal Mentor.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenReview = (item: MentorSubmissionItem) => {
    setReviewingItem(item);
    setReviewScore(item.score ?? 85);
    setReviewStatus(item.status === "PASS" ? "PASS" : "PASS");
    setReviewFeedback(item.feedback || "");
  };

  const handleSubmitReview = async () => {
    if (!reviewingItem) return;
    setSavingReview(true);
    try {
      await mentorApi.reviewSubmission(reviewingItem.id, {
        score: reviewScore,
        status: reviewStatus,
        feedback: reviewFeedback.trim() || `Evaluasi selesai oleh ${profile.name}.`,
      });
      showToast(
        reviewStatus === "PASS"
          ? "Proyek diluluskan & sertifikat resmi diterbitkan ke mahasiswa!"
          : "Catatan revisi berhasil dikirim ke mahasiswa.",
        "success"
      );
      setReviewingItem(null);
      await loadData();
    } catch (err: any) {
      showToast(err?.message || "Gagal menyimpan evaluasi proyek.", "error");
    } finally {
      setSavingReview(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!slotTopic.trim() || !slotSchedule.trim()) {
      showToast("Topik dan jadwal sesi wajib diisi.", "error");
      return;
    }
    setCreatingSlot(true);
    try {
      await mentoringApi.createSlot({
        topic: slotTopic.trim(),
        scheduleLabel: slotSchedule.trim(),
        priceGems: Number(slotGems) || 0,
        maxQuota: Number(slotQuota) || 4,
      });
      setSlotTopic("");
      setSlotSchedule("");
      showToast("Jadwal mentoring 1-on-1 baru diterbitkan!", "success");
      await loadData();
    } catch (err: any) {
      showToast(err?.message || "Gagal membuat jadwal mentoring.", "error");
    } finally {
      setCreatingSlot(false);
    }
  };

  const handleCompleteBooking = async (bookingId: number) => {
    try {
      await mentoringApi.updateBooking(bookingId, { status: "completed" });
      showToast("Status sesi mentoring diperbarui menjadi selesai.", "success");
      await loadData();
    } catch (err: any) {
      showToast(err?.message || "Gagal memperbarui booking.", "error");
    }
  };

  const pendingCount = submissions.filter((s) => s.status !== "PASS").length;
  const passedCount = submissions.filter((s) => s.status === "PASS").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-2 font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Portal Mentor, Dosen & Manajemen Kurikulum LMS</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white mt-1">
            Workspace Mentor Industri
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Nilai proyek portofolio mahasiswa untuk menerbitkan sertifikat resmi, kelola jadwal mentoring 1-on-1, serta publikasikan modul LMS.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Antrean Review</span>
            <span className="text-lg font-display font-bold text-slate-900 dark:text-white tabular-nums">{pendingCount}</span>
          </div>
          <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Sertifikat Terbit</span>
            <span className="text-lg font-display font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{passedCount}</span>
          </div>
          <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Booking Aktif</span>
            <span className="text-lg font-display font-bold text-slate-900 dark:text-white tabular-nums">{bookings.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs & LMS Studio Link */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          {[
            { id: "submissions" as const, label: `Review Proyek (${submissions.length})`, icon: ClipboardCheck },
            { id: "mentoring" as const, label: `Sesi Mentoring (${slots.length})`, icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
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

        <Link
          to={ROUTES.lms}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Buka LMS Studio →</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          Memuat data antrean mentor...
        </div>
      ) : activeTab === "submissions" ? (
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-500">
              Belum ada pengumpulan proyek mahasiswa dalam antrean saat ini.
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Mahasiswa</th>
                      <th className="px-4 py-3">Kursus & Proyek</th>
                      <th className="px-4 py-3">Tautan Karya</th>
                      <th className="px-4 py-3">Skor</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Evaluasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{sub.student?.avatar || "🦁"}</span>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{sub.student?.name || "Mahasiswa"}</div>
                              <div className="text-[11px] text-slate-500">{sub.student?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 dark:text-white">{sub.courseTitle}</div>
                          <div className="text-[11px] text-slate-500">{sub.projectTitle}</div>
                        </td>
                        <td className="px-4 py-3">
                          {toSafeExternalUrl(sub.projectUrl) ? (
                            <a
                              href={toSafeExternalUrl(sub.projectUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                            >
                              <span>Buka Repositori</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs">Tautan tidak valid</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold tabular-nums text-slate-900 dark:text-white">
                          {sub.score ?? "-"}/100
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              sub.status === "PASS"
                                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                                : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleOpenReview(sub)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 text-white font-bold text-[11px] cursor-pointer"
                          >
                            Nilai & Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Create slot form */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 h-fit">
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Buka Jadwal Mentoring 1-on-1</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Topik Sesi *</label>
                <input
                  type="text"
                  value={slotTopic}
                  onChange={(e) => setSlotTopic(e.target.value)}
                  placeholder="Contoh: Bedah Portofolio React & Persiapan Wawancara"
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Jadwal Waktu *</label>
                <input
                  type="text"
                  value={slotSchedule}
                  onChange={(e) => setSlotSchedule(e.target.value)}
                  placeholder="Contoh: Kamis, 19:30 - 20:15 WIB"
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Biaya (Gems)</label>
                  <input
                    type="number"
                    value={slotGems}
                    onChange={(e) => setSlotGems(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Kuota</label>
                  <input
                    type="number"
                    value={slotQuota}
                    onChange={(e) => setSlotQuota(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
              <button
                disabled={creatingSlot}
                onClick={handleCreateSlot}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
              >
                {creatingSlot ? "Menyimpan..." : "Terbitkan Jadwal"}
              </button>
            </div>
          </div>

          {/* Bookings & Slots list */}
          <div className="lg:col-span-8 space-y-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                Pesanan Sesi Masuk ({bookings.length})
              </h3>
              {bookings.length === 0 ? (
                <p className="text-xs text-slate-500">Belum ada mahasiswa yang memesan sesi mentoring.</p>
              ) : (
                <div className="space-y-2.5">
                  {bookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {b.studentName} — {b.topic}
                        </div>
                        <div className="text-slate-500">
                          Jadwal: {b.scheduleLabel} • Catatan: {b.notes}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {toSafeExternalUrl(b.meetingLink) && (
                          <a
                            href={toSafeExternalUrl(b.meetingLink)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1"
                          >
                            <Video className="w-3.5 h-3.5 text-emerald-600" /> Ruang Meet
                          </a>
                        )}
                        {b.status !== "completed" ? (
                          <button
                            onClick={() => handleCompleteBooking(b.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                          >
                            Tandai Selesai
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                Daftar Slot Aktif ({slots.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {slots.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1"
                  >
                    <div className="font-bold text-slate-900 dark:text-white">{s.topic}</div>
                    <div className="text-slate-500">{s.scheduleLabel}</div>
                    <div className="flex justify-between pt-1 font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                      <span>{s.priceGems} Gems</span>
                      <span>
                        Terisi: {s.bookedCount}/{s.maxQuota}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewingItem && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase text-emerald-600">Penilaian Mentor</p>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  {reviewingItem.student?.name} — {reviewingItem.courseTitle}
                </h3>
              </div>
              <Award className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-xs space-y-1">
              <div className="font-semibold text-slate-700 dark:text-slate-300">URL Proyek: {reviewingItem.projectUrl}</div>
              {reviewingItem.studentCodeNotes && (
                <div className="text-slate-500">Catatan Mahasiswa: {reviewingItem.studentCodeNotes}</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Skor (0–100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={reviewScore}
                  onChange={(e) => setReviewScore(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl tabular-nums"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Keputusan Kelulusan</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as "PASS" | "RETRY")}
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="PASS">PASS (Terbitkan Sertifikat)</option>
                  <option value="RETRY">RETRY (Minta Revisi)</option>
                </select>
              </div>
            </div>

            <div className="text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300">Umpan Balik Mentor</label>
              <textarea
                rows={4}
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                placeholder="Tuliskan apresiasi, kekuatan arsitektur, serta saran perbaikan konkret..."
                className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReviewingItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                disabled={savingReview}
                onClick={handleSubmitReview}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {savingReview ? "Menyimpan..." : "Simpan Evaluasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PortalMentorView;
