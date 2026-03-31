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
  getOutlets: async () => ipcRenderer.invoke("db:getOutlets"),
  getCustomers: async () => ipcRenderer.invoke("db:getCustomers"),
  getPaymentTerms: async (outletId: string) =>
    ipcRenderer.invoke("db:getPaymentTerms", outletId),
  savePaymentTerm: async (payload: any) =>
    ipcRenderer.invoke("db:savePaymentTerm", payload),
  deletePaymentTerm: async (id: string) =>
    ipcRenderer.invoke("db:deletePaymentTerm", id),
  getBusinesses: async () => ipcRenderer.invoke("db:getBusinesses"),
  updateBusinessDetails: async (payload: any) =>
    ipcRenderer.invoke("db:updateBusinessDetails", payload),
  updatePaymentTier: async (payload: any) =>
    ipcRenderer.invoke("db:updatePaymentTier", payload),
  addPaymentTier: async (payload: any) =>
    ipcRenderer.invoke("db:addPaymentTier", payload),
  deletePaymentTier: async (payload: any) =>
    ipcRenderer.invoke("db:deletePaymentTier", payload),
  editPaymentTier: async (payload: any) =>
    ipcRenderer.invoke("db:editPaymentTier", payload),
  bulkAddPaymentTiers: async (payload: any) =>
    ipcRenderer.invoke("db:bulkAddPaymentTiers", payload),
  updateReceiptSettings: async (payload: { outletId: string; settings: any }) =>
    ipcRenderer.invoke("db:updateReceiptSettings", payload),
  updateLabelSettings: async (payload: { outletId: string; settings: any }) =>
    ipcRenderer.invoke("db:updateLabelSettings", payload),
  updateInvoiceSettings: async (payload: { outletId: string; settings: any }) =>
    ipcRenderer.invoke("db:updateInvoiceSettings", payload),
  updatePaymentMethods: async (payload: {
    outletId: string;
    paymentMethods: any;
  }) => ipcRenderer.invoke("db:updatePaymentMethods", payload),
  updateOperatingHours: async (payload: {
    outletId: string;
    operatingHours: any;
  }) => ipcRenderer.invoke("db:updateOperatingHours", payload),
  updateTaxSettings: async (payload: { outletId: string; settings: any }) =>
    ipcRenderer.invoke("db:updateTaxSettings", payload),
  updateServiceCharges: async (payload: { outletId: string; charges: any }) =>
    ipcRenderer.invoke("db:updateServiceCharges", payload),
  createOutlet: async (payload: { businessId: string; location: any }) =>
    ipcRenderer.invoke("db:createOutlet", payload),
  updateOutlet: async (payload: { outletId: string; location: any }) =>
    ipcRenderer.invoke("db:updateOutlet", payload),
  deleteOutlet: async (payload: { outletId: string }) =>
    ipcRenderer.invoke("db:deleteOutlet", payload),
  createProduct: async (payload: any) =>
    ipcRenderer.invoke("db:createProduct", payload),
  createInventoryItem: async (payload: any) =>
    ipcRenderer.invoke("db:createInventoryItem", payload),
  bulkCreateProducts: async (payload: any) =>
    ipcRenderer.invoke("db:bulkCreateProducts", payload),
  bulkCreateCustomers: async (payload: any) =>
    ipcRenderer.invoke("db:bulkCreateCustomers", payload),
  upsertCustomer: async (payload: any) =>
    ipcRenderer.invoke("db:upsertCustomer", payload),
  dbQuery: async (sql: string, params: any[]) =>
    ipcRenderer.invoke("db:query", sql, params),
  importAsset: async (filePath: string) =>
    ipcRenderer.invoke("assets:import", filePath),
  uploadImage: async (payload: {
    buffer: Uint8Array;
    name: string;
    type: string;
    token: string;
  }) => ipcRenderer.invoke("net:uploadImage", payload),
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
  getSystemDefaults: async (key: string, outletId?: string) =>
    ipcRenderer.invoke("db:getSystemDefaults", key, outletId),
  addSystemDefault: async (key: string, data: any, outletId: string) =>
    ipcRenderer.invoke("db:addSystemDefault", key, data, outletId),
  deleteSystemDefault: async (id: string) =>
    ipcRenderer.invoke("db:deleteSystemDefault", id),
  queueAdd: async (op: any) => ipcRenderer.invoke("queue:add", op),
  triggerSync: async (forceFullPull?: boolean) =>
    ipcRenderer.invoke("sync:trigger", forceFullPull),
  flushSync: async () => ipcRenderer.invoke("sync:flush"),
  wipeData: async () => ipcRenderer.invoke("db:wipeData"),
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
  onDownloadProgress: (cb: (progressObj: any) => void) => {
    const handler = (_e: any, progressObj: any) => cb(progressObj);
    ipcRenderer.on("updater:download-progress", handler);
    return () =>
      ipcRenderer.removeListener("updater:download-progress", handler);
  },
  openExternal: async (url: string) =>
    ipcRenderer.invoke("shell:openExternal", url),
  printHtml: async (payload: { html: string; options?: any }) =>
    ipcRenderer.invoke("print:html", payload),
  factoryReset: () => ipcRenderer.send("system:factoryReset"),
});
