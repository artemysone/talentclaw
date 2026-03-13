// ---------------------------------------------------------------------------
// Career Hub — realistic SVG illustration for the landing page
// Faithfully represents the actual dashboard: sidebar, profile card,
// career graph constellation, upcoming actions, and activity feed.
// ---------------------------------------------------------------------------

const FONT_SERIF = '"Instrument Serif", Georgia, serif'
const FONT_SANS = '"Avenir Next", system-ui, sans-serif'
const FONT_MONO = '"SF Mono", monospace'

// -- Career graph data (looks like a real d3-force layout) ------------------

const graphNodes = [
  // Person (center)
  { id: "alex", x: 412, y: 385, r: 16, label: "Alex Chen", color: "#059669" },
  // Companies (blue, upper-right)
  { id: "stripe", x: 524, y: 292, r: 10, label: "Stripe", color: "#3b82f6" },
  { id: "figma", x: 558, y: 362, r: 9, label: "Figma", color: "#3b82f6" },
  { id: "plaid", x: 508, y: 342, r: 8, label: "Plaid", color: "#3b82f6" },
  // Roles (purple, right)
  { id: "staffeng", x: 548, y: 435, r: 9, label: "Staff Engineer", color: "#8b5cf6" },
  { id: "srfront", x: 498, y: 472, r: 8, label: "Sr. Frontend", color: "#8b5cf6" },
  { id: "techlead", x: 468, y: 305, r: 8, label: "Tech Lead", color: "#8b5cf6" },
  // Skills (amber, upper-left)
  { id: "react", x: 308, y: 296, r: 10, label: "React", color: "#f59e0b" },
  { id: "ts", x: 278, y: 346, r: 9, label: "TypeScript", color: "#f59e0b" },
  { id: "graphql", x: 348, y: 266, r: 8, label: "GraphQL", color: "#f59e0b" },
  { id: "dessys", x: 252, y: 288, r: 8, label: "Design Systems", color: "#f59e0b" },
  // Projects (pink, lower-left)
  { id: "payments", x: 300, y: 466, r: 8, label: "Payments SDK", color: "#ec4899" },
  { id: "destok", x: 340, y: 505, r: 7, label: "Design Tokens", color: "#ec4899" },
  { id: "apigw", x: 262, y: 488, r: 7, label: "API Gateway", color: "#ec4899" },
  // Education (cyan, top)
  { id: "stanford", x: 428, y: 256, r: 9, label: "Stanford CS", color: "#06b6d4" },
  // Industries (orange, bottom)
  { id: "fintech", x: 380, y: 525, r: 8, label: "Fintech", color: "#f97316" },
  { id: "devtools", x: 478, y: 515, r: 8, label: "Dev Tools", color: "#f97316" },
]

const graphEdges = [
  // Alex → companies
  ["alex", "stripe"], ["alex", "figma"], ["alex", "plaid"],
  // Alex → skills
  ["alex", "react"], ["alex", "ts"], ["alex", "graphql"], ["alex", "dessys"],
  // Alex → education
  ["alex", "stanford"],
  // Alex → industries
  ["alex", "fintech"], ["alex", "devtools"],
  // Company → role
  ["stripe", "staffeng"], ["stripe", "techlead"], ["figma", "srfront"],
  // Skill → project
  ["react", "destok"], ["react", "payments"], ["ts", "apigw"], ["ts", "payments"],
  ["dessys", "destok"],
  // Role → skill cross-links
  ["staffeng", "react"], ["staffeng", "ts"],
  ["srfront", "react"], ["srfront", "dessys"],
  ["techlead", "graphql"],
  // Industry cross-links
  ["fintech", "stripe"], ["fintech", "plaid"],
]

const nodeMap = new Map(graphNodes.map((n) => [n.id, n]))

// -- Pipeline pills ---------------------------------------------------------

const pills = [
  { label: "Discovered 5", w: 72, bg: "#f1f5f9", border: "#cbd5e1", text: "#475569" },
  { label: "Saved 3", w: 42, bg: "#eff6ff", border: "#bfdbfe", text: "#2563eb" },
  { label: "Applied 2", w: 50, bg: "rgba(5,150,105,0.08)", border: "rgba(5,150,105,0.2)", text: "#059669" },
  { label: "Interviewing 1", w: 76, bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.2)", text: "#7c3aed" },
  { label: "Offer 0", w: 40, bg: "#F0F5F2", border: "rgba(0,0,0,0.06)", text: "#a8a29e" },
]

// -- Component --------------------------------------------------------------

interface CareerHubIllustrationProps {
  className?: string
}

export function CareerHubIllustration({
  className = "",
}: CareerHubIllustrationProps) {
  // Compute pill x positions
  let pillX = 228
  const pillPositions = pills.map((p) => {
    const x = pillX
    pillX += p.w + 14 // pill width + gap + arrow space
    return x
  })

  return (
    <svg
      viewBox="0 0 960 620"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="TalentClaw Career Hub dashboard"
    >
      <defs>
        <filter id="card-shadow" x="-2%" y="-2%" width="104%" height="108%">
          <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#000" floodOpacity="0.04" />
        </filter>
        <filter id="window-shadow" x="-2%" y="-2%" width="104%" height="108%">
          <feDropShadow dx="0" dy="4" stdDeviation="16" floodColor="#059669" floodOpacity="0.06" />
        </filter>
        <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ================================================================== */}
      {/* WINDOW FRAME                                                       */}
      {/* ================================================================== */}
      <rect x="0" y="0" width="960" height="620" rx="12" fill="#FAFDFB" filter="url(#window-shadow)" />
      <rect x="0" y="0" width="960" height="620" rx="12" fill="none" stroke="#ddd9d6" strokeWidth="0.75" />

      {/* Title bar */}
      <rect x="0" y="0" width="960" height="34" rx="12" fill="#F0F0EE" />
      <rect x="0" y="18" width="960" height="16" fill="#F0F0EE" />
      <line x1="0" y1="34" x2="960" y2="34" stroke="#ddd9d6" strokeWidth="0.5" />
      {/* Traffic lights */}
      <circle cx="20" cy="17" r="5" fill="#fc5753" />
      <circle cx="38" cy="17" r="5" fill="#fdbc40" />
      <circle cx="56" cy="17" r="5" fill="#33c748" />

      {/* ================================================================== */}
      {/* SIDEBAR                                                            */}
      {/* ================================================================== */}
      <rect x="0" y="34" width="178" height="586" fill="#F5F7F6" />
      {/* Bottom-left corner rounding */}
      <rect x="0" y="604" width="12" height="16" rx="12" fill="#F5F7F6" />
      <line x1="178" y1="34" x2="178" y2="620" stroke="rgba(0,0,0,0.07)" strokeWidth="0.5" />

      {/* Brand bar */}
      <line x1="0" y1="90" x2="178" y2="90" stroke="rgba(0,0,0,0.07)" strokeWidth="0.5" />
      {/* Crab logo — scaled down from the actual component */}
      <g transform="translate(18,49) scale(0.27)">
        <line x1="26" y1="56" x2="20" y2="74" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="38" y1="58" x2="34" y2="76" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="50" y1="58" x2="54" y2="76" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="62" y1="56" x2="68" y2="74" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="10" y1="30" x2="2" y2="22" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="78" y1="30" x2="86" y2="22" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="2" y1="22" x2="0" y2="14" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="2" y1="22" x2="8" y2="16" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="86" y1="22" x2="88" y2="14" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="86" y1="22" x2="80" y2="16" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="10" y="14" width="68" height="46" rx="23" fill="#059669" />
        <rect x="28" y="26" width="10" height="9" rx="3" fill="white" />
        <rect x="50" y="26" width="10" height="9" rx="3" fill="white" />
        <rect x="30" y="27" width="7" height="7" rx="2" fill="#1a1a2e" />
        <rect x="52" y="27" width="7" height="7" rx="2" fill="#1a1a2e" />
        <line x1="36" y1="44" x2="52" y2="44" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      </g>
      <text x="46" y="66" fontFamily={FONT_SANS} fontSize="14" fontWeight="600" fill="#1c1917">
        talentclaw
      </text>

      {/* VIEWS section label */}
      <text x="20" y="112" fontFamily={FONT_SANS} fontSize="10" fontWeight="500" fill="#a8a29e" letterSpacing="0.08em">
        VIEWS
      </text>

      {/* Career Hub — active */}
      <rect x="12" y="122" width="154" height="32" rx="8" fill="rgba(5,150,105,0.08)" />
      <line x1="12" y1="126" x2="12" y2="150" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
      {/* Home icon */}
      <g transform="translate(24,131)">
        <path d="M7 1L13 6.5V13H8.5V9H5.5V13H1V6.5L7 1Z" stroke="#059669" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
      </g>
      <text x="44" y="142" fontFamily={FONT_SANS} fontSize="13" fontWeight="500" fill="#059669">
        Career Hub
      </text>

      {/* Jobs */}
      <g transform="translate(24,163)">
        <rect x="1" y="5" width="12" height="7" rx="1.5" stroke="#57534e" strokeWidth="1.2" fill="none" />
        <path d="M4 5V3.5C4 2.7 4.7 2 5.5 2H8.5C9.3 2 10 2.7 10 3.5V5" stroke="#57534e" strokeWidth="1.2" fill="none" />
      </g>
      <text x="44" y="176" fontFamily={FONT_SANS} fontSize="13" fill="#57534e">
        Jobs
      </text>
      <rect x="130" y="168" width="26" height="18" rx="9" fill="#F0F5F2" />
      <text x="143" y="180" fontFamily={FONT_SANS} fontSize="10" fill="#a8a29e" textAnchor="middle">
        12
      </text>

      {/* Pipeline */}
      <g transform="translate(24,195)">
        <rect x="1" y="1" width="12" height="12" rx="2" stroke="#57534e" strokeWidth="1.2" fill="none" />
        <line x1="5" y1="4" x2="5" y2="10" stroke="#57534e" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="9" y1="4" x2="9" y2="7" stroke="#57534e" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      <text x="44" y="208" fontFamily={FONT_SANS} fontSize="13" fill="#57534e">
        Pipeline
      </text>
      <rect x="130" y="200" width="26" height="18" rx="9" fill="#F0F5F2" />
      <text x="143" y="212" fontFamily={FONT_SANS} fontSize="10" fill="#a8a29e" textAnchor="middle">
        3
      </text>

      {/* Separator */}
      <line x1="12" y1="232" x2="166" y2="232" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />

      {/* FILES section label */}
      <text x="20" y="254" fontFamily={FONT_SANS} fontSize="10" fontWeight="500" fill="#a8a29e" letterSpacing="0.08em">
        FILES
      </text>

      {/* File tree */}
      {[
        { name: "profile.md", isDir: false, y: 274 },
        { name: "jobs/", isDir: true, y: 292 },
        { name: "applications/", isDir: true, y: 310 },
        { name: "contacts/", isDir: true, y: 328 },
        { name: "activity.log", isDir: false, y: 346 },
      ].map((f) => (
        <g key={f.name}>
          {f.isDir ? (
            <g transform={`translate(24,${f.y - 5})`}>
              <rect x="0" y="2" width="11" height="8" rx="1" fill="#a8a29e" opacity="0.25" />
              <rect x="0" y="0" width="5" height="3" rx="0.8" fill="#a8a29e" opacity="0.25" />
            </g>
          ) : (
            <g transform={`translate(24,${f.y - 6})`}>
              <rect x="1" y="0" width="9" height="11" rx="1" fill="none" stroke="#a8a29e" strokeWidth="0.8" opacity="0.4" />
              <path d="M7 0L10 3" stroke="#a8a29e" strokeWidth="0.6" opacity="0.3" />
            </g>
          )}
          <text x="40" y={f.y + 1} fontFamily={FONT_MONO} fontSize="10.5" fill="#78716c" opacity="0.7">
            {f.name}
          </text>
        </g>
      ))}

      {/* ================================================================== */}
      {/* MAIN CONTENT AREA                                                  */}
      {/* ================================================================== */}

      {/* ── Profile Card ─────────────────────────────────────────────────── */}
      <rect x="202" y="56" width="420" height="118" rx="14" fill="white" stroke="rgba(0,0,0,0.05)" strokeWidth="0.75" filter="url(#card-shadow)" />

      {/* Greeting */}
      <text x="226" y="88" fontFamily={FONT_SERIF} fontSize="18" fontWeight="700" fill="#1c1917">
        Good morning, Alex
      </text>

      {/* "View board →" link */}
      <text x="598" y="86" fontFamily={FONT_SANS} fontSize="11" fill="#059669" textAnchor="end">
        {"View board →"}
      </text>

      {/* Headline */}
      <text x="226" y="108" fontFamily={FONT_SANS} fontSize="12" fill="#57534e">
        Senior Software Engineer · Building developer tools
      </text>

      {/* Pipeline funnel pills */}
      {pills.map((p, i) => {
        const px = pillPositions[i]
        return (
          <g key={p.label}>
            {i > 0 && (
              <text
                x={px - 9}
                y="145"
                fontFamily={FONT_SANS}
                fontSize="9"
                fill="#a8a29e"
                opacity="0.4"
                textAnchor="middle"
              >
                →
              </text>
            )}
            <rect
              x={px}
              y="131"
              width={p.w}
              height="22"
              rx="11"
              fill={p.bg}
              stroke={p.border}
              strokeWidth="0.5"
            />
            <text
              x={px + p.w / 2}
              y="145"
              fontFamily={FONT_SANS}
              fontSize="10"
              fontWeight="500"
              fill={p.text}
              textAnchor="middle"
            >
              {p.label}
            </text>
          </g>
        )
      })}

      {/* ── Career Graph Card ────────────────────────────────────────────── */}
      <rect x="202" y="198" width="420" height="400" rx="14" fill="white" stroke="rgba(0,0,0,0.05)" strokeWidth="0.75" filter="url(#card-shadow)" />

      {/* Graph edges */}
      {graphEdges.map(([srcId, tgtId], i) => {
        const s = nodeMap.get(srcId)
        const t = nodeMap.get(tgtId)
        if (!s || !t) return null
        return (
          <line
            key={i}
            x1={s.x}
            y1={s.y}
            x2={t.x}
            y2={t.y}
            stroke="rgba(0,0,0,0.07)"
            strokeWidth="0.8"
          />
        )
      })}

      {/* Graph nodes + labels */}
      {graphNodes.map((n) => {
        const isPerson = n.id === "alex"
        return (
          <g key={n.id}>
            {/* Node circle */}
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r}
              fill={n.color}
              opacity="0.85"
              filter={isPerson ? "url(#node-glow)" : undefined}
            />
            {/* Subtle border ring */}
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r}
              fill="none"
              stroke={n.color}
              strokeWidth="0.5"
              opacity="0.25"
            />
            {/* Center dot for person node */}
            {isPerson && (
              <circle cx={n.x} cy={n.y} r={5} fill="white" opacity="0.9" />
            )}
            {/* Label */}
            <text
              x={n.x}
              y={n.y + n.r + 12}
              fontFamily={FONT_SANS}
              fontSize={isPerson ? "11" : "10"}
              fontWeight={isPerson ? "600" : "400"}
              fill="rgba(28,25,23,0.6)"
              textAnchor="middle"
            >
              {n.label}
            </text>
          </g>
        )
      })}

      {/* Zoom controls (bottom-right of graph card) */}
      {[
        { label: "+", y: 548 },
        { label: "\u2212", y: 564 },
        { label: "\u21B4", y: 580 },
      ].map((btn, i) => (
        <g key={i}>
          <rect
            x={btn.label === "+" ? 592 : 592}
            y={btn.y}
            width="20"
            height="14"
            rx="3"
            fill="white"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="0.5"
          />
          <text
            x={602}
            y={btn.y + 10.5}
            fontFamily={FONT_SANS}
            fontSize="10"
            fill="#a8a29e"
            textAnchor="middle"
          >
            {btn.label}
          </text>
        </g>
      ))}

      {/* ── Upcoming Actions Card ────────────────────────────────────────── */}
      <rect x="646" y="56" width="292" height="170" rx="14" fill="white" stroke="rgba(0,0,0,0.05)" strokeWidth="0.75" filter="url(#card-shadow)" />

      <text x="670" y="82" fontFamily={FONT_SANS} fontSize="13" fontWeight="600" fill="#1c1917">
        Upcoming Actions
      </text>

      {/* Action items */}
      {[
        {
          dot: "#d97706",
          title: "Follow up on application",
          sub: "Acme Corp · 2026-03-14",
          urgent: true,
        },
        {
          dot: "#059669",
          title: "Submit coding challenge",
          sub: "Figma · 2026-03-18",
          urgent: false,
        },
        {
          dot: "#059669",
          title: "Prepare for interview",
          sub: "Linear · 2026-03-22",
          urgent: false,
        },
      ].map((action, i) => {
        const y = 108 + i * 36
        return (
          <g key={i}>
            <circle cx={674} cy={y + 6} r={3.5} fill={action.dot} />
            <text x={688} y={y + 5} fontFamily={FONT_SANS} fontSize="12" fontWeight="500" fill="#1c1917">
              {action.title}
            </text>
            <text x={688} y={y + 19} fontFamily={FONT_SANS} fontSize="10" fill="#a8a29e">
              {action.sub}
              {action.urgent && (
                <tspan fill="#dc2626" fontWeight="500">
                  {" "}
                  Overdue
                </tspan>
              )}
            </text>
          </g>
        )
      })}

      {/* ── Activity Feed Card ───────────────────────────────────────────── */}
      <rect x="646" y="250" width="292" height="348" rx="14" fill="white" stroke="rgba(0,0,0,0.05)" strokeWidth="0.75" filter="url(#card-shadow)" />

      <text x="670" y="278" fontFamily={FONT_SANS} fontSize="13" fontWeight="600" fill="#1c1917">
        Recent Activity
      </text>
      <text x="776" y="278" fontFamily={FONT_MONO} fontSize="9" fill="#a8a29e" opacity="0.6">
        activity.log
      </text>

      {/* Activity entries */}
      {[
        {
          iconBg: "rgba(5,150,105,0.08)",
          iconColor: "#059669",
          iconType: "search",
          title: "Discovered 3 new matches",
          slug: "jobs/",
          time: "2h ago",
        },
        {
          iconBg: "rgba(139,92,246,0.1)",
          iconColor: "#8b5cf6",
          iconType: "send",
          title: "Applied to Staff Engineer",
          slug: "stripe-staff-engineer",
          time: "5h ago",
        },
        {
          iconBg: "rgba(16,185,129,0.1)",
          iconColor: "#10b981",
          iconType: "message",
          title: "Message from Figma recruiter",
          slug: "messages/figma-recruiter",
          time: "Yesterday",
        },
        {
          iconBg: "rgba(59,130,246,0.1)",
          iconColor: "#3b82f6",
          iconType: "bookmark",
          title: "Saved Product Engineer",
          slug: "vercel-product-engineer",
          time: "2d ago",
        },
        {
          iconBg: "rgba(245,158,11,0.1)",
          iconColor: "#f59e0b",
          iconType: "star",
          title: "Interview scheduled",
          slug: "linear-sr-frontend",
          time: "3d ago",
        },
      ].map((entry, i) => {
        const y = 300 + i * 52
        return (
          <g key={i}>
            {/* Separator line (not on first) */}
            {i > 0 && (
              <line x1={670} y1={y - 6} x2={924} y2={y - 6} stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" />
            )}
            {/* Icon square */}
            <rect x={670} y={y} width={24} height={24} rx={6} fill={entry.iconBg} />
            {/* Mini icon */}
            <g transform={`translate(${676},${y + 6})`}>
              {entry.iconType === "search" && (
                <>
                  <circle cx="5" cy="5" r="3.5" stroke={entry.iconColor} strokeWidth="1.3" fill="none" />
                  <line x1="7.5" y1="7.5" x2="10.5" y2="10.5" stroke={entry.iconColor} strokeWidth="1.3" strokeLinecap="round" />
                </>
              )}
              {entry.iconType === "send" && (
                <path d="M1 11L11 6L1 1L3 6L1 11Z" stroke={entry.iconColor} strokeWidth="1" fill="none" strokeLinejoin="round" />
              )}
              {entry.iconType === "message" && (
                <>
                  <rect x="0.5" y="0.5" width="11" height="8" rx="1.5" stroke={entry.iconColor} strokeWidth="1.2" fill="none" />
                  <path d="M3 8.5L1.5 11.5L5 8.5" fill={entry.iconColor} opacity="0.6" />
                </>
              )}
              {entry.iconType === "bookmark" && (
                <path d="M2.5 1H9.5V11L6 8.5L2.5 11V1Z" stroke={entry.iconColor} strokeWidth="1.2" fill="none" />
              )}
              {entry.iconType === "star" && (
                <path d="M6 1L7.4 4.2L11 4.6L8.3 7L9 10.5L6 8.8L3 10.5L3.7 7L1 4.6L4.6 4.2Z" fill={entry.iconColor} opacity="0.8" />
              )}
            </g>
            {/* Title */}
            <text x={702} y={y + 10} fontFamily={FONT_SANS} fontSize="12" fontWeight="500" fill="#1c1917">
              {entry.title}
            </text>
            {/* Slug */}
            <text x={702} y={y + 23} fontFamily={FONT_SANS} fontSize="10" fill="#a8a29e">
              {entry.slug}
            </text>
            {/* Time */}
            <text x={924} y={y + 10} fontFamily={FONT_SANS} fontSize="10" fill="#a8a29e" textAnchor="end">
              {entry.time}
            </text>
          </g>
        )
      })}

      {/* Footer line */}
      <line x1={670} y1={560} x2={924} y2={560} stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" />
      <text x={670} y={578} fontFamily={FONT_SANS} fontSize="10" fill="#a8a29e">
        Showing last 5 entries
      </text>
    </svg>
  )
}
