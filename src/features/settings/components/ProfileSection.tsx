import React from "react";
import { User, Plus, X, Award } from "lucide-react";
import { Profile } from "../../../types";

interface ProfileSectionProps {
  name: string;
  setName: (v: string) => void;
  role: string;
  setRole: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  skills: string[];
  newSkillInput: string;
  setNewSkillInput: (v: string) => void;
  handleAddSkill: () => void;
  handleRemoveSkill: (skill: string) => void;
  profile: Profile;
}

export function ProfileSection({
  name,
  setName,
  role,
  setRole,
  email,
  setEmail,
  bio,
  setBio,
  skills,
  newSkillInput,
  setNewSkillInput,
  handleAddSkill,
  handleRemoveSkill,
  profile
}: ProfileSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-600" />
          <span>Informasi Profil & Resume</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Data ini digunakan untuk menghasilkan CV ATS otomatis, sertifikat kompetensi, dan pencocokan lowongan karir.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nama Lengkap</label>
          <input aria-label="Input field"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            placeholder="Masukkan nama lengkap Anda"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Alamat Email</label>
          <input aria-label="Input field"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            placeholder="nama@email.com"
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Peran / Target Karir Saat Ini</label>
          <input aria-label="Input field"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            placeholder="Contoh: Frontend React Engineer / Mahasiswa Ilmu Komputer"
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Biografi Ringkas</label>
          <textarea aria-label="Input field"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium leading-relaxed resize-none"
            placeholder="Tuliskan latar belakang singkat dan aspirasi karir Anda..."
          />
        </div>
      </div>

      {/* Skills Manager */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Keahlian & Tag Kompetensi ({skills.length})</span>
          </label>
          <p className="text-xs text-slate-500 mt-0.5">
            Tag skill digunakan oleh algoritma pencocokan lowongan bursa kerja dan AI Mentor untuk menyusun materi belajar.
          </p>
        </div>

        <div className="flex gap-2">
          <input aria-label="Input field"
            type="text"
            value={newSkillInput}
            onChange={(e) => setNewSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSkill();
              }
            }}
            placeholder="Tambah skill baru (misal: Docker, Next.js, Redux)..."
            className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
          />
          <button
            type="button"
            onClick={handleAddSkill}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {skills.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-lg text-xs font-semibold"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill)}
                className="text-indigo-400 hover:text-rose-500 p-0.5 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
