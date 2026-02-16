import { DatabaseService } from "./DatabaseService";
import { NetworkService } from "./NetworkService";
import { P2PService } from "./P2PService";
import { net } from "electron";

const API_URL = "https://seal-app-wzqhf.ondigitalocean.app/api/v1";
const SYNC_ENDPOINT = `${API_URL}/sync`; // User will provide the specific URL

export class SyncService {
  private db: DatabaseService;
  private network: NetworkService;
  private p2p: P2PService;
  private isSyncing = false;

  constructor(db: DatabaseService, network: NetworkService, p2p: P2PService) {
    this.db = db;
    this.network = network;
    this.p2p = p2p;

    this.init();
  }

  private init() {
    // Listen for network status changes
    this.network.onStatusChange((online) => {
      if (online) {
        this.checkLeaderAndSync();
      }
    });

    // P2P Sync Trigger (Leader Election)
    // Runs periodically to check if we are leader and have tasks
    setInterval(() => this.checkLeaderAndSync(), 10000);
  }

  private async checkLeaderAndSync() {
    const online = this.network.getStatus().online;
    if (!online) return;

    // optimization: Don't bother with leader election or sync if we have no pending tasks
    const pending = this.db.getPendingQueueItems();
    if (pending.length === 0) return;

    const peers = this.p2p.getPeers(); // Active peers
    const myId = this.p2p.getDeviceId();

    // Gather all connected device IDs
    const deviceIds = this.p2p.getDevices();
    const allIds = [myId, ...deviceIds].sort();

    const leaderId = allIds[0]; // Lowest ID is leader

    if (myId === leaderId) {
      console.log("[SyncService] I am the leader. Initiating sync...");
      await this.attemptSync(pending);
    } else {
      console.log(
        `[SyncService] I am not the leader. Leader is ${leaderId}. Waiting for leader to sync (or sending to leader).`
      );
      // TODO: In a full implementation, we would send 'pending' items to the leader here via P2P.
      // For now, we wait.
    }
  }

  public async attemptSync(pending?: any[]) {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      // Use passed pending items or fetch fresh
      const itemsToSync = pending || this.db.getPendingQueueItems();
      if (itemsToSync.length === 0) {
        this.isSyncing = false;
        return;
      }

      console.log(
        `[SyncService] Syncing ${itemsToSync.length} items to ${SYNC_ENDPOINT}...`
      );

      for (const item of itemsToSync) {
        const queueItem = item as any;
        try {
          const payload = JSON.parse(queueItem.op);

          // Always send to the specific SYNC_ENDPOINT
          const response = await net.fetch(SYNC_ENDPOINT, {
            method: "POST",
            body: JSON.stringify(payload), // Send the operation as the body
            headers: { "Content-Type": "application/json" },
          });

          if (response.ok) {
            this.db.markAsSynced([queueItem.id]);
          } else {
            const txt = await response.text();
            console.error(
              `[SyncService] Sync failed for ${queueItem.id}: ${txt}`
            );
            this.db.markAsFailed(
              queueItem.id,
              `HTTP ${response.status}: ${txt}`
            );
          }
        } catch (e: any) {
          console.error(
            `[SyncService] Error processing item ${queueItem.id}:`,
            e
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
