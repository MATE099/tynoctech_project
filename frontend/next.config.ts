import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained .next/standalone folder (app + only the needed
  // node_modules + a minimal server.js). This keeps the Docker image small and
  // lets us run the app without installing all dependencies again.
  output: "standalone",
  images: {
    // Allow next/image to optimize images served from these remote hosts.
    // Add more patterns here when you switch to your own images (e.g. S3).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.dummyjson.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

export default nextConfig;
