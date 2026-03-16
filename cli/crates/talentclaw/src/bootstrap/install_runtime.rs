use crate::helpers;
use crate::types::Runtime;

/// Warn that no agent runtime was found. Don't auto-install.
pub fn install() -> Result<Option<Runtime>, Box<dyn std::error::Error>> {
    helpers::log("!", "No agent runtime found. Install one:");
    helpers::log(" ", "  npm install -g openclaw");
    helpers::log(" ", "  or use Claude Code: https://claude.com/claude-code");
    Ok(None)
}
