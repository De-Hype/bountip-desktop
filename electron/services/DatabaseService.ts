import Database from "better-sqlite3";
import path from "path";
import { app } from "electron";
import fs from "fs";
import { schemas } from "../features/schemas";
import {
  userUpsertSql,
  buildUserUpsertParams,
} from "../features/schemas/user.schema";
import {
  businessUpsertSql,
  buildBusinessUpsertParams,
} from "../features/schemas/business.schema";
import {
  businessOutletUpsertSql,
  buildBusinessOutletUpsertParams,
} from "../features/schemas/business_outlet.schema";
import {
  productUpsertSql,
  buildProductUpsertParams,
} from "../features/schemas/product.schema";
import { LocalUserProfile } from "../types/user.types";

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

    // Sync Queue Table (offline-first sync operations)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        op TEXT,
        status TEXT DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_error TEXT
      );
    `);

    // Core mirrored entities from remote Postgres schema (SQLite-friendly)
    // Note: Types are adapted to SQLite (uuid → TEXT, json/jsonb → TEXT, numeric → REAL).

    for (const schema of schemas) {
      this.db.exec(schema.create);

      if (schema.indexes?.length) {
        for (const index of schema.indexes) {
          this.db.exec(index);
        }
      }
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

  getUserProfile(): LocalUserProfile {
    const identity = this.getIdentity();
    const row = this.db.prepare("SELECT * FROM user LIMIT 1").get() as
      | {
          id?: string;
          email?: string;
          fullName?: string;
          status?: string;
          isEmailVerified?: number;
          createdAt?: string;
          updatedAt?: string;
        }
      | undefined;

    const fromIdentity =
      identity && typeof identity === "object"
        ? {
            id:
              identity.id ??
              identity.userId ??
              identity.user?.id ??
              row?.id ??
              null,
            email: identity.email ?? identity.user?.email ?? row?.email ?? null,
            fullName:
              identity.fullName ??
              identity.user?.fullName ??
              row?.fullName ??
              null,
            status:
              identity.status ?? identity.user?.status ?? row?.status ?? null,
            isEmailVerified:
              identity.isEmailVerified ??
              identity.user?.isEmailVerified ??
              (row && typeof row.isEmailVerified === "number"
                ? row.isEmailVerified === 1
                : undefined),
            createdAt:
              identity.createdAt ??
              identity.user?.createdAt ??
              row?.createdAt ??
              null,
            updatedAt:
              identity.updatedAt ??
              identity.user?.updatedAt ??
              row?.updatedAt ??
              null,
          }
        : {
            id: row?.id ?? null,
            email: row?.email ?? null,
            fullName: row?.fullName ?? null,
            status: row?.status ?? null,
            isEmailVerified:
              row && typeof row.isEmailVerified === "number"
                ? row.isEmailVerified === 1
                : undefined,
            createdAt: row?.createdAt ?? null,
            updatedAt: row?.updatedAt ?? null,
          };

    const deviceId =
      identity && typeof identity === "object"
        ? (identity.deviceId ?? identity.user?.deviceId ?? null)
        : null;

    return {
      id: fromIdentity.id ?? null,
      email: fromIdentity.email ?? null,
      name: fromIdentity.fullName ?? null,
      status: fromIdentity.status ?? null,
      isEmailVerified: fromIdentity.isEmailVerified,
      createdAt: fromIdentity.createdAt ?? null,
      updatedAt: fromIdentity.updatedAt ?? null,
      deviceId,
    };
  }

  getSyncUserId(): string | null {
    const identity = this.getIdentity();
    if (identity && typeof identity === "object") {
      const fromIdentity =
        identity.id ?? identity.userId ?? identity.user?.id ?? null;
      if (fromIdentity) return String(fromIdentity);
    }

    const row = this.db.prepare("SELECT id FROM user LIMIT 1").get() as
      | { id?: string }
      | undefined;
    if (row && row.id) return String(row.id);

    return null;
  }

  saveLoginHash(hash: string) {
    this.db
      .prepare("INSERT OR REPLACE INTO identity (key, value) VALUES (?, ?)")
      .run("login_hash", JSON.stringify({ hash }));
  }

  getLoginHash(): string | null {
    const row = this.db
      .prepare("SELECT value FROM identity WHERE key = ?")
      .get("login_hash") as { value: string } | undefined;
    if (!row) return null;
    try {
      const parsed = JSON.parse(row.value) as { hash?: string };
      return parsed.hash ?? null;
    } catch {
      return null;
    }
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
        "SELECT op FROM sync_queue WHERE status = 'pending' ORDER BY id ASC",
      )
      .all() as { op: string }[];
    return rows.map((r) => JSON.parse(r.op));
  }

  // Get Raw Queue Items with ID
  getPendingQueueItems() {
    return this.db
      .prepare(
        "SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY id ASC",
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
        "UPDATE sync_queue SET status = 'failed', last_error = ? WHERE id = ?",
      )
      .run(error, id);
  }

  clearQueue() {
    this.db.prepare("DELETE FROM sync_queue").run();
  }

  setQueue(list: any[]) {
    const insert = this.db.prepare(
      "INSERT INTO sync_queue (op, status) VALUES (?, ?)",
    );
    const clear = this.db.prepare("DELETE FROM sync_queue");

    const transaction = this.db.transaction((ops) => {
      clear.run();
      for (const op of ops) insert.run(JSON.stringify(op), "pending");
    });

    transaction(list);
    return true;
  }

  applyPullData(payload: { currentTimestamp: string; data: any }) {
    const { data } = payload;

    const toSqliteValue = (value: any) => {
      if (value === null || value === undefined) return null;
      const t = typeof value;
      if (t === "number" || t === "string" || t === "bigint") return value;
      if (typeof Buffer !== "undefined" && (Buffer as any).isBuffer?.(value)) {
        return value;
      }
      if (value instanceof Date) return value.toISOString();
      if (t === "boolean") return value ? 1 : 0;
      return JSON.stringify(value);
    };

    const sanitize = (obj: any) => {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(obj)) {
        result[key] = toSqliteValue(val);
      }
      return result;
    };

    const tx = this.db.transaction(() => {
      if (data.user) {
        const u = data.user;
        this.db.prepare(userUpsertSql).run(sanitize(buildUserUpsertParams(u)));
      }

      if (Array.isArray(data.businesses) && data.businesses.length > 0) {
        const stmt = this.db.prepare(businessUpsertSql);

        for (const b of data.businesses) {
          stmt.run(sanitize(buildBusinessUpsertParams(b)));
        }
      }

      if (Array.isArray(data.outlets) && data.outlets.length > 0) {
        const stmt = this.db.prepare(businessOutletUpsertSql);

        for (const o of data.outlets) {
          stmt.run(sanitize(buildBusinessOutletUpsertParams(o)));
        }
      }

      if (Array.isArray(data.products) && data.products.length > 0) {
        const stmt = this.db.prepare(productUpsertSql);

        for (const p of data.products) {
          stmt.run(sanitize(buildProductUpsertParams(p)));
        }
      }
    });

    tx();
  }
}
