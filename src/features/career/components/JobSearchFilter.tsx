import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";

interface JobSearchFilterProps {
  onFilterChange: (query: string, filterLocation: string, filterWorkType: string, filterLevel: string) => void;
}

export function JobSearchFilter({ onFilterChange }: JobSearchFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const initialLocation = searchParams.get("loc") || "semua";
  const initialWorkType = searchParams.get("type") || "semua";
  const initialLevel = searchParams.get("level") || "semua";

  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [workType, setWorkType] = useState(initialWorkType);
  const [level, setLevel] = useState(initialLevel);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(query, location, workType, level);

      const newParams = new URLSearchParams(searchParams);
      if (query) newParams.set("q", query);
      else newParams.delete("q");
      if (location !== "semua") newParams.set("loc", location);
      else newParams.delete("loc");
      if (workType !== "semua") newParams.set("type", workType);
      else newParams.delete("type");
      if (level !== "semua") newParams.set("level", level);
      else newParams.delete("level");
      setSearchParams(newParams, { replace: true });
    }, 350);

    return () => clearTimeout(timer);
  }, [query, location, workType, level, onFilterChange, searchParams, setSearchParams]);

  const activeFilterCount =
    (location !== "semua" ? 1 : 0) + (workType !== "semua" ? 1 : 0) + (level !== "semua" ? 1 : 0);

  const selectClass =
    "h-9 bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 text-xs font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-emerald-500 transition-colors cursor-pointer";

  return (
    <div className="bg-white dark:bg-[#111114] p-3.5 sm:p-4 rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 flex flex-col lg:flex-row lg:items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          aria-label="Cari posisi, perusahaan, atau keahlian"
          type="text"
          placeholder="Cari posisi, perusahaan, atau keahlian..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-9 bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-8 text-xs sm:text-sm text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-emerald-500 transition-colors"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Hapus pencarian"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Selects */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mr-1">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter
        </span>

        <select
          aria-label="Filter lokasi"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={selectClass}
        >
          <option value="semua">Semua Lokasi</option>
          <option value="jakarta">Jakarta</option>
          <option value="bandung">Bandung</option>
          <option value="remote">Remote</option>
        </select>

        <select
          aria-label="Filter tipe kerja"
          value={workType}
          onChange={(e) => setWorkType(e.target.value)}
          className={selectClass}
        >
          <option value="semua">Semua Tipe</option>
          <option value="penuh waktu">Penuh Waktu</option>
          <option value="magang">Magang</option>
          <option value="kontrak">Kontrak</option>
        </select>

        <select
          aria-label="Filter level"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className={selectClass}
        >
          <option value="semua">Semua Level</option>
          <option value="junior">Junior</option>
          <option value="mid">Menengah (Mid)</option>
          <option value="senior">Senior</option>
        </select>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setLocation("semua");
              setWorkType("semua");
              setLevel("semua");
            }}
            className="h-9 px-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer whitespace-nowrap shrink-0"
          >
            Reset ({activeFilterCount})
          </button>
        )}
      </div>
    </div>
  );
}
