use crate::types::Runtime;
use std::process::Command;

/// Check if the agent runtime's gateway is reachable.
pub fn check(runtime: &Runtime) -> bool {
    // Only OpenClaw and ZeroClaw have gateways
    if runtime.cmd == "claude" {
        return true;
    }

    let result = Command::new(&runtime.cmd)
        .arg("status")
        .output();

    match result {
        Ok(output) => output.status.success(),
        Err(_) => false,
    }
}
