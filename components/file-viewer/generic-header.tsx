interface GenericHeaderProps {
  frontmatter: Record<string, unknown>
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

export function GenericHeader({ frontmatter }: GenericHeaderProps) {
  const entries = Object.entries(frontmatter).filter(
    ([, v]) => v !== null && v !== undefined
  )

  if (entries.length === 0) return null

  return (
    <div className="bg-surface-raised border border-border-subtle rounded-xl p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt className="text-xs uppercase text-text-muted tracking-wide">
              {key.replace(/_/g, " ")}
            </dt>
            <dd className="text-sm text-text-primary mt-0.5">
              {formatValue(value)}
            </dd>
          </div>
        ))}
      </div>
    </div>
  )
}
