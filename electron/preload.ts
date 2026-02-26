import { contextBridge, ipcRenderer } from "electron";

console.log("🔥 PRELOAD LOADED!");

contextBridge.exposeInMainWorld("electronAPI", {
  storeTokens: (payload: any) => ipcRenderer.send("auth:storeTokens", payload),
  clearTokens: () => ipcRenderer.send("auth:clearTokens"),
  getTokens: async () => {
    try {
      return await ipcRenderer.invoke("auth:getTokens");
    } catch (error) {
      console.error("getTokens error:", error);
      return null;
    }
  },
  saveLoginHash: async (email: string, password: string) =>
    ipcRenderer.invoke("auth:saveLoginHash", email, password),
  verifyLoginHash: async (email: string, password: string) =>
    ipcRenderer.invoke("auth:verifyLoginHash", email, password),
  savePinHash: async (pin: string) =>
    ipcRenderer.invoke("auth:savePinHash", pin),
  verifyPinHash: async (pin: string) =>
    ipcRenderer.invoke("auth:verifyPinHash", pin),
  saveUser: async (user: any) => {
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
  saveOutletOnboarding: async (payload: any) =>
    ipcRenderer.invoke("db:saveOutletOnboarding", payload),
  dbQuery: async (sql: string, params: any[] = []) =>
    ipcRenderer.invoke("db:query", sql, params),
  importAsset: async (filePath: string) =>
    ipcRenderer.invoke("assets:import", filePath),
  getNetworkStatus: async () => {
    try {
      return await ipcRenderer.invoke("network:getStatus");
    } catch (error) {
      console.error("getNetworkStatus error:", error);
      return { online: true };
    }
  },
  setNetworkStatus: (online: boolean) =>
    ipcRenderer.send("network:setOnline", online),
  onNetworkStatus: (cb: (payload: any) => void) => {
    const handler = (_e: any, payload: any) => cb(payload);
    ipcRenderer.on("network:status", handler);
    return () => ipcRenderer.removeListener("network:status", handler);
  },
  cacheGet: async (key: string) => ipcRenderer.invoke("cache:get", key),
  cachePut: async (key: string, value: any) =>
    ipcRenderer.invoke("cache:put", key, value),
  queueAdd: async (op: any) => ipcRenderer.invoke("queue:add", op),
  queueList: async () => ipcRenderer.invoke("queue:list"),
  queueClear: async () => ipcRenderer.invoke("queue:clear"),
  queueSet: async (list: any[]) => ipcRenderer.invoke("queue:set", list),
  getPeers: async () => ipcRenderer.invoke("p2p:getPeers"),
  onPeers: (cb: (list: any[]) => void) => {
    const handler = (_e: any, list: any[]) => cb(list);
    ipcRenderer.on("p2p:peers", handler);
    return () => ipcRenderer.removeListener("p2p:peers", handler);
  },
  broadcast: (message: any) => ipcRenderer.send("p2p:broadcast", message),
  sendToPeer: (deviceId: string, message: any) =>
    ipcRenderer.send("p2p:sendToPeer", deviceId, message),
  onP2PMessage: (cb: (payload: any) => void) => {
    const handler = (_e: any, payload: any) => cb(payload);
    ipcRenderer.on("p2p:message", handler);
    return () => ipcRenderer.removeListener("p2p:message", handler);
  },
  // Updater
  checkForUpdates: () => ipcRenderer.send("updater:check"),
  quitAndInstall: () => ipcRenderer.send("updater:quitAndInstall"),
  onUpdateAvailable: (cb: (info: any) => void) => {
    const handler = (_e: any, info: any) => cb(info);
    ipcRenderer.on("updater:update-available", handler);
    return () =>
      ipcRenderer.removeListener("updater:update-available", handler);
  },
  onUpdateDownloaded: (cb: (info: any) => void) => {
    const handler = (_e: any, info: any) => cb(info);
    ipcRenderer.on("updater:update-downloaded", handler);
    return () =>
      ipcRenderer.removeListener("updater:update-downloaded", handler);
  },
  onUpdateStatus: (cb: (text: string) => void) => {
    const handler = (_e: any, text: string) => cb(text);
    ipcRenderer.on("updater:status", handler);
    return () => ipcRenderer.removeListener("updater:status", handler);
  },
  factoryReset: () => ipcRenderer.send("system:factoryReset"),
});
