import Database from "better-sqlite3";
import path from "path";
import { app } from "electron";
import fs from "fs";
import { schemas } from "../features/schemas";

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



    



    // business_user
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS business_user (
        id TEXT PRIMARY KEY,
        accessType TEXT DEFAULT 'super_admin' NOT NULL,
        permissions TEXT,
        status TEXT DEFAULT 'active' NOT NULL,
        invitedBy TEXT,
        invitationToken TEXT,
        invitationExpiry TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        lastSyncedAt TEXT,
        userId TEXT,
        outletId TEXT NOT NULL,
        businessId TEXT NOT NULL
      );
    `);

    // business_user_roles_business_role (join table)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS business_user_roles_business_role (
        businessUserId TEXT NOT NULL,
        businessRoleId TEXT NOT NULL,
        PRIMARY KEY (businessUserId, businessRoleId)
      );
    `);

    // customers
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        email TEXT,
        name TEXT,
        phoneNumber TEXT,
        customerCode TEXT,
        status TEXT DEFAULT 'active' NOT NULL,
        verificationCode TEXT,
        verificationCodeExpiry TEXT,
        emailVerified INTEGER DEFAULT 0 NOT NULL,
        phoneVerfied INTEGER DEFAULT 0 NOT NULL,
        reference TEXT,
        createdAt TEXT,
        outletId TEXT,
        otherEmails TEXT,
        otherNames TEXT,
        otherPhoneNumbers TEXT,
        customerType TEXT DEFAULT 'individual' NOT NULL,
        pricingTier TEXT,
        paymentTermId TEXT,
        organizationName TEXT,
        addedBy TEXT,
        updatedBy TEXT,
        updatedAt TEXT,
        deletedAt TEXT
      );
    `);

    // customer_address
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS customer_address (
        id TEXT PRIMARY KEY,
        address TEXT,
        isDefault INTEGER DEFAULT 0 NOT NULL,
        createdAt TEXT,
        updatedAt TEXT,
        customerId TEXT
      );
    `);

    

    // cart
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cart (
        id TEXT PRIMARY KEY,
        reference TEXT NOT NULL,
        status TEXT DEFAULT 'active' NOT NULL,
        createdAt TEXT,
        updatedAt TEXT,
        outletId TEXT,
        itemCount INTEGER DEFAULT 0 NOT NULL,
        totalQuantity INTEGER DEFAULT 0 NOT NULL,
        totalAmount REAL DEFAULT 0 NOT NULL,
        customerId TEXT
      );
    `);

    // cart_item
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cart_item (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unitPrice REAL DEFAULT 0 NOT NULL,
        cartId TEXT,
        priceTierDiscount REAL DEFAULT 0 NOT NULL,
        priceTierMarkup REAL DEFAULT 0 NOT NULL
      );
    `);

    // cart_item_modifier
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cart_item_modifier (
        id TEXT PRIMARY KEY,
        unitAmount REAL NOT NULL,
        modifierOptionId TEXT NOT NULL,
        modifierOptionName TEXT NOT NULL,
        quantity INTEGER DEFAULT 1 NOT NULL,
        cartItemId TEXT,
        modifierId TEXT,
        priceTierDiscount REAL DEFAULT 0 NOT NULL,
        priceTierMarkup REAL DEFAULT 0 NOT NULL
      );
    `);

    // inventory
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        type TEXT DEFAULT 'central' NOT NULL,
        allowProcurement INTEGER DEFAULT 1 NOT NULL,
        location TEXT,
        reference TEXT,
        externalReference TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        businessId TEXT,
        outletId TEXT
      );
    `);

    // inventory_item
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS inventory_item (
        id TEXT PRIMARY KEY,
        costMethod TEXT DEFAULT 'weighted_average' NOT NULL,
        costPrice REAL DEFAULT 0 NOT NULL,
        currentStockLevel REAL DEFAULT 0 NOT NULL,
        minimumStockLevel REAL DEFAULT 0 NOT NULL,
        reOrderLevel REAL DEFAULT 0 NOT NULL,
        isDeleted INTEGER DEFAULT 0 NOT NULL,
        addedBy TEXT,
        modifiedBy TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        itemMasterId TEXT NOT NULL,
        inventoryId TEXT
      );
    `);

    // item_master
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS item_master (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        itemCode TEXT NOT NULL,
        businessId TEXT NOT NULL,
        category TEXT NOT NULL,
        itemType TEXT NOT NULL,
        unitOfPurchase TEXT NOT NULL,
        unitOfTransfer TEXT NOT NULL,
        unitOfConsumption TEXT NOT NULL,
        displayedUnitOfMeasure TEXT NOT NULL,
        transferPerPurchase REAL DEFAULT 0 NOT NULL,
        consumptionPerTransfer REAL DEFAULT 0 NOT NULL,
        isTraceable INTEGER DEFAULT 0 NOT NULL,
        isTrackable INTEGER DEFAULT 0 NOT NULL,
        createdAt TEXT,
        updatedAt TEXT
      );
    `);

    // item_lot
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS item_lot (
        id TEXT PRIMARY KEY,
        lotNumber TEXT NOT NULL,
        quantityPurchased REAL NOT NULL,
        supplierName TEXT,
        supplierSesrialNumber TEXT,
        supplierAddress TEXT,
        currentStockLevel REAL NOT NULL,
        initialStockLevel REAL NOT NULL,
        expiryDate TEXT,
        costPrice REAL NOT NULL,
        createdAt TEXT,
        updatedAt TEXT,
        itemId TEXT
      );
    `);

    // recipes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        productReference TEXT NOT NULL,
        productName TEXT NOT NULL,
        outletId TEXT NOT NULL,
        mix TEXT DEFAULT 'standard' NOT NULL,
        totalPortions REAL NOT NULL,
        totalMixCost REAL DEFAULT 0 NOT NULL,
        preparationTime REAL DEFAULT 0 NOT NULL,
        difficulty_level TEXT DEFAULT 'Medium' NOT NULL,
        instructions TEXT NOT NULL,
        imageUrl TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        createdBy TEXT NOT NULL,
        isDeleted INTEGER DEFAULT 0 NOT NULL,
        inventoryId TEXT
      );
    `);

    // recipe_ingredients
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id TEXT PRIMARY KEY,
        itemName TEXT NOT NULL,
        unitOfMeasure TEXT NOT NULL,
        quantity REAL NOT NULL,
        proposedFoodCost REAL DEFAULT 0 NOT NULL,
        prepWaste REAL DEFAULT 0 NOT NULL,
        critical INTEGER DEFAULT 0 NOT NULL,
        isDeleted INTEGER DEFAULT 0 NOT NULL,
        createdAt TEXT,
        updatedAt TEXT,
        recipeId TEXT,
        itemId TEXT
      );
    `);

    // system_default
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_default (
        id TEXT PRIMARY KEY,
        key TEXT DEFAULT 'category' NOT NULL,
        data TEXT DEFAULT '[]' NOT NULL,
        outletId TEXT
      );
    `);

    // sync_session
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_session (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        deviceId TEXT,
        deviceName TEXT,
        status TEXT DEFAULT 'initial' NOT NULL,
        direction TEXT DEFAULT 'pull' NOT NULL,
        scope TEXT,
        recordsPulled INTEGER DEFAULT 0 NOT NULL,
        recordsPushed INTEGER DEFAULT 0 NOT NULL,
        tableStats TEXT,
        startedAt TEXT,
        completedAt TEXT,
        nextSyncFrom TEXT,
        conflicts TEXT,
        errorMessage TEXT,
        errorDetails TEXT,
        createdAt TEXT,
        updatedAt TEXT
      );
    `);

    // sync_table_log
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_table_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sessionId TEXT NOT NULL,
        userId TEXT NOT NULL,
        businessId TEXT,
        outletId TEXT,
        tableName TEXT NOT NULL,
        operation TEXT DEFAULT 'pull' NOT NULL,
        recordsProcessed INTEGER DEFAULT 0 NOT NULL,
        syncVersion INTEGER DEFAULT 1 NOT NULL,
        syncedAt TEXT NOT NULL,
        lastRecordTimestamp TEXT,
        cursorState TEXT,
        filterState TEXT,
        conflictsDetected INTEGER DEFAULT 0 NOT NULL,
        conflictsResolved INTEGER DEFAULT 0 NOT NULL,
        createdAt TEXT
      );
    `);

    // user
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        fullName TEXT NOT NULL,
        password TEXT,
        pin TEXT NOT NULL,
        otpCodeHash TEXT,
        otpCodeExpiry TEXT,
        failedLoginCount INTEGER,
        failedLoginRetryTime TEXT,
        lastFailedLogin TEXT,
        isEmailVerified INTEGER DEFAULT 0 NOT NULL,
        isPin INTEGER DEFAULT 0 NOT NULL,
        isDeleted INTEGER DEFAULT 0 NOT NULL,
        lastLoginAt TEXT,
        status TEXT DEFAULT 'inactive' NOT NULL,
        authProvider TEXT,
        providerId TEXT,
        publicId TEXT,
        providerData TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        lastSyncedAt TEXT
      );
    `);

    // notifications
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        isRead INTEGER DEFAULT 0 NOT NULL,
        createdAt TEXT,
        userId TEXT
      );
    `);

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
}
