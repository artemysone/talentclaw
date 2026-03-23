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

const themeScript = `document.documentElement.classList.add('light')`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
