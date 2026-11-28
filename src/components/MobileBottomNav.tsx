import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp, LayoutDashboard, Terminal, BookOpen, Trophy, Briefcase } from "lucide-react";
import { ROUTES } from "../routes";

interface MobileBottomNavProps {
  showScrollTop: boolean;
}

const MOBILE_TABS = [
  { id: ROUTES.learning.root, name: "Beranda", icon: LayoutDashboard },
  { id: ROUTES.learning.catalog, name: "Kursus", icon: BookOpen },
  { id: ROUTES.lab.root, name: "Lab", icon: Terminal },
  { id: ROUTES.arena.root, name: "Arena", icon: Trophy },
  { id: ROUTES.career.jobs, name: "Karier", icon: Briefcase },
];

export function MobileBottomNav({ showScrollTop }: MobileBottomNavProps) {
  const location = useLocation();

  return (
    <>
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.16 }}
            onClick={() =>
              document.getElementById("main-content")?.scrollTo({ top: 0, behavior: "smooth" })
            }
            className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 p-2.5 rounded-lg border border-zinc-800 dark:border-zinc-200 shadow-md hover:opacity-90 transition-opacity cursor-pointer"
            aria-label="Kembali ke atas"
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      <nav
        aria-label="Navigasi Mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-md border-t border-zinc-200/90 dark:border-zinc-800/90 z-50 px-2 pb-safe"
      >
        <div className="flex justify-around items-center max-w-md mx-auto">
          {MOBILE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              tab.id === ROUTES.learning.catalog
                ? location.pathname.startsWith("/belajar/katalog") ||
                  location.pathname.startsWith("/belajar/kursus")
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
                className={`flex flex-col items-center justify-center w-full min-h-[48px] py-1.5 relative transition-colors ${
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" strokeWidth={isActive ? 2.2 : 1.75} />
                <span className={`text-[11px] tracking-tight ${isActive ? "font-semibold" : "font-medium"}`}>
                  {tab.name}
                </span>
                {isActive && (
                  <span className="absolute top-0 w-6 h-[2px] bg-emerald-600 dark:bg-emerald-400 rounded-b-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
