import fs from "node:fs/promises"
import path from "node:path"
import vm from "node:vm"

const ROOT = process.cwd()
const REGISTRY_PATH = path.join(ROOT, "lib", "appRegistry.ts")
const OUTPUT_ROOT = path.join(ROOT, "public", "node-images")
const DEFAULT_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://ipfs.io/ipfs/"
const FETCH_RETRIES = 3
const FETCH_TIMEOUT_MS = 30000

function sanitizePathName(value) {
  return value
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeGateway(gateway) {
  return gateway.endsWith("/") ? gateway : `${gateway}/`
}

function resolveImageUrl(image) {
  if (!image.startsWith("ipfs://")) {
    return image
  }
  const ipfsPath = image.replace(/^ipfs:\/\//, "")
  return `${normalizeGateway(DEFAULT_GATEWAY)}${ipfsPath}`
}

function extractObjectLiteral(source, startIndex) {
  let depth = 0
  let inString = false
  let quote = ""
  let escaped = false
  let began = false

  for (let i = startIndex; i < source.length; i += 1) {
    const ch = source[i]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === "\\") {
        escaped = true
      } else if (ch === quote) {
        inString = false
      }
      continue
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      inString = true
      quote = ch
      continue
    }

    if (ch === "{") {
      depth += 1
      began = true
      continue
    }

    if (ch === "}") {
      depth -= 1
      if (began && depth === 0) {
        return source.slice(startIndex, i + 1)
      }
    }
  }

  return null
}

function parseClustersFromRegistry(source) {
  const marker = /const\s+\w+\s*:\s*CenterDisplayCluster\s*=\s*{/g
  const clusters = []

  while (true) {
    const match = marker.exec(source)
    if (!match) break

    const objectStart = source.indexOf("{", match.index)
    if (objectStart < 0) continue

    const literal = extractObjectLiteral(source, objectStart)
    if (!literal) continue

    let cluster
    try {
      cluster = vm.runInNewContext(`(${literal})`)
    } catch {
      continue
    }

    if (cluster && typeof cluster.id === "string" && typeof cluster.name === "string" && Array.isArray(cluster.nodes)) {
      clusters.push(cluster)
    }
  }

  return clusters
}

function inferFileExtension(url, contentType) {
  const parsed = new URL(url)
  const extFromPath = path.extname(parsed.pathname)
  if (extFromPath) return extFromPath

  const type = (contentType || "").toLowerCase()
  if (type.includes("png")) return ".png"
  if (type.includes("webp")) return ".webp"
  if (type.includes("gif")) return ".gif"
  if (type.includes("jpeg") || type.includes("jpg")) return ".jpg"
  return ".img"
}

async function fetchWithRetry(url, retries = FETCH_RETRIES) {
  let lastError = null

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "user-agent": "axis-node-image-fetcher/1.0"
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      const contentType = response.headers.get("content-type") || ""
      clearTimeout(timeout)
      return { buffer, contentType }
    } catch (error) {
      clearTimeout(timeout)
      lastError = error
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 400 * attempt))
      }
    }
  }

  throw lastError ?? new Error("Fetch failed")
}

async function main() {
  const source = await fs.readFile(REGISTRY_PATH, "utf8")
  const clusters = parseClustersFromRegistry(source)

  if (clusters.length === 0) {
    console.log("No clusters found in lib/appRegistry.ts")
    return
  }

  await fs.mkdir(OUTPUT_ROOT, { recursive: true })

  let downloaded = 0
  let skipped = 0
  let failed = 0

  for (const cluster of clusters) {
    const clusterDir = path.join(OUTPUT_ROOT, sanitizePathName(cluster.name || cluster.id))
    await fs.mkdir(clusterDir, { recursive: true })

    for (const node of cluster.nodes) {
      const sourceImage = String(node.image || "")
      if (!sourceImage) continue

      const resolvedUrl = resolveImageUrl(sourceImage)
      const nodeBaseName = sanitizePathName(String(node.name || node.id || "node")) || "node"

      const existingExts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".img"]
      let existingPath = null
      for (const ext of existingExts) {
        const maybePath = path.join(clusterDir, `${nodeBaseName}${ext}`)
        try {
          await fs.access(maybePath)
          existingPath = maybePath
          break
        } catch {
          // Continue probing
        }
      }

      if (existingPath) {
        skipped += 1
        continue
      }

      try {
        const { buffer, contentType } = await fetchWithRetry(resolvedUrl)
        const ext = inferFileExtension(resolvedUrl, contentType)
        const outPath = path.join(clusterDir, `${nodeBaseName}${ext}`)
        await fs.writeFile(outPath, buffer)
        downloaded += 1
      } catch (error) {
        failed += 1
        const reason = error instanceof Error ? error.message : String(error)
        console.warn(`Failed: ${cluster.name} / ${node.name} -> ${reason}`)
      }
    }
  }

  console.log(`node-images fetch complete: downloaded=${downloaded} skipped=${skipped} failed=${failed}`)

  if (failed > 0 && process.env.STRICT_IMAGE_FETCH === "true") {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
