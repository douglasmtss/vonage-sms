import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@vonage/server-sdk"],
  allowedDevOrigins: ["baculiform-imogene-expressive.ngrok-free.dev"],
};

export default nextConfig;
