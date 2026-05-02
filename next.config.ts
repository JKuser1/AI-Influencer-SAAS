import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const backend = process.env.BACKEND_URL?.trim();

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
