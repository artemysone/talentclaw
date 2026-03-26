import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // standalone is for npm/Electron packaging — skip on Vercel to avoid function size bloat
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  serverExternalPackages: ["electron", "electron-updater", "@electron/notarize", "electron-builder", "mammoth", "pdfkit"],
  turbopack: {},
  webpack: (config) => {
    // Prevent webpack from trying to bundle/hash Electron native modules
    config.externals = [
      ...(Array.isArray(config.externals) ? config.externals : config.externals ? [config.externals] : []),
      "electron",
      "electron-updater",
      "@electron/notarize",
    ]
    return config
  },
}

export default nextConfig
