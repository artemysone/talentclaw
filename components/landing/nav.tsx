"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { CrabLogo } from "@/components/crab-logo"

export function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-black/5">
      <div className="max-w-[1152px] mx-auto px-4 flex items-center h-14">
        {/* Logo + brand */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <CrabLogo className="w-8 h-8 text-emerald-600" />
          <span className="text-xl font-semibold tracking-tight">talentclaw</span>
          <span className="text-sm text-stone-400 font-prose italic hidden sm:inline">by Artemys</span>
        </Link>

        {/* Desktop action buttons — right */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          <Link
            href="/dashboard"
            className="text-sm text-stone-600 px-5 py-1.5 rounded-full border border-stone-200 hover:border-stone-300 hover:text-stone-800 transition-colors"
          >
            Log in
          </Link>
          <a
            href="https://github.com/artemyshq/talentclaw"
            className="text-sm font-medium text-white bg-emerald-600 px-5 py-1.5 rounded-full hover:bg-emerald-500 transition-colors"
          >
            Get Started
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden ml-auto p-2 text-stone-400 hover:text-stone-800 transition-colors"
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="fixed top-14 left-0 right-0 bottom-0 bg-surface z-[99] flex flex-col items-center justify-center gap-10 md:hidden">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="text-2xl font-medium text-stone-800"
          >
            Log in
          </Link>
          <a
            href="https://github.com/artemyshq/talentclaw"
            onClick={() => setOpen(false)}
            className="text-2xl font-medium text-emerald-600"
          >
            Get Started
          </a>
        </div>
      )}
    </nav>
  )
}
