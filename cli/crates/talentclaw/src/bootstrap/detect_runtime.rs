use crate::types::Runtime;
use std::process::Command;

const RUNTIMES: &[(&str, &str, &str)] = &[
    ("OpenClaw", "openclaw", "~/.openclaw/workspace/skills/talentclaw"),
    ("ZeroClaw", "zeroclaw", "~/.zeroclaw/workspace/skills/talentclaw"),
    ("Claude Code", "claude", ""),
];

/// Get version string from a CLI command.
fn cmd_version(cmd: &str) -> Option<String> {
    Command::new(cmd)
        .arg("--version")
        .output()
        .ok()
        .and_then(|o| {
            let s = String::from_utf8_lossy(&o.stdout).trim().to_string();
            if s.len() < 100 && !s.contains('\n') {
                Some(s)
            } else {
                None
            }
        })
}

/// Expand ~ in skill_dir to the actual home directory.
fn expand_skill_dir(dir: &str) -> String {
    if let Some(rest) = dir.strip_prefix("~/") {
        if let Some(home) = dirs::home_dir() {
            return home.join(rest).to_string_lossy().to_string();
        }
    }
    dir.to_string()
}

/// Detect available agent runtimes. If `prefer` is given, select by name/cmd.
pub async fn detect(prefer: Option<&str>) -> Result<Option<Runtime>, Box<dyn std::error::Error>> {
    let mut found: Vec<Runtime> = Vec::new();

    for &(name, cmd, skill_dir) in RUNTIMES {
        if which::which(cmd).is_ok() {
            found.push(Runtime {
                name: name.to_string(),
                cmd: cmd.to_string(),
                version: cmd_version(cmd),
                skill_dir: expand_skill_dir(skill_dir),
            });
        }
    }

    if found.is_empty() {
        return Ok(None);
    }

    // If --runtime flag provided, match by name or cmd
    if let Some(pref) = prefer {
        let p = pref.to_lowercase();
        if let Some(rt) = found.iter().find(|r| {
            r.name.to_lowercase() == p || r.cmd.to_lowercase() == p
        }) {
            return Ok(Some(rt.clone()));
        }
        return Err(format!("runtime '{pref}' not found. Available: {}",
            found.iter().map(|r| r.cmd.as_str()).collect::<Vec<_>>().join(", ")).into());
    }

    // Auto-select if only one found
    if found.len() == 1 {
        return Ok(Some(found.remove(0)));
    }

    // Interactive prompt
    let items: Vec<String> = found
        .iter()
        .map(|r| {
            let ver = r.version.as_deref().unwrap_or("unknown");
            format!("{} ({})", r.name, ver)
        })
        .collect();

    let selection = dialoguer::Select::new()
        .with_prompt("Multiple agent runtimes found — which one?")
        .items(&items)
        .default(0)
        .interact()?;

    Ok(Some(found.remove(selection)))
}
