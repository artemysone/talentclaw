interface CrabLogoProps {
  className?: string
}

export function CrabLogo({ className = "w-8 h-8" }: CrabLogoProps) {
  return (
    <svg
      viewBox="0 0 88 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Legs — 4, evenly spaced */}
      <line x1="26" y1="56" x2="20" y2="74" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="38" y1="58" x2="34" y2="76" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="58" x2="54" y2="76" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="62" y1="56" x2="68" y2="74" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Arms — angled, with small pincers */}
      <line x1="10" y1="30" x2="2" y2="22" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="78" y1="30" x2="86" y2="22" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      {/* Pincers — tiny V */}
      <line x1="2" y1="22" x2="0" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="2" y1="22" x2="8" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="86" y1="22" x2="88" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="86" y1="22" x2="80" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Body — wide pill / super-rounded rect */}
      <rect x="10" y="14" width="68" height="46" rx="23" fill="currentColor" />
      {/* Eyes — dark rounded rects */}
      <rect x="28" y="26" width="10" height="9" rx="3" fill="white" />
      <rect x="50" y="26" width="10" height="9" rx="3" fill="white" />
      <rect x="30" y="27" width="7" height="7" rx="2" fill="#1a1a2e" />
      <rect x="52" y="27" width="7" height="7" rx="2" fill="#1a1a2e" />
      {/* Mouth — horizontal dash */}
      <line x1="36" y1="44" x2="52" y2="44" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
    </svg>
  )
}
