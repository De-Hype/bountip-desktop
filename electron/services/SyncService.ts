import { DatabaseService } from "./DatabaseService";
import { NetworkService } from "./NetworkService";
import { P2PService } from "./P2PService";
import { net, app } from "electron";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { SYNC_ACTIONS } from "../types/action.types";

const API_URL = "https://seal-app-wzqhf.ondigitalocean.app/api/v1";
const SYNC_ENDPOINT = "https://seahorse-app-jb6pe.ondigitalocean.app/sync";
const PUSH_ENDPOINT = `${SYNC_ENDPOINT}/push`;
const PULL_ENDPOINT = `${SYNC_ENDPOINT}/pull`;
const MIN_PULL_INTERVAL_MS = 5 * 60 * 1000;

export class SyncService {
  private db: DatabaseService;
  private network: NetworkService;
  private p2p: P2PService;
  private isSyncing = false;
  private isPulling = false;
  private isUploading = false;
  private lastPullAt = 0;

  constructor(db: DatabaseService, network: NetworkService, p2p: P2PService) {
    this.db = db;
    this.network = network;
    this.p2p = p2p;

    this.init();
  }

  public async triggerSync(forceFullPull: boolean = false) {
    console.log(
      `[SyncService] Triggering manual sync (bypassing leader check, forceFullPull=${forceFullPull})...`,
    );

    if (forceFullPull) {
      console.log("[SyncService] Forcing full pull by clearing timestamp...");
      this.db.putCache("last_sync_timestamp", null);
    }

    const online = this.network.getStatus().online;
    if (!online) {
      console.warn("[SyncService] Cannot trigger sync: Device is offline.");
      return;
    }

    const userId = this.db.getSyncUserId();
    if (!userId) {
      console.warn("[SyncService] Cannot trigger sync: No user ID found.");
      return;
    }

    // 1. Process offline images
    await this.processOfflineImages();

    // 2. Process pending queue (PUSH)
    const pending = this.db.getPendingQueueItems();
    if (pending.length > 0) {
      console.log(
        `[SyncService] Pushing ${pending.length} pending items before pull...`,
      );
      await this.attemptSync(pending);
    }

    // 3. Perform pull (PULL)
    await this.performPull();
    this.lastPullAt = Date.now();

    console.log("[SyncService] Manual sync trigger complete.");
  }

  /**
   * Flushes all pending items in the sync queue and image upload queue immediately.
   * This is critical during user switching to ensure no data is lost.
   */
  public async flushQueue() {
    console.log(
      "[SyncService] Flushing all pending queues before user switch...",
    );
    const online = this.network.getStatus().online;
    if (!online) {
      console.warn("[SyncService] Cannot flush queue: Device is offline.");
      return false;
    }

    try {
      // 1. Process all pending image uploads
      await this.processOfflineImages();

      // 2. Process all pending sync queue items
      const pending = this.db.getPendingQueueItems();
      if (pending.length > 0) {
        await this.attemptSync(pending);
      }

      console.log("[SyncService] Queue flush complete.");
      return true;
    } catch (error) {
      console.error("[SyncService] Failed to flush queue:", error);
      return false;
    }
  }

  private init() {
    this.network.onStatusChange((online) => {
      if (online) {
        this.checkLeaderAndSync();
      }
    });

    setInterval(() => this.checkLeaderAndSync(), 60000);

    // Initial sync check on startup
    this.checkLeaderAndSync();
  }

  private async checkLeaderAndSync() {
    const online = this.network.getStatus().online;
    if (!online) return;

    const userId = this.db.getSyncUserId();
    console.log(`[SyncService] checkLeaderAndSync for user: ${userId}`);
    if (!userId) {
      // Not logged in, skip everything
      return;
    }

    // 1. Process offline images first (independent of leader status?)
    // Yes, any device can upload its own offline images.
    await this.processOfflineImages();

    const peers = this.p2p.getPeers();
    const myId = this.p2p.getDeviceId();

    const deviceIds = this.p2p.getDevices();
    const allIds = [myId, ...deviceIds].sort();

    const leaderId = allIds[0];

    if (myId !== leaderId) {
      console.log(
        `[SyncService] I am not the leader. Leader is ${leaderId}. Waiting for leader to sync (or sending to leader).`,
      );
      return;
    }

    const now = Date.now();
    if (now - this.lastPullAt >= MIN_PULL_INTERVAL_MS) {
      console.log("[SyncService] I am the leader. Initiating pull sync...");
      await this.performPull();
      this.lastPullAt = Date.now();
    }

    const pending = this.db.getPendingQueueItems();
    if (pending.length === 0) return;

    console.log(
      `[SyncService] Initiating push sync for ${pending.length} pending items...`,
    );
    await this.attemptSync(pending);
  }

  private async performPull() {
    if (this.isPulling) return;
    this.isPulling = true;

    try {
      const userId = this.db.getSyncUserId();
      console.log(`[SyncService] Starting pull for userId: ${userId}`);

      if (!userId) {
        // Should be handled by caller
        console.warn("[SyncService] Pull skipped: No userId found.");
        return;
      }

      const url = new URL(PULL_ENDPOINT);

      url.searchParams.set("userId", String(userId));

      // const lastSyncTimestamp = this.db.getCache("last_sync_timestamp");
      // console.log(`[SyncService] lastSyncTimestamp: ${lastSyncTimestamp}`);
      // if (lastSyncTimestamp) {
      //   url.searchParams.set("lastSyncTimestamp", lastSyncTimestamp);
      // }

      console.log(`[SyncService] Fetching from: ${url.toString()}`);

      const response = await net.fetch(url.toString(), {
        method: "GET",
        headers: {
          "x-app-version": app.getVersion(),
        },
      });

      if (!response.ok) {
        const txt = await response.text();
        console.error(
          `[SyncService] Pull sync failed: HTTP ${response.status}: ${txt}`,
        );
        return;
      }

      const json = (await response.json()) as any;
      console.log(`[SyncService] Pulled data:`, json);

      if (!json || !json.data || !json.currentTimestamp) {
        console.error(
          "[SyncService] Pull sync response missing data or currentTimestamp",
        );
        return;
      }

      this.db.applyPullData({
        currentTimestamp: json.currentTimestamp,
        data: json.data,
        syncType: json.syncType,
      });

      // Update last sync timestamp
      this.db.putCache("last_sync_timestamp", json.currentTimestamp);
      console.log(
        `[SyncService] Pull complete. New timestamp: ${json.currentTimestamp}`,
      );
    } catch (e) {
      console.error("[SyncService] Pull sync error:", e);
    } finally {
      this.isPulling = false;
    }
  }

  private async processOfflineImages() {
    if (this.isUploading) return;
    this.isUploading = true;

    try {
      const pendingImages = this.db.getPendingImageUploads();
      if (pendingImages.length === 0) return;

      console.log(
        `[SyncService] Found ${pendingImages.length} offline images to upload...`,
      );

      for (const item of pendingImages) {
        let filePath = item.localPath;

        if (filePath.startsWith("asset:///")) {
          const filename = filePath.replace("asset:///", "");
          filePath = path.join(app.getPath("userData"), "assets", filename);
        } else if (filePath.startsWith("file://")) {
          filePath = filePath.replace("file://", "");
        }

        // Handle URL encoded paths on Windows/Mac if necessary
        try {
          filePath = decodeURIComponent(filePath);
        } catch {}

        if (!fs.existsSync(filePath)) {
          console.error(
            `[SyncService] Local image file not found: ${filePath}`,
          );
          // Mark as failed so we don't retry infinitely in a tight loop
          this.db.failImageUpload(item.id, "File not found");
          continue;
        }

        const fileName = path.basename(filePath);
        const fileBuffer = fs.readFileSync(filePath);

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_KEY_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
          console.error(
            "[SyncService] Cloudinary credentials missing in environment",
          );
          this.db.failImageUpload(item.id, "Cloudinary credentials missing");
          continue;
        }

        const timestamp = Math.round(new Date().getTime() / 1000).toString();
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
            `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`,
          ),
        );
        // Basic type detection
        const ext = path.extname(fileName).toLowerCase();
        const type =
          ext === ".png"
            ? "image/png"
            : ext === ".webp"
              ? "image/webp"
              : "image/jpeg";
        chunks.push(Buffer.from(`Content-Type: ${type}\r\n\r\n`));
        chunks.push(fileBuffer);
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

        console.log(`[SyncService] Uploading ${fileName} to Cloudinary...`);

        const response = await net.fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
          },
          body,
        });

        if (!response.ok) {
          const txt = await response.text();
          console.error(
            `[SyncService] Upload failed for ${item.id}: ${response.status} ${txt}`,
          );
          continue;
        }

        const data = (await response.json()) as any;
        const newUrl = data.secure_url || data.url;

        if (newUrl) {
          console.log(`[SyncService] Upload successful. URL: ${newUrl}`);

          // 1. Update the record with the new URL
          this.db.updateRecordColumn(
            item.tableName,
            item.recordId,
            item.columnName,
            newUrl,
          );

          // 2. Clear offline flags in DB if applicable (special case for business_outlet)
          if (
            item.tableName === "business_outlet" &&
            item.columnName === "logoUrl"
          ) {
            // Since updateRecordColumn already incremented version once, we just update the flags here
            // but we use the same increment pattern to stay consistent if this was the only update.
            this.db.run(
              "UPDATE business_outlet SET isOfflineImage = 0, localLogoPath = NULL, version = version + 1, updatedAt = ? WHERE id = ?",
              [new Date().toISOString(), item.recordId],
            );
          }

          // 3. Update existing pending sync operations in the queue
          // This avoids redundant operations and ensures the latest URL is used
          this.db.updateQueueWithNewUrl(
            item.tableName,
            item.recordId,
            item.columnName,
            newUrl,
          );

          // 4. Mark image as uploaded
          this.db.markImageAsUploaded(item.id);

          // 5. If there's no pending sync for this record, add an UPDATE operation
          // This ensures the record is eventually synced even if it wasn't already in the queue
          const pendingOps = this.db.getPendingQueueItems() as any[];
          const isAlreadyInQueue = pendingOps.some((opItem: any) => {
            try {
              const op = JSON.parse(opItem.op);
              const opTable = op.table || op.tableName || op.type;
              const opId = op.recordId || op.id;
              return opTable === item.tableName && opId === item.recordId;
            } catch {
              return false;
            }
          });

          if (!isAlreadyInQueue) {
            const records = this.db.query(
              `SELECT * FROM ${item.tableName} WHERE id = ?`,
              [item.recordId],
            ) as any[];

            if (records && records.length > 0) {
              const record = records[0];
              const syncOp = {
                table: item.tableName,
                action: SYNC_ACTIONS.UPDATE,
                data: record,
                id: item.recordId,
              };
              this.db.addToQueue(syncOp);
            }
          }
        } else {
          console.error(`[SyncService] Upload response missing URL`, data);
        }
      }
    } catch (e) {
      console.error("[SyncService] processOfflineImages error:", e);
    } finally {
      this.isUploading = false;
    }
  }

  public async attemptSync(pending?: any[]) {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const itemsToSync = pending || this.db.getPendingQueueItems();
      if (itemsToSync.length === 0) {
        this.isSyncing = false;
        return;
      }

      // Check for pending images related to these items before pushing
      const pendingImages = this.db.getPendingImageUploads();
      if (pendingImages.length > 0) {
        const itemIds = itemsToSync
          .map((i: any) => {
            try {
              const op = JSON.parse(i.op);
              return op.recordId || op.id;
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        const relatedImages = pendingImages.filter((img) =>
          itemIds.includes(img.recordId),
        );

        if (relatedImages.length > 0) {
          console.log(
            `[SyncService] Found ${relatedImages.length} related pending images. Processing before push...`,
          );
          await this.processOfflineImages();
        }
      }

      console.log(
        `[SyncService] Syncing ${itemsToSync.length} items to ${PUSH_ENDPOINT}...`,
      );

      const deviceId = this.db.getDeviceId() || "unknown-device";
      console.log("Device ID used for sync:", deviceId);

      const records = itemsToSync.map((item: any) => {
        const op = JSON.parse(item.op);

        // Sanitize payload: convert SQLite 0/1 back to boolean for known fields
        const rawPayload = op.data || op.payload || {};
        const sanitizedPayload: any = { ...rawPayload };

        const booleanFields = [
          "isMainLocation",
          "isActive",
          "whatsappChannel",
          "emailChannel",
          "isDeleted",
          "isOnboarded",
          "isOfflineImage",
          "isEmailVerified",
          "isPin",
          "showInPos",
          "limitTotalSelection",
          "limitQuantity",
        ];

        for (const field of booleanFields) {
          if (typeof sanitizedPayload[field] === "number") {
            sanitizedPayload[field] = sanitizedPayload[field] === 1;
          }
        }

        // Auto-parse JSON strings for business_outlet and other tables
        const jsonFieldsMap: Record<string, string[]> = {
          product: ["packagingMethod", "priceTierId", "allergenList"],
          customers: ["otherEmails", "otherPhoneNumbers", "otherNames"],
          business_outlet: [
            "operatingHours",
            "taxSettings",
            "serviceCharges",
            "paymentMethods",
            "priceTier",
            "receiptSettings",
            "labelSettings",
            "invoiceSettings",
            "bankDetails",
            "generalSettings",
          ],
          orders: ["timeline"],
          payment_terms: ["paymentInInstallment"],
          system_default: ["data"],
        };

        const tableName = op.tableName || op.table || op.type;
        const fieldsToParse = jsonFieldsMap[tableName] || [];

        for (const field of fieldsToParse) {
          if (typeof sanitizedPayload[field] === "string") {
            try {
              const parsed = JSON.parse(sanitizedPayload[field]);
              // Only assign if it's actually an object or array (not just a string that happens to be valid JSON like "true")
              if (parsed && typeof parsed === "object") {
                sanitizedPayload[field] = parsed;
              }
            } catch (e) {
              // Not valid JSON or already parsed, skip
            }
          }
        }

        if (
          tableName === "product" &&
          Array.isArray((sanitizedPayload as any).allergenList)
        ) {
          (sanitizedPayload as any).allergenList = {
            allergies: (sanitizedPayload as any).allergenList,
          };
        }
        if (tableName === "customers") {
          const toStringArray = (val: any) => {
            if (Array.isArray(val)) {
              return val.map((v) => String(v || "").trim()).filter(Boolean);
            }
            if (typeof val !== "string") return [];
            const trimmed = val.trim();
            if (!trimmed) return [];
            return trimmed
              .split(",")
              .map((v) => String(v || "").trim())
              .filter(Boolean);
          };

          if (typeof (sanitizedPayload as any).otherEmails === "string") {
            (sanitizedPayload as any).otherEmails = toStringArray(
              (sanitizedPayload as any).otherEmails,
            );
          }
          if (typeof (sanitizedPayload as any).otherPhoneNumbers === "string") {
            (sanitizedPayload as any).otherPhoneNumbers = toStringArray(
              (sanitizedPayload as any).otherPhoneNumbers,
            );
          }
          if (typeof (sanitizedPayload as any).otherNames === "string") {
            (sanitizedPayload as any).otherNames = toStringArray(
              (sanitizedPayload as any).otherNames,
            );
          }
        }

        // Map local queue format to API expected format
        return {
          id: item.id,
          tableName: tableName,
          recordId: op.recordId || op.id,
          payload: sanitizedPayload,
          sourceDeviceId: deviceId,
          action: op.action || op.op,
          timestamp: item.created_at,
          version: this.db.getNextSyncVersion(),
          syncedTo: [],
          createdAt: item.created_at,
          updatedAt: item.created_at,
        };
      });
      console.log("Recordss stuff", records);

      const tableInfoCache = new Map<
        string,
        { hasId: boolean; hasUpdatedAt: boolean; hasVersion: boolean }
      >();
      const getTableInfo = (tableName: string) => {
        if (tableInfoCache.has(tableName))
          return tableInfoCache.get(tableName)!;
        if (!tableName || /[^a-zA-Z0-9_]/.test(tableName)) {
          const info = { hasId: false, hasUpdatedAt: false, hasVersion: false };
          tableInfoCache.set(tableName, info);
          return info;
        }
        try {
          const cols = this.db.query(
            `PRAGMA table_info(${tableName})`,
          ) as any[];
          const info = {
            hasId: cols.some((c: any) => c.name === "id"),
            hasUpdatedAt: cols.some((c: any) => c.name === "updatedAt"),
            hasVersion: cols.some((c: any) => c.name === "version"),
          };
          tableInfoCache.set(tableName, info);
          return info;
        } catch {
          const info = { hasId: false, hasUpdatedAt: false, hasVersion: false };
          tableInfoCache.set(tableName, info);
          return info;
        }
      };

      // Re-fetch records if they might have been updated by image upload
      const finalizedRecords = records.map((record) => {
        // Increment the version in the database table before sync to ensure fresh versioning
        try {
          const info = getTableInfo(record.tableName);
          if (info.hasId && info.hasVersion) {
            if (info.hasUpdatedAt) {
              this.db.run(
                `UPDATE ${record.tableName} SET version = COALESCE(version, 0) + 1, updatedAt = ? WHERE id = ?`,
                [new Date().toISOString(), record.recordId],
              );
            } else {
              this.db.run(
                `UPDATE ${record.tableName} SET version = COALESCE(version, 0) + 1 WHERE id = ?`,
                [record.recordId],
              );
            }
          }
        } catch (e) {
          // If update fails (e.g. table doesn't have version column), just proceed
          console.warn(
            `[SyncService] Could not increment version for ${record.tableName}:`,
            e,
          );
        }

        const info = getTableInfo(record.tableName);
        const currentData = info.hasId
          ? this.db.getRecord(record.tableName, record.recordId)
          : null;

        if (currentData) {
          // Re-sanitize the fresh data from DB
          const sanitizedPayload = { ...currentData };
          const booleanFields = [
            "isMainLocation",
            "isActive",
            "whatsappChannel",
            "emailChannel",
            "isDeleted",
            "isOnboarded",
            "isOfflineImage",
            "isEmailVerified",
            "isPin",
            "showInPos",
            "limitTotalSelection",
            "limitQuantity",
          ];

          for (const field of booleanFields) {
            if (typeof sanitizedPayload[field] === "number") {
              sanitizedPayload[field] = sanitizedPayload[field] === 1;
            }
          }

          const jsonFieldsMap: Record<string, string[]> = {
            product: ["packagingMethod", "priceTierId", "allergenList"],
            customers: ["otherEmails", "otherPhoneNumbers", "otherNames"],
            business_outlet: [
              "operatingHours",
              "taxSettings",
              "serviceCharges",
              "paymentMethods",
              "priceTier",
              "receiptSettings",
              "labelSettings",
              "invoiceSettings",
              "bankDetails",
              "generalSettings",
            ],
            orders: ["timeline"],
            payment_terms: ["paymentInInstallment"],
            system_default: ["data"],
          };

          const fieldsToParse = jsonFieldsMap[record.tableName] || [];
          for (const field of fieldsToParse) {
            if (typeof sanitizedPayload[field] === "string") {
              try {
                const parsed = JSON.parse(sanitizedPayload[field]);
                if (parsed && typeof parsed === "object") {
                  sanitizedPayload[field] = parsed;
                }
              } catch {}
            }
          }

          if (
            record.tableName === "product" &&
            Array.isArray((sanitizedPayload as any).allergenList)
          ) {
            (sanitizedPayload as any).allergenList = {
              allergies: (sanitizedPayload as any).allergenList,
            };
          }

          if (record.tableName === "customers") {
            const toStringArray = (val: any) => {
              if (Array.isArray(val))
                return val.map((v) => String(v || "").trim()).filter(Boolean);
              if (typeof val !== "string") return [];
              const trimmed = val.trim();
              if (!trimmed) return [];
              return trimmed
                .split(",")
                .map((v) => String(v || "").trim())
                .filter(Boolean);
            };

            if (typeof (sanitizedPayload as any).otherEmails === "string") {
              (sanitizedPayload as any).otherEmails = toStringArray(
                (sanitizedPayload as any).otherEmails,
              );
            }
            if (
              typeof (sanitizedPayload as any).otherPhoneNumbers === "string"
            ) {
              (sanitizedPayload as any).otherPhoneNumbers = toStringArray(
                (sanitizedPayload as any).otherPhoneNumbers,
              );
            }
            if (typeof (sanitizedPayload as any).otherNames === "string") {
              (sanitizedPayload as any).otherNames = toStringArray(
                (sanitizedPayload as any).otherNames,
              );
            }
          }

          return {
            ...record,
            payload: sanitizedPayload,
          };
        }
        return record;
      });

      const payload = { records: finalizedRecords };
      console.log(payload);

      const response = await net.fetch(PUSH_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          "x-app-version": app.getVersion(),
        },
      });
      let responseText = "";
      try {
        responseText = await response.text();
      } catch {}

      let responseJson: any = null;
      if (responseText) {
        try {
          responseJson = JSON.parse(responseText);
        } catch {}
      }

      console.log(
        "This is the response",
        responseJson !== null ? responseJson : responseText,
      );
      if (responseJson?.data?.dbResults !== undefined) {
        console.log("[SyncService] dbResults:");
        try {
          console.dir(responseJson.data.dbResults, { depth: null });
        } catch {
          console.log(
            JSON.stringify(responseJson.data.dbResults, null, 2) || "",
          );
        }
      }

      if (response.ok) {
        const ids = itemsToSync.map((i: any) => i.id);
        this.db.markAsSynced(ids);
        console.log(`[SyncService] Successfully synced ${ids.length} items.`);
      } else {
        console.error(
          `[SyncService] Sync failed: ${response.status} ${
            responseText || response.statusText
          }`,
        );
        // We don't mark individual items as failed here since it's a batch failure.
        // They remain pending and will be retried.
      }
    } catch (e) {
      console.error("[SyncService] Sync process error:", e);
    } finally {
      this.isSyncing = false;
    }
  }
}
