import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp, BookOpen, Compass, Briefcase, Users, UserCircle } from "lucide-react";
import { ROUTES } from "../routes";

interface MobileBottomNavProps {
  showScrollTop: boolean;
}

const MOBILE_TABS = [
  { id: ROUTES.learning.root, name: "Beranda", icon: BookOpen },
  { id: ROUTES.learning.catalog, name: "Belajar", icon: Compass },
  { id: ROUTES.career.jobs, name: "Karier", icon: Briefcase },
  { id: ROUTES.community.root, name: "Komunitas", icon: Users },
  { id: ROUTES.profile.root, name: "Profil", icon: UserCircle },
];

export function MobileBottomNav({ showScrollTop }: MobileBottomNavProps) {
  const location = useLocation();

  return (
    <>
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.9 }}
            onClick={() => document.getElementById("main-content")?.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 bg-slate-900/90 dark:bg-slate-100 dark:text-slate-900 text-white p-3 rounded-full shadow-lg hover:bg-slate-800 dark:hover:bg-white transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            aria-label="Kembali ke atas"
          >
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <nav
        aria-label="Navigasi Mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 z-50 px-2 pt-1 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
      >
        <div className="flex justify-around items-center max-w-md mx-auto relative z-10">
          {MOBILE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              tab.id === ROUTES.learning.catalog
                ? location.pathname.startsWith(ROUTES.learning.catalog)
                : tab.id === ROUTES.learning.root
                  ? location.pathname === "/" || location.pathname === ROUTES.learning.root
                  : location.pathname.startsWith(tab.id);

            return (
              <Link
                key={tab.id}
                to={tab.id}
                aria-label={`Buka menu ${tab.name}`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  document.getElementById("main-content")?.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`flex flex-col items-center justify-center w-full min-h-[48px] py-1 relative transition-all active:scale-95 cursor-pointer ${
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <div className="flex flex-col items-center justify-center transition-colors">
                  <Icon className="w-5 h-5 mb-0.5" strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`text-xs tracking-tight ${isActive ? "font-bold" : "font-medium"}`}>{tab.name}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute top-0 w-8 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-b-full"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
