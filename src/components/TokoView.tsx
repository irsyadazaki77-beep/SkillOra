import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, billingApi } from "../api/apiClient";
import { Gem, Award, Sparkles, Shield, RefreshCw, ShoppingBag, Coins, Calculator, Calendar, CheckCircle, Gift, Zap, Swords, ArrowUpRight } from "lucide-react";
import { Profile, WalletLedgerEntry } from "../types";
import { ROUTES } from "../routes";
import { motion, AnimatePresence } from "motion/react";
import { playSound } from "../utils/sound";

interface TokoViewProps {
  profile: Profile;
  setProfile?: (p: Profile) => void;
  handleClaimDaily: () => void;
  handleBuyItem: (itemId: string) => void;
  handleSetAvatar: (avatar: string) => void;
  handleGetFlashChallenge: () => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

export function TokoView({
  profile,
  setProfile,
  handleClaimDaily,
  handleBuyItem,
  handleSetAvatar,
  handleGetFlashChallenge,
  showToast,
}: TokoViewProps) {
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split("T")[0];
  const isDailyClaimed = profile.dailyClaimedLast === todayStr;
  const [ledgerEntries, setLedgerEntries] = useState<WalletLedgerEntry[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingLedger(true);
    billingApi
      .getHistory()
      .then((res) => {
        if (active) setLedgerEntries(res?.ledger || []);
      })
      .catch(() => {
        if (active) setLedgerEntries([]);
      })
      .finally(() => {
        if (active) setLoadingLedger(false);
      });
    return () => {
      active = false;
    };
  }, [profile.gems, profile.certCredits]);

  // Spin Wheel game state
  const [spinning, setSpinning] = useState<boolean>(false);
  const [spinResult, setSpinResult] = useState<{ prize: string; type: "gems" | "xp" | "none"; amount: number } | null>(null);
  const [wheelRotation, setWheelRotation] = useState<number>(0);

  // Gem to XP converter state
  const [gemConvertAmount, setGemConvertAmount] = useState<number>(20);

  // Purchase verification modal state
  const [selectedPurchaseItem, setSelectedPurchaseItem] = useState<{ id: string; name: string; emoji: string; price: number } | null>(null);
  
  // XP & Gems Info guide state
  const [showGamificationGuide, setShowGamificationGuide] = useState<boolean>(false);

  // Streak Repair loading state
  const [repairingStreak, setRepairingStreak] = useState<boolean>(false);

  const handleRepairStreakAction = async () => {
    if (profile.gems < 80) {
      playSound("wrong");
      if (showToast) showToast("Gems Anda tidak mencukupi! Diperlukan 80 Gems.", "error");
      return;
    }

    try {
      setRepairingStreak(true);
      const data = await apiClient.post("/user/profile/repair-streak");
      if (data && data.profile) {
        playSound("claim");
        if (setProfile) setProfile(data.profile);
        if (showToast) showToast(`🔥 Hore! Streak ${data.profile.streak} Hari Anda berhasil dipulihkan!`, "success");
      } else {
        if (showToast) showToast("Gagal memulihkan streak", "error");
      }
    } catch (err: any) {
      if (showToast) showToast(err.message, "error");
    } finally {
      setRepairingStreak(false);
    }
  };

  // Static list of avatar options to showcase
  const allAvailableAvatars = [
    { emoji: "🦁", name: "Singa Lead Dev (Default)", unlocked: true },
    { emoji: "🦉", name: "Duo sang AI Owl", unlocked: profile.unlockedAvatars?.includes("🦉") },
    { emoji: "🚀", name: "Kosmonot Developer", unlocked: profile.unlockedAvatars?.includes("🚀") },
    { emoji: "🐱", name: "Kucing Senior Git", unlocked: profile.unlockedAvatars?.includes("🐱") || profile.purchasedItems?.includes("avatar-cat") },
    { emoji: "🐼", name: "Panda Scrum Master", unlocked: profile.unlockedAvatars?.includes("🐼") || profile.purchasedItems?.includes("avatar-panda") },
  ];

  // Shop Items list
  const shopItems = [
    {
      id: "refill-hearts",
      name: "Isi Ulang 5 Nyawa",
      emoji: "❤️",
      description: "Kembalikan nyawa kuis Anda menjadi penuh agar bebas bereksperimen di kuis interaktif.",
      price: 50,
      purchased: false,
    },
    {
      id: "streak-freeze",
      name: "Streak Freeze (Pengaman)",
      emoji: "❄️",
      description: "Melindungi streak harian Anda agar tidak terputus jika melewatkan belajar dalam sehari.",
      price: 100,
      purchased: profile.purchasedItems?.includes("streak-freeze"),
    },
    {
      id: "xp-booster",
      name: "XP Booster 2x (30 Menit)",
      emoji: "⚡",
      description: "Dapatkan poin pengalaman ganda dari setiap kuis yang Anda selesaikan selama 30 menit.",
      price: 150,
      purchased: !!profile.activeBoosterUntil && profile.activeBoosterUntil > Date.now(),
    },
    {
      id: "gold-cert",
      name: "Sertifikat Emas Premium",
      emoji: "👑",
      description: "Terapkan dekorasi bingkai emas mewah pada seluruh sertifikat terverifikasi Anda.",
      price: 200,
      purchased: profile.purchasedItems?.includes("gold-cert"),
    },
    {
      id: "mystery-box",
      name: "Mystery Box Epik",
      emoji: "",
      description: "Gacha kotak misteri! Bisa berisi XP Booster, Gems melimpah, atau Avatar rahasia.",
      price: 250,
      purchased: false,
    },
    {
      id: "merch-hoodie",
      name: "Hoodie Eksklusif Skillora (Fisik)",
      emoji: "🧥",
      description: "Dapatkan hoodie katun premium hitam bertuliskan logo bordir Skillora. Dikirim gratis ke rumah Anda!",
      price: 600,
      purchased: false,
      isMerch: true,
    },
    {
      id: "merch-stickers",
      name: "Paket Stiker Programmer",
      emoji: "🖼️",
      description: "Dekorasi laptop tangguh Anda dengan 10 buah stiker anti-air laminasi glossy berkualitas tinggi.",
      price: 150,
      purchased: false,
      isMerch: true,
    },
  ];

  const handleSpinWheel = () => {
    if (spinning) return;
    playSound("laser");
    setSpinning(true);
    setSpinResult(null);

    // Calculate a large random rotation (at least 5 spins + random offset)
    const randomSpins = 5 + Math.floor(Math.random() * 5);
    const randomDegrees = Math.floor(Math.random() * 360);
    const targetRotation = wheelRotation + randomSpins * 360 + randomDegrees;
    setWheelRotation(targetRotation);

    setTimeout(() => {
      // Determine prize based on final degrees modulo 360
      const prizes: { prize: string; type: "gems" | "xp" | "none"; amount: number }[] = [
        { prize: "Bonus 30 Gems! ", type: "gems", amount: 30 },
        { prize: "+100 XP Instan! ⚡", type: "xp", amount: 100 },
        { prize: "Bonus 15 Gems! ", type: "gems", amount: 15 },
        { prize: "+50 XP Booster! ⚡", type: "xp", amount: 50 },
      ];

      const wonPrize = prizes[Math.floor(Math.random() * prizes.length)];
      setSpinResult(wonPrize);
      setSpinning(false);
      playSound("success");

      // Apply actual rewards to profile state
      if (setProfile) {
        let updatedProfile = { ...profile };
        if (wonPrize.type === "gems") {
          updatedProfile.gems += wonPrize.amount;
        } else if (wonPrize.type === "xp") {
          updatedProfile.xp += wonPrize.amount;
        }
        setProfile(updatedProfile);
      }

      if (showToast) {
        showToast(`Selamat! Anda memenangkan ${wonPrize.prize}`, "success");
      }
    }, 1600);
  };

  const handleBuyButtonClick = (item: { id: string; name: string; emoji: string; price: number }) => {
    playSound("click");
    setSelectedPurchaseItem(item);
  };

  const confirmPurchase = () => {
    if (selectedPurchaseItem) {
      if (profile.gems < selectedPurchaseItem.price) {
        playSound("wrong");
        if (showToast) showToast("Gems tidak mencukupi untuk membeli item ini!", "error");
        setSelectedPurchaseItem(null);
        return;
      }

      // Play purchase chime
      playSound("claim");
      handleBuyItem(selectedPurchaseItem.id);
      setSelectedPurchaseItem(null);
    }
  };

  const handleConvertGemsToXp = () => {
    if (profile.gems < gemConvertAmount) {
      playSound("wrong");
      if (showToast) showToast("Saldo Gems Anda tidak mencukupi!", "error");
      return;
    }

    playSound("success");
    const xpGained = gemConvertAmount * 3;
    
    if (setProfile) {
      setProfile({
        ...profile,
        gems: profile.gems - gemConvertAmount,
        xp: profile.xp + xpGained
      });
    }

    if (showToast) {
      showToast(`Berhasil menukarkan ${gemConvertAmount} Gems menjadi ${xpGained} XP! ⚡`, "success");
    }
  };

  const handleSelectAvatarSkin = (emoji: string) => {
    playSound("correct");
    handleSetAvatar(emoji);
    if (showToast) showToast(`Avatar berhasil diubah menjadi ${emoji}!`, "success");
  };

  return (
    <div id="view-toko" className="space-y-6">
      
      {/* Gamification Purpose Header Banner & Guide Toggle */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/10 shadow-lg relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <span className="text-xs font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-md border border-cyan-800">
            ⚡ Panduan Gamifikasi & Ekonomi Platform
          </span>
          <h2 className="text-xl md:text-2xl font-black text-white">Fungsi Nyata XP & Gems</h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Pahami bagaimana <strong>XP (Experience Points)</strong> menentukan Level & Peringkat Mingguan Anda, serta bagaimana <strong>Gems 💎</strong> dapat dibelanjakan untuk Streak Freeze, 2x XP Booster, & Nyawa Kuis.
          </p>
        </div>

        <button
          onClick={() => {
            playSound("click");
            setShowGamificationGuide(true);
          }}
          className="bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs px-5 py-3 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-cyan-600" />
          <span>Lihat Panduan Ekonomi XP & Gems</span>
        </button>
      </div>

      {/* Emergency Streak Repair Banner if Streak Was Broken */}
      {profile.canRepairStreak && (
        <div className="bg-rose-500/10 border-2 border-rose-500/80 rounded-3xl p-5 text-slate-900 dark:text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md bg-white dark:bg-slate-900">
          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-widest text-rose-600 bg-rose-100 dark:bg-rose-950/80 px-2.5 py-1 rounded-md border border-rose-300">
              🚨 Darurat Streak Terputus
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Pulihkan Streak {profile.lostStreakCount || 5} Hari Anda!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg">
              Streak Anda sempat terputus karena absen kemarin. Anda memiliki waktu terbatas untuk memulihkannya menggunakan <strong>80 Gems</strong>!
            </p>
          </div>

          <button
            onClick={handleRepairStreakAction}
            disabled={repairingStreak}
            className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-6 py-3.5 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-2 disabled:opacity-50"
          >
            <Shield className="w-4 h-4" />
            <span>{repairingStreak ? "Memproses..." : "Pulihkan Streak (80 Gems)"}</span>
          </button>
        </div>
      )}

      {/* Upper Grid: Daily Checkin and Avatar Customizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        
        {/* Daily Reward Desk */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-lg p-4 md:p-3 border border-white/5 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] flex flex-col justify-between space-y-5 text-white relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300 cursor-pointer">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-500 ease-out -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[60px] group-hover:scale-105 transition-transform duration-500"></div>
          
          <div className="space-y-3 relative z-10">
            <span className="text-base bg-white/5 backdrop-blur-md text-indigo-300 font-black px-3 py-2 rounded-xl uppercase tracking-widest border border-white/10 shadow-sm flex items-center gap-2 w-fit">
              <Gift className="w-4 h-4 text-indigo-400" /> Bonus Harian Elite
            </span>
            <h3 className="font-display text-base md:text-4xl font-black tracking-tight drop-shadow-sm text-white">Klaim Hadiah</h3>
            <p className="text-base text-slate-400 font-medium leading-relaxed max-w-[250px]">
              Masuk setiap hari untuk mendapatkan bonus penunjang XP & Gems harian premium secara instan.
            </p>
          </div>

          <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-[1.5rem] p-3 flex justify-between items-center text-center relative z-10 shadow-inner mt-4">
            <div className="w-1/2">
              <span className="text-base font-black text-indigo-300/70 block uppercase tracking-widest mb-1">Bonus XP</span>
              <span className="font-display text-base font-black text-emerald-400 drop-shadow-sm">+100 XP</span>
            </div>
            <div className="border-l-2 border-white/5 pl-4 w-1/2">
              <span className="text-base font-black text-indigo-300/70 block uppercase tracking-widest mb-1">Bonus Gems</span>
              <span className="font-display text-base font-black text-cyan-400 drop-shadow-sm">+10 Gems</span>
            </div>
          </div>

          <button
            onClick={() => {
              playSound("claim");
              handleClaimDaily();
            }}
            disabled={isDailyClaimed}
            className={`w-full font-sans text-base font-bold py-2 px-4 rounded-lg transition-all relative z-10 shadow-sm ${
              isDailyClaimed
                ? "bg-white/5 border border-white/5 text-slate-500 cursor-not-allowed backdrop-blur-sm"
                : "bg-white text-slate-900 hover:bg-slate-50 hover:scale-100 hover:shadow-[0_15px_35px_-5px_rgba(255,255,255,0.2)] active:scale-95 cursor-pointer"
            }`}
          >
            {isDailyClaimed ? "✓ Sudah Diklaim Hari Ini" : "Klaim Hadiah Gratis!"}
          </button>
        </div>

        {/* Dynamic Avatar Customizer Wallet */}
        <div className="bg-white rounded-[2rem] p-4 md:p-3 border border-slate-200/60 shadow-sm hover:shadow-sm transition-shadow lg:col-span-2 space-y-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[60px] -z-10 group-hover:scale-105 transition-transform duration-300"></div>
          <div>
            <h3 className="font-display text-base md:text-base font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
              🦁 Kustomisasi Karakter Avatar
            </h3>
            <p className="text-base text-slate-500 font-medium leading-relaxed mt-2 max-w-lg">
              Gunakan Gems Anda untuk membuka karakter lucu di Toko, lalu pilih avatar aktif di bawah ini untuk merubah gambar profil Anda pada papan klasemen global!
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {allAvailableAvatars.map((av, idx) => {
              const isActive = profile.selectedAvatar === av.emoji;
              return (
                <button
                  key={idx}
                  onClick={() => av.unlocked && handleSelectAvatarSkin(av.emoji)}
                  disabled={!av.unlocked}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 relative ${
                    isActive
                      ? "bg-blue-50 border-blue-500 text-blue-900 shadow-sm scale-105 z-10 ring-4 ring-blue-500/20"
                      : av.unlocked
                      ? "bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm text-slate-700 cursor-pointer hover:-translate-y-1"
                      : "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed opacity-70"
                  }`}
                >
                  <span className="text-4xl drop-shadow-sm">{av.emoji}</span>
                  <span className="text-base font-black text-center truncate w-full">{av.name.split(" ")[0]}</span>
                  {!av.unlocked && (
                    <span className="absolute top-2 right-2 text-base bg-slate-200 w-6 h-6 flex items-center justify-center rounded-full shadow-inner">🔒</span>
                  )}
                  {isActive && (
                    <span className="absolute -top-2 -right-2 text-white bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center border-2 border-white text-base font-bold shadow-sm">✓</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-base text-slate-500 font-medium bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-2">
            <span className="bg-white text-base p-2 rounded-lg border border-slate-200 shadow-sm">{profile.selectedAvatar || "🦁"}</span>
            <span>Avatar aktif Anda saat ini akan ditampilkan di leaderboard secara global.</span>
          </div>
        </div>

      </div>

      {/* Spin Wheel Game & Gem Converter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        
        {/* Spin Wheel Game Card */}
        <div className="bg-white rounded-[2rem] p-4 md:p-3 border border-slate-200/60 shadow-sm hover:shadow-sm transition-shadow flex flex-col justify-between space-y-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-[60px] -z-10 group-hover:scale-105 transition-transform duration-300"></div>
          <div>
            <h4 className="font-display text-base font-black text-slate-800 flex items-center gap-2 uppercase tracking-wide">
              🎯 Roda Keberuntungan Harian
            </h4>
            <p className="text-base text-slate-500 font-medium leading-relaxed mt-2">
              Putar roda sekali sehari untuk mendapatkan tumpukan gems atau booster kuis gratis!
            </p>
          </div>

          <div className="flex flex-col items-center justify-center py-2 relative">
            <motion.div
              style={{ originX: 0.5, originY: 0.5 }}
              animate={{ rotate: wheelRotation }}
              transition={{ type: "spring", stiffness: 40, damping: 12, mass: 1 }}
              className="w-32 h-32 rounded-full border-[6px] border-slate-800 bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 flex items-center justify-center text-4xl shadow-sm relative"
            >
              {/* Internal Dividers for realistic wheel layout */}
              <div className="absolute inset-0 border-t-2 border-dashed border-white/30 rounded-full rotate-45" />
              <div className="absolute inset-0 border-t-2 border-dashed border-white/30 rounded-full rotate-90" />
              <span className="relative z-10 drop-shadow-sm"></span>
            </motion.div>
            
            {/* Pointer Pin indicator */}
            <div className="absolute top-2 w-4 h-5 bg-slate-900 border-2 border-white rounded-b-full shadow-sm z-20" />

            {spinResult && (
              <motion.p
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-3 text-base font-black text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 shadow-sm"
              >
                🎉 Hasil: {spinResult.prize}
              </motion.p>
            )}
          </div>

          <button
            onClick={handleSpinWheel}
            disabled={spinning}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-sans text-base font-black py-2 rounded-xl border border-slate-700 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.3)] transition-all active:scale-95 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
          >
            {spinning ? "Memutar Roda..." : "Putar Roda Harian!"}
          </button>
        </div>

        {/* Gem converter calculator widget */}
        <div className="bg-white rounded-[2rem] p-4 md:p-3 border border-slate-200/60 shadow-sm hover:shadow-sm transition-shadow flex flex-col justify-between space-y-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[60px] -z-10 group-hover:scale-105 transition-transform duration-300"></div>
          <div>
            <h4 className="font-display text-base font-black text-slate-800 flex items-center gap-2 uppercase tracking-wide">
              <Calculator className="w-4 h-4 text-cyan-600" /> Konversi Gems-ke-XP
            </h4>
            <p className="text-base text-slate-500 font-medium leading-relaxed mt-2 max-w-sm">
              Tukar kelebihan saldo Gems Anda untuk dikonversikan menjadi XP tambahan secara kilat guna menaikkan peringkat Anda.
            </p>
          </div>

          <div className="space-y-5 py-2">
            <div>
              <label className="block text-base font-black text-slate-400 uppercase tracking-widest mb-3">Geser Jumlah Gems yang Ingin Ditukar:</label>
              <input aria-label="Input field"
                type="range"
                min="10"
                max="100"
                step="10"
                value={gemConvertAmount}
                onChange={(e) => {
                  playSound("click");
                  setGemConvertAmount(parseInt(e.target.value));
                }}
                className="w-full accent-cyan-600 h-2.5 bg-slate-100 rounded-full cursor-pointer shadow-inner"
              />
              <div className="flex justify-between text-base text-slate-400 font-bold mt-2 px-1">
                <span>10 Gems</span>
                <span>100 Gems</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-lg text-center space-y-2 shadow-inner">
              <span className="text-base font-black text-slate-400 block uppercase tracking-widest">Estimasi Hasil Konversi</span>
              <div className="text-base font-display font-black text-slate-800 mt-1 flex items-center justify-center gap-2">
                <span className="text-cyan-700 bg-cyan-50 px-3 py-1.5 rounded-lg border border-cyan-200 shadow-sm">{gemConvertAmount} Gems</span> 
                <span className="text-slate-300">→</span> 
                <span className="text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm">{gemConvertAmount * 3} XP Instan</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleConvertGemsToXp}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-sans text-base font-bold py-2 rounded-xl shadow-[0_10px_25px_-5px_rgba(8,145,178,0.2)] hover:shadow-[0_15px_35px_-5px_rgba(8,145,178,0.3)] transition-all active:scale-95 cursor-pointer"
          >
            Tukarkan Sekarang
          </button>
        </div>

      </div>

      {/* Coins wallet & Ledger transaction statements */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
            <Coins className="w-4 h-4 text-amber-500" /> Buku Kas & Transaksi Dompet Gems
          </h4>
          <button
            type="button"
            onClick={() => navigate(ROUTES.upgrade)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Top-Up Gems & Pro</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs uppercase font-bold tracking-wider">
                <th className="pb-3 px-2">Waktu</th>
                <th className="pb-3 px-2">Deskripsi Transaksi</th>
                <th className="pb-3 px-2">Dompet</th>
                <th className="pb-3 px-2 text-right">Nominal</th>
                <th className="pb-3 px-2 text-right">Saldo Akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {loadingLedger ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Memuat mutasi dompet dari database...
                  </td>
                </tr>
              ) : ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Belum ada mutasi dompet tercatat. Lakukan klaim harian atau top-up di Pusat Upgrade.
                  </td>
                </tr>
              ) : (
                ledgerEntries.slice(0, 12).map((entry) => {
                  const isPositive = entry.delta >= 0;
                  const unit = entry.currency === "cert_credits" ? "Kredit Sertifikat" : "Gems";
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-2 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(entry.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-900 dark:text-white font-semibold">{entry.reason}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-0.5 rounded-md border text-xs font-bold ${
                            isPositive
                              ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                              : "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800"
                          }`}
                        >
                          {isPositive ? "Masuk" : "Keluar"}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-2 text-right font-bold tabular-nums ${
                          isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                        }`}
                      >
                        {isPositive ? `+${entry.delta}` : entry.delta} {unit}
                      </td>
                      <td className="py-3 px-2 text-right font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                        {entry.balanceAfter}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Flash Challenge Banner */}
      <div className="from-slate-900 to-slate-950 rounded-lg p-4 md:p-3 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-2 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] relative overflow-hidden border border-white/5 group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[80px] -z-10 group-hover:scale-105 transition-transform duration-300"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[60px] -z-10 group-hover:scale-105 transition-transform duration-300"></div>
        <div className="space-y-4 relative z-10 max-w-xl">
          <span className="text-base bg-white/5 backdrop-blur-md text-amber-300 font-black px-3 py-2 rounded-xl uppercase tracking-widest border border-white/10 shadow-sm flex items-center gap-2 w-fit">
            <Zap className="w-4 h-4 text-amber-400" /> Tantangan Karir Kilat
          </span>
          <h3 className="font-display text-base md:text-base font-black tracking-tight text-white">Uji Pemahaman Konsep Harian Anda!</h3>
          <p className="text-base text-slate-400 font-medium leading-relaxed opacity-95">
            Asah pengetahuan fundamental pemrograman web, React, dan state management melalui kuis cepat harian. Menangkan hadiah ekstra Gems & XP langsung!
          </p>
        </div>
        <button
          onClick={() => {
            playSound("click");
            handleGetFlashChallenge();
          }}
          className="relative z-10 bg-amber-500 text-slate-900 font-sans font-extrabold px-8 py-5 rounded-[1.25rem] shadow-[0_10px_25px_-5px_rgba(245,158,11,0.3)] hover:shadow-[0_15px_35px_-5px_rgba(245,158,11,0.4)] hover:bg-amber-400 transition-all text-base shrink-0 flex items-center gap-2 group/btn cursor-pointer active:scale-95"
        >
          <div className="absolute inset-0 bg-white/20  rounded-[1.25rem]" />
          <span className="group-hover/btn:scale-125 transition-transform text-base">⚡</span> Mulai Flash Challenge
        </button>
      </div>

      {/* Shop Store Items list */}
      <div className="space-y-4">
        <h3 className="font-display text-base font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-emerald-600" /> Belanja Perlengkapan dengan Gems
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {shopItems.map((item) => {
            const isAffordable = profile.gems >= item.price;
            
            return (
              <div
                key={item.id}
                className="bg-white rounded-[2rem] p-4 md:p-3 border border-slate-200/60 hover:border-slate-300 transition-all flex flex-col justify-between space-y-5 shadow-sm hover:shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base bg-slate-50 p-2.5 rounded-lg border border-slate-200 shadow-sm">{item.emoji}</span>
                    <span className="font-sans text-base font-black text-cyan-700 bg-cyan-50 px-3 py-1.5 rounded-xl border border-cyan-100 flex items-center gap-1 shadow-sm">
                      <Gem className="w-4 h-4 fill-cyan-400" />
                      {item.price} Gems
                    </span>
                  </div>
                  
                  <h4 className="font-display font-black text-base text-slate-900 leading-snug">{item.name}</h4>
                  <p className="text-base text-slate-500 font-medium leading-relaxed">{item.description}</p>
                </div>

                <button
                  onClick={() => handleBuyButtonClick(item)}
                  disabled={item.purchased && item.id !== "refill-hearts"}
                  className={`w-full font-sans text-base font-bold py-3.5 px-3 rounded-xl border transition-all cursor-pointer shadow-sm ${
                    item.purchased && item.id !== "refill-hearts"
                      ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                      : isAffordable
                      ? "bg-cyan-600 border-cyan-700 text-white hover:bg-cyan-500 hover:shadow-sm active:scale-95"
                      : "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {item.purchased && item.id !== "refill-hearts" ? "✓ Sudah Terbeli" : `Beli Sekarang - ${item.price} Gems`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Purchase Validation Drawer Modal */}
      <AnimatePresence>
        {selectedPurchaseItem && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] border border-slate-200 p-3 max-w-sm w-full space-y-6 shadow-sm"
            >
              <div className="text-center space-y-3">
                <span className="text-6xl block drop-shadow-sm">{selectedPurchaseItem.emoji}</span>
                <h4 className="font-display font-black text-base text-slate-900">Konfirmasi Pembelian Toko</h4>
                <p className="text-base text-slate-500 font-medium leading-relaxed">
                  Apakah Anda yakin ingin membelanjakan <span className="text-cyan-600 font-bold bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100">{selectedPurchaseItem.price} Gems</span> untuk membeli <span className="text-slate-800 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{selectedPurchaseItem.name}</span>?
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    playSound("click");
                    setSelectedPurchaseItem(null);
                  }}
                  className="w-1/2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-sans text-base font-bold py-3.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={confirmPurchase}
                  className="w-1/2 bg-cyan-600 hover:bg-cyan-500 text-white font-sans text-base font-bold py-3.5 rounded-xl border border-cyan-700 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  Ya, Konfirmasi!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Gamification Rules & Economy Modal Guide */}
      <AnimatePresence>
        {showGamificationGuide && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-2xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    ⚡
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Panduan Ekonomi XP & Gems Platform</h3>
                    <p className="text-xs text-slate-500">Mekanisme Gamifikasi yang Adil, Jelas, & Anti-Exploit</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowGamificationGuide(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold p-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
                
                {/* XP Section */}
                <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800/60 space-y-2">
                  <h4 className="font-bold text-sm text-blue-900 dark:text-blue-200 flex items-center gap-2">
                    <span className="text-base">⭐</span> Fungsi XP (Experience Points)
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                    <li><strong>Menaikkan Level Profil:</strong> Setiap kelipatan XP tertentu secara otomatis menaikkan Level & Gelar Developer Anda.</li>
                    <li><strong>Leaderboard Mingguan:</strong> XP yang dikumpulkan setiap minggu menentukan posisi Anda di Leaderboard Mingguan.</li>
                    <li><strong>Batas Maksimal Harian Anti-Exploit:</strong> Kuis dibatasi maksimal 500 XP per hari agar pembelajaran berlangsung bertahap & jujur.</li>
                    <li><strong>Multiplier 2x XP Booster:</strong> Aktifkan Booster dari toko untuk menggandakan semua XP perolehan kuis selama 24 jam.</li>
                  </ul>
                </div>

                {/* Gems Section */}
                <div className="bg-cyan-50 dark:bg-cyan-950/40 p-4 rounded-2xl border border-cyan-200 dark:border-cyan-800/60 space-y-2">
                  <h4 className="font-bold text-sm text-cyan-900 dark:text-cyan-200 flex items-center gap-2">
                    <span className="text-base">💎</span> Fungsi Gems (Mata Uang Premium)
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                    <li><strong>Streak Freeze (Pelindung Streak):</strong> Melindungi streak Anda otomatis jika Anda tidak belajar dalam 1 hari.</li>
                    <li><strong>Pemulihan Streak Terputus (Streak Repair):</strong> Gunakan 80 Gems jika Anda lupa belajar dan tidak punya Freeze untuk menyelamatkan streak yang terputus.</li>
                    <li><strong>Penyegaran Nyawa Kuis (Refill Hearts):</strong> Mengisi kembali 3 nyawa kuis yang habis saat salah menjawab.</li>
                    <li><strong>Koleksi Avatar Eksklusif:</strong> Buka avatar developer unik untuk dipasang pada profil & leaderboard.</li>
                    <li><strong>Pengkonversi Gems ke XP:</strong> Anda juga bisa menukar Gems menjadi XP kapan saja.</li>
                  </ul>
                </div>

                {/* Streak Rules */}
                <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-2">
                  <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <span className="text-base">🔥</span> Aturan Streak Realistis
                  </h4>
                  <p className="leading-relaxed">
                    Streak dihitung jika Anda menyelesaikan minimal 1 kuis atau klaim harian dalam 24 jam. Jika Anda melewatkan 1 hari, sistem akan memeriksa ketersediaan <strong>Streak Freeze</strong>. Jika tidak ada, Anda akan ditawari <strong>Streak Repair</strong> menggunakan Gems.
                  </p>
                </div>

              </div>

              <button
                onClick={() => setShowGamificationGuide(false)}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Saya Mengerti!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
