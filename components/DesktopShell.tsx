"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CENTER_DISPLAY_CLUSTERS } from "@/lib/appRegistry"
import P5Background from "@/components/P5Background"

type GridSortProperty = "clusterId" | "name" | "mass"

type PositionedNode = {
  id: string
  name: string
  description: string
  image: string
  clusterId: string
  clusterName: string
  clusterColor: string
  nodeMass: number
  x: number
  y: number
  size: number
  col: number
  row: number
  index: number
}

type GridCell = {
  x: number
  y: number
  size: number
  col: number
  row: number
  index: number
}

type GridLayout = {
  positions: GridCell[]
  cols: number
  rows: number
  cellCount: number
  activeCellIndices: number[]
}

type CornerPoints = {
  tl: { x: number; y: number }
  tr: { x: number; y: number }
  br: { x: number; y: number }
  bl: { x: number; y: number }
}

type LinkSegment = {
  key: string
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  opacity: number
  width: number
}

type FacetFill = {
  key: string
  points: string
  color: string
  opacity: number
}

const VIEWPORT_PADDING = 0
const GRID_GAP = 0
const GRID_SORT_PROPERTY: GridSortProperty = "clusterId"
const RANDOM_MASS_MIN = 0.42
const RANDOM_MASS_MAX = 0.94
// TODO: Replace random node mass with content-density-derived mass.
const REFERENCE_VIEWPORT_AREA = 1280 * 720
const GRID_OPEN_CELL_RATIO = 0.34
const MOVEMENT_INTERVAL_MS = 140
const MOVEMENT_BATCH_RATIO = 0.16
const VELOCITY_NORMALIZATION_SPEED = 720
const VELOCITY_DECAY = 0.8
const VELOCITY_MASS_COMPRESSION = 0.28
const MASS_GROWTH_DURATION_MS = 180000

const FALLBACK_CLUSTER_COLORS = ["#ff2d55", "#00c2ff", "#00e08a", "#ff8a00", "#7a5cff", "#ffd400", "#ff4fd8"]

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function hashToUnit(value: string) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return ((hash >>> 0) % 10000) / 10000
}

function buildGridLayout(nodeCount: number, stageWidth: number, stageHeight: number): GridLayout {
  if (nodeCount === 0) {
    return { positions: [], cols: 1, rows: 1, cellCount: 0, activeCellIndices: [] }
  }

  const usableWidth = Math.max(1, stageWidth - VIEWPORT_PADDING * 2) - GRID_GAP
  const usableHeight = Math.max(1, stageHeight - VIEWPORT_PADDING * 2) - GRID_GAP
  const viewportRatio = usableWidth / Math.max(1, usableHeight)
  const targetCellCount = Math.max(nodeCount + 1, Math.ceil(nodeCount * (1 + GRID_OPEN_CELL_RATIO)))
  const latticeCellCount = Math.max(targetCellCount, Math.ceil(targetCellCount * 1.5))

  let rows = Math.max(1, Math.round(Math.sqrt(latticeCellCount / Math.max(0.1, viewportRatio))))
  let cols = Math.max(1, Math.ceil(latticeCellCount / rows))
  if (cols * rows < latticeCellCount) {
    rows = Math.max(1, Math.ceil(latticeCellCount / cols))
  }

  const viewportScale = Math.sqrt((usableWidth * usableHeight) / Math.max(1, REFERENCE_VIEWPORT_AREA))
  const responsiveScale = clamp(viewportScale, 0.78, 1.08)
  const size = Math.max(1, Math.min(usableWidth / cols, usableHeight / rows) * responsiveScale)
  const cell = size + GRID_GAP
  const gridWidth = cols * cell - GRID_GAP
  const gridHeight = rows * cell - GRID_GAP
  const xOffset = VIEWPORT_PADDING + Math.floor((usableWidth - gridWidth) * 0.5)
  const yOffset = VIEWPORT_PADDING + Math.floor((usableHeight - gridHeight) * 0.5)
  const positions: GridCell[] = []

  const cellCount = cols * rows

  for (let i = 0; i < cellCount; i += 1) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = xOffset + col * cell
    const y = yOffset + row * cell
    positions.push({ x, y, size, col, row, index: i })
  }

  const centerCol = (cols - 1) * 0.5
  const centerRow = (rows - 1) * 0.5
  const radiusCol = Math.max(1, cols * 0.5)
  const radiusRow = Math.max(1, rows * 0.5)
  const rankedByCenter = positions
    .map((cellData) => {
      const dx = (cellData.col - centerCol) / radiusCol
      const dy = (cellData.row - centerRow) / radiusRow
      const circularDistance = dx * dx + dy * dy
      return { index: cellData.index, circularDistance }
    })
    .sort((a, b) => {
      if (a.circularDistance !== b.circularDistance) return a.circularDistance - b.circularDistance
      return a.index - b.index
    })

  const activeCellIndices = rankedByCenter.slice(0, Math.min(targetCellCount, cellCount)).map((item) => item.index)

  return { positions, cols, rows, cellCount, activeCellIndices }
}

function getSortValue(node: Omit<PositionedNode, "x" | "y" | "size" | "col" | "row" | "index">, property: GridSortProperty) {
  if (property === "name") return node.name.toLowerCase()
  if (property === "mass") return node.nodeMass
  return node.clusterId
}

function getNodeCorners(node: PositionedNode): CornerPoints {
  return {
    tl: { x: node.x, y: node.y },
    tr: { x: node.x + node.size, y: node.y },
    br: { x: node.x + node.size, y: node.y + node.size },
    bl: { x: node.x, y: node.y + node.size }
  }
}

export default function DesktopShell() {
  const stageRef = useRef<HTMLDivElement>(null)
  const previousNodeCellIndicesRef = useRef<number[] | null>(null)
  const previousVelocitySampleAtRef = useRef<number | null>(null)
  const growthStartedAtRef = useRef<number>(performance.now())
  const [stageSize, setStageSize] = useState({ width: 1280, height: 720 })
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [growthTick, setGrowthTick] = useState(0)

  const flattenedNodes = useMemo(() => {
    const nodes: Omit<PositionedNode, "x" | "y" | "size" | "col" | "row" | "index">[] = []

    CENTER_DISPLAY_CLUSTERS.forEach((cluster, clusterIndex) => {
      const color = cluster.color ?? FALLBACK_CLUSTER_COLORS[clusterIndex % FALLBACK_CLUSTER_COLORS.length]

      cluster.nodes.forEach((node) => {
        const randomMass = RANDOM_MASS_MIN + hashToUnit(`${cluster.id}:${node.id}:mass`) * (RANDOM_MASS_MAX - RANDOM_MASS_MIN)
        nodes.push({
          id: `${cluster.id}:${node.id}`,
          name: node.name,
          description: node.description,
          image: node.image,
          clusterId: cluster.id,
          clusterName: cluster.name,
          clusterColor: color,
          nodeMass: randomMass
        })
      })
    })

    return nodes
  }, [])

  const arrangedNodes = useMemo(() => {
    return [...flattenedNodes].sort((a, b) => {
      const aValue = getSortValue(a, GRID_SORT_PROPERTY)
      const bValue = getSortValue(b, GRID_SORT_PROPERTY)
      if (aValue < bValue) return -1
      if (aValue > bValue) return 1
      if (a.name !== b.name) return a.name.localeCompare(b.name)
      return a.id.localeCompare(b.id)
    })
  }, [flattenedNodes])

  useEffect(() => {
    const el = stageRef.current
    if (!el) return

    function syncSize() {
      const rect = el!.getBoundingClientRect()
      setStageSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) })
    }

    syncSize()
    const observer = new ResizeObserver(() => {
      syncSize()
    })
    observer.observe(el)
    window.addEventListener("resize", syncSize)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", syncSize)
    }
  }, [])

  const gridLayout = useMemo(() => {
    return buildGridLayout(arrangedNodes.length, stageSize.width, stageSize.height)
  }, [arrangedNodes.length, stageSize.height, stageSize.width])

  const [nodeCellIndices, setNodeCellIndices] = useState<number[]>([])
  const [nodeVelocityByIndex, setNodeVelocityByIndex] = useState<number[]>([])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setGrowthTick((prev) => prev + 1)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    setNodeCellIndices((prev) => {
      if (arrangedNodes.length === 0 || gridLayout.cellCount === 0) return []
      const activeCellSet = new Set<number>(gridLayout.activeCellIndices)
      if (
        prev.length === arrangedNodes.length &&
        prev.every((idx) => idx >= 0 && idx < gridLayout.cellCount && activeCellSet.has(idx))
      ) {
        return prev
      }

      return Array.from(
        { length: arrangedNodes.length },
        (_, index) => gridLayout.activeCellIndices[index % gridLayout.activeCellIndices.length] ?? 0
      )
    })
  }, [arrangedNodes.length, gridLayout.activeCellIndices, gridLayout.cellCount])

  useEffect(() => {
    setNodeVelocityByIndex((prev) => {
      if (prev.length === arrangedNodes.length) return prev
      return Array.from({ length: arrangedNodes.length }, () => 0)
    })
  }, [arrangedNodes.length])

  useEffect(() => {
    if (arrangedNodes.length === 0 || gridLayout.cellCount === 0) return
    const activeCellSet = new Set<number>(gridLayout.activeCellIndices)

    const timer = window.setInterval(() => {
      setNodeCellIndices((prev) => {
        if (prev.length !== arrangedNodes.length) return prev

        const next = prev.slice()
        const occupied = new Map<number, number>()
        next.forEach((cellIndex, nodeIndex) => {
          occupied.set(cellIndex, nodeIndex)
        })

        const moveAttempts = Math.max(1, Math.floor(arrangedNodes.length * MOVEMENT_BATCH_RATIO))
        for (let attempt = 0; attempt < moveAttempts; attempt += 1) {
          const nodeIndex = Math.floor(Math.random() * arrangedNodes.length)
          const currentCell = next[nodeIndex]
          const col = currentCell % gridLayout.cols
          const row = Math.floor(currentCell / gridLayout.cols)

          const neighbors: number[] = []
          if (col > 0) neighbors.push(currentCell - 1)
          if (col < gridLayout.cols - 1) neighbors.push(currentCell + 1)
          if (row > 0) neighbors.push(currentCell - gridLayout.cols)
          if (row < gridLayout.rows - 1) neighbors.push(currentCell + gridLayout.cols)

          const openNeighbors = neighbors.filter((neighborCell) => {
            return (
              neighborCell >= 0 &&
              neighborCell < gridLayout.cellCount &&
              activeCellSet.has(neighborCell) &&
              !occupied.has(neighborCell)
            )
          })

          if (openNeighbors.length === 0) continue
          const targetCell = openNeighbors[Math.floor(Math.random() * openNeighbors.length)]

          occupied.delete(currentCell)
          occupied.set(targetCell, nodeIndex)
          next[nodeIndex] = targetCell
        }

        return next
      })
    }, MOVEMENT_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [arrangedNodes.length, gridLayout.activeCellIndices, gridLayout.cellCount, gridLayout.cols, gridLayout.rows])

  useEffect(() => {
    if (arrangedNodes.length === 0 || nodeCellIndices.length !== arrangedNodes.length) return

    const previousCellIndices = previousNodeCellIndicesRef.current
    if (!previousCellIndices || previousCellIndices.length !== nodeCellIndices.length) {
      previousNodeCellIndicesRef.current = nodeCellIndices.slice()
      previousVelocitySampleAtRef.current = performance.now()
      return
    }

    const now = performance.now()
    const previousSampleAt = previousVelocitySampleAtRef.current ?? now - MOVEMENT_INTERVAL_MS
    const deltaSeconds = Math.max(0.016, (now - previousSampleAt) / 1000)

    setNodeVelocityByIndex((prev) => {
      const current = prev.length === arrangedNodes.length ? prev : Array.from({ length: arrangedNodes.length }, () => 0)
      return nodeCellIndices.map((cellIndex, nodeIndex) => {
        const existingVelocity = current[nodeIndex] ?? 0
        const previousCellIndex = previousCellIndices[nodeIndex]

        if (previousCellIndex === cellIndex) {
          const decayed = existingVelocity * VELOCITY_DECAY
          return decayed < 0.002 ? 0 : decayed
        }

        const previousLayout = gridLayout.positions[previousCellIndex]
        const nextLayout = gridLayout.positions[cellIndex]
        if (!previousLayout || !nextLayout) {
          const decayed = existingVelocity * VELOCITY_DECAY
          return decayed < 0.002 ? 0 : decayed
        }

        const distance = Math.hypot(nextLayout.x - previousLayout.x, nextLayout.y - previousLayout.y)
        const speed = distance / deltaSeconds
        const normalizedVelocity = clamp(speed / VELOCITY_NORMALIZATION_SPEED, 0, 1)
        return Math.max(normalizedVelocity, existingVelocity * 0.62)
      })
    })

    previousNodeCellIndicesRef.current = nodeCellIndices.slice()
    previousVelocitySampleAtRef.current = now
  }, [arrangedNodes.length, gridLayout.positions, nodeCellIndices])

  const positionedNodes = useMemo(() => {
    const elapsedGrowthMs = Math.max(0, performance.now() - growthStartedAtRef.current)
    const growthProgress = clamp(elapsedGrowthMs / MASS_GROWTH_DURATION_MS, 0, 1)

    return arrangedNodes.map((node, index) => {
      const cellIndex = nodeCellIndices[index] ?? index
      const layout = gridLayout.positions[cellIndex]
      const baseSize = layout?.size ?? 1
      const velocity = nodeVelocityByIndex[index] ?? 0
      const grownMass = node.nodeMass + (1 - node.nodeMass) * growthProgress
      const velocityScale = 1 - velocity * VELOCITY_MASS_COMPRESSION
      const massScale = clamp(grownMass * velocityScale, RANDOM_MASS_MIN * 0.7, 1)
      const scaledSize = baseSize * massScale
      const scaledOffset = (scaledSize - baseSize) * 0.5
      return {
        ...node,
        x: (layout?.x ?? VIEWPORT_PADDING) - scaledOffset,
        y: (layout?.y ?? VIEWPORT_PADDING) - scaledOffset,
        size: scaledSize,
        col: layout?.col ?? 0,
        row: layout?.row ?? 0,
        index: cellIndex
      }
    })
  }, [arrangedNodes, gridLayout.positions, growthTick, nodeCellIndices, nodeVelocityByIndex])

  const selectedFacetFills = useMemo(() => {
    if (!selectedNodeId) return [] as FacetFill[]

    const nodesByCell = new Map<number, PositionedNode>()
    positionedNodes.forEach((node) => {
      nodesByCell.set(node.index, node)
    })

    const selectedNode = positionedNodes.find((node) => node.id === selectedNodeId)
    if (!selectedNode) return [] as FacetFill[]

    const selectedColor = "rgb(205, 205, 205)"
    const selectedCorners = getNodeCorners(selectedNode)
    const selectedCell = selectedNode.index
    const col = selectedCell % gridLayout.cols
    const row = Math.floor(selectedCell / gridLayout.cols)
    const fills: FacetFill[] = []

    function addFacet(
      key: string,
      neighborCell: number,
      pointsBuilder: (neighborCorners: CornerPoints) => string
    ) {
      if (neighborCell < 0 || neighborCell >= gridLayout.cellCount) return
      const neighborNode = nodesByCell.get(neighborCell)
      if (!neighborNode) return

      const neighborCorners = getNodeCorners(neighborNode)
      fills.push({
        key,
        points: pointsBuilder(neighborCorners),
        color: selectedColor,
        opacity: 0.45
      })
    }

    addFacet(
      `${selectedNode.id}-facet-right`,
      col < gridLayout.cols - 1 ? selectedCell + 1 : -1,
      (neighborCorners) =>
        `${selectedCorners.tr.x},${selectedCorners.tr.y} ${selectedCorners.br.x},${selectedCorners.br.y} ${neighborCorners.bl.x},${neighborCorners.bl.y} ${neighborCorners.tl.x},${neighborCorners.tl.y}`
    )

    addFacet(
      `${selectedNode.id}-facet-left`,
      col > 0 ? selectedCell - 1 : -1,
      (neighborCorners) =>
        `${selectedCorners.tl.x},${selectedCorners.tl.y} ${selectedCorners.bl.x},${selectedCorners.bl.y} ${neighborCorners.br.x},${neighborCorners.br.y} ${neighborCorners.tr.x},${neighborCorners.tr.y}`
    )

    addFacet(
      `${selectedNode.id}-facet-down`,
      row < gridLayout.rows - 1 ? selectedCell + gridLayout.cols : -1,
      (neighborCorners) =>
        `${selectedCorners.bl.x},${selectedCorners.bl.y} ${selectedCorners.br.x},${selectedCorners.br.y} ${neighborCorners.tr.x},${neighborCorners.tr.y} ${neighborCorners.tl.x},${neighborCorners.tl.y}`
    )

    addFacet(
      `${selectedNode.id}-facet-up`,
      row > 0 ? selectedCell - gridLayout.cols : -1,
      (neighborCorners) =>
        `${selectedCorners.tl.x},${selectedCorners.tl.y} ${selectedCorners.tr.x},${selectedCorners.tr.y} ${neighborCorners.br.x},${neighborCorners.br.y} ${neighborCorners.bl.x},${neighborCorners.bl.y}`
    )

    return fills
  }, [gridLayout.cellCount, gridLayout.cols, gridLayout.rows, positionedNodes, selectedNodeId])

  const linkSegments = useMemo(() => {
    const segments: LinkSegment[] = []
    const cols = gridLayout.cols
    const rows = gridLayout.rows
    const cornerCache = new Map<string, CornerPoints>()
    const nodesByCell = new Map<number, PositionedNode>()

    positionedNodes.forEach((node) => {
      nodesByCell.set(node.index, node)
    })

    function cornersFor(node: PositionedNode) {
      const cached = cornerCache.get(node.id)
      if (cached) return cached
      const computed = getNodeCorners(node)
      cornerCache.set(node.id, computed)
      return computed
    }

    for (let cellIndex = 0; cellIndex < gridLayout.cellCount; cellIndex += 1) {
      const node = nodesByCell.get(cellIndex)
      if (!node) continue
      const nodeCorners = cornersFor(node)
      const col = cellIndex % cols
      const row = Math.floor(cellIndex / cols)
      const rightIndex = col < cols - 1 ? cellIndex + 1 : -1
      const downIndex = row < rows - 1 ? cellIndex + cols : -1

      if (rightIndex >= 0) {
        const rightNode = nodesByCell.get(rightIndex)
        if (rightNode) {
          const rightCorners = cornersFor(rightNode)
          const highlighted = node.id === selectedNodeId || rightNode.id === selectedNodeId
          const opacity = highlighted ? 0.9 : 0.36
          const width = highlighted ? 2.2 : 1.35

          segments.push({
            key: `${node.id}-rt`,
            x1: nodeCorners.tr.x,
            y1: nodeCorners.tr.y,
            x2: rightCorners.tl.x,
            y2: rightCorners.tl.y,
            color: node.clusterColor,
            opacity,
            width
          })
          segments.push({
            key: `${node.id}-rb`,
            x1: nodeCorners.br.x,
            y1: nodeCorners.br.y,
            x2: rightCorners.bl.x,
            y2: rightCorners.bl.y,
            color: node.clusterColor,
            opacity,
            width
          })
        }
      }

      if (downIndex >= 0) {
        const downNode = nodesByCell.get(downIndex)
        if (downNode) {
          const downCorners = cornersFor(downNode)
          const highlighted = node.id === selectedNodeId || downNode.id === selectedNodeId
          const opacity = highlighted ? 0.9 : 0.36
          const width = highlighted ? 2.2 : 1.35

          segments.push({
            key: `${node.id}-dl`,
            x1: nodeCorners.bl.x,
            y1: nodeCorners.bl.y,
            x2: downCorners.tl.x,
            y2: downCorners.tl.y,
            color: node.clusterColor,
            opacity,
            width
          })
          segments.push({
            key: `${node.id}-dr`,
            x1: nodeCorners.br.x,
            y1: nodeCorners.br.y,
            x2: downCorners.tr.x,
            y2: downCorners.tr.y,
            color: node.clusterColor,
            opacity,
            width
          })
        }
      }
    }

    return segments
  }, [gridLayout.cellCount, gridLayout.cols, gridLayout.rows, positionedNodes, selectedNodeId])

  return (
    <main className="desktop-shell">
      <section ref={stageRef} className="stage" aria-label="Cluster node stage">
        <P5Background />

        <div className="cluster-canvas">
          <svg className="cluster-links" width="100%" height="100%" aria-hidden="true">
            {selectedFacetFills.map((facet) => (
              <polygon
                key={facet.key}
                points={facet.points}
                fill={facet.color}
                fillOpacity={facet.opacity}
              />
            ))}
            {linkSegments.map((segment) => (
              <line
                key={segment.key}
                x1={segment.x1}
                y1={segment.y1}
                x2={segment.x2}
                y2={segment.y2}
                stroke={segment.color}
                strokeOpacity={clamp(segment.opacity, 0.12, 1)}
                strokeWidth={segment.width}
                strokeLinecap="square"
              />
            ))}
          </svg>

          {positionedNodes.map((node) => {
            const isSelected = node.id === selectedNodeId
            const glowStrength = isSelected ? 1 : 0.24
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
                  background: "#000",
                  boxShadow: "none"
                }}
              />
            )
          })}
        </div>
      </section>
    </main>
  )
}
