import { useState } from "react";
import { apiClient, userApi } from "../api/apiClient";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Lock,
  User,
  Briefcase,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Check,
} from "lucide-react";
import { Profile } from "../types";
import { SkilloraLogo } from "./SkilloraLogo";
import { auth, googleAuthProvider } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from "firebase/auth";

interface LoginViewProps {
  onLoginSuccess: (profile: Profile) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export function LoginView({ onLoginSuccess, showToast }: LoginViewProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register Form State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("Pelajar Siap Kerja");

  const handleSkilloraLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage("Silakan isi email dan kata sandi Anda.");
      return;
    }

    if (loginEmail === "guest@skillora.app" && loginPassword === "password123") {
      return handleGuestLogin();
    }

    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      await result.user.getIdToken();

      const data = await apiClient.post("/auth/sync", {
        name: result.user.displayName || "User",
        email: result.user.email,
        uid: result.user.uid,
      });

      if (data.profile) {
        showToast("Selamat datang kembali.", "success");
        localStorage.setItem("skillora_logged_in", "true");
        onLoginSuccess(data.profile);
      } else {
        setErrorMessage(data.error || "Gagal sinkronisasi data akun.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Email atau kata sandi tidak cocok.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkilloraRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!regName.trim()) {
      setErrorMessage("Nama lengkap wajib diisi.");
      return;
    }
    if (!regEmail.trim() || !regEmail.includes("@")) {
      setErrorMessage("Format alamat email tidak valid.");
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMessage("Kata sandi minimal 6 karakter.");
      return;
    }

    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      await updateProfile(result.user, { displayName: regName });
      await result.user.getIdToken();

      const data = await apiClient.post("/auth/sync", {
        name: regName,
        email: result.user.email,
        uid: result.user.uid,
      });

      if (data.profile) {
        showToast(`Akun berhasil dibuat. Selamat datang, ${regName}.`, "success");
        localStorage.setItem("skillora_logged_in", "true");
        onLoginSuccess(data.profile);
      } else {
        setErrorMessage(data.error || "Gagal membuat akun baru.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Gagal mendaftarkan akun. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      await result.user.getIdToken();

      const data = await apiClient.post("/auth/sync", {
        name: result.user.displayName,
        email: result.user.email,
        uid: result.user.uid,
      });
      if (data.profile) {
        showToast(`Selamat datang, ${data.profile.name}.`, "success");
        localStorage.setItem("skillora_logged_in", "true");
        onLoginSuccess(data.profile);
      } else {
        setErrorMessage(data.error || "Gagal masuk dengan Google.");
      }
    } catch (err) {
      console.error(err);
      showToast("Autentikasi Google tidak tersedia saat ini. Gunakan mode demo.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      localStorage.setItem("skillora_guest_mode", "true");
      const profile = await userApi.getProfile();
      if (profile) {
        showToast(`Masuk sebagai ${profile.name} (Mode Demo).`, "success");
        localStorage.setItem("skillora_logged_in", "true");
        onLoginSuccess(profile);
      } else {
        localStorage.removeItem("skillora_guest_mode");
        setErrorMessage("Gagal memuat sesi demo.");
      }
    } catch (err: any) {
      localStorage.removeItem("skillora_guest_mode");
      setErrorMessage(err?.message || "Gagal masuk ke mode demo.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setActiveTab("login");
    setErrorMessage("");
    setLoginEmail("guest@skillora.app");
    setLoginPassword("password123");
  };

  return (
    <div className="min-h-[100dvh] bg-[#fafafa] dark:bg-[#09090b] text-zinc-950 dark:text-zinc-50 grid grid-cols-1 lg:grid-cols-12 transition-colors">
      {/* LEFT PANEL: Editorial Brand & Product Proof (Desktop) */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-10 xl:p-14 border-r border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#0e0e11] relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <SkilloraLogo variant="full" size="md" />
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Platform Kompetensi &amp; Karier
          </span>
        </div>

        <div className="relative z-10 max-w-xl my-auto py-8 space-y-8">
          <div className="space-y-4">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Ruang belajar terstruktur hingga penempatan kerja
            </p>
            <h1 className="font-display text-3xl xl:text-[42px] font-bold tracking-tight text-zinc-950 dark:text-zinc-50 leading-[1.12] text-balance">
              Bangun keahlian terukur, melangkah pasti menuju karier industri.
            </h1>
            <p className="text-[15px] text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-lg">
              Dari kurikulum terpandu, lab praktik kode dan studi kasus BUMN, hingga CV ATS dan bursa lowongan mitra — seluruh alur persiapan karier dalam satu ruang kerja tenang.
            </p>
          </div>

          {/* Editorial Campus Frame */}
          <div className="rounded-xl overflow-hidden border border-zinc-200/90 dark:border-zinc-800 relative aspect-[16/9] bg-zinc-100 dark:bg-zinc-900">
            {!heroImgFailed ? (
              <img
                src="/src/assets/images/hero_skillora_campus_1794974023605.jpg"
                alt="Suasana ruang kolaborasi dan pembelajaran profesional Skillora"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-100 via-zinc-50 to-emerald-50/40 dark:from-zinc-900 dark:via-zinc-950 dark:to-emerald-950/30 flex items-center justify-center p-6">
                <SkilloraLogo variant="full" size="lg" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-5 flex items-end justify-between gap-4 text-white">
              <div className="space-y-0.5">
                <p className="text-xs text-zinc-300">Kurikulum Berbasis Portofolio</p>
                <p className="font-display text-sm font-semibold">
                  Jalur Software, AI/Data, Produk &amp; Seleksi BUMN
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-emerald-300 shrink-0">
                100% Akses Inti
              </span>
            </div>
          </div>

          {/* Quantified Proof Strip (Hairline Divided) */}
          <div className="grid grid-cols-3 gap-6 pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
            <div>
              <p className="font-display text-xl font-bold text-zinc-950 dark:text-white tabular-nums">
                4 Jalur
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Kurikulum siap kerja
              </p>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-zinc-950 dark:text-white tabular-nums">
                AI Rubrik
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Audit kode &amp; CV ATS
              </p>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-zinc-950 dark:text-white tabular-nums">
                QR Verify
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Sertifikat &amp; portofolio
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500">
          <span>© {new Date().getFullYear()} Skillora Indonesia</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
            Autentikasi terenkripsi
          </span>
        </div>
      </div>

      {/* RIGHT PANEL: Clean Authentication Form */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center items-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[400px] space-y-6">
          {/* Mobile Brand Header */}
          <div className="lg:hidden flex flex-col items-start space-y-2 pb-2">
            <SkilloraLogo variant="full" size="md" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Navigasi kompetensi &amp; akselerator karier industri
            </p>
          </div>

          <div className="space-y-1.5">
            <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              {activeTab === "login" ? "Masuk ke ruang belajar" : "Buat akun Skillora"}
            </h2>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
              {activeTab === "login"
                ? "Lanjutkan progres modul, lab praktik, dan lamaran karier Anda."
                : "Mulai bangun portofolio keahlian dan sertifikasi terverifikasi."}
            </p>
          </div>

          {/* Segmented Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200/80 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setErrorMessage("");
              }}
              className={`py-2 px-3 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
                activeTab === "login"
                  ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold shadow-[0_1px_2px_rgba(9,9,11,0.06)]"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setErrorMessage("");
              }}
              className={`py-2 px-3 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
                activeTab === "register"
                  ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold shadow-[0_1px_2px_rgba(9,9,11,0.06)]"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Daftar Baru
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* Auth Card Surface */}
          <div className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800 rounded-xl p-6 space-y-5">
            <AnimatePresence mode="wait">
              {activeTab === "login" ? (
                <motion.form
                  key="login-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.14 }}
                  onSubmit={handleSkilloraLogin}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label
                      htmlFor="login-email"
                      className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Alamat email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="nama@email.com"
                        required
                        className="w-full h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-emerald-600 dark:focus:border-emerald-500 rounded-lg pl-9 pr-3 text-sm text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="login-password"
                        className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        Kata sandi
                      </label>
                      <button
                        type="button"
                        onClick={fillDemoAccount}
                        className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Isi kredensial demo
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Masukkan kata sandi"
                        required
                        className="w-full h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-emerald-600 dark:focus:border-emerald-500 rounded-lg pl-9 pr-10 text-sm text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Masuk</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="register-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.14 }}
                  onSubmit={handleSkilloraRegister}
                  className="space-y-3.5"
                >
                  <div className="space-y-1.5">
                    <label
                      htmlFor="reg-name"
                      className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Nama lengkap
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        id="reg-name"
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        required
                        className="w-full h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-emerald-600 dark:focus:border-emerald-500 rounded-lg pl-9 pr-3 text-sm text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="reg-email"
                      className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Alamat email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        id="reg-email"
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="budi@email.com"
                        required
                        className="w-full h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-emerald-600 dark:focus:border-emerald-500 rounded-lg pl-9 pr-3 text-sm text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="reg-password"
                      className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Kata sandi (minimal 6 karakter)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        id="reg-password"
                        type={showPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Buat kata sandi aman"
                        required
                        minLength={6}
                        className="w-full h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-emerald-600 dark:focus:border-emerald-500 rounded-lg pl-9 pr-10 text-sm text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="reg-role"
                      className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Target karier saat ini
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      <select
                        id="reg-role"
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value)}
                        className="w-full h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-emerald-600 dark:focus:border-emerald-500 rounded-lg pl-9 pr-3 text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none transition-colors appearance-none cursor-pointer"
                      >
                        <option value="Pelajar Siap Kerja">Pelajar / Siswa (Siap Kerja)</option>
                        <option value="Mahasiswa Tech">Mahasiswa / Student</option>
                        <option value="Job Seeker">Pencari Kerja / Fresh Graduate</option>
                        <option value="Profesional">Profesional (Switch Career)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Buat akun</span>
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Hairline Divider */}
            <div className="relative flex items-center py-1">
              <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800" />
              <span className="px-3 text-xs text-zinc-400 dark:text-zinc-500">atau</span>
              <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800" />
            </div>

            {/* Alternative Access */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-10 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-800 dark:text-zinc-100 font-medium text-[13px] px-4 rounded-lg transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Lanjutkan dengan Google</span>
              </button>

              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={loading}
                className="w-full h-10 border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-950/60 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium text-[13px] px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Masuk dengan Akun Demo</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-zinc-500 dark:text-zinc-500">
            Akses modul inti, lab praktik, dan sertifikasi tersedia gratis bagi pelajar Indonesia.
          </p>
        </div>
      </div>
    </div>
  );
}
