mod bootstrap;
mod frontmatter;
mod helpers;
mod search;
mod types;

use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "talentclaw", about = "your AI career agent")]
struct Cli {
    /// Agent runtime to use (openclaw, zeroclaw, claude)
    #[arg(long)]
    runtime: Option<String>,

    #[command(subcommand)]
    command: Option<Command>,
}

#[derive(Subcommand)]
enum Command {
    /// Discover jobs from Coffee Shop
    Search(search::SearchArgs),
}

#[tokio::main]
async fn main() {
    let cli = Cli::parse();

    match cli.command {
        Some(Command::Search(args)) => {
            if let Err(e) = search::run(args).await {
                helpers::log("✗", &format!("{e}"));
                std::process::exit(1);
            }
        }
        None => {
            if let Err(e) = bootstrap::run(cli.runtime).await {
                helpers::log("✗", &format!("{e}"));
                std::process::exit(1);
            }
        }
    }
}
