"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-8">
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-xl font-semibold text-primary">
          Something went wrong
        </h2>
        <p className="text-sm text-secondary">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 text-sm font-medium rounded-md bg-accent text-white hover:bg-accent/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
