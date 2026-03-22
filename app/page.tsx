import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Hero } from "@/components/landing/hero"
import { HubShowcase } from "@/components/landing/hub-showcase"
import { Features } from "@/components/landing/features"
import { Footer } from "@/components/landing/footer"
import { DownloadSection } from "@/components/landing/download-section"
export default async function RootPage() {
  const host = (await headers()).get("host") || ""
  if (host.includes(":3100")) {
    redirect("/dashboard")
  }

  return (
    <>
      <div className="absolute top-4 left-5">
        <span className="px-2.5 py-1 rounded-full text-[0.65rem] font-medium uppercase tracking-wider bg-emerald-600/10 text-emerald-600">Beta</span>
      </div>
      <Hero />
      <HubShowcase />
      <Features />
      <DownloadSection />
      <Footer />
    </>
  )
}
