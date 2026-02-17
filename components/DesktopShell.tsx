"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CENTER_DISPLAY_CLUSTERS, resolveNodeImageUrl } from "@/lib/appRegistry"
import P5Background from "@/components/P5Background"

type PositionedNode = {
  id: string
  name: string
  description: string
  imageUrl: string
  clusterId: string
  clusterName: string
  clusterColor: string
  x: number
  y: number
  size: number
}

type Rect = {
  x: number
  y: number
  width: number
  height: number
}

const VIEWPORT_PADDING = 16
const GRID_GAP = 8
const NODE_MIN_SIZE = 42
const NODE_MAX_SIZE = 72
const NODE_ABSOLUTE_MIN_SIZE = 16

// Pulled from helios-lattice palette constants in sketch.js:
// SCAFFOLD_RED, TRAIL_COOL_DAY, GUIDE_LAYER_DAY, GUIDE_WARM_DAY, BODY_COOL_DAY, TRAIL_WARM_DAY, GUIDE_COOL_DAY
const CLUSTER_COLORS = ["#ff3838", "#7ed0ff", "#9cebc0", "#ffab81", "#9be2ff", "#ffc178", "#6fc2ff"]

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function shuffleIndices(length: number, seed = 0) {
  const items = Array.from({ length }, (_, i) => i)
  let s = seed || 1
  function rand() {
    s ^= s << 13
    s ^= s >> 17
    s ^= s << 5
    return ((s >>> 0) % 10000) / 10000
  }

  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }

  return items
}

function buildRandomGrid(
  nodeCount: number,
  stageWidth: number,
  stageHeight: number,
  seed: number,
  blockedRect?: Rect
): Array<{ x: number; y: number; size: number }> {
  if (nodeCount === 0) return []

  const usableWidth = Math.max(1, stageWidth - VIEWPORT_PADDING * 2)
  const usableHeight = Math.max(1, stageHeight - VIEWPORT_PADDING * 2)
  const areaPerNode = (usableWidth * usableHeight) / nodeCount
  const targetSize = Math.floor(Math.sqrt(Math.max(1, areaPerNode)) - GRID_GAP)
  let size = clamp(targetSize, NODE_MIN_SIZE, NODE_MAX_SIZE)

  let cols = 1
  let rows = 1
  let cell = size + GRID_GAP
  let nonOverlappingCells: number[] = []

  while (size >= NODE_ABSOLUTE_MIN_SIZE) {
    cell = size + GRID_GAP
    cols = Math.max(1, Math.floor((usableWidth + GRID_GAP) / cell))
    rows = Math.max(1, Math.floor((usableHeight + GRID_GAP) / cell))
    const totalCells = cols * rows
    const allCells = Array.from({ length: totalCells }, (_, i) => i)
    nonOverlappingCells = allCells.filter((cellIndex) => {
      if (!blockedRect) return true
      const col = cellIndex % cols
      const row = Math.floor(cellIndex / cols)
      const x = VIEWPORT_PADDING + col * cell
      const y = VIEWPORT_PADDING + row * cell
      const overlapsX = x < blockedRect.x + blockedRect.width && x + size > blockedRect.x
      const overlapsY = y < blockedRect.y + blockedRect.height && y + size > blockedRect.y
      return !(overlapsX && overlapsY)
    })

    if (nonOverlappingCells.length >= nodeCount) {
      break
    }

    size -= 1
  }

  if (nonOverlappingCells.length === 0) {
    return []
  }

  const shuffled = shuffleIndices(nonOverlappingCells.length, seed).map((index) => nonOverlappingCells[index])

  const positions: Array<{ x: number; y: number; size: number }> = []
  for (let i = 0; i < nodeCount; i += 1) {
    const cellIndex = shuffled[i % shuffled.length]
    const col = cellIndex % cols
    const row = Math.floor(cellIndex / cols)

    const x = VIEWPORT_PADDING + col * cell
    const y = VIEWPORT_PADDING + row * cell

    positions.push({ x, y, size })
  }

  return positions
}

function getReservedDisplayRect(stageWidth: number, stageHeight: number): Rect {
  const maxWidth = Math.min(460, Math.floor(stageWidth * 0.52))
  const maxHeight = Math.min(460, Math.floor(stageHeight * 0.52))
  const x = Math.round(stageWidth * 0.5 - maxWidth * 0.5)
  const y = Math.round(stageHeight * 0.5 - maxHeight * 0.5)
  return {
    x: x - GRID_GAP,
    y: y - GRID_GAP,
    width: maxWidth + GRID_GAP * 2,
    height: maxHeight + GRID_GAP * 2
  }
}

function intersectsRect(x: number, y: number, size: number, rect: Rect, margin = 0) {
  const left = x - margin
  const top = y - margin
  const right = x + size + margin
  const bottom = y + size + margin
  return left < rect.x + rect.width && right > rect.x && top < rect.y + rect.height && bottom > rect.y
}

export default function DesktopShell() {
  const stageRef = useRef<HTMLDivElement>(null)
  const randomSeedRef = useRef(Math.floor(Math.random() * 2147483647) + 1)

  const [stageSize, setStageSize] = useState({ width: 1280, height: 720 })
  const [imageRatios, setImageRatios] = useState<Record<string, number>>({})

  const flattenedNodes = useMemo(() => {
    const nodes: Omit<PositionedNode, "x" | "y" | "size">[] = []

    CENTER_DISPLAY_CLUSTERS.forEach((cluster, clusterIndex) => {
      const color = CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length]
      cluster.nodes.forEach((node) => {
        nodes.push({
          id: `${cluster.id}:${node.id}`,
          name: node.name,
          description: node.description,
          imageUrl: resolveNodeImageUrl(node.image),
          clusterId: cluster.id,
          clusterName: cluster.name,
          clusterColor: color
        })
      })
    })

    return nodes
  }, [])

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(() => {
    if (flattenedNodes.length === 0) return null
    const randomIndex = Math.floor(Math.random() * flattenedNodes.length)
    return flattenedNodes[randomIndex]?.id ?? null
  })

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

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null
    return flattenedNodes.find((node) => node.id === selectedNodeId) ?? null
  }, [flattenedNodes, selectedNodeId])

  const displayDimensions = useMemo(() => {
    if (!selectedNode) {
      return { width: 0, height: 0 }
    }

    const maxWidth = Math.min(460, Math.floor(stageSize.width * 0.52))
    const maxHeight = Math.min(460, Math.floor(stageSize.height * 0.52))
    const ratio = clamp(imageRatios[selectedNode.imageUrl] ?? 1, 0.05, 20)

    let width = maxWidth
    let height = width / ratio
    if (height > maxHeight) {
      height = maxHeight
      width = height * ratio
    }

    return {
      width: Math.max(120, Math.round(width)),
      height: Math.max(120, Math.round(height))
    }
  }, [imageRatios, selectedNode, stageSize.height, stageSize.width])

  const reservedDisplayRect = useMemo(
    () => getReservedDisplayRect(stageSize.width, stageSize.height),
    [stageSize.height, stageSize.width]
  )

  const positionedNodes = useMemo(() => {
    const layout = buildRandomGrid(
      flattenedNodes.length,
      stageSize.width,
      stageSize.height,
      randomSeedRef.current,
      reservedDisplayRect
    )

    return flattenedNodes.map((node, index) => ({
      ...node,
      x: layout[index]?.x ?? VIEWPORT_PADDING,
      y: layout[index]?.y ?? VIEWPORT_PADDING,
      size: layout[index]?.size ?? NODE_MIN_SIZE
    }))
  }, [flattenedNodes, reservedDisplayRect, stageSize.height, stageSize.width])

  return (
    <main className="desktop-shell">
      <section ref={stageRef} className="stage" aria-label="Cluster node stage">
        <P5Background />

        <div className="cluster-canvas">
          {positionedNodes
            .filter((node) => !intersectsRect(node.x, node.y, node.size, reservedDisplayRect, 4))
            .map((node) => {
            const isSelected = node.id === selectedNode?.id
            return (
              <button
                key={node.id}
                type="button"
                className={`node-square${isSelected ? " is-selected" : ""}`}
                onClick={() => setSelectedNodeId(node.id)}
                title={`${node.clusterName} - ${node.name}`}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: `${node.size}px`,
                  height: `${node.size}px`,
                  borderColor: node.clusterColor,
                  background: isSelected ? node.clusterColor : "#000"
                }}
              >
              </button>
            )
          })}
        </div>

        {selectedNode ? (
          <aside
            className="display-overlay"
            aria-label="Selected node display"
            style={{
              width: `${displayDimensions.width}px`,
              height: `${displayDimensions.height}px`,
              borderColor: selectedNode.clusterColor
            }}
          >
            <header
              className="display-overlay-header"
              style={{
                background: selectedNode.clusterColor
              }}
            >
              <span>{selectedNode.clusterName}</span>
              <span>{selectedNode.name}</span>
            </header>
            <div className="display-overlay-image-wrap">
              <img
                key={selectedNode.id}
                alt={`${selectedNode.clusterName} ${selectedNode.name}`}
                src={selectedNode.imageUrl}
                loading="eager"
                decoding="async"
                draggable={false}
                onLoad={(event) => {
                  const { naturalWidth, naturalHeight, currentSrc } = event.currentTarget
                  if (!naturalWidth || !naturalHeight) return
                  const nextRatio = naturalWidth / naturalHeight
                  setImageRatios((prev) =>
                    prev[currentSrc] === nextRatio && prev[selectedNode.imageUrl] === nextRatio
                      ? prev
                      : {
                          ...prev,
                          [currentSrc]: nextRatio,
                          [selectedNode.imageUrl]: nextRatio
                        }
                  )
                }}
              />
            </div>
          </aside>
        ) : null}
      </section>
    </main>
  )
}
