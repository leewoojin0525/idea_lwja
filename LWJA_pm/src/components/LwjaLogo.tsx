import React from 'react';

interface LwjaLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light' | 'gold' | 'monochrome' | 'badge';
  showText?: boolean;
  subtitle?: string;
}

export const LwjaLogo: React.FC<LwjaLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'badge',
  showText = true,
  subtitle = '건축·공간기획·PM',
}) => {
  // Dimensions
  const sizeMap = {
    xs: { icon: 24, box: 'w-7 h-7', text: 'text-xs', sub: 'text-[9px]' },
    sm: { icon: 32, box: 'w-9 h-9', text: 'text-xs', sub: 'text-[10px]' },
    md: { icon: 40, box: 'w-10 h-10', text: 'text-sm', sub: 'text-xs' },
    lg: { icon: 52, box: 'w-12 h-12', text: 'text-base', sub: 'text-xs' },
    xl: { icon: 64, box: 'w-16 h-16', text: 'text-lg', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Render the SVG Monogram matching the official LWJA emblem
  const renderMonogramSvg = () => (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full transform transition-transform duration-300 group-hover:scale-105"
      aria-label="LWJA Logo"
    >
      <defs>
        <linearGradient id="lwjaGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="lwjaMetallicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FAFAF9" />
          <stop offset="100%" stopColor="#D6D3D1" />
        </linearGradient>
      </defs>

      <g
        className={
          variant === 'gold'
            ? 'fill-[url(#lwjaGoldGrad)] stroke-[#78350F]/20'
            : variant === 'light'
            ? 'fill-stone-900 stroke-stone-950/20'
            : variant === 'monochrome'
            ? 'fill-white stroke-stone-900/40'
            : 'fill-stone-100'
        }
      >
        {/* Monogram Ligature: L - W - J - A */}
        {/* Letter L (Left) */}
        <path
          d="M 28 32 H 44 V 38 H 39 V 104 H 74 C 80 104 84 103 86 100 L 88 108 H 28 V 104 H 33 V 38 H 28 Z"
          fillRule="evenodd"
        />

        {/* Letter W (Middle interlocking) */}
        {/* W Left Stem */}
        <path
          d="M 52 48 H 68 L 78 98 L 94 48 H 108 L 118 98 L 130 48 H 144 L 126 112 H 112 L 101 64 L 90 112 H 76 Z"
          fillRule="evenodd"
        />

        {/* Letter J (Interlocking descending curve) */}
        <path
          d="M 124 32 H 144 V 38 H 139 V 110 C 139 122 134 130 125 135 C 117 140 106 140 98 136 L 101 128 C 107 131 114 131 119 128 C 124 125 127 119 127 110 V 96 H 133 V 38 H 124 Z"
          fillRule="evenodd"
        />

        {/* Letter A (Right interwoven) */}
        <path
          d="M 148 32 H 162 L 186 108 H 173 L 167 90 H 146 L 141 108 H 128 Z M 163 78 L 156 52 L 149 78 Z"
          fillRule="evenodd"
        />

        {/* Serif refinement & baseline geometric balance dots */}
        <circle cx="98" cy="144" r="2.5" className="opacity-70" />
      </g>
    </svg>
  );

  return (
    <div id="lwja-company-brand" className={`flex items-center space-x-3 group ${className}`}>
      {/* Logo Icon Badge */}
      <div
        className={`${currentSize.box} rounded-lg flex items-center justify-center p-1.5 flex-shrink-0 transition-all duration-300 ${
          variant === 'badge'
            ? 'bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 border border-stone-700/80 shadow-md shadow-black/30'
            : variant === 'gold'
            ? 'bg-amber-950/80 border border-amber-500/40 shadow-md'
            : variant === 'light'
            ? 'bg-stone-100 border border-stone-300 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        {renderMonogramSvg()}
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="hidden md:flex flex-col min-w-0">
          <div className="flex items-center space-x-1.5">
            <span
              className={`text-xs uppercase tracking-widest font-semibold font-sans transition-colors ${
                variant === 'light'
                  ? 'text-amber-700'
                  : 'text-amber-400'
              }`}
            >
              LEE WOOJIN ASSOCIATES
            </span>
          </div>
          {subtitle && (
            <span
              className={`text-sm font-bold leading-tight font-sans truncate ${
                variant === 'light' ? 'text-stone-800' : 'text-stone-100'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
