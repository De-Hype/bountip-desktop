"use strict";
const electron = require("electron");
console.log("🔥 PRELOAD LOADED!");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  storeTokens: (payload) => electron.ipcRenderer.send("auth:storeTokens", payload),
  clearTokens: () => electron.ipcRenderer.send("auth:clearTokens"),
  getTokens: async () => {
    try {
      return await electron.ipcRenderer.invoke("auth:getTokens");
    } catch (error) {
      console.error("getTokens error:", error);
      return null;
    }
  },
  saveLoginHash: async (email, password) => electron.ipcRenderer.invoke("auth:saveLoginHash", email, password),
  verifyLoginHash: async (email, password) => electron.ipcRenderer.invoke("auth:verifyLoginHash", email, password),
  savePinHash: async (pin) => electron.ipcRenderer.invoke("auth:savePinHash", pin),
  verifyPinHash: async (pin) => electron.ipcRenderer.invoke("auth:verifyPinHash", pin),
  saveUser: async (user) => {
    try {
      return await electron.ipcRenderer.invoke("db:saveUser", user);
    } catch (error) {
      console.error("saveUser error:", error);
    }
  },
  getUser: async () => {
    try {
      return await electron.ipcRenderer.invoke("db:getUser");
    } catch (error) {
      console.error("getUser error:", error);
      return null;
    }
  },
  saveOutletOnboarding: async (payload) => electron.ipcRenderer.invoke("db:saveOutletOnboarding", payload),
  importAsset: async (filePath) => electron.ipcRenderer.invoke("assets:import", filePath),
  getNetworkStatus: async () => {
    try {
      return await electron.ipcRenderer.invoke("network:getStatus");
    } catch (error) {
      console.error("getNetworkStatus error:", error);
      return { online: true };
    }
  },
  setNetworkStatus: (online) => electron.ipcRenderer.send("network:setOnline", online),
  onNetworkStatus: (cb) => {
    const handler = (_e, payload) => cb(payload);
    electron.ipcRenderer.on("network:status", handler);
    return () => electron.ipcRenderer.removeListener("network:status", handler);
  },
  cacheGet: async (key) => electron.ipcRenderer.invoke("cache:get", key),
  cachePut: async (key, value) => electron.ipcRenderer.invoke("cache:put", key, value),
  queueAdd: async (op) => electron.ipcRenderer.invoke("queue:add", op),
  queueList: async () => electron.ipcRenderer.invoke("queue:list"),
  queueClear: async () => electron.ipcRenderer.invoke("queue:clear"),
  queueSet: async (list) => electron.ipcRenderer.invoke("queue:set", list),
  getPeers: async () => electron.ipcRenderer.invoke("p2p:getPeers"),
  onPeers: (cb) => {
    const handler = (_e, list) => cb(list);
    electron.ipcRenderer.on("p2p:peers", handler);
    return () => electron.ipcRenderer.removeListener("p2p:peers", handler);
  },
  broadcast: (message) => electron.ipcRenderer.send("p2p:broadcast", message),
  sendToPeer: (deviceId, message) => electron.ipcRenderer.send("p2p:sendToPeer", deviceId, message),
  onP2PMessage: (cb) => {
    const handler = (_e, payload) => cb(payload);
    electron.ipcRenderer.on("p2p:message", handler);
    return () => electron.ipcRenderer.removeListener("p2p:message", handler);
  },
  // Updater
  checkForUpdates: () => electron.ipcRenderer.send("updater:check"),
  quitAndInstall: () => electron.ipcRenderer.send("updater:quitAndInstall"),
  onUpdateAvailable: (cb) => {
    const handler = (_e, info) => cb(info);
    electron.ipcRenderer.on("updater:update-available", handler);
    return () => electron.ipcRenderer.removeListener("updater:update-available", handler);
  },
  onUpdateDownloaded: (cb) => {
    const handler = (_e, info) => cb(info);
    electron.ipcRenderer.on("updater:update-downloaded", handler);
    return () => electron.ipcRenderer.removeListener("updater:update-downloaded", handler);
  },
  onUpdateStatus: (cb) => {
    const handler = (_e, text) => cb(text);
    electron.ipcRenderer.on("updater:status", handler);
    return () => electron.ipcRenderer.removeListener("updater:status", handler);
  },
  factoryReset: () => electron.ipcRenderer.send("system:factoryReset")
});
