import React from 'react';

/**
 * ProofPathLogo - Official Brand Mark for ProofPath
 * 
 * Features:
 * - Stylized letter 'P'
 * - Winding interview pathway running through the core
 * - Luminous verification checkmark
 * - Royal blue (#2563EB) to purple (#7C3AED) gradient
 */
export default function ProofPathLogo({
  className = "h-9 w-9",
  variant = "gradient", // 'gradient', 'white', or 'monochrome'
  showText = false,
  textClassName = "text-xl font-extrabold tracking-tight text-slate-900",
  subtitle = null,
  subtitleClassName = "text-[11px] text-slate-500 font-medium tracking-normal"
}) {
  const gradientId = "proofpath-brand-grad";

  return (
    <div className="inline-flex items-center gap-3 select-none">
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          <defs>
            {/* Royal blue to purple gradient */}
            <linearGradient id={gradientId} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="55%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>

            {/* Glowing pathway gradient */}
            <linearGradient id="pathway-grad" x1="12" y1="36" x2="38" y2="12" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="50%" stopColor="#93C5FD" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>

            {/* Verification checkmark gradient */}
            <linearGradient id="check-grad" x1="24" y1="18" x2="38" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>

          {/* Background Rounded Squircle with subtle glow/depth */}
          <rect
            x="3"
            y="3"
            width="42"
            height="42"
            rx="12"
            fill={variant === 'white' ? 'rgba(255, 255, 255, 0.12)' : `url(#${gradientId})`}
            stroke={variant === 'white' ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.2)'}
            strokeWidth="1.5"
          />

          {/* Stylized Letter 'P' Main Stem (vertical anchor) */}
          <rect
            x="12"
            y="11"
            width="6"
            height="26"
            rx="3"
            fill="#FFFFFF"
          />

          {/* Letter 'P' Upper Loop */}
          <path
            d="M15 11 H28 C33.5 11 37 14.5 37 19.5 C37 24.5 33.5 28 28 28 H18"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Winding Pathway through the letter 'P' */}
          <path
            d="M15 35 C 22 35, 20 25.5, 27 25.5 C 32 25.5, 30 18, 35 15"
            stroke="url(#pathway-grad)"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeDasharray="1 0"
          />

          {/* Pathway Waypoint Nodes */}
          <circle cx="15" cy="35" r="2" fill="#93C5FD" />
          <circle cx="27" cy="25.5" r="2" fill="#60A5FA" />

          {/* Luminous Verification Checkmark at top-right completion point */}
          <path
            d="M27 19.5 L31.5 24 L39 14"
            stroke="#34D399"
            strokeWidth="3.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={textClassName}>ProofPath</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
          </div>
          {subtitle && (
            <span className={subtitleClassName}>{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}
