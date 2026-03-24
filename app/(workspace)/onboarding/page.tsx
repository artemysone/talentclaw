import { redirect } from "next/navigation"
import { hasCompletedOnboarding } from "@/lib/fs-data"
import { OnboardingPage } from "@/components/onboarding/onboarding-page"

export default async function OnboardingRoute() {
  const onboarded = await hasCompletedOnboarding()
  if (onboarded) {
    redirect("/dashboard")
  }

  return <OnboardingPage />
}
