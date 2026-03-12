import { isSafeUrl } from "@/lib/ui-utils"

interface ContactHeaderProps {
  frontmatter: Record<string, unknown>
}

export function ContactHeader({ frontmatter }: ContactHeaderProps) {
  const name = frontmatter.name as string | undefined
  const company = frontmatter.company as string | undefined
  const title = frontmatter.title as string | undefined
  const email = frontmatter.email as string | undefined
  const linkedin = frontmatter.linkedin as string | undefined

  return (
    <div className="bg-surface-raised border border-border-subtle rounded-xl p-6 space-y-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-text-primary leading-tight">
          {name || "Contact"}
        </h1>
        {title && company && (
          <p className="text-text-secondary mt-0.5">
            {title} at {company}
          </p>
        )}
        {title && !company && (
          <p className="text-text-secondary mt-0.5">{title}</p>
        )}
        {!title && company && (
          <p className="text-text-secondary mt-0.5">{company}</p>
        )}
      </div>

      {(email || linkedin) && (
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {email && (
            <a
              href={`mailto:${email}`}
              className="text-accent hover:underline"
            >
              {email}
            </a>
          )}
          {linkedin && isSafeUrl(linkedin) && (
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              LinkedIn
            </a>
          )}
        </div>
      )}
    </div>
  )
}
