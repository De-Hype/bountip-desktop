import { DatabaseService } from "./DatabaseService";
import { NetworkService } from "./NetworkService";
import { P2PService } from "./P2PService";
import { net } from "electron";

const API_URL = "https://seal-app-wzqhf.ondigitalocean.app/api/v1";
const SYNC_ENDPOINT = `${API_URL}/sync`;
const PULL_ENDPOINT = "https://seahorse-app-jb6pe.ondigitalocean.app/sync/pull";
const MIN_PULL_INTERVAL_MS = 5 * 60 * 1000;

export class SyncService {
  private db: DatabaseService;
  private network: NetworkService;
  private p2p: P2PService;
  private isSyncing = false;
  private isPulling = false;
  private lastPullAt = 0;

  constructor(db: DatabaseService, network: NetworkService, p2p: P2PService) {
    this.db = db;
    this.network = network;
    this.p2p = p2p;

    this.init();
  }

  private init() {
    this.network.onStatusChange((online) => {
      if (online) {
        this.checkLeaderAndSync();
      }
    });

    setInterval(() => this.checkLeaderAndSync(), 60000);
  }

  private async checkLeaderAndSync() {
    const online = this.network.getStatus().online;
    if (!online) return;

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

      if (!userId) {
        console.error(
          "[SyncService] Pull sync skipped because userId is not available in identity",
        );
        return;
      }

      const url = new URL(PULL_ENDPOINT);

      url.searchParams.set("userId", String(userId));

      console.log(`[SyncService] Pulling data from ${url.toString()}...`);

      const response = await net.fetch(url.toString(), {
        method: "GET",
      });

      if (!response.ok) {
        const txt = await response.text();
        console.error(
          `[SyncService] Pull sync failed: HTTP ${response.status}: ${txt}`,
        );
        return;
      }

      const json = (await response.json()) as any;

      if (!json || !json.data || !json.currentTimestamp) {
        console.error(
          "[SyncService] Pull sync response missing data or currentTimestamp",
        );
        return;
      }
      console.log("Pulled stuff", json);
      this.db.applyPullData({
        currentTimestamp: json.currentTimestamp,
        data: json.data,
      });
    } catch (e) {
      console.error("[SyncService] Pull sync error:", e);
    } finally {
      this.isPulling = false;
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
        `[SyncService] Syncing ${itemsToSync.length} items to ${SYNC_ENDPOINT}...`,
      );

      for (const item of itemsToSync) {
        const queueItem = item as any;
        try {
          const payload = JSON.parse(queueItem.op);

          const response = await net.fetch(SYNC_ENDPOINT, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
          });

          if (response.ok) {
            this.db.markAsSynced([queueItem.id]);
          } else {
            const txt = await response.text();
            console.error(
              `[SyncService] Sync failed for ${queueItem.id}: ${txt}`,
            );
            this.db.markAsFailed(
              queueItem.id,
              `HTTP ${response.status}: ${txt}`,
            );
          }
        } catch (e: any) {
          console.error(
            `[SyncService] Error processing item ${queueItem.id}:`,
            e,
          );
          this.db.markAsFailed(queueItem.id, e.message);
        }
      }
    } catch (e) {
      console.error("[SyncService] Sync process error:", e);
    } finally {
      this.isSyncing = false;
    }
  }
}
