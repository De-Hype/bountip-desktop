import { app, BrowserWindow, ipcMain, nativeImage } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { DatabaseService } from "./services/DatabaseService";
import { AuthService } from "./services/AuthService";
import { NetworkService } from "./services/NetworkService";
import { P2PService } from "./services/P2PService";
import { UpdateService } from "./services/UpdateService";
import { AssetService } from "./services/AssetService";
import { SyncService } from "./services/SyncService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Services
let dbService: DatabaseService;
let authService: AuthService;
let networkService: NetworkService;
let p2pService: P2PService;
let updateService: UpdateService;
let assetService: AssetService;
let syncService: SyncService;

const APP_ID = "bountip";

function generateDeviceId() {
  return "dev-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function createWindow() {
  // Try to resolve icon path
  let iconPath = path.join(__dirname, "../electron/assets/icon.png");
  if (app.isPackaged) {
    iconPath = path.join(process.resourcesPath, "assets/icon.png");
  } else {
    // In dev, __dirname is likely dist-electron, so we go up and into electron/assets
    // Or we can use process.cwd()
    iconPath = path.join(process.cwd(), "electron/assets/icon.png");
  }

  const appIcon = nativeImage.createFromPath(iconPath);

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    backgroundColor: "#ffffff",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
    icon: appIcon,
  });

  if (process.platform === "darwin") {
    app.dock.setIcon(appIcon);
  }

  win.webContents.on("render-process-gone", (_event, details) => {
    console.error("Renderer process gone:", details);
    if (app.isPackaged) {
      win.reload();
    }
  });

  win.webContents.on("did-fail-load", (_e, code, desc, url) => {
    console.error("FAILED LOAD:", code, desc, url);
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  win.once("ready-to-show", () => win.show());
}

app.whenReady().then(() => {
  dbService = new DatabaseService();
  authService = new AuthService(dbService);
  networkService = new NetworkService();
  updateService = new UpdateService();

  const identity = authService.getUser() || {};
  const deviceId = identity.deviceId || generateDeviceId();
  if (!identity.deviceId) authService.saveUser({ deviceId });

  p2pService = new P2PService(deviceId);
  p2pService.start();
  assetService = new AssetService(p2pService);
  syncService = new SyncService(dbService, networkService, p2pService);

  // IPC Handlers
  ipcMain.on("auth:storeTokens", (_event, payload) =>
    authService.storeTokens(payload)
  );
  ipcMain.on("auth:clearTokens", () => authService.clearTokens());
  ipcMain.handle("auth:getTokens", () => authService.getTokens());

  ipcMain.handle("db:getUser", () => authService.getUser());
  ipcMain.handle("db:saveUser", (_event, payload) =>
    authService.saveUser(payload)
  );

  ipcMain.handle("cache:get", (_event, key) => dbService.getCache(key));
  ipcMain.handle("cache:put", (_event, key, value) =>
    dbService.putCache(key, value)
  );

  ipcMain.handle("queue:add", (_event, op) => dbService.addToQueue(op));
  ipcMain.handle("queue:list", () => dbService.getQueue());
  ipcMain.handle("queue:clear", () => dbService.clearQueue());
  ipcMain.handle("queue:set", (_event, list) => dbService.setQueue(list));

  ipcMain.handle("network:getStatus", () => networkService.getStatus());
  ipcMain.on("network:setOnline", (_event, flag) =>
    networkService.setOnline(flag)
  );

  ipcMain.handle("p2p:getPeers", () => p2pService.getPeers());
  ipcMain.on("p2p:broadcast", (_event, payload) =>
    p2pService.broadcast(payload)
  );
  ipcMain.on("p2p:sendToPeer", (_event, deviceId, payload) =>
    p2pService.sendToPeerById(deviceId, payload)
  );

  // Updater IPC
  ipcMain.on("updater:check", () => updateService.checkForUpdates());
  ipcMain.on("updater:quitAndInstall", () => updateService.quitAndInstall());

  // Check for updates
  setTimeout(() => {
    if (app.isPackaged) {
      updateService.checkForUpdatesAndNotify();
    }
  }, 3000);

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
