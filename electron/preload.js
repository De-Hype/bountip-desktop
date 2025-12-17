console.log("🔥 PRELOAD LOADED!");

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  storeTokens: (payload) => ipcRenderer.send("auth:storeTokens", payload),
  clearTokens: () => ipcRenderer.send("auth:clearTokens"),
  getTokens: async () => {
    try {
      return await ipcRenderer.invoke("auth:getTokens");
    } catch (error) {
      console.error("getTokens error:", error);
      return null;
    }
  },
  saveUser: async (user) => {
    try {
      return await ipcRenderer.invoke("db:saveUser", user);
    } catch (error) {
      console.error("saveUser error:", error);
    }
  },
  getUser: async () => {
    try {
      return await ipcRenderer.invoke("db:getUser");
    } catch (error) {
      console.error("getUser error:", error);
      return null;
    }
  },
  getNetworkStatus: async () => {
    try {
      return await ipcRenderer.invoke("network:getStatus");
    } catch (error) {
      console.error("getNetworkStatus error:", error);
      return { online: true };
    }
  },
  setNetworkStatus: (online) => ipcRenderer.send("network:setOnline", online),
  onNetworkStatus: (cb) => {
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on("network:status", handler);
    return () => ipcRenderer.removeListener("network:status", handler);
  },
  cacheGet: async (key) => ipcRenderer.invoke("cache:get", key),
  cachePut: async (key, value) => ipcRenderer.invoke("cache:put", key, value),
  queueAdd: async (op) => ipcRenderer.invoke("queue:add", op),
  queueList: async () => ipcRenderer.invoke("queue:list"),
  queueClear: async () => ipcRenderer.invoke("queue:clear"),
  queueSet: async (list) => ipcRenderer.invoke("queue:set", list),
  getPeers: async () => ipcRenderer.invoke("p2p:getPeers"),
  onPeers: (cb) => {
    const handler = (_e, list) => cb(list);
    ipcRenderer.on("p2p:peers", handler);
    return () => ipcRenderer.removeListener("p2p:peers", handler);
  },
  broadcast: (message) => ipcRenderer.send("p2p:broadcast", message),
  sendToPeer: (deviceId, message) => ipcRenderer.send("p2p:sendToPeer", deviceId, message),
  onP2PMessage: (cb) => {
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on("p2p:message", handler);
    return () => ipcRenderer.removeListener("p2p:message", handler);
  },
  // Updater
  checkForUpdates: () => ipcRenderer.send('updater:check'),
  quitAndInstall: () => ipcRenderer.send('updater:quitAndInstall'),
  onUpdateAvailable: (cb) => {
    const handler = (_e, info) => cb(info);
    ipcRenderer.on('updater:update-available', handler);
    return () => ipcRenderer.removeListener('updater:update-available', handler);
  },
  onUpdateDownloaded: (cb) => {
    const handler = (_e, info) => cb(info);
    ipcRenderer.on('updater:update-downloaded', handler);
    return () => ipcRenderer.removeListener('updater:update-downloaded', handler);
  },
  onUpdateStatus: (cb) => {
    const handler = (_e, text) => cb(text);
    ipcRenderer.on('updater:status', handler);
    return () => ipcRenderer.removeListener('updater:status', handler);
  },
});
