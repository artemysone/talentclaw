use crate::helpers;
use std::process::Command;

/// Check if Coffee Shop CLI is available. Install if missing.
pub fn check_or_install() -> bool {
    if which::which("coffeeshop").is_ok() {
        return true;
    }

    helpers::log("◆", "Coffee Shop CLI not found. Installing...");

    let status = Command::new("npm")
        .args(["install", "-g", "coffeeshop"])
        .status();

    match status {
        Ok(s) if s.success() => {
            helpers::log("✓", "Coffee Shop CLI installed");
            true
        }
        _ => {
            helpers::log("✗", "Failed to install Coffee Shop CLI. Install manually: npm install -g coffeeshop");
            false
        }
    }
}
