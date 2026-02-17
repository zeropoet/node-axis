"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CENTER_DISPLAY_CLUSTERS, resolveNodeImageUrl } from "@/lib/appRegistry"
import P5Background from "@/components/P5Background"

const IMAGE_STEP_MS = 100
const PANEL_MIN_SIZE = 140
const PANEL_MAX_SIZE = 260
const VIEWPORT_PADDING = 16
const GRID_GAP = 24

type Point = {
  x: number
  y: number
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function randomOrder(size: number) {
  const values = Array.from({ length: size }, (_, index) => index)
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[values[i], values[j]] = [values[j], values[i]]
  }
  return values
}

function buildRandomGridPositions(clusterCount: number, stageWidth: number, stageHeight: number, panelSize: number): Point[] {
  if (clusterCount === 0) return []

  const usableWidth = Math.max(1, stageWidth - VIEWPORT_PADDING * 2)
  const usableHeight = Math.max(1, stageHeight - VIEWPORT_PADDING * 2)
  const cellSize = panelSize + GRID_GAP
  const cols = Math.max(1, Math.floor((usableWidth + GRID_GAP) / cellSize))
  const rows = Math.max(1, Math.floor((usableHeight + GRID_GAP) / cellSize))
  const totalCells = Math.max(clusterCount, cols * rows)

  const shuffledCells = randomOrder(totalCells)
  const maxX = Math.max(VIEWPORT_PADDING, stageWidth - panelSize - VIEWPORT_PADDING)
  const maxY = Math.max(VIEWPORT_PADDING, stageHeight - panelSize - VIEWPORT_PADDING)
  const positions: Point[] = []

  for (let i = 0; i < clusterCount; i += 1) {
    const cell = shuffledCells[i]
    const cellCol = cell % cols
    const cellRow = Math.floor(cell / cols)
    const baseX = VIEWPORT_PADDING + cellCol * cellSize
    const baseY = VIEWPORT_PADDING + cellRow * cellSize
    const jitterX = Math.floor(Math.random() * Math.max(1, GRID_GAP * 0.6))
    const jitterY = Math.floor(Math.random() * Math.max(1, GRID_GAP * 0.6))

    positions.push({
      x: clamp(baseX + jitterX, VIEWPORT_PADDING, maxX),
      y: clamp(baseY + jitterY, VIEWPORT_PADDING, maxY)
    })
  }

  return positions
}

export default function DesktopShell() {
  const stageRef = useRef<HTMLDivElement>(null)
  const [stageSize, setStageSize] = useState({ width: 1280, height: 720 })

  const clusters = useMemo(() => CENTER_DISPLAY_CLUSTERS.filter((cluster) => cluster.nodes.length > 0), [])
  const [activeIndices, setActiveIndices] = useState<Record<string, number>>({})

  useEffect(() => {
    const seeded: Record<string, number> = {}
    for (const cluster of clusters) {
      seeded[cluster.id] = 0
    }
    setActiveIndices(seeded)
  }, [clusters])

  useEffect(() => {
    if (clusters.length === 0) return
    const timer = window.setInterval(() => {
      setActiveIndices((prev) => {
        const next: Record<string, number> = { ...prev }
        for (const cluster of clusters) {
          const nodeCount = cluster.nodes.length
          next[cluster.id] = nodeCount <= 1 ? 0 : ((prev[cluster.id] ?? 0) + 1) % nodeCount
        }
        return next
      })
    }, IMAGE_STEP_MS)

    return () => window.clearInterval(timer)
  }, [clusters])

  useEffect(() => {
    function syncSize() {
      const el = stageRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setStageSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) })
    }

    syncSize()
    window.addEventListener("resize", syncSize)
    return () => window.removeEventListener("resize", syncSize)
  }, [])

  const panelSize = useMemo(() => {
    const minDimension = Math.min(stageSize.width, stageSize.height)
    return clamp(Math.floor(minDimension * 0.26), PANEL_MIN_SIZE, PANEL_MAX_SIZE)
  }, [stageSize.height, stageSize.width])

  const randomGridPositions = useMemo(
    () => buildRandomGridPositions(clusters.length, stageSize.width, stageSize.height, panelSize),
    [clusters.length, panelSize, stageSize.height, stageSize.width]
  )

  return (
    <main className="desktop-shell">
      <section ref={stageRef} className="stage" aria-label="Cluster stage">
        <P5Background />

        <div className="cluster-canvas">
          {clusters.map((cluster, index) => {
            const nodeIndex = activeIndices[cluster.id] ?? 0
            const node = cluster.nodes[nodeIndex] ?? cluster.nodes[0]
            const imageUrl = resolveNodeImageUrl(node.image)
            const position = randomGridPositions[index] ?? { x: VIEWPORT_PADDING, y: VIEWPORT_PADDING }

            return (
              <div
                key={cluster.id}
                className="cluster-node"
                style={{ left: `${position.x}px`, top: `${position.y}px` }}
              >
                <aside
                  className="repo-panel cluster-panel"
                  aria-label={`${cluster.name} preview`}
                  style={{ width: `${panelSize}px`, height: `${panelSize}px` }}
                >
                  <img
                    key={`${cluster.id}-${node.id}`}
                    alt={`${cluster.name} ${node.name} preview`}
                    src={imageUrl}
                    loading="eager"
                    decoding="async"
                    draggable={false}
                  />
                </aside>
                <p className="cluster-name">{cluster.name}</p>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
