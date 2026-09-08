import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (a stray lockfile in the home
  // directory was confusing Turbopack's auto-detection).
  turbopack: {
    root: path.join(__dirname),
  },
  // better-sqlite3 ships a native binding — it must stay a real require()
  // instead of being bundled into the server chunks.
  serverExternalPackages: ["better-sqlite3"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
