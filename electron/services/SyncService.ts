import { DatabaseService } from "./DatabaseService";
import { NetworkService } from "./NetworkService";
import { P2PService } from "./P2PService";
import { net, app } from "electron";
import fs from "fs";
import path from "path";
import { SYNC_ACTIONS } from "../types/action.types";

const API_URL = "https://seal-app-wzqhf.ondigitalocean.app/api/v1";
const SYNC_ENDPOINT = "https://seahorse-app-jb6pe.ondigitalocean.app/sync";
const UPLOAD_ENDPOINT = `${API_URL}/upload`; // Assumed endpoint
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

    // 2. Perform pull (bypass interval and leader check)
    await this.performPull();
    this.lastPullAt = Date.now();

    // 3. Process pending queue
    const pending = this.db.getPendingQueueItems();
    if (pending.length > 0) {
      await this.attemptSync(pending);
    }
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

      /* 
      const lastSyncTimestamp = this.db.getCache("last_sync_timestamp");
      console.log(`[SyncService] lastSyncTimestamp: ${lastSyncTimestamp}`);
      if (lastSyncTimestamp) {
        url.searchParams.set("lastSyncTimestamp", lastSyncTimestamp);
      }
      */

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
        if (filePath.startsWith("file://")) {
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
        const blob = new Blob([fileBuffer]);
        const formData = new FormData();
        formData.append("image", blob, fileName);

        console.log(
          `[SyncService] Uploading ${fileName} to ${UPLOAD_ENDPOINT}...`,
        );

        const response = await fetch(UPLOAD_ENDPOINT, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const txt = await response.text();
          console.error(
            `[SyncService] Upload failed for ${item.id}: ${response.status} ${txt}`,
          );
          continue;
        }

        const data = (await response.json()) as any;
        const newUrl = data.url || data.data?.url;

        if (newUrl) {
          console.log(`[SyncService] Upload successful. URL: ${newUrl}`);

          // 1. Update the record with the new URL
          this.db.updateRecordColumn(
            item.tableName,
            item.recordId,
            item.columnName,
            newUrl,
          );

          // 2. Special handling for business_outlet logo to clear offline flag
          if (
            item.tableName === "business_outlet" &&
            item.columnName === "logoUrl"
          ) {
            this.db.run(
              "UPDATE business_outlet SET isOfflineImage = 0, localLogoPath = NULL WHERE id = ?",
              [item.recordId],
            );
          }

          // 3. Mark as uploaded
          this.db.markImageAsUploaded(item.id);

          // 4. Queue Sync for the updated record
          // We fetch the latest record state to sync
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

      console.log(
        `[SyncService] Syncing ${itemsToSync.length} items to ${PUSH_ENDPOINT}...`,
      );

      const deviceId = this.db.getDeviceId() || "unknown-device";
      console.log("Device ID used for sync:", deviceId);

      const records = itemsToSync.map((item: any) => {
        const op = JSON.parse(item.op);
        // Map local queue format to API expected format
        return {
          id: item.id,
          tableName: op.tableName || op.table || op.type,
          recordId: op.recordId || op.id,
          payload: op.data || op.payload || {},
          sourceDeviceId: deviceId,
          action: op.action || op.op,
          timestamp: item.created_at,
          version: 1,
          syncedTo: [],
          createdAt: item.created_at,
          updatedAt: item.created_at,
        };
      });
      console.log("Recordss stuff", records);

      const payload = { records: records };
      console.log(payload);

      const response = await net.fetch(PUSH_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          "x-app-version": app.getVersion(),
        },
      });
      console.log("This is the response",await response.json())

      if (response.ok) {
        const ids = itemsToSync.map((i: any) => i.id);
        this.db.markAsSynced(ids);
        console.log(`[SyncService] Successfully synced ${ids.length} items.`);
      } else {
        const txt = await response.text();
        console.error(`[SyncService] Sync failed: ${response.status} ${txt}`);
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
