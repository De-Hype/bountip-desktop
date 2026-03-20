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
import {
  systemDefaultUpsertSql,
  buildSystemDefaultUpsertParams,
} from "../features/schemas/system_default.schema";
import {
  customerUpsertSql,
  buildCustomerUpsertParams,
} from "../features/schemas/customers.schema";
import {
  orderUpsertSql,
  buildOrderUpsertParams,
} from "../features/schemas/order.schema";
import {
  cartUpsertSql,
  buildCartUpsertParams,
} from "../features/schemas/cart.schema";
import {
  cartItemUpsertSql,
  buildCartItemUpsertParams,
} from "../features/schemas/cart_item.schema";
import {
  createProductRecord,
  buildProductSyncOp,
  ProductCreatePayload,
} from "../features/product/productPersistence";
import { v4 as uuidv4 } from "uuid";
import { LocalUserProfile } from "../types/user.types";
import { SYNC_ACTIONS } from "../types/action.types";

export class DatabaseService {
  private db: Database.Database;

  constructor() {
    const userDataPath = app.getPath("userData");
    const dbPath = path.join(userDataPath, "bountip.db");

    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    this.db = new Database(dbPath);
    this.initConnection(true);
  }

  private initConnection(isInitial = false) {
    if (!isInitial) {
      const userDataPath = app.getPath("userData");
      const dbPath = path.join(userDataPath, "bountip.db");

      // Ensure directory exists
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      this.db = new Database(dbPath);
      console.log("[DatabaseService] Connection re-initialized.");
    }

    // Always run schema init.
    // CREATE TABLE IF NOT EXISTS is safe and ensures new tables
    // added to the code are created in an existing database file.
    this.initSchema();
    this.ensureDeviceId();
  }

  private prepare(sql: string) {
    try {
      return this.db.prepare(sql);
    } catch (error: any) {
      const isReadonly =
        error.code === "SQLITE_READONLY_DBMOVED" ||
        error.message?.includes("readonly database") ||
        error.message?.includes("database is locked");
      const isMissingTable = error.message?.includes("no such table");

      if (isReadonly || isMissingTable) {
        console.warn(
          `[DatabaseService] Database error (${error.code || "MISSING_TABLE"}). Re-initializing connection...`,
        );
        try {
          this.db.close();
        } catch {}
        this.initConnection();
        return this.db.prepare(sql);
      }
      throw error;
    }
  }

  private transaction<T extends any[]>(fn: (...args: T) => void) {
    try {
      return this.db.transaction(fn);
    } catch (error: any) {
      const isReadonly =
        error.code === "SQLITE_READONLY_DBMOVED" ||
        error.message?.includes("readonly database") ||
        error.message?.includes("database is locked");
      const isMissingTable = error.message?.includes("no such table");

      if (isReadonly || isMissingTable) {
        console.warn(
          `[DatabaseService] Transaction error (${error.code || "MISSING_TABLE"}). Re-initializing connection...`,
        );
        try {
          this.db.close();
        } catch {}
        this.initConnection();
        return this.db.transaction(fn);
      }
      throw error;
    }
  }

  private ensureDeviceId() {
    const row = this.prepare("SELECT value FROM identity WHERE key = ?").get(
      "device_id",
    ) as { value: string } | undefined;

    if (!row) {
      const deviceId = uuidv4();
      this.prepare(
        "INSERT OR REPLACE INTO identity (key, value) VALUES (?, ?)",
      ).run("device_id", JSON.stringify({ deviceId }));
      console.log("[DatabaseService] Generated new deviceId:", deviceId);
    } else {
      console.log("[DatabaseService] Existing deviceId loaded.");
    }
  }

  clearAllData() {
    try {
      if (this.db) {
        this.db.close();
      }
      const userDataPath = app.getPath("userData");
      const dbPath = path.join(userDataPath, "bountip.db");
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }

      // Re-initialize for subsequent use if app doesn't restart immediately
      // But typically we restart the app after this.
    } catch (error) {
      console.error("Failed to clear database:", error);
      throw error;
    }
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

    // Image Upload Queue Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS image_upload_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        localPath TEXT,
        tableName TEXT,
        recordId TEXT,
        columnName TEXT,
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

    this.runMigrations();
  }

  private runMigrations() {
    // Migration: Add offline image columns to business_outlet
    try {
      this.db.exec(
        "ALTER TABLE business_outlet ADD COLUMN isOfflineImage INTEGER DEFAULT 0",
      );
    } catch (e: any) {
      // Ignore if column already exists
      if (!e.message.includes("duplicate column name")) {
        console.error("Migration error (isOfflineImage):", e);
      }
    }

    try {
      this.db.exec("ALTER TABLE business_outlet ADD COLUMN localLogoPath TEXT");
    } catch (e: any) {
      if (!e.message.includes("duplicate column name")) {
        console.error("Migration error (localLogoPath):", e);
      }
    }

    // Migration: Add missing columns to system_default
    const systemDefaultColumns = ["recordId", "version"];
    for (const col of systemDefaultColumns) {
      try {
        const type = col === "version" ? "INTEGER DEFAULT 0" : "TEXT";
        this.db.exec(`ALTER TABLE system_default ADD COLUMN ${col} ${type}`);
      } catch (e: any) {
        if (!e.message.includes("duplicate column name")) {
          console.error(`Migration error (system_default.${col}):`, e);
        }
      }
    }

    // Migration: Add missing columns to customers
    const customerColumns = ["reason", "recordId", "version"];
    for (const col of customerColumns) {
      try {
        const type = col === "version" ? "INTEGER DEFAULT 0" : "TEXT";
        this.db.exec(`ALTER TABLE customers ADD COLUMN ${col} ${type}`);
      } catch (e: any) {
        if (!e.message.includes("duplicate column name")) {
          console.error(`Migration error (customers.${col}):`, e);
        }
      }
    }

    // Migration: Add missing columns to orders
    const orderColumns = ["cartId", "recordId", "version"];
    for (const col of orderColumns) {
      try {
        const type = col === "version" ? "INTEGER DEFAULT 0" : "TEXT";
        this.db.exec(`ALTER TABLE orders ADD COLUMN ${col} ${type}`);
      } catch (e: any) {
        if (!e.message.includes("duplicate column name")) {
          console.error(`Migration error (orders.${col}):`, e);
        }
      }
    }

    // Migration: Add missing columns to cart
    const cartColumns = [
      "outletId",
      "itemCount",
      "totalQuantity",
      "totalAmount",
      "customerId",
      "recordId",
      "version",
    ];
    for (const col of cartColumns) {
      try {
        let type = "TEXT";
        if (col === "version" || col === "itemCount" || col === "totalQuantity")
          type = "INTEGER DEFAULT 0";
        if (col === "totalAmount") type = "REAL DEFAULT 0";

        this.db.exec(`ALTER TABLE cart ADD COLUMN ${col} ${type}`);
      } catch (e: any) {
        if (!e.message.includes("duplicate column name")) {
          console.error(`Migration error (cart.${col}):`, e);
        }
      }
    }

    // Migration: Add missing columns to cart_item
    const cartItemColumns = [
      "cartId",
      "priceTierDiscount",
      "priceTierMarkup",
      "recordId",
      "version",
    ];
    for (const col of cartItemColumns) {
      try {
        let type = "TEXT";
        if (col === "version") type = "INTEGER DEFAULT 0";
        if (col === "priceTierDiscount" || col === "priceTierMarkup")
          type = "REAL DEFAULT 0";

        this.db.exec(`ALTER TABLE cart_item ADD COLUMN ${col} ${type}`);
      } catch (e: any) {
        if (!e.message.includes("duplicate column name")) {
          console.error(`Migration error (cart_item.${col}):`, e);
        }
      }
    }
  }

  close() {
    if (this.db) {
      this.db.close();
      console.log("[DatabaseService] Database closed.");
    }
  }

  query(sql: string, params: any[] = []) {
    try {
      const stmt = this.prepare(sql);
      if (stmt.reader) {
        return stmt.all(params);
      } else {
        return stmt.run(params);
      }
    } catch (error) {
      console.error("DB Query Error:", error);
      throw error;
    }
  }

  // Identity Methods
  getIdentity(): any {
    const row = this.prepare("SELECT value FROM identity WHERE key = ?").get(
      "user_identity",
    ) as { value: string } | undefined;
    return row ? JSON.parse(row.value) : null;
  }

  saveIdentity(identity: any) {
    const current = this.getIdentity() || {};
    const updated = { ...current, ...identity };
    this.prepare(
      "INSERT OR REPLACE INTO identity (key, value) VALUES (?, ?)",
    ).run("user_identity", JSON.stringify(updated));

    // If the identity contains user information, also update the user table
    // while ensuring only one row exists.
    if (identity.id || identity.email || identity.fullName) {
      try {
        const u = {
          ...updated,
          id: updated.id ?? updated.userId ?? updated.user?.id,
          email: updated.email ?? updated.user?.email,
          fullName: updated.fullName ?? updated.user?.fullName,
        };

        if (u.id) {
          this.prepare("DELETE FROM user").run();
          this.prepare(userUpsertSql).run(
            this.sanitize(buildUserUpsertParams(u)),
          );
        }
      } catch (err) {
        console.error("Failed to sync identity to user table:", err);
      }
    }
  }

  private toSqliteValue(value: any) {
    if (value === null || value === undefined) return null;
    const t = typeof value;
    if (t === "number" || t === "string" || t === "bigint") return value;
    if (typeof Buffer !== "undefined" && (Buffer as any).isBuffer?.(value)) {
      return value;
    }
    if (value instanceof Date) return value.toISOString();
    if (t === "boolean") return value ? 1 : 0;
    return JSON.stringify(value);
  }

  private sanitize(obj: any) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      result[key] = this.toSqliteValue(val);
    }
    return result;
  }

  getUserProfile(): LocalUserProfile {
    const identity = this.getIdentity();
    const row = this.prepare("SELECT * FROM user LIMIT 1").get() as
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

    const row = this.prepare("SELECT id FROM user LIMIT 1").get() as
      | { id?: string }
      | undefined;
    if (row && row.id) return String(row.id);

    return null;
  }

  saveLoginHash(hash: string) {
    this.prepare(
      "INSERT OR REPLACE INTO identity (key, value) VALUES (?, ?)",
    ).run("login_hash", JSON.stringify({ hash }));
  }

  getLoginHash(): string | null {
    const row = this.prepare("SELECT value FROM identity WHERE key = ?").get(
      "login_hash",
    ) as { value: string } | undefined;
    if (!row) return null;
    try {
      const parsed = JSON.parse(row.value) as { hash?: string };
      return parsed.hash ?? null;
    } catch {
      return null;
    }
  }

  savePinHash(hash: string) {
    this.prepare(
      "INSERT OR REPLACE INTO identity (key, value) VALUES (?, ?)",
    ).run("pin_hash", JSON.stringify({ hash }));
  }

  getPinHash(): string | null {
    const row = this.prepare("SELECT value FROM identity WHERE key = ?").get(
      "pin_hash",
    ) as { value: string } | undefined;
    if (!row) return null;
    try {
      const parsed = JSON.parse(row.value) as { hash?: string };
      return parsed.hash ?? null;
    } catch {
      return null;
    }
  }

  getDeviceId(): string | null {
    const row = this.prepare("SELECT value FROM identity WHERE key = ?").get(
      "device_id",
    ) as { value: string } | undefined;
    if (!row) return null;
    try {
      const parsed = JSON.parse(row.value) as { deviceId?: string };
      return parsed.deviceId ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Gets the next global sync version and increments the counter in the database.
   * This ensures a strictly increasing integer for all sync operations.
   */
  getNextSyncVersion(): number {
    const row = this.prepare("SELECT value FROM identity WHERE key = ?").get(
      "last_sync_version",
    ) as { value: string } | undefined;

    let currentVersion = 1;
    if (row) {
      try {
        const parsed = JSON.parse(row.value) as { version?: number };
        currentVersion = parsed.version ?? 1;
      } catch {}
    }

    const nextVersion = currentVersion + 1;
    this.prepare(
      "INSERT OR REPLACE INTO identity (key, value) VALUES (?, ?)",
    ).run("last_sync_version", JSON.stringify({ version: nextVersion }));

    return nextVersion;
  }

  // Cache Methods
  getCache(key: string): any {
    const row = this.prepare("SELECT value FROM cache WHERE key = ?").get(
      key,
    ) as { value: string } | undefined;
    return row ? JSON.parse(row.value) : null;
  }

  putCache(key: string, value: any) {
    this.prepare("INSERT OR REPLACE INTO cache (key, value) VALUES (?, ?)").run(
      key,
      JSON.stringify(value),
    );
  }

  // Image Queue Methods
  addToImageQueue(item: {
    localPath: string;
    tableName: string;
    recordId: string;
    columnName: string;
  }) {
    this.prepare(
      "INSERT INTO image_upload_queue (localPath, tableName, recordId, columnName, status) VALUES (@localPath, @tableName, @recordId, @columnName, 'pending')",
    ).run(item);
  }

  getPendingImageUploads() {
    return this.prepare(
      "SELECT * FROM image_upload_queue WHERE status = 'pending'",
    ).all() as any[];
  }

  markImageAsUploaded(id: number) {
    this.prepare("DELETE FROM image_upload_queue WHERE id = ?").run(id);
  }

  failImageUpload(id: number, error: string) {
    this.prepare(
      "UPDATE image_upload_queue SET status = 'failed', last_error = ? WHERE id = ?",
    ).run(error, id);
  }

  updateRecordColumn(
    tableName: string,
    recordId: string,
    columnName: string,
    value: any,
  ) {
    // Basic safety check for table name to prevent arbitrary SQL injection
    // In a real app, whitelist tables.
    if (/[^a-zA-Z0-9_]/.test(tableName) || /[^a-zA-Z0-9_]/.test(columnName)) {
      console.error(
        `[DatabaseService] Invalid table/column name: ${tableName}.${columnName}`,
      );
      return;
    }

    const now = new Date().toISOString();
    // Also clear the offline flag if it was an image upload
    // But we don't know if it's an image upload here generically.
    // However, for business_outlet logo, we usually set isOfflineImage = 0.
    // We can do that in SyncService or here if we detect it.
    // Let's just do the update here.
    const sql = `UPDATE ${tableName} SET ${columnName} = ?, updatedAt = ? WHERE id = ?`;
    this.prepare(sql).run(value, now, recordId);
  }

  // Queue Methods
  addToQueue(op: any) {
    // Avoid duplicates if op is identical?
    // For now, append is fine.
    this.prepare("INSERT INTO sync_queue (op, status) VALUES (?, ?)").run(
      JSON.stringify(op),
      "pending",
    );
  }

  // System Default Methods
  getSystemDefaults(key: string, outletId?: string) {
    if (outletId) {
      return this.prepare(
        "SELECT * FROM system_default WHERE key = ? AND outletId = ?",
      ).all(key, outletId) as any[];
    }
    return this.prepare("SELECT * FROM system_default WHERE key = ?").all(
      key,
    ) as any[];
  }

  addSystemDefault(key: string, data: any, outletId: string) {
    const id = uuidv4();
    const record = {
      id,
      key,
      data: JSON.stringify(data),
      outletId,
      recordId: null,
      version: 0,
    };

    this.prepare(
      "INSERT INTO system_default (id, key, data, outletId, recordId, version) VALUES (@id, @key, @data, @outletId, @recordId, @version)",
    ).run(record);

    // 2. Queue Sync
    console.log(`[DatabaseService] Queuing sync for system_default: ${key}`);
    this.addToQueue({
      table: "system_default",
      action: SYNC_ACTIONS.CREATE,
      data: {
        ...record,
        data: data, // Send parsed data to sync
      },
      id: id,
    });

    return record;
  }

  deleteSystemDefault(id: string) {
    const record = this.prepare(
      "SELECT * FROM system_default WHERE id = ?",
    ).get(id) as any;

    this.prepare("DELETE FROM system_default WHERE id = ?").run(id);

    if (record) {
      console.log(
        `[DatabaseService] Queuing sync for system_default delete: ${id}`,
      );
      this.addToQueue({
        table: "system_default",
        action: SYNC_ACTIONS.DELETE,
        data: record,
        id: id,
      });
    }
  }

  getPendingQueue() {
    const rows = this.prepare(
      "SELECT op FROM sync_queue WHERE status = 'pending' ORDER BY id ASC",
    ).all() as { op: string }[];
    return rows.map((r) => JSON.parse(r.op));
  }

  // Get Raw Queue Items with ID
  getPendingQueueItems() {
    return this.prepare(
      "SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY id ASC",
    ).all();
  }

  markAsSynced(ids: number[]) {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => "?").join(",");
    this.prepare(`DELETE FROM sync_queue WHERE id IN (${placeholders})`).run(
      ...ids,
    );
  }

  markAsFailed(id: number, error: string) {
    // Increment retry count, if > 3 mark as dead letter?
    // User said: "if i had an api request that got an error, no need to retry it again"
    // So we mark it as failed immediately and stop trying.
    this.prepare(
      "UPDATE sync_queue SET status = 'failed', last_error = ? WHERE id = ?",
    ).run(error, id);
  }

  clearQueue() {
    this.prepare("DELETE FROM sync_queue").run();
  }

  setQueue(list: any[]) {
    const insert = this.prepare(
      "INSERT INTO sync_queue (op, status) VALUES (?, ?)",
    );
    const clear = this.prepare("DELETE FROM sync_queue");

    const transaction = this.transaction((ops) => {
      clear.run();
      for (const op of ops) insert.run(JSON.stringify(op), "pending");
    });

    transaction(list);
    return true;
  }

  saveOutletOnboarding(payload: {
    outletId: string;
    data: {
      country: string;
      address: string;
      businessType: string;
      currency: string;
      revenueRange: string;
      logoUrl: string;
      isOfflineImage?: number;
      localLogoPath?: string;
    };
  }) {
    const now = new Date().toISOString();
    this.prepare(
      `
        UPDATE business_outlet
        SET
          country = COALESCE(@country, country),
          address = COALESCE(@address, address),
          businessType = COALESCE(@businessType, businessType),
          currency = COALESCE(@currency, currency),
          revenueRange = COALESCE(@revenueRange, revenueRange),
          logoUrl = COALESCE(@logoUrl, logoUrl),
          isOfflineImage = COALESCE(@isOfflineImage, isOfflineImage),
          localLogoPath = COALESCE(@localLogoPath, localLogoPath),
          isOnboarded = 1,
          updatedAt = @updatedAt
        WHERE id = @outletId
      `,
    ).run({
      outletId: payload.outletId,
      country: payload.data.country,
      address: payload.data.address,
      businessType: payload.data.businessType,
      currency: payload.data.currency,
      revenueRange: payload.data.revenueRange,
      logoUrl: payload.data.logoUrl,
      isOfflineImage: payload.data.isOfflineImage,
      localLogoPath: payload.data.localLogoPath,
      updatedAt: now,
    });

    // 2. Queue Sync
    const fullOutlet = this.getOutlet(payload.outletId);
    if (fullOutlet) {
      console.log(
        `[DatabaseService] Queuing sync for onboarded outlet: ${payload.outletId}`,
      );
      this.addToQueue({
        table: "business_outlet",
        action: SYNC_ACTIONS.UPDATE,
        data: fullOutlet,
        id: payload.outletId,
      });
    }
  }

  run(sql: string, params: any = []) {
    return this.prepare(sql).run(params);
  }

  getOfflineImages() {
    return this.prepare(
      "SELECT * FROM business_outlet WHERE isOfflineImage = 1",
    ).all() as any[];
  }

  updateOfflineImage(id: string, logoUrl: string) {
    const now = new Date().toISOString();
    this.prepare(
      "UPDATE business_outlet SET logoUrl = ?, isOfflineImage = 0, localLogoPath = NULL, updatedAt = ? WHERE id = ?",
    ).run(logoUrl, now, id);
  }

  getOutlet(id: string) {
    return this.prepare("SELECT * FROM business_outlet WHERE id = ?").get(
      id,
    ) as any;
  }

  getOutlets() {
    return this.prepare("SELECT * FROM business_outlet").all() as any[];
  }

  getCustomers() {
    return this.prepare("SELECT * FROM customers").all() as any[];
  }

  getPaymentTerms(outletId: string) {
    return this.prepare(
      "SELECT * FROM payment_terms WHERE outletId = ? AND deletedAt IS NULL",
    ).all(outletId) as any[];
  }

  savePaymentTerm(payload: {
    id?: string;
    name: string;
    paymentType: string;
    instantPayment: boolean;
    paymentOnDelivery: boolean;
    paymentInInstallment: any;
    outletId: string;
  }) {
    const id = payload.id || uuidv4();
    const now = new Date().toISOString();

    const data = {
      id,
      name: payload.name,
      paymentType: payload.paymentType,
      instantPayment: payload.instantPayment ? 1 : 0,
      paymentOnDelivery: payload.paymentOnDelivery ? 1 : 0,
      paymentInInstallment: payload.paymentInInstallment
        ? JSON.stringify(payload.paymentInInstallment)
        : null,
      outletId: payload.outletId,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    this.prepare(
      `
      INSERT INTO payment_terms (
        id, name, paymentType, instantPayment, paymentOnDelivery, 
        paymentInInstallment, outletId, version, createdAt, updatedAt, deletedAt
      ) VALUES (
        @id, @name, @paymentType, @instantPayment, @paymentOnDelivery, 
        @paymentInInstallment, @outletId, @version, @createdAt, @updatedAt, @deletedAt
      ) ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        paymentType = excluded.paymentType,
        instantPayment = excluded.instantPayment,
        paymentOnDelivery = excluded.paymentOnDelivery,
        paymentInInstallment = excluded.paymentInInstallment,
        version = version + 1,
        updatedAt = excluded.updatedAt
    `,
    ).run(data);

    // Queue Sync
    this.addToQueue({
      table: "payment_terms",
      action: payload.id ? SYNC_ACTIONS.UPDATE : SYNC_ACTIONS.CREATE,
      data: {
        ...data,
        paymentInInstallment: payload.paymentInInstallment, // Send original object to sync
      },
      id,
    });

    return data;
  }

  deletePaymentTerm(id: string) {
    const now = new Date().toISOString();
    this.prepare("UPDATE payment_terms SET deletedAt = ? WHERE id = ?").run(
      now,
      id,
    );

    const record = this.prepare("SELECT * FROM payment_terms WHERE id = ?").get(
      id,
    ) as any;

    if (record) {
      this.addToQueue({
        table: "payment_terms",
        action: SYNC_ACTIONS.DELETE,
        data: record,
        id,
      });
    }
  }

  getBusinesses() {
    return this.prepare("SELECT * FROM business").all() as any[];
  }

  applyPullData(payload: {
    currentTimestamp: string;
    data: any;
    syncType?: "full" | "incremental";
  }) {
    const { data } = payload;

    const tx = this.transaction(() => {
      if (Array.isArray(data.carts) && data.carts.length > 0) {
        const stmt = this.prepare(cartUpsertSql);
        for (const c of data.carts) {
          stmt.run(this.sanitize(buildCartUpsertParams(c)));
        }
      }

      if (Array.isArray(data.cartItems) && data.cartItems.length > 0) {
        const stmt = this.prepare(cartItemUpsertSql);
        for (const ci of data.cartItems) {
          stmt.run(this.sanitize(buildCartItemUpsertParams(ci)));
        }
      }

      if (data.user) {
        const u = data.user;
        // Ensure only one user exists in the local database
        this.prepare("DELETE FROM user").run();
        this.prepare(userUpsertSql).run(
          this.sanitize(buildUserUpsertParams(u)),
        );
      }

      if (Array.isArray(data.businesses) && data.businesses.length > 0) {
        const stmt = this.prepare(businessUpsertSql);

        for (const b of data.businesses) {
          stmt.run(this.sanitize(buildBusinessUpsertParams(b)));
        }
      }

      if (Array.isArray(data.outlets) && data.outlets.length > 0) {
        const stmt = this.prepare(businessOutletUpsertSql);

        for (const o of data.outlets) {
          stmt.run(this.sanitize(buildBusinessOutletUpsertParams(o)));
        }
      }

      if (Array.isArray(data.products) && data.products.length > 0) {
        const stmt = this.prepare(productUpsertSql);

        for (const p of data.products) {
          stmt.run(this.sanitize(buildProductUpsertParams(p)));
        }
      }

      if (
        Array.isArray(data.systemDefaults) &&
        data.systemDefaults.length > 0
      ) {
        const stmt = this.prepare(systemDefaultUpsertSql);

        for (const s of data.systemDefaults) {
          stmt.run(this.sanitize(buildSystemDefaultUpsertParams(s)));
        }
      }

      if (Array.isArray(data.customers) && data.customers.length > 0) {
        const stmt = this.prepare(customerUpsertSql);

        for (const c of data.customers) {
          stmt.run(this.sanitize(buildCustomerUpsertParams(c)));
        }
      }

      if (Array.isArray(data.orders) && data.orders.length > 0) {
        const stmt = this.prepare(orderUpsertSql);

        for (const o of data.orders) {
          stmt.run(this.sanitize(buildOrderUpsertParams(o)));
        }
      }

      if (Array.isArray(data.paymentTerms) && data.paymentTerms.length > 0) {
        const stmt = this.prepare(`
          INSERT INTO payment_terms (
            id, name, paymentType, instantPayment, paymentOnDelivery, 
            paymentInInstallment, outletId, recordId, version, 
            createdAt, updatedAt, deletedAt
          ) VALUES (
            @id, @name, @paymentType, @instantPayment, @paymentOnDelivery, 
            @paymentInInstallment, @outletId, @recordId, @version, 
            @createdAt, @updatedAt, @deletedAt
          ) ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            paymentType = excluded.paymentType,
            instantPayment = excluded.instantPayment,
            paymentOnDelivery = excluded.paymentOnDelivery,
            paymentInInstallment = excluded.paymentInInstallment,
            outletId = excluded.outletId,
            recordId = excluded.recordId,
            version = excluded.version,
            updatedAt = excluded.updatedAt,
            deletedAt = excluded.deletedAt
          WHERE excluded.version >= payment_terms.version OR excluded.updatedAt >= payment_terms.updatedAt OR payment_terms.updatedAt IS NULL
        `);

        for (const pt of data.paymentTerms) {
          stmt.run({
            id: pt.id,
            name: pt.name,
            paymentType: pt.paymentType,
            instantPayment: pt.instantPayment ? 1 : 0,
            paymentOnDelivery: pt.paymentOnDelivery ? 1 : 0,
            paymentInInstallment: pt.paymentInInstallment
              ? JSON.stringify(pt.paymentInInstallment)
              : null,
            outletId: pt.outletId,
            recordId: pt.recordId,
            version: pt.version,
            createdAt: pt.createdAt,
            updatedAt: pt.updatedAt,
            deletedAt: pt.deletedAt,
          });
        }
      }
    });

    tx();
  }

  createProduct(payload: ProductCreatePayload) {
    const id = payload.id || uuidv4();
    const now = new Date().toISOString();
    const row = createProductRecord(this.db, payload, id, now);
    const syncOp = buildProductSyncOp(row, id, now);
    this.addToQueue(syncOp);
    return { id };
  }

  bulkCreateProducts(payload: {
    outletId: string;
    data: ProductCreatePayload[];
  }) {
    const { outletId, data } = payload;
    const now = new Date().toISOString();
    const createdIds: string[] = [];

    const tx = this.transaction(() => {
      for (const p of data) {
        const id = p.id || uuidv4();
        // Ensure outletId is set
        const productPayload = { ...p, outletId };
        const row = createProductRecord(this.db, productPayload, id, now);
        const syncOp = buildProductSyncOp(row, id, now);
        this.addToQueue(syncOp);
        createdIds.push(id);
      }
    });

    tx();

    return { ids: createdIds, status: "success", count: createdIds.length };
  }

  bulkCreateCustomers(payload: { outletId: string; data: any[] }) {
    const { outletId, data } = payload;
    const now = new Date().toISOString();
    const createdIds: string[] = [];

    const tx = this.transaction(() => {
      const stmt = this.prepare(customerUpsertSql);
      for (const c of data) {
        const id = c.id || uuidv4();
        const customerData = {
          ...c,
          id,
          outletId,
          createdAt: c.createdAt || now,
          updatedAt: now,
          status: c.status || "active",
          customerType: c.customerType || "individual",
          emailVerified: c.emailVerified ? 1 : 0,
          phoneVerfied: c.phoneVerfied ? 1 : 0,
          version: c.version || 1,
        };

        const params = buildCustomerUpsertParams(customerData);
        stmt.run(params);

        this.addToQueue({
          table: "customers",
          action: SYNC_ACTIONS.CREATE,
          data: customerData,
          id,
        });

        createdIds.push(id);
      }
    });

    tx();

    return { ids: createdIds, status: "success", count: createdIds.length };
  }

  upsertCustomer(payload: any) {
    const id = payload.id || uuidv4();
    const now = new Date().toISOString();
    const params = this.sanitize(buildCustomerUpsertParams(payload));

    this.prepare(customerUpsertSql).run(params);

    this.addToQueue({
      table: "customers",
      action: payload.createdAt === payload.updatedAt ? SYNC_ACTIONS.CREATE : SYNC_ACTIONS.UPDATE,
      data: payload,
      id,
    });

    return { id };
  }

  /**
   * Wipes all user-specific data from the local database.
   * This is used when a new user logs in to prevent cross-user data leakage.
   */
  wipeUserData() {
    console.log("[DatabaseService] Wiping user data for fresh login...");
    const tx = this.transaction(() => {
      // 1. Clear core entity tables
      for (const schema of schemas) {
        this.prepare(`DELETE FROM ${schema.name}`).run();
      }

      // 2. Clear sync and image queues
      this.prepare("DELETE FROM sync_queue").run();
      this.prepare("DELETE FROM image_upload_queue").run();

      // 3. Clear cache and identity (except for device-specific stuff if needed)
      // We keep deviceId if it exists in identity, but wipe user-specific keys
      this.prepare(
        "DELETE FROM identity WHERE key NOT IN ('device_id', 'pin_hash', 'login_hash')",
      ).run();
      this.prepare("DELETE FROM cache").run();
    });

    try {
      tx();
      return true;
    } catch (error) {
      console.error("[DatabaseService] Failed to wipe user data:", error);
      return false;
    }
  }
}
