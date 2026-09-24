import type { NextConfig } from "next";
import { ALLOWED_IMAGE_HOSTS } from "./config/images";

/**
 * Sent with every response. Each one switches off a browser behaviour that
 * attackers can abuse and that this app does not need.
 */
const SECURITY_HEADERS = [
  // Never guess a file's type: a text upload can't be run as a script.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // No other site may show our pages in an <iframe> (stops clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Other sites only learn our domain, never full URLs with ids or searches.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The shop never needs the camera, microphone or location.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Produce a self-contained .next/standalone folder (app + only the needed
  // node_modules + a minimal server.js). This keeps the Docker image small and
  // lets us run the app without installing all dependencies again.
  output: "standalone",
  // Don't advertise "X-Powered-By: Next.js" to people probing for weaknesses.
  poweredByHeader: false,
  images: {
    // Allow next/image to optimize images served from these remote hosts.
    // Edit config/images.ts to add a host (e.g. your own S3 bucket).
    remotePatterns: ALLOWED_IMAGE_HOSTS.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
