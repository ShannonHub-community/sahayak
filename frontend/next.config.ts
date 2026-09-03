import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "stays-drivable-arrive.ngrok-free.dev",
    "*.ngrok-free.dev",
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.loca.lt",
  ],
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: "/api/comms/public-feed",
        destination: `${backendUrl}/api/comms/public-feed`,
      },
      {
        source: "/api/geo/:path*",
        destination: `${backendUrl}/api/geo/:path*`,
      },
      {
        source: "/api/sos",
        destination: `${backendUrl}/api/sos`,
      },
      {
        source: "/api/citizen/:path*",
        destination: `${backendUrl}/api/citizen/:path*`,
      },
    ];
  },
};

export default nextConfig;

