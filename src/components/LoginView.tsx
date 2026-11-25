import { useState } from "react";
import { apiClient, userApi } from "../api/apiClient";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, User, Briefcase, Eye, EyeOff, ShieldCheck, Sparkles, ArrowRight, UserPlus, LogIn, CheckCircle2 } from "lucide-react";
import { Profile } from "../types";
import { SkilloraLogo } from "./SkilloraLogo";
import { auth, googleAuthProvider } from "../lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signInWithPopup 
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
      const token = await result.user.getIdToken();
      
      const data = await apiClient.post("/auth/sync", { name: result.user.displayName || "User", email: result.user.email, uid: result.user.uid });

      if (data.profile) {
        showToast(`Selamat datang kembali!`, "success");
        localStorage.setItem("skillora_logged_in", "true");
        onLoginSuccess(data.profile);
      } else {
        setErrorMessage(data.error || "Gagal sinkronisasi data.");
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
      setErrorMessage("Email tidak valid.");
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
      const token = await result.user.getIdToken();
      
      const data = await apiClient.post("/auth/sync", { name: regName, email: result.user.email, uid: result.user.uid });

      if (data.profile) {
        showToast(`Akun Skillora berhasil dibuat! Selamat datang, ${regName}!`, "success");
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
      const token = await result.user.getIdToken();
      
      const data = await apiClient.post("/auth/sync", { name: result.user.displayName, email: result.user.email, uid: result.user.uid });
      if (data.profile) {
        showToast(`Selamat datang, ${data.profile.name}!`, "success");
        localStorage.setItem("skillora_logged_in", "true");
                onLoginSuccess(data.profile);
      } else {
        setErrorMessage(data.error || "Gagal masuk dengan Google");
      }
    } catch (err) {
      console.error(err);
      // Fallback Google auth if popups are blocked or unconfigured
      showToast("Gagal masuk mode demo", "error");
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
        showToast(`Selamat datang di mode demo, ${profile.name}!`, "success");
        localStorage.setItem("skillora_logged_in", "true");
        onLoginSuccess(profile);
      } else {
        localStorage.removeItem("skillora_guest_mode");
        setErrorMessage("Gagal masuk mode demo");
      }
    } catch (err: any) {
      localStorage.removeItem("skillora_guest_mode");
      setErrorMessage(err?.message || "Gagal masuk mode demo");
    } finally {
      setLoading(false);
    }
  };
  const fillDemoAccount = () => {
    setLoginEmail("guest@skillora.app");
    setLoginPassword("password123");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 py-8 overflow-y-auto relative selection:bg-blue-500/30">
      
      <div className="w-full max-w-sm relative z-10 my-auto">
        {/* Logo & Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 flex flex-col items-center justify-center"
        >
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 mb-4">
            <SkilloraLogo variant="full" size="xl" darkMode={true} />
          </div>
          <p className="text-slate-400 font-medium text-sm">Platform Belajar & Karier Digital</p>
        </motion.div>

        {/* Main Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative"
        >

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-8">
            <button
              type="button"
              onClick={() => { setActiveTab("login"); setErrorMessage(""); }}
              className={`py-2 px-3 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "login"
                  ? "bg-slate-800 text-white shadow-xs border border-slate-700"
                  : "text-slate-500 hover:text-slate-300 border border-transparent"
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("register"); setErrorMessage(""); }}
              className={`py-2 px-3 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "register"
                  ? "bg-slate-800 text-white shadow-xs border border-slate-700"
                  : "text-slate-500 hover:text-slate-300 border border-transparent"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar</span>
            </button>
          </div>

          {/* Error Alert Box */}
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-semibold flex items-start gap-2"
            >
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{errorMessage}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === "login" ? (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSkilloraLogin}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Email Akun Skillora
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input aria-label="Input field"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="nama@email.com"
                      required
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      onClick={fillDemoAccount}
                      className="text-xs font-bold text-blue-400 hover:underline cursor-pointer"
                    >
                      ⚡ Isi Akun Demo
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input aria-label="Input field"
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Masuk ke Akun Skillora</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="register-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleSkilloraRegister}
                className="space-y-3.5"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input aria-label="Input field"
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      required
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input aria-label="Input field"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="budi@email.com"
                      required
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Kata Sandi (Min 6 Karakter)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input aria-label="Input field"
                      type={showPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Buat kata sandi aman"
                      required
                      minLength={6}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Status / Target Karier
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <select aria-label="Input field"
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none transition-all appearance-none cursor-pointer"
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
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Buat Akun Skillora Baru</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <span className="relative bg-slate-900 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Atau Metode Masuk Lainnya
            </span>
          </div>

          {/* Social / Quick Action Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full border border-slate-700/80 bg-slate-800/80 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Lanjutkan dengan Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleGuestLogin()}
              disabled={loading}
              className="w-full border border-slate-800 bg-slate-950/50 hover:bg-slate-950 text-slate-300 hover:text-white font-medium text-xs sm:text-sm py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Akses Cepat Mode Demo / Tamu</span>
            </button>
          </div>

          {/* Footer Security Badges */}
          <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-center gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Enkripsi Aman</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-blue-400" /> Gratis Akses Inti</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
