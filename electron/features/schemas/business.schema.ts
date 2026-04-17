import { TableSchema } from "./types";

export type BusinessUpsertParams = {
  id: string;
  name: string | null;
  slug: string | null;
  status: string;
  logoUrl: string | null;
  country: string | null;
  businessType: string | null;
  address: string | null;
  currency: string | null;
  revenueRange: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastSyncedAt: string | null;
  ownerId: string | null;
  version: number;
};

export const businessCreateSql = `
  CREATE TABLE IF NOT EXISTS business (
    localId INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT,
    name TEXT,
    slug TEXT,
    status TEXT DEFAULT 'active' NOT NULL,
    logoUrl TEXT,
    country TEXT,
    businessType TEXT,
    address TEXT,
    currency TEXT,
    revenueRange TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    lastSyncedAt TEXT,
    ownerId TEXT,
    version INTEGER DEFAULT 0 NOT NULL
  );
`;

export const businessUpsertSql = `
  INSERT INTO business (
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
    ownerId,
    version
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
    @ownerId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    slug = excluded.slug,
    status = excluded.status,
    logoUrl = excluded.logoUrl,
    country = excluded.country,
    businessType = excluded.businessType,
    address = excluded.address,
    currency = excluded.currency,
    revenueRange = excluded.revenueRange,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    lastSyncedAt = excluded.lastSyncedAt,
    ownerId = excluded.ownerId,
    version = excluded.version
  WHERE excluded.version >= business.version
     OR excluded.updatedAt >= business.updatedAt
     OR business.updatedAt IS NULL
`;

export const buildBusinessUpsertParams = (b: any): BusinessUpsertParams => ({
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
  version: Number(b.version ?? 0),
});

export const businessSchema: TableSchema = {
  name: "business",
  create: businessCreateSql,
  indexes: [
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_business_id ON business(id);`,
    `CREATE INDEX IF NOT EXISTS idx_business_status ON business(status);`,
    `CREATE INDEX IF NOT EXISTS idx_business_slug ON business(slug);`,
    `CREATE INDEX IF NOT EXISTS idx_business_lastSyncedAt ON business(lastSyncedAt);`,
  ],
};
