// desktop/main.ts — Electron main process for TalentClaw macOS app
//
// Spawns the Next.js standalone server on a dynamic port, manages its
// lifecycle, and presents the web UI inside a native macOS window.

import { app, BrowserWindow, dialog, ipcMain, Menu, Notification, shell } from "electron";
import { createServer } from "net";
import { spawn, type ChildProcess } from "child_process";
import { join } from "path";
import { existsSync } from "fs";
import { randomBytes } from "crypto";
import { checkClaudeBinary, downloadClaudeBinary, ensureClaudeAuth } from "./first-run";
import { initAutoUpdater, checkForUpdatesManual, getUpdateState, quitAndInstall, teardownAutoUpdater } from "./auto-updater";
import { isServerReady } from "../lib/server-constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const APP_NAME = "TalentClaw";
const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;
const MIN_WIDTH = 800;
const MIN_HEIGHT = 600;
const SERVER_READY_TIMEOUT_MS = 15_000;
const SHUTDOWN_GRACE_MS = 2_000;
const MAX_RESTART_DELAY_MS = 10_000;
const BASE_RESTART_DELAY_MS = 500;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;
let serverPort: number = 0;
let authToken: string = "";
let isQuitting = false;
let restartAttempt = 0;
let restartTimer: ReturnType<typeof setTimeout> | null = null;

// ---------------------------------------------------------------------------
// Port allocation
// ---------------------------------------------------------------------------

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      if (addr && typeof addr === "object") {
        const port = addr.port;
        srv.close(() => resolve(port));
      } else {
        srv.close(() => reject(new Error("Failed to allocate port")));
      }
    });
    srv.on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// Splash screen
// ---------------------------------------------------------------------------

function getSplashPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, "splash.html");
  }
  return join(__dirname, "..", "desktop", "splash.html");
}

function sendSplashMessage(win: BrowserWindow, data: Record<string, unknown>): void {
  win.webContents.executeJavaScript(
    `window.postMessage(${JSON.stringify(data)}, "*")`
  ).catch(() => {});
}

// ---------------------------------------------------------------------------
// Error dialogs
// ---------------------------------------------------------------------------

async function showErrorWithRetry(
  title: string,
  message: string,
  retryFn: () => Promise<void>,
): Promise<boolean> {
  const { response } = await dialog.showMessageBox({
    type: "error",
    title,
    message,
    buttons: ["Retry", "Quit"],
    defaultId: 0,
    cancelId: 1,
  });
  if (response === 0) {
    await retryFn();
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Server lifecycle
// ---------------------------------------------------------------------------

function getProjectRoot(): string {
  if (app.isPackaged) return process.resourcesPath;
  // Dev: __dirname is dist-electron/, project root is one level up
  return join(__dirname, "..");
}

function getServerJsPath(): string {
  return join(getProjectRoot(), ".next", "standalone", "server.js");
}

function startBackendServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const serverJs = getServerJsPath();

    if (!existsSync(serverJs)) {
      reject(new Error(`Server bundle not found: ${serverJs}`));
      return;
    }

    // Spawn using Electron's bundled Node.js via ELECTRON_RUN_AS_NODE
    const child = spawn(process.execPath, [serverJs], {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        PORT: String(serverPort),
        HOSTNAME: "127.0.0.1",
        TALENTCLAW_AUTH_TOKEN: authToken,
        // Ensure Node.js mode — suppress Electron-specific behaviors
        ELECTRON_NO_ASAR: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
      cwd: join(serverJs, ".."),
    });

    serverProcess = child;
    let settled = false;

    const readyTimeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        // Assume ready after timeout (same pattern as bin/cli.ts)
        restartAttempt = 0;
        resolve();
      }
    }, SERVER_READY_TIMEOUT_MS);

    child.stdout?.on("data", (data: Buffer) => {
      if (!settled && isServerReady(data.toString())) {
        settled = true;
        clearTimeout(readyTimeout);
        restartAttempt = 0;
        resolve();
      }
    });

    child.stderr?.on("data", (data: Buffer) => {
      const text = data.toString();
      // EADDRINUSE must be caught even after the ready timeout fires,
      // since the port conflict can surface after the 15s fallback resolves.
      if (text.includes("EADDRINUSE")) {
        if (!settled) {
          settled = true;
          clearTimeout(readyTimeout);
        }
        reject(new Error(`Port ${serverPort} is already in use`));
        child.kill("SIGTERM");
        return;
      }
      // Log stderr for debugging in development
      if (!app.isPackaged) {
        process.stderr.write(`[server stderr] ${text}`);
      }
    });

    child.on("error", (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(readyTimeout);
        reject(err);
      }
    });

    child.on("exit", (code, signal) => {
      serverProcess = null;

      if (!settled) {
        settled = true;
        clearTimeout(readyTimeout);
        reject(new Error(`Server exited prematurely (code=${code}, signal=${signal})`));
        return;
      }

      // Auto-restart on unexpected exit (not during shutdown)
      if (!isQuitting && code !== 0) {
        scheduleRestart();
      }
    });
  });
}

function scheduleRestart(): void {
  const delay = Math.min(BASE_RESTART_DELAY_MS * 2 ** restartAttempt, MAX_RESTART_DELAY_MS);
  restartAttempt++;

  console.log(`[main] Server crashed. Restarting in ${delay}ms (attempt ${restartAttempt})...`);

  // Non-blocking notification instead of dialog for auto-restarts
  if (Notification.isSupported()) {
    new Notification({
      title: APP_NAME,
      body: "Server restarted",
      silent: true,
    }).show();
  }

  restartTimer = setTimeout(async () => {
    restartTimer = null;
    try {
      await startBackendServer();
      // Reload the window to reconnect
      mainWindow?.loadURL(getAppUrl());
    } catch (err) {
      console.error("[main] Restart failed:", err);
      if (!isQuitting) {
        scheduleRestart();
      }
    }
  }, delay);
}

async function stopBackendServer(): Promise<void> {
  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }

  const child = serverProcess;
  if (!child) return;

  return new Promise<void>((resolve) => {
    const forceKillTimeout = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        // already dead
      }
      resolve();
    }, SHUTDOWN_GRACE_MS);

    child.once("exit", () => {
      clearTimeout(forceKillTimeout);
      resolve();
    });

    try {
      child.kill("SIGTERM");
    } catch {
      clearTimeout(forceKillTimeout);
      resolve();
    }
  });
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

function getAppUrl(): string {
  return `http://127.0.0.1:${serverPort}/dashboard`;
}

function isAppUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "127.0.0.1" && parsed.port === String(serverPort);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    show: false,
    title: APP_NAME,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 18 },
    backgroundColor: "#0f0f0f",
    webPreferences: {
      preload: join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load splash screen immediately and show the window
  mainWindow.loadFile(getSplashPath());
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  // Always show "TalentClaw" in the title bar
  mainWindow.on("page-title-updated", (e) => {
    e.preventDefault();
  });

  // Open external links in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!isAppUrl(url)) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (e, url) => {
    if (!isAppUrl(url)) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Open DevTools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
}

/** Navigate from splash to the app URL once server is ready. */
function navigateToApp(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!mainWindow) {
      reject(new Error("No main window"));
      return;
    }
    mainWindow.webContents.once("did-finish-load", () => resolve());
    mainWindow.loadURL(getAppUrl()).catch(reject);
  });
}

// ---------------------------------------------------------------------------
// Application menu (macOS)
// ---------------------------------------------------------------------------

function buildAppMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: APP_NAME,
      submenu: [
        { role: "about", label: `About ${APP_NAME}` },
        {
          label: "Check for Updates...",
          enabled: true,
          click: () => {
            checkForUpdatesManual();
          },
        },
        { type: "separator" },
        {
          label: "Settings...",
          accelerator: "Cmd+,",
          click: () => {
            mainWindow?.loadURL(`${getAppUrl()}/settings`);
          },
        },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide", label: `Hide ${APP_NAME}` },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit", label: `Quit ${APP_NAME}` },
      ],
    },
    {
      label: "File",
      submenu: [{ role: "close" }],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        { type: "separator" },
        { role: "front" },
      ],
    },
    {
      label: "Help",
      role: "help",
      submenu: [],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ---------------------------------------------------------------------------
// First-run checks
// ---------------------------------------------------------------------------

async function ensureClaudeDeps(): Promise<boolean> {
  // Check if Claude Code binary is available
  const hasClaude = await checkClaudeBinary();

  if (!hasClaude) {
    // Attempt to download it
    try {
      await downloadClaudeBinary();
    } catch {
      // Show retry dialog instead of blocking error box
      const retried = await showErrorWithRetry(
        "Claude Code Required",
        "TalentClaw requires Claude Code to power its AI assistant.\n\n" +
          "Please install it manually:\n" +
          "  npm install -g @anthropic-ai/claude-code\n\n" +
          "Then click Retry.",
        async () => {
          const ok = await ensureClaudeDeps();
          if (!ok) app.quit();
        },
      );
      if (!retried) return false;
      return true;
    }
  }

  // Ensure the user is authenticated
  await ensureClaudeAuth();

  return true;
}

// ---------------------------------------------------------------------------
// IPC handlers
// ---------------------------------------------------------------------------

function registerIpcHandlers(): void {
  ipcMain.handle("get-server-url", () => getAppUrl());
  ipcMain.handle("get-auth-token", () => authToken);

  // Auto-updater IPC
  ipcMain.handle("check-for-updates", () => checkForUpdatesManual());
  ipcMain.handle("get-update-state", () => getUpdateState());
  ipcMain.handle("quit-and-install", () => quitAndInstall());

  // Dock badge and bounce IPC
  ipcMain.handle("set-dock-badge", (_event, text: string) => {
    if (process.platform === "darwin") app.dock?.setBadge(text);
  });
  ipcMain.handle("clear-dock-badge", () => {
    if (process.platform === "darwin") app.dock?.setBadge("");
  });
  ipcMain.handle("bounce-dock", () => {
    if (process.platform === "darwin") app.dock?.bounce("informational");
  });

  // Splash screen IPC — retry/quit from the splash error state
  ipcMain.on("splash-retry", () => {
    bootServer();
  });
  ipcMain.on("splash-quit", () => {
    app.quit();
  });
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.setName(APP_NAME);

app.on("before-quit", async (e) => {
  if (!isQuitting) {
    isQuitting = true;
    e.preventDefault();
    teardownAutoUpdater();
    await stopBackendServer();
    app.quit();
  }
});

// Standard macOS behavior: don't quit when all windows are closed
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Re-create window when dock icon is clicked (macOS)
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// Clean shutdown on signals
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    isQuitting = true;
    await stopBackendServer();
    app.quit();
  });
}

// ---------------------------------------------------------------------------
// Boot sequence — allocate port, start server, navigate to app
// ---------------------------------------------------------------------------

async function bootServer(): Promise<void> {
  // Update splash status
  if (mainWindow) {
    sendSplashMessage(mainWindow, { type: "status", text: "Allocating port\u2026" });
  }

  // Allocate a free port for the backend
  try {
    serverPort = await findFreePort();
  } catch (err) {
    if (mainWindow) {
      sendSplashMessage(mainWindow, {
        type: "error",
        title: "Startup Error",
        message: `Failed to allocate a network port:\n${err}`,
      });
    }
    return;
  }

  if (mainWindow) {
    sendSplashMessage(mainWindow, { type: "status", text: "Starting server\u2026" });
  }

  // Start the Next.js standalone server
  try {
    await startBackendServer();
  } catch (err) {
    const errorMsg = String(err);
    const isPortConflict = errorMsg.includes("already in use");

    if (isPortConflict) {
      // Port conflict — offer to try another port
      const { response } = await dialog.showMessageBox({
        type: "error",
        title: "Port Conflict",
        message: `Port ${serverPort} is already in use.`,
        buttons: ["Try Another Port", "Quit"],
        defaultId: 0,
        cancelId: 1,
      });
      if (response === 0) {
        return bootServer();
      }
      app.quit();
      return;
    }

    // General server error — show in splash
    if (mainWindow) {
      sendSplashMessage(mainWindow, {
        type: "error",
        title: "Server Error",
        message: `Failed to start the TalentClaw server:\n${err}`,
      });
    }
    return;
  }

  // Server is ready — navigate from splash to app
  try {
    await navigateToApp();
  } catch (err) {
    console.error("[main] Failed to navigate to app:", err);
  }
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

app.whenReady().then(async () => {
  // Generate auth token for server-client isolation
  authToken = randomBytes(24).toString("hex");

  // Build the macOS application menu
  buildAppMenu();

  // Register IPC handlers for the preload bridge
  registerIpcHandlers();

  // Create the window immediately — shows splash screen
  createMainWindow();

  // Wait for splash to load before sending messages to it
  if (mainWindow) {
    await new Promise<void>((resolve) => {
      mainWindow!.webContents.once("did-finish-load", () => resolve());
    });
    sendSplashMessage(mainWindow, { type: "status", text: "Checking dependencies\u2026" });
  }

  const depsOk = await ensureClaudeDeps();
  if (!depsOk) {
    app.quit();
    return;
  }

  // Boot the server (port allocation + start + navigate)
  await bootServer();

  // Set up macOS dock menu (right-click on dock icon)
  if (process.platform === "darwin") {
    app.dock?.setMenu(
      Menu.buildFromTemplate([
        { label: "Show Window", click: () => mainWindow?.show() },
        { type: "separator" },
        {
          label: "New Chat",
          click: () => mainWindow?.loadURL(`${getAppUrl()}/chat`),
        },
      ])
    );
  }

  // Initialize auto-updater (checks after 15s, then every 4h)
  initAutoUpdater();
});
