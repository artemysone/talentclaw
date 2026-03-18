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

const themeScript = `
(function() {
  var t = localStorage.getItem('talentclaw-theme');
  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else if (t === 'light') {
    document.documentElement.classList.add('light');
  }
})()
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-surface text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
