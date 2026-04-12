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
  usersUpsertSql,
  buildUsersUpsertParams,
} from "../features/schemas/users.schema";
import {
  businessUpsertSql,
  buildBusinessUpsertParams,
} from "../features/schemas/business.schema";
import {
  businessOutletUpsertSql,
  buildBusinessOutletUpsertParams,
} from "../features/schemas/business_outlet.schema";
import {
  businessRoleUpsertSql,
  buildBusinessRoleUpsertParams,
} from "../features/schemas/business-role.schema";
import {
  businessUserUpsertSql,
  buildBusinessUserUpsertParams,
} from "../features/schemas/business_user.schema";
import {
  businessUserRolesBusinessRoleUpsertSql,
  buildBusinessUserRolesBusinessRoleUpsertParams,
} from "../features/schemas/business_user_roles_business_role.schema";
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
  customerAddressUpsertSql,
  buildCustomerAddressUpsertParams,
} from "../features/schemas/customer_address.schema";
import {
  inventoryUpsertSql,
  buildInventoryUpsertParams,
} from "../features/schemas/inventory.schema";
import {
  inventoryItemUpsertSql,
  buildInventoryItemUpsertParams,
} from "../features/schemas/inventory_item.schema";
import {
  itemLotUpsertSql,
  buildItemLotUpsertParams,
} from "../features/schemas/item_lot.schema";
import {
  itemMasterUpsertSql,
  buildItemMasterUpsertParams,
} from "../features/schemas/item_master.schema";
import {
  orderUpsertSql,
  buildOrderUpsertParams,
} from "../features/schemas/order.schema";
import {
  productionUpsertSql,
  buildProductionUpsertParams,
} from "../features/schemas/production.schema";
import {
  productionItemUpsertSql,
  buildProductionItemUpsertParams,
} from "../features/schemas/production_item.schema";
import {
  invoiceUpsertSql,
  buildInvoiceUpsertParams,
} from "../features/schemas/invoice.schema";
import {
  invoiceItemUpsertSql,
  buildInvoiceItemUpsertParams,
} from "../features/schemas/invoice_item.schema";
import {
  supplierUpsertSql,
  buildSupplierUpsertParams,
} from "../features/schemas/supplier.schema";
import {
  supplierItemUpsertSql,
  buildSupplierItemUpsertParams,
} from "../features/schemas/supplier_item.schema";
import {
  componentUpsertSql,
  buildComponentUpsertParams,
} from "../features/schemas/component.schema";
import {
  componentItemUpsertSql,
  buildComponentItemUpsertParams,
} from "../features/schemas/component_item.schema";
import {
  componentLotUpsertSql,
  buildComponentLotUpsertParams,
} from "../features/schemas/component_lot.schema";
import {
  componentLotLogUpsertSql,
  buildComponentLotLogUpsertParams,
} from "../features/schemas/component_lot_log.schema";
import {
  cartUpsertSql,
  buildCartUpsertParams,
} from "../features/schemas/cart.schema";
import {
  cartItemUpsertSql,
  buildCartItemUpsertParams,
} from "../features/schemas/cart_item.schema";
import {
  recipeUpsertSql,
  buildRecipeUpsertParams,
} from "../features/schemas/recipes.schema";
import {
  recipeIngredientUpsertSql,
  buildRecipeIngredientUpsertParams,
} from "../features/schemas/recipe_ingredients.schema";
import {
  recipeVariantUpsertSql,
  buildRecipeVariantUpsertParams,
} from "../features/schemas/recipe_variants.schema";
import {
  modifierUpsertSql,
  buildModifierUpsertParams,
} from "../features/schemas/modifier.schema";
import {
  modifierOptionUpsertSql,
  buildModifierOptionUpsertParams,
} from "../features/schemas/modifier_option.schema";
import {
  productionV2UpsertSql,
  buildProductionV2UpsertParams,
} from "../features/schemas/production_v2.schema";
import {
  productionV2ItemUpsertSql,
  buildProductionV2ItemUpsertParams,
} from "../features/schemas/production_v2_item.schema";
import {
  productionV2TraceUpsertSql,
  buildProductionV2TraceUpsertParams,
} from "../features/schemas/production_v2_trace.schema";
import { v4 as uuidv4 } from "uuid";
import { LocalUserProfile } from "../types/user.types";
import { SYNC_ACTIONS } from "../types/action.types";
import { SystemDefaultType } from "../types/system-default";

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

  public transaction<T extends any[]>(fn: (...args: T) => void) {
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

      // Migration: Ensure 'version' column exists for all schema tables
      try {
        const tableInfo = this.db
          .prepare(`PRAGMA table_info(${schema.name})`)
          .all() as any[];
        const hasVersion = tableInfo.some((col: any) => col.name === "version");

        if (!hasVersion) {
          console.log(
            `[DatabaseService] Migrating table '${schema.name}': adding 'version' column`,
          );
          this.db.exec(
            `ALTER TABLE ${schema.name} ADD COLUMN version INTEGER DEFAULT 0 NOT NULL`,
          );
        }

        // Specific Migration: Ensure 'roleId' and 'createdBy' exist for 'business_user'
        if (schema.name === "business_user") {
          const hasRoleId = tableInfo.some((col: any) => col.name === "roleId");
          const hasCreatedBy = tableInfo.some(
            (col: any) => col.name === "createdBy",
          );

          if (!hasRoleId) {
            console.log(
              "[DatabaseService] Migrating 'business_user': adding 'roleId' column",
            );
            this.db.exec("ALTER TABLE business_user ADD COLUMN roleId TEXT");
          }
          if (!hasCreatedBy) {
            console.log(
              "[DatabaseService] Migrating 'business_user': adding 'createdBy' column",
            );
            this.db.exec("ALTER TABLE business_user ADD COLUMN createdBy TEXT");
          }
        }
      } catch (error) {
        console.error(
          `[DatabaseService] Migration failed for table '${schema.name}':`,
          error,
        );
      }

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
    const customerColumns = [
      "reason",
      "recordId",
      "version",
      "representativeName",
      "address",
      "taxNumber",
      "notes",
    ];
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

    // Migration: Add missing columns to inventory
    const inventoryColumns = ["recordId", "version", "businessId", "outletId"];
    for (const col of inventoryColumns) {
      try {
        let type = "TEXT";
        if (col === "version") type = "INTEGER DEFAULT 0";
        this.db.exec(`ALTER TABLE inventory ADD COLUMN ${col} ${type}`);
      } catch (e: any) {
        if (!e.message.includes("duplicate column name")) {
          console.error(`Migration error (inventory.${col}):`, e);
        }
      }
    }

    // Migration: Add missing columns to inventory_item
    const inventoryItemColumns = ["recordId", "version"];
    for (const col of inventoryItemColumns) {
      try {
        let type = "TEXT";
        if (col === "version") type = "INTEGER DEFAULT 0";
        this.db.exec(`ALTER TABLE inventory_item ADD COLUMN ${col} ${type}`);
      } catch (e: any) {
        if (!e.message.includes("duplicate column name")) {
          console.error(`Migration error (inventory_item.${col}):`, e);
        }
      }
    }

    // Migration: Add missing columns to item_master
    const itemMasterColumns = ["recordId", "version"];
    for (const col of itemMasterColumns) {
      try {
        let type = "TEXT";
        if (col === "version") type = "INTEGER DEFAULT 0";
        this.db.exec(`ALTER TABLE item_master ADD COLUMN ${col} ${type}`);
      } catch (e: any) {
        if (!e.message.includes("duplicate column name")) {
          console.error(`Migration error (item_master.${col}):`, e);
        }
      }
    }

    // Migration: Add missing columns to item_lot
    const itemLotColumns = ["recordId", "version"];
    for (const col of itemLotColumns) {
      try {
        let type = "TEXT";
        if (col === "version") type = "INTEGER DEFAULT 0";
        this.db.exec(`ALTER TABLE item_lot ADD COLUMN ${col} ${type}`);
      } catch (e: any) {
        if (!e.message.includes("duplicate column name")) {
          console.error(`Migration error (item_lot.${col}):`, e);
        }
      }
    }

    // Migration: Add missing columns to customer_address
    const customerAddressColumns = ["recordId", "version"];
    for (const col of customerAddressColumns) {
      try {
        let type = "TEXT";
        if (col === "version") type = "INTEGER DEFAULT 0";
        this.db.exec(`ALTER TABLE customer_address ADD COLUMN ${col} ${type}`);
      } catch (e: any) {
        if (!e.message.includes("duplicate column name")) {
          console.error(`Migration error (customer_address.${col}):`, e);
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

  public sanitize(obj: any) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      result[key] = this.toSqliteValue(val);
    }
    return result;
  }

  public query(sql: string, params: any[] = []) {
    try {
      const stmt = this.prepare(sql);
      if (stmt.reader) {
        return stmt.all(params);
      }
      return stmt.run(params);
    } catch (error) {
      console.error("DB Query Error:", error);
      throw error;
    }
  }

  public run(sql: string, params: any = []) {
    try {
      return this.prepare(sql).run(params);
    } catch (error) {
      console.error("DB Run Error:", error);
      throw error;
    }
  }

  public get(sql: string, params: any[] = []) {
    try {
      return this.prepare(sql).get(params);
    } catch (error) {
      console.error("DB Get Error:", error);
      throw error;
    }
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

  deleteCache(key: string) {
    this.prepare("DELETE FROM cache WHERE key = ?").run(key);
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
    if (/[^a-zA-Z0-9_.]/.test(tableName) || /[^a-zA-Z0-9_.]/.test(columnName)) {
      console.error(
        `[DatabaseService] Invalid table/column name: ${tableName}.${columnName}`,
      );
      return;
    }

    const now = new Date().toISOString();

    // Try to increment version if the column exists
    let sql = "";
    try {
      // Check if version column exists
      const tableInfo = this.prepare(
        `PRAGMA table_info(${tableName})`,
      ).all() as any[];
      const hasVersion = tableInfo.some((col: any) => col.name === "version");

      if (columnName.includes(".")) {
        const parts = columnName.split(".");
        const baseColumn = parts[0];
        const jsonPath = "$." + parts.slice(1).join(".");

        if (hasVersion) {
          sql = `UPDATE ${tableName} SET ${baseColumn} = json_set(COALESCE(${baseColumn}, '{}'), ?, ?), version = COALESCE(version, 0) + 1, updatedAt = ? WHERE id = ?`;
        } else {
          sql = `UPDATE ${tableName} SET ${baseColumn} = json_set(COALESCE(${baseColumn}, '{}'), ?, ?), updatedAt = ? WHERE id = ?`;
        }
        this.prepare(sql).run(jsonPath, value, now, recordId);
      } else {
        if (hasVersion) {
          sql = `UPDATE ${tableName} SET ${columnName} = ?, version = COALESCE(version, 0) + 1, updatedAt = ? WHERE id = ?`;
        } else {
          sql = `UPDATE ${tableName} SET ${columnName} = ?, updatedAt = ? WHERE id = ?`;
        }
        this.prepare(sql).run(value, now, recordId);
      }
    } catch (error) {
      console.error(
        `[DatabaseService] Error updating ${tableName}.${columnName}:`,
        error,
      );
    }
  }

  updateQueueWithNewUrl(
    tableName: string,
    recordId: string,
    columnName: string,
    newUrl: string,
  ) {
    const pending = this.getPendingQueueItems() as any[];
    for (const item of pending) {
      try {
        const op = JSON.parse(item.op);
        const opTable = op.table || op.tableName || op.type;
        const opId = op.recordId || op.id;

        if (opTable === tableName && opId === recordId) {
          // Update the payload with the new URL
          const data = op.data || op.payload || {};

          // Handle nested column names (e.g., "generalSettings.logoUrl")
          const parts = columnName.split(".");
          let current = data;
          for (let i = 0; i < parts.length - 1; i++) {
            if (current[parts[i]] && typeof current[parts[i]] === "object") {
              current = current[parts[i]];
            } else {
              // Path not found, break
              current = null;
              break;
            }
          }

          if (current && typeof current === "object") {
            current[parts[parts.length - 1]] = newUrl;
          }

          // Increment version in the payload if it exists
          if (data.version !== undefined) {
            data.version = (Number(data.version) || 0) + 1;
          }

          // Also clear offline flags if applicable in the payload
          if (tableName === "business_outlet") {
            if (data.isOfflineImage !== undefined) data.isOfflineImage = 0;
            if (data.localLogoPath !== undefined) data.localLogoPath = null;
          }

          // Update the op in the database
          this.prepare("UPDATE sync_queue SET op = ? WHERE id = ?").run(
            JSON.stringify(op),
            item.id,
          );
        }
      } catch (e) {
        console.error("[DatabaseService] Failed to update queue item:", e);
      }
    }
  }

  // Queue Methods
  addToQueue(op: any) {
    // Automatically detect local assets and add them to image upload queue
    this.detectAndQueueAssets(op);

    const tableName = op.table || op.tableName || op.type;
    const recordId = op.id || op.recordId;
    const data = op.data || op.payload || {};

    // Automatically increment version in the database and in the payload
    if (tableName && recordId) {
      try {
        // Use double quotes for table name to handle hyphens (e.g., "item-master")
        const quotedTableName = `"${tableName}"`;

        const tableInfo = this.prepare(
          `PRAGMA table_info(${quotedTableName})`,
        ).all() as any[];
        const hasVersion = tableInfo.some((col: any) => col.name === "version");
        const hasUpdatedAt = tableInfo.some(
          (col: any) => col.name === "updatedAt",
        );
        const hasId = tableInfo.some((col: any) => col.name === "id");

        if (hasVersion && hasId) {
          // 1. Increment version in the database table
          if (hasUpdatedAt) {
            this.prepare(
              `UPDATE ${quotedTableName} SET version = COALESCE(version, 0) + 1, updatedAt = ? WHERE id = ?`,
            ).run(new Date().toISOString(), recordId);
          } else {
            this.prepare(
              `UPDATE ${quotedTableName} SET version = COALESCE(version, 0) + 1 WHERE id = ?`,
            ).run(recordId);
          }

          // 2. Fetch the updated version to put into the payload
          const updatedRecord = this.prepare(
            `SELECT version FROM ${quotedTableName} WHERE id = ?`,
          ).get(recordId) as { version: number } | undefined;

          if (updatedRecord) {
            if (op.data) op.data.version = updatedRecord.version;
            if (op.payload) op.payload.version = updatedRecord.version;
            // Handle cases where data is at the root of op
            if (!op.data && !op.payload && op.version !== undefined) {
              op.version = updatedRecord.version;
            }
          }
        }
      } catch (error) {
        // Silently fail if table doesn't exist or other issues
        console.warn(
          `[DatabaseService] Could not auto-increment version for ${tableName}:`,
          error,
        );
      }
    }

    // Avoid duplicates if op is identical?
    // For now, append is fine.
    this.prepare("INSERT INTO sync_queue (op, status) VALUES (?, ?)").run(
      JSON.stringify(op),
      "pending",
    );
  }

  private detectAndQueueAssets(op: any) {
    const tableName = op.table || op.tableName || op.type;
    const recordId = op.id || op.recordId;
    const data = op.data || op.payload || {};

    if (!tableName || !recordId || !data) return;

    // We only care about strings starting with asset:///
    const scan = (obj: any, path: string = "") => {
      if (typeof obj === "string" && obj.startsWith("asset:///")) {
        console.log(
          `[DatabaseService] Detected local asset in ${tableName}.${path}: ${obj}`,
        );
        this.addToImageQueue({
          localPath: obj,
          tableName,
          recordId,
          columnName: path || "unknown", // If nested, path might be complex, but processOfflineImages handles specific columns
        });
      } else if (obj && typeof obj === "object") {
        for (const [key, value] of Object.entries(obj)) {
          scan(value, path ? `${path}.${key}` : key);
        }
      }
    };

    scan(data);
  }

  // System Default Methods
  getRecord(tableName: string, id: string) {
    if (/[^a-zA-Z0-9_]/.test(tableName)) return null;
    try {
      const cols = this.prepare(
        `PRAGMA table_info(${tableName})`,
      ).all() as any[];
      const hasId = cols.some((c: any) => c.name === "id");
      if (!hasId) return null;
    } catch {
      return null;
    }
    return this.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(
      id,
    ) as any;
  }

  getSystemDefaults(key: string, outletId?: string) {
    if (outletId) {
      return this.prepare(
        "SELECT * FROM system_default WHERE key = ? AND (outletId = ? OR outletId IS NULL)",
      ).all(key, outletId) as any[];
    }
    return this.prepare("SELECT * FROM system_default WHERE key = ?").all(
      key,
    ) as any[];
  }

  addSystemDefault(key: string, data: any, outletId: string) {
    const keysRequiringArray: readonly string[] = [
      SystemDefaultType.ITEM_CATEGORY,
      SystemDefaultType.INVENTORY_UNIT,
    ];

    const isArrayKey = keysRequiringArray.includes(key);

    // 1. Check if a row already exists for this key and outlet
    const existing = this.prepare(
      "SELECT * FROM system_default WHERE key = ? AND outletId = ?",
    ).get(key, outletId) as any;

    if (existing && isArrayKey) {
      // APPEND LOGIC
      let currentData: any[] = [];
      try {
        currentData = JSON.parse(existing.data);
        if (!Array.isArray(currentData)) currentData = [currentData];
      } catch {
        currentData = [];
      }

      // Check for duplicates (by name)
      const exists = currentData.some(
        (item) => item.name?.toLowerCase() === data.name?.toLowerCase(),
      );
      if (exists) return existing;

      const updatedData = [...currentData, data];
      const nextVersion = (existing.version || 0) + 1;

      this.prepare(
        "UPDATE system_default SET data = ?, version = ? WHERE id = ?",
      ).run(JSON.stringify(updatedData), nextVersion, existing.id);

      const record = {
        ...existing,
        data: JSON.stringify(updatedData),
        version: nextVersion,
      };

      // Queue Sync (UPDATE)
      this.addToQueue({
        table: "system_default",
        action: SYNC_ACTIONS.UPDATE,
        data: {
          ...record,
          data: updatedData,
        },
        id: existing.id,
      });

      return record;
    }

    // CREATE LOGIC (New row)
    const id = uuidv4();
    const finalData = isArrayKey ? [data] : data;
    const record = {
      id,
      key,
      data: JSON.stringify(finalData),
      outletId,
      recordId: null,
      version: 0,
    };

    this.prepare(
      "INSERT INTO system_default (id, key, data, outletId, recordId, version) VALUES (@id, @key, @data, @outletId, @recordId, @version)",
    ).run(record);

    // 2. Queue Sync (CREATE)
    console.log(`[DatabaseService] Queuing sync for system_default: ${key}`);
    this.addToQueue({
      table: "system_default",
      action: SYNC_ACTIONS.CREATE,
      data: {
        ...record,
        data: finalData,
      },
      id: id,
    });

    return record;
  }

  deleteSystemDefault(id: string, itemValue?: string) {
    const record = this.prepare(
      "SELECT * FROM system_default WHERE id = ?",
    ).get(id) as any;

    if (!record) return;

    const keysRequiringArray: readonly string[] = [
      SystemDefaultType.ITEM_CATEGORY,
      SystemDefaultType.INVENTORY_UNIT,
    ];
    const isArrayKey = keysRequiringArray.includes(record.key);

    if (isArrayKey && itemValue) {
      // SUBTRACT LOGIC (Update existing row by removing one item from array)
      let currentData: any[] = [];
      try {
        currentData = JSON.parse(record.data);
        if (!Array.isArray(currentData)) currentData = [currentData];
      } catch {
        currentData = [];
      }

      const updatedData = currentData.filter(
        (item) => (item.name || item).toLowerCase() !== itemValue.toLowerCase(),
      );

      // If array is now empty, we might want to delete the whole row or just keep empty array
      // Requirements suggest sending back "other data without it", implying row remains.
      const nextVersion = (record.version || 0) + 1;

      this.prepare(
        "UPDATE system_default SET data = ?, version = ? WHERE id = ?",
      ).run(JSON.stringify(updatedData), nextVersion, id);

      const updatedRecord = {
        ...record,
        data: JSON.stringify(updatedData),
        version: nextVersion,
      };

      this.addToQueue({
        table: "system_default",
        action: SYNC_ACTIONS.UPDATE,
        data: {
          ...updatedRecord,
          data: updatedData,
        },
        id: id,
      });
      return;
    }

    // FULL DELETE LOGIC
    this.prepare("DELETE FROM system_default WHERE id = ?").run(id);

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

  updateBusinessLogo(id: string, logoUrl: string) {
    const now = new Date().toISOString();
    this.prepare(
      "UPDATE business_outlet SET logoUrl = ?, isOfflineImage = 0, localLogoPath = NULL, updatedAt = ? WHERE id = ?",
    ).run(logoUrl, now, id);
  }

  applyPullData(payload: {
    currentTimestamp: string;
    data: any;
    syncType?: "full" | "incremental";
  }) {
    const { data, syncType = "incremental" } = payload;

    const tx = this.transaction(() => {
      const isFullSync = syncType === "full";
      const resetTableIfFullAndProvided = (key: string, table: string) => {
        if (!isFullSync) return;
        if (Array.isArray((data as any)?.[key])) {
          this.prepare(`DELETE FROM ${table}`).run();
        }
      };

      resetTableIfFullAndProvided("cartItems", "cart_item");
      resetTableIfFullAndProvided("carts", "cart");
      resetTableIfFullAndProvided("users", "users");

      resetTableIfFullAndProvided(
        "businessUserRolesBusinessRole",
        "business_user_roles_business_role",
      );
      resetTableIfFullAndProvided("businessUsers", "business_user");
      resetTableIfFullAndProvided("businessRoles", "business_role");
      resetTableIfFullAndProvided("businesses", "business");
      resetTableIfFullAndProvided("outlets", "business_outlet");

      resetTableIfFullAndProvided("modifierOptions", "modifier_option");
      resetTableIfFullAndProvided("modifiers", "modifier");
      resetTableIfFullAndProvided("recipeIngredients", "recipe_ingredients");
      resetTableIfFullAndProvided("recipeVariants", "recipe_variants");
      resetTableIfFullAndProvided("recipes", "recipes");
      resetTableIfFullAndProvided("products", "product");
      resetTableIfFullAndProvided("systemDefaults", "system_default");

      resetTableIfFullAndProvided("customerAddresses", "customer_address");
      resetTableIfFullAndProvided("customers", "customers");

      resetTableIfFullAndProvided("inventoryItems", "inventory_item");
      resetTableIfFullAndProvided("inventories", "inventory");
      resetTableIfFullAndProvided("itemLots", "item_lot");
      resetTableIfFullAndProvided("itemMasters", "item_master");

      resetTableIfFullAndProvided("invoiceItems", "invoice_items");
      resetTableIfFullAndProvided("invoices", "invoices");

      resetTableIfFullAndProvided("productionItems", "production_items");
      resetTableIfFullAndProvided("productions", "productions");
      resetTableIfFullAndProvided("productionV2Items", "production_v2_items");
      resetTableIfFullAndProvided("productionV2Traces", "production_v2_traces");
      resetTableIfFullAndProvided("productionsV2", "productions_v2");

      resetTableIfFullAndProvided("supplierItems", "supplier_items");
      resetTableIfFullAndProvided("suppliers", "suppliers");

      resetTableIfFullAndProvided("componentItems", "component_items");
      resetTableIfFullAndProvided("componentLotLogs", "component_lot_logs");
      resetTableIfFullAndProvided("componentLots", "component_lots");
      resetTableIfFullAndProvided("components", "components");

      resetTableIfFullAndProvided("orders", "orders");
      resetTableIfFullAndProvided("paymentTerms", "payment_terms");

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

      const activeUser = data.user || data.primaryUser;
      if (activeUser) {
        // Ensure only one user exists in the local database (current session user)
        this.prepare("DELETE FROM user").run();
        this.prepare(userUpsertSql).run(
          this.sanitize(buildUserUpsertParams(activeUser)),
        );
      }

      if (Array.isArray(data.users) && data.users.length > 0) {
        const stmt = this.prepare(usersUpsertSql);
        for (const u of data.users) {
          stmt.run(this.sanitize(buildUsersUpsertParams(u)));
        }
      }

      if (Array.isArray(data.businesses) && data.businesses.length > 0) {
        const stmt = this.prepare(businessUpsertSql);

        for (const b of data.businesses) {
          stmt.run(this.sanitize(buildBusinessUpsertParams(b)));
        }
      }

      if (Array.isArray(data.businessRoles) && data.businessRoles.length > 0) {
        const stmt = this.prepare(businessRoleUpsertSql);
        for (const br of data.businessRoles) {
          stmt.run(this.sanitize(buildBusinessRoleUpsertParams(br)));
        }
      }

      if (Array.isArray(data.businessUsers) && data.businessUsers.length > 0) {
        const stmt = this.prepare(businessUserUpsertSql);
        for (const bu of data.businessUsers) {
          stmt.run(this.sanitize(buildBusinessUserUpsertParams(bu)));
        }
      }

      if (
        Array.isArray(data.businessUserRolesBusinessRole) &&
        data.businessUserRolesBusinessRole.length > 0
      ) {
        const stmt = this.prepare(businessUserRolesBusinessRoleUpsertSql);
        for (const burbr of data.businessUserRolesBusinessRole) {
          stmt.run(
            this.sanitize(
              buildBusinessUserRolesBusinessRoleUpsertParams(burbr),
            ),
          );
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

      if (Array.isArray(data.modifiers) && data.modifiers.length > 0) {
        const stmt = this.prepare(modifierUpsertSql);
        for (const m of data.modifiers) {
          stmt.run(this.sanitize(buildModifierUpsertParams(m)));
        }
      }

      if (
        Array.isArray(data.modifierOptions) &&
        data.modifierOptions.length > 0
      ) {
        const stmt = this.prepare(modifierOptionUpsertSql);
        for (const mo of data.modifierOptions) {
          stmt.run(this.sanitize(buildModifierOptionUpsertParams(mo)));
        }
      }

      if (Array.isArray(data.recipes) && data.recipes.length > 0) {
        const stmt = this.prepare(recipeUpsertSql);
        const productNameById = this.prepare(
          "SELECT name FROM product WHERE id = ? OR productCode = ? LIMIT 1",
        );

        for (const r0 of data.recipes) {
          const productRef =
            r0.productReference || r0.productId || r0.product_id || "";
          let productName = r0.productName || "";
          if (!productName && productRef) {
            const row = productNameById.get(productRef, productRef) as
              | { name?: string }
              | undefined;
            if (row?.name) productName = String(row.name);
          }

          const r = {
            ...r0,
            productReference: productRef,
            productName,
          };
          stmt.run(this.sanitize(buildRecipeUpsertParams(r)));
        }
      }

      if (
        Array.isArray(data.recipeIngredients) &&
        data.recipeIngredients.length > 0
      ) {
        const stmt = this.prepare(recipeIngredientUpsertSql);
        for (const ri of data.recipeIngredients) {
          stmt.run(this.sanitize(buildRecipeIngredientUpsertParams(ri)));
        }
      }

      if (
        Array.isArray(data.recipeVariants) &&
        data.recipeVariants.length > 0
      ) {
        const stmt = this.prepare(recipeVariantUpsertSql);
        for (const rv of data.recipeVariants) {
          stmt.run(this.sanitize(buildRecipeVariantUpsertParams(rv)));
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

      if (
        Array.isArray(data.customerAddresses) &&
        data.customerAddresses.length > 0
      ) {
        const stmt = this.prepare(customerAddressUpsertSql);

        for (const ca of data.customerAddresses) {
          stmt.run(this.sanitize(buildCustomerAddressUpsertParams(ca)));
        }
      }

      if (Array.isArray(data.inventories) && data.inventories.length > 0) {
        const stmt = this.prepare(inventoryUpsertSql);

        for (const i of data.inventories) {
          stmt.run(this.sanitize(buildInventoryUpsertParams(i)));
        }
      }

      if (
        Array.isArray(data.inventoryItems) &&
        data.inventoryItems.length > 0
      ) {
        const stmt = this.prepare(inventoryItemUpsertSql);

        for (const ii of data.inventoryItems) {
          stmt.run(this.sanitize(buildInventoryItemUpsertParams(ii)));
        }
      }

      if (Array.isArray(data.itemMasters) && data.itemMasters.length > 0) {
        const stmt = this.prepare(itemMasterUpsertSql);

        for (const im of data.itemMasters) {
          stmt.run(this.sanitize(buildItemMasterUpsertParams(im)));
        }
      }

      if (Array.isArray(data.itemLots) && data.itemLots.length > 0) {
        const stmt = this.prepare(itemLotUpsertSql);

        for (const il of data.itemLots) {
          stmt.run(this.sanitize(buildItemLotUpsertParams(il)));
        }
      }

      if (Array.isArray(data.orders) && data.orders.length > 0) {
        const stmt = this.prepare(orderUpsertSql);

        for (const o of data.orders) {
          stmt.run(this.sanitize(buildOrderUpsertParams(o)));
        }
      }

      if (Array.isArray(data.productions) && data.productions.length > 0) {
        const stmt = this.prepare(productionUpsertSql);
        for (const p of data.productions) {
          stmt.run(this.sanitize(buildProductionUpsertParams(p)));
        }
      }

      if (Array.isArray(data.productionsV2) && data.productionsV2.length > 0) {
        const stmt = this.prepare(productionV2UpsertSql);
        for (const p of data.productionsV2) {
          stmt.run(this.sanitize(buildProductionV2UpsertParams(p)));
        }
      }

      if (
        Array.isArray(data.productionItems) &&
        data.productionItems.length > 0
      ) {
        const stmt = this.prepare(productionItemUpsertSql);
        for (const pi of data.productionItems) {
          stmt.run(this.sanitize(buildProductionItemUpsertParams(pi)));
        }
      }

      if (
        Array.isArray(data.productionV2Items) &&
        data.productionV2Items.length > 0
      ) {
        const stmt = this.prepare(productionV2ItemUpsertSql);
        for (const pi of data.productionV2Items) {
          stmt.run(this.sanitize(buildProductionV2ItemUpsertParams(pi)));
        }
      }

      if (
        Array.isArray(data.productionV2Traces) &&
        data.productionV2Traces.length > 0
      ) {
        const stmt = this.prepare(productionV2TraceUpsertSql);
        for (const pt of data.productionV2Traces) {
          stmt.run(this.sanitize(buildProductionV2TraceUpsertParams(pt)));
        }
      }

      if (Array.isArray(data.invoices) && data.invoices.length > 0) {
        const stmt = this.prepare(invoiceUpsertSql);
        for (const inv of data.invoices) {
          stmt.run(this.sanitize(buildInvoiceUpsertParams(inv)));
        }
      }

      if (Array.isArray(data.invoiceItems) && data.invoiceItems.length > 0) {
        const stmt = this.prepare(invoiceItemUpsertSql);
        for (const ii of data.invoiceItems) {
          stmt.run(this.sanitize(buildInvoiceItemUpsertParams(ii)));
        }
      }

      if (Array.isArray(data.suppliers) && data.suppliers.length > 0) {
        const stmt = this.prepare(supplierUpsertSql);
        for (const s of data.suppliers) {
          stmt.run(this.sanitize(buildSupplierUpsertParams(s)));
        }
      }

      if (Array.isArray(data.supplierItems) && data.supplierItems.length > 0) {
        const stmt = this.prepare(supplierItemUpsertSql);
        for (const si of data.supplierItems) {
          stmt.run(this.sanitize(buildSupplierItemUpsertParams(si)));
        }
      }

      if (Array.isArray(data.components) && data.components.length > 0) {
        const stmt = this.prepare(componentUpsertSql);
        for (const c of data.components) {
          stmt.run(this.sanitize(buildComponentUpsertParams(c)));
        }
      }

      if (
        Array.isArray(data.componentItems) &&
        data.componentItems.length > 0
      ) {
        const stmt = this.prepare(componentItemUpsertSql);
        for (const ci of data.componentItems) {
          stmt.run(this.sanitize(buildComponentItemUpsertParams(ci)));
        }
      }

      if (Array.isArray(data.componentLots) && data.componentLots.length > 0) {
        const stmt = this.prepare(componentLotUpsertSql);
        for (const cl of data.componentLots) {
          stmt.run(this.sanitize(buildComponentLotUpsertParams(cl)));
        }
      }

      if (
        Array.isArray(data.componentLotLogs) &&
        data.componentLotLogs.length > 0
      ) {
        const stmt = this.prepare(componentLotLogUpsertSql);
        for (const cll of data.componentLotLogs) {
          stmt.run(this.sanitize(buildComponentLotLogUpsertParams(cll)));
        }
      }

      if (
        Array.isArray(data.systemDefaults) &&
        data.systemDefaults.length > 0
      ) {
        const stmt = this.prepare(systemDefaultUpsertSql);
        for (const sd of data.systemDefaults) {
          stmt.run(this.sanitize(buildSystemDefaultUpsertParams(sd)));
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

      // 3. Clear cache and identity (except for device-specific stuff and user profile)
      // We keep deviceId, hashes, and user_identity for offline support
      this.prepare(
        "DELETE FROM identity WHERE key NOT IN ('device_id', 'pin_hash', 'login_hash', 'user_identity')",
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
