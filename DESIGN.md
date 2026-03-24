# Design System — TalentClaw

## Product Context
- **What this is:** A local-first career management web app + CLI for AI-native job seekers
- **Who it's for:** Engineers, designers, and professionals who use AI agents for career search
- **Space/industry:** Career platforms (peers: Wellfound, Otta, Levels.fyi, LinkedIn)
- **Project type:** Web app / dashboard with landing page

## Aesthetic Direction
- **Direction:** Organic/Natural with editorial touches
- **Decoration level:** Intentional — subtle depth through shadow and surface layering. No gradients, no patterns, no illustrated backgrounds. Typography and spacing do the heavy lifting.
- **Mood:** A warm, personal career cockpit. Feels like a well-designed notebook, not a SaaS dashboard. Editorial personality in a space of corporate sameness.
- **Concept:** "Editorial warmth meets tool-grade precision"
- **Reference sites:** Otta (editorial personality, serif headings), Linear (tool-grade precision, dark mode), Wellfound (career platform conventions)

### Design Risks (intentional departures from category convention)
1. **Serif headings in a dashboard** — unusual, editorial, gives TalentClaw instant personality. Most career platforms use sans-serif everywhere.
2. **Green accent in a blue/purple landscape** — stands alone visually. Growth/career metaphor, no competitor collision.
3. **Warm stone neutrals instead of cool grays** — makes the product feel personal and approachable, like your own career workspace.

## Typography
- **Display/Hero:** Instrument Serif — TalentClaw's typographic signature. Distinctive in a sea of sans-serif career platforms. Use for all headings (h1–h4), card titles, and any text that needs personality.
- **Body:** DM Sans — warm, rounded, excellent x-height. Loads from Google Fonts for consistent rendering across platforms. Replaces Avenir Next (system font with inconsistent availability).
- **UI/Labels:** DM Sans (same as body)
- **Data/Tables:** DM Sans with `font-feature-settings: "tnum" 1` — tabular numerals for aligned columns and salary figures
- **Code:** JetBrains Mono — wider and more readable than SF Mono at small sizes
- **Loading:** Google Fonts CDN — `family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500`
- **Scale:**
  - 3xl: 42px — Hero headings (Instrument Serif)
  - 2xl: 32px — Page titles, section headings (Instrument Serif)
  - xl: 22px — Card headings, profile greeting (Instrument Serif)
  - lg: 18px — Job titles, sub-headings (Instrument Serif)
  - md: 16px — Body text (DM Sans)
  - sm: 14px — Secondary text, metadata (DM Sans)
  - xs: 12px — Timestamps, labels, muted text (DM Sans)
  - mono: 14px — Code blocks, CLI output (JetBrains Mono)
  - mono-sm: 12px — Inline code, badge labels (JetBrains Mono)

### Font Feature Settings
```css
/* Body */
font-feature-settings: "kern" 1, "liga" 1, "calt" 1;

/* Display (Instrument Serif) */
font-feature-settings: "liga" 1, "onum" 1;

/* Data / tabular numbers */
font-feature-settings: "tnum" 1;
```

## Color

### Approach
Restrained — emerald green accent on warm stone neutrals. Color is rare and meaningful. Green stands alone in a career platform space dominated by blue and purple.

### Light Mode
| Token | Hex | Usage |
|-------|-----|-------|
| `--accent` | `#059669` | CTAs, links, active states, success |
| `--accent-hover` | `#10b981` | Hover states |
| `--accent-subtle` | `rgba(5,150,105,0.08)` | Backgrounds for accent elements |
| `--accent-glow` | `rgba(5,150,105,0.15)` | Focus rings, hover card glow |
| `--surface` | `#fafdfb` | Page background (warm near-white with green tint) |
| `--surface-raised` | `#ffffff` | Cards, panels |
| `--surface-overlay` | `#f0f5f2` | Badges, code blocks, secondary surfaces |
| `--surface-sidebar` | `#f5f7f6` | Sidebar background |
| `--text-primary` | `#1c1917` | Headings, primary text (Stone 900) |
| `--text-secondary` | `#57534e` | Body text, descriptions (Stone 600) |
| `--text-muted` | `#a8a29e` | Timestamps, labels, placeholders (Stone 400) |
| `--border-subtle` | `rgba(0,0,0,0.05)` | Card borders, dividers |
| `--border-default` | `rgba(0,0,0,0.1)` | Input borders, stronger dividers |
| `--warning` | `#d97706` | Warnings, upcoming deadlines |
| `--danger` | `#dc2626` | Errors, rejected status |
| `--info` | `#2563eb` | Informational, saved status |

### Dark Mode
| Token | Hex | Notes |
|-------|-----|-------|
| `--accent` | `#34d399` | Desaturated for dark backgrounds |
| `--accent-hover` | `#6ee7b7` | Lighter for visibility |
| `--surface` | `#0f0f0f` | Near-black, not pure black |
| `--surface-raised` | `#1a1a1a` | Card surfaces |
| `--surface-overlay` | `#222222` | Secondary surfaces |
| `--surface-sidebar` | `#141414` | Sidebar |
| `--text-primary` | `#e7e5e4` | Stone 200 |
| `--text-secondary` | `#a8a29e` | Stone 400 |
| `--text-muted` | `#78716c` | Stone 500 |
| `--border-subtle` | `rgba(255,255,255,0.06)` | |
| `--border-default` | `rgba(255,255,255,0.1)` | |

### Dark Mode Strategy
- Invert surfaces (light → dark), keep hue relationships
- Desaturate accent by shifting from `#059669` → `#34d399` (lighter, less vibrant)
- Reduce shadow intensity, increase shadow spread
- Semantic colors shift to lighter variants for readability on dark backgrounds

### Pipeline Stage Colors
Warm, muted palette — editorial feel, no repeated hues. Each stage is visually distinct.
"Saved" is not a separate stage — saved jobs appear in "Discovered".
| Stage | Color | Hex |
|-------|-------|-----|
| Discovered | Warm Stone | `#78716c` |
| Applied | Accent (Emerald) | `#059669` |
| Interviewing | Muted Wisteria | `#8b6aaf` |
| Offer | Deep Honey Gold | `#c2820e` |
| Accepted | Warm Teal | `#1a8c80` |
| Rejected | Dusty Clay Rose | `#b85c5c` |

Each stage color is used at three intensities:
- Background: 8% opacity (`rgba(color, 0.08)`)
- Text: full color
- Border: 20% opacity (`rgba(color, 0.2)`)

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable — generous whitespace reinforces the editorial feel. Tighten for data-dense views (pipeline cards, tables).
- **Scale:**

| Token | Value | Usage |
|-------|-------|-------|
| `2xs` | 2px | Hairline gaps, icon spacing |
| `xs` | 4px | Tight inline spacing |
| `sm` | 8px | Badge padding, tight gaps |
| `md` | 16px | Standard padding, grid gaps |
| `lg` | 24px | Card padding, section gaps |
| `xl` | 32px | Large card padding |
| `2xl` | 48px | Section spacing |
| `3xl` | 64px | Page-level spacing |

## Layout
- **Approach:** Hybrid — grid-disciplined for dashboard/pipeline (data needs structure), editorial-feeling cards with generous padding
- **Grid:** Sidebar (220px fixed) + main content area. Main area uses 1–3 columns depending on breakpoint.
- **Breakpoints:**
  - `sm`: 640px (mobile → single column)
  - `md`: 768px (tablet → sidebar appears, 1-2 columns)
  - `lg`: 1024px (desktop → full sidebar, 2 columns)
  - `xl`: 1280px (wide → 2-3 columns, pipeline board expands)
  - `2xl`: 1536px (ultra-wide → max content width, centered)
- **Max content width:** 1280px (centered on ultra-wide displays)
- **Border radius:**

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 6px | Small buttons, inputs, inline badges |
| `md` | 10px | Cards, dropdowns, modals |
| `lg` | 14px | Large cards, panels |
| `xl` | 18px | Dashboard containers, hero sections |
| `full` | 9999px | Pills, avatars, status dots |

**Hierarchical rounding rule:** Larger containers get more rounding. Inner elements stay tighter. A card (`lg: 14px`) contains buttons (`sm: 6px`) and badges (`full: pill`). Never use the same radius for a container and its contents.

## Motion
- **Approach:** Intentional — spring-eased transitions that serve comprehension. No choreography, no scroll-driven animation beyond the landing page reveal. Motion serves understanding, not decoration.
- **Easing:**
  - Enter: `cubic-bezier(0.16, 1, 0.3, 1)` — spring ease-out (content appearing)
  - Exit: `ease-in` — quick departure
  - Move: `ease-in-out` — repositioning elements
- **Duration:**
  - Micro: 50–100ms — hover states, toggle switches, focus rings
  - Short: 150–250ms — button presses, tab switches, tooltip appear
  - Medium: 250–400ms — panel transitions, card expand/collapse, page-level transitions
  - Long: 400–700ms — scroll-reveal animations (landing page only)
- **Reduced motion:** All animations and transitions disabled via `@media (prefers-reduced-motion: reduce)`
- **Specific patterns:**
  - Chat panel: slide in from right, 300ms, spring easing
  - Chat bubbles: fade + slide up + subtle scale, 300ms
  - Scroll reveals: fade + translate-y(24px), 700ms, staggered 100ms per element
  - Pipeline drag: optimistic UI with spring settle

## Shadows
| Token | Value | Usage |
|-------|-------|-------|
| `sm` | `0 1px 2px rgba(0,0,0,0.04)` | Subtle card depth |
| `md` | `0 4px 12px rgba(0,0,0,0.06)` | Raised cards, dropdowns |
| `lg` | `0 8px 24px rgba(0,0,0,0.08)` | Modals, chat panel |
| `glow` | `0 4px 24px rgba(5,150,105,0.08), 0 0 0 1px rgba(5,150,105,0.1)` | Accent hover glow on cards |

In dark mode, increase shadow opacity by 3–4x and use pure black.

## Empty States
Every view must have a designed empty state. Empty states should:
- Use Instrument Serif for the heading (maintain editorial personality)
- Include a brief, helpful description (DM Sans, text-secondary)
- Offer a clear next action (button or link)
- Match the SOUL.md tone — warm, professional, encouraging
- Never use "No data found" or generic placeholder text

Examples:
- Pipeline empty: "Your pipeline is clear. Run `talentclaw search` to discover opportunities."
- Inbox empty: "No messages yet. When employers reach out, they'll appear here."
- Activity empty: "Nothing here yet. Your activity will show up as you search, save, and apply."

## AI Slop Prevention
When building new UI surfaces, avoid these patterns that make products look AI-generated:
- Purple/violet gradients as default accent (use emerald green)
- 3-column feature grids with icons in colored circles
- Centered everything with uniform spacing
- Uniform bubbly border-radius on all elements (use hierarchical rounding)
- Gradient buttons as primary CTA (use flat accent color)
- Generic "Built for X" marketing copy

Instead: use the editorial voice from SOUL.md, asymmetric layouts where appropriate, and the specific type/color/spacing tokens defined above.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-18 | Initial design system created | Created by /design-consultation based on competitive research (Wellfound, Otta, Levels.fyi, Linear, Contra) and existing codebase analysis |
| 2026-03-18 | DM Sans replaces Avenir Next for body | Avenir Next is a system font with inconsistent availability; DM Sans loads from Google Fonts for reliable rendering, pairs well with Instrument Serif |
| 2026-03-18 | JetBrains Mono replaces SF Mono / Fira Code | Wider glyphs, more readable at small sizes, consistent cross-platform rendering |
| 2026-03-18 | Dark mode strategy defined | Near-black surfaces (#0f0f0f), desaturated accent (#34d399), inverted text hierarchy |
| 2026-03-18 | Hierarchical border radius scale added | sm(6) md(10) lg(14) xl(18) full(pill) — containers get more rounding than contents |
| 2026-03-18 | Empty state guidelines added | Every new view needs a designed empty state matching SOUL.md tone |
