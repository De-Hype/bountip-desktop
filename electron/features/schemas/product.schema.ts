import { TableSchema } from "./types";

export type ProductUpsertParams = {
  id: string;
  name: string | null;
  isActive: number;
  description: string | null;
  category: string | null;
  price: number | null;
  preparationArea: string | null;
  weight: number | null;
  productCode: string | null;
  weightScale: string | null;
  productAvailableStock: number | null;
  packagingMethod: string | null;
  priceTierId: string | null;
  allergenList: string | null;
  logoUrl: string | null;
  logoHash: string | null;
  leadTime: number | null;
  availableAtStorefront: number;
  createdAtStorefront: number;
  isDeleted: number;
  createdAt: string | null;
  updatedAt: string | null;
  lastSyncedAt: string | null;
  outletId: string | null;
  version: number;
};

export const productCreateSql = `
  CREATE TABLE IF NOT EXISTS product (
    localId INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT,
    name TEXT NOT NULL,
    isActive INTEGER DEFAULT 1 NOT NULL,
    description TEXT,
    category TEXT,
    price REAL,
    preparationArea TEXT,
    weight REAL,
    productCode TEXT,
    weightScale TEXT,
    productAvailableStock REAL,
    packagingMethod TEXT,
    priceTierId TEXT,
    allergenList TEXT,
    logoUrl TEXT,
    logoHash TEXT,
    leadTime INTEGER,
    availableAtStorefront INTEGER DEFAULT 0 NOT NULL,
    createdAtStorefront INTEGER DEFAULT 0 NOT NULL,
    isDeleted INTEGER DEFAULT 0 NOT NULL,
    createdAt TEXT,
    updatedAt TEXT,
    lastSyncedAt TEXT,
    outletId TEXT,
    version INTEGER DEFAULT 0 NOT NULL
  );
`;

export const productUpsertSql = `
  INSERT INTO product (
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
    outletId,
    version
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
    @outletId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    isActive = excluded.isActive,
    description = excluded.description,
    category = excluded.category,
    price = excluded.price,
    preparationArea = excluded.preparationArea,
    weight = excluded.weight,
    productCode = excluded.productCode,
    weightScale = excluded.weightScale,
    productAvailableStock = excluded.productAvailableStock,
    packagingMethod = excluded.packagingMethod,
    priceTierId = excluded.priceTierId,
    allergenList = excluded.allergenList,
    logoUrl = excluded.logoUrl,
    logoHash = excluded.logoHash,
    leadTime = excluded.leadTime,
    availableAtStorefront = excluded.availableAtStorefront,
    createdAtStorefront = excluded.createdAtStorefront,
    isDeleted = excluded.isDeleted,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    lastSyncedAt = excluded.lastSyncedAt,
    outletId = excluded.outletId,
    version = excluded.version
  WHERE excluded.version >= product.version
     OR excluded.updatedAt >= product.updatedAt
     OR product.updatedAt IS NULL
`;

export const buildProductUpsertParams = (p: any): ProductUpsertParams => ({
  id: p.id,
  name: p.name ?? null,
  isActive: p.isActive ? 1 : 0,
  description: p.description ?? null,
  category: p.category ?? null,
  price: p.price ?? null,
  preparationArea: p.preparationArea ?? null,
  weight: p.weight ?? null,
  productCode: p.productCode ?? null,
  weightScale: p.weightScale ?? null,
  productAvailableStock: p.productAvailableStock ?? null,
  packagingMethod: p.packagingMethod ?? null,
  priceTierId: p.priceTierId ?? null,
  allergenList: p.allergenList ?? null,
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
  version: Number(p.version ?? 0),
});

export const productSchema: TableSchema = {
  name: "product",
  create: productCreateSql,
  indexes: [
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_product_id ON product(id);`,
    `CREATE INDEX IF NOT EXISTS idx_product_outlet ON product(outletId);`,
    `CREATE INDEX IF NOT EXISTS idx_product_category ON product(category);`,
    `CREATE INDEX IF NOT EXISTS idx_product_isActive ON product(isActive);`,
    `CREATE INDEX IF NOT EXISTS idx_product_lastSyncedAt ON product(lastSyncedAt);`,
  ],
};
