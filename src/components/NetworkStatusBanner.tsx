import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function NetworkStatusBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowRestored(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-rose-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-center gap-2 shadow-md"
        >
          <WifiOff className="w-4 h-4" />
          <span>Koneksi terputus. Menggunakan data lokal offline.</span>
        </motion.div>
      )}

      {showRestored && !isOffline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-center gap-2 shadow-md"
        >
          <Wifi className="w-4 h-4" />
          <span>Koneksi terhubung kembali!</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
