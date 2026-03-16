use crate::types::Runtime;
use std::path::Path;
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::Notify;
use tokio::time::{timeout, Duration};

use super::checklist;

pub struct BootstrapState<'a> {
    pub runtime: Option<&'a Runtime>,
    pub skill_installed: bool,
    pub has_coffeeshop: bool,
    pub has_api_key: bool,
    pub gateway_reachable: bool,
}

pub async fn start(
    package_root: &Path,
    state: BootstrapState<'_>,
) -> Result<(), Box<dyn std::error::Error>> {
    let server_js = package_root
        .join(".next")
        .join("standalone")
        .join("server.js");

    if !server_js.exists() {
        checklist::print(
            state.runtime,
            state.skill_installed,
            state.has_coffeeshop,
            state.has_api_key,
            state.gateway_reachable,
            None,
            Some(&format!("server.js not found at {}", server_js.display())),
        );
        return Err("Next.js standalone build not found. Run 'npm run build' first.".into());
    }

    // Spawn the Next.js server
    let mut child = Command::new("node")
        .arg(&server_js)
        .current_dir(server_js.parent().unwrap())
        .env("PORT", "3100")
        .env("HOSTNAME", "0.0.0.0")
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()?;

    let stdout = child.stdout.take().expect("stdout piped");
    let stderr = child.stderr.take().expect("stderr piped");

    let ready = Arc::new(Notify::new());
    let ready_clone = ready.clone();
    let port_in_use = Arc::new(std::sync::atomic::AtomicBool::new(false));
    let port_in_use_clone = port_in_use.clone();

    // Monitor stdout for readiness
    let stdout_handle = tokio::spawn(async move {
        let reader = BufReader::new(stdout);
        let mut lines = reader.lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let lower = line.to_lowercase();
            if lower.contains("ready")
                || lower.contains("listening")
                || lower.contains("started server")
            {
                ready_clone.notify_one();
                break;
            }
        }
    });

    // Monitor stderr for EADDRINUSE
    let stderr_handle = tokio::spawn(async move {
        let reader = BufReader::new(stderr);
        let mut lines = reader.lines();
        while let Ok(Some(line)) = lines.next_line().await {
            if line.contains("EADDRINUSE") {
                port_in_use_clone.store(true, std::sync::atomic::Ordering::SeqCst);
                break;
            }
        }
    });

    // Wait for ready signal or timeout
    let is_ready = timeout(Duration::from_secs(5), ready.notified()).await.is_ok();

    let (web_url, web_error) = if port_in_use.load(std::sync::atomic::Ordering::SeqCst) {
        (None, Some("port 3100 already in use — kill the existing process: lsof -ti :3100 | xargs kill".to_string()))
    } else if is_ready {
        (Some("http://localhost:3100".to_string()), None)
    } else {
        // Timeout but no error — assume it's ready
        (Some("http://localhost:3100".to_string()), None)
    };

    // Print checklist
    checklist::print(
        state.runtime,
        state.skill_installed,
        state.has_coffeeshop,
        state.has_api_key,
        state.gateway_reachable,
        web_url.as_deref(),
        web_error.as_deref(),
    );

    // Open browser if ready
    if web_url.is_some() {
        let _ = open::that("http://localhost:3100");
    }

    if web_error.is_some() {
        child.kill().await.ok();
        return Err(web_error.unwrap().into());
    }

    // Handle Ctrl+C — kill child gracefully
    let child_id = child.id();
    ctrlc::set_handler(move || {
        if let Some(pid) = child_id {
            #[cfg(unix)]
            {
                use nix::sys::signal::{kill, Signal};
                use nix::unistd::Pid;
                let _ = kill(Pid::from_raw(pid as i32), Signal::SIGTERM);
            }
        }
        std::process::exit(0);
    })?;

    // Wait for the server process to exit
    let status = child.wait().await?;
    stdout_handle.abort();
    stderr_handle.abort();

    if !status.success() {
        return Err(format!("Server exited with status: {status}").into());
    }

    Ok(())
}
