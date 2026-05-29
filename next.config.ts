import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const backend = process.env.BACKEND_URL?.trim();

const nextConfig: NextConfig = {
  images: {
    // Allow local /public images to pass through the optimizer
    localPatterns: [{ pathname: "/**" }],
    // Serve images as WebP/AVIF for faster transfers
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
