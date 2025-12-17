import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🔑 REQUIRED for Electron + static HTML
  output: "export",
  trailingSlash: true,
  // Use relative paths for assets in Electron
  assetPrefix: "./",

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "seal-app-wzqhf.ondigitalocean.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
