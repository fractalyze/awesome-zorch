import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The data (libraries/, benchmarks/) lives at the repo root, one level up.
  turbopack: { root: path.resolve(__dirname, "..") },
};

export default nextConfig;
