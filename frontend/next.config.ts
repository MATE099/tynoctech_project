import type { NextConfig } from "next";
import { ALLOWED_IMAGE_HOSTS } from "./config/images";

const nextConfig: NextConfig = {
  // Produce a self-contained .next/standalone folder (app + only the needed
  // node_modules + a minimal server.js). This keeps the Docker image small and
  // lets us run the app without installing all dependencies again.
  output: "standalone",
  images: {
    // Allow next/image to optimize images served from these remote hosts.
    // Edit config/images.ts to add a host (e.g. your own S3 bucket).
    remotePatterns: ALLOWED_IMAGE_HOSTS.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
};

export default nextConfig;
