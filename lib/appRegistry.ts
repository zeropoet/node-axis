export type ClusterNode = {
  id: string
  name: string
  description: string
  image: string
}

export type CenterDisplayCluster = {
  id: string
  name: string
  nodes: ClusterNode[]
}

const DEFAULT_IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://ipfs.io/ipfs/"

export function resolveNodeImageUrl(image: string) {
  if (!image.startsWith("ipfs://")) {
    return image
  }

  const sanitizedGateway = DEFAULT_IPFS_GATEWAY.endsWith("/")
    ? DEFAULT_IPFS_GATEWAY
    : `${DEFAULT_IPFS_GATEWAY}/`
  const ipfsPath = image.replace(/^ipfs:\/\//, "")
  return `${sanitizedGateway}${ipfsPath}`
}

const PRIMARY_CENTER_CLUSTER: CenterDisplayCluster = {
  id: "the-library",
  name: "The Library",
  nodes: [
    {
      id: "the-prototype",
      name: "The Prototype",
      description: "0",
      image: "ipfs://QmT1SCspDQ4V9TkvqYPbmqCUAu5BdbQLcTRBsMrS8GuSNW/nft.jpg"
    },
    {
      id: "the-tabernacle",
      name: "The Tabernacle",
      description: "I",
      image: "ipfs://QmYkm7fDjwizB9XYu391KNVrRzAzRxYZrLLFjiwsy5JuzY/nft.jpg"
    },
    {
      id: "the-nothing",
      name: "The Nothing",
      description: "II",
      image: "ipfs://QmeMsDjcg3Sj9wXo41sfyttQcYCAJLoGi6hfxFmDELVV8J/nft.jpg"
    },
    {
      id: "hollow",
      name: "Hollow",
      description: "\u201c In emptiness, I am full. \u201d",
      image: "ipfs://QmTjDSycr1X1ms4xsZhdf7eUyH9Wi9tkqhL1pkMrZGwYpG/nft.png"
    }
  ]
}

export const DEFAULT_CENTER_DISPLAY_CLUSTER_ID = PRIMARY_CENTER_CLUSTER.id

export const CENTER_DISPLAY_CLUSTERS: CenterDisplayCluster[] = [PRIMARY_CENTER_CLUSTER]

export function getCenterDisplayCluster(clusterId: string) {
  return CENTER_DISPLAY_CLUSTERS.find((cluster) => cluster.id === clusterId) ?? PRIMARY_CENTER_CLUSTER
}
