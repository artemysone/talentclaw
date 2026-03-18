"use client"

import { MessageCircle, X } from "lucide-react"

export function ChatToggle({
  isOpen,
  onToggle,
  isAvailable,
}: {
  isOpen: boolean
  onToggle: () => void
  isAvailable: boolean | null
}) {
  // Only render when definitely available
  if (isAvailable !== true) return null

  return (
    <button
      type="button"
      onClick={onToggle}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-accent text-white
        shadow-lg hover:shadow-xl hover:scale-105 active:scale-95
        flex items-center justify-center transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      <div className="relative w-5 h-5">
        <MessageCircle
          className={`w-5 h-5 absolute inset-0 transition-all duration-200 ${
            isOpen ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
          }`}
        />
        <X
          className={`w-5 h-5 absolute inset-0 transition-all duration-200 ${
            isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
          }`}
        />
      </div>
    </button>
  )
}
