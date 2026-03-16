use serde::{Deserialize, Serialize};

// -- Pipeline stages ----------------------------------------------------------

pub const PIPELINE_STAGES: &[&str] = &[
    "discovered",
    "saved",
    "applied",
    "interviewing",
    "offer",
    "accepted",
    "rejected",
];

// -- Compensation -------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Compensation {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max: Option<f64>,
    #[serde(default = "default_currency")]
    pub currency: String,
}

fn default_currency() -> String {
    "USD".into()
}

// -- Job frontmatter ----------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobFrontmatter {
    pub title: String,
    pub company: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub remote: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub compensation: Option<Compensation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(default = "default_source")]
    pub source: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub coffeeshop_id: Option<String>,
    #[serde(default = "default_status")]
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub match_score: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub discovered_at: Option<String>,
}

fn default_source() -> String {
    "manual".into()
}

fn default_status() -> String {
    "discovered".into()
}

// -- Profile frontmatter ------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ProfileFrontmatter {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub headline: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub skills: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub experience_years: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preferred_roles: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preferred_locations: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub remote_preference: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub salary_range: Option<Compensation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub availability: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub coffeeshop_agent_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub experience: Option<Vec<Experience>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub education: Option<Vec<Education>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub projects: Option<Vec<Project>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub goals: Option<Vec<Goal>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Experience {
    pub company: String,
    pub title: String,
    pub start: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub skills: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub projects: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub industry: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Education {
    pub institution: String,
    pub degree: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub year: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub skills: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub skills: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Goal {
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

// -- Activity log entry (JSONL) -----------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityEntry {
    pub ts: String,
    #[serde(rename = "type")]
    pub entry_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub slug: Option<String>,
    pub summary: String,
}

// -- Coffee Shop search response ----------------------------------------------

#[derive(Debug, Clone, Deserialize)]
pub struct CoffeeShopResponse {
    pub total: u32,
    pub matches: Vec<CoffeeShopMatch>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CoffeeShopMatch {
    pub job: CoffeeShopJob,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CoffeeShopJob {
    pub id: String,
    pub title: String,
    #[serde(default)]
    pub requirements: Option<CoffeeShopRequirements>,
    #[serde(default)]
    pub compensation: Option<CoffeeShopCompensation>,
    #[serde(default)]
    pub company_context: Option<CoffeeShopCompanyContext>,
    #[serde(default)]
    pub apply_url: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CoffeeShopRequirements {
    #[serde(default)]
    pub skills: Option<Vec<String>>,
    #[serde(default)]
    pub location: Option<String>,
    #[serde(default)]
    pub remote_policy: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CoffeeShopCompensation {
    #[serde(default)]
    pub min: Option<f64>,
    #[serde(default)]
    pub max: Option<f64>,
    #[serde(default)]
    pub currency: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CoffeeShopCompanyContext {
    #[serde(default)]
    pub company_name: Option<String>,
}

// -- Runtime (for bootstrap) --------------------------------------------------

#[derive(Debug, Clone)]
pub struct Runtime {
    pub name: String,
    pub cmd: String,
    pub version: Option<String>,
    pub skill_dir: String,
}
