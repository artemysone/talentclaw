import { buildCareerGraph } from "@/lib/graph-data"
import CareerGraph from "@/components/graph/career-graph"
import { Share2 } from "lucide-react"

export default async function GraphPage() {
  const { nodes, edges } = await buildCareerGraph()

  if (nodes.length <= 1) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent-subtle flex items-center justify-center">
            <Share2 className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            Build your career graph
          </h2>
          <p className="text-sm text-text-secondary mb-4">
            Add skills, experience, and goals to your profile to see your career
            context graph come to life.
          </p>
          <a
            href="/dashboard"
            className="text-sm text-accent hover:text-accent-hover font-medium"
          >
            Go to Career Hub →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <CareerGraph nodes={nodes} edges={edges} />
    </div>
  )
}
