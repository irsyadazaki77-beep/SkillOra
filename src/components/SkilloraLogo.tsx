import React, { useId } from "react";

export const SKILLORA_BRAND = {
  name: "Skillora",
  tagline: "Navigasi Kompetensi & Akselerator Karier Industri",
  shortTagline: "Kompas Kompetensi & Karier",
  colors: {
    navy: "#0A1628",
    navyLight: "#0F213E",
    navyBorder: "#1E3A5F",
    emerald: "#00B87C",
    emeraldDeep: "#059669",
    emeraldBright: "#34D399",
    gold: "#F59E0B",
    goldLight: "#FDE68A",
    slateSurface: "#F8FAFC",
  },
} as const;

export interface SkilloraLogoProps {
  /**
   * Layout type:
   * - "full": Geometric Monogram & Compass Icon + Wordmark "Skillora"
   * - "icon": Geometric Monogram & Compass Icon only
   * - "wordmark": Typography wordmark "Skillora" only
   * - "seal": Official Circular Certification & Verification Seal
   */
  variant?: "full" | "icon" | "wordmark" | "seal";
  /** Size scaling for height in pixels or preset */
  size?: "sm" | "md" | "lg" | "xl" | number;
  /** Custom className for container */
  className?: string;
  /** Whether dark surface / light wordmark text is active */
  darkMode?: boolean;
  /** Display official brand tagline underneath the wordmark */
  showTagline?: boolean;
  /** Compact tagline for header/footer lockups */
  compactTagline?: boolean;
}

export const SkilloraLogoIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = "",
}) => {
  const uid = useId().replace(/:/g, "");
  const navyGrad = `sk-navy-${uid}`;
  const emeraldMain = `sk-em-main-${uid}`;
  const emeraldFacet = `sk-em-facet-${uid}`;
  const goldStar = `sk-gold-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={navyGrad} x1="20" y1="16" x2="180" y2="184" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F213E" />
          <stop offset="100%" stopColor="#071020" />
        </linearGradient>
        <linearGradient id={emeraldMain} x1="48" y1="152" x2="156" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="55%" stopColor="#00B87C" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <linearGradient id={emeraldFacet} x1="56" y1="140" x2="144" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#047857" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id={goldStar} x1="130" y1="30" x2="170" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Outer Geometric Octagonal-Squircle Shield */}
      <rect
        x="14"
        y="14"
        width="172"
        height="172"
        rx="44"
        fill={`url(#${navyGrad})`}
        stroke="#1E3A5F"
        strokeWidth="4"
      />

      {/* Precision Compass Dial Ring & Cardinal Ticks */}
      <circle cx="100" cy="100" r="68" stroke="#1E293B" strokeWidth="2.5" strokeDasharray="6 6" />
      <circle cx="100" cy="100" r="56" stroke="#00B87C" strokeOpacity="0.22" strokeWidth="1.5" />
      <line x1="100" y1="24" x2="100" y2="33" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
      <line x1="176" y1="100" x2="167" y2="100" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
      <line x1="100" y1="176" x2="100" y2="167" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
      <line x1="24" y1="100" x2="33" y2="100" stroke="#475569" strokeWidth="3" strokeLinecap="round" />

      {/* Geometric Monogram "S" Ribbon */}
      <path
        d="M 52 142 L 88 142 C 118 142 134 128 134 108 C 134 91 120 82 96 78 L 84 76 C 74 74 68 69 68 62 C 68 54 76 48 92 48 L 116 48 L 128 36 L 90 36 C 62 36 46 49 46 67 C 46 84 60 93 84 97 L 96 99 C 106 101 112 106 112 114 C 112 122 103 128 86 128 L 64 128 Z"
        fill={`url(#${emeraldFacet})`}
      />

      {/* 45-Degree North-East Career Compass Needle */}
      <path d="M 156 44 L 108 72 L 100 100 Z" fill={`url(#${emeraldMain})`} />
      <path d="M 156 44 L 128 92 L 100 100 Z" fill="#059669" />
      <path d="M 48 152 L 92 124 L 100 100 Z" fill="#334155" />
      <path d="M 48 152 L 76 108 L 100 100 Z" fill="#1E293B" />

      {/* Compass Pivot Core */}
      <circle cx="100" cy="100" r="11" fill="#0A1628" stroke={`url(#${goldStar})`} strokeWidth="4" />
      <circle cx="100" cy="100" r="4.5" fill="#F59E0B" />

      {/* North-East Apex Star Beacon */}
      <path
        d="M 158 26 C 158 34 162 38 170 38 C 162 38 158 42 158 50 C 158 42 154 38 146 38 C 154 38 158 34 158 26 Z"
        fill={`url(#${goldStar})`}
      />
    </svg>
  );
};

export const SkilloraCompassSeal: React.FC<{
  size?: number;
  className?: string;
  label?: string;
  sublabel?: string;
  darkMode?: boolean;
}> = ({
  size = 112,
  className = "",
  label = "VERIFIED",
  sublabel = "SKILLORA COMPASS",
  darkMode = false,
}) => {
  const uid = useId().replace(/:/g, "");
  const goldRing = `sk-seal-gold-${uid}`;
  const sealBg = `sk-seal-bg-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      role="img"
      aria-label="Stempel Resmi Terverifikasi Skillora Career Compass"
    >
      <defs>
        <linearGradient id={goldRing} x1="20" y1="20" x2="200" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id={sealBg} x1="30" y1="30" x2="190" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={darkMode ? "#0F213E" : "#0A1628"} />
          <stop offset="100%" stopColor="#060D1A" />
        </linearGradient>
      </defs>

      {/* Outer Ring */}
      <circle cx="110" cy="110" r="102" fill={`url(#${sealBg})`} stroke={`url(#${goldRing})`} strokeWidth="5" />
      <circle cx="110" cy="110" r="90" stroke="#F59E0B" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="4 4" />
      <circle cx="110" cy="110" r="64" stroke="#00B87C" strokeOpacity="0.45" strokeWidth="1.5" />

      {/* Cardinal Points */}
      <path d="M 110 14 L 114 23 L 106 23 Z" fill="#F59E0B" />
      <path d="M 110 206 L 114 197 L 106 197 Z" fill="#F59E0B" />
      <path d="M 14 110 L 23 106 L 23 114 Z" fill="#F59E0B" />
      <path d="M 206 110 L 197 106 L 197 114 Z" fill="#F59E0B" />

      {/* Top & Bottom Arc Labels */}
      <text
        x="110"
        y="42"
        textAnchor="middle"
        fill="#FDE68A"
        fontSize="11"
        fontWeight="800"
        letterSpacing="2.4"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {sublabel}
      </text>
      <text
        x="110"
        y="186"
        textAnchor="middle"
        fill="#34D399"
        fontSize="11.5"
        fontWeight="800"
        letterSpacing="3"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {label}
      </text>

      {/* Center Mini Career Compass Monogram */}
      <g transform="translate(55, 55) scale(0.55)">
        <path
          d="M 52 142 L 88 142 C 118 142 134 128 134 108 C 134 91 120 82 96 78 L 84 76 C 74 74 68 69 68 62 C 68 54 76 48 92 48 L 116 48 L 128 36 L 90 36 C 62 36 46 49 46 67 C 46 84 60 93 84 97 L 96 99 C 106 101 112 106 112 114 C 112 122 103 128 86 128 L 64 128 Z"
          fill="#10B981"
        />
        <path d="M 156 44 L 108 72 L 100 100 Z" fill="#34D399" />
        <path d="M 156 44 L 128 92 L 100 100 Z" fill="#059669" />
        <path d="M 48 152 L 92 124 L 100 100 Z" fill="#475569" />
        <circle cx="100" cy="100" r="11" fill="#0A1628" stroke="#F59E0B" strokeWidth="4" />
        <circle cx="100" cy="100" r="4.5" fill="#F59E0B" />
        <path
          d="M 158 26 C 158 34 162 38 170 38 C 162 38 158 42 158 50 C 158 42 154 38 146 38 C 154 38 158 34 158 26 Z"
          fill="#F59E0B"
        />
      </g>
    </svg>
  );
};

export interface LogoExportOptions {
  variant?: "full" | "icon" | "wordmark" | "seal";
  theme?: "light" | "dark";
  includeTagline?: boolean;
}

/**
 * Generates clean, standalone SVG markup for downloading official Skillora brand assets
 * (.svg or rasterized to .png via canvas) and embedding in offline HTML certificates.
 */
export function getSkilloraLogoSvgString(options: LogoExportOptions = {}): string {
  const { variant = "full", theme = "light", includeTagline = false } = options;

  const iconInner = `
  <defs>
    <linearGradient id="sk-navy-bg" x1="20" y1="16" x2="180" y2="184" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0F213E" />
      <stop offset="100%" stop-color="#071020" />
    </linearGradient>
    <linearGradient id="sk-emerald-main" x1="48" y1="152" x2="156" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="55%" stop-color="#00B87C" />
      <stop offset="100%" stop-color="#34D399" />
    </linearGradient>
    <linearGradient id="sk-emerald-facet" x1="56" y1="140" x2="144" y2="60" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#047857" />
      <stop offset="100%" stop-color="#10B981" />
    </linearGradient>
    <linearGradient id="sk-gold-star" x1="130" y1="30" x2="170" y2="70" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FDE68A" />
      <stop offset="50%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#D97706" />
    </linearGradient>
  </defs>
  <rect x="14" y="14" width="172" height="172" rx="44" fill="url(#sk-navy-bg)" stroke="#1E3A5F" stroke-width="4" />
  <circle cx="100" cy="100" r="68" stroke="#1E293B" stroke-width="2.5" stroke-dasharray="6 6" />
  <circle cx="100" cy="100" r="56" stroke="#00B87C" stroke-opacity="0.22" stroke-width="1.5" />
  <line x1="100" y1="24" x2="100" y2="33" stroke="#475569" stroke-width="3" stroke-linecap="round" />
  <line x1="176" y1="100" x2="167" y2="100" stroke="#475569" stroke-width="3" stroke-linecap="round" />
  <line x1="100" y1="176" x2="100" y2="167" stroke="#475569" stroke-width="3" stroke-linecap="round" />
  <line x1="24" y1="100" x2="33" y2="100" stroke="#475569" stroke-width="3" stroke-linecap="round" />
  <path d="M 52 142 L 88 142 C 118 142 134 128 134 108 C 134 91 120 82 96 78 L 84 76 C 74 74 68 69 68 62 C 68 54 76 48 92 48 L 116 48 L 128 36 L 90 36 C 62 36 46 49 46 67 C 46 84 60 93 84 97 L 96 99 C 106 101 112 106 112 114 C 112 122 103 128 86 128 L 64 128 Z" fill="url(#sk-emerald-facet)" />
  <path d="M 156 44 L 108 72 L 100 100 Z" fill="url(#sk-emerald-main)" />
  <path d="M 156 44 L 128 92 L 100 100 Z" fill="#059669" />
  <path d="M 48 152 L 92 124 L 100 100 Z" fill="#334155" />
  <path d="M 48 152 L 76 108 L 100 100 Z" fill="#1E293B" />
  <circle cx="100" cy="100" r="11" fill="#0A1628" stroke="url(#sk-gold-star)" stroke-width="4" />
  <circle cx="100" cy="100" r="4.5" fill="#F59E0B" />
  <path d="M 158 26 C 158 34 162 38 170 38 C 162 38 158 42 158 50 C 158 42 154 38 146 38 C 154 38 158 34 158 26 Z" fill="url(#sk-gold-star)" />`;

  if (variant === "icon") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="512" height="512" fill="none">${iconInner}</svg>`;
  }

  if (variant === "seal") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" width="512" height="512" fill="none">
  <defs>
    <linearGradient id="sk-seal-gold" x1="20" y1="20" x2="200" y2="200" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FDE68A" />
      <stop offset="50%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#B45309" />
    </linearGradient>
    <linearGradient id="sk-seal-bg" x1="30" y1="30" x2="190" y2="190" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0F213E" />
      <stop offset="100%" stop-color="#060D1A" />
    </linearGradient>
  </defs>
  <circle cx="110" cy="110" r="102" fill="url(#sk-seal-bg)" stroke="url(#sk-seal-gold)" stroke-width="5" />
  <circle cx="110" cy="110" r="90" stroke="#F59E0B" stroke-opacity="0.45" stroke-width="1.5" stroke-dasharray="4 4" />
  <circle cx="110" cy="110" r="64" stroke="#00B87C" stroke-opacity="0.45" stroke-width="1.5" />
  <path d="M 110 14 L 114 23 L 106 23 Z" fill="#F59E0B" />
  <path d="M 110 206 L 114 197 L 106 197 Z" fill="#F59E0B" />
  <path d="M 14 110 L 23 106 L 23 114 Z" fill="#F59E0B" />
  <path d="M 206 110 L 197 106 L 197 114 Z" fill="#F59E0B" />
  <text x="110" y="42" text-anchor="middle" fill="#FDE68A" font-size="11" font-weight="800" letter-spacing="2.4" font-family="system-ui, -apple-system, sans-serif">SKILLORA COMPASS</text>
  <text x="110" y="186" text-anchor="middle" fill="#34D399" font-size="11.5" font-weight="800" letter-spacing="3" font-family="system-ui, -apple-system, sans-serif">VERIFIED</text>
  <g transform="translate(55, 55) scale(0.55)">
    <path d="M 52 142 L 88 142 C 118 142 134 128 134 108 C 134 91 120 82 96 78 L 84 76 C 74 74 68 69 68 62 C 68 54 76 48 92 48 L 116 48 L 128 36 L 90 36 C 62 36 46 49 46 67 C 46 84 60 93 84 97 L 96 99 C 106 101 112 106 112 114 C 112 122 103 128 86 128 L 64 128 Z" fill="#10B981" />
    <path d="M 156 44 L 108 72 L 100 100 Z" fill="#34D399" />
    <path d="M 156 44 L 128 92 L 100 100 Z" fill="#059669" />
    <path d="M 48 152 L 92 124 L 100 100 Z" fill="#475569" />
    <circle cx="100" cy="100" r="11" fill="#0A1628" stroke="#F59E0B" stroke-width="4" />
    <circle cx="100" cy="100" r="4.5" fill="#F59E0B" />
    <path d="M 158 26 C 158 34 162 38 170 38 C 162 38 158 42 158 50 C 158 42 154 38 146 38 C 154 38 158 34 158 26 Z" fill="#F59E0B" />
  </g>
</svg>`;
  }

  const primaryTextColor = theme === "dark" ? "#FFFFFF" : "#0A1628";
  const taglineColor = theme === "dark" ? "#94A3B8" : "#475569";

  if (variant === "wordmark") {
    const height = includeTagline ? 130 : 96;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 ${height}" width="840" height="${height * 2}" fill="none">
  <text x="16" y="68" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="64" font-weight="800" letter-spacing="-2">
    <tspan fill="${primaryTextColor}">Skill</tspan><tspan fill="#00B87C">ora</tspan>
  </text>
  <path d="M 278 24 L 283 33 L 292 38 L 283 43 L 278 52 L 273 43 L 264 38 L 273 33 Z" fill="#F59E0B" />
  ${
    includeTagline
      ? `<text x="18" y="104" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" letter-spacing="0.8" fill="${taglineColor}">NAVIGASI KOMPETENSI &amp; AKSELERATOR KARIER INDUSTRI</text>`
      : ""
  }
</svg>`;
  }

  // Full lockup (Icon + Wordmark + optional Tagline)
  const width = includeTagline ? 680 : 540;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 200" width="${width * 2}" height="400" fill="none">
  <g transform="translate(0, 0)">${iconInner}</g>
  <text x="216" y="${includeTagline ? 104 : 122}" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="78" font-weight="800" letter-spacing="-2.5">
    <tspan fill="${primaryTextColor}">Skill</tspan><tspan fill="#00B87C">ora</tspan>
  </text>
  <path d="M 505 ${includeTagline ? 46 : 64} L 510 ${includeTagline ? 56 : 74} L 520 ${includeTagline ? 61 : 79} L 510 ${includeTagline ? 66 : 84} L 505 ${includeTagline ? 76 : 94} L 500 ${includeTagline ? 66 : 84} L 490 ${includeTagline ? 61 : 79} L 500 ${includeTagline ? 56 : 74} Z" fill="#F59E0B" />
  ${
    includeTagline
      ? `<text x="220" y="142" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" letter-spacing="1.2" fill="${taglineColor}">NAVIGASI KOMPETENSI &amp; AKSELERATOR KARIER</text>`
      : ""
  }
</svg>`;
}

export const SkilloraLogo: React.FC<SkilloraLogoProps> = ({
  variant = "full",
  size = "md",
  className = "",
  darkMode = false,
  showTagline = false,
  compactTagline = false,
}) => {
  let iconSize = 36;
  let textSize = "text-xl";
  let taglineSize = "text-[10px]";

  if (typeof size === "number") {
    iconSize = size;
    textSize = size > 44 ? "text-2xl" : size > 28 ? "text-xl" : "text-lg";
    taglineSize = size > 44 ? "text-xs" : "text-[10px]";
  } else {
    switch (size) {
      case "sm":
        iconSize = 28;
        textSize = "text-lg";
        taglineSize = "text-[9px]";
        break;
      case "md":
        iconSize = 36;
        textSize = "text-xl";
        taglineSize = "text-[10px]";
        break;
      case "lg":
        iconSize = 48;
        textSize = "text-2xl";
        taglineSize = "text-[11px]";
        break;
      case "xl":
        iconSize = 62;
        textSize = "text-3xl";
        taglineSize = "text-xs";
        break;
    }
  }

  if (variant === "icon") {
    return <SkilloraLogoIcon size={iconSize} className={className} />;
  }

  if (variant === "seal") {
    return <SkilloraCompassSeal size={Math.max(iconSize * 2, 72)} darkMode={darkMode} className={className} />;
  }

  const skillTextColor = darkMode ? "text-white" : "text-[#0A1628] dark:text-white";
  const taglineTextColor = darkMode ? "text-slate-400" : "text-zinc-500 dark:text-zinc-400";

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {variant === "full" && <SkilloraLogoIcon size={iconSize} />}
      <div className="flex flex-col leading-none">
        <span className={`font-display font-extrabold tracking-tight inline-flex items-center ${textSize}`}>
          <span className={`${skillTextColor} transition-colors`}>Skill</span>
          <span className="text-[#00B87C]">ora</span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 20 20"
            fill="none"
            className="ml-0.5 -mt-2.5 shrink-0"
            aria-hidden="true"
          >
            <path d="M 10 1 L 12.5 7.5 L 19 10 L 12.5 12.5 L 10 19 L 7.5 12.5 L 1 10 L 7.5 7.5 Z" fill="#F59E0B" />
          </svg>
        </span>
        {showTagline && (
          <span className={`font-medium tracking-wide mt-1 ${taglineSize} ${taglineTextColor}`}>
            {compactTagline ? SKILLORA_BRAND.shortTagline : SKILLORA_BRAND.tagline}
          </span>
        )}
      </div>
    </div>
  );
};

export default SkilloraLogo;
