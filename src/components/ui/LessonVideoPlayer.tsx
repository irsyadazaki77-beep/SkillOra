import { useState } from "react";
import { ExternalLink, PlayCircle, Video, Wifi } from "lucide-react";
import { parseVideoUrl } from "../../utils/videoUtils";

interface LessonVideoPlayerProps {
  videoUrl?: string | null;
  title?: string;
}

export function LessonVideoPlayer({ videoUrl, title }: LessonVideoPlayerProps) {
  const source = parseVideoUrl(videoUrl);
  const [dataSaverActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem("skillora_data_saver") === "true";
    } catch {
      return false;
    }
  });
  const [userLoadedVideo, setUserLoadedVideo] = useState(false);

  if (!source) return null;

  const shouldDeferEmbed = dataSaverActive && !userLoadedVideo;

  return (
    <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 shadow-sm">
      <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-2 text-xs text-zinc-300">
        <span className="inline-flex items-center gap-2 font-semibold truncate">
          <Video className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{title ? `Video Materi: ${title}` : "Video Pembelajaran"}</span>
        </span>
        <a
          href={source.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 shrink-0"
        >
          <span>Buka Sumber</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {shouldDeferEmbed ? (
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 text-zinc-200 text-xs">
          <div className="flex items-start gap-3">
            <Wifi className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-white">Mode Hemat Kuota Aktif</p>
              <p className="text-zinc-400">
                Pemutaran video ditunda untuk menghemat paket data Anda. Anda tetap dapat membaca teks materi di bawah secara penuh.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUserLoadedVideo(true)}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Muat Video Sekarang</span>
          </button>
        </div>
      ) : source.kind === "youtube" || source.kind === "vimeo" ? (
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={source.embedUrl!}
            title={title || "Video Materi SkillOra"}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : source.kind === "video" ? (
        <div className="relative aspect-video w-full bg-black">
          <video
            src={source.embedUrl!}
            controls
            preload="metadata"
            className="w-full h-full object-contain"
          >
            Browser Anda tidak mendukung pemutar video HTML5.
          </video>
        </div>
      ) : (
        <div className="p-5 flex items-center justify-between gap-4 bg-zinc-900/80 text-zinc-200 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <PlayCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-white">Tautan Video Eksternal Tersedia</p>
              <p className="text-zinc-400 truncate">{source.originalUrl}</p>
            </div>
          </div>
          <a
            href={source.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shrink-0 inline-flex items-center gap-1.5"
          >
            <span>Tonton Video</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
