export interface GraphNode {
  id: string
  label: string
  type: 'person' | 'company' | 'education' | 'role' | 'skill' | 'project' | 'goal' | 'industry'
  cluster: 'center' | 'companies' | 'titles' | 'skills' | 'projects' | 'trajectory'
  detail?: string
  size: number
}

export interface GraphEdge {
  source: string
  target: string
}

export const CLUSTER_COLORS: Record<string, string> = {
  center: '#059669',
  companies: '#3b82f6',
  titles: '#8b5cf6',
  skills: '#f59e0b',
  projects: '#ec4899',
  trajectory: '#10b981',
}

export const NODE_COLORS: Record<string, string> = {
  person: '#059669',
  skill: '#f59e0b',
  company: '#3b82f6',
  project: '#ec4899',
  role: '#8b5cf6',
  education: '#3b82f6',
  goal: '#10b981',
  industry: '#10b981',
}

export const CLUSTER_DESCRIPTIONS: Record<string, string> = {
  companies: "Where you've been",
  titles: "Roles you've held",
  skills: "What you know",
  projects: "What you've built",
  trajectory: "Where you're headed",
}
