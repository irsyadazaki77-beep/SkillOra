import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Calendar,
  Users,
  Search,
  Clock,
  Video,
  CheckCircle2,
  Award,
  X,
  ChevronRight,
  Gem,
  ExternalLink,
} from "lucide-react";
import { mentoringApi } from "../api/apiClient";
import { MentoringBooking, MentoringSlot, Profile } from "../types";
import { playSound } from "../utils/sound";

interface MentoringViewProps {
  onProfileUpdate?: (profile: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

export function MentoringView({ onProfileUpdate, showToast }: MentoringViewProps) {
  const [slots, setSlots] = useState<MentoringSlot[]>([]);
  const [bookings, setBookings] = useState<MentoringBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"explore" | "scheduled">("explore");

  const [selectedSlot, setSelectedSlot] = useState<MentoringSlot | null>(null);
  const [userNote, setUserNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [slotList, myBookings] = await Promise.all([
        mentoringApi.getSlots(),
        mentoringApi.getMyBookings(),
      ]);
      setSlots(Array.isArray(slotList) ? slotList : []);
      setBookings(Array.isArray(myBookings) ? myBookings : []);
    } catch (err: any) {
      showToast?.(err?.message || "Gagal memuat jadwal mentoring.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSlots = slots.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      !q ||
      s.mentorName.toLowerCase().includes(q) ||
      s.mentorCompany.toLowerCase().includes(q) ||
      s.topic.toLowerCase().includes(q) ||
      s.mentorRole.toLowerCase().includes(q)
    );
  });

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await mentoringApi.bookSlot(selectedSlot.id, userNote.trim());
      if (res?.profile && onProfileUpdate) {
        onProfileUpdate(res.profile);
      }
      playSound("claim");
      showToast?.(
        `Sesi Mentoring dengan ${selectedSlot.mentorName} berhasil dijadwalkan!`,
        "success"
      );
      setSelectedSlot(null);
      setUserNote("");
      await loadData();
      setActiveTab("scheduled");
    } catch (err: any) {
      showToast?.(err?.message || "Gagal melakukan booking sesi mentoring.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 py-2">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="space-y-1 max-w-3xl">
          <p className="text-xs font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Mentoring 1-on-1 Terverifikasi Industri · 100% Gratis
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Bimbingan Karir &amp; Review Kode Langsung
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
            Pilih jadwal terbuka dari praktisi industri dan mentor aktif SkillOra, ajukan catatan konsultasi atau tautan portofolio, dan pantau tautan pertemuan langsung di akun Anda.
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("explore")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "explore"
              ? "bg-emerald-600 text-white"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          Jadwal Mentor Tersedia ({slots.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("scheduled")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer tabular-nums ${
            activeTab === "scheduled"
              ? "bg-emerald-600 text-white"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          Booking Saya ({bookings.length})
        </button>
      </div>

      {activeTab === "scheduled" ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Daftar Sesi Mentoring Terjadwal</span>
          </h2>

          {bookings.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <p className="text-sm text-slate-500">Anda belum memesan sesi mentoring 1-on-1.</p>
              <button
                type="button"
                onClick={() => setActiveTab("explore")}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cari Jadwal Mentor
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{b.topic}</p>
                      <p className="text-slate-500">
                        Mentor: <strong className="text-slate-700 dark:text-slate-200">{b.mentorName}</strong> · {b.mentorCompany}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg font-bold capitalize ${
                        b.status === "confirmed" || b.status === "completed"
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{b.scheduleLabel}</span>
                  </div>

                  {b.notes && (
                    <p className="text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <strong>Catatan Anda:</strong> {b.notes}
                    </p>
                  )}

                  {b.mentorNotes && (
                    <p className="text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <strong>Catatan Mentor:</strong> {b.mentorNotes}
                    </p>
                  )}

                  {b.meetingLink && (
                    <a
                      href={b.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Buka Ruang Meeting</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Search Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                aria-label="Cari mentor atau topik"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama mentor, perusahaan, atau topik konsultasi..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">Memuat jadwal mentor...</div>
          ) : filteredSlots.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              Belum ada jadwal mentoring yang sesuai pencarian Anda.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSlots.map((slot, i) => {
                const quotaLeft = Math.max(0, slot.maxQuota - slot.bookedCount);
                const isFull = quotaLeft === 0 || slot.status !== "open";
                return (
                  <motion.div
                    key={slot.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 flex items-center justify-center text-2xl shrink-0">
                          {slot.mentorAvatar || "👨‍💻"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                              {slot.mentorName}
                            </h3>
                            <Award className="w-4 h-4 text-blue-500 shrink-0" />
                          </div>
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">
                            {slot.mentorRole} · {slot.mentorCompany}
                          </p>
                        </div>
                      </div>

                      <p className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                        {slot.topic}
                      </p>

                      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {slot.scheduleLabel}
                          </span>
                          <span className="tabular-nums font-semibold">{slot.durationMinutes} Menit</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            Sisa Kuota
                          </span>
                          <span className="tabular-nums font-bold">
                            {quotaLeft} / {slot.maxQuota}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Gem className="w-3.5 h-3.5 text-emerald-500" />
                            Biaya Pelajar
                          </span>
                          <span className="tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                            Gratis (Rp 0)
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={slot.isBookedByMe || isFull}
                      onClick={() => setSelectedSlot(slot)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        slot.isBookedByMe
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-default"
                          : isFull
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      {slot.isBookedByMe ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Sudah Dipesan</span>
                        </>
                      ) : isFull ? (
                        <span>Kuota Penuh</span>
                      ) : (
                        <>
                          <span>Booking Jadwal</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Booking Modal */}
      <AnimatePresence>
        {selectedSlot && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Konfirmasi Booking Mentoring
                  </h3>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">
                    {selectedSlot.mentorName} · {selectedSlot.scheduleLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmBooking} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs space-y-1">
                  <p className="font-bold text-zinc-950 dark:text-white">{selectedSlot.topic}</p>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    Durasi: {selectedSlot.durationMinutes} menit · Biaya Pelajar:{" "}
                    <strong className="text-emerald-600 dark:text-emerald-400">Gratis (Rp 0)</strong>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Catatan Pertanyaan / Tautan Portofolio
                  </label>
                  <textarea
                    rows={3}
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    placeholder="Contoh: Saya ingin konsultasi review CV ATS dan arsitektur project React..."
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSlot(null)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Memproses..." : "Konfirmasi Booking"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
