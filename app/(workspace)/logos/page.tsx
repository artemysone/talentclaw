import type { ReactNode } from "react"

export default function LogosPage() {
  return (
    <div className="p-8 max-w-[1100px] mx-auto">
      <h1 className="text-2xl font-bold mb-2">Logo Options</h1>
      <p className="text-text-secondary mb-8">
        Pick your favorite. All emerald, all crab.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {logos.map((logo, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-4 rounded-2xl border border-border-subtle bg-surface-raised p-6"
          >
            <div className="text-sm font-medium text-text-muted">
              Option {i + 1}: {logo.name}
            </div>

            {/* Large preview */}
            <div className="w-36 h-36 flex items-center justify-center text-emerald-600">
              {logo.render("w-36 h-36")}
            </div>

            {/* Small preview row */}
            <div className="flex items-center gap-5 pt-3 border-t border-border-subtle w-full justify-center">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 flex items-center justify-center text-emerald-600">
                  {logo.render("w-8 h-8")}
                </div>
                <span className="text-[10px] text-text-muted">32px</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 flex items-center justify-center text-emerald-600">
                  {logo.render("w-6 h-6")}
                </div>
                <span className="text-[10px] text-text-muted">24px</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                  {logo.render("w-6 h-6")}
                </div>
                <span className="text-[10px] text-text-muted">on dark</span>
              </div>
            </div>

            <p className="text-xs text-text-muted text-center leading-relaxed">
              {logo.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Crab1({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className}>
      {/* Legs — 4 thin straight lines */}
      <line x1="22" y1="58" x2="16" y2="74" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="34" y1="60" x2="30" y2="76" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="46" y1="60" x2="50" y2="76" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="58" y1="58" x2="64" y2="74" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {/* Arms — short horizontal stubs */}
      <rect x="2" y="34" width="12" height="6" rx="3" fill="currentColor" />
      <rect x="66" y="34" width="12" height="6" rx="3" fill="currentColor" />
      {/* Body — wide rounded rect, flat bottom */}
      <rect x="12" y="14" width="56" height="46" rx="8" fill="currentColor" />
      {/* Eyes — small dark rounded squares */}
      <rect x="24" y="26" width="10" height="9" rx="3" fill="white" />
      <rect x="46" y="26" width="10" height="9" rx="3" fill="white" />
      <rect x="26" y="27" width="7" height="7" rx="2" fill="#1a1a2e" />
      <rect x="48" y="27" width="7" height="7" rx="2" fill="#1a1a2e" />
      {/* Mouth — horizontal slit */}
      <rect x="30" y="44" width="20" height="4" rx="2" fill="white" opacity="0.85" />
    </svg>
  )
}

function Crab2({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className}>
      {/* Legs */}
      <line x1="20" y1="60" x2="14" y2="76" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="62" x2="28" y2="78" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="48" y1="62" x2="52" y2="78" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="60" y1="60" x2="66" y2="76" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Arms — angled up slightly */}
      <line x1="12" y1="36" x2="2" y2="30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="68" y1="36" x2="78" y2="30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      {/* Pincer dots */}
      <circle cx="2" cy="28" r="3" fill="currentColor" />
      <circle cx="78" cy="28" r="3" fill="currentColor" />
      {/* Body — wide rect, dome top */}
      <path d="M12 60 L12 32 Q12 14 40 14 Q68 14 68 32 L68 60 Q68 64 64 64 L16 64 Q12 64 12 60Z" fill="currentColor" />
      {/* Eyes — dark squares */}
      <rect x="23" y="28" width="10" height="8" rx="2" fill="white" />
      <rect x="47" y="28" width="10" height="8" rx="2" fill="white" />
      <rect x="25" y="29" width="7" height="6" rx="1.5" fill="#1a1a2e" />
      <rect x="49" y="29" width="7" height="6" rx="1.5" fill="#1a1a2e" />
      {/* Mouth — wide horizontal line */}
      <line x1="28" y1="48" x2="52" y2="48" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    </svg>
  )
}

function Crab3({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className}>
      {/* Legs — 3 pairs, splayed */}
      <line x1="20" y1="56" x2="10" y2="72" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="58" x2="28" y2="74" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="48" y1="58" x2="52" y2="74" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="60" y1="56" x2="70" y2="72" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Arms — blocky L-shapes */}
      <line x1="10" y1="34" x2="2" y2="34" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="2" y1="34" x2="2" y2="24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="70" y1="34" x2="78" y2="34" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="78" y1="34" x2="78" y2="24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      {/* Body — flat wide block with very slight rounding */}
      <rect x="10" y="12" width="60" height="48" rx="6" fill="currentColor" />
      {/* Brow ridge */}
      <rect x="10" y="12" width="60" height="16" rx="6" fill="currentColor" />
      {/* Eyes — dark rounded squares, slightly recessed */}
      <rect x="20" y="24" width="13" height="11" rx="3" fill="white" />
      <rect x="47" y="24" width="13" height="11" rx="3" fill="white" />
      <rect x="22" y="25.5" width="9" height="8" rx="2" fill="#1a1a2e" />
      <rect x="49" y="25.5" width="9" height="8" rx="2" fill="#1a1a2e" />
      <rect x="22.5" y="25.5" width="3" height="3" rx="1" fill="white" opacity="0.6" />
      <rect x="49.5" y="25.5" width="3" height="3" rx="1" fill="white" opacity="0.6" />
      {/* Mouth — wide slot */}
      <rect x="26" y="44" width="28" height="5" rx="2.5" fill="white" opacity="0.8" />
    </svg>
  )
}

function Crab4({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className}>
      {/* Legs — 4 pairs, straight down */}
      <line x1="18" y1="58" x2="14" y2="74" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="30" y1="60" x2="28" y2="76" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="60" x2="52" y2="76" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="62" y1="58" x2="66" y2="74" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Arms — short stubs */}
      <rect x="0" y="32" width="10" height="5" rx="2.5" fill="currentColor" />
      <rect x="70" y="32" width="10" height="5" rx="2.5" fill="currentColor" />
      {/* Body — tall rounded rect */}
      <rect x="10" y="8" width="60" height="54" rx="12" fill="currentColor" />
      {/* Eyes — circular, high up */}
      <circle cx="30" cy="26" r="7" fill="white" />
      <circle cx="50" cy="26" r="7" fill="white" />
      <circle cx="30.5" cy="26.5" r="4.5" fill="#1a1a2e" />
      <circle cx="50.5" cy="26.5" r="4.5" fill="#1a1a2e" />
      <circle cx="29" cy="24.5" r="1.5" fill="white" />
      <circle cx="49" cy="24.5" r="1.5" fill="white" />
      {/* Mouth — gentle curve */}
      <path d="M33 44 Q40 50 47 44" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function Crab5({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 88 80" className={className}>
      {/* Legs — 5, evenly spaced, straight */}
      <line x1="22" y1="56" x2="16" y2="74" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="34" y1="58" x2="30" y2="76" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="44" y1="58" x2="44" y2="76" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="54" y1="58" x2="58" y2="76" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="66" y1="56" x2="72" y2="74" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
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
      {/* Eyes — dark rounded rects, close together */}
      <rect x="28" y="26" width="10" height="9" rx="3" fill="white" />
      <rect x="50" y="26" width="10" height="9" rx="3" fill="white" />
      <rect x="30" y="27" width="7" height="7" rx="2" fill="#1a1a2e" />
      <rect x="52" y="27" width="7" height="7" rx="2" fill="#1a1a2e" />
      {/* Mouth — horizontal dash */}
      <line x1="36" y1="44" x2="52" y2="44" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */

const logos: {
  name: string
  description: string
  render: (className: string) => ReactNode
}[] = [
  {
    name: "Block",
    description:
      "Wide rounded block body, square eyes, horizontal mouth slit. Closest to the pixel crab vibe.",
    render: (cls) => <Crab1 className={cls} />,
  },
  {
    name: "Dome",
    description:
      "Dome-topped body with flat bottom. Pincer dots on the arms. Slightly softer.",
    render: (cls) => <Crab2 className={cls} />,
  },
  {
    name: "Brick",
    description:
      "Flat wide block with L-shaped raised claws. Wider mouth slot. Most geometric.",
    render: (cls) => <Crab3 className={cls} />,
  },
  {
    name: "Pebble",
    description:
      "Taller rounded body with circular eyes set high. Gentle smile. Softest feel.",
    render: (cls) => <Crab4 className={cls} />,
  },
  {
    name: "Pill",
    description:
      "Super-rounded pill body, 5 legs, V-pincers. Wide and friendly.",
    render: (cls) => <Crab5 className={cls} />,
  },
]
