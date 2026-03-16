use crate::helpers;
use crate::types::Runtime;
use std::fs;
use std::path::Path;

/// Copy the skills/ directory into the runtime's workspace.
pub fn install(runtime: &Runtime, ) -> bool {
    if runtime.skill_dir.is_empty() {
        // Claude Code doesn't need workspace install
        helpers::log("✓", &format!("{} — skill registered via MCP config", runtime.name));
        return true;
    }

    let skill_src = helpers::package_root().join("skills");
    if !skill_src.exists() {
        helpers::log("✗", "skills/ directory not found in package");
        return false;
    }

    let dest = Path::new(&runtime.skill_dir);
    if let Err(e) = copy_dir_recursive(&skill_src, dest) {
        helpers::log("✗", &format!("Failed to install skill: {e}"));
        return false;
    }

    helpers::log("✓", &format!("Skill installed to {}", runtime.skill_dir));
    true
}

/// Recursively copy a directory.
fn copy_dir_recursive(src: &Path, dest: &Path) -> std::io::Result<()> {
    fs::create_dir_all(dest)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dest_path = dest.join(entry.file_name());
        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dest_path)?;
        } else {
            fs::copy(&src_path, &dest_path)?;
        }
    }
    Ok(())
}
