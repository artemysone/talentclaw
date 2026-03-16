use crate::helpers;
use std::fs;

/// Check for Coffee Shop API key in env var or config.yaml.
pub fn check() -> bool {
    // Check env var first
    if std::env::var("COFFEESHOP_API_KEY").is_ok() {
        return true;
    }

    // Check config.yaml
    let config_path = helpers::data_dir().join("config.yaml");
    if let Ok(content) = fs::read_to_string(&config_path) {
        let re = regex::Regex::new(r#"(?m)^coffeeshop_api_key:\s*["']?(.+?)["']?\s*$"#).unwrap();
        if let Some(caps) = re.captures(&content) {
            let key = caps.get(1).map(|m| m.as_str()).unwrap_or("");
            return !key.is_empty() && !key.contains("your-key-here");
        }
    }

    false
}
