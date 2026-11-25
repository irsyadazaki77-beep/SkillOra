import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { LeagueOverview } from "../../../types";

interface ArenaLeagueTabProps {
  league: LeagueOverview | null;
  loading: boolean;
  onSelectTier: (tierId: string) => void;
}

export function ArenaLeagueTab({ league, loading, onSelectTier }: ArenaLeagueTabProps) {
  if (loading || !league) {
    return (
      <div className="h-64 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse" />
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
              onClick={() => onSelectTier(tier.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap cursor-pointer ${
                league.activeTier === tier.id
                  ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-950 dark:border-zinc-100"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>
        <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
          Reset divisi dalam {league.daysRemaining} hari · Peringkat Anda #{league.myRank}
        </p>
      </div>

      {/* Clean Editorial Standings Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="py-3 px-4 font-semibold">#</th>
                <th className="py-3 px-4 font-semibold">Peserta</th>
                <th className="py-3 px-4 font-semibold">Kampus / Level</th>
                <th className="py-3 px-4 font-semibold text-right">XP Pekan Ini</th>
                <th className="py-3 px-4 font-semibold text-right">Zona</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {league.standings.map((row) => (
                <tr
                  key={`${row.rank}-${row.name}`}
                  className={
                    row.isCurrentUser
                      ? "bg-emerald-50/60 dark:bg-emerald-950/20"
                      : "hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40"
                  }
                >
                  <td className="py-3 px-4 font-mono font-bold tabular-nums text-zinc-700 dark:text-zinc-300">
                    {row.rank}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{row.avatar}</span>
                      <span className="font-semibold text-zinc-950 dark:text-white">
                        {row.name}
                        {row.isCurrentUser && (
                          <span className="ml-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                            (Anda)
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400">
                    {row.campusName ? `${row.campusName} · ` : ""}Lv.{row.level}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-zinc-950 dark:text-white">
                    {row.weeklyXp.toLocaleString("id-ID")} XP
                  </td>
                  <td className="py-3 px-4 text-right">
                    {row.zone === "promote" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <ArrowUpRight className="w-3.5 h-3.5" /> Promosi
                      </span>
                    ) : row.zone === "relegate" ? (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
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
