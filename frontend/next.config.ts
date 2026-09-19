import path from "path";
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        // Cache citizen emergency routes (SOS, Guides, Registration, Offline Chat)
        urlPattern: /\/citizen/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "sahayak-citizen-routes",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          networkTimeoutSeconds: 4,
        },
      },
      {
        // Cache static JS/CSS and fonts
        urlPattern: /\.(?:js|css|woff2?)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "sahayak-static-assets",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
      {
        // Cache images, badges, and icons
        urlPattern: /\.(?:png|jpg|jpeg|svg|webp|ico)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "sahayak-media-assets",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "stays-drivable-arrive.ngrok-free.dev",
    "*.ngrok-free.dev",
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.loca.lt",
    "*.onrender.com",
  ],
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: "/api/comms/:path*",
        destination: `${backendUrl}/api/comms/:path*`,
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

export default withPWA(nextConfig);

