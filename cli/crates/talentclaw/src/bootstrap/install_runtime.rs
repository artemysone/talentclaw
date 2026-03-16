use crate::helpers;
use crate::types::Runtime;
use std::process::Command;

/// Attempt to install OpenClaw globally via npm.
pub fn install() -> Result<Option<Runtime>, Box<dyn std::error::Error>> {
    helpers::log("◆", "No agent runtime found. Installing OpenClaw...");

    let status = Command::new("npm")
        .args(["install", "-g", "openclaw"])
        .status();

    match status {
        Ok(s) if s.success() => {
            let version = Command::new("openclaw")
                .arg("--version")
                .output()
                .ok()
                .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string());

            let skill_dir = dirs::home_dir()
                .map(|h| h.join(".openclaw/workspace/skills/talentclaw").to_string_lossy().to_string())
                .unwrap_or_default();

            helpers::log("✓", "OpenClaw installed");
            Ok(Some(Runtime {
                name: "OpenClaw".into(),
                cmd: "openclaw".into(),
                version,
                skill_dir,
            }))
        }
        _ => {
            helpers::log("✗", "Failed to install OpenClaw. Install manually: npm install -g openclaw");
            Ok(None)
        }
    }
}
