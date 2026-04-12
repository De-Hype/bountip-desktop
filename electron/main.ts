import {
  app,
  BrowserWindow,
  ipcMain,
  nativeImage,
  protocol,
  net,
  shell,
} from "electron";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { DatabaseService } from "./services/DatabaseService";
import { AuthService } from "./services/AuthService";
import { NetworkService } from "./services/NetworkService";
import { P2PService } from "./services/P2PService";
import { UpdateService } from "./services/UpdateService";
import { AssetService } from "./services/AssetService";
import { SyncService } from "./services/SyncService";
import { updateBusinessDetails } from "./features/settings/businessInformation";
import {
  addPaymentTier,
  deletePaymentTier,
  editPaymentTier,
  updatePaymentTier,
  bulkAddPaymentTiers,
} from "./features/settings/paymentTier";
import { updateReceiptSettings } from "./features/settings/receiptCustomization";
import { updateLabelSettings } from "./features/settings/labellingSettings";
import { updateInvoiceSettings } from "./features/settings/invoiceCustomization";
import { updateOperatingHours } from "./features/settings/operatingHours";
import { updatePaymentMethods } from "./features/settings/paymentMethods";
import { updateTaxSettings } from "./features/settings/taxSettings";
import { updateServiceCharges } from "./features/settings/serviceCharge";
import { printHtml } from "./features/printing/printHtml";
import {
  createOutlet,
  updateOutlet,
  deleteOutlet,
} from "./features/settings/locationSettings";
import {
  getOutlet,
  getOutlets,
  saveOutletOnboarding,
} from "./features/outlets";
import { createInventoryItem } from "./features/inventory/createInventory";
import {
  createProduct,
  bulkCreateProducts,
} from "./features/product/productPersistence";
import {
  bulkCreateCustomers,
  upsertCustomer,
  getCustomers,
} from "./features/customer-management/customers";
import {
  getPaymentTerms,
  savePaymentTerm,
  deletePaymentTerm,
} from "./features/customer-management/payment";
import { getBusinesses } from "./features/business";
import {
  getBusinessRoles,
  getBusinessUsersWithRoles,
  getUserById,
  upsertBusinessUser,
  setUserStatus,
  upsertBusinessRole,
} from "./features/roles-permissions";

// Register custom protocol privileges
protocol.registerSchemesAsPrivileged([
  {
    scheme: "asset",
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true,
      bypassCSP: true,
    },
  },
]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config(); // Fallback to .env

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
  // Use a more reliable way to find the icon path
  let iconPath = path.join(__dirname, "../electron/assets/icon.png");

  // Fallback check if it's not found (can happen depending on the environment)
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(process.cwd(), "electron/assets/icon.png");
  }

  // If still not found and we are in production, check common packaged locations
  if (!fs.existsSync(iconPath) && app.isPackaged) {
    iconPath = path.join(process.resourcesPath, "assets/icon.png");
    if (!fs.existsSync(iconPath)) {
      iconPath = path.join(
        process.resourcesPath,
        "app.asar/electron/assets/icon.png",
      );
    }
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
  ipcMain.on("auth:storeTokens", (_event, payload) => {
    authService.storeTokens(payload);
  });
  ipcMain.on("auth:clearTokens", () => authService.clearTokens());
  ipcMain.handle("auth:getTokens", () => authService.getTokens());
  ipcMain.handle(
    "auth:saveLoginHash",
    (_event, email: string, password: string) =>
      authService.saveLoginHash(email, password),
  );
  ipcMain.handle(
    "auth:verifyLoginHash",
    (_event, email: string, password: string) =>
      authService.verifyLoginHash(email, password),
  );

  ipcMain.handle("auth:savePinHash", (_event, email, pin) =>
    authService.savePinHash(email, pin),
  );
  ipcMain.handle("auth:verifyPinHash", (_event, email, pin) =>
    authService.verifyPinHash(email, pin),
  );

  ipcMain.handle("db:getUser", () => authService.getUser());
  ipcMain.handle("db:saveUser", (_event, payload) => {
    authService.saveUser(payload);
    syncService.triggerSync();
  });

  ipcMain.handle("cache:get", (_event, key) => dbService.getCache(key));
  ipcMain.handle("cache:put", (_event, key, value) =>
    dbService.putCache(key, value),
  );
  ipcMain.handle("cache:delete", (_event, key) => dbService.deleteCache(key));

  ipcMain.handle("db:saveOutletOnboarding", (_event, payload) =>
    saveOutletOnboarding(dbService, payload),
  );

  ipcMain.handle("db:getOutlets", () => getOutlets(dbService));
  ipcMain.handle("db:getCustomers", () => getCustomers(dbService));
  ipcMain.handle("db:getPaymentTerms", (_event, outletId: string) =>
    getPaymentTerms(dbService, outletId),
  );
  ipcMain.handle("db:savePaymentTerm", (_event, payload) =>
    savePaymentTerm(dbService, payload),
  );
  ipcMain.handle("db:deletePaymentTerm", (_event, id: string) =>
    deletePaymentTerm(dbService, id),
  );
  ipcMain.handle("db:getBusinesses", () => getBusinesses(dbService));
  ipcMain.handle("db:getBusinessRoles", (_event, outletId?: string) =>
    getBusinessRoles(dbService, outletId),
  );
  ipcMain.handle("db:getBusinessUsersWithRoles", (_event, outletId?: string) =>
    getBusinessUsersWithRoles(dbService, outletId),
  );
  ipcMain.handle("db:getUserById", (_event, userId: string) =>
    getUserById(dbService, userId),
  );
  ipcMain.handle("db:upsertBusinessUser", (_event, payload) =>
    upsertBusinessUser(dbService, payload),
  );
  ipcMain.handle("db:setUserStatus", (_event, payload) =>
    setUserStatus(dbService, payload),
  );
  ipcMain.handle("db:upsertBusinessRole", (_event, payload) =>
    upsertBusinessRole(dbService, payload),
  );
  ipcMain.handle("db:wipeData", () => dbService.wipeUserData());
  ipcMain.handle("db:updateBusinessDetails", (_event, payload) =>
    updateBusinessDetails(dbService, payload),
  );

  ipcMain.handle("db:updatePaymentTier", (_event, payload) =>
    updatePaymentTier(dbService, payload),
  );

  ipcMain.handle("db:addPaymentTier", (_event, payload) =>
    addPaymentTier(dbService, payload),
  );

  ipcMain.handle("db:deletePaymentTier", (_event, payload) =>
    deletePaymentTier(dbService, payload),
  );

  ipcMain.handle("db:editPaymentTier", (_event, payload) =>
    editPaymentTier(dbService, payload),
  );

  ipcMain.handle("db:bulkAddPaymentTiers", (_event, payload) =>
    bulkAddPaymentTiers(dbService, payload),
  );

  ipcMain.handle("db:updateReceiptSettings", (_event, payload) =>
    updateReceiptSettings(dbService, payload),
  );

  ipcMain.handle("db:updateLabelSettings", (_event, payload) =>
    updateLabelSettings(dbService, payload),
  );

  ipcMain.handle("db:updateInvoiceSettings", (_event, payload) =>
    updateInvoiceSettings(dbService, payload),
  );

  ipcMain.handle("db:updateOperatingHours", (_event, payload) =>
    updateOperatingHours(dbService, payload),
  );

  ipcMain.handle("db:updatePaymentMethods", (_event, payload) =>
    updatePaymentMethods(dbService, payload),
  );

  ipcMain.handle("db:updateTaxSettings", (_event, payload) =>
    updateTaxSettings(dbService, payload),
  );

  ipcMain.handle("db:updateServiceCharges", (_event, payload) =>
    updateServiceCharges(dbService, payload),
  );

  ipcMain.handle("db:createOutlet", (_event, payload) =>
    createOutlet(dbService, payload),
  );

  ipcMain.handle("db:updateOutlet", (_event, payload) =>
    updateOutlet(dbService, payload),
  );

  ipcMain.handle("db:deleteOutlet", (_event, payload) =>
    deleteOutlet(dbService, payload),
  );

  ipcMain.handle("db:createProduct", (_event, payload) =>
    createProduct(dbService, payload),
  );

  ipcMain.handle("db:createInventoryItem", (_event, payload) =>
    createInventoryItem(dbService, payload),
  );

  ipcMain.handle("db:bulkCreateProducts", (_event, payload) =>
    bulkCreateProducts(dbService, payload),
  );

  ipcMain.handle("db:bulkCreateCustomers", (_event, payload) =>
    bulkCreateCustomers(dbService, payload),
  );

  ipcMain.handle("db:upsertCustomer", (_event, payload) =>
    upsertCustomer(dbService, payload),
  );

  ipcMain.handle("db:query", (_event, sql: string, params: any[]) =>
    dbService.query(sql, params),
  );

  ipcMain.handle("assets:import", (_event, filePath) =>
    assetService.importLocalAsset(filePath),
  );

  ipcMain.handle("net:uploadImage", async (_event, { buffer, name, type }) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_KEY_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      console.error("[Main] Cloudinary credentials missing in environment");
      return {
        ok: false,
        status: 500,
        error: "Cloudinary credentials not configured",
      };
    }

    const timestamp = Math.round(new Date().getTime() / 1000).toString();

    // Create signature
    const signatureStr = `timestamp=${timestamp}${apiSecret}`;
    const signature = crypto
      .createHash("sha1")
      .update(signatureStr)
      .digest("hex");

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;

    // Construct multipart body manually for net.fetch
    const chunks = [];
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    chunks.push(
      Buffer.from(
        `Content-Disposition: form-data; name="file"; filename="${name}"\r\n`,
      ),
    );
    chunks.push(Buffer.from(`Content-Type: ${type}\r\n\r\n`));
    chunks.push(Buffer.from(buffer));
    chunks.push(Buffer.from(`\r\n--${boundary}\r\n`));

    chunks.push(
      Buffer.from(
        `Content-Disposition: form-data; name="api_key"\r\n\r\n${apiKey}\r\n--${boundary}\r\n`,
      ),
    );
    chunks.push(
      Buffer.from(
        `Content-Disposition: form-data; name="timestamp"\r\n\r\n${timestamp}\r\n--${boundary}\r\n`,
      ),
    );
    chunks.push(
      Buffer.from(
        `Content-Disposition: form-data; name="signature"\r\n\r\n${signature}\r\n--${boundary}--\r\n`,
      ),
    );

    const body = Buffer.concat(chunks);

    try {
      const response = await net.fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
        body,
      });

      const data = await response.json();
      console.log("Cloudinary Upload Response:", data);

      return {
        ok: response.ok,
        status: response.status,
        data: {
          data: {
            url: data.secure_url || data.url,
            ...data,
          },
        },
      };
    } catch (error: any) {
      console.error("[Main] Cloudinary upload error:", error);
      return {
        ok: false,
        status: 500,
        error: error.message,
      };
    }
  });

  ipcMain.handle("net:deleteImage", async (_event, { publicId }) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_KEY_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      console.error("[Main] Cloudinary credentials missing in environment");
      return {
        ok: false,
        status: 500,
        error: "Cloudinary credentials not configured",
      };
    }

    const pid = String(publicId || "").trim();
    if (!pid) {
      return { ok: false, status: 400, error: "publicId is required" };
    }

    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    const signatureStr = `public_id=${pid}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto
      .createHash("sha1")
      .update(signatureStr)
      .digest("hex");

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;
    const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;

    const chunks = [];
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    chunks.push(
      Buffer.from(
        `Content-Disposition: form-data; name="public_id"\r\n\r\n${pid}\r\n--${boundary}\r\n`,
      ),
    );
    chunks.push(
      Buffer.from(
        `Content-Disposition: form-data; name="api_key"\r\n\r\n${apiKey}\r\n--${boundary}\r\n`,
      ),
    );
    chunks.push(
      Buffer.from(
        `Content-Disposition: form-data; name="timestamp"\r\n\r\n${timestamp}\r\n--${boundary}\r\n`,
      ),
    );
    chunks.push(
      Buffer.from(
        `Content-Disposition: form-data; name="signature"\r\n\r\n${signature}\r\n--${boundary}--\r\n`,
      ),
    );

    const body = Buffer.concat(chunks);

    try {
      const response = await net.fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
        body,
      });

      const data = await response.json().catch(() => null);
      return { ok: response.ok, status: response.status, data };
    } catch (error: any) {
      console.error("[Main] Cloudinary delete error:", error);
      return { ok: false, status: 500, error: error.message };
    }
  });

  ipcMain.handle("sync:flush", () => syncService.flushQueue());
  ipcMain.handle("sync:trigger", (_event, forceFullPull?: boolean) =>
    syncService.triggerSync(forceFullPull),
  );

  ipcMain.handle("queue:add", (_event, op) => dbService.addToQueue(op));
  ipcMain.handle("queue:list", () => dbService.getPendingQueue());
  ipcMain.handle("queue:clear", () => dbService.clearQueue());
  ipcMain.handle("queue:set", (_event, list) => dbService.setQueue(list));

  ipcMain.handle("db:getSystemDefaults", (_event, key, outletId) =>
    dbService.getSystemDefaults(key, outletId),
  );

  ipcMain.handle("db:addSystemDefault", (_event, key, data, outletId) =>
    dbService.addSystemDefault(key, data, outletId),
  );

  ipcMain.handle("db:deleteSystemDefault", (_event, id, itemValue) =>
    dbService.deleteSystemDefault(id, itemValue),
  );

  ipcMain.handle("network:getStatus", () => networkService.getStatus());
  ipcMain.on("network:setOnline", (_event, flag) =>
    networkService.setOnline(flag),
  );

  ipcMain.handle("shell:openExternal", async (_event, url: string) => {
    try {
      const u = String(url || "").trim();
      if (!u) return false;
      if (
        !u.startsWith("mailto:") &&
        !u.startsWith("https://") &&
        !u.startsWith("http://")
      ) {
        return false;
      }
      await shell.openExternal(u);
      return true;
    } catch (err) {
      console.error("[Main] shell:openExternal failed:", err);
      return false;
    }
  });

  ipcMain.handle("p2p:getPeers", () => p2pService.getPeers());
  ipcMain.on("p2p:broadcast", (_event, payload) =>
    p2pService.broadcast(payload),
  );
  ipcMain.on("p2p:sendToPeer", (_event, deviceId, payload) =>
    p2pService.sendToPeerById(deviceId, payload),
  );

  // Updater IPC
  ipcMain.on("updater:check", () => updateService.checkForUpdates());
  ipcMain.on("updater:quitAndInstall", () => updateService.quitAndInstall());

  // Factory Reset
  ipcMain.on("system:factoryReset", async () => {
    try {
      console.log("Factory reset requested...");
      await authService.clearTokens();
      dbService.clearAllData();

      // Optionally clear other paths if needed
      // const userDataPath = app.getPath("userData");
      // fs.rmdirSync(userDataPath, { recursive: true });

      console.log("Factory reset complete. Relaunching...");
      app.relaunch();
      app.exit(0);
    } catch (error) {
      console.error("Factory reset failed:", error);
    }
  });

  ipcMain.handle("print:html", async (_event, payload) => {
    return printHtml(payload);
  });

  // Check for updates
  setTimeout(() => {
    if (app.isPackaged) {
      updateService.checkForUpdatesAndNotify();
    }
  }, 3000);

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (dbService) {
      try {
        dbService.close();
      } catch (e) {
        console.error("[Main] Error closing database:", e);
      }
    }
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
