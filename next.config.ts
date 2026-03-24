import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["electron", "electron-updater", "@electron/notarize", "electron-builder", "mammoth", "pdfkit"],
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
