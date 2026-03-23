import { CrabLogo } from "@/components/crab-logo"

export function Footer() {
  return (
    <footer className="py-10 px-5 flex flex-col md:flex-row justify-between items-center gap-4 max-w-[1152px] mx-auto">
      <div className="flex items-center gap-2.5">
        <CrabLogo className="w-6 h-6 text-emerald-600" />
        <span className="text-[0.8rem] text-text-muted">talentclaw by Jeffrey Blue</span>
      </div>
      <ul className="flex gap-6 list-none">
        <li>
          <a href="/privacy" className="text-[0.8rem] text-text-muted hover:text-text-primary transition-colors py-3">
            Privacy
          </a>
        </li>
        <li>
          <a href="/terms" className="text-[0.8rem] text-text-muted hover:text-text-primary transition-colors py-3">
            Terms
          </a>
        </li>
        <li>
          <a
            href="https://github.com/artemysone/talentclaw"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.8rem] text-text-muted hover:text-text-primary transition-colors py-3"
          >
            GitHub
          </a>
        </li>
      </ul>
    </footer>
  )
}
