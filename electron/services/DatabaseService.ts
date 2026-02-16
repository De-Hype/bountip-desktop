import Database from "better-sqlite3";
import path from "path";
import { app } from "electron";
import fs from "fs";

export class DatabaseService {
  private db: Database.Database;

  constructor() {
    const userDataPath = app.getPath("userData");
    const dbPath = path.join(userDataPath, "bountip.db");

    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    this.db = new Database(dbPath);
    this.initSchema();
  }

  private initSchema() {
    // Identity Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS identity (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Cache (Key-Value) Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Sync Queue Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        op TEXT
      );
    `);

    // Migration: Ensure new columns exist
    const columns = this.db.pragma("table_info(sync_queue)") as any[];
    const hasStatus = columns.some((col) => col.name === "status");

    if (!hasStatus) {
      // Schema migration: Recreate table to ensure clean state with new schema
      // Since the user asked for a "clean slate" previously, dropping the old incompatible table is acceptable.
      this.db.exec("DROP TABLE sync_queue");
      this.db.exec(`
        CREATE TABLE sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          op TEXT,
          status TEXT DEFAULT 'pending', -- pending, syncing, failed
          retry_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_error TEXT
        );
      `);
    }
  }

  // Identity Methods
  getIdentity(): any {
    const row = this.db
      .prepare("SELECT value FROM identity WHERE key = ?")
      .get("user_identity") as { value: string } | undefined;
    return row ? JSON.parse(row.value) : null;
  }

  saveIdentity(identity: any) {
    const current = this.getIdentity() || {};
    const updated = { ...current, ...identity };
    this.db
      .prepare("INSERT OR REPLACE INTO identity (key, value) VALUES (?, ?)")
      .run("user_identity", JSON.stringify(updated));
  }

  // Cache Methods
  getCache(key: string): any {
    const row = this.db
      .prepare("SELECT value FROM cache WHERE key = ?")
      .get(key) as { value: string } | undefined;
    return row ? JSON.parse(row.value) : null;
  }

  putCache(key: string, value: any) {
    this.db
      .prepare("INSERT OR REPLACE INTO cache (key, value) VALUES (?, ?)")
      .run(key, JSON.stringify(value));
  }

  // Queue Methods
  addToQueue(op: any) {
    // Avoid duplicates if op is identical?
    // For now, append is fine.
    this.db
      .prepare("INSERT INTO sync_queue (op, status) VALUES (?, ?)")
      .run(JSON.stringify(op), "pending");
    return true;
  }

  getQueue(): any[] {
    const rows = this.db
      .prepare(
        "SELECT op FROM sync_queue WHERE status = 'pending' ORDER BY id ASC"
      )
      .all() as { op: string }[];
    return rows.map((r) => JSON.parse(r.op));
  }

  // Get Raw Queue Items with ID
  getPendingQueueItems() {
    return this.db
      .prepare(
        "SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY id ASC"
      )
      .all();
  }

  markAsSynced(ids: number[]) {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => "?").join(",");
    this.db
      .prepare(`DELETE FROM sync_queue WHERE id IN (${placeholders})`)
      .run(...ids);
  }

  markAsFailed(id: number, error: string) {
    // Increment retry count, if > 3 mark as dead letter?
    // User said: "if i had an api request that got an error, no need to retry it again"
    // So we mark it as failed immediately and stop trying.
    this.db
      .prepare(
        "UPDATE sync_queue SET status = 'failed', last_error = ? WHERE id = ?"
      )
      .run(error, id);
  }

  clearQueue() {
    this.db.prepare("DELETE FROM sync_queue").run();
  }

  setQueue(list: any[]) {
    const insert = this.db.prepare(
      "INSERT INTO sync_queue (op, status) VALUES (?, ?)"
    );
    const clear = this.db.prepare("DELETE FROM sync_queue");

    const transaction = this.db.transaction((ops) => {
      clear.run();
      for (const op of ops) insert.run(JSON.stringify(op), "pending");
    });

    transaction(list);
    return true;
  }
}
