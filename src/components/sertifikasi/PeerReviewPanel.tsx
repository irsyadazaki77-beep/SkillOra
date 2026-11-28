import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Award, CheckCircle2, ExternalLink, MessageSquarePlus, Users } from "lucide-react";
import { peerReviewApi } from "../../api/apiClient";
import { queryKeys } from "../../lib/queryKeys";
import { Profile } from "../../types";
import { toSafeExternalUrl } from "../../utils/urlUtils";

interface PeerReviewPanelProps {
  profile: Profile;
  onProfileUpdate?: (updated: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

export function PeerReviewPanel({ profile, onProfileUpdate, showToast }: PeerReviewPanelProps) {
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState<any[]>([]);
  const [received, setReceived] = useState<any[]>([]);
  const [givenCount, setGivenCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [activeSubId, setActiveSubId] = useState<number | null>(null);
  const [archScore, setArchScore] = useState(85);
  const [featureScore, setFeatureScore] = useState(85);
  const [docScore, setDocScore] = useState(85);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isGuest =
    profile?.role === "Guest" ||
    profile?.email === "guest@skillora.app" ||
    localStorage.getItem("skillora_guest_mode") === "true";

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await peerReviewApi.getQueue();
      setQueue(res?.queue || []);
      setReceived(res?.received || []);
      setGivenCount(res?.givenCount || 0);
    } catch {
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleSubmitPeerReview = async (submissionId: number) => {
    if (feedback.trim().length < 25) {
      showToast?.("Tuliskan masukan konstruktif minimal 25 karakter.", "error");
      return;
    }
    const avgScore = Math.round((archScore + featureScore + docScore) / 3);
    setSubmitting(true);
    try {
      const res = await peerReviewApi.submitReview({
        submissionId,
        score: avgScore,
        rubricBreakdown: [
          { criterion: "Arsitektur & Kebersihan Kode", score: archScore },
          { criterion: "Kelengkapan Fitur & Fungsionalitas", score: featureScore },
          { criterion: "Dokumentasi README & Pengalaman Pengguna", score: docScore },
        ],
        feedback: feedback.trim(),
      });
      if (res?.profile) {
        queryClient.setQueryData(queryKeys.user.profile(), res.profile);
        onProfileUpdate?.(res.profile);
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
      }
      setActiveSubId(null);
      setFeedback("");
      await loadQueue();
      showToast?.(
        res.earnedXp > 0
          ? `Peer review terkirim! Anda meraih +${res.earnedXp} XP.`
          : "Peer review terkirim! Terima kasih telah membantu rekan belajar.",
        "success"
      );
    } catch (err: any) {
      showToast?.(err?.message || "Gagal mengirim peer review.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Peer Code Review Komunitas (+75 XP / Review)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review proyek rekan sejawat berbasis rubrik agar seluruh pelajar gratis mendapat umpan balik cepat setara mentor.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
          {givenCount} Review Diberikan
        </span>
      </div>

      {isGuest && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Masuk dengan akun Google untuk mulai menilai proyek teman sejawat dan memperoleh +75 XP per review.
        </p>
      )}

      {loading ? (
        <p className="text-xs text-slate-500">Memuat antrean proyek rekan...</p>
      ) : queue.length === 0 ? (
        <div className="p-5 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500">
          Belum ada proyek rekan yang menunggu review saat ini.
        </div>
      ) : (
        <div className="space-y-3">
          {queue.slice(0, 4).map((item) => {
            const isExpanded = activeSubId === item.submissionId;
            return (
              <div
                key={item.submissionId}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.authorName} · <span className="text-emerald-600">{item.courseId}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                      {item.studentNotes || "Submission proyek portofolio SkillOra"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {toSafeExternalUrl(item.projectUrl) && (
                      <a
                        href={toSafeExternalUrl(item.projectUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-blue-600 dark:text-blue-400 inline-flex items-center gap-1"
                      >
                        <span>Lihat Repo</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {!isGuest && (
                      <button
                        type="button"
                        onClick={() => setActiveSubId(isExpanded ? null : item.submissionId)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquarePlus className="w-3 h-3" />
                        <span>{isExpanded ? "Tutup" : "Nilai Proyek"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && !isGuest && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <label className="space-y-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                          Arsitektur ({archScore})
                        </span>
                        <input
                          type="range"
                          min={50}
                          max={100}
                          value={archScore}
                          onChange={(e) => setArchScore(Number(e.target.value))}
                          className="w-full accent-emerald-600"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                          Fitur ({featureScore})
                        </span>
                        <input
                          type="range"
                          min={50}
                          max={100}
                          value={featureScore}
                          onChange={(e) => setFeatureScore(Number(e.target.value))}
                          className="w-full accent-emerald-600"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                          Dokumentasi ({docScore})
                        </span>
                        <input
                          type="range"
                          min={50}
                          max={100}
                          value={docScore}
                          onChange={(e) => setDocScore(Number(e.target.value))}
                          className="w-full accent-emerald-600"
                        />
                      </label>
                    </div>

                    <textarea
                      rows={3}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Tuliskan masukan teknis yang spesifik (kelebihan arsitektur + saran perbaikan minimal 25 karakter)..."
                      className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />

                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={submitting || feedback.trim().length < 25}
                        onClick={() => handleSubmitPeerReview(item.submissionId)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{submitting ? "Mengirim..." : "Kirim Peer Review (+75 XP)"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {received.length > 0 && (
        <div className="pt-2 space-y-2">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>Ulasan yang Anda Terima ({received.length})</span>
          </h4>
          {received.slice(0, 3).map((rev) => (
            <div
              key={rev.id}
              className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 text-xs space-y-1"
            >
              <div className="flex items-center justify-between font-semibold text-emerald-800 dark:text-emerald-300">
                <span>
                  {rev.reviewerName} · {rev.courseId}
                </span>
                <span>Skor: {rev.score}/100</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">{rev.feedback}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
