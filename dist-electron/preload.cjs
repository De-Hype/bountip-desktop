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
  savePinHash: async (email, pin) => electron.ipcRenderer.invoke("auth:savePinHash", email, pin),
  verifyPinHash: async (email, pin) => electron.ipcRenderer.invoke("auth:verifyPinHash", email, pin),
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
  getOutlets: async () => electron.ipcRenderer.invoke("db:getOutlets"),
  getCustomers: async () => electron.ipcRenderer.invoke("db:getCustomers"),
  getPaymentTerms: async (outletId) => electron.ipcRenderer.invoke("db:getPaymentTerms", outletId),
  savePaymentTerm: async (payload) => electron.ipcRenderer.invoke("db:savePaymentTerm", payload),
  deletePaymentTerm: async (id) => electron.ipcRenderer.invoke("db:deletePaymentTerm", id),
  getBusinesses: async () => electron.ipcRenderer.invoke("db:getBusinesses"),
  getBusinessRoles: async (outletId) => electron.ipcRenderer.invoke("db:getBusinessRoles", outletId),
  getBusinessUsersWithRoles: async (outletId) => electron.ipcRenderer.invoke("db:getBusinessUsersWithRoles", outletId),
  getUserById: async (userId) => electron.ipcRenderer.invoke("db:getUserById", userId),
  upsertBusinessUser: async (payload) => electron.ipcRenderer.invoke("db:upsertBusinessUser", payload),
  setUserStatus: async (payload) => electron.ipcRenderer.invoke("db:setUserStatus", payload),
  upsertBusinessRole: async (payload) => electron.ipcRenderer.invoke("db:upsertBusinessRole", payload),
  updateBusinessDetails: async (payload) => electron.ipcRenderer.invoke("db:updateBusinessDetails", payload),
  updatePaymentTier: async (payload) => electron.ipcRenderer.invoke("db:updatePaymentTier", payload),
  addPaymentTier: async (payload) => electron.ipcRenderer.invoke("db:addPaymentTier", payload),
  deletePaymentTier: async (payload) => electron.ipcRenderer.invoke("db:deletePaymentTier", payload),
  editPaymentTier: async (payload) => electron.ipcRenderer.invoke("db:editPaymentTier", payload),
  bulkAddPaymentTiers: async (payload) => electron.ipcRenderer.invoke("db:bulkAddPaymentTiers", payload),
  updateReceiptSettings: async (payload) => electron.ipcRenderer.invoke("db:updateReceiptSettings", payload),
  updateLabelSettings: async (payload) => electron.ipcRenderer.invoke("db:updateLabelSettings", payload),
  updateInvoiceSettings: async (payload) => electron.ipcRenderer.invoke("db:updateInvoiceSettings", payload),
  updatePaymentMethods: async (payload) => electron.ipcRenderer.invoke("db:updatePaymentMethods", payload),
  updateOperatingHours: async (payload) => electron.ipcRenderer.invoke("db:updateOperatingHours", payload),
  updateTaxSettings: async (payload) => electron.ipcRenderer.invoke("db:updateTaxSettings", payload),
  updateServiceCharges: async (payload) => electron.ipcRenderer.invoke("db:updateServiceCharges", payload),
  createOutlet: async (payload) => electron.ipcRenderer.invoke("db:createOutlet", payload),
  updateOutlet: async (payload) => electron.ipcRenderer.invoke("db:updateOutlet", payload),
  deleteOutlet: async (payload) => electron.ipcRenderer.invoke("db:deleteOutlet", payload),
  createProduct: async (payload) => electron.ipcRenderer.invoke("db:createProduct", payload),
  createInventoryItem: async (payload) => electron.ipcRenderer.invoke("db:createInventoryItem", payload),
  bulkCreateProducts: async (payload) => electron.ipcRenderer.invoke("db:bulkCreateProducts", payload),
  bulkCreateCustomers: async (payload) => electron.ipcRenderer.invoke("db:bulkCreateCustomers", payload),
  upsertCustomer: async (payload) => electron.ipcRenderer.invoke("db:upsertCustomer", payload),
  dbQuery: async (sql, params) => electron.ipcRenderer.invoke("db:query", sql, params),
  importAsset: async (filePath) => electron.ipcRenderer.invoke("assets:import", filePath),
  uploadImage: async (payload) => electron.ipcRenderer.invoke("net:uploadImage", payload),
  deleteImage: async (payload) => electron.ipcRenderer.invoke("net:deleteImage", payload),
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
  cacheDelete: async (key) => electron.ipcRenderer.invoke("cache:delete", key),
  getSystemDefaults: async (key, outletId) => electron.ipcRenderer.invoke("db:getSystemDefaults", key, outletId),
  addSystemDefault: async (key, data, outletId) => electron.ipcRenderer.invoke("db:addSystemDefault", key, data, outletId),
  deleteSystemDefault: async (id) => electron.ipcRenderer.invoke("db:deleteSystemDefault", id),
  queueAdd: async (op) => electron.ipcRenderer.invoke("queue:add", op),
  triggerSync: async (forceFullPull) => electron.ipcRenderer.invoke("sync:trigger", forceFullPull),
  flushSync: async () => electron.ipcRenderer.invoke("sync:flush"),
  wipeData: async () => electron.ipcRenderer.invoke("db:wipeData"),
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
  onDownloadProgress: (cb) => {
    const handler = (_e, progressObj) => cb(progressObj);
    electron.ipcRenderer.on("updater:download-progress", handler);
    return () => electron.ipcRenderer.removeListener("updater:download-progress", handler);
  },
  openExternal: async (url) => electron.ipcRenderer.invoke("shell:openExternal", url),
  printHtml: async (payload) => electron.ipcRenderer.invoke("print:html", payload),
  factoryReset: () => electron.ipcRenderer.send("system:factoryReset")
});
