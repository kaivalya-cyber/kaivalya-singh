import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root — stray lockfiles outside the project make Next
  // infer the wrong root, which breaks module resolution.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
