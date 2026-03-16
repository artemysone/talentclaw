use serde::Serialize;
use std::fmt;

/// Error returned when frontmatter parsing fails.
#[derive(Debug)]
pub struct ParseError(pub String);

impl fmt::Display for ParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "frontmatter parse error: {}", self.0)
    }
}

impl std::error::Error for ParseError {}

/// Parse a markdown file with YAML frontmatter delimited by `---`.
/// Returns the deserialized YAML value and the remaining markdown body.
pub fn parse(input: &str) -> Result<(serde_yaml::Value, String), ParseError> {
    let trimmed = input.trim_start();

    if !trimmed.starts_with("---") {
        return Ok((serde_yaml::Value::Mapping(Default::default()), input.to_string()));
    }

    // Find the closing ---
    let after_open = &trimmed[3..];
    let close_pos = after_open
        .find("\n---")
        .ok_or_else(|| ParseError("missing closing --- delimiter".into()))?;

    let yaml_str = &after_open[..close_pos];
    let body_start = close_pos + 4; // skip \n---
    let body = after_open[body_start..].trim_start_matches('\n').to_string();

    let value: serde_yaml::Value = serde_yaml::from_str(yaml_str)
        .map_err(|e| ParseError(format!("invalid YAML: {e}")))?;

    Ok((value, body))
}

/// Parse frontmatter into a typed struct.
pub fn parse_typed<T: serde::de::DeserializeOwned>(input: &str) -> Result<(T, String), ParseError> {
    let trimmed = input.trim_start();

    if !trimmed.starts_with("---") {
        return Err(ParseError("no frontmatter found".into()));
    }

    let after_open = &trimmed[3..];
    let close_pos = after_open
        .find("\n---")
        .ok_or_else(|| ParseError("missing closing --- delimiter".into()))?;

    let yaml_str = &after_open[..close_pos];
    let body_start = close_pos + 4;
    let body = after_open[body_start..].trim_start_matches('\n').to_string();

    let value: T = serde_yaml::from_str(yaml_str)
        .map_err(|e| ParseError(format!("invalid YAML: {e}")))?;

    Ok((value, body))
}

/// Serialize a struct as YAML frontmatter + markdown body.
pub fn stringify<T: Serialize>(frontmatter: &T, body: &str) -> Result<String, ParseError> {
    let yaml = serde_yaml::to_string(frontmatter)
        .map_err(|e| ParseError(format!("YAML serialize error: {e}")))?;

    let mut out = String::from("---\n");
    out.push_str(&yaml);
    // serde_yaml already appends a trailing newline
    out.push_str("---\n");
    if !body.is_empty() {
        out.push('\n');
        out.push_str(body);
        if !body.ends_with('\n') {
            out.push('\n');
        }
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::JobFrontmatter;

    #[test]
    fn parse_and_roundtrip() {
        let input = r#"---
title: Senior SRE
company: Acme Corp
source: coffeeshop
status: discovered
coffeeshop_id: abc-123
discovered_at: "2026-03-16"
---

This is the job description.
"#;

        let (value, body) = parse(input).unwrap();
        assert_eq!(value["title"].as_str().unwrap(), "Senior SRE");
        assert_eq!(value["company"].as_str().unwrap(), "Acme Corp");
        assert_eq!(body, "This is the job description.\n");
    }

    #[test]
    fn parse_typed_job() {
        let input = r#"---
title: Backend Engineer
company: Stripe
source: coffeeshop
status: discovered
tags:
  - rust
  - typescript
compensation:
  min: 180000
  max: 250000
  currency: USD
---
"#;

        let (job, _body): (JobFrontmatter, String) = parse_typed(input).unwrap();
        assert_eq!(job.title, "Backend Engineer");
        assert_eq!(job.company, "Stripe");
        assert_eq!(job.tags.as_ref().unwrap().len(), 2);
        assert_eq!(job.compensation.as_ref().unwrap().min, Some(180000.0));
    }

    #[test]
    fn stringify_produces_valid_frontmatter() {
        let job = JobFrontmatter {
            title: "Platform Engineer".into(),
            company: "Vercel".into(),
            location: None,
            remote: Some("remote".into()),
            compensation: None,
            url: None,
            source: "coffeeshop".into(),
            coffeeshop_id: Some("xyz".into()),
            status: "discovered".into(),
            match_score: None,
            tags: Some(vec!["rust".into(), "wasm".into()]),
            discovered_at: Some("2026-03-16".into()),
        };

        let output = stringify(&job, "").unwrap();
        assert!(output.starts_with("---\n"));
        assert!(output.contains("title: Platform Engineer"));
        assert!(output.contains("company: Vercel"));

        // Round-trip: parse it back
        let (parsed, _body): (JobFrontmatter, String) = parse_typed(&output).unwrap();
        assert_eq!(parsed.title, "Platform Engineer");
        assert_eq!(parsed.tags.unwrap(), vec!["rust", "wasm"]);
    }

    #[test]
    fn no_frontmatter_returns_empty_mapping() {
        let input = "Just some markdown content.";
        let (value, body) = parse(input).unwrap();
        assert!(value.as_mapping().unwrap().is_empty());
        assert_eq!(body, "Just some markdown content.");
    }

    #[test]
    fn missing_close_delimiter_errors() {
        let input = "---\ntitle: Oops\nno closing";
        assert!(parse(input).is_err());
    }
}
