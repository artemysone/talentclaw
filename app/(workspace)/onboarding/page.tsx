import { redirect } from "next/navigation"
import { getProfile } from "@/lib/fs-data"
import { OnboardingPage } from "@/components/onboarding/onboarding-page"

export default async function OnboardingRoute() {
  const profile = await getProfile()

  // Already onboarded — redirect to dashboard (mirrors dashboard isFirstRun logic)
  if (profile.frontmatter.display_name || profile.frontmatter.headline) {
    redirect("/dashboard")
  }

  return <OnboardingPage />
}
