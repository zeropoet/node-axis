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
  initialFaceCount?: number
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

const THE_ARCHIVE_CLUSTER: CenterDisplayCluster = {
  id: "the-archive",
  name: "The Archive",
  initialFaceCount: 50,
  nodes: [
    {
      id: "0_000_001",
      name: "0_000_001",
      description: "",
      image: "ipfs://QmX1xRELudiqpmsLkAwTHTrFXW3Z95ZRNTzrF9Tn9VcbJS/nft.jpg"
    },
    {
      id: "0_000_002",
      name: "0_000_002",
      description: "",
      image: "ipfs://QmVSHdQaVUdYUBeMYRmCC9tpR2fqzmDEqW6cxBUmXWMi9R/nft.jpg"
    },
    {
      id: "0_000_003",
      name: "0_000_003",
      description: "",
      image: "ipfs://QmZHE8Bzhqn1JpsHVRE3YYq3G17Bd1jN5HwBUhofcBrDJr/nft.jpg"
    },
    {
      id: "0_000_004",
      name: "0_000_004",
      description: "",
      image: "ipfs://QmecfikgZCcpbzXuYRaVyeXTvpAaSX1nNcW838t5nh1zVC/nft.jpg"
    },
    {
      id: "0_000_005",
      name: "0_000_005",
      description: "",
      image: "ipfs://QmTTb7jwpR3JrUFZzaXvs6b8votqCg7ZcFnu1km5W62nZr/nft.jpg"
    },
    {
      id: "0_000_006",
      name: "0_000_006",
      description: "",
      image: "ipfs://QmUhrnExnX69jmF1LuyiUembmhGZK4dPB3KSYq2HpJEBp8/nft.jpg"
    },
    {
      id: "0_000_007",
      name: "0_000_007",
      description: "",
      image: "ipfs://QmVjsQLKBNDwVL7pyW9TVKDLASf9Zbnqz4sE4dg43SLWh6/nft.jpg"
    },
    {
      id: "0_000_008",
      name: "0_000_008",
      description: "",
      image: "ipfs://QmTL7A8gvvRYZqTyGBvE6EzBcpjwYYZHiX5oKvayH7zGLL/nft.jpg"
    },
    {
      id: "0_000_009",
      name: "0_000_009",
      description: "",
      image: "ipfs://QmfFqFFMmexaLBndLK92Ad8JcKJdmM54178K7mJKCVsn8P/nft.jpg"
    },
    {
      id: "0_000_010",
      name: "0_000_010",
      description: "",
      image: "ipfs://QmbZyfm8cUh8FCFkmKc3WSbgMAhZVV7oKYRm2ACazq7Ff7/nft.jpg"
    },
    {
      id: "0_000_011",
      name: "0_000_011",
      description: "",
      image: "ipfs://QmaesFqP2tNGsyNNtQRDujfghokJcmB9Gdgt2MvjCMdBtH/nft.jpg"
    },
    {
      id: "0_000_012",
      name: "0_000_012",
      description: "",
      image: "ipfs://Qmct99U7VjDiSWY66LqB8y9PN7feEaqdgaeXdctGtWuN12/nft.jpg"
    },
    {
      id: "0_000_013",
      name: "0_000_013",
      description: "",
      image: "ipfs://QmbSRjdp5T27DPnjDVZj7rd2b9iYEbVEsgKm4GfcMXLBG9/nft.jpg"
    },
    {
      id: "0_000_014",
      name: "0_000_014",
      description: "",
      image: "ipfs://QmdENJY4dndGQaVFwiJEjc6hiCdWzC7aESNtU7Xyra5HtJ/nft.jpg"
    },
    {
      id: "0_000_015",
      name: "0_000_015",
      description: "",
      image: "ipfs://QmTpek81W25e5WhPv3tZshnuxN6dUgDqd5v3xTJZnje12t/nft.jpg"
    },
    {
      id: "0_000_016",
      name: "0_000_016",
      description: "",
      image: "ipfs://QmbpDj5UDPonuWijc1cMKXzQ5CcchzGntmc6vyKnDNJ2ea/nft.jpg"
    },
    {
      id: "0_000_017",
      name: "0_000_017",
      description: "",
      image: "ipfs://QmQ9LfK1cMjeRid8jajJ5kFnREN5RsVaRwM1f9DQf6L4Rz/nft.jpg"
    },
    {
      id: "0_000_018",
      name: "0_000_018",
      description: "",
      image: "ipfs://QmScgtGKKW6wGA8rHgMPdRWcf1mmF83SwPdv1XLh336YpF/nft.jpg"
    },
    {
      id: "0_000_019",
      name: "0_000_019",
      description: "",
      image: "ipfs://QmNtRvaice6AoJEf1nV4aWqSYNKLU2GuxQ4jtV5TTDuHYS/nft.jpg"
    },
    {
      id: "0_000_020",
      name: "0_000_020",
      description: "",
      image: "ipfs://QmTkY4qdDGVr8WTYrtq1YaJM9MRqyXoQCtvrqoAaK8T2au/nft.jpg"
    },
    {
      id: "0_000_021",
      name: "0_000_021",
      description: "",
      image: "ipfs://QmQWp18Han8cb19fn4dXAfkHLHdS6DHPCPJttweERAY6iF/nft.jpg"
    },
    {
      id: "0_000_022",
      name: "0_000_022",
      description: "",
      image: "ipfs://QmQ9RrQpqT4iKgi8Uxyx15mb8rzgaBDXuF5DxCX4BjbE25/nft.jpg"
    },
    {
      id: "0_000_023",
      name: "0_000_023",
      description: "",
      image: "ipfs://QmRq4LNYtj9u2bwn6JzTVkayhWeh1pdrKx1GXUuvfD3jCj/nft.jpg"
    },
    {
      id: "0_000_024",
      name: "0_000_024",
      description: "",
      image: "ipfs://QmeRC6qP1XYXQvEo2vh5oXiXMgWZgSNvDbwqKGxzGSXVwR/nft.jpg"
    },
    {
      id: "0_000_025",
      name: "0_000_025",
      description: "",
      image: "ipfs://QmdW9ifHyGufzadiNZtTY3GhWQh7nbBbHWd6X7tv35DHR4/nft.jpg"
    },
    {
      id: "0_000_026",
      name: "0_000_026",
      description: "",
      image: "ipfs://QmYr8Tyn27BtX8mnk4v9DfKGRxJCK4HTApkSCvDfRAk8NV/nft.jpg"
    },
    {
      id: "0_000_027",
      name: "0_000_027",
      description: "",
      image: "ipfs://QmdWGsE4qeD8A2eLWFaQYGGM85YD7rHPJfcufxC1eGS6su/nft.jpg"
    },
    {
      id: "0_000_028",
      name: "0_000_028",
      description: "",
      image: "ipfs://QmWGUoGaXrzEjJgaX59e552HKtDFbiEUc3UEjHwaGd98G1/nft.jpg"
    },
    {
      id: "0_000_029",
      name: "0_000_029",
      description: "",
      image: "ipfs://QmQRGGkjssMsFMUABb48zhk6hSwQw8vLg1URPPtmVgcNwY/nft.jpg"
    },
    {
      id: "0_000_030",
      name: "0_000_030",
      description: "",
      image: "ipfs://QmT7e9XsKzraSWLBenjHUDJJf97miY7ixMcmR48GLS1jBa/nft.jpg"
    },
    {
      id: "0_000_031",
      name: "0_000_031",
      description: "",
      image: "ipfs://QmZhVSe3QsExehTx1Lmf9dwLCpsaHJj5oK4qSHB6zSpNfr/nft.jpg"
    },
    {
      id: "0_000_032",
      name: "0_000_032",
      description: "",
      image: "ipfs://QmUk1mVmn9uRW2gbiWrGXErxJGrX1qXkwvStB3vVP55aPm/nft.jpg"
    },
    {
      id: "0_000_033",
      name: "0_000_033",
      description: "",
      image: "ipfs://QmSa7Q8QZvFgKNL684hytj4SfuPrnNbGwhfUDCqfaFT8iz/nft.jpg"
    },
    {
      id: "0_000_034",
      name: "0_000_034",
      description: "",
      image: "ipfs://QmU1vVAGP2auXJZagZferAFVWZ8JApS8ooe6FQtb9ecvvv/nft.jpg"
    },
    {
      id: "0_000_035",
      name: "0_000_035",
      description: "",
      image: "ipfs://QmUBnUvKbTdCPDtcz5z2SNYXJMqw4naesZZLkFaW2yYy4j/nft.jpg"
    },
    {
      id: "0_000_036",
      name: "0_000_036",
      description: "",
      image: "ipfs://QmWMzoHUApFdXUzfAEYfyzz54TLVMtcZdraEwkoSkXTxhg/nft.jpg"
    },
    {
      id: "0_000_037",
      name: "0_000_037",
      description: "",
      image: "ipfs://QmbDRDUWMmio8tgqMUzHMKrYZsr5kN93nFKsLoaxkQPUfr/nft.jpg"
    },
    {
      id: "0_000_038",
      name: "0_000_038",
      description: "",
      image: "ipfs://QmUsspPbHCtEGrb2Af1xBW4anW9bNetdcDhWtv3tpUv2Gi/nft.jpg"
    },
    {
      id: "0_000_039",
      name: "0_000_039",
      description: "",
      image: "ipfs://QmcytEvbEGUxqVjn4494MQfW8nvRTqFUJbHZtsL5PS3XgD/nft.jpg"
    },
    {
      id: "0_000_040",
      name: "0_000_040",
      description: "",
      image: "ipfs://QmZw3KWj2t1U6wH3UKg2wtii5eidkW8XY15H3wjLpi4keB/nft.jpg"
    },
    {
      id: "0_000_041",
      name: "0_000_041",
      description: "",
      image: "ipfs://QmSps68t8GpGDGzDors4wFonQhMRf48oG5jSK751Amsr9j/nft.jpg"
    },
    {
      id: "0_000_042",
      name: "0_000_042",
      description: "",
      image: "ipfs://Qme2H2YKHf6fZFKmqyc1EGA4oBdjRzvrQCGZ96BvdiUfaV/nft.jpg"
    },
    {
      id: "0_000_043",
      name: "0_000_043",
      description: "",
      image: "ipfs://QmY4rTd7aSixH8Y5Q12BhxyFZ5wdFF2UPYxMCzyuXo6Ddp/nft.jpg"
    },
    {
      id: "0_000_044",
      name: "0_000_044",
      description: "",
      image: "ipfs://QmNqKCohnoQfTGtvuveaqD3jxKiSwhXpZxJNhQaVjcjPSY/nft.jpg"
    },
    {
      id: "0_000_045",
      name: "0_000_045",
      description: "",
      image: "ipfs://QmVazeRgfgCj5oDc28PSbHpYSfKTsia14tS2xy46bpJZCE/nft.jpg"
    },
    {
      id: "0_000_046",
      name: "0_000_046",
      description: "",
      image: "ipfs://QmfJMkjb4zp1HNduRuuPbSXeMckWuqqob6a6h1ZS6k88C8/nft.jpg"
    },
    {
      id: "0_000_047",
      name: "0_000_047",
      description: "",
      image: "ipfs://QmU3Wt97mFYvRiusPMN7GTLpRhc1vgkFSdYM6ZbbZL4NFp/nft.jpg"
    },
    {
      id: "0_000_048",
      name: "0_000_048",
      description: "",
      image: "ipfs://Qme1HBUHXZcCaSoy74QgQaSXaQH6Xho9u7V3LvBKPNBfDu/nft.jpg"
    },
    {
      id: "0_000_049",
      name: "0_000_049",
      description: "",
      image: "ipfs://Qmc3BWXaL93Jk7kTJYXY5Bj9nwLazmA86rCbwhPULAwPkn/nft.jpg"
    },
    {
      id: "0_000_050",
      name: "0_000_050",
      description: "",
      image: "ipfs://QmNwKD1fCvHw5fPHscH661DYnbKqVDpDmE2SQ19MRgbnhd/nft.jpg"
    }
  ]
}

const THE_STACKS_CLUSTER: CenterDisplayCluster = {
  id: "the-stacks",
  name: "The Stacks",
  nodes: [
    {
      id: "191",
      name: "191",
      description: "",
      image: "ipfs://QmXP2QuwZEW781uSBZ5E1ZD919YwxgosAfTyoetwVvMi36/nft.jpg"
    },
    {
      id: "192",
      name: "192",
      description: "",
      image: "ipfs://Qmdd8TmtgQkgZh4HCCoaCHigeNJqDYP1KAmYEeQjtewDJf/nft.jpg"
    },
    {
      id: "194",
      name: "194",
      description: "",
      image: "ipfs://QmR79zvCvKYqBKNYcnp8vJj4CdmfwMbwR7hNRozqSJyCC5/nft.jpg"
    },
    {
      id: "196",
      name: "196",
      description: "",
      image: "ipfs://QmSTXdiJnPG7s6fWiz7M15EhMNBGDGCWU47e9idDstS3Vf/nft.jpg"
    },
    {
      id: "197",
      name: "197",
      description: "",
      image: "ipfs://QmbNQc132c3jXfXXu17XWyoezuLEmCasK4WSttEx2R4f2p/nft.jpg"
    },
    {
      id: "198",
      name: "198",
      description: "",
      image: "ipfs://QmX6TdpEfwMxpFdSuHFCoqE4rZxHatqWrEenh3UYbD5Liw/nft.jpg"
    },
    {
      id: "199",
      name: "199",
      description: "",
      image: "ipfs://QmYVB8ToRsKMDQYGap7WMHEmHbfh9moLeayjpFf3UNjRKw/nft.jpg"
    },
    {
      id: "201",
      name: "201",
      description: "",
      image: "ipfs://QmSYtuAczAb6tStsQ1qaswJQnJfjRpMT8eWJb2UicrNVVa/nft.jpg"
    },
    {
      id: "202",
      name: "202",
      description: "",
      image: "ipfs://QmVYo9o8traRVeaDtFEManhcznpBZjuc3wF8Ezue16FVw1/nft.jpg"
    },
    {
      id: "210",
      name: "210",
      description: "",
      image: "ipfs://QmYodx8rT9fQz4VGWVhQz6FtRK86cNBgoWuW1FQbBi6Ffj/nft.jpg"
    }
  ]
}

const THE_SOMETHING_CLUSTER: CenterDisplayCluster = {
  id: "the-something",
  name: "The Something",
  nodes: [
    {
      id: "cognitive-singularity",
      name: "Cognitive Singularity",
      description: "The precise point where thought collapses into understanding.",
      image: "ipfs://QmZz692JSnu9e3WvM3Vo4cPDmoeG9hd9UyyZMuQ9Y8cUuo/nft.png"
    },
    {
      id: "nakamoto-satoshi",
      name: "Nakamoto ][ Satoshi",
      description: "",
      image: "ipfs://QmeodBdcVh4Cr2z2tJFjLLQ1ysjiVKWnpUT5xVv8wdvT8V/nft.jpg"
    }
  ]
}

export const DEFAULT_CENTER_DISPLAY_CLUSTER_ID = PRIMARY_CENTER_CLUSTER.id

export const CENTER_DISPLAY_CLUSTERS: CenterDisplayCluster[] = [
  PRIMARY_CENTER_CLUSTER,
  THE_ARCHIVE_CLUSTER,
  THE_STACKS_CLUSTER,
  THE_SOMETHING_CLUSTER
]

export function getCenterDisplayCluster(clusterId: string) {
  return CENTER_DISPLAY_CLUSTERS.find((cluster) => cluster.id === clusterId) ?? PRIMARY_CENTER_CLUSTER
}
