import { TableSchema } from "./types";

export const businessOutletSchema: TableSchema = {
  name: "business_outlet",

  create: `
    CREATE TABLE IF NOT EXISTS business_outlet (
      localId INTEGER PRIMARY KEY AUTOINCREMENT,
      id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      address TEXT,
      state TEXT,
      email TEXT,
      postalCode TEXT,
      phoneNumber TEXT,
      whatsappNumber TEXT,
      currency TEXT,
      revenueRange TEXT,
      country TEXT,
      storeCode TEXT,
      localInventoryRef TEXT,
      centralInventoryRef TEXT,
      outletRef TEXT,
      isMainLocation INTEGER DEFAULT 0 NOT NULL,
      businessType TEXT,
      isActive INTEGER DEFAULT 1 NOT NULL,
      whatsappChannel INTEGER DEFAULT 1 NOT NULL,
      emailChannel INTEGER DEFAULT 1 NOT NULL,
      isDeleted INTEGER DEFAULT 0 NOT NULL,
      isOnboarded INTEGER DEFAULT 0 NOT NULL,
      operatingHours TEXT,
      logoUrl TEXT,
      taxSettings TEXT,
      serviceCharges TEXT,
      paymentMethods TEXT,
      priceTier TEXT,
      receiptSettings TEXT,
      labelSettings TEXT,
      invoiceSettings TEXT,
      generalSettings TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      lastSyncedAt TEXT,
      businessId TEXT,
      bankDetails TEXT
    );
  `,

  indexes: [
    `CREATE INDEX IF NOT EXISTS idx_outlet_businessId ON business_outlet(businessId);`,
    `CREATE INDEX IF NOT EXISTS idx_outlet_isActive ON business_outlet(isActive);`,
    `CREATE INDEX IF NOT EXISTS idx_outlet_isOnboarded ON business_outlet(isOnboarded);`,
    `CREATE INDEX IF NOT EXISTS idx_outlet_lastSyncedAt ON business_outlet(lastSyncedAt);`,
  ],
};
