pub mod checklist;
pub mod credentials;
pub mod detect_runtime;
pub mod gateway;
pub mod install_coffeeshop;
pub mod install_runtime;
pub mod install_skill;
pub mod scaffold;
pub mod server;

use crate::helpers;

/// Run the full bootstrap sequence and start the web server.
pub async fn run(runtime_flag: Option<String>) -> Result<(), Box<dyn std::error::Error>> {
    println!("\n\x1b[1mtalentclaw\x1b[0m — your AI career agent\n");

    // 1. Detect or install agent runtime
    let mut runtime = detect_runtime::detect(runtime_flag.as_deref()).await?;
    if runtime.is_none() {
        runtime = install_runtime::install()?;
    }

    // 2. Coffee Shop CLI
    let has_coffeeshop = install_coffeeshop::check_or_install();

    // 3. Install skill into runtime workspace
    let skill_installed = if let Some(rt) = &runtime {
        install_skill::install(rt)
    } else {
        false
    };

    // 4. Scaffold ~/.talentclaw/
    scaffold::scaffold_workspace()?;

    // 5. Check credentials
    let has_api_key = credentials::check();

    // 6. Check gateway health
    let gateway_reachable = if let Some(rt) = &runtime {
        gateway::check(rt)
    } else {
        false
    };

    // 7. Start Next.js server and print checklist
    server::start(
        &helpers::package_root(),
        server::BootstrapState {
            runtime: runtime.as_ref(),
            skill_installed,
            has_coffeeshop,
            has_api_key,
            gateway_reachable,
        },
    )
    .await
}
