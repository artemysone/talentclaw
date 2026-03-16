use crate::helpers;
use std::fs;
use std::path::Path;

const TEMPLATE_CONFIG: &str = r#"# TalentClaw configuration
# coffeeshop_api_key: "your-key-here"
# theme: "auto"
"#;

const TEMPLATE_PROFILE: &str = r#"---
display_name: ""
headline: ""
skills: []
preferred_roles: []
preferred_locations: []
remote_preference: flexible
experience_years: 0
---

# About

<!-- Write a brief summary of your background and what you're looking for -->
"#;

/// Create the ~/.talentclaw/ directory structure and template files.
pub fn scaffold_workspace() -> Result<(), Box<dyn std::error::Error>> {
    let data_dir = helpers::data_dir();

    // Create subdirectories
    let dirs = ["jobs", "applications", "companies", "contacts", "messages"];
    for dir in &dirs {
        fs::create_dir_all(data_dir.join(dir))?;
    }

    // Write template files (only if they don't exist)
    write_if_missing(&data_dir.join("config.yaml"), TEMPLATE_CONFIG)?;
    write_if_missing(&data_dir.join("profile.md"), TEMPLATE_PROFILE)?;
    write_if_missing(&data_dir.join("activity.log"), "")?;

    Ok(())
}

fn write_if_missing(path: &Path, content: &str) -> std::io::Result<()> {
    if !path.exists() {
        fs::write(path, content)?;
    }
    Ok(())
}
