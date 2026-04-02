// desktop/preload.ts — Context bridge for TalentClaw's renderer process
//
// Exposes a minimal API to the renderer via window.talentclaw.
// All communication goes through IPC — no Node.js APIs leak to the page.

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("talentclaw", {
  /** Returns the localhost URL where the Next.js server is running */
  getServerUrl: (): Promise<string> => ipcRenderer.invoke("get-server-url"),

  /** The host platform (darwin, win32, linux) */
  platform: process.platform,

  /** Trigger a manual update check */
  checkForUpdates: (): Promise<void> => ipcRenderer.invoke("check-for-updates"),

  /** Returns the current auto-update state */
  getUpdateState: (): Promise<string> => ipcRenderer.invoke("get-update-state"),

  /** Install a downloaded update and restart */
  quitAndInstall: (): Promise<void> => ipcRenderer.invoke("quit-and-install"),

  /** Set the dock badge text (macOS only) */
  setDockBadge: (text: string): Promise<void> => ipcRenderer.invoke("set-dock-badge", text),

  /** Clear the dock badge (macOS only) */
  clearDockBadge: (): Promise<void> => ipcRenderer.invoke("clear-dock-badge"),

  /** Bounce the dock icon to get attention (macOS only) */
  bounceDock: (): Promise<void> => ipcRenderer.invoke("bounce-dock"),

  /** Splash screen: retry boot sequence */
  splashRetry: (): void => ipcRenderer.send("splash-retry"),

  /** Splash screen: quit the app */
  splashQuit: (): void => ipcRenderer.send("splash-quit"),
});
