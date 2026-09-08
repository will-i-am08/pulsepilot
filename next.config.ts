import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Neon serverless driver must run unbundled (it manages its own HTTP/WebSocket layer).
  serverExternalPackages: ["@neondatabase/serverless"],
};

export default nextConfig;
