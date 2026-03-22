"use client"

const suggestions = [
  "Find me jobs",
  "Optimize my profile",
  "Review my pipeline",
  "Career advice",
]

export function SuggestionChips({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      {suggestions.map((text) => (
        <button
          key={text}
          type="button"
          onClick={() => onSelect(text)}
          className="border border-border-subtle rounded-full px-4 py-2 text-sm text-text-secondary
            hover:text-text-primary hover:bg-surface-overlay transition-colors cursor-pointer"
        >
          {text}
        </button>
      ))}
    </div>
  )
}
