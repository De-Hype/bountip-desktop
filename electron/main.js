import { app, BrowserWindow, ipcMain, nativeImage } from "electron";
import keytar from "keytar";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dgram from "dgram";
import net from "net";

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
  } catch (e) {
    console.error("cachePut error", e);
  }
}

function queueAdd(op) {
  try {
    if (!fs.existsSync(queueFilePath)) {
      initCacheStores();
    }
    const raw = fs.readFileSync(queueFilePath, "utf-8");
    const list = JSON.parse(raw || "[]");
    list.push({ ...op, ts: Date.now() });
    fs.writeFileSync(queueFilePath, JSON.stringify(list, null, 2), "utf-8");
  } catch (e) {
    console.error("queueAdd error", e);
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

function startUdpDiscovery(deviceId) {
  udpSocket = dgram.createSocket({ type: "udp4", reuseAddr: true });

  udpSocket.on("message", (msg, rinfo) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.app !== APP_ID) return;
      if (data.deviceId === deviceId) return;
      peers.set(data.deviceId, {
        deviceId: data.deviceId,
        host: rinfo.address,
        port: data.port,
        lastSeen: Date.now(),
      });
      broadcastPeerUpdate();
    } catch {}
  });

  udpSocket.bind(MULTICAST_PORT, () => {
    try {
      udpSocket.addMembership(MULTICAST_ADDR);
    } catch (e) {
      console.error("Failed to join multicast group", e);
    }
  });

  setInterval(() => {
    const payload = Buffer.from(
      JSON.stringify({ app: APP_ID, deviceId, port: tcpPort, ts: Date.now() })
    );
    udpSocket.send(payload, 0, payload.length, MULTICAST_PORT, MULTICAST_ADDR);
  }, 5000);
}

function startTcpServer(onMessage) {
  tcpServer = net.createServer((socket) => {
    let buf = "";
    socket.on("data", (chunk) => {
      buf += chunk.toString();
    });
    socket.on("end", () => {
      try {
        const payload = JSON.parse(buf);
        onMessage(payload);
      } catch (e) {
        console.error("Invalid TCP payload", e);
      }
    });
  });

  tcpServer.listen(0, () => {
    const addr = tcpServer.address();
    tcpPort = typeof addr === "object" ? addr.port : 0;
  });
}

function sendToPeer(peer, payload) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: peer.host, port: peer.port }, () => {
      socket.write(JSON.stringify(payload));
      socket.end();
      resolve(true);
    });
    socket.on("error", reject);
  });
}

function broadcastPeerUpdate() {
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) return;
  const list = Array.from(peers.values());
  win.webContents.send("p2p:peers", list);
}

// function createWindow() {
//   const iconPath = path.resolve(__dirname, "../src/assets/LogoOne.svg");
//   const iconImage = nativeImage.createFromPath(iconPath);

//   const win = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     show: false,
//     backgroundColor: "#ffffff",
//     webPreferences: {
//       nodeIntegration: false,
//       contextIsolation: true,
//       preload: path.resolve(__dirname, "preload.js"),
//     },
//     icon: iconPath,
//   });

//   if (!app.isPackaged) {
//     win.loadURL("http://localhost:3005");
//     win.webContents.openDevTools();
//   } else {
//     const indexPath = path.join(__dirname, "..", "out", "index.html");
//     win.loadFile(indexPath);
//   }

//   if (process.platform === "darwin" && !iconImage.isEmpty()) {
//     app.dock.setIcon(iconImage);
//   }

//   win.once("ready-to-show", () => {
//     win.show();
//   });
// }

function createWindow() {
  const iconPath = path.join(__dirname, "assets", "icon.png");

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
    icon: iconPath,
  });

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
    win.loadURL("http://localhost:3005");
    win.webContents.openDevTools();
  } else {
    const appPath = app.getAppPath();
    win.loadFile(path.join(appPath, "out", "index.html"));
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

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
