/**
 * Skillora Shared Formatter Utilities
 */

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}

export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return String(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function calculateLevel(xp: number): { level: number; currentLevelXp: number; nextLevelXp: number; progressPercent: number } {
  const level = Math.floor(xp / 500) + 1;
  const currentLevelXp = xp % 500;
  const nextLevelXp = 500;
  const progressPercent = Math.min(Math.round((currentLevelXp / nextLevelXp) * 100), 100);
  return { level, currentLevelXp, nextLevelXp, progressPercent };
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
