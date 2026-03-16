use std::path::PathBuf;

/// Returns the talentclaw data directory.
/// Reads `TALENTCLAW_DIR` env var, falls back to `~/.talentclaw/`.
pub fn data_dir() -> PathBuf {
    if let Ok(dir) = std::env::var("TALENTCLAW_DIR") {
        PathBuf::from(dir)
    } else {
        dirs::home_dir()
            .expect("could not determine home directory")
            .join(".talentclaw")
    }
}

/// Returns the package root directory.
/// Reads `TALENTCLAW_PACKAGE_ROOT` env var, falls back to the binary's
/// grandparent directory (works when the binary is at `bin/talentclaw`
/// inside the npm package).
pub fn package_root() -> PathBuf {
    if let Ok(root) = std::env::var("TALENTCLAW_PACKAGE_ROOT") {
        return PathBuf::from(root);
    }

    // Fall back to relative path from the binary itself
    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent().and_then(|p| p.parent()) {
            return parent.to_path_buf();
        }
    }

    // Last resort: current directory
    std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."))
}

/// Print a log message with an icon prefix.
pub fn log(icon: &str, msg: &str) {
    println!("{icon} {msg}");
}

/// Generate a URL-safe slug from company name and job title.
/// Matches the TypeScript implementation in bin/helpers.ts and lib/slugify.ts.
pub fn slugify(company: &str, title: &str) -> String {
    let combined = format!("{company}-{title}");
    let slug: String = combined
        .to_lowercase()
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() { c } else { '-' })
        .collect();

    // Collapse consecutive hyphens and trim leading/trailing hyphens
    let mut result = String::with_capacity(slug.len());
    let mut prev_hyphen = true; // start true to trim leading hyphens
    for c in slug.chars() {
        if c == '-' {
            if !prev_hyphen {
                result.push('-');
            }
            prev_hyphen = true;
        } else {
            result.push(c);
            prev_hyphen = false;
        }
    }

    // Trim trailing hyphen
    if result.ends_with('-') {
        result.pop();
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn slugify_basic() {
        assert_eq!(slugify("Acme Corp", "Senior SRE"), "acme-corp-senior-sre");
    }

    #[test]
    fn slugify_special_chars() {
        assert_eq!(
            slugify("  Foo--Bar ", " Baz! Qux "),
            "foo-bar-baz-qux"
        );
    }

    #[test]
    fn slugify_empty() {
        assert_eq!(slugify("", ""), "");
    }

    #[test]
    fn slugify_unicode() {
        assert_eq!(
            slugify("Café Inc", "Développeur"),
            "caf-inc-d-veloppeur"
        );
    }

    #[test]
    fn slugify_parity_with_typescript() {
        // These match the TypeScript: [company, title].join("-").toLowerCase()
        //   .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
        assert_eq!(slugify("Stripe", "Backend Engineer"), "stripe-backend-engineer");
        assert_eq!(slugify("Google", "Staff SWE (L7)"), "google-staff-swe-l7");
        assert_eq!(
            slugify("Two Sigma", "Quantitative Researcher - NYC"),
            "two-sigma-quantitative-researcher-nyc"
        );
    }

    #[test]
    fn data_dir_default() {
        // When TALENTCLAW_DIR is not set, should use ~/.talentclaw
        // SAFETY: test-only, single-threaded
        unsafe { std::env::remove_var("TALENTCLAW_DIR") };
        let dir = data_dir();
        assert!(dir.ends_with(".talentclaw"));
    }

    #[test]
    fn data_dir_override() {
        // SAFETY: test-only, single-threaded
        unsafe { std::env::set_var("TALENTCLAW_DIR", "/tmp/test-talentclaw") };
        let dir = data_dir();
        assert_eq!(dir, PathBuf::from("/tmp/test-talentclaw"));
        unsafe { std::env::remove_var("TALENTCLAW_DIR") };
    }
}
