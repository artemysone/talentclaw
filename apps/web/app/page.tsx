import { Nav } from "@/components/landing/nav"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Footer } from "@/components/landing/footer"
import { RevealObserver } from "@/components/landing/reveal-observer"

const steps = [
  {
    num: 1,
    title: "Set up your profile",
    desc: "Tell TalentClaw your target roles, skills, and what matters to you. Import a resume or start from scratch.",
  },
  {
    num: 2,
    title: "Your agent goes to work",
    desc: "TalentClaw scans the network, discovers matching roles, and surfaces them in your pipeline. No manual searching.",
  },
  {
    num: 3,
    title: "You make the calls",
    desc: "Review matches, approve applications, track progress. Your agent handles the logistics -- you make the decisions.",
  },
]

const faqs = [
  {
    q: "What is TalentClaw?",
    a: "TalentClaw is an AI career agent and local-first career CRM. It manages your job search pipeline, discovers opportunities through the agent network, and handles applications -- all while keeping your data on your machine.",
  },
  {
    q: "What does local-first mean?",
    a: "Your career data is stored as markdown files in ~/.talentclaw/ on your machine. No cloud databases, no third-party data storage. Human-readable, git-friendly, and fully portable. You own your data completely.",
  },
  {
    q: "How does job discovery work?",
    a: "TalentClaw connects to the Coffee Shop exchange -- a network where career agents and employer agents communicate directly. Your agent finds matching roles, evaluates fit, and presents the best opportunities.",
  },
  {
    q: "What is the Coffee Shop?",
    a: "The Coffee Shop is the exchange where career agents and employer agents meet. Instead of filling out forms on job boards, your agent communicates directly with employer agents through a shared protocol -- faster, more efficient, and more transparent.",
  },
  {
    q: "Is my data private?",
    a: "Yes. TalentClaw stores everything as local files on your machine. Your data never leaves your machine unless you explicitly choose to share it through the agent network. You can delete everything at any time.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-stone-800 overflow-x-hidden leading-[1.65]">
      <RevealObserver />
      <Nav />

      <main>
        <Hero />

        {/* How it works */}
        <section id="how-it-works" className="py-16 px-5 max-w-[900px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="reveal font-prose text-[clamp(1.5rem,3vw,2.2rem)] font-bold tracking-[-0.02em] mb-3">
              Three steps. Then your agent takes over.
            </h2>
            <p className="reveal reveal-delay-1 text-stone-600 text-[1rem]">
              Set up in 2 minutes, then let TalentClaw work for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className={`reveal ${i > 0 ? `reveal-delay-${i}` : ""} flex flex-col items-center text-center`}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-prose text-lg font-bold text-white mb-4 bg-stone-800">
                  {step.num}
                </div>
                <h3 className="font-prose text-[1.05rem] font-semibold mb-2">
                  {step.title}
                </h3>
                <p className="text-stone-600 text-[0.88rem] leading-[1.6]">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Features />

        {/* FAQ */}
        <section id="faq" className="py-16 px-5 max-w-[1152px] mx-auto">
          <h2 className="reveal font-prose text-[clamp(1.5rem,3vw,2.2rem)] font-bold tracking-[-0.02em] mb-8 text-center">
            Questions & answers
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
            {faqs.map((faq, i) => (
              <div
                key={faq.q}
                className={`reveal ${i % 2 === 1 ? "reveal-delay-1" : ""}`}
              >
                <h3 className="font-prose text-[1rem] font-semibold mb-1.5">
                  {faq.q}
                </h3>
                <p className="text-stone-600 text-[0.88rem] leading-[1.65]">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 px-5 text-center relative">
          <div className="absolute rounded-[50%_40%_60%_50%/50%_60%_40%_50%] blur-[80px] opacity-20 pointer-events-none w-[400px] h-[400px] bg-emerald-300 -bottom-[100px] left-[20%]" />
          <div className="absolute rounded-[50%_40%_60%_50%/50%_60%_40%_50%] blur-[80px] opacity-20 pointer-events-none w-[350px] h-[350px] bg-emerald-200 -top-[80px] right-[10%]" />

          <h2 className="reveal font-prose text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-[-0.02em] mb-4 relative z-[1]">
            Stop grinding. Start deciding.
          </h2>
          <p className="reveal reveal-delay-1 text-stone-600 text-[1.05rem] mb-8 max-w-[480px] mx-auto relative z-[1]">
            Let TalentClaw handle the search, the applications, and the follow-ups.
            You show up when it matters.
          </p>
          <a
            href="https://github.com/artemyshq/talentclaw"
            className="reveal reveal-delay-2 inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-3.5 rounded-full font-semibold text-[0.95rem] shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:bg-emerald-500 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(5,150,105,0.2)] transition-all relative z-[1]"
          >
            Get Started on GitHub
          </a>
        </section>
      </main>

      <Footer />
    </div>
  )
}
