"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Listens for custom "dataVersionChange" events and calls router.refresh()
 * to re-render server components with fresh data.
 */
export function DataRefreshProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const handler = () => {
      router.refresh()
    }
    window.addEventListener("dataVersionChange", handler)
    return () => window.removeEventListener("dataVersionChange", handler)
  }, [router])

  return <>{children}</>
}
