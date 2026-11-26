import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  Users,
  Bell,
  Sparkles,
  Zap,
} from "lucide-react";
import { communityApi } from "../api/apiClient";
import { EventItem, Profile } from "../types";
import { playSound } from "../utils/sound";
import heroCampusImg from "../assets/images/hero_skillora_campus_1794974023605.jpg";
import techImg from "../assets/images/course_tech_engineering_1794974031663.jpg";
import bumnImg from "../assets/images/course_bumn_prep_1794974023438.jpg";

interface EventWebinarViewProps {
  onProfileUpdate?: (profile: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

export function EventWebinarView({ onProfileUpdate, showToast }: EventWebinarViewProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"semua" | "terdaftar">("semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    communityApi
      .getEvents()
      .then((list) => {
        if (active) setEvents(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (active) setEvents([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleRegister = async (eventId: string, title: string) => {
    if (registeringId) return;
    setRegisteringId(eventId);
    try {
      const res = await communityApi.registerEvent(eventId);
      if (Array.isArray(res?.events)) {
        setEvents(res.events);
      }
      if (res?.profile && onProfileUpdate) {
        onProfileUpdate(res.profile);
      }
      playSound("claim");
      showToast?.(`Tiket webinar "${title}" terkonfirmasi! +25 XP ditambahkan.`, "success");
    } catch (err: any) {
      showToast?.(err?.message || "Gagal mendaftar webinar.", "error");
    } finally {
      setRegisteringId(null);
    }
  };

  const getBannerImage = (category: string, index: number) => {
    const low = category.toLowerCase();
    if (low.includes("engineering") || low.includes("tech")) return techImg;
    if (low.includes("karir") || low.includes("rekrutmen")) return bumnImg;
    return index % 2 === 0 ? heroCampusImg : techImg;
  };

  const filteredEvents = events.filter((e) => {
    if (activeTab === "terdaftar" && !e.isRegistered) return false;
    const q = searchTerm.toLowerCase();
    if (q && !e.title.toLowerCase().includes(q) && !e.speaker.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="w-full space-y-6 py-2">
      {/* Hero Header */}
      <header className="space-y-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <p className="text-xs font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Masterclass, Live Coding &amp; Talkshow HRD · 100% Gratis
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
          Agenda Event &amp; Webinar Eksklusif
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-3xl leading-relaxed">
          Daftarkan kursi Anda pada sesi webinar mingguan bersama praktisi industri. Pendaftaran tercatat di sistem dan langsung memberi bonus XP ke profil Anda.
        </p>
      </header>

      {/* Tabs & Search Filter */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab("semua")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "semua"
                ? "bg-emerald-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            Semua Event ({events.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("terdaftar")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "terdaftar"
                ? "bg-emerald-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            Tiket Saya ({events.filter((e) => e.isRegistered).length})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            aria-label="Cari webinar"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari judul event atau pembicara..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-emerald-500 text-zinc-950 dark:text-white"
          />
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="p-10 text-center text-sm text-slate-500">Memuat jadwal webinar...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          Belum ada agenda webinar untuk filter ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((ev, i) => {
            const seatsLeft = Math.max(0, ev.quota - ev.registeredCount);
            const isFull = seatsLeft === 0;
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-40 overflow-hidden bg-slate-800">
                    <img
                      src={getBannerImage(ev.category, i)}
                      alt={ev.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                    <div className="absolute top-3 left-3 text-xs font-bold bg-violet-600 text-white px-2.5 py-1 rounded-lg">
                      {ev.category}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <p className="text-xs font-semibold text-violet-200 truncate">
                        {ev.speaker} · {ev.speakerRole}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                      {ev.description}
                    </p>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-violet-500" />
                          {ev.dateLabel}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-600 font-bold tabular-nums">
                          <Zap className="w-3.5 h-3.5" /> +{ev.xpReward} XP
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-violet-500" />
                          {ev.timeLabel}
                        </span>
                        <span className="flex items-center gap-1 tabular-nums">
                          <Users className="w-3.5 h-3.5" /> {ev.registeredCount}/{ev.quota}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    type="button"
                    disabled={ev.isRegistered || isFull || registeringId === ev.id}
                    onClick={() => handleRegister(ev.id, ev.title)}
                    className={`w-full text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      ev.isRegistered
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-default"
                        : isFull
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                        : "bg-violet-600 hover:bg-violet-700 text-white"
                    }`}
                  >
                    {ev.isRegistered ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tiket Terdaftar</span>
                      </>
                    ) : registeringId === ev.id ? (
                      <span>Mendaftarkan...</span>
                    ) : isFull ? (
                      <span>Kuota Penuh</span>
                    ) : (
                      <>
                        <Bell className="w-3.5 h-3.5" />
                        <span>Daftar Event Gratis</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
