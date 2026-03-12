'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Search, Plus, Minus, RotateCcw } from 'lucide-react'
import {
  type GraphNode,
  type GraphEdge,
  CLUSTER_COLORS,
  NODE_COLORS,
  CLUSTER_DESCRIPTIONS,
} from './graph-types'

// ── Internal types for mutable canvas state ──────────────────────────────

interface PositionedNode extends GraphNode {
  x: number
  y: number
  pulseOffset: number
}

interface FieldLine {
  cluster: string
  sx: number
  sy: number
  ex: number
  ey: number
  midX: number
  midY: number
  baseAlpha: number
  phaseOffset: number
  width: number
}

interface FieldParticle {
  lineIndex: number
  t: number
  speed: number
  size: number
  alpha: number
  cluster: string
}

interface TooltipInfo {
  visible: boolean
  x: number
  y: number
  cluster: string
  name: string
  detail: string
  connections: number
}

interface ClusterInfo {
  name: string
  color: string
  description: string
  count: number
}

// ── Utility functions ────────────────────────────────────────────────────

function hexToRGB(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function lerpColor(c1: string, c2: string, t: number) {
  const a = hexToRGB(c1)
  const b = hexToRGB(c2)
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  }
}

function bezierPoint(line: FieldLine, t: number) {
  const mt = 1 - t
  return {
    x: mt * mt * line.sx + 2 * mt * t * line.midX + t * t * line.ex,
    y: mt * mt * line.sy + 2 * mt * t * line.midY + t * t * line.ey,
  }
}

// ── Component ────────────────────────────────────────────────────────────

export default function CareerGraph({
  nodes,
  edges,
}: {
  nodes: GraphNode[]
  edges: GraphEdge[]
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animFrameRef = useRef<number>(0)

  // Mutable refs for canvas state (no re-renders needed)
  const positionedNodesRef = useRef<PositionedNode[]>([])
  const adjRef = useRef<Record<string, Set<string>>>({})
  const fieldLinesRef = useRef<FieldLine[]>([])
  const fieldParticlesRef = useRef<FieldParticle[]>([])
  const timeRef = useRef(0)
  const zoomRef = useRef(1)
  const panXRef = useRef(0)
  const panYRef = useRef(0)
  const panningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0 })
  const hoveredNodeRef = useRef<PositionedNode | null>(null)
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 })

  // React state for UI overlays
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightCluster, setHighlightCluster] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<TooltipInfo>({
    visible: false,
    x: 0,
    y: 0,
    cluster: '',
    name: '',
    detail: '',
    connections: 0,
  })
  const [visibleCount, setVisibleCount] = useState(0)

  // Store search term and highlight cluster in refs so draw loop can read them
  const searchTermRef = useRef(searchTerm)
  const highlightClusterRef = useRef(highlightCluster)
  useEffect(() => { searchTermRef.current = searchTerm }, [searchTerm])
  useEffect(() => { highlightClusterRef.current = highlightCluster }, [highlightCluster])

  // Compute clusters dynamically from node data
  const clusters: ClusterInfo[] = (() => {
    const seen = new Set<string>()
    const counts: Record<string, number> = {}
    for (const n of nodes) {
      if (n.cluster === 'center') continue
      seen.add(n.cluster)
      counts[n.cluster] = (counts[n.cluster] || 0) + 1
    }
    return Array.from(seen).map(name => ({
      name,
      color: CLUSTER_COLORS[name] || '#6b7280',
      description: CLUSTER_DESCRIPTIONS[name] || '',
      count: counts[name],
    }))
  })()

  // ── Coordinate transforms ──────────────────────────────────────────────

  const screenToWorld = useCallback((sx: number, sy: number) => {
    return {
      x: (sx - panXRef.current) / zoomRef.current,
      y: (sy - panYRef.current) / zoomRef.current,
    }
  }, [])

  const worldToScreen = useCallback((wx: number, wy: number) => {
    return {
      x: wx * zoomRef.current + panXRef.current,
      y: wy * zoomRef.current + panYRef.current,
    }
  }, [])

  // ── Visibility ─────────────────────────────────────────────────────────

  const isVisible = useCallback((node: PositionedNode) => {
    const term = searchTermRef.current
    if (!term) return true
    return node.label.toLowerCase().includes(term.toLowerCase())
  }, [])

  // ── Layout (origin-centered, independent of canvas size) ───────────────

  const layoutNodes = useCallback(() => {
    const pNodes = positionedNodesRef.current
    const orbitR = 250
    const spread = 120

    // Center node at origin
    const centerNode = pNodes.find(n => n.cluster === 'center')
    if (centerNode) {
      centerNode.x = 0
      centerNode.y = 0
    }

    // Group non-center nodes by cluster
    const clusterNodes: Record<string, PositionedNode[]> = {}
    for (const n of pNodes) {
      if (n.cluster === 'center') continue
      if (!clusterNodes[n.cluster]) clusterNodes[n.cluster] = []
      clusterNodes[n.cluster].push(n)
    }

    // Dynamically assign angles based on which clusters actually exist
    const activeClusterNames = Object.keys(clusterNodes)
    const clusterAngles: Record<string, number> = {}
    const numClusters = activeClusterNames.length
    if (numClusters > 0) {
      const clusterOrder = ['skills', 'companies', 'titles', 'projects', 'trajectory']
      const sorted = activeClusterNames.sort((a, b) => {
        const ai = clusterOrder.indexOf(a)
        const bi = clusterOrder.indexOf(b)
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      })
      const angleStep = (Math.PI * 2) / numClusters
      sorted.forEach((cl, i) => {
        clusterAngles[cl] = -Math.PI / 2 + i * angleStep
      })
    }

    // Position nodes within each cluster
    for (const cluster of activeClusterNames) {
      const angle = clusterAngles[cluster]
      const clusterCX = Math.cos(angle) * orbitR
      const clusterCY = Math.sin(angle) * orbitR
      const items = clusterNodes[cluster]
      const sorted = [...items].sort((a, b) => b.size - a.size)

      sorted.forEach((n, i) => {
        if (i === 0) {
          n.x = clusterCX
          n.y = clusterCY
        } else {
          const golden = 2.399963
          const a = i * golden
          const r = spread * (0.3 + (i / sorted.length) * 0.7)
          n.x = clusterCX + Math.cos(a) * r
          n.y = clusterCY + Math.sin(a) * r
        }
      })
    }
  }, [])

  // ── Field lines ────────────────────────────────────────────────────────

  const generateFieldLines = useCallback(() => {
    const lines: FieldLine[] = []
    const particles: FieldParticle[] = []
    const pNodes = positionedNodesRef.current

    const centerNode = pNodes.find(n => n.cluster === 'center')
    if (!centerNode) {
      fieldLinesRef.current = lines
      fieldParticlesRef.current = particles
      return
    }

    // Group and compute cluster centers of mass
    const clusterGroups: Record<string, PositionedNode[]> = {}
    for (const n of pNodes) {
      if (n.cluster === 'center') continue
      if (!clusterGroups[n.cluster]) clusterGroups[n.cluster] = []
      clusterGroups[n.cluster].push(n)
    }

    const clusterCenters: Record<string, { x: number; y: number }> = {}
    for (const cl of Object.keys(clusterGroups)) {
      let cx = 0, cy = 0
      const group = clusterGroups[cl]
      for (const n of group) { cx += n.x; cy += n.y }
      cx /= group.length
      cy /= group.length
      clusterCenters[cl] = { x: cx, y: cy }
    }

    // Generate field lines from center to each cluster
    for (const cl of Object.keys(clusterCenters)) {
      const pole = clusterCenters[cl]
      const dx = pole.x - centerNode.x
      const dy = pole.y - centerNode.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx)
      const numLines = cl === 'skills' ? 8 : 5
      const spreadAngle = cl === 'skills' ? 0.45 : 0.35

      for (let i = 0; i < numLines; i++) {
        const t = (i / (numLines - 1)) - 0.5
        const lineAngle = angle + t * spreadAngle
        const perpAngle = lineAngle + Math.PI / 2

        const curvature = (t * 0.4 + (Math.random() - 0.5) * 0.15) * dist
        const startDist = 25
        const endDist = 30

        const sx = centerNode.x + Math.cos(lineAngle) * startDist
        const sy = centerNode.y + Math.sin(lineAngle) * startDist
        const ex = pole.x - Math.cos(angle) * endDist + Math.sin(angle) * curvature * 0.3
        const ey = pole.y - Math.sin(angle) * endDist - Math.cos(angle) * curvature * 0.3

        const midX = (centerNode.x + pole.x) / 2 + Math.cos(perpAngle) * curvature
        const midY = (centerNode.y + pole.y) / 2 + Math.sin(perpAngle) * curvature

        const line: FieldLine = {
          cluster: cl,
          sx, sy, ex, ey, midX, midY,
          baseAlpha: 0.06 + Math.random() * 0.04,
          phaseOffset: Math.random() * Math.PI * 2,
          width: 1 + Math.random() * 0.5,
        }
        lines.push(line)

        // Particles per line
        const numParticles = 2 + Math.floor(Math.random() * 2)
        for (let p = 0; p < numParticles; p++) {
          particles.push({
            lineIndex: lines.length - 1,
            t: Math.random(),
            speed: 0.0008 + Math.random() * 0.0012,
            size: 1.2 + Math.random() * 1.5,
            alpha: 0.15 + Math.random() * 0.25,
            cluster: cl,
          })
        }
      }
    }

    fieldLinesRef.current = lines
    fieldParticlesRef.current = particles
  }, [])

  // ── Hit testing ────────────────────────────────────────────────────────

  const getNodeAt = useCallback((sx: number, sy: number): PositionedNode | null => {
    const w = screenToWorld(sx, sy)
    let closest: PositionedNode | null = null
    let minD = Infinity
    const pNodes = positionedNodesRef.current
    for (let i = pNodes.length - 1; i >= 0; i--) {
      const n = pNodes[i]
      if (!isVisible(n)) continue
      const dx = n.x - w.x
      const dy = n.y - w.y
      const d = Math.sqrt(dx * dx + dy * dy)
      const hitR = n.size + 6
      if (d < hitR && d < minD) {
        minD = d
        closest = n
      }
    }
    return closest
  }, [screenToWorld, isVisible])

  // ── Draw loop ──────────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { w: W, h: H, dpr } = sizeRef.current
    const zoom = zoomRef.current
    const time = timeRef.current
    const pNodes = positionedNodesRef.current
    const adj = adjRef.current
    const hoveredNode = hoveredNodeRef.current
    const hCluster = highlightClusterRef.current

    timeRef.current += 0.016

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)

    // Background
    ctx.fillStyle = '#FAFDFB'
    ctx.fillRect(0, 0, W, H)

    // Subtle grid dots
    const gridSpacing = 24
    ctx.fillStyle = 'rgba(0,0,0,0.02)'
    for (let gx = gridSpacing; gx < W; gx += gridSpacing) {
      for (let gy = gridSpacing; gy < H; gy += gridSpacing) {
        ctx.beginPath()
        ctx.arc(gx, gy, 0.4, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Hovered node connections
    const connected = new Set<string>()
    if (hoveredNode) {
      connected.add(hoveredNode.id)
      const neighbors = adj[hoveredNode.id]
      if (neighbors) {
        neighbors.forEach(id => connected.add(id))
      }
      // Center node highlights all
      if (hoveredNode.cluster === 'center') {
        pNodes.forEach(n => connected.add(n.id))
      }
    }

    const centerNode = pNodes.find(n => n.cluster === 'center')

    // ── Field lines ──────────────────────────────────────────────────

    const fieldLines = fieldLinesRef.current
    const fieldParticles = fieldParticlesRef.current

    for (const line of fieldLines) {
      // Determine intensity
      let intensity = 1
      if (hoveredNode) {
        if (hoveredNode.cluster === line.cluster || hoveredNode.cluster === 'center') {
          intensity = 2.5
        } else {
          intensity = 0.3
        }
      }
      if (hCluster) {
        intensity = hCluster === line.cluster ? 2.5 : 0.3
      }

      const breath = 1 + 0.3 * Math.sin(time * 0.5 + line.phaseOffset)
      const alpha = line.baseAlpha * intensity * breath

      // Gradient bezier segments
      const segments = 40
      ctx.lineWidth = line.width * zoom
      ctx.lineCap = 'round'

      for (let s = 0; s < segments; s++) {
        const t0 = s / segments
        const t1 = (s + 1) / segments
        const p0 = bezierPoint(line, t0)
        const p1 = bezierPoint(line, t1)
        const sp0 = worldToScreen(p0.x, p0.y)
        const sp1 = worldToScreen(p1.x, p1.y)

        const c = lerpColor(CLUSTER_COLORS.center, CLUSTER_COLORS[line.cluster] || CLUSTER_COLORS.center, t0)
        const edgeFade = Math.min(t0 * 4, (1 - t0) * 4, 1)
        const segAlpha = Math.min(alpha * edgeFade, 0.5)

        ctx.beginPath()
        ctx.moveTo(sp0.x, sp0.y)
        ctx.lineTo(sp1.x, sp1.y)
        ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${segAlpha})`
        ctx.stroke()
      }
    }

    // ── Field particles ──────────────────────────────────────────────

    for (const p of fieldParticles) {
      const line = fieldLines[p.lineIndex]
      if (!line) continue

      p.t += p.speed
      if (p.t > 1) p.t -= 1

      const pt = bezierPoint(line, p.t)
      const sp = worldToScreen(pt.x, pt.y)

      let intensity = 1
      if (hoveredNode) {
        if (hoveredNode.cluster === line.cluster || hoveredNode.cluster === 'center') {
          intensity = 2
        } else {
          intensity = 0.3
        }
      }
      if (hCluster) {
        intensity = hCluster === line.cluster ? 2 : 0.3
      }

      const c = lerpColor(CLUSTER_COLORS.center, CLUSTER_COLORS[line.cluster] || CLUSTER_COLORS.center, p.t)
      const edgeFade = Math.min(p.t * 5, (1 - p.t) * 5, 1)
      const particleAlpha = Math.min(p.alpha * intensity * edgeFade, 0.8)

      // Glow
      const glowR = (p.size + 3) * zoom
      const glow = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, glowR)
      glow.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${particleAlpha * 0.6})`)
      glow.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`)
      ctx.beginPath()
      ctx.arc(sp.x, sp.y, glowR, 0, Math.PI * 2)
      ctx.fillStyle = glow
      ctx.fill()

      // Core dot
      ctx.beginPath()
      ctx.arc(sp.x, sp.y, p.size * zoom * 0.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${particleAlpha})`
      ctx.fill()
    }

    // ── Center magnetic glow ─────────────────────────────────────────

    if (centerNode) {
      const sa = worldToScreen(centerNode.x, centerNode.y)
      const sunR = Math.min(W, H) * 0.2 * zoom
      const pulse = 1 + 0.08 * Math.sin(time * 0.6)

      // Outermost halo
      const g3 = ctx.createRadialGradient(sa.x, sa.y, 0, sa.x, sa.y, sunR * 1.2 * pulse)
      g3.addColorStop(0, 'rgba(5, 150, 105, 0.05)')
      g3.addColorStop(0.4, 'rgba(5, 150, 105, 0.02)')
      g3.addColorStop(1, 'rgba(5, 150, 105, 0)')
      ctx.beginPath()
      ctx.arc(sa.x, sa.y, sunR * 1.2 * pulse, 0, Math.PI * 2)
      ctx.fillStyle = g3
      ctx.fill()

      // Inner field core
      const g2 = ctx.createRadialGradient(sa.x, sa.y, 0, sa.x, sa.y, sunR * 0.5)
      g2.addColorStop(0, 'rgba(5, 150, 105, 0.07)')
      g2.addColorStop(0.7, 'rgba(5, 150, 105, 0.02)')
      g2.addColorStop(1, 'rgba(5, 150, 105, 0)')
      ctx.beginPath()
      ctx.arc(sa.x, sa.y, sunR * 0.5, 0, Math.PI * 2)
      ctx.fillStyle = g2
      ctx.fill()

      // Rotating dashed rings
      ctx.save()
      ctx.translate(sa.x, sa.y)
      for (let ring = 0; ring < 3; ring++) {
        const ringR = (30 + ring * 18) * zoom * pulse
        const ringAlpha = 0.04 - ring * 0.01
        ctx.beginPath()
        ctx.arc(0, 0, ringR, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(5, 150, 105, ${ringAlpha})`
        ctx.lineWidth = 0.8
        ctx.setLineDash([3, 8 + ring * 4])
        ctx.lineDashOffset = -time * (20 + ring * 10)
        ctx.stroke()
      }
      ctx.setLineDash([])
      ctx.restore()
    }

    // ── Cluster pole glows ───────────────────────────────────────────

    const clusterCenters: Record<string, { x: number; y: number }> = {}
    for (const cl of Object.keys(CLUSTER_COLORS)) {
      if (cl === 'center') continue
      const clNodes = pNodes.filter(n => n.cluster === cl)
      if (clNodes.length === 0) continue
      let cx = 0, cy = 0
      for (const n of clNodes) { cx += n.x; cy += n.y }
      cx /= clNodes.length
      cy /= clNodes.length
      clusterCenters[cl] = { x: cx, y: cy }
    }

    for (const cl of Object.keys(clusterCenters)) {
      const pole = clusterCenters[cl]
      const sp = worldToScreen(pole.x, pole.y)
      const poleR = 50 * zoom
      const color = hexToRGB(CLUSTER_COLORS[cl] || '#6b7280')
      const isHighlighted = hCluster === cl || (hoveredNode !== null && hoveredNode.cluster === cl)
      const baseAlpha = isHighlighted ? 0.08 : 0.03

      const grad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, poleR)
      grad.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${baseAlpha})`)
      grad.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`)
      ctx.beginPath()
      ctx.arc(sp.x, sp.y, poleR, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      // Cluster label
      const labelAlpha = isHighlighted ? 0.5 : 0.12
      ctx.font = '600 9px "SF Mono", "Fira Code", monospace'
      ctx.textAlign = 'center'
      ctx.fillStyle = CLUSTER_COLORS[cl] || '#6b7280'
      ctx.globalAlpha = labelAlpha
      ctx.fillText(cl.toUpperCase(), sp.x, sp.y - poleR - 4)
      ctx.globalAlpha = 1
    }

    // ── Edges ────────────────────────────────────────────────────────

    for (const edge of edges) {
      const a = pNodes.find(n => n.id === edge.source)
      const b = pNodes.find(n => n.id === edge.target)
      if (!a || !b) continue
      if (!isVisible(a) && !isVisible(b)) continue

      const sa = worldToScreen(a.x, a.y)
      const sb = worldToScreen(b.x, b.y)

      let alpha: number
      let width: number
      let color: string

      if (hoveredNode) {
        if (connected.has(a.id) && connected.has(b.id)) {
          color = NODE_COLORS[hoveredNode.type] || '#a8a29e'
          alpha = 0.35
          width = 1.8
        } else {
          alpha = 0.02
          width = 0.5
          color = '#a8a29e'
        }
      } else if (hCluster) {
        const aIn = a.cluster === hCluster
        const bIn = b.cluster === hCluster
        if (aIn && bIn) {
          color = CLUSTER_COLORS[hCluster] || '#a8a29e'
          alpha = 0.25
          width = 1.5
        } else if (aIn || bIn) {
          color = CLUSTER_COLORS[hCluster] || '#a8a29e'
          alpha = 0.08
          width = 1
        } else {
          color = '#a8a29e'
          alpha = 0.02
          width = 0.5
        }
      } else {
        if (a.cluster === b.cluster && a.cluster !== 'center') {
          color = CLUSTER_COLORS[a.cluster] || '#a8a29e'
          alpha = 0.08
        } else if (a.cluster === 'center' || b.cluster === 'center') {
          const other = a.cluster === 'center' ? b : a
          color = CLUSTER_COLORS[other.cluster] || '#a8a29e'
          alpha = 0.06
        } else {
          color = '#a8a29e'
          alpha = 0.05
        }
        width = 1
      }

      if (!isVisible(a) || !isVisible(b)) {
        alpha *= 0.15
      }

      ctx.beginPath()
      ctx.moveTo(sa.x, sa.y)
      ctx.lineTo(sb.x, sb.y)
      ctx.strokeStyle = color
      ctx.globalAlpha = alpha
      ctx.lineWidth = width * zoom
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    // ── Compute node screen data ─────────────────────────────────────

    const nodeScreenData = pNodes.map(n => {
      const vis = isVisible(n)
      const sp = worldToScreen(n.x, n.y)
      const r = n.size * zoom
      const color = NODE_COLORS[n.type] || '#6b7280'
      const rgb = hexToRGB(color)
      const isHovered = hoveredNode !== null && hoveredNode.id === n.id
      const isConnected = hoveredNode !== null && connected.has(n.id)
      const isDimmedByCluster = hCluster !== null && n.cluster !== hCluster && n.cluster !== 'center'
      let nodeAlpha = vis ? 1 : 0.1
      if (hoveredNode && !isConnected && !isHovered) nodeAlpha *= 0.2
      if (isDimmedByCluster) nodeAlpha *= 0.25
      return { n, vis, sp, r, color, rgb, isHovered, isConnected, isDimmedByCluster, nodeAlpha }
    })

    // ── Label placement (collision-aware) ────────────────────────────

    const labelFont = (n: PositionedNode) =>
      `${n.size >= 10 ? '600' : '500'} ${Math.max(9, Math.min(13, n.size * zoom * 0.85))}px "Avenir Next", "SF Pro Text", sans-serif`
    const labelPad = 3
    const placedLabels: { x: number; y: number; w: number; h: number }[] = []

    const occupiedRects = nodeScreenData.map(d => ({
      x: d.sp.x - d.r, y: d.sp.y - d.r, w: d.r * 2, h: d.r * 2,
    }))

    function rectsOverlap(
      a: { x: number; y: number; w: number; h: number },
      b: { x: number; y: number; w: number; h: number },
    ) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
    }

    function overlapScore(rect: { x: number; y: number; w: number; h: number }) {
      let score = 0
      for (const occ of occupiedRects) {
        if (rectsOverlap(rect, occ)) score += 1
      }
      for (const pl of placedLabels) {
        if (rectsOverlap(rect, pl)) score += 2
      }
      return score
    }

    const sortedForLabels = [...nodeScreenData].sort((a, b) => b.n.size - a.n.size)
    const labelPositions = new Map<string, { x: number; y: number; align: CanvasTextAlign }>()

    for (const d of sortedForLabels) {
      if (!d.vis) continue
      ctx.font = labelFont(d.n)
      const tw = ctx.measureText(d.n.label).width
      const th = Math.max(9, Math.min(13, d.n.size * zoom * 0.85))
      const gap = 6 * zoom

      const candidates = [
        { x: d.sp.x - tw / 2, y: d.sp.y + d.r + gap, align: 'center' as CanvasTextAlign },
        { x: d.sp.x - tw / 2, y: d.sp.y - d.r - gap - th, align: 'center' as CanvasTextAlign },
        { x: d.sp.x + d.r + gap, y: d.sp.y - th / 2, align: 'left' as CanvasTextAlign },
        { x: d.sp.x - d.r - gap - tw, y: d.sp.y - th / 2, align: 'left' as CanvasTextAlign },
      ]

      let bestCandidate = candidates[0]
      let bestScore = Infinity

      for (const cand of candidates) {
        const rect = {
          x: cand.x - labelPad,
          y: cand.y - labelPad,
          w: tw + labelPad * 2,
          h: th + labelPad * 2,
        }
        const score = overlapScore(rect)
        if (score < bestScore) {
          bestScore = score
          bestCandidate = cand
        }
        if (score === 0) break
      }

      placedLabels.push({
        x: bestCandidate.x - labelPad,
        y: bestCandidate.y - labelPad,
        w: tw + labelPad * 2,
        h: th + labelPad * 2,
      })

      const drawX = bestCandidate.align === 'center' ? d.sp.x : bestCandidate.x
      labelPositions.set(d.n.id, { x: drawX, y: bestCandidate.y, align: bestCandidate.align })
    }

    // ── Draw nodes ───────────────────────────────────────────────────

    for (const { n, vis, sp, r, color, rgb, isHovered, isConnected, isDimmedByCluster, nodeAlpha } of nodeScreenData) {
      // Node glow
      if (vis && (isHovered || isConnected || n.cluster === 'center')) {
        const glowR = r * (isHovered ? 3.5 : 2.5)
        const glowAlpha = isHovered ? 0.12 : 0.05
        const glow = ctx.createRadialGradient(sp.x, sp.y, r * 0.5, sp.x, sp.y, glowR)
        glow.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${glowAlpha})`)
        glow.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`)
        ctx.beginPath()
        ctx.arc(sp.x, sp.y, glowR, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()
      }

      // Magnetic pulse ring on center node
      if (n.cluster === 'center') {
        const pulseT = (time * 0.4) % 1
        const pulseR = r * (1.5 + pulseT * 2)
        const pulseAlpha = 0.12 * (1 - pulseT)
        ctx.beginPath()
        ctx.arc(sp.x, sp.y, pulseR, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(5, 150, 105, ${pulseAlpha})`
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // Node shadow + body
      ctx.save()
      ctx.globalAlpha = nodeAlpha
      if (vis) {
        ctx.shadowColor = `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`
        ctx.shadowBlur = isHovered ? 16 : 8
        ctx.shadowOffsetY = 2
      }

      ctx.beginPath()
      ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()

      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0

      // Border
      ctx.beginPath()
      ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2)
      ctx.strokeStyle = color
      ctx.lineWidth = isHovered ? 2.5 : (n.cluster === 'center' ? 2.5 : 1.8)
      ctx.stroke()

      // Inner accent
      ctx.beginPath()
      ctx.arc(sp.x, sp.y, r * 0.65, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${isHovered ? 0.15 : 0.06})`
      ctx.fill()

      ctx.restore()

      // Label
      if (vis && labelPositions.has(n.id)) {
        const lp = labelPositions.get(n.id)!
        const labelAlpha = (hoveredNode && !isConnected && !isHovered) ? 0.15
          : isDimmedByCluster ? 0.2
          : 0.85
        ctx.globalAlpha = labelAlpha
        ctx.font = labelFont(n)
        ctx.textAlign = lp.align
        ctx.textBaseline = 'top'
        ctx.fillStyle = '#1c1917'
        ctx.fillText(n.label, lp.x, lp.y)
        ctx.globalAlpha = 1
      }
    }

    // Update visible count periodically (every ~20 frames)
    if (Math.floor(time * 60) % 20 === 0) {
      const count = pNodes.filter(n => isVisible(n)).length
      setVisibleCount(count)
    }

    animFrameRef.current = requestAnimationFrame(draw)
  }, [edges, worldToScreen, isVisible])

  // ── Fit view to show all nodes ────────────────────────────────────────

  const fitView = useCallback(() => {
    const pNodes = positionedNodesRef.current
    if (pNodes.length === 0) return

    const { w: W, h: H } = sizeRef.current
    if (W === 0 || H === 0) return

    // Compute bounding box of all nodes (accounting for node size)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const n of pNodes) {
      const pad = n.size + 20 // node radius + label clearance
      if (n.x - pad < minX) minX = n.x - pad
      if (n.y - pad < minY) minY = n.y - pad
      if (n.x + pad > maxX) maxX = n.x + pad
      if (n.y + pad > maxY) maxY = n.y + pad
    }

    const graphW = maxX - minX
    const graphH = maxY - minY
    if (graphW <= 0 || graphH <= 0) return

    const padding = 40
    const scaleX = (W - padding * 2) / graphW
    const scaleY = (H - padding * 2) / graphH
    const zoom = Math.min(scaleX, scaleY, 1) // never zoom in beyond 1x

    const graphCenterX = (minX + maxX) / 2
    const graphCenterY = (minY + maxY) / 2

    zoomRef.current = zoom
    panXRef.current = W / 2 - graphCenterX * zoom
    panYRef.current = H / 2 - graphCenterY * zoom
  }, [])

  // ── Resize handler (only updates canvas size + fit, does NOT re-layout) ─

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const W = rect.width
    const H = rect.height
    if (W === 0 || H === 0) return

    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'

    sizeRef.current = { w: W, h: H, dpr }
    fitView()
  }, [fitView])

  // ── Initialize ─────────────────────────────────────────────────────────

  useEffect(() => {
    // Build positioned nodes from props
    positionedNodesRef.current = nodes.map(n => ({
      ...n,
      x: 0,
      y: 0,
      pulseOffset: Math.random() * Math.PI * 2,
    }))

    // Build adjacency map
    const adj: Record<string, Set<string>> = {}
    for (const n of nodes) {
      adj[n.id] = new Set()
    }
    for (const edge of edges) {
      if (adj[edge.source]) adj[edge.source].add(edge.target)
      if (adj[edge.target]) adj[edge.target].add(edge.source)
    }
    adjRef.current = adj

    timeRef.current = 0

    // Layout nodes once (origin-centered, stable positions)
    layoutNodes()
    generateFieldLines()

    // Size canvas and fit view
    resizeCanvas()

    // Safety: if container wasn't ready, retry next frame
    if (sizeRef.current.w === 0 || sizeRef.current.h === 0) {
      requestAnimationFrame(() => resizeCanvas())
    }

    // Start animation
    animFrameRef.current = requestAnimationFrame(draw)

    // ResizeObserver — only re-fits, does NOT re-layout nodes
    const container = containerRef.current
    let observer: ResizeObserver | null = null
    if (container) {
      observer = new ResizeObserver(() => resizeCanvas())
      observer.observe(container)
    }

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      if (observer) observer.disconnect()
    }
  }, [nodes, edges, layoutNodes, generateFieldLines, resizeCanvas, draw])

  // ── Mouse handlers ─────────────────────────────────────────────────────

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    if (panningRef.current) {
      panXRef.current += mx - panStartRef.current.x
      panYRef.current += my - panStartRef.current.y
      panStartRef.current = { x: mx, y: my }
      return
    }

    const node = getNodeAt(mx, my)
    hoveredNodeRef.current = node
    canvas.style.cursor = node ? 'pointer' : 'default'

    if (node) {
      const connCount = adjRef.current[node.id] ? adjRef.current[node.id].size : 0
      setTooltip({
        visible: true,
        x: mx + 18,
        y: my - 10,
        cluster: node.cluster,
        name: node.label,
        detail: node.detail || '',
        connections: connCount,
      })
    } else {
      setTooltip(prev => prev.visible ? { ...prev, visible: false } : prev)
    }
  }, [getNodeAt])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    panningRef.current = true
    panStartRef.current = { x: mx, y: my }
    canvas.style.cursor = 'move'
  }, [])

  const handleMouseUp = useCallback(() => {
    panningRef.current = false
    const canvas = canvasRef.current
    if (canvas) {
      canvas.style.cursor = hoveredNodeRef.current ? 'pointer' : 'default'
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    hoveredNodeRef.current = null
    panningRef.current = false
    setTooltip(prev => prev.visible ? { ...prev, visible: false } : prev)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const delta = e.deltaY > 0 ? 0.92 : 1.08
    const oldZoom = zoomRef.current
    const newZoom = Math.max(0.3, Math.min(4, oldZoom * delta))

    panXRef.current = mx - (mx - panXRef.current) * (newZoom / oldZoom)
    panYRef.current = my - (my - panYRef.current) * (newZoom / oldZoom)
    zoomRef.current = newZoom
  }, [])

  // ── Zoom controls ──────────────────────────────────────────────────────

  const handleZoomIn = useCallback(() => {
    const { w: W, h: H } = sizeRef.current
    const cx = W / 2, cy = H / 2
    const oldZoom = zoomRef.current
    const newZoom = Math.min(4, oldZoom * 1.2)
    panXRef.current = cx - (cx - panXRef.current) * (newZoom / oldZoom)
    panYRef.current = cy - (cy - panYRef.current) * (newZoom / oldZoom)
    zoomRef.current = newZoom
  }, [])

  const handleZoomOut = useCallback(() => {
    const { w: W, h: H } = sizeRef.current
    const cx = W / 2, cy = H / 2
    const oldZoom = zoomRef.current
    const newZoom = Math.max(0.3, oldZoom * 0.83)
    panXRef.current = cx - (cx - panXRef.current) * (newZoom / oldZoom)
    panYRef.current = cy - (cy - panYRef.current) * (newZoom / oldZoom)
    zoomRef.current = newZoom
  }, [])

  const handleZoomReset = useCallback(() => {
    fitView()
  }, [fitView])

  // ── Cluster highlight toggle ───────────────────────────────────────────

  const toggleCluster = useCallback((cl: string) => {
    setHighlightCluster(prev => prev === cl ? null : cl)
  }, [])

  // ── Empty state ────────────────────────────────────────────────────────

  const nonCenterNodes = nodes.filter(n => n.cluster !== 'center')
  if (nonCenterNodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-full bg-accent/8 flex items-center justify-center mx-auto mb-4">
            <div className="w-4 h-4 rounded-full bg-accent/30" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Your career graph is empty
          </h3>
          <p className="text-sm text-text-muted leading-relaxed">
            Add your experiences, skills, and goals to see your career context graph come to life. Each node represents a piece of your professional story.
          </p>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-3 px-5 py-3 border-b border-border-subtle bg-surface-raised z-20">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-overlay border border-border-subtle rounded-lg text-xs min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border-none bg-transparent outline-none font-sans text-xs text-text-primary w-full placeholder:text-text-muted"
          />
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleZoomOut}
            className="w-7 h-7 rounded-md border border-border-subtle bg-surface-raised text-text-secondary text-sm flex items-center justify-center hover:border-border-default hover:bg-surface-overlay transition-all"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomReset}
            className="w-7 h-7 rounded-md border border-border-subtle bg-surface-raised text-text-secondary text-sm flex items-center justify-center hover:border-border-default hover:bg-surface-overlay transition-all"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            onClick={handleZoomIn}
            className="w-7 h-7 rounded-md border border-border-subtle bg-surface-raised text-text-secondary text-sm flex items-center justify-center hover:border-border-default hover:bg-surface-overlay transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-surface">
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
        />

        {/* Constellation panel */}
        {clusters.length > 0 && (
          <div className="absolute top-4 right-4 bg-surface-raised border border-black/5 rounded-xl py-4 px-5 z-10 min-w-[190px] shadow-sm">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2.5">
              Constellations
            </h3>
            {clusters.map(cl => (
              <div key={cl.name}>
                <button
                  onClick={() => toggleCluster(cl.name)}
                  className={`flex items-center gap-2.5 w-full px-2 py-1.5 -mx-2 rounded-lg text-xs font-medium transition-all text-left ${
                    highlightCluster === cl.name
                      ? 'bg-accent/8 text-accent'
                      : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: cl.color }}
                  />
                  <span className="capitalize">{cl.name}</span>
                  <span className="ml-auto font-mono text-[10px] text-text-muted">
                    {cl.count}
                  </span>
                </button>
                {cl.description && (
                  <p className="text-[10px] text-text-muted ml-5 -mt-0.5 mb-1">
                    {cl.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tooltip */}
        {tooltip.visible && (
          <div
            className="absolute pointer-events-none bg-surface-raised border border-border-default rounded-xl px-4 py-3 z-[100] max-w-[240px]"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
            }}
          >
            <span
              className="inline-block text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1.5 text-white"
              style={{
                background: CLUSTER_COLORS[tooltip.cluster] || CLUSTER_COLORS.center,
              }}
            >
              {tooltip.cluster}
            </span>
            <div className="text-sm font-semibold text-text-primary mb-0.5">
              {tooltip.name}
            </div>
            {tooltip.detail && (
              <div className="text-[11px] text-text-muted">
                {tooltip.detail}
              </div>
            )}
            <div className="text-[10px] text-text-muted mt-1.5 pt-1.5 border-t border-border-subtle font-mono">
              {tooltip.connections} connections
            </div>
          </div>
        )}

        {/* Node count */}
        <div className="absolute bottom-4 right-4 font-mono text-[11px] text-text-muted z-10">
          {visibleCount} of {nodes.length} nodes
        </div>
      </div>
    </div>
  )
}
