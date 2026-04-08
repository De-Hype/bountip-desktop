import { TableSchema } from "./types";

export type BusinessOutletUpsertParams = {
  id: string;
  name: string | null;
  description: string | null;
  address: string | null;
  state: string | null;
  email: string | null;
  postalCode: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  currency: string | null;
  revenueRange: string | null;
  country: string | null;
  storeCode: string | null;
  localInventoryRef: string | null;
  centralInventoryRef: string | null;
  outletRef: string | null;
  isMainLocation: number;
  businessType: string | null;
  isActive: number;
  whatsappChannel: number;
  emailChannel: number;
  isDeleted: number;
  isOnboarded: number;
  isOfflineImage: number;
  localLogoPath: string | null;
  operatingHours: string | null;
  logoUrl: string | null;
  taxSettings: string | null;
  serviceCharges: string | null;
  paymentMethods: string | null;
  priceTier: string | null;
  receiptSettings: string | null;
  labelSettings: string | null;
  invoiceSettings: string | null;
  generalSettings: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastSyncedAt: string | null;
  businessId: string | null;
  bankDetails: string | null;
  version: number;
};

export const businessOutletCreateSql = `
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
    isOfflineImage INTEGER DEFAULT 0 NOT NULL,
    localLogoPath TEXT,
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
    bankDetails TEXT,
    version INTEGER DEFAULT 0 NOT NULL
  );
`;

export const businessOutletUpsertSql = `
  INSERT INTO business_outlet (
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
    isOfflineImage,
    localLogoPath,
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
    bankDetails,
    version
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
    @isOfflineImage,
    @localLogoPath,
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
    @bankDetails,
    @version
  ) ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    description = excluded.description,
    address = excluded.address,
    state = excluded.state,
    email = excluded.email,
    postalCode = excluded.postalCode,
    phoneNumber = excluded.phoneNumber,
    whatsappNumber = excluded.whatsappNumber,
    currency = excluded.currency,
    revenueRange = excluded.revenueRange,
    country = excluded.country,
    storeCode = excluded.storeCode,
    localInventoryRef = excluded.localInventoryRef,
    centralInventoryRef = excluded.centralInventoryRef,
    outletRef = excluded.outletRef,
    isMainLocation = excluded.isMainLocation,
    businessType = excluded.businessType,
    isActive = excluded.isActive,
    whatsappChannel = excluded.whatsappChannel,
    emailChannel = excluded.emailChannel,
    isDeleted = excluded.isDeleted,
    isOnboarded = excluded.isOnboarded,
    isOfflineImage = excluded.isOfflineImage,
    localLogoPath = excluded.localLogoPath,
    operatingHours = excluded.operatingHours,
    logoUrl = excluded.logoUrl,
    taxSettings = excluded.taxSettings,
    serviceCharges = excluded.serviceCharges,
    paymentMethods = excluded.paymentMethods,
    priceTier = excluded.priceTier,
    receiptSettings = excluded.receiptSettings,
    labelSettings = excluded.labelSettings,
    invoiceSettings = excluded.invoiceSettings,
    generalSettings = excluded.generalSettings,
    updatedAt = excluded.updatedAt,
    businessId = excluded.businessId,
    bankDetails = excluded.bankDetails,
    version = excluded.version
  WHERE excluded.version >= business_outlet.version OR excluded.updatedAt >= business_outlet.updatedAt OR business_outlet.updatedAt IS NULL
`;

export const buildBusinessOutletUpsertParams = (
  o: any,
): BusinessOutletUpsertParams => ({
  id: String(o.id || ""),
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
  isActive: o.isActive ? 1 : 1,
  whatsappChannel: o.whatsappChannel ? 1 : 1,
  emailChannel: o.emailChannel ? 1 : 1,
  isDeleted: o.isDeleted ? 1 : 0,
  isOnboarded: o.isOnboarded ? 1 : 0,
  isOfflineImage: o.isOfflineImage ? 1 : 0,
  localLogoPath: o.localLogoPath ?? null,
  operatingHours: o.operatingHours ? JSON.stringify(o.operatingHours) : null,
  logoUrl: o.logoUrl ?? null,
  taxSettings: o.taxSettings ? JSON.stringify(o.taxSettings) : null,
  serviceCharges: o.serviceCharges ? JSON.stringify(o.serviceCharges) : null,
  paymentMethods: o.paymentMethods ? JSON.stringify(o.paymentMethods) : null,
  priceTier: o.priceTier ? JSON.stringify(o.priceTier) : null,
  receiptSettings: o.receiptSettings ? JSON.stringify(o.receiptSettings) : null,
  labelSettings: o.labelSettings ? JSON.stringify(o.labelSettings) : null,
  invoiceSettings: o.invoiceSettings ? JSON.stringify(o.invoiceSettings) : null,
  generalSettings: o.generalSettings ? JSON.stringify(o.generalSettings) : null,
  createdAt: o.createdAt ?? null,
  updatedAt: o.updatedAt ?? null,
  lastSyncedAt: o.lastSyncedAt ?? null,
  businessId: o.businessId ?? null,
  bankDetails: o.bankDetails ? JSON.stringify(o.bankDetails) : null,
  version: Number(o.version ?? 0),
});

export const businessOutletSchema: TableSchema = {
  name: "business_outlet",
  create: businessOutletCreateSql,
  indexes: [
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_outlet_id ON business_outlet(id);`,
    `CREATE INDEX IF NOT EXISTS idx_outlet_businessId ON business_outlet(businessId);`,
    `CREATE INDEX IF NOT EXISTS idx_outlet_isActive ON business_outlet(isActive);`,
    `CREATE INDEX IF NOT EXISTS idx_outlet_isOnboarded ON business_outlet(isOnboarded);`,
    `CREATE INDEX IF NOT EXISTS idx_outlet_lastSyncedAt ON business_outlet(lastSyncedAt);`,
  ],
};
