/**
 * Seed script — populates ~/.talentclaw/ with realistic dev data.
 * Run: bun scripts/seed.ts
 * Re-run: overwrites everything (idempotent).
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

const DATA_DIR = join(homedir(), ".talentclaw")
const dirs = ["jobs", "applications", "companies", "contacts", "messages"]
for (const d of dirs) mkdirSync(join(DATA_DIR, d), { recursive: true })

function write(relPath: string, content: string) {
  writeFileSync(join(DATA_DIR, relPath), content.trimStart(), "utf-8")
}

// ── Profile ───────────────────────────────────────────────
write(
  "profile.md",
  `
---
display_name: Jordan Blue
headline: "Senior Full-Stack Engineer | TypeScript, React, Node.js"
skills:
  - TypeScript
  - React
  - Node.js
  - Next.js
  - PostgreSQL
  - AWS
  - System Design
  - API Design
experience_years: 8
preferred_roles:
  - Senior Software Engineer
  - Staff Engineer
  - Engineering Lead
preferred_locations:
  - San Francisco, CA
  - Remote
remote_preference: remote_ok
salary_range:
  min: 180000
  max: 250000
  currency: USD
availability: active
updated_at: "2026-03-10"
---

## Career Context

### Career Arc
Started in backend services at a mid-stage fintech, moved to full-stack roles building developer tools and internal platforms. Spent the last 3 years leading a small team shipping a real-time collaboration SDK. Strong on systems thinking, pragmatic about tradeoffs.

### Core Strengths
Deep TypeScript expertise across the stack — from React SPAs to Node.js microservices to CLI tooling. Comfortable owning the full lifecycle: architecture, implementation, deployment, and on-call. Good at making complex systems feel simple to use.

### Current Situation
Wrapping up a contract and actively exploring what's next. Open to both IC and tech-lead roles at companies building developer-facing products or infrastructure.

### What I'm Looking For
A team that ships frequently, cares about craft, and builds things developers love. Ideally a Series B+ company or mature startup where I can have real impact without 12 layers of process.

### Constraints
- Need to stay remote-friendly (based in SF but travel ~2x/year)
- Not interested in crypto/web3
- Prefer to avoid on-call rotations heavier than 1 week per quarter
`,
)

// ── Jobs ──────────────────────────────────────────────────
write(
  "jobs/stripe-platform-engineer.md",
  `
---
title: Senior Platform Engineer
company: Stripe
location: San Francisco, CA
remote: hybrid
compensation:
  min: 200000
  max: 280000
  currency: USD
url: https://stripe.com/jobs/platform-engineer
source: manual
status: discovered
match_score: 92
tags:
  - TypeScript
  - Distributed Systems
  - API Design
  - Ruby
discovered_at: "2026-03-11"
---

## About the Role
Build and maintain Stripe's internal developer platform powering thousands of microservices. Focus on developer experience, build tooling, and service mesh infrastructure.

## Why It's Interesting
Strong alignment with platform engineering experience. Stripe's eng culture is well-regarded. Hybrid in SF works with my location.

## Concerns
- Ruby is a significant part of the stack — may need ramp-up time
- Large org dynamics could slow things down
`,
)

write(
  "jobs/vercel-dx-engineer.md",
  `
---
title: Developer Experience Engineer
company: Vercel
location: Remote
remote: remote
compensation:
  min: 190000
  max: 260000
  currency: USD
url: https://vercel.com/careers/dx-engineer
source: manual
status: discovered
match_score: 88
tags:
  - Next.js
  - TypeScript
  - Developer Tools
  - Technical Writing
discovered_at: "2026-03-10"
---

## About the Role
Improve the developer experience of Next.js and Vercel's deployment platform. Create examples, tooling, and documentation that help developers ship faster.

## Why It's Interesting
Directly in my wheelhouse — Next.js is my daily driver. Fully remote. High-visibility work.

## Concerns
- Heavy documentation focus may not scratch the systems-building itch
`,
)

write(
  "jobs/linear-fullstack.md",
  `
---
title: Full-Stack Engineer
company: Linear
location: Remote
remote: remote
compensation:
  min: 180000
  max: 240000
  currency: USD
url: https://linear.app/careers
source: manual
status: discovered
match_score: 95
tags:
  - TypeScript
  - React
  - Node.js
  - Real-time
  - PostgreSQL
discovered_at: "2026-03-12"
---

## About the Role
Build features across Linear's project management tool. Small team, high autonomy, focus on craft and performance.

## Why It's Interesting
Top match score for a reason — small team, ships fast, deeply cares about UX and performance. Tech stack is exactly my sweet spot.

## Concerns
- Small team means broad scope, which is fine but could mean less depth
`,
)

write(
  "jobs/notion-senior-eng.md",
  `
---
title: Senior Software Engineer — Collaboration
company: Notion
location: San Francisco, CA
remote: hybrid
compensation:
  min: 195000
  max: 270000
  currency: USD
url: https://notion.so/careers
source: manual
status: saved
match_score: 84
tags:
  - TypeScript
  - React
  - Real-time Collaboration
  - WebSocket
discovered_at: "2026-03-08"
---

## About the Role
Work on Notion's real-time collaboration engine — the CRDT-based system that powers multiplayer editing.

## Why It's Interesting
Real-time collab is my background from the last 3 years. CRDTs are fascinating and this would deepen that expertise. SF hybrid works.

## Concerns
- Notion's a big company now — may feel more corporate than startup
`,
)

write(
  "jobs/figma-infra.md",
  `
---
title: Infrastructure Engineer
company: Figma
location: San Francisco, CA
remote: hybrid
compensation:
  min: 210000
  max: 290000
  currency: USD
url: https://figma.com/careers
source: manual
status: saved
match_score: 76
tags:
  - TypeScript
  - C++
  - WebAssembly
  - Infrastructure
discovered_at: "2026-03-06"
---

## About the Role
Maintain and extend Figma's rendering and collaboration infrastructure. Mix of TypeScript services and performance-critical C++/WASM code.

## Why It's Interesting
Fascinating technical challenges. Great comp. Would push me into lower-level systems work.

## Concerns
- C++/WASM is outside my core — significant ramp-up
- Match score reflects the stack gap
`,
)

write(
  "jobs/datadog-senior-frontend.md",
  `
---
title: Senior Frontend Engineer — Dashboards
company: Datadog
location: New York, NY
remote: hybrid
compensation:
  min: 190000
  max: 265000
  currency: USD
url: https://datadog.com/careers
source: manual
status: applied
match_score: 81
tags:
  - TypeScript
  - React
  - Data Visualization
  - Performance
discovered_at: "2026-03-01"
---

## About the Role
Build Datadog's dashboard and visualization experiences. Data-heavy React application with complex state management and rendering optimization.

## Why It's Interesting
Interesting data-viz challenges. Strong engineering org. Good comp.

## Concerns
- NY-based with hybrid requirement — would need to negotiate remote
- Frontend-only scope might feel limiting
`,
)

write(
  "jobs/supabase-backend.md",
  `
---
title: Backend Engineer — Auth & Edge Functions
company: Supabase
location: Remote
remote: remote
compensation:
  min: 170000
  max: 230000
  currency: USD
url: https://supabase.com/careers
source: manual
status: applied
match_score: 87
tags:
  - TypeScript
  - Deno
  - PostgreSQL
  - Auth
  - Edge Computing
discovered_at: "2026-02-28"
---

## About the Role
Own Supabase's authentication system and edge functions runtime. Build the serverless compute layer that developers deploy to.

## Why It's Interesting
Open source, fully remote, developer tools — checks all boxes. Auth + edge functions is a meaty scope. Growing fast.

## Concerns
- Deno runtime is different from Node.js — some adjustment needed
- Comp range is slightly below my target
`,
)

write(
  "jobs/planetscale-staff.md",
  `
---
title: Staff Engineer — Developer Platform
company: PlanetScale
location: Remote
remote: remote
compensation:
  min: 220000
  max: 300000
  currency: USD
url: https://planetscale.com/careers
source: referral
status: interviewing
match_score: 90
tags:
  - TypeScript
  - Go
  - MySQL
  - Developer Tools
  - CLI
discovered_at: "2026-02-20"
---

## About the Role
Lead technical direction for PlanetScale's developer-facing tools — CLI, dashboard, SDK, and API. Staff-level IC role with cross-team influence.

## Why It's Interesting
Staff-level scope at a company I genuinely admire. Developer tools focus aligns perfectly. Remote + strong comp. Referral from a former colleague (Sam Chen) gives an inside track.

## Interview Progress
- Phone screen ✅ (Feb 25)
- Technical deep-dive ✅ (Mar 3) — went well, strong rapport with hiring manager
- System design round scheduled Mar 17

## Concerns
- Go is a secondary language for me — they seem okay with TypeScript-heavy background
`,
)

write(
  "jobs/fly-io-senior.md",
  `
---
title: Senior Engineer — App Platform
company: Fly.io
location: Remote
remote: remote
compensation:
  min: 195000
  max: 260000
  currency: USD
url: https://fly.io/jobs
source: manual
status: offer
match_score: 86
tags:
  - TypeScript
  - Rust
  - Infrastructure
  - Developer Tools
discovered_at: "2026-02-10"
---

## About the Role
Build Fly.io's application deployment platform. Mix of TypeScript services and Rust-based infrastructure. Focus on making deployment feel magical.

## Offer Details
- Base: $210,000
- Equity: 0.08% over 4 years
- Signing bonus: $15,000
- Start date flexible (April or May 2026)
- Unlimited PTO, fully remote

## Why It's Interesting
Small, scrappy team building genuinely useful infra. Offer is solid. Would learn Rust on the job — they're supportive of that.

## Concerns
- Comp is mid-range for my targets
- Rust learning curve is real
- Want to see how PlanetScale interviews go before deciding
`,
)

write(
  "jobs/cloudflare-workers.md",
  `
---
title: Senior Engineer — Workers Runtime
company: Cloudflare
location: Austin, TX
remote: hybrid
compensation:
  min: 185000
  max: 255000
  currency: USD
url: https://cloudflare.com/careers
source: manual
status: rejected
match_score: 79
tags:
  - TypeScript
  - V8
  - Edge Computing
  - C++
discovered_at: "2026-02-05"
---

## About the Role
Work on the Cloudflare Workers JavaScript runtime — V8 isolates, edge computing, and performance optimization.

## Rejection Notes
Passed after the technical phone screen (Mar 1). Feedback: strong on systems design but they wanted deeper V8/C++ internals experience. Fair assessment — this was a stretch role.

## Takeaway
Confirmed that pure runtime/VM roles need more low-level experience than I have today. Better to focus on platform/tooling roles where my full-stack depth is the asset.
`,
)

// ── Applications ──────────────────────────────────────────
write(
  "applications/datadog-senior-frontend.md",
  `
---
job: datadog-senior-frontend
status: applied
applied_at: "2026-03-05"
next_step: Technical phone screen
next_step_date: "2026-03-18"
---

## Application Notes
Applied directly. Recruiter confirmed receipt same day. Phone screen scheduled for March 18 with the dashboards team lead.

## Prep
- Review D3.js and Canvas API basics
- Prepare examples from the real-time collab SDK (data-heavy rendering)
- Research Datadog's dashboard architecture (blog posts)
`,
)

write(
  "applications/supabase-backend.md",
  `
---
job: supabase-backend
status: applied
applied_at: "2026-03-04"
next_step: Portfolio review with eng manager
next_step_date: "2026-03-15"
---

## Application Notes
Applied directly. They have an async portfolio review step before scheduling a call — sent links to open-source work and a write-up of the auth system I built at my last role.

## Prep
- Clean up the auth middleware example repo
- Prepare to walk through edge function architecture decisions
`,
)

write(
  "applications/planetscale-staff.md",
  `
---
job: planetscale-staff
status: interviewing
applied_at: "2026-02-22"
next_step: System design interview
next_step_date: "2026-03-17"
---

## Application Notes
Referred by Sam Chen (former colleague, now on their infra team). Process has been smooth — they move fast.

## Interview Log
- **Feb 25** — Phone screen with recruiter. Standard background + motivation chat. ~30 min.
- **Mar 3** — Technical deep-dive with hiring manager (Alex Rivera). Discussed CLI architecture, developer workflow optimization, and how I'd approach SDK versioning. Strong mutual interest.
- **Mar 17** — System design round. 2 interviewers, 90 minutes. Prompt: "Design a database branching system."

## Prep
- Study PlanetScale's branching model in depth
- Prepare diagrams for branch-based schema migration workflows
- Review Go concurrency patterns (likely to come up)
- Practice system design at the staff level — focus on cross-team coordination and API contracts
`,
)

write(
  "applications/fly-io-senior.md",
  `
---
job: fly-io-senior
status: offer
applied_at: "2026-02-15"
next_step: Respond to offer
next_step_date: "2026-03-16"
---

## Application Notes
Applied directly. Full process took about 3 weeks — very efficient.

## Interview Log
- **Feb 18** — Recruiter call
- **Feb 24** — Technical pair programming (built a simple deployment orchestrator in TypeScript)
- **Feb 28** — System design (edge routing + failover)
- **Mar 5** — Team fit conversation with 2 engineers + VP Eng
- **Mar 10** — Offer extended

## Decision
Strong offer but waiting to see how PlanetScale goes. Deadline to respond is March 16. Should ask for a 1-week extension if PlanetScale's system design isn't until March 17.
`,
)

write(
  "applications/cloudflare-workers.md",
  `
---
job: cloudflare-workers
status: rejected
applied_at: "2026-02-08"
---

## Application Notes
Applied directly. Quick process — phone screen on Feb 15, rejection on Mar 1.

## Feedback
Recruiter shared that the team wanted deeper V8 internals and C++ systems programming experience. My TypeScript and platform skills were strong but not the right fit for this particular role.

## Lessons
Good signal on where my boundaries are. Runtime/VM work needs a different skill profile than what I bring. Refocused search on platform + developer tools roles.
`,
)

// ── Companies ─────────────────────────────────────────────
const companies = [
  {
    slug: "stripe",
    name: "Stripe",
    url: "https://stripe.com",
    size: "8000+",
    industry: "Fintech / Payments",
    notes:
      "Gold standard for developer experience in payments. Engineering blog is excellent. Known for high hiring bar and strong eng culture. SF HQ with hybrid policy.",
  },
  {
    slug: "vercel",
    name: "Vercel",
    url: "https://vercel.com",
    size: "500-1000",
    industry: "Developer Tools / Cloud",
    notes:
      "Creators of Next.js. Fully remote, strong open-source ethos. Growing fast — Series D in 2025. Engineering-driven culture.",
  },
  {
    slug: "linear",
    name: "Linear",
    url: "https://linear.app",
    size: "50-100",
    industry: "Developer Tools / Productivity",
    notes:
      "Small team, fanatical about craft and performance. Their app is genuinely the best project management tool I've used. Fully remote. Would love to work here.",
  },
  {
    slug: "planetscale",
    name: "PlanetScale",
    url: "https://planetscale.com",
    size: "200-500",
    industry: "Database / Infrastructure",
    notes:
      "Serverless MySQL platform built on Vitess. Strong developer tools focus. Sam Chen (former colleague) works on infra — good inside perspective. Remote-first.",
  },
  {
    slug: "fly-io",
    name: "Fly.io",
    url: "https://fly.io",
    size: "100-200",
    industry: "Cloud Infrastructure",
    notes:
      "Deploy apps close to users on their global edge network. Small, scrappy, moves fast. Rust-heavy but TypeScript for platform tooling. Fully remote. Currently have an offer from them.",
  },
  {
    slug: "supabase",
    name: "Supabase",
    url: "https://supabase.com",
    size: "200-500",
    industry: "Database / Backend-as-a-Service",
    notes:
      "Open-source Firebase alternative. Fast-growing, strong community. Fully remote. Auth + edge functions scope would be meaty and impactful.",
  },
  {
    slug: "datadog",
    name: "Datadog",
    url: "https://datadoghq.com",
    size: "5000+",
    industry: "Observability / Monitoring",
    notes:
      "Major observability platform. Large eng org, data-heavy frontend. NY-based but may negotiate remote. Good comp but larger company feel.",
  },
  {
    slug: "cloudflare",
    name: "Cloudflare",
    url: "https://cloudflare.com",
    size: "3000+",
    industry: "Cloud Infrastructure / Security",
    notes:
      "Rejected after phone screen — they wanted deeper V8/C++ experience. Good learning experience about role fit. No hard feelings, great company.",
  },
]

for (const c of companies) {
  write(
    `companies/${c.slug}.md`,
    `
---
name: ${c.name}
url: ${c.url}
size: "${c.size}"
industry: ${c.industry}
---

${c.notes}
`,
  )
}

// ── Contacts ──────────────────────────────────────────────
write(
  "contacts/sam-chen.md",
  `
---
name: Sam Chen
company: PlanetScale
title: Senior Infrastructure Engineer
email: sam.chen@example.com
linkedin: https://linkedin.com/in/samchen
---

Former colleague from the collaboration SDK project. Now at PlanetScale on the infra team. Referred me for the Staff Engineer role — been really helpful with inside context on the team and interview process. Good friend, grab coffee when we're both in SF.
`,
)

write(
  "contacts/priya-patel.md",
  `
---
name: Priya Patel
company: Vercel
title: Engineering Manager — DX
linkedin: https://linkedin.com/in/priyapatel
---

Met at a Next.js meetup in 2025. She manages the DX team at Vercel — the same team with the open role. Mentioned they're looking for people who can bridge code and communication. Worth reaching out if I decide to pursue the Vercel role seriously.
`,
)

write(
  "contacts/alex-rivera.md",
  `
---
name: Alex Rivera
company: PlanetScale
title: Director of Engineering — Developer Platform
---

Hiring manager for the Staff Engineer role. Had a great technical deep-dive with them on Mar 3. Systems thinker, values pragmatism over purity. Seemed genuinely excited about my CLI and SDK experience.
`,
)

write(
  "contacts/maya-johnson.md",
  `
---
name: Maya Johnson
company: Fly.io
title: VP Engineering
---

Final-round interviewer at Fly.io. Candid about the challenges of scaling a small team. Mentioned they're looking for someone who can help establish technical standards as they grow. Felt like a good culture fit.
`,
)

// ── Messages ──────────────────────────────────────────────
write(
  "messages/2026-03-10-planetscale-system-design.md",
  `
---
direction: inbound
from: PlanetScale Recruiting
to: Jordan Blue
sent_at: "2026-03-10T14:30:00Z"
---

Hi Jordan,

Thanks for a great conversation with Alex last week! The team really enjoyed your deep-dive on CLI architecture.

We'd love to move forward with the system design round. Here are the details:

- **Date:** March 17, 2026
- **Time:** 10:00 AM PT
- **Duration:** 90 minutes
- **Format:** System design discussion with two engineers
- **Prompt:** You'll be asked to design a database branching system (high-level architecture)

No specific prep required — just bring your experience and a whiteboard mindset. Feel free to ask questions beforehand.

Best,
Taylor Kim
Recruiting, PlanetScale
`,
)

write(
  "messages/2026-03-10-fly-offer.md",
  `
---
direction: inbound
from: Fly.io Recruiting
to: Jordan Blue
sent_at: "2026-03-10T11:00:00Z"
---

Jordan,

We're excited to extend an offer for the Senior Engineer — App Platform role!

**Offer details:**
- Base salary: $210,000
- Equity: 0.08% (4-year vest, 1-year cliff)
- Signing bonus: $15,000
- Start date: Flexible (April or May 2026)
- Benefits: Unlimited PTO, health/dental/vision, $5k annual learning budget

We'd love to have you on the team. Please let us know by **March 16** if you'd like to accept, or if you have any questions.

Cheers,
Fly.io People Team
`,
)

write(
  "messages/2026-03-11-sam-coffee.md",
  `
---
direction: outbound
from: Jordan Blue
to: Sam Chen
sent_at: "2026-03-11T09:15:00Z"
---

Hey Sam — quick heads up, I got the system design round at PlanetScale scheduled for the 17th. The prompt is "design a database branching system" which is... literally what you all build lol.

Any tips on what they tend to focus on in these rounds? I want to make sure I'm thinking about it at the right altitude (staff-level, not just implementation).

Also: I got an offer from Fly.io that I need to respond to by the 16th. Might ask for an extension. Hoping PlanetScale moves fast if the design round goes well.

Coffee this weekend?
`,
)

write(
  "messages/2026-03-11-sam-reply.md",
  `
---
direction: inbound
from: Sam Chen
to: Jordan Blue
sent_at: "2026-03-11T10:45:00Z"
---

Nice! Yeah the branching prompt is a classic here — they want to see how you think about the developer workflow, not just the technical architecture. Focus on: how branching fits into a deploy pipeline, how you handle schema conflicts, and what the CLI experience looks like for developers.

Staff-level means: talk about team boundaries, API contracts between services, and how you'd sequence the work across quarters. They care about that a lot.

Re: Fly — that's a solid offer. If you want more time I'd just ask, worst they can say is no. PlanetScale usually turns around decisions within a week of the final round.

Saturday coffee works — Sightglass at 10?
`,
)

// ── Activity Log ──────────────────────────────────────────
const activities = [
  {
    ts: "2026-03-12T08:00:00Z",
    type: "discovery",
    slug: "linear-fullstack",
    summary: "Discovered Full-Stack Engineer at Linear (95% match)",
  },
  {
    ts: "2026-03-11T14:30:00Z",
    type: "message",
    slug: "sam-chen",
    summary: "Received prep advice from Sam Chen for PlanetScale system design",
  },
  {
    ts: "2026-03-11T09:15:00Z",
    type: "message",
    slug: "sam-chen",
    summary: "Sent Sam Chen a heads-up about PlanetScale system design round",
  },
  {
    ts: "2026-03-10T14:30:00Z",
    type: "interview",
    slug: "planetscale-staff",
    summary: "System design interview scheduled for Mar 17 at PlanetScale",
  },
  {
    ts: "2026-03-10T11:00:00Z",
    type: "offer",
    slug: "fly-io-senior",
    summary: "Received offer from Fly.io — $210k base + 0.08% equity",
  },
  {
    ts: "2026-03-08T16:00:00Z",
    type: "save",
    slug: "notion-senior-eng",
    summary: "Saved Senior Engineer — Collaboration at Notion (84% match)",
  },
  {
    ts: "2026-03-05T10:00:00Z",
    type: "application",
    slug: "datadog-senior-frontend",
    summary: "Applied to Senior Frontend Engineer at Datadog",
  },
  {
    ts: "2026-03-04T09:30:00Z",
    type: "application",
    slug: "supabase-backend",
    summary: "Applied to Backend Engineer at Supabase",
  },
  {
    ts: "2026-03-01T12:00:00Z",
    type: "rejection",
    slug: "cloudflare-workers",
    summary: "Rejected from Cloudflare Workers — needed deeper V8/C++ experience",
  },
  {
    ts: "2026-02-22T08:00:00Z",
    type: "application",
    slug: "planetscale-staff",
    summary: "Applied to Staff Engineer at PlanetScale (referred by Sam Chen)",
  },
]

const activityLines = activities
  .map((a) => JSON.stringify(a))
  .join("\n")
write("activity.log", activityLines + "\n")

console.log("✓ Seeded ~/.talentclaw/ with:")
console.log("  • 1 profile")
console.log("  • 10 jobs (3 discovered, 2 saved, 2 applied, 1 interviewing, 1 offer, 1 rejected)")
console.log("  • 5 applications")
console.log("  • 8 companies")
console.log("  • 4 contacts")
console.log("  • 4 messages")
console.log("  • 10 activity log entries")
console.log("\nRefresh localhost:3000/dashboard to see everything.")
