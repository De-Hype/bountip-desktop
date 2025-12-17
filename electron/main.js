import { app, BrowserWindow, ipcMain, nativeImage } from "electron";
import pkg from 'electron-updater';
import log from "electron-log";
import keytar from "keytar";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dgram from "dgram";
import net from "net";

const { autoUpdater } = pkg;

const SERVICE_NAME = "bountip-desktop";
const ACCOUNT_NAME = "auth-tokens";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let identityFilePath = "";
let cacheFilePath = "";
let queueFilePath = "";
let online = true;
const APP_ID = "bountip";

const MULTICAST_ADDR = "239.192.0.1";
const MULTICAST_PORT = 45454;
let tcpPort = 0;
let udpSocket = null;
let tcpServer = null;
const peers = new Map();

// --- Auto-Updater Configuration ---
log.transports.file.level = "info";
autoUpdater.logger = log;

function sendStatusToWindow(text) {
  log.info(text);
  const win = BrowserWindow.getAllWindows()[0];
  if (win) win.webContents.send('updater:status', text);
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
});
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available.');
  const win = BrowserWindow.getAllWindows()[0];
  if (win) win.webContents.send('updater:update-available', info);
});
autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.');
  const win = BrowserWindow.getAllWindows()[0];
  if (win) win.webContents.send('updater:update-not-available', info);
});
autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
  const win = BrowserWindow.getAllWindows()[0];
  if (win) win.webContents.send('updater:error', err.toString());
});
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
});
autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded');
  const win = BrowserWindow.getAllWindows()[0];
  if (win) win.webContents.send('updater:update-downloaded', info);
});
// ----------------------------------

function initIdentityStore() {
  identityFilePath = path.join(app.getPath("userData"), "identity.json");
  try {
    const dir = path.dirname(identityFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(identityFilePath)) {
      const initial = { deviceId: generateDeviceId(), app: APP_ID };
      fs.writeFileSync(identityFilePath, JSON.stringify(initial, null, 2), "utf-8");
    }
  } catch (error) {
    console.error("Failed to initialize identity store", error);
  }
}

function readIdentity() {
  try {
    const raw = fs.readFileSync(identityFilePath, "utf-8");
    const json = JSON.parse(raw || "{}");
    return json && Object.keys(json).length > 0 ? json : null;
  } catch (error) {
    console.error("Failed to read identity", error);
    return null;
  }
}

function writeIdentity(payload) {
  try {
    const current = readIdentity() || {};
    const updated = { ...current, ...payload };
    fs.writeFileSync(identityFilePath, JSON.stringify(updated, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write identity", error);
  }
}

function generateDeviceId() {
  return "dev-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function initCacheStores() {
  cacheFilePath = path.join(app.getPath("userData"), "cache.json");
  queueFilePath = path.join(app.getPath("userData"), "sync-queue.json");
  try {
    const dir = path.dirname(cacheFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(cacheFilePath)) fs.writeFileSync(cacheFilePath, JSON.stringify({}, null, 2), "utf-8");
    if (!fs.existsSync(queueFilePath)) fs.writeFileSync(queueFilePath, JSON.stringify([], null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to initialize cache stores", error);
  }
}

function cacheGet(key) {
  try {
    if (!fs.existsSync(cacheFilePath)) {
      initCacheStores();
    }
    const raw = fs.readFileSync(cacheFilePath, "utf-8");
    const json = JSON.parse(raw || "{}");
    return json[key] ?? null;
  } catch {
    return null;
  }
}

function cachePut(key, value) {
  try {
    if (!fs.existsSync(cacheFilePath)) {
      initCacheStores();
    }
    const raw = fs.readFileSync(cacheFilePath, "utf-8");
    const json = JSON.parse(raw || "{}");
    json[key] = value;
    fs.writeFileSync(cacheFilePath, JSON.stringify(json, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to put cache", error);
  }
}

function queueAdd(op) {
  try {
    if (!fs.existsSync(queueFilePath)) {
      initCacheStores();
    }
    const raw = fs.readFileSync(queueFilePath, "utf-8");
    const list = JSON.parse(raw || "[]");
    list.push(op);
    fs.writeFileSync(queueFilePath, JSON.stringify(list, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Failed to add queue", error);
    return false;
  }
}

function queueList() {
  try {
    if (!fs.existsSync(queueFilePath)) {
      initCacheStores();
    }
    const raw = fs.readFileSync(queueFilePath, "utf-8");
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

function startTcpServer(onMessage) {
  tcpServer = net.createServer((socket) => {
    socket.on("data", (data) => {
      try {
        const str = data.toString();
        const json = JSON.parse(str);
        if (json.app === APP_ID && json.payload) {
          onMessage(json.payload);
        }
      } catch {}
    });
  });

  tcpServer.listen(0, () => {
    tcpPort = tcpServer.address().port;
  });
}

function startUdpDiscovery(deviceId) {
  udpSocket = dgram.createSocket({ type: "udp4", reuseAddr: true });

  udpSocket.on("message", (msg, rinfo) => {
    try {
      const json = JSON.parse(msg.toString());
      if (json.app === APP_ID && json.deviceId !== deviceId) {
        if (!peers.has(json.deviceId)) {
          peers.set(json.deviceId, { ip: rinfo.address, port: json.tcpPort });
        }
      }
    } catch {}
  });

  udpSocket.bind(MULTICAST_PORT, () => {
    udpSocket.addMembership(MULTICAST_ADDR);
    udpSocket.setMulticastLoopback(true);
  });

  setInterval(() => {
    const msg = JSON.stringify({
      app: APP_ID,
      deviceId,
      tcpPort,
    });
    udpSocket.send(msg, MULTICAST_PORT, MULTICAST_ADDR);
  }, 3000);
}

function sendToPeer(peer, data) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    client.connect(peer.port, peer.ip, () => {
      client.write(JSON.stringify(data));
      client.end();
      resolve();
    });
    client.on("error", reject);
  });
}

function createWindow() {
  const iconPath = path.join(__dirname, "assets", "icon.png");
  const appIcon = nativeImage.createFromPath(iconPath);

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    backgroundColor: "#ffffff",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: appIcon,
  });

  if (process.platform === 'darwin') {
    app.dock.setIcon(appIcon);
  }

  // 🔥 ADD THIS BLOCK (CRITICAL)
  win.webContents.on("render-process-gone", (_event, details) => {
    console.error("Renderer process gone:", details);
    if (app.isPackaged) {
      win.reload();
    }
  });

  win.webContents.on("did-fail-load", (_e, code, desc, url) => {
    console.error("FAILED LOAD:", code, desc, url);
  });

  if (!app.isPackaged) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    // In production, load the file directly from the dist folder
    // When using file:// protocol, path.join resolves to an absolute file path
    // which Electron's loadFile handles correctly.
    // Ensure we are pointing to the correct index.html inside the packaged app
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  win.once("ready-to-show", () => win.show());
}



app.whenReady().then(() => {
  initIdentityStore();
  initCacheStores();

  const identity = readIdentity() || {};
  const deviceId = identity.deviceId || generateDeviceId();
  if (!identity.deviceId) writeIdentity({ deviceId });

  startTcpServer((payload) => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) win.webContents.send("p2p:message", payload);
  });
  startUdpDiscovery(deviceId);

  ipcMain.on("auth:storeTokens", async (_event, payload) => {
    try {
      const serialized = JSON.stringify(payload);
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, serialized);
    } catch (error) {
      console.error("Failed to store tokens in keytar", error);
    }
  });

  ipcMain.on("auth:clearTokens", async () => {
    try {
      await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
    } catch (error) {
      console.error("Failed to clear tokens in keytar", error);
    }
  });

  ipcMain.handle("auth:getTokens", async () => {
    try {
      const serialized = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
      if (!serialized) return null;
      return JSON.parse(serialized);
    } catch (error) {
      console.error("Failed to read tokens from keytar", error);
      return null;
    }
  });

  ipcMain.handle("db:getUser", async () => {
    return readIdentity();
  });

  ipcMain.handle("db:saveUser", async (_event, payload) => {
    writeIdentity(payload);
  });

  ipcMain.handle("cache:get", async (_event, key) => cacheGet(key));
  ipcMain.handle("cache:put", async (_event, key, value) => cachePut(key, value));
  ipcMain.handle("queue:add", async (_event, op) => queueAdd(op));
  ipcMain.handle("queue:list", async () => queueList());
  ipcMain.handle("queue:clear", async () => {
    try {
      fs.writeFileSync(queueFilePath, JSON.stringify([], null, 2), "utf-8");
      return true;
    } catch (e) {
      console.error("queue:clear error", e);
      return false;
    }
  });
  ipcMain.handle("queue:set", async (_event, list) => {
    try {
      fs.writeFileSync(queueFilePath, JSON.stringify(list || [], null, 2), "utf-8");
      return true;
    } catch (e) {
      console.error("queue:set error", e);
      return false;
    }
  });

  ipcMain.handle("network:getStatus", async () => ({ online }));
  ipcMain.on("network:setOnline", (_event, flag) => {
    online = !!flag;
    const win = BrowserWindow.getAllWindows()[0];
    if (win) win.webContents.send("network:status", { online });
  });

  ipcMain.handle("p2p:getPeers", async () => Array.from(peers.values()));
  ipcMain.on("p2p:broadcast", async (_event, payload) => {
    const list = Array.from(peers.values());
    for (const p of list) {
      try {
        await sendToPeer(p, { app: APP_ID, payload });
      } catch {}
    }
  });
  ipcMain.on("p2p:sendToPeer", async (_event, deviceId, payload) => {
    const p = peers.get(deviceId);
    if (!p) return;
    try {
      await sendToPeer(p, { app: APP_ID, payload });
    } catch (e) {
      console.error("sendToPeer error", e);
    }
  });

  // --- Auto-Updater IPC ---
  ipcMain.on('updater:check', () => {
    autoUpdater.checkForUpdates();
  });

  ipcMain.on('updater:quitAndInstall', () => {
    autoUpdater.quitAndInstall();
  });

  // Check for updates after startup (only in production)
  setTimeout(() => {
    if (app.isPackaged) {
      autoUpdater.checkForUpdatesAndNotify();
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
