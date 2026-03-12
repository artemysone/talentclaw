interface UpcomingAction {
  title: string
  company: string
  date: string
  urgent: boolean
  overdue: boolean
}

interface UpcomingActionsProps {
  actions: UpcomingAction[]
}

export function UpcomingActions({ actions }: UpcomingActionsProps) {
  return (
    <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-5">
        Upcoming Actions
      </h3>

      {actions.length > 0 ? (
        <div className="space-y-4">
          {actions.map((action) => (
            <div
              key={`${action.company}-${action.date}`}
              className="flex items-start gap-3"
            >
              <div
                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  action.overdue
                    ? "bg-danger"
                    : action.urgent
                      ? "bg-warning"
                      : "bg-accent"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary font-medium truncate">
                  {action.title}
                </p>
                <p className="text-xs text-text-muted">
                  {action.company} &middot; {action.date}
                  {action.overdue && (
                    <span className="text-danger ml-1.5 font-medium">
                      Overdue
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">No upcoming actions.</p>
      )}
    </div>
  )
}
