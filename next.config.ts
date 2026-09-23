import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (a stray lockfile in the home
  // directory was confusing Turbopack's auto-detection).
  turbopack: {
    root: path.join(__dirname),
  },
  // The libSQL client resolves a native binding for local file databases; it
  // must stay a real require() rather than be bundled into the server chunks.
  serverExternalPackages: ["@libsql/client"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
