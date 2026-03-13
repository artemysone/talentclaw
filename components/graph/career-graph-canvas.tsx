'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from 'd3-force'
import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force'
import type { GraphNode, GraphEdge } from './graph-types'
import { NODE_COLORS, TYPE_LABELS } from './graph-types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SimNode extends SimulationNodeDatum {
  id: string
  label: string
  type: GraphNode['type']
  cluster: GraphNode['cluster']
  detail?: string
  size: number
  connections: string[]
}

interface SimEdge extends SimulationLinkDatum<SimNode> {
  source: string | SimNode
  target: string | SimNode
}

interface Camera {
  x: number; y: number; zoom: number
  targetX: number; targetY: number; targetZoom: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS_RGB: Record<string, { r: number; g: number; b: number }> = {}
for (const [type, hex] of Object.entries(NODE_COLORS)) {
  COLORS_RGB[type] = {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}

const FILTER_CATEGORIES: { type: GraphNode['type']; label: string }[] = [
  { type: 'company', label: 'Companies' },
  { type: 'role', label: 'Roles' },
  { type: 'skill', label: 'Skills' },
  { type: 'project', label: 'Projects' },
  { type: 'education', label: 'Education' },
  { type: 'industry', label: 'Industries' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getConnectedSet(node: SimNode | null): Set<string> | null {
  if (!node) return null
  const set = new Set([node.id])
  node.connections.forEach(id => set.add(id))
  return set
}

function computeFit(simNodes: SimNode[], w: number, h: number) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  simNodes.forEach(n => {
    if (n.x == null || n.y == null) return
    const pad = 30
    if (n.x - pad < minX) minX = n.x - pad
    if (n.x + pad > maxX) maxX = n.x + pad
    if (n.y - n.size < minY) minY = n.y - n.size
    if (n.y + n.size + pad > maxY) maxY = n.y + n.size + pad
  })
  if (!isFinite(minX)) return null
  const screenPad = 40
  const fitZoom = Math.min((w - screenPad * 2) / (maxX - minX), (h - screenPad * 2) / (maxY - minY))
  return {
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    zoom: Math.max(0.3, Math.min(1.2, fitZoom)),
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CareerGraphCanvas({
  nodes,
  edges,
}: {
  nodes: GraphNode[]
  edges: GraphEdge[]
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<SimNode | null>(null)
  const [activeFilter, setActiveFilter] = useState<GraphNode['type'] | null>(null)

  // Mutable refs for rendering state
  const simNodesRef = useRef<SimNode[]>([])
  const simEdgesRef = useRef<SimEdge[]>([])
  const nodeMapRef = useRef<Map<string, SimNode>>(new Map())
  const camRef = useRef<Camera>({ x: 0, y: 0, zoom: 1, targetX: 0, targetY: 0, targetZoom: 1 })
  const hoveredRef = useRef<SimNode | null>(null)
  const selectedRef = useRef<SimNode | null>(null)
  const activeFilterRef = useRef<GraphNode['type'] | null>(null)
  const simulationRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null)
  const animFrameRef = useRef(0)
  const sizeRef = useRef({ w: 0, h: 0 })

  // Interaction refs
  const isDraggingRef = useRef(false)
  const isDraggingNodeRef = useRef<SimNode | null>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const camStartRef = useRef({ x: 0, y: 0 })

  useEffect(() => { selectedRef.current = selected }, [selected])
  useEffect(() => { activeFilterRef.current = activeFilter }, [activeFilter])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const n of nodes) {
      if (n.type !== 'person') counts[n.type] = (counts[n.type] || 0) + 1
    }
    return counts
  }, [nodes])

  // ---------------------------------------------------------------------------
  // Camera transforms
  // ---------------------------------------------------------------------------

  const screenToWorld = useCallback((sx: number, sy: number) => {
    const cam = camRef.current
    const { w, h } = sizeRef.current
    return {
      x: (sx - w / 2) / cam.zoom + cam.x,
      y: (sy - h / 2) / cam.zoom + cam.y,
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Hit testing
  // ---------------------------------------------------------------------------

  const hitTest = useCallback((sx: number, sy: number): SimNode | null => {
    const w = screenToWorld(sx, sy)
    let closest: SimNode | null = null
    let closestDist = Infinity
    for (const n of simNodesRef.current) {
      if (n.x == null || n.y == null) continue
      const dx = n.x - w.x
      const dy = n.y - w.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const hitRadius = (n.size * 1.2 + 6) / camRef.current.zoom
      if (dist < hitRadius && dist < closestDist) {
        closest = n
        closestDist = dist
      }
    }
    return closest
  }, [screenToWorld])

  // ---------------------------------------------------------------------------
  // Simulation setup
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const nodeMap = new Map<string, SimNode>()
    const simNodes: SimNode[] = nodes.map(n => {
      const sn: SimNode = { ...n, connections: [] }
      nodeMap.set(n.id, sn)
      return sn
    })

    edges.forEach(e => {
      const s = nodeMap.get(e.source)
      const t = nodeMap.get(e.target)
      if (s && t) {
        s.connections.push(t.id)
        t.connections.push(s.id)
      }
    })

    const simEdges: SimEdge[] = edges.map(e => ({ source: e.source, target: e.target }))

    simNodesRef.current = simNodes
    simEdgesRef.current = simEdges
    nodeMapRef.current = nodeMap

    const sim = forceSimulation<SimNode>(simNodes)
      .force('link', forceLink<SimNode, SimEdge>(simEdges)
        .id(d => d.id)
        .distance(d => {
          const s = nodeMap.get(typeof d.source === 'string' ? d.source : d.source.id)
          const t = nodeMap.get(typeof d.target === 'string' ? d.target : d.target.id)
          if (s && t && (s.type === 'person' || t.type === 'person')) return 120
          return 70
        })
        .strength(0.4))
      .force('charge', forceManyBody<SimNode>()
        .strength(d => d.type === 'person' ? -600 : -200)
        .distanceMax(500))
      .force('collision', forceCollide<SimNode>().radius(d => d.size * 2 + 16).strength(0.9))
      .force('center', forceCenter(0, 0).strength(0.02))
      .alphaDecay(0.01)
      .velocityDecay(0.38)
      .stop()

    // Pre-settle layout
    for (let i = 0; i < 300; i++) sim.tick()

    simulationRef.current = sim

    // Fit camera once canvas is measured
    requestAnimationFrame(() => {
      const fit = computeFit(simNodes, sizeRef.current.w, sizeRef.current.h)
      if (fit) {
        const cam = camRef.current
        cam.x = cam.targetX = fit.cx
        cam.y = cam.targetY = fit.cy
        cam.zoom = cam.targetZoom = fit.zoom
      }
    })

    return () => { sim.stop() }
  }, [nodes, edges])

  // ---------------------------------------------------------------------------
  // Canvas rendering loop
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      const dpr = window.devicePixelRatio || 1
      const rect = container!.getBoundingClientRect()
      sizeRef.current = { w: rect.width, h: rect.height }
      canvas!.width = rect.width * dpr
      canvas!.height = rect.height * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)

    function render() {
      const cam = camRef.current
      const { w: W, h: H } = sizeRef.current
      const simNodes = simNodesRef.current
      const simEdges = simEdgesRef.current
      const nodeMap = nodeMapRef.current

      // Smooth camera
      cam.x += (cam.targetX - cam.x) * 0.12
      cam.y += (cam.targetY - cam.y) * 0.12
      cam.zoom += (cam.targetZoom - cam.zoom) * 0.12

      const toScreen = (wx: number, wy: number) => ({
        x: (wx - cam.x) * cam.zoom + W / 2,
        y: (wy - cam.y) * cam.zoom + H / 2,
      })

      // Background
      ctx!.fillStyle = '#FFFFFF'
      ctx!.fillRect(0, 0, W, H)

      // Focus state — node hover/select takes priority, then category filter
      const focusNode = hoveredRef.current || selectedRef.current
      let connSet: Set<string> | null = null

      if (focusNode) {
        connSet = getConnectedSet(focusNode)
      } else if (activeFilterRef.current) {
        connSet = new Set<string>()
        for (const node of simNodes) {
          if (node.type === activeFilterRef.current) {
            connSet.add(node.id)
          }
        }
      }

      const hasFocus = !!connSet

      // Edges
      for (const edge of simEdges) {
        const s = typeof edge.source === 'object' ? edge.source : nodeMap.get(edge.source as string)
        const t = typeof edge.target === 'object' ? edge.target : nodeMap.get(edge.target as string)
        if (!s || !t || s.x == null || t.x == null || s.y == null || t.y == null) continue

        const p1 = toScreen(s.x, s.y)
        const p2 = toScreen(t.x, t.y)

        if (Math.max(p1.x, p2.x) < -50 || Math.min(p1.x, p2.x) > W + 50 ||
            Math.max(p1.y, p2.y) < -50 || Math.min(p1.y, p2.y) > H + 50) continue

        const sId = typeof edge.source === 'object' ? edge.source.id : edge.source as string
        const tId = typeof edge.target === 'object' ? edge.target.id : edge.target as string

        if (hasFocus) {
          const isConnected = connSet!.has(sId) && connSet!.has(tId)
          if (isConnected) {
            const srcRgb = COLORS_RGB[s.type] || COLORS_RGB.person
            const tgtRgb = COLORS_RGB[t.type] || COLORS_RGB.person
            const grad = ctx!.createLinearGradient(p1.x, p1.y, p2.x, p2.y)
            grad.addColorStop(0, `rgba(${srcRgb.r},${srcRgb.g},${srcRgb.b},0.4)`)
            grad.addColorStop(1, `rgba(${tgtRgb.r},${tgtRgb.g},${tgtRgb.b},0.4)`)
            ctx!.beginPath()
            ctx!.moveTo(p1.x, p1.y)
            ctx!.lineTo(p2.x, p2.y)
            ctx!.strokeStyle = grad
            ctx!.lineWidth = 1.5
            ctx!.stroke()
          } else {
            ctx!.beginPath()
            ctx!.moveTo(p1.x, p1.y)
            ctx!.lineTo(p2.x, p2.y)
            ctx!.strokeStyle = 'rgba(0,0,0,0.02)'
            ctx!.lineWidth = 0.5
            ctx!.stroke()
          }
        } else {
          ctx!.beginPath()
          ctx!.moveTo(p1.x, p1.y)
          ctx!.lineTo(p2.x, p2.y)
          ctx!.strokeStyle = 'rgba(0,0,0,0.07)'
          ctx!.lineWidth = 0.8
          ctx!.stroke()
        }
      }

      // Nodes
      for (const node of simNodes) {
        if (node.x == null || node.y == null) continue

        const p = toScreen(node.x, node.y)
        if (p.x < -60 || p.x > W + 60 || p.y < -60 || p.y > H + 60) continue

        const color = NODE_COLORS[node.type] || NODE_COLORS.person
        const rgb = COLORS_RGB[node.type] || COLORS_RGB.person
        const r = node.size * 0.5 * cam.zoom

        const isHovered = hoveredRef.current === node
        const isSelected = selectedRef.current === node
        const isConnected = connSet?.has(node.id) ?? false

        let alpha = 1
        let scale = 1

        if (hasFocus) {
          if (isHovered || isSelected) {
            scale = 1.15
          } else if (!isConnected) {
            alpha = 0.2
          }
        } else if (isHovered) {
          scale = 1.1
        }

        const finalR = r * scale

        // Circle fill
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, finalR, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha * 0.85})`
        ctx!.fill()

        // Border
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, finalR, 0, Math.PI * 2)
        ctx!.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha * 0.25})`
        ctx!.lineWidth = 0.5
        ctx!.stroke()

        // Label
        const showLabel = cam.zoom > 0.5 || node.type === 'person' || isHovered || isSelected || (isConnected && hasFocus)
        if (showLabel) {
          let labelAlpha = alpha
          if (!hasFocus && node.type !== 'person' && !isHovered) {
            labelAlpha = Math.min(1, (cam.zoom - 0.5) * 2) * alpha
          }
          if (labelAlpha > 0.05) {
            const fontSize = Math.max(9, Math.min(13, 11 * cam.zoom))
            const bold = node.type === 'person' || isHovered || isSelected
            ctx!.font = `${bold ? '600' : '400'} ${fontSize}px "Avenir Next", "Avenir", -apple-system, BlinkMacSystemFont, sans-serif`
            ctx!.textAlign = 'center'
            ctx!.textBaseline = 'top'
            const labelY = p.y + finalR + 5
            ctx!.fillStyle = `rgba(28,25,23,${labelAlpha * 0.65})`
            ctx!.fillText(node.label, p.x, labelY)
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(render)
    }

    animFrameRef.current = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      observer.disconnect()
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    if (isDraggingNodeRef.current) {
      const w = screenToWorld(mx, my)
      isDraggingNodeRef.current.fx = w.x
      isDraggingNodeRef.current.fy = w.y
      simulationRef.current?.alpha(0.1).restart()
      return
    }

    if (isDraggingRef.current) {
      const cam = camRef.current
      const dx = (e.clientX - dragStartRef.current.x) / cam.zoom
      const dy = (e.clientY - dragStartRef.current.y) / cam.zoom
      cam.targetX = camStartRef.current.x - dx
      cam.targetY = camStartRef.current.y - dy
      return
    }

    hoveredRef.current = hitTest(mx, my)
  }, [screenToWorld, hitTest])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    const hit = hitTest(mx, my)
    if (hit) {
      isDraggingNodeRef.current = hit
      hit.fx = hit.x
      hit.fy = hit.y
      simulationRef.current?.alphaTarget(0.05).restart()
      return
    }
    isDraggingRef.current = true
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    camStartRef.current = { x: camRef.current.targetX, y: camRef.current.targetY }
  }, [hitTest])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    if (isDraggingNodeRef.current) {
      isDraggingNodeRef.current.fx = null
      isDraggingNodeRef.current.fy = null
      simulationRef.current?.alphaTarget(0)
      const hit = hitTest(mx, my)
      if (hit) setSelected(hit)
      isDraggingNodeRef.current = null
      return
    }

    if (isDraggingRef.current) {
      isDraggingRef.current = false
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      if (Math.abs(dx) < 3 && Math.abs(dy) < 3) setSelected(null)
    }
  }, [hitTest])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const cam = camRef.current

    const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08
    cam.targetZoom = Math.max(0.2, Math.min(4, cam.targetZoom * zoomFactor))

    const w = screenToWorld(mx, my)
    cam.targetX = w.x - (mx - sizeRef.current.w / 2) / cam.targetZoom
    cam.targetY = w.y - (my - sizeRef.current.h / 2) / cam.targetZoom
  }, [screenToWorld])

  const zoomIn = useCallback(() => {
    camRef.current.targetZoom = Math.min(4, camRef.current.targetZoom * 1.3)
  }, [])

  const zoomOut = useCallback(() => {
    camRef.current.targetZoom = Math.max(0.2, camRef.current.targetZoom * 0.7)
  }, [])

  const zoomReset = useCallback(() => {
    const fit = computeFit(simNodesRef.current, sizeRef.current.w, sizeRef.current.h)
    if (fit) {
      const cam = camRef.current
      cam.targetX = fit.cx
      cam.targetY = fit.cy
      cam.targetZoom = fit.zoom
    }
    setSelected(null)
  }, [])

  const handleFilterClick = useCallback((type: GraphNode['type']) => {
    setActiveFilter(prev => prev === type ? null : type)
    setSelected(null)
  }, [])

  // ---------------------------------------------------------------------------
  // Detail panel data
  // ---------------------------------------------------------------------------

  const selectedColor = selected ? NODE_COLORS[selected.type] : ''
  const connectedNodes = selected
    ? selected.connections
        .map(id => nodeMapRef.current.get(id))
        .filter(Boolean) as SimNode[]
    : []

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ cursor: isDraggingRef.current ? 'grabbing' : 'grab' }}>
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { hoveredRef.current = null; isDraggingRef.current = false }}
      />

      {/* Category filters */}
      <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
        {FILTER_CATEGORIES.filter(c => categoryCounts[c.type]).map(({ type, label }) => {
          const isActive = activeFilter === type
          const color = NODE_COLORS[type]
          const count = categoryCounts[type]
          return (
            <button
              key={type}
              onClick={() => handleFilterClick(type)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'bg-white/80 backdrop-blur-sm text-text-secondary hover:bg-white border border-border-subtle'
              }`}
              style={isActive ? { backgroundColor: color } : undefined}
            >
              {!isActive && (
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
              )}
              {label}
              <span className={isActive ? 'opacity-70' : 'text-text-muted'}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-1">
        {[
          { label: '+', action: zoomIn },
          { label: '\u2212', action: zoomOut },
          { label: '\u21B4', action: zoomReset },
        ].map(({ label, action }) => (
          <button
            key={label}
            onClick={action}
            className="w-9 h-9 border border-border-subtle bg-white/90 backdrop-blur-xl text-text-muted rounded-lg text-base flex items-center justify-center hover:bg-surface-overlay hover:text-text-secondary transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Detail panel */}
      <div
        className={`absolute top-6 right-6 w-[280px] bg-white/95 backdrop-blur-2xl border border-border-subtle rounded-[14px] p-6 shadow-md transition-all duration-300 ${
          selected ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <button
          onClick={() => setSelected(null)}
          className="absolute top-3 right-3.5 w-6 h-6 border-none bg-surface-overlay text-text-muted rounded-md text-sm flex items-center justify-center hover:bg-border-default hover:text-text-secondary transition-colors"
        >
          &times;
        </button>

        {selected && (
          <>
            <span
              className="inline-block text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded-md mb-2.5"
              style={{
                backgroundColor: selectedColor + '15',
                color: selectedColor,
              }}
            >
              {TYPE_LABELS[selected.type] || selected.type}
            </span>
            <div className="text-lg font-semibold text-text-primary mb-1.5 leading-tight">
              {selected.label}
            </div>
            {selected.detail && (
              <div className="text-[13px] text-text-secondary leading-relaxed">
                {selected.detail}
              </div>
            )}
            {connectedNodes.length > 0 && (
              <div className="mt-3.5 pt-3.5 border-t border-border-subtle text-[11.5px] text-text-muted">
                {connectedNodes.length} connection{connectedNodes.length > 1 ? 's' : ''}:{' '}
                {connectedNodes.map(n => n.label).join(', ')}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
