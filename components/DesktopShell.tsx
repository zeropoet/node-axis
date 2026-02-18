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
  phase: number
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

const CLUSTER_COLORS = ["#ff2d55", "#00c2ff", "#00e08a", "#ff8a00", "#7a5cff", "#ffd400", "#ff4fd8"]

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

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "")
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((ch) => `${ch}${ch}`)
          .join("")
      : normalized
  const r = Number.parseInt(expanded.slice(0, 2), 16)
  const g = Number.parseInt(expanded.slice(2, 4), 16)
  const b = Number.parseInt(expanded.slice(4, 6), 16)
  const safe = Number.isFinite(alpha) ? clamp(alpha, 0, 1) : 1
  return `rgba(${r}, ${g}, ${b}, ${safe})`
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
  const pointerRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, active: false })
  const pointerTargetRef = useRef({ x: 0, y: 0, active: false })
  const frameRef = useRef(0)

  const [stageSize, setStageSize] = useState({ width: 1280, height: 720 })
  const [imageRatios, setImageRatios] = useState<Record<string, number>>({})
  const [motionTick, setMotionTick] = useState(0)

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
          clusterColor: color,
          phase: hashToUnit(`${cluster.id}:${node.id}`) * Math.PI * 2
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

  useEffect(() => {
    const el = stageRef.current
    if (!el) return

    function updateTarget(clientX: number, clientY: number, active: boolean) {
      const rect = stageRef.current?.getBoundingClientRect()
      if (!rect) return
      pointerTargetRef.current.x = clientX - rect.left
      pointerTargetRef.current.y = clientY - rect.top
      pointerTargetRef.current.active = active
    }

    const onMouseMove = (event: MouseEvent) => updateTarget(event.clientX, event.clientY, true)
    const onMouseEnter = (event: MouseEvent) => updateTarget(event.clientX, event.clientY, true)
    const onMouseLeave = () => {
      pointerTargetRef.current.active = false
    }
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) return
      updateTarget(touch.clientX, touch.clientY, true)
    }
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) return
      updateTarget(touch.clientX, touch.clientY, true)
    }
    const onTouchEnd = () => {
      pointerTargetRef.current.active = false
    }

    el.addEventListener("mousemove", onMouseMove)
    el.addEventListener("mouseenter", onMouseEnter)
    el.addEventListener("mouseleave", onMouseLeave)
    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchmove", onTouchMove, { passive: true })
    el.addEventListener("touchend", onTouchEnd)

    return () => {
      el.removeEventListener("mousemove", onMouseMove)
      el.removeEventListener("mouseenter", onMouseEnter)
      el.removeEventListener("mouseleave", onMouseLeave)
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("touchend", onTouchEnd)
    }
  }, [])

  useEffect(() => {
    let rafId = 0
    let mounted = true

    const animate = () => {
      const target = pointerTargetRef.current
      const current = pointerRef.current
      const nextX = current.x + (target.x - current.x) * 0.16
      const nextY = current.y + (target.y - current.y) * 0.16
      current.vx = (nextX - current.x) * 0.92
      current.vy = (nextY - current.y) * 0.92
      current.x = nextX
      current.y = nextY
      current.active = target.active

      frameRef.current += 1
      if (mounted) setMotionTick((tick) => tick + 1)
      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)
    return () => {
      mounted = false
      cancelAnimationFrame(rafId)
    }
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
    const height = Math.max(120, Math.round(maxHeight))
    const width = clamp(Math.round(height * ratio), 120, maxWidth)

    return {
      width,
      height
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

  const animatedNodes = useMemo(() => {
    const pointer = pointerRef.current
    const t = frameRef.current * 0.016
    const influenceRadius = Math.min(stageSize.width, stageSize.height) * 0.34
    const pointerVelocityGain = 10
    const pointerPullGain = 16
    const pointerTwistGain = 7

    return positionedNodes.map((node) => {
      const centerX = node.x + node.size * 0.5
      const centerY = node.y + node.size * 0.5
      const dx = centerX - pointer.x
      const dy = centerY - pointer.y
      const distance = Math.hypot(dx, dy) || 1
      const rawInfluence = clamp(1 - distance / Math.max(1, influenceRadius), 0, 1)
      const pointerInfluence = pointer.active ? rawInfluence * rawInfluence : 0
      const pullX = (-dx / distance) * pointerInfluence * pointerPullGain
      const pullY = (-dy / distance) * pointerInfluence * pointerPullGain
      const sweepX = pointer.vx * pointerInfluence * pointerVelocityGain
      const sweepY = pointer.vy * pointerInfluence * pointerVelocityGain

      const waveX = Math.sin(t * 1.2 + node.phase) * 2.4
      const waveY = Math.cos(t * 1.5 + node.phase * 0.78) * 2
      const tx = waveX + pullX + sweepX
      const ty = waveY + pullY + sweepY
      const rot = Math.sin(t * 1.8 + node.phase) * 1.25 + pointerInfluence * pointerTwistGain
      const scale = 1 + Math.sin(t * 2.1 + node.phase) * 0.02 + pointerInfluence * 0.1

      return {
        ...node,
        axisTx: tx,
        axisTy: ty,
        axisRot: rot,
        axisScale: scale,
        pointerInfluence
      }
    })
  }, [motionTick, positionedNodes, stageSize.height, stageSize.width])

  return (
    <main className="desktop-shell">
      <section ref={stageRef} className="stage" aria-label="Cluster node stage">
        <P5Background />

        <div className="cluster-canvas">
          {animatedNodes
            .filter((node) => !intersectsRect(node.x, node.y, node.size, reservedDisplayRect, 4))
            .map((node) => {
            const isSelected = node.id === selectedNode?.id
            const glowStrength = isSelected ? 1 : node.pointerInfluence
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
                  background: isSelected ? "#fff" : node.clusterColor,
                  transform: `translate3d(${node.axisTx.toFixed(2)}px, ${node.axisTy.toFixed(2)}px, 0) rotate(${node.axisRot.toFixed(2)}deg) scale(${node.axisScale.toFixed(3)})`,
                  boxShadow: `0 0 ${Math.round(4 + glowStrength * 18)}px ${hexToRgba(node.clusterColor, 0.16 + glowStrength * 0.42)}`
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
