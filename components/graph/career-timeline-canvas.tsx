'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import type { TimelineBranch } from '@/lib/timeline-data'

// ---------------------------------------------------------------------------
// Internal layout types
// ---------------------------------------------------------------------------

interface AxonPoint {
  x: number
  y: number
}

interface LayoutBranch extends TimelineBranch {
  idx: number
  forkX: number
  forkAxonY: number
  mergeX: number
  mergeAxonY: number
  parallelStartX: number
  parallelEndX: number
  parallelY: number
  pathPoints: AxonPoint[]
  isCurrent: boolean
  branchPxWidth: number
}

interface YearMarker {
  year: number
  x: number
  y: number
}

// ---------------------------------------------------------------------------
// Fonts (system only)
// ---------------------------------------------------------------------------

const FONT_SANS = '"Avenir Next", "Avenir", -apple-system, sans-serif'
const FONT_MONO = '"SF Mono", "Fira Code", ui-monospace, monospace'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function fitText(ctx: CanvasRenderingContext2D, text: string, font: string, maxWidth: number): string {
  ctx.font = font
  if (ctx.measureText(text).width <= maxWidth) return text
  let truncated = text
  while (truncated.length > 1 && ctx.measureText(truncated + '\u2026').width > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return truncated + '\u2026'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CareerTimelineCanvas({
  branches,
}: {
  branches: TimelineBranch[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const layoutRef = useRef<{
    axonPoints: AxonPoint[]
    branches: LayoutBranch[]
    yearMarkers: YearMarker[]
  }>({
    axonPoints: [],
    branches: [],
    yearMarkers: [],
  })

  const sizeRef = useRef({ w: 0, h: 0 })
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const hoveredRef = useRef<LayoutBranch | null>(null)
  const drawScheduledRef = useRef(false)
  const lastTooltipRef = useRef<{ branchIdx: number; x: number; y: number } | null>(null)

  const [tooltip, setTooltip] = useState<{
    branch: LayoutBranch
    x: number
    y: number
  } | null>(null)

  // ---------------------------------------------------------------------------
  // Layout computation
  // ---------------------------------------------------------------------------

  const computeLayout = useCallback(() => {
    const W = sizeRef.current.w
    const H = sizeRef.current.h
    if (W === 0 || H === 0) return

    const layout = layoutRef.current
    layout.branches = []
    layout.axonPoints = []
    layout.yearMarkers = []

    const padL = 120
    const padR = 80
    const axonY = H * 0.5

    let dataMinYear = Infinity
    let dataMaxYear = -Infinity
    for (const e of branches) {
      if (e.startYear < dataMinYear) dataMinYear = e.startYear
      if (e.endYear > dataMaxYear) dataMaxYear = e.endYear
    }
    if (!isFinite(dataMinYear)) return

    const currentYear = new Date().getFullYear()
    const minYear = dataMinYear - 1
    const maxYear = Math.max(dataMaxYear, currentYear) + 0.8
    const yearSpan = maxYear - minYear

    function yearToX(y: number): number {
      return padL + ((y - minYear) / yearSpan) * (W - padL - padR)
    }

    // Year markers
    const totalYears = Math.ceil(maxYear) - Math.floor(minYear)
    let yearStep = 1
    if (totalYears > 30) yearStep = 5
    else if (totalYears > 15) yearStep = 2

    for (
      let y = Math.ceil(dataMinYear / yearStep) * yearStep;
      y <= Math.floor(maxYear);
      y += yearStep
    ) {
      layout.yearMarkers.push({ year: y, x: yearToX(y), y: axonY })
    }

    // Axon path
    const axonSegments = 400
    for (let i = 0; i <= axonSegments; i++) {
      const t = i / axonSegments
      const x = padL + t * (W - padL - padR)
      const wobble = Math.sin(t * Math.PI * 3) * 4 + Math.sin(t * Math.PI * 7) * 1.5
      layout.axonPoints.push({ x, y: axonY + wobble })
    }

    function axonYAtX(targetX: number): number {
      const t = (targetX - padL) / (W - padL - padR)
      const idx = Math.max(0, Math.min(axonSegments, Math.round(t * axonSegments)))
      return layout.axonPoints[idx].y
    }

    const pxPerYear = (W - padL - padR) / yearSpan
    const transitionYears = Math.min(0.4, pxPerYear > 60 ? 0.4 : 0.2)

    branches.forEach((entry, idx) => {
      const isCurrent = entry.endYear >= currentYear
      const side = entry.side
      const offsetY = entry.offsetY * side

      const forkX = yearToX(entry.startYear)
      const forkAxonY = axonYAtX(forkX)
      const mergeX = yearToX(entry.endYear)
      const mergeAxonY = axonYAtX(mergeX)

      const transitionPx = yearToX(entry.startYear + transitionYears) - forkX
      const actualTransitionPx = Math.max(transitionPx, 8)
      const parallelStartX = forkX + actualTransitionPx
      const parallelEndX = isCurrent
        ? mergeX
        : Math.max(mergeX - actualTransitionPx, parallelStartX)
      const parallelY = forkAxonY + offsetY

      const pathPoints: AxonPoint[] = []
      const pathSegments = 80

      for (let i = 0; i <= pathSegments; i++) {
        const t = i / pathSegments
        const totalLen = mergeX - forkX
        const currentX = forkX + t * totalLen
        let currentY: number

        if (currentX <= parallelStartX) {
          const forkT = (currentX - forkX) / (parallelStartX - forkX || 1)
          const eased = forkT * forkT * (3 - 2 * forkT)
          currentY = axonYAtX(currentX) + offsetY * eased
        } else if (currentX >= parallelEndX && !isCurrent) {
          const mergeT = (currentX - parallelEndX) / (mergeX - parallelEndX || 1)
          const eased = mergeT * mergeT * (3 - 2 * mergeT)
          currentY = parallelY + (mergeAxonY - parallelY) * eased
        } else {
          const wobbleT =
            (currentX - parallelStartX) / Math.max(parallelEndX - parallelStartX, 1)
          currentY = parallelY + Math.sin(wobbleT * Math.PI * 2 + idx) * 2
        }

        pathPoints.push({ x: currentX, y: currentY })
      }

      layout.branches.push({
        ...entry,
        idx,
        forkX, forkAxonY,
        mergeX, mergeAxonY,
        parallelStartX, parallelEndX,
        parallelY,
        pathPoints,
        isCurrent,
        branchPxWidth: mergeX - forkX,
      })
    })
  }, [branches])

  // ---------------------------------------------------------------------------
  // Drawing functions (static — no animation parameters)
  // ---------------------------------------------------------------------------

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { w: W, h: H } = sizeRef.current
    const { axonPoints, branches: layoutBranches, yearMarkers } = layoutRef.current
    const hovered = hoveredRef.current

    // Clear
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    // -- Axon trunk --
    if (axonPoints.length >= 2) {
      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.strokeStyle = 'rgba(28, 25, 23, 0.03)'
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.moveTo(axonPoints[0].x, axonPoints[0].y)
      for (let i = 1; i < axonPoints.length; i++) ctx.lineTo(axonPoints[i].x, axonPoints[i].y)
      ctx.stroke()

      ctx.strokeStyle = 'rgba(28, 25, 23, 0.1)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(axonPoints[0].x, axonPoints[0].y)
      for (let i = 1; i < axonPoints.length; i++) ctx.lineTo(axonPoints[i].x, axonPoints[i].y)
      ctx.stroke()

      ctx.restore()
    }

    // -- Branches --
    for (const branch of layoutBranches) {
      const isHovered = hovered === branch
      const dimFactor = hovered && !isHovered ? 0.15 : 1
      const pts = branch.pathPoints

      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      // Fork junction dot
      ctx.fillStyle = hexToRgba(branch.color, 0.6 * dimFactor)
      ctx.beginPath()
      ctx.arc(branch.forkX, branch.forkAxonY, isHovered ? 3.5 : 2.5, 0, Math.PI * 2)
      ctx.fill()

      // Branch glow
      ctx.strokeStyle = hexToRgba(branch.color, (isHovered ? 0.1 : 0.04) * dimFactor)
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
      ctx.stroke()

      // Branch core
      ctx.strokeStyle = hexToRgba(branch.color, (isHovered ? 0.7 : 0.4) * dimFactor)
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
      ctx.stroke()

      // Merge junction dot
      if (!branch.isCurrent) {
        ctx.fillStyle = hexToRgba(branch.color, 0.5 * dimFactor)
        ctx.beginPath()
        ctx.arc(branch.mergeX, branch.mergeAxonY, isHovered ? 3 : 2, 0, Math.PI * 2)
        ctx.fill()
      }

      // -- Labels --
      const midX = (branch.parallelStartX + branch.parallelEndX) / 2
      let labelY = branch.parallelY
      for (const pp of pts) {
        if (Math.abs(pp.x - midX) < 5) { labelY = pp.y; break }
      }

      const clearance = 10
      const glowHalf = 7
      const bw = branch.branchPxWidth
      const nameFontSize = Math.max(10, Math.min(13, bw * 0.08))
      const roleFontSize = Math.max(8, Math.min(10, bw * 0.06))
      const maxLabelWidth = Math.max(bw * 1.4, 80)
      const nameFont = `600 ${nameFontSize}px ${FONT_SANS}`
      const roleFont = `${roleFontSize}px ${FONT_MONO}`
      const nameText = fitText(ctx, branch.name, nameFont, maxLabelWidth)
      const roleText = fitText(ctx, branch.role, roleFont, maxLabelWidth)
      const nameAlpha = (isHovered ? 1.0 : 0.8) * dimFactor
      const roleAlpha = (isHovered ? 0.7 : 0.5) * dimFactor

      if (branch.side === -1) {
        const baseY = labelY - glowHalf - clearance

        ctx.font = roleFont
        ctx.fillStyle = `rgba(87, 83, 78, ${roleAlpha})`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(roleText, midX, baseY)

        ctx.font = nameFont
        ctx.fillStyle = hexToRgba(branch.color, nameAlpha)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(nameText, midX, baseY - (roleFontSize + 4))
      } else {
        const baseY = labelY + glowHalf + clearance

        ctx.font = nameFont
        ctx.fillStyle = hexToRgba(branch.color, nameAlpha)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(nameText, midX, baseY)

        ctx.font = roleFont
        ctx.fillStyle = `rgba(87, 83, 78, ${roleAlpha})`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(roleText, midX, baseY + nameFontSize + 3)
      }

      ctx.restore()
    }

    // -- Year markers --
    for (const ym of yearMarkers) {
      ctx.save()

      const tickLen = 6
      ctx.strokeStyle = 'rgba(87, 83, 78, 0.2)'
      ctx.lineWidth = 0.75
      ctx.beginPath()
      ctx.moveTo(ym.x, ym.y - tickLen)
      ctx.lineTo(ym.x, ym.y + tickLen)
      ctx.stroke()

      ctx.font = `10px ${FONT_MONO}`
      ctx.fillStyle = 'rgba(87, 83, 78, 0.45)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(ym.year.toString(), ym.x, ym.y + tickLen + 4)

      ctx.restore()
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Schedule a redraw (batches multiple requests into one frame)
  // ---------------------------------------------------------------------------

  const scheduleDraw = useCallback(() => {
    if (drawScheduledRef.current) return
    drawScheduledRef.current = true
    requestAnimationFrame(() => {
      drawScheduledRef.current = false
      draw()
    })
  }, [draw])

  // ---------------------------------------------------------------------------
  // Hit testing
  // ---------------------------------------------------------------------------

  const updateHover = useCallback(() => {
    const mouse = mouseRef.current
    const { branches: layoutBranches } = layoutRef.current
    let found: LayoutBranch | null = null

    for (const br of layoutBranches) {
      for (const pp of br.pathPoints) {
        if (Math.abs(mouse.x - pp.x) < 15 && Math.abs(mouse.y - pp.y) < 20) {
          found = br
          break
        }
      }
      if (found) break
    }

    const prev = hoveredRef.current
    if (found === prev) {
      // Same branch — update tooltip position if moved
      if (found) {
        const W = sizeRef.current.w
        const H = sizeRef.current.h
        let tx = mouse.x + 20
        let ty = mouse.y - 10
        if (tx + 260 > W) tx = mouse.x - 280
        if (ty + 150 > H) ty = mouse.y - 150
        if (ty < 10) ty = 10
        const last = lastTooltipRef.current
        if (!last || last.x !== tx || last.y !== ty) {
          lastTooltipRef.current = { branchIdx: found.idx, x: tx, y: ty }
          setTooltip({ branch: found, x: tx, y: ty })
        }
      }
      return
    }

    // Hover changed — redraw and update tooltip
    hoveredRef.current = found
    scheduleDraw()

    if (found) {
      const W = sizeRef.current.w
      const H = sizeRef.current.h
      let tx = mouse.x + 20
      let ty = mouse.y - 10
      if (tx + 260 > W) tx = mouse.x - 280
      if (ty + 150 > H) ty = mouse.y - 150
      if (ty < 10) ty = 10
      lastTooltipRef.current = { branchIdx: found.idx, x: tx, y: ty }
      setTooltip({ branch: found, x: tx, y: ty })
    } else {
      lastTooltipRef.current = null
      setTooltip(null)
    }
  }, [scheduleDraw])

  // ---------------------------------------------------------------------------
  // Resize + layout
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      const dpr = window.devicePixelRatio || 1
      const rect = container!.getBoundingClientRect()
      sizeRef.current = { w: rect.width, h: rect.height }
      canvas!.width = rect.width * dpr
      canvas!.height = rect.height * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      computeLayout()
      scheduleDraw()
    }

    resize()

    const observer = new ResizeObserver(resize)
    observer.observe(container)

    return () => observer.disconnect()
  }, [computeLayout, scheduleDraw])

  // ---------------------------------------------------------------------------
  // Mouse events
  // ---------------------------------------------------------------------------

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    updateHover()
  }, [updateHover])

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -9999, y: -9999 }
    if (hoveredRef.current) {
      hoveredRef.current = null
      lastTooltipRef.current = null
      setTooltip(null)
      scheduleDraw()
    }
  }, [scheduleDraw])

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  if (branches.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full text-text-muted text-sm">
        Add experience to your profile to see your career timeline.
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ cursor: tooltip ? 'pointer' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {tooltip && (
        <div
          className="absolute pointer-events-none bg-white border border-border-subtle rounded-lg shadow-md p-3 text-sm max-w-[260px]"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div
            className="font-semibold text-sm mb-0.5"
            style={{ fontFamily: FONT_SANS, color: tooltip.branch.color }}
          >
            {tooltip.branch.name}
          </div>
          <div className="text-text-secondary text-xs mb-2" style={{ fontFamily: FONT_SANS }}>
            {tooltip.branch.role}
          </div>
          {tooltip.branch.skills.length > 0 && (
            <div className="text-[11px] text-text-secondary leading-relaxed" style={{ fontFamily: FONT_MONO }}>
              {tooltip.branch.skills.join(' \u00B7 ')}
            </div>
          )}
          {tooltip.branch.projects.length > 0 && (
            <div className="mt-1.5 text-[10px] text-text-muted" style={{ fontFamily: FONT_MONO }}>
              Projects: {tooltip.branch.projects.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
