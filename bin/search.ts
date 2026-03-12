import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  appendFileSync,
} from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import matter from "gray-matter";
import { DATA_DIR, log, which, slugify } from "./helpers.js";

// ---------------------------------------------------------------------------
// Coffee Shop response types (subset of JobResponse)
// ---------------------------------------------------------------------------
interface CoffeeShopMatch {
  job: {
    id: string;
    title: string;
    status?: string;
    source?: string;
    apply_url?: string;
    requirements?: {
      skills?: string[];
      level?: string;
      location?: string;
      remote_policy?: string;
    };
    compensation?: {
      min?: number;
      max?: number;
      currency?: string;
    };
    company_context?: {
      company_name?: string;
      department?: string;
      company_size?: string;
    };
    preferences?: {
      benefits?: string[];
    };
  };
}

interface CoffeeShopResponse {
  total: number;
  matches: CoffeeShopMatch[];
}

// ---------------------------------------------------------------------------
// Parse CLI flags
// ---------------------------------------------------------------------------
function parseArgs(argv: string[]) {
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      flags.help = true;
    } else if (arg === "--remote") {
      flags.remote = true;
    } else if (
      [
        "--limit",
        "--skills",
        "--location",
        "--min-compensation",
        "--max-compensation",
      ].includes(arg) &&
      i + 1 < argv.length
    ) {
      flags[arg.replace(/^--/, "")] = argv[++i];
    }
  }
  return flags;
}

// ---------------------------------------------------------------------------
// Map Coffee Shop remote_policy to talentclaw remote field
// ---------------------------------------------------------------------------
function mapRemotePolicy(
  policy?: string
): "remote" | "hybrid" | "onsite" | undefined {
  if (!policy) return undefined;
  const p = policy.toLowerCase();
  if (p.includes("remote")) return "remote";
  if (p.includes("hybrid")) return "hybrid";
  if (p.includes("onsite") || p.includes("office")) return "onsite";
  return undefined;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export async function runSearch(argv: string[]): Promise<void> {
  const flags = parseArgs(argv);

  if (flags.help) {
    console.log(`
\x1b[1mtalentclaw search\x1b[0m — discover jobs from Coffee Shop

Usage:
  talentclaw search [options]

Options:
  --limit <n>              Max results (1-100, default: 20)
  --skills <x,y>           Comma-separated skills filter
  --remote                 Remote jobs only
  --location <loc>         Location filter
  --min-compensation <n>   Minimum compensation
  --max-compensation <n>   Maximum compensation
  -h, --help               Show this help

Without flags, searches using your profile preferences from ~/.talentclaw/profile.md
`);
    return;
  }

  // Check coffeeshop is available
  if (!which("coffeeshop")) {
    log(
      "✗",
      "coffeeshop CLI not found. Run npx talentclaw to set up, or: npm install -g coffeeshop"
    );
    process.exit(1);
  }

  // Read profile for defaults
  const profilePath = join(DATA_DIR, "profile.md");
  let profileSkills: string[] = [];
  let profileRemote = false;
  let profileLocation: string | undefined;
  let profileMinComp: number | undefined;
  let profileMaxComp: number | undefined;

  if (existsSync(profilePath)) {
    try {
      const { data } = matter(readFileSync(profilePath, "utf-8"));
      if (Array.isArray(data.skills)) profileSkills = data.skills;
      if (data.remote_preference === "remote_only") profileRemote = true;
      if (Array.isArray(data.preferred_locations) && data.preferred_locations.length > 0) {
        profileLocation = data.preferred_locations[0];
      }
      if (data.salary_range?.min) profileMinComp = data.salary_range.min;
      if (data.salary_range?.max) profileMaxComp = data.salary_range.max;
    } catch {
      // Profile unreadable — continue with no defaults
    }
  }

  // Build coffeeshop search command
  const parts: string[] = ["coffeeshop", "search"];

  const limit = flags.limit || "20";
  parts.push("--limit", String(limit));

  const skills =
    typeof flags.skills === "string"
      ? flags.skills
      : profileSkills.length > 0
        ? profileSkills.join(",")
        : undefined;
  if (skills) parts.push("--skills", skills);

  if (flags.remote || profileRemote) parts.push("--remote");

  const location =
    typeof flags.location === "string" ? flags.location : profileLocation;
  if (location) parts.push("--location", location);

  const minComp =
    typeof flags["min-compensation"] === "string"
      ? flags["min-compensation"]
      : profileMinComp
        ? String(profileMinComp)
        : undefined;
  if (minComp) parts.push("--min-compensation", minComp);

  const maxComp =
    typeof flags["max-compensation"] === "string"
      ? flags["max-compensation"]
      : profileMaxComp
        ? String(profileMaxComp)
        : undefined;
  if (maxComp) parts.push("--max-compensation", maxComp);

  log("◆", `Searching Coffee Shop...`);
  log("  ", `→ ${parts.join(" ")}`);

  // Execute search
  let output: string;
  try {
    output = execFileSync(parts[0], parts.slice(1), {
      encoding: "utf-8",
      timeout: 30000,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("✗", `Search failed: ${msg}`);
    process.exit(1);
  }

  // Parse response
  let response: CoffeeShopResponse;
  try {
    response = JSON.parse(output);
  } catch {
    log("✗", "Failed to parse Coffee Shop response");
    log("  ", `Raw output: ${output.slice(0, 200)}`);
    process.exit(1);
  }

  if (!response.matches || response.matches.length === 0) {
    log("◆", "No jobs found matching your criteria.");
    return;
  }

  // Ensure jobs directory exists
  const jobsDir = join(DATA_DIR, "jobs");
  mkdirSync(jobsDir, { recursive: true });

  // Read existing slugs for dedup
  const existingSlugs = new Set(
    existsSync(jobsDir)
      ? readdirSync(jobsDir)
          .filter((f) => f.endsWith(".md"))
          .map((f) => f.replace(/\.md$/, ""))
      : []
  );

  let newCount = 0;
  let skipCount = 0;
  const today = new Date().toISOString().split("T")[0];

  for (const match of response.matches) {
    const job = match.job;
    const company = job.company_context?.company_name || "unknown";
    const slug = slugify(company, job.title);

    if (existingSlugs.has(slug)) {
      skipCount++;
      continue;
    }

    // Build frontmatter
    const frontmatter: Record<string, unknown> = {
      title: job.title,
      company,
      source: "coffeeshop",
      status: "discovered",
      coffeeshop_id: job.id,
      discovered_at: today,
    };

    if (job.requirements?.location) frontmatter.location = job.requirements.location;
    const remote = mapRemotePolicy(job.requirements?.remote_policy);
    if (remote) frontmatter.remote = remote;

    if (job.compensation && (job.compensation.min || job.compensation.max)) {
      frontmatter.compensation = {
        ...(job.compensation.min && { min: job.compensation.min }),
        ...(job.compensation.max && { max: job.compensation.max }),
        currency: job.compensation.currency || "USD",
      };
    }

    if (job.requirements?.skills && job.requirements.skills.length > 0) {
      frontmatter.tags = job.requirements.skills;
    }

    if (job.apply_url) frontmatter.url = job.apply_url;

    // Write markdown file
    const content = matter.stringify("", frontmatter);
    writeFileSync(join(jobsDir, `${slug}.md`), content, "utf-8");
    existingSlugs.add(slug);
    newCount++;
  }

  // Log activity
  const activityPath = join(DATA_DIR, "activity.log");
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    type: "search",
    summary: `Searched Coffee Shop: ${newCount} new, ${skipCount} already tracked (${response.total} total matches)`,
  });
  appendFileSync(activityPath, entry + "\n", "utf-8");

  // Print summary
  console.log("");
  log("✓", `Found \x1b[1m${newCount}\x1b[0m new jobs, ${skipCount} already tracked`);
  if (newCount > 0) {
    log("  ", `Jobs saved to ${jobsDir}`);
  }
}
