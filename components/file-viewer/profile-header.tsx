interface ProfileHeaderProps {
  frontmatter: Record<string, unknown>
}

const availabilityLabels: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: "Actively Looking", bg: "bg-emerald-100", text: "text-emerald-700" },
  passive: { label: "Open to Opportunities", bg: "bg-blue-100", text: "text-blue-700" },
  not_looking: { label: "Not Looking", bg: "bg-slate-100", text: "text-slate-600" },
}

export function ProfileHeader({ frontmatter }: ProfileHeaderProps) {
  const displayName = frontmatter.display_name as string | undefined
  const headline = frontmatter.headline as string | undefined
  const skills = frontmatter.skills as string[] | undefined
  const experienceYears = frontmatter.experience_years as number | undefined
  const preferredRoles = frontmatter.preferred_roles as string[] | undefined
  const preferredLocations = frontmatter.preferred_locations as string[] | undefined
  const remotePreference = frontmatter.remote_preference as string | undefined
  const availability = frontmatter.availability as string | undefined

  const avail = availability ? availabilityLabels[availability] : null

  return (
    <div className="bg-surface-raised border border-border-subtle rounded-xl p-6 space-y-4">
      {/* Name and headline */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-text-primary leading-tight">
            {displayName || "Profile"}
          </h1>
          {headline && (
            <p className="text-text-secondary mt-0.5">{headline}</p>
          )}
        </div>
        {avail && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${avail.bg} ${avail.text}`}
          >
            {avail.label}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
        {typeof experienceYears === "number" && (
          <span>{experienceYears} years experience</span>
        )}
        {remotePreference && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            {remotePreference.replace(/_/g, " ")}
          </span>
        )}
      </div>

      {/* Skills */}
      {skills && skills.length > 0 && (
        <div>
          <p className="text-xs uppercase text-text-muted tracking-wide mb-2">
            Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-subtle text-accent"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Preferred roles */}
      {preferredRoles && preferredRoles.length > 0 && (
        <div>
          <p className="text-xs uppercase text-text-muted tracking-wide mb-1">
            Preferred Roles
          </p>
          <p className="text-sm text-text-primary">
            {preferredRoles.join(", ")}
          </p>
        </div>
      )}

      {/* Preferred locations */}
      {preferredLocations && preferredLocations.length > 0 && (
        <div>
          <p className="text-xs uppercase text-text-muted tracking-wide mb-1">
            Preferred Locations
          </p>
          <p className="text-sm text-text-primary">
            {preferredLocations.join(", ")}
          </p>
        </div>
      )}
    </div>
  )
}
