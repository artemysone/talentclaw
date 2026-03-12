"use client"

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-lg font-semibold text-primary">
          Workspace error
        </h2>
        <p className="text-sm text-secondary">
          {error.message || "Failed to load workspace data. The data directory may be missing or unreadable."}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 text-sm font-medium rounded-md bg-accent text-white hover:bg-accent/90 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  )
}
