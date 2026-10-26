import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the self-hosted Docker image: emits .next/standalone with a
  // minimal server.js and only the node_modules actually traced as needed.
  // Vercel does not need this; it is harmless there.
  output: "standalone",
};

export default nextConfig;
