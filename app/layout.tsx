import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "talentclaw - Your AI Career Agent",
  description:
    "A local-first career CRM powered by AI. Discover jobs, manage your pipeline, and let your agent handle the search.",
  openGraph: {
    title: "talentclaw - Your AI Career Agent",
    description:
      "A local-first career CRM powered by AI. Discover jobs, manage your pipeline, and let your agent handle the search.",
    siteName: "talentclaw",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-surface text-stone-800 antialiased">
        {children}
      </body>
    </html>
  )
}
