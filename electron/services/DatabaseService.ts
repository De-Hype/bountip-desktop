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

        this.db
          .prepare(
            `
          INSERT OR REPLACE INTO user (
            id,
            email,
            fullName,
            password,
            pin,
            otpCodeHash,
            otpCodeExpiry,
            failedLoginCount,
            failedLoginRetryTime,
            lastFailedLogin,
            isEmailVerified,
            isPin,
            isDeleted,
            lastLoginAt,
            status,
            authProvider,
            providerId,
            publicId,
            providerData,
            createdAt,
            updatedAt,
            lastSyncedAt
          ) VALUES (
            @id,
            @email,
            @fullName,
            @password,
            @pin,
            @otpCodeHash,
            @otpCodeExpiry,
            @failedLoginCount,
            @failedLoginRetryTime,
            @lastFailedLogin,
            @isEmailVerified,
            @isPin,
            @isDeleted,
            @lastLoginAt,
            @status,
            @authProvider,
            @providerId,
            @publicId,
            @providerData,
            @createdAt,
            @updatedAt,
            @lastSyncedAt
          )
        `,
          )
          .run(
            sanitize({
              id: u.id,
              email: u.email ?? null,
              fullName: u.fullName ?? null,
              password: u.password ?? null,
              pin: u.pin ?? null,
              otpCodeHash: u.otpCodeHash ?? null,
              otpCodeExpiry: u.otpCodeExpiry ?? null,
              failedLoginCount: u.failedLoginCount ?? 0,
              failedLoginRetryTime: u.failedLoginRetryTime ?? null,
              lastFailedLogin: u.lastFailedLogin ?? null,
              isEmailVerified: u.isEmailVerified ? 1 : 0,
              isPin: u.isPin ? 1 : 0,
              isDeleted: u.isDeleted ? 1 : 0,
              lastLoginAt: u.lastLoginAt ?? null,
              status: u.status ?? "inactive",
              authProvider: u.authProvider ?? null,
              providerId: u.providerId ?? null,
              publicId: u.publicId ?? null,
              providerData:
                u.providerData && typeof u.providerData === "object"
                  ? JSON.stringify(u.providerData)
                  : (u.providerData ?? null),
              createdAt: u.createdAt ?? null,
              updatedAt: u.updatedAt ?? null,
              lastSyncedAt: u.lastSyncedAt ?? null,
            }),
          );
      }

      if (Array.isArray(data.businesses) && data.businesses.length > 0) {
        const stmt = this.db.prepare(
          `
          INSERT OR REPLACE INTO business (
            id,
            name,
            slug,
            status,
            logoUrl,
            country,
            businessType,
            address,
            currency,
            revenueRange,
            createdAt,
            updatedAt,
            lastSyncedAt,
            ownerId
          ) VALUES (
            @id,
            @name,
            @slug,
            @status,
            @logoUrl,
            @country,
            @businessType,
            @address,
            @currency,
            @revenueRange,
            @createdAt,
            @updatedAt,
            @lastSyncedAt,
            @ownerId
          )
        `,
        );

        for (const b of data.businesses) {
          stmt.run(
            sanitize({
              id: b.id,
              name: b.name ?? null,
              slug: b.slug ?? null,
              status: b.status ?? "active",
              logoUrl: b.logoUrl ?? null,
              country: b.country ?? null,
              businessType: b.businessType ?? null,
              address: b.address ?? null,
              currency: b.currency ?? null,
              revenueRange: b.revenueRange ?? null,
              createdAt: b.createdAt ?? null,
              updatedAt: b.updatedAt ?? null,
              lastSyncedAt: b.lastSyncedAt ?? null,
              ownerId: b.ownerId ?? null,
            }),
          );
        }
      }

      if (Array.isArray(data.outlets) && data.outlets.length > 0) {
        const stmt = this.db.prepare(
          `
          INSERT OR REPLACE INTO business_outlet (
            id,
            name,
            description,
            address,
            state,
            email,
            postalCode,
            phoneNumber,
            whatsappNumber,
            currency,
            revenueRange,
            country,
            storeCode,
            localInventoryRef,
            centralInventoryRef,
            outletRef,
            isMainLocation,
            businessType,
            isActive,
            whatsappChannel,
            emailChannel,
            isDeleted,
            isOnboarded,
            operatingHours,
            logoUrl,
            taxSettings,
            serviceCharges,
            paymentMethods,
            priceTier,
            receiptSettings,
            labelSettings,
            invoiceSettings,
            generalSettings,
            createdAt,
            updatedAt,
            lastSyncedAt,
            businessId,
            bankDetails
          ) VALUES (
            @id,
            @name,
            @description,
            @address,
            @state,
            @email,
            @postalCode,
            @phoneNumber,
            @whatsappNumber,
            @currency,
            @revenueRange,
            @country,
            @storeCode,
            @localInventoryRef,
            @centralInventoryRef,
            @outletRef,
            @isMainLocation,
            @businessType,
            @isActive,
            @whatsappChannel,
            @emailChannel,
            @isDeleted,
            @isOnboarded,
            @operatingHours,
            @logoUrl,
            @taxSettings,
            @serviceCharges,
            @paymentMethods,
            @priceTier,
            @receiptSettings,
            @labelSettings,
            @invoiceSettings,
            @generalSettings,
            @createdAt,
            @updatedAt,
            @lastSyncedAt,
            @businessId,
            @bankDetails
          )
        `,
        );

        for (const o of data.outlets) {
          stmt.run(
            sanitize({
              id: o.id,
              name: o.name ?? null,
              description: o.description ?? null,
              address: o.address ?? null,
              state: o.state ?? null,
              email: o.email ?? null,
              postalCode: o.postalCode ?? null,
              phoneNumber: o.phoneNumber ?? null,
              whatsappNumber: o.whatsappNumber ?? null,
              currency: o.currency ?? null,
              revenueRange: o.revenueRange ?? null,
              country: o.country ?? null,
              storeCode: o.storeCode ?? null,
              localInventoryRef: o.localInventoryRef ?? null,
              centralInventoryRef: o.centralInventoryRef ?? null,
              outletRef: o.outletRef ?? null,
              isMainLocation: o.isMainLocation ? 1 : 0,
              businessType: o.businessType ?? null,
              isActive: o.isActive ? 1 : 0,
              whatsappChannel: o.whatsappChannel ? 1 : 0,
              emailChannel: o.emailChannel ? 1 : 0,
              isDeleted: o.isDeleted ? 1 : 0,
              isOnboarded: o.isOnboarded ? 1 : 0,
              operatingHours: o.operatingHours ?? null,
              logoUrl: o.logoUrl ?? null,
              taxSettings:
                o.taxSettings && typeof o.taxSettings === "object"
                  ? JSON.stringify(o.taxSettings)
                  : (o.taxSettings ?? null),
              serviceCharges:
                o.serviceCharges && typeof o.serviceCharges === "object"
                  ? JSON.stringify(o.serviceCharges)
                  : (o.serviceCharges ?? null),
              paymentMethods:
                o.paymentMethods && typeof o.paymentMethods === "object"
                  ? JSON.stringify(o.paymentMethods)
                  : (o.paymentMethods ?? null),
              priceTier:
                o.priceTier && typeof o.priceTier === "object"
                  ? JSON.stringify(o.priceTier)
                  : (o.priceTier ?? null),
              receiptSettings:
                o.receiptSettings && typeof o.receiptSettings === "object"
                  ? JSON.stringify(o.receiptSettings)
                  : (o.receiptSettings ?? null),
              labelSettings:
                o.labelSettings && typeof o.labelSettings === "object"
                  ? JSON.stringify(o.labelSettings)
                  : (o.labelSettings ?? null),
              invoiceSettings:
                o.invoiceSettings && typeof o.invoiceSettings === "object"
                  ? JSON.stringify(o.invoiceSettings)
                  : (o.invoiceSettings ?? null),
              generalSettings:
                o.generalSettings && typeof o.generalSettings === "object"
                  ? JSON.stringify(o.generalSettings)
                  : (o.generalSettings ?? null),
              createdAt: o.createdAt ?? null,
              updatedAt: o.updatedAt ?? null,
              lastSyncedAt: o.lastSyncedAt ?? null,
              businessId: o.businessId ?? null,
              bankDetails:
                o.bankDetails && typeof o.bankDetails === "object"
                  ? JSON.stringify(o.bankDetails)
                  : (o.bankDetails ?? null),
            }),
          );
        }
      }

      if (Array.isArray(data.products) && data.products.length > 0) {
        const stmt = this.db.prepare(
          `
          INSERT OR REPLACE INTO product (
            id,
            name,
            isActive,
            description,
            category,
            price,
            preparationArea,
            weight,
            productCode,
            weightScale,
            productAvailableStock,
            packagingMethod,
            priceTierId,
            allergenList,
            logoUrl,
            logoHash,
            leadTime,
            availableAtStorefront,
            createdAtStorefront,
            isDeleted,
            createdAt,
            updatedAt,
            lastSyncedAt,
            outletId
          ) VALUES (
            @id,
            @name,
            @isActive,
            @description,
            @category,
            @price,
            @preparationArea,
            @weight,
            @productCode,
            @weightScale,
            @productAvailableStock,
            @packagingMethod,
            @priceTierId,
            @allergenList,
            @logoUrl,
            @logoHash,
            @leadTime,
            @availableAtStorefront,
            @createdAtStorefront,
            @isDeleted,
            @createdAt,
            @updatedAt,
            @lastSyncedAt,
            @outletId
          )
        `,
        );

        for (const p of data.products) {
          stmt.run(
            sanitize({
              id: p.id,
              name: p.name ?? null,
              isActive: p.isActive ? 1 : 1,
              description: p.description ?? null,
              category: p.category ?? null,
              price: p.price ?? null,
              preparationArea: p.preparationArea ?? null,
              weight: p.weight ?? null,
              productCode: p.productCode ?? null,
              weightScale: p.weightScale ?? null,
              productAvailableStock: p.productAvailableStock ?? null,
              packagingMethod: p.packagingMethod
                ? JSON.stringify(p.packagingMethod)
                : null,
              priceTierId: p.priceTierId ? JSON.stringify(p.priceTierId) : null,
              allergenList:
                p.allergenList && p.allergenList.length > 0
                  ? JSON.stringify(p.allergenList)
                  : null,
              logoUrl: p.logoUrl ?? null,
              logoHash: p.logoHash ?? null,
              leadTime: p.leadTime ?? null,
              availableAtStorefront: p.availableAtStorefront ? 1 : 0,
              createdAtStorefront: p.createdAtStorefront ? 1 : 0,
              isDeleted: p.isDeleted ? 1 : 0,
              createdAt: p.createdAt ?? null,
              updatedAt: p.updatedAt ?? null,
              lastSyncedAt: p.lastSyncedAt ?? null,
              outletId: p.outletId ?? null,
            }),
          );
        }
      }
    });

    tx();
  }
}
