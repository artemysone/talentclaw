import { Nav } from "@/components/landing/nav"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Footer } from "@/components/landing/footer"
import { RevealObserver } from "@/components/landing/reveal-observer"

export default function RootPage() {
  return (
    <>
      <RevealObserver />
      <Nav />
      <Hero />
<Features />
      <Footer />
    </>
  )
}
