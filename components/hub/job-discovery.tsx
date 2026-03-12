import Link from "next/link"
import type { JobFrontmatter } from "@/lib/types"

interface JobDiscoveryProps {
  jobs: { frontmatter: JobFrontmatter }[]
}

export function JobDiscovery({ jobs }: JobDiscoveryProps) {
  const total = jobs.length
  const bySource = jobs.reduce<Record<string, number>>((acc, j) => {
    const src = j.frontmatter.source || "manual"
    acc[src] = (acc[src] || 0) + 1
    return acc
  }, {})

  const lastDiscovery = jobs
    .filter((j) => j.frontmatter.discovered_at)
    .sort((a, b) =>
      (b.frontmatter.discovered_at || "").localeCompare(
        a.frontmatter.discovered_at || ""
      )
    )[0]

  return (
    <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        Job Discovery
      </h3>

      {total > 0 ? (
        <>
          <p className="text-2xl font-bold text-text-primary">{total}</p>
          <p className="text-xs text-text-secondary mt-0.5">
            jobs in your workspace
          </p>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {Object.entries(bySource).map(([src, count]) => (
              <span
                key={src}
                className="text-xs font-mono px-2 py-1 rounded-md bg-surface-overlay text-text-secondary border border-border-subtle"
              >
                {src} ({count})
              </span>
            ))}
          </div>

          {lastDiscovery && (
            <div className="mt-4 pt-3 border-t border-border-subtle">
              <p className="text-[10px] font-mono text-text-muted">
                last: {lastDiscovery.frontmatter.discovered_at}
              </p>
            </div>
          )}

          <Link
            href="/jobs"
            className="block mt-4 text-xs text-accent hover:text-accent-hover transition-colors"
          >
            Browse jobs &rarr;
          </Link>
        </>
      ) : (
        <div>
          <p className="text-sm text-text-muted">No jobs discovered yet.</p>
          <p className="text-xs text-text-muted mt-1">
            Run{" "}
            <code className="text-accent bg-accent/5 px-1 py-0.5 rounded text-[0.7rem]">
              talentclaw search
            </code>{" "}
            to get started.
          </p>
        </div>
      )}
    </div>
  )
}
