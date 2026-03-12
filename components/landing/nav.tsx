import Link from "next/link"
import { CrabLogo } from "@/components/crab-logo"

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-black/5">
      <div className="max-w-[1152px] mx-auto px-4 flex items-center h-14">
        {/* Logo + brand */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <CrabLogo className="w-8 h-8 text-emerald-600" />
          <span className="text-xl font-semibold tracking-tight">talentclaw</span>
          <span className="text-sm text-stone-400 font-prose italic hidden sm:inline">by Artemys</span>
        </Link>

      </div>
    </nav>
  )
}
