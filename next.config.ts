import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const backend = process.env.BACKEND_URL?.trim();

const nextConfig: NextConfig = {
  // Tell Next.js to transpile the local workspace package whose exports
  // point directly at TypeScript source files (no pre-build step).
  transpilePackages: ["@workspace/api-client-react"],

  // Turbopack (default bundler in Next 16) also needs to know it can
  // resolve .ts/.tsx extensions from inside node_modules for this package.
  turbopack: {
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },

  images: {
    // Allow local /public images to pass through the optimizer
    localPatterns: [{ pathname: "/**" }],
    // Serve images as WebP/AVIF for faster transfers
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
