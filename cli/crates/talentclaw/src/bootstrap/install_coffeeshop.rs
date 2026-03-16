use crate::helpers;

/// Check if Coffee Shop CLI is available. Warn if missing (don't auto-install).
pub fn check_or_install() -> bool {
    if which::which("coffeeshop").is_ok() {
        return true;
    }

    helpers::log("!", "Coffee Shop CLI not found — install with: npm install -g @artemyshq/coffeeshop");
    false
}
