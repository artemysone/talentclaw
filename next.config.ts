import type { NextConfig } from "next"

const isVercel = !!process.env.VERCEL

const nextConfig: NextConfig = {
  // standalone is for npm/Electron packaging — skip on Vercel
  ...(isVercel ? {} : { output: "standalone" }),
  // On Vercel, only include lightweight packages as external.
  // Desktop packages (electron, etc.) are only needed locally.
  serverExternalPackages: isVercel
    ? []
    : ["electron", "electron-updater", "@electron/notarize", "electron-builder", "mammoth", "pdfkit"],
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
