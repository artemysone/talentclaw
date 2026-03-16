use clap::Args;
use std::fs;
use std::io::Write;
use std::process::Command;

use crate::frontmatter;
use crate::helpers;
use crate::types::*;

#[derive(Args, Debug)]
pub struct SearchArgs {
    /// Max results (1-100, default: 20)
    #[arg(long, default_value_t = 20)]
    pub limit: u32,

    /// Comma-separated skills filter
    #[arg(long)]
    pub skills: Option<String>,

    /// Remote jobs only
    #[arg(long)]
    pub remote: bool,

    /// Location filter
    #[arg(long)]
    pub location: Option<String>,

    /// Minimum compensation
    #[arg(long)]
    pub min_compensation: Option<u64>,

    /// Maximum compensation
    #[arg(long)]
    pub max_compensation: Option<u64>,
}

/// Map Coffee Shop remote_policy to talentclaw's remote field.
fn map_remote_policy(policy: &str) -> Option<&'static str> {
    let p = policy.to_lowercase();
    if p.contains("remote") {
        Some("remote")
    } else if p.contains("hybrid") {
        Some("hybrid")
    } else if p.contains("onsite") || p.contains("office") {
        Some("onsite")
    } else {
        None
    }
}

pub async fn run(args: SearchArgs) -> Result<(), Box<dyn std::error::Error>> {
    // Check coffeeshop is available
    if which::which("coffeeshop").is_err() {
        return Err("coffeeshop CLI not found. Run npx talentclaw to set up, or: npm install -g coffeeshop".into());
    }

    let data_dir = helpers::data_dir();

    // Read profile for defaults
    let profile_path = data_dir.join("profile.md");
    let mut profile_skills: Vec<String> = Vec::new();
    let mut profile_remote = false;
    let mut profile_location: Option<String> = None;
    let mut profile_min_comp: Option<u64> = None;
    let mut profile_max_comp: Option<u64> = None;

    if profile_path.exists() {
        if let Ok(content) = fs::read_to_string(&profile_path) {
            if let Ok((fm, _body)) = frontmatter::parse(&content) {
                if let Some(skills) = fm.get("skills").and_then(|v| v.as_sequence()) {
                    profile_skills = skills
                        .iter()
                        .filter_map(|v| v.as_str().map(String::from))
                        .collect();
                }
                if fm.get("remote_preference").and_then(|v| v.as_str()) == Some("remote_only") {
                    profile_remote = true;
                }
                if let Some(locs) = fm.get("preferred_locations").and_then(|v| v.as_sequence()) {
                    if let Some(first) = locs.first().and_then(|v| v.as_str()) {
                        profile_location = Some(first.to_string());
                    }
                }
                if let Some(range) = fm.get("salary_range").and_then(|v| v.as_mapping()) {
                    if let Some(min) = range.get("min").and_then(|v| v.as_u64()) {
                        profile_min_comp = Some(min);
                    }
                    if let Some(max) = range.get("max").and_then(|v| v.as_u64()) {
                        profile_max_comp = Some(max);
                    }
                }
            }
        }
    }

    // Build coffeeshop search command
    let mut cmd_args: Vec<String> = vec!["search".into()];
    cmd_args.push("--limit".into());
    cmd_args.push(args.limit.to_string());

    let skills = args.skills.or_else(|| {
        if profile_skills.is_empty() {
            None
        } else {
            Some(profile_skills.join(","))
        }
    });
    if let Some(s) = &skills {
        cmd_args.push("--skills".into());
        cmd_args.push(s.clone());
    }

    if args.remote || profile_remote {
        cmd_args.push("--remote".into());
    }

    let location = args.location.or(profile_location);
    if let Some(loc) = &location {
        cmd_args.push("--location".into());
        cmd_args.push(loc.clone());
    }

    let min_comp = args.min_compensation.or(profile_min_comp);
    if let Some(m) = min_comp {
        cmd_args.push("--min-compensation".into());
        cmd_args.push(m.to_string());
    }

    let max_comp = args.max_compensation.or(profile_max_comp);
    if let Some(m) = max_comp {
        cmd_args.push("--max-compensation".into());
        cmd_args.push(m.to_string());
    }

    helpers::log("◆", "Searching Coffee Shop...");
    helpers::log(
        " ",
        &format!("→ coffeeshop {}", cmd_args.join(" ")),
    );

    // Execute search
    let output = Command::new("coffeeshop")
        .args(&cmd_args)
        .output()
        .map_err(|e| format!("Failed to run coffeeshop: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Search failed: {stderr}").into());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    // Parse response
    let response: CoffeeShopResponse = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse Coffee Shop response: {e}\nRaw: {}", &stdout[..stdout.len().min(200)]))?;

    if response.matches.is_empty() {
        helpers::log("◆", "No jobs found matching your criteria.");
        return Ok(());
    }

    // Ensure jobs directory exists
    let jobs_dir = data_dir.join("jobs");
    fs::create_dir_all(&jobs_dir)?;

    // Read existing slugs for dedup
    let existing_slugs: std::collections::HashSet<String> = if jobs_dir.exists() {
        fs::read_dir(&jobs_dir)?
            .filter_map(|e| e.ok())
            .filter_map(|e| {
                let name = e.file_name().to_string_lossy().to_string();
                if name.ends_with(".md") {
                    Some(name.trim_end_matches(".md").to_string())
                } else {
                    None
                }
            })
            .collect()
    } else {
        std::collections::HashSet::new()
    };

    let mut new_count = 0u32;
    let mut skip_count = 0u32;
    let today = chrono_free_today();

    for m in &response.matches {
        let job = &m.job;
        let company = job
            .company_context
            .as_ref()
            .and_then(|c| c.company_name.as_deref())
            .unwrap_or("unknown");
        let slug = helpers::slugify(company, &job.title);

        if existing_slugs.contains(&slug) {
            skip_count += 1;
            continue;
        }

        // Build frontmatter
        let mut fm = JobFrontmatter {
            title: job.title.clone(),
            company: company.to_string(),
            source: "coffeeshop".into(),
            status: "discovered".into(),
            coffeeshop_id: Some(job.id.clone()),
            discovered_at: Some(today.clone()),
            location: None,
            remote: None,
            compensation: None,
            url: None,
            match_score: None,
            tags: None,
        };

        if let Some(req) = &job.requirements {
            if let Some(loc) = &req.location {
                fm.location = Some(loc.clone());
            }
            if let Some(policy) = &req.remote_policy {
                fm.remote = map_remote_policy(policy).map(String::from);
            }
            if let Some(skills) = &req.skills {
                if !skills.is_empty() {
                    fm.tags = Some(skills.clone());
                }
            }
        }

        if let Some(comp) = &job.compensation {
            if comp.min.is_some() || comp.max.is_some() {
                fm.compensation = Some(Compensation {
                    min: comp.min,
                    max: comp.max,
                    currency: comp.currency.clone().unwrap_or_else(|| "USD".into()),
                });
            }
        }

        if let Some(url) = &job.apply_url {
            fm.url = Some(url.clone());
        }

        // Write markdown file
        let content = frontmatter::stringify(&fm, "")?;
        let file_path = jobs_dir.join(format!("{slug}.md"));
        fs::write(&file_path, &content)?;
        new_count += 1;
    }

    // Log activity
    let activity_path = data_dir.join("activity.log");
    let entry = ActivityEntry {
        ts: now_iso(),
        entry_type: "search".into(),
        slug: None,
        summary: format!(
            "Searched Coffee Shop: {new_count} new, {skip_count} already tracked ({} total matches)",
            response.total
        ),
    };
    let mut file = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&activity_path)?;
    writeln!(file, "{}", serde_json::to_string(&entry)?)?;

    // Print summary
    println!();
    helpers::log(
        "✓",
        &format!("\x1b[1m{new_count}\x1b[0m new jobs, {skip_count} already tracked"),
    );
    if new_count > 0 {
        helpers::log(" ", &format!("Jobs saved to {}", jobs_dir.display()));
    }

    Ok(())
}

/// Get today's date as YYYY-MM-DD without pulling in chrono.
fn chrono_free_today() -> String {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    // Simple days-since-epoch calculation
    let days = now / 86400;
    let (year, month, day) = days_to_ymd(days);
    format!("{year:04}-{month:02}-{day:02}")
}

/// Get current time as ISO 8601 string.
fn now_iso() -> String {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let days = now / 86400;
    let (year, month, day) = days_to_ymd(days);
    let rem = now % 86400;
    let hour = rem / 3600;
    let min = (rem % 3600) / 60;
    let sec = rem % 60;
    format!("{year:04}-{month:02}-{day:02}T{hour:02}:{min:02}:{sec:02}Z")
}

/// Convert days since Unix epoch to (year, month, day).
fn days_to_ymd(days: u64) -> (u64, u64, u64) {
    // Algorithm from Howard Hinnant's civil_from_days
    let z = days + 719468;
    let era = z / 146097;
    let doe = z - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };
    (y, m, d)
}
