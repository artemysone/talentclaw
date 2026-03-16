use crate::helpers;
use crate::types::Runtime;

/// Print a formatted checklist item.
pub fn check(label: &str, ok: bool, detail: &str) {
    let icon = if ok { "\x1b[32m[ok]\x1b[0m" } else { "\x1b[33m[!!]\x1b[0m" };
    if detail.is_empty() {
        println!("  {icon} {label}");
    } else {
        println!("  {icon} {label} — {detail}");
    }
}

/// Print the full bootstrap checklist.
pub fn print(
    runtime: Option<&Runtime>,
    skill_installed: bool,
    has_coffeeshop: bool,
    has_api_key: bool,
    gateway_reachable: bool,
    web_url: Option<&str>,
    web_error: Option<&str>,
) {
    println!();

    // Runtime
    if let Some(rt) = runtime {
        let ver = rt.version.as_deref().unwrap_or("unknown");
        check("Agent runtime", true, &format!("{} {ver}", rt.name));
    } else {
        check("Agent runtime", false, "none detected");
    }

    // Skill
    check("talentclaw skill", skill_installed, if skill_installed { "installed" } else { "not installed" });

    // Workspace
    let data_dir = helpers::data_dir();
    check("Workspace", data_dir.exists(), &data_dir.display().to_string());

    // Coffee Shop
    check(
        "Coffee Shop CLI",
        has_coffeeshop,
        if has_coffeeshop { "installed" } else { "npm install -g coffeeshop" },
    );

    // Credentials
    check(
        "Coffee Shop account",
        has_api_key,
        if has_api_key { "connected" } else { "agent will set up" },
    );

    // Gateway
    if runtime.map_or(false, |r| r.cmd != "claude") {
        let gateway_detail = if gateway_reachable {
            "reachable".to_string()
        } else {
            format!("{} start", runtime.map_or("", |r| r.cmd.as_str()))
        };
        check("Gateway", gateway_reachable, &gateway_detail);
    }

    // Web UI
    match (web_url, web_error) {
        (Some(url), _) => check("Web UI", true, url),
        (_, Some(err)) => check("Web UI", false, err),
        _ => check("Web UI", false, "starting..."),
    }

    println!();
}
