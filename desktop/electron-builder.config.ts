import type { Configuration } from "electron-builder"

const config: Configuration = {
  appId: "com.artemysone.talentclaw",
  productName: "TalentClaw",
  // electron-builder needs the main process entry point
  extends: null,
  afterSign: "./desktop/notarize.ts",
  directories: {
    buildResources: "desktop/resources",
    output: "release",
  },
  files: [
    "dist-electron/**/*",
    ".next/standalone/**/*",
    ".next/static/**/*",
    "skills/**/*",
    "persona/**/*",
    "public/**/*",
  ],
  extraResources: [
    { from: "desktop/splash.html", to: "splash.html" },
  ],
  mac: {
    target: [
      { target: "dmg", arch: ["arm64"] },
      { target: "zip", arch: ["arm64"] },
    ],
    category: "public.app-category.productivity",
    icon: "desktop/resources/icon.icns",
    darkModeSupport: true,
    hardenedRuntime: true,
    entitlements: "desktop/resources/entitlements.mac.plist",
    entitlementsInherit: "desktop/resources/entitlements.mac.plist",
  },
  dmg: {
    background: "desktop/resources/dmg-background.svg",
    window: {
      width: 660,
      height: 400,
    },
    contents: [
      { x: 130, y: 220 },
      { x: 410, y: 220, type: "link", path: "/Applications" },
    ],
  },
  publish: {
    provider: "github",
    owner: "artemysone",
    repo: "talentclaw",
  },
}

export default config
