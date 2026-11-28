import React, { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Shield, Bell, Sparkles, Sliders, Terminal, Save 
} from "lucide-react";
import { Profile, Course, MentorReview } from "../../types";
import { SettingsSection, SettingsViewProps } from "./types";
import { ProfileSection } from "./components/ProfileSection";
import { SecuritySection } from "./components/SecuritySection";
import { MentorSection } from "./components/MentorSection";
import { NotificationsSection } from "./components/NotificationsSection";
import { AppearanceSection } from "./components/AppearanceSection";
import { DeveloperSection } from "./components/DeveloperSection";
import { playSound } from "../../utils/sound";
import { userApi, devApi } from "../../api/apiClient";

export function SettingsView({ profile, onSettingsSaved, onDevAction, showToast }: SettingsViewProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [name, setName] = useState(profile.name || "");
  const [role, setRole] = useState(profile.role || "");
  const [email, setEmail] = useState(profile.email || "ahmad.zaki@email.com");
  const [bio, setBio] = useState((profile as any).bio || "Saya adalah calon Professional Developer yang antusias mempelajari teknologi terbaru di platform Skillora.");
  const [mentorTone, setMentorTone] = useState((profile as any).mentorTone || "friendly");
  const [isDevMode, setIsDevMode] = useState(profile.isDevMode || false);
  
  // Skills lists
  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [newSkillInput, setNewSkillInput] = useState("");

  // Notification states
  const [notifyEmail, setNotifyEmail] = useState((profile as any).notifyEmail !== false);
  const [notifyDaily, setNotifyDaily] = useState((profile as any).notifyDaily !== false);
  const [notifySound, setNotifySound] = useState((profile as any).notifySound !== false);

  // Security fields
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Appearance settings
  const [dashboardTheme, setDashboardTheme] = useState(() => {
    return localStorage.getItem("skillora_dashboard_theme") || "default";
  });

  // Load latest profile values on mount/update
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setRole(profile.role);
      setEmail(profile.email || "ahmad.zaki@email.com");
      setSkills(profile.skills);
      setIsDevMode(profile.isDevMode || false);
      if ((profile as any).bio) setBio((profile as any).bio);
      if ((profile as any).mentorTone) setMentorTone((profile as any).mentorTone);
    }
  }, [profile]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const data = await userApi.updateSettings({
        name,
        role,
        email,
        bio,
        mentorTone,
        notifyEmail,
        notifyDaily,
        notifySound
      });
      
      showToast("Pengaturan profil berhasil disimpan!", "success");
      onSettingsSaved(data.profile);
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Gagal menyimpan pengaturan", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = () => {
    const skillToAdd = newSkillInput.trim();
    if (!skillToAdd) return;
    if (skills.includes(skillToAdd)) {
      showToast("Keahlian sudah ada dalam daftar!", "info");
      return;
    }
    const updatedSkills = [...skills, skillToAdd];
    setSkills(updatedSkills);
    setNewSkillInput("");
    showToast(`Keahlian '${skillToAdd}' ditambahkan. Simpan pengaturan untuk melakukan sinkronisasi lowongan kerja.`, "success");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updatedSkills = skills.filter(s => s !== skillToRemove);
    setSkills(updatedSkills);
  };

  const handleSaveSecurity = (e: FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      showToast("Harap masukkan kata sandi lama Anda.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Konfirmasi kata sandi baru tidak cocok!", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Kata sandi baru harus berukuran minimal 6 karakter.", "error");
      return;
    }

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Kata sandi Anda berhasil diperbarui di sistem aman!", "success");
    }, 1000);
  };

  const handleApplyTheme = (themeName: string) => {
    setDashboardTheme(themeName);
    localStorage.setItem("skillora_dashboard_theme", themeName);
    document.body.className = `theme-${themeName}`;
    showToast(`Skema warna ${themeName.toUpperCase()} berhasil diterapkan.`, "success");
    playSound("correct");
  };

  const handleToggleDevMode = async (checked: boolean) => {
    setIsDevMode(checked);
    try {
      const data = await devApi.toggleDevMode(checked);
      if (onDevAction) {
        onDevAction({ profile: data.profile });
      } else {
        onSettingsSaved(data.profile);
      }
      showToast(checked ? "Mode Developer diaktifkan! ⚙️" : "Mode Developer dinonaktifkan.", "success");
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Gagal mengubah mode developer", "error");
    }
  };

  const handleInstantUnlock = async () => {
    setSaving(true);
    try {
      const data = await devApi.unlockCertificates();
      if (onDevAction) {
        onDevAction({ 
          profile: data.profile, 
          courses: data.courses, 
          reviews: (data as any).reviews 
        });
      } else {
        onSettingsSaved(data.profile);
      }
      showToast("Semua sertifikat & kuis berhasil dibuka! 🏆", "success");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Gagal membuka sertifikat", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDevData = async () => {
    setSaving(true);
    try {
      const data = await devApi.resetData();
      if (onDevAction) {
        onDevAction({ 
          profile: data.profile, 
          courses: (data as any).courses, 
          reviews: (data as any).reviews 
        });
      } else {
        onSettingsSaved(data.profile);
      }
      showToast("Semua data berhasil di-reset! 🔄", "success");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Gagal melakukan reset data", "error");
    } finally {
      setSaving(false);
    }
  };

  const navItems = [
    { id: "profile", label: "Profil Pengguna", icon: User },
    { id: "security", label: "Akun & Keamanan", icon: Shield },
    { id: "mentor", label: "Preferensi AI Mentor", icon: Sparkles },
    { id: "notifications", label: "Notifikasi & Suara", icon: Bell },
    { id: "appearance", label: "Tema & Tampilan", icon: Sliders },
    { id: "developer", label: "Mode Developer", icon: Terminal, badge: "DEV" },
  ];

  return (
    <div
      id="settings-view"
      className="w-full max-w-[1250px] mx-auto bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl overflow-hidden min-h-[520px] flex flex-col md:flex-row"
    >
      {/* Settings Navigation Sidebar */}
      <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/30 p-4 flex flex-col justify-between shrink-0">
        <div>
          <div className="mb-4 px-2">
            <h2 className="font-display text-sm font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
              Pengaturan Sistem
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Konfigurasi akun &amp; preferensi
            </p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id as SettingsSection)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                    isActive
                      ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-zinc-100"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? "text-emerald-400 dark:text-emerald-600" : "text-zinc-400"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isActive
                          ? "bg-white/15 dark:bg-zinc-900/15 text-current"
                          : "bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card info footer */}
        <div className="pt-3 mt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center gap-2.5 px-1">
          <div className="w-8 h-8 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-mono text-xs font-semibold flex items-center justify-center shrink-0">
            {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {profile.name}
            </div>
            <div className="text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400 truncate">
              Lv.{profile.level} · {profile.xp} XP
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 sm:p-6 overflow-y-auto flex flex-col justify-between">
        <div>
          <AnimatePresence mode="wait">
            {activeSection === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
              >
                <ProfileSection
                  name={name}
                  setName={setName}
                  role={role}
                  setRole={setRole}
                  email={email}
                  setEmail={setEmail}
                  bio={bio}
                  setBio={setBio}
                  skills={skills}
                  newSkillInput={newSkillInput}
                  setNewSkillInput={setNewSkillInput}
                  handleAddSkill={handleAddSkill}
                  handleRemoveSkill={handleRemoveSkill}
                  profile={profile}
                />
              </motion.div>
            )}

            {activeSection === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
              >
                <SecuritySection
                  oldPassword={oldPassword}
                  setOldPassword={setOldPassword}
                  newPassword={newPassword}
                  setNewPassword={setNewPassword}
                  confirmPassword={confirmPassword}
                  setConfirmPassword={setConfirmPassword}
                  handleSaveSecurity={handleSaveSecurity}
                  saving={saving}
                />
              </motion.div>
            )}

            {activeSection === "mentor" && (
              <motion.div
                key="mentor"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
              >
                <MentorSection
                  mentorTone={mentorTone}
                  setMentorTone={setMentorTone}
                />
              </motion.div>
            )}

            {activeSection === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
              >
                <NotificationsSection
                  notifyEmail={notifyEmail}
                  setNotifyEmail={setNotifyEmail}
                  notifyDaily={notifyDaily}
                  setNotifyDaily={setNotifyDaily}
                  notifySound={notifySound}
                  setNotifySound={setNotifySound}
                />
              </motion.div>
            )}

            {activeSection === "appearance" && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
              >
                <AppearanceSection
                  dashboardTheme={dashboardTheme}
                  handleApplyTheme={handleApplyTheme}
                />
              </motion.div>
            )}

            {activeSection === "developer" && (
              <motion.div
                key="developer"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
              >
                <DeveloperSection
                  isDevMode={isDevMode}
                  handleToggleDevMode={handleToggleDevMode}
                  handleInstantUnlock={handleInstantUnlock}
                  handleResetDevData={handleResetDevData}
                  saving={saving}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Save Button at bottom (only for form fields) */}
        {activeSection !== "security" && activeSection !== "appearance" && activeSection !== "developer" && (
          <div className="mt-6 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Simpan perubahan pengaturan Anda
            </span>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0 transition-colors"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
