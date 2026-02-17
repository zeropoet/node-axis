const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "node-axis";
const isGithubActions = process.env.GITHUB_ACTIONS === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  devIndicators: false,
  trailingSlash: true,
  basePath: isGithubActions ? `/${repo}` : "",
  assetPrefix: isGithubActions ? `/${repo}/` : ""
};

export default nextConfig;
