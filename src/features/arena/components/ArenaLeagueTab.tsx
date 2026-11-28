import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { LeagueOverview } from "../../../types";

interface ArenaLeagueTabProps {
  league: LeagueOverview | null;
  loading: boolean;
  onSelectTier: (tierId: string) => void;
}

function getInitials(name: string): string {
  const words = (name || "SK").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (name || "SK").slice(0, 2).toUpperCase();
}

export function ArenaLeagueTab({ league, loading, onSelectTier }: ArenaLeagueTabProps) {
  if (loading || !league) {
    return (
      <div className="h-64 rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111114] animate-pulse" />
    );
  }

  return (
    <div className="space-y-4">
      {/* Division Tier Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
          {league.tiers.map((tier) => (
            <button
              key={tier.id}
              type="button"
              onClick={() => onSelectTier(tier.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                league.activeTier === tier.id
                  ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-950 dark:border-zinc-100"
                  : "bg-white dark:bg-[#111114] border-zinc-200/90 dark:border-zinc-800/90 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>
        <p className="text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
          Reset divisi dalam {league.daysRemaining} hari · Peringkat Anda #{league.myRank}
        </p>
      </div>

      {/* Clean Editorial Standings Table */}
      <div className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 dark:bg-zinc-950/40 border-b border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="py-3 px-4 font-medium w-12">#</th>
                <th className="py-3 px-4 font-medium">Peserta</th>
                <th className="py-3 px-4 font-medium">Kampus &amp; Level</th>
                <th className="py-3 px-4 font-medium text-right">XP Pekan Ini</th>
                <th className="py-3 px-4 font-medium text-right">Zona</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
              {league.standings.map((row) => (
                <tr
                  key={`${row.rank}-${row.name}`}
                  className={
                    row.isCurrentUser
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "hover:bg-zinc-50/60 dark:hover:bg-zinc-900/50 transition-colors"
                  }
                >
                  <td className="py-3 px-4 font-mono font-semibold tabular-nums text-zinc-600 dark:text-zinc-400">
                    {row.rank}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-7 h-7 rounded-md font-mono text-[11px] font-semibold flex items-center justify-center shrink-0 border ${
                          row.isCurrentUser
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-800"
                        }`}
                      >
                        {getInitials(row.name)}
                      </span>
                      <span className="font-semibold text-zinc-950 dark:text-zinc-100">
                        {row.name}
                        {row.isCurrentUser && (
                          <span className="ml-1.5 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                            (Anda)
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {row.campusName ? `${row.campusName} · ` : ""}Lv.{row.level}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-zinc-950 dark:text-zinc-100">
                    {row.weeklyXp.toLocaleString("id-ID")} XP
                  </td>
                  <td className="py-3 px-4 text-right">
                    {row.zone === "promote" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                        <ArrowUpRight className="w-3.5 h-3.5" /> Promosi
                      </span>
                    ) : row.zone === "relegate" ? (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                        <ArrowDownRight className="w-3.5 h-3.5" /> Degradasi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-zinc-500 font-medium">
                        <Minus className="w-3.5 h-3.5" /> Aman
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
