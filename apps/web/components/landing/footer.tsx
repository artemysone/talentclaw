import { Cog } from "lucide-react"

export function Footer() {
  return (
    <footer className="py-10 px-5 flex flex-col md:flex-row justify-between items-center gap-4 max-w-[1152px] mx-auto">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center">
          <Cog className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-[0.8rem] text-stone-400">TalentClaw by Artemys</span>
      </div>
      <ul className="flex gap-6 list-none">
        <li>
          <a href="#" className="text-[0.8rem] text-stone-400 hover:text-stone-800 transition-colors">
            Privacy
          </a>
        </li>
        <li>
          <a href="#" className="text-[0.8rem] text-stone-400 hover:text-stone-800 transition-colors">
            Terms
          </a>
        </li>
        <li>
          <a
            href="https://github.com/artemyshq"
            className="text-[0.8rem] text-stone-400 hover:text-stone-800 transition-colors"
          >
            GitHub
          </a>
        </li>
      </ul>
    </footer>
  )
}
