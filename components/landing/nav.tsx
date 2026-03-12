"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { CrabLogo } from "@/components/crab-logo"

export function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-surface/95 backdrop-blur-sm">
      <div className="max-w-[1152px] mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <CrabLogo className="w-8 h-8 text-emerald-600" />
          <span className="text-xl font-semibold tracking-tight">talentclaw</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-6 list-none">
          <li>
            <a href="#features" className="text-sm text-stone-400 hover:text-stone-800 transition-colors">
              Features
            </a>
          </li>
          <li>
            <a href="#how-it-works" className="text-sm text-stone-400 hover:text-stone-800 transition-colors">
              How it works
            </a>
          </li>
          <li>
            <Link
              href="/dashboard"
              className="text-sm text-stone-400 hover:text-stone-800 transition-colors"
            >
              Dashboard
            </Link>
          </li>
          <li>
            <a
              href="https://github.com/artemyshq/talentclaw"
              className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium shadow-sm hover:bg-emerald-500 transition-colors"
            >
              Get Started
            </a>
          </li>
        </ul>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-stone-400 hover:text-stone-800 transition-colors"
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="fixed top-14 left-0 right-0 bottom-0 bg-surface z-[99] flex flex-col items-center justify-center gap-10 md:hidden">
          <a
            href="#features"
            onClick={() => setOpen(false)}
            className="text-2xl font-medium text-stone-800"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setOpen(false)}
            className="text-2xl font-medium text-stone-800"
          >
            How it works
          </a>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="text-2xl font-medium text-stone-800"
          >
            Dashboard
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
