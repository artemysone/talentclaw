'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { CareerGraphData, CareerNodeType } from '@/lib/career-graph-data'

// ── Theme colors ─────────────────────────────────────────────

const NODE_COLORS: Record<'light' | 'dark', Record<CareerNodeType, string>> = {
  light: {
    profile:   "#059669",
    skill:     "#a8a29e",
    company:   "#c4884d",
    title:     "#8b7ec8",
    project:   "#10b981",
    education: "#7c8bb5",
  },
  dark: {
    profile:   "#34d399",
    skill:     "#78716c",
    company:   "#d4a06a",
    title:     "#a899d6",
    project:   "#6ee7b7",
    education: "#99a6cc",
  },
}

const THEME = {
  light: {
    bg: "#ffffff",
    edge: { r: 0, g: 0, b: 0, a: 0.06 },
    edgeHi: { r: 0, g: 0, b: 0, a: 0.2 },
    label: { r: 28, g: 25, b: 23, a: 0.6 },
    labelBright: { r: 28, g: 25, b: 23, a: 0.85 },
  },
  dark: {
    bg: "#1a1a1a",
    edge: { r: 255, g: 255, b: 255, a: 0.07 },
    edgeHi: { r: 255, g: 255, b: 255, a: 0.3 },
    label: { r: 214, g: 211, b: 209, a: 0.7 },
    labelBright: { r: 231, g: 229, b: 228, a: 0.9 },
  },
}

type RGBA = { r: number; g: number; b: number; a: number }

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}

// ── Layout node ──────────────────────────────────────────────

interface LayoutNode {
  slug: string
  type: CareerNodeType
  label: string
  x: number
  y: number
  vx: number
  vy: number
  connections: number
  neighbors: Set<string>
}

// ── Constants ────────────────────────────────────────────────

const REPULSION = 1800
const SPRING_LENGTH = 120
const SPRING_K = 0.004
const DAMPING = 0.88
const CENTER_GRAVITY = 0.0008
const SETTLE_ITERATIONS = 600

function detectMode(): 'light' | 'dark' {
  const root = document.documentElement
  if (root.classList.contains('dark')) return 'dark'
  if (root.classList.contains('light')) return 'light'
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// ── Component ────────────────────────────────────────────────

export default function CareerContextCanvas({ data }: { data: CareerGraphData }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{
    nodes: LayoutNode[]
    edges: { source: LayoutNode; target: LayoutNode }[]
    W: number
    H: number
    hoveredNode: LayoutNode | null
    mode: 'light' | 'dark'
  } | null>(null)

  const initState = useCallback((W: number, H: number) => {
    const nodeMap: Record<string, LayoutNode> = {}
    const nodes: LayoutNode[] = data.nodes.map((n) => {
      const node: LayoutNode = {
        ...n,
        x: W / 2 + (Math.random() - 0.5) * 300,
        y: H / 2 + (Math.random() - 0.5) * 300,
        vx: 0, vy: 0,
        connections: 0,
        neighbors: new Set(),
      }
      nodeMap[n.slug] = node
      return node
    })

    const edges = data.edges.map((e) => {
      const source = nodeMap[e.from]
      const target = nodeMap[e.to]
      if (source) { source.connections++; source.neighbors.add(e.to) }
      if (target) { target.connections++; target.neighbors.add(e.from) }
      return { source, target }
    }).filter(e => e.source && e.target)

    const mode: 'light' | 'dark' = detectMode()

    // Run physics to settle layout — all computation happens here, not in render loop
    let cf = 1.0
    for (let i = 0; i < SETTLE_ITERATIONS; i++) {
      for (let a = 0; a < nodes.length; a++) {
        for (let b = a + 1; b < nodes.length; b++) {
          const na = nodes[a], nb = nodes[b]
          const dx = nb.x - na.x, dy = nb.y - na.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const f = REPULSION / (dist * dist) * cf
          const fx = (dx / dist) * f, fy = (dy / dist) * f
          na.vx -= fx; na.vy -= fy
          nb.vx += fx; nb.vy += fy
        }
      }
      for (const e of edges) {
        const dx = e.target.x - e.source.x, dy = e.target.y - e.source.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const f = SPRING_K * (dist - SPRING_LENGTH) * cf
        const fx = (dx / dist) * f, fy = (dy / dist) * f
        e.source.vx += fx; e.source.vy += fy
        e.target.vx -= fx; e.target.vy -= fy
      }
      for (const n of nodes) {
        n.vx += (W / 2 - n.x) * CENTER_GRAVITY * cf
        n.vy += (H / 2 - n.y) * CENTER_GRAVITY * cf
        n.vx *= DAMPING; n.vy *= DAMPING
        n.x += n.vx; n.y += n.vy
      }
      cf *= 0.995
    }

    // Fit the graph into the container with padding for labels
    const PAD = 40
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const n of nodes) {
      const r = nodeRadius(n)
      // Account for label below the node (~20px)
      minX = Math.min(minX, n.x - r - 40)
      maxX = Math.max(maxX, n.x + r + 40)
      minY = Math.min(minY, n.y - r)
      maxY = Math.max(maxY, n.y + r + 20)
    }
    const graphW = maxX - minX
    const graphH = maxY - minY
    const scaleX = (W - PAD * 2) / graphW
    const scaleY = (H - PAD * 2) / graphH
    const scale = Math.min(scaleX, scaleY, 1) // never upscale
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    for (const n of nodes) {
      n.x = W / 2 + (n.x - cx) * scale
      n.y = H / 2 + (n.y - cy) * scale
    }

    const state = { nodes, edges, W, H, hoveredNode: null as LayoutNode | null, mode }
    stateRef.current = state
    return state
  }, [data])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      const dpr = window.devicePixelRatio || 1
      const rect = container!.getBoundingClientRect()
      const W = rect.width, H = rect.height
      canvas!.width = W * dpr
      canvas!.height = H * dpr
      canvas!.style.width = W + 'px'
      canvas!.style.height = H + 'px'
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      if (!stateRef.current) {
        initState(W, H)
      } else {
        stateRef.current.W = W
        stateRef.current.H = H
      }
      redraw()
    }

    function redraw() {
      const s = stateRef.current
      if (s) draw(ctx!, s)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)

    // Theme change — watch both system preference and class-based toggle
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    function onThemeChange() {
      if (stateRef.current) {
        stateRef.current.mode = detectMode()
        redraw()
      }
    }
    mql.addEventListener('change', onThemeChange)

    // Watch for class-based theme changes (e.g. ThemeToggle adding .dark/.light)
    const classObserver = new MutationObserver(onThemeChange)
    classObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    // Hover only — no drag, pan, or zoom
    function hitTest(mx: number, my: number): LayoutNode | null {
      const s = stateRef.current!
      let closest: LayoutNode | null = null
      let closestDist = Infinity
      for (const n of s.nodes) {
        const dx = mx - n.x, dy = my - n.y
        const r = nodeRadius(n) + 4
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < r && dist < closestDist) {
          closest = n
          closestDist = dist
        }
      }
      return closest
    }

    function onMouseMove(e: MouseEvent) {
      const s = stateRef.current
      if (!s) return
      const rect = container!.getBoundingClientRect()
      const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top)
      if (hit !== s.hoveredNode) {
        s.hoveredNode = hit
        canvas!.style.cursor = hit ? 'pointer' : 'default'
        redraw()
      }
    }

    function onMouseLeave() {
      const s = stateRef.current
      if (s && s.hoveredNode) {
        s.hoveredNode = null
        redraw()
      }
    }

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)

    return () => {
      observer.disconnect()
      classObserver.disconnect()
      mql.removeEventListener('change', onThemeChange)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [initState])

  if (data.nodes.length <= 1) {
    return (
      <div className="flex items-center justify-center w-full h-full text-text-muted text-sm">
        Add skills and experience to your profile to see your career graph.
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────

function nodeRadius(node: LayoutNode): number {
  const base = node.type === "profile" ? 12 : 4
  return base + Math.min(node.connections * 0.8, 8)
}

function draw(ctx: CanvasRenderingContext2D, s: {
  nodes: LayoutNode[]
  edges: { source: LayoutNode; target: LayoutNode }[]
  W: number; H: number
  hoveredNode: LayoutNode | null
  mode: 'light' | 'dark'
}) {
  const { nodes, edges, W, H, hoveredNode, mode } = s
  const t = THEME[mode]
  const colors = NODE_COLORS[mode]

  ctx.fillStyle = t.bg
  ctx.fillRect(0, 0, W, H)

  const isHovering = hoveredNode != null
  const neighborSlugs = hoveredNode?.neighbors

  function highlighted(n: LayoutNode) {
    if (!isHovering) return true
    return n === hoveredNode || !!neighborSlugs?.has(n.slug)
  }

  function opacity(n: LayoutNode) {
    if (isHovering && !highlighted(n)) return 0.08
    return 1
  }

  // Edges
  for (const e of edges) {
    const srcH = highlighted(e.source)
    const tgtH = highlighted(e.target)
    const hi = isHovering && srcH && tgtH
    const a = isHovering ? (hi ? 1 : 0.05) : 1
    if (a <= 0) continue

    const ec: RGBA = hi ? t.edgeHi : t.edge
    ctx.beginPath()
    ctx.moveTo(e.source.x, e.source.y)
    ctx.lineTo(e.target.x, e.target.y)
    ctx.strokeStyle = `rgba(${ec.r},${ec.g},${ec.b},${ec.a * (hi ? 1 : a)})`
    ctx.lineWidth = hi ? 1 : 0.5
    ctx.stroke()
  }

  // Nodes
  for (const n of nodes) {
    const a = opacity(n)
    if (a <= 0) continue
    const r = nodeRadius(n)
    const rgb = hexToRgb(colors[n.type] || "#a8a29e")
    ctx.beginPath()
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${a * 0.85})`
    ctx.fill()
  }

  // Labels
  for (const n of nodes) {
    const a = opacity(n)
    if (a <= 0) continue
    const r = nodeRadius(n)

    const show = true

    ctx.font = "500 11px 'DM Sans', sans-serif"
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    const bright = n === hoveredNode || (isHovering && neighborSlugs?.has(n.slug))
    const lc: RGBA = bright ? t.labelBright : t.label
    ctx.fillStyle = `rgba(${lc.r},${lc.g},${lc.b},${a * (bright ? 1 : 0.8)})`
    ctx.fillText(n.label, n.x, n.y + r + 6)
  }
}
