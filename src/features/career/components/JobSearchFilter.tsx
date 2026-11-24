import { useState, useEffect } from "react";
import { Search, Filter, X } from "lucide-react";
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
      if (query) newParams.set("q", query); else newParams.delete("q");
      if (location !== "semua") newParams.set("loc", location); else newParams.delete("loc");
      if (workType !== "semua") newParams.set("type", workType); else newParams.delete("type");
      if (level !== "semua") newParams.set("level", level); else newParams.delete("level");
      setSearchParams(newParams, { replace: true });
      
    }, 400);

    return () => clearTimeout(timer);
  }, [query, location, workType, level, onFilterChange, searchParams, setSearchParams]);

  const activeFilterCount = (location !== "semua" ? 1 : 0) + (workType !== "semua" ? 1 : 0) + (level !== "semua" ? 1 : 0);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input aria-label="Cari posisi, perusahaan, atau keahlian..."
          type="text"
          placeholder="Cari posisi, perusahaan, atau keahlian..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-10 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
        />
        {query && (
          <button 
            onClick={() => setQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Desktop Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-500 mr-2">
          <Filter className="w-4 h-4" /> Filter:
        </div>
        
        <select aria-label="Input field" 
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
        >
          <option value="semua">Semua Lokasi</option>
          <option value="jakarta">Jakarta</option>
          <option value="bandung">Bandung</option>
          <option value="remote">Remote</option>
        </select>

        <select aria-label="Input field" 
          value={workType}
          onChange={(e) => setWorkType(e.target.value)}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
        >
          <option value="semua">Semua Tipe Kerja</option>
          <option value="penuh waktu">Penuh Waktu</option>
          <option value="magang">Magang</option>
          <option value="kontrak">Kontrak</option>
        </select>

        <select aria-label="Input field" 
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
        >
          <option value="semua">Semua Level</option>
          <option value="junior">Junior</option>
          <option value="mid">Menengah (Mid)</option>
          <option value="senior">Senior</option>
        </select>

        {activeFilterCount > 0 && (
          <button 
            onClick={() => {
              setLocation("semua");
              setWorkType("semua");
              setLevel("semua");
            }}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline ml-auto cursor-pointer"
          >
            Reset Filter
          </button>
        )}
      </div>
    </div>
  );
}
