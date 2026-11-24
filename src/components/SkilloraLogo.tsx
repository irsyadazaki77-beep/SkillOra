import React from "react";

interface SkilloraLogoProps {
  /**
   * Layout type:
   * - "full": Icon + Wordmark "Skillora."
   * - "icon": Icon symbol only
   * - "wordmark": Text wordmark "Skillora." only
   */
  variant?: "full" | "icon" | "wordmark";
  /** Size scaling for height in pixels or class */
  size?: "sm" | "md" | "lg" | "xl" | number;
  /** Custom className for container */
  className?: string;
  /** Whether dark mode / light text is active (affects "Skill" text color) */
  darkMode?: boolean;
}

export const SkilloraLogoIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = "",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Book Base (Navy #0B1938) */}
      {/* Left Book Page with page details */}
      <path
        d="M 28 142 C 28 142 62 130 98 146 L 98 162 C 62 144 28 158 28 158 Z"
        fill="#0B1938"
      />
      <path
        d="M 38 144 C 55 138 78 140 90 145"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M 42 150 C 58 145 78 147 88 151"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M 48 156 C 62 152 78 153 86 156"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.2"
      />

      {/* Right Book Page */}
      <path
        d="M 98 146 C 134 130 168 142 168 142 L 168 158 C 168 158 134 144 98 162 Z"
        fill="#0B1938"
      />

      {/* Main S-Pathway (Emerald Green #00B074) */}
      {/* Smooth continuous S curve */}
      <path
        d="M 98 146 
           C 78 138 52 118 52 90 
           C 52 62 82 42 126 42 
           C 138 42 152 46 160 52
           L 150 64
           C 142 59 132 56 122 56
           C 90 56 68 70 68 88 
           C 68 108 88 122 108 132
           Z"
        fill="#00B074"
      />

      {/* Ascending Pathway Extension + Arrow */}
      <path
        d="M 108 132 
           C 130 118 154 94 158 72
           L 172 82
           L 162 52
           L 132 62
           L 142 70
           C 138 88 118 108 98 120
           Z"
        fill="#00B074"
      />

      {/* Ladder Steps across the green pathway */}
      {/* Step 1 */}
      <line x1="60" y1="88" x2="72" y2="82" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
      {/* Step 2 */}
      <line x1="72" y1="72" x2="86" y2="68" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
      {/* Step 3 */}
      <line x1="90" y1="60" x2="106" y2="58" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
      {/* Step 4 */}
      <line x1="112" y1="56" x2="128" y2="58" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
      {/* Step 5 */}
      <line x1="130" y1="68" x2="144" y2="76" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
      {/* Step 6 */}
      <line x1="120" y1="92" x2="136" y2="102" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.9" />

      {/* Gold 4-Point Sparkle Star (Top Right #F5A623) */}
      <path
        d="M 166 22 C 166 30 172 36 180 36 C 172 36 166 42 166 50 C 166 42 160 36 152 36 C 160 36 166 30 166 22 Z"
        fill="#F5A623"
      />

      {/* Small Green Sparkle Star (#00B074) */}
      <path
        d="M 148 40 C 148 45 152 48 157 48 C 152 48 148 51 148 56 C 148 51 144 48 139 48 C 144 48 148 45 148 40 Z"
        fill="#00B074"
      />
    </svg>
  );
};

export const SkilloraLogo: React.FC<SkilloraLogoProps> = ({
  variant = "full",
  size = "md",
  className = "",
  darkMode = false,
}) => {
  // Dimension mappings
  let iconSize = 36;
  let textSize = "text-xl";

  if (typeof size === "number") {
    iconSize = size;
    textSize = size > 40 ? "text-2xl" : size > 28 ? "text-xl" : "text-lg";
  } else {
    switch (size) {
      case "sm":
        iconSize = 24;
        textSize = "text-base";
        break;
      case "md":
        iconSize = 36;
        textSize = "text-xl";
        break;
      case "lg":
        iconSize = 48;
        textSize = "text-2xl";
        break;
      case "xl":
        iconSize = 64;
        textSize = "text-3xl";
        break;
    }
  }

  if (variant === "icon") {
    return <SkilloraLogoIcon size={iconSize} className={className} />;
  }

  const skillTextColor = darkMode ? "text-white" : "text-[#0B1938] dark:text-white";

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {variant === "full" && <SkilloraLogoIcon size={iconSize} />}
      <span className={`font-display font-extrabold tracking-tight ${textSize}`}>
        <span className={`${skillTextColor} transition-colors`}>Skill</span>
        <span className="text-[#00B074]">ora</span>
      </span>
    </div>
  );
};

export default SkilloraLogo;
