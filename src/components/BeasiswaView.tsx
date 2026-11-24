import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Award,
  GraduationCap,
  Building,
  Search,
  Clock,
  Bookmark,
  ExternalLink,
  X,
  Sparkles,
  Check,
  MapPin,
} from "lucide-react";
import { communityApi } from "../api/apiClient";
import { ScholarshipItem } from "../types";

export function BeasiswaView() {
  const [scholarships, setScholarships] = useState<ScholarshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDegree, setSelectedDegree] = useState<string>("Semua");
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("skillora_saved_scholarships");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [selectedScholarship, setSelectedScholarship] = useState<ScholarshipItem | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    communityApi
      .getScholarships()
      .then((list) => {
        if (active) setScholarships(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (active) setScholarships([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const degrees = ["Semua", "S1", "S2", "S3"];

  const filteredScholarships = scholarships.filter((b) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.provider.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q);
    const matchesDegree =
      selectedDegree === "Semua" || b.degree.toUpperCase().includes(selectedDegree);
    return matchesSearch && matchesDegree;
  });

  const toggleBookmark = (id: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem("skillora_saved_scholarships", JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-2">
      {/* Hero Header */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-sm">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Direktori Beasiswa & Pendanaan Pendidikan</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Pusat Beasiswa Mahasiswa & Fresh Graduate
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Telusuri daftar program beasiswa nasional dan mitra korporat terverifikasi lengkap dengan cakupan pendanaan, syarat pendaftaran, dan tautan portal resmi.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            aria-label="Cari beasiswa"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari program beasiswa atau institusi penyelenggara..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {degrees.map((deg) => (
            <button
              key={deg}
              type="button"
              onClick={() => setSelectedDegree(deg)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedDegree === deg
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              {deg === "Semua" ? "Semua Jenjang" : `Jenjang ${deg}`}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="p-10 text-center text-sm text-slate-500">Memuat data beasiswa...</div>
      ) : filteredScholarships.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          Tidak ada program beasiswa yang cocok dengan filter Anda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredScholarships.map((b, i) => {
            const isSaved = savedIds.includes(b.id);
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {b.degree}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleBookmark(b.id)}
                      aria-label={isSaved ? "Hapus simpanan" : "Simpan beasiswa"}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        isSaved
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                      {b.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                      <Building className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{b.provider}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                    {b.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-semibold">{b.coverage}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{b.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>Batas Daftar: {b.deadline}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedScholarship(b)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                  >
                    Syarat & Detail
                  </button>
                  <a
                    href={b.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <span>Portal Resmi</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedScholarship && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-bold text-indigo-600">{selectedScholarship.degree}</span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg mt-1">
                    {selectedScholarship.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedScholarship.provider}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedScholarship(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Deskripsi Program</h4>
                  <p className="leading-relaxed">{selectedScholarship.description}</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Cakupan Pendanaan</h4>
                  <p className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    <GraduationCap className="w-4 h-4" />
                    <span>{selectedScholarship.coverage}</span>
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">Persyaratan Utama</h4>
                  <ul className="space-y-1.5">
                    {(selectedScholarship.requirements || []).map((req, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedScholarship(null)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
                <a
                  href={selectedScholarship.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <span>Kunjungi Portal Resmi</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
