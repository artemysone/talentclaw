interface CompanyHeaderProps {
  frontmatter: Record<string, unknown>
}

export function CompanyHeader({ frontmatter }: CompanyHeaderProps) {
  const name = frontmatter.name as string | undefined
  const url = frontmatter.url as string | undefined
  const size = frontmatter.size as string | undefined
  const industry = frontmatter.industry as string | undefined

  return (
    <div className="bg-surface-raised border border-border-subtle rounded-xl p-6 space-y-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-text-primary leading-tight">
          {name || "Company"}
        </h1>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:underline mt-0.5 inline-block"
          >
            {url}
          </a>
        )}
      </div>

      {(size || industry) && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
          {size && (
            <span>
              <span className="text-text-muted">Size:</span> {size}
            </span>
          )}
          {industry && (
            <span>
              <span className="text-text-muted">Industry:</span> {industry}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
