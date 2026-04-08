import type { NextConfig } from "next";

// Extra dev origins (e.g. ngrok tunnel). Comma-separated, hostnames only (no https://).
const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS
  ? process.env.ALLOWED_DEV_ORIGINS.split(",")
      .map((s) => s.trim().replace(/^https?:\/\//, "").replace(/\/$/, ""))
      .filter(Boolean)
  : [];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@vonage/server-sdk"],
  ...(allowedDevOrigins.length > 0 && { allowedDevOrigins }),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // required by Next.js HMR in dev
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "connect-src 'self'",
              "font-src 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
