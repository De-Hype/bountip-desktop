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
    outletId TEXT
  );
`;

export const productUpsertSql = `
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
`;

export const buildProductUpsertParams = (p: any): ProductUpsertParams => ({
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
  packagingMethod: p.packagingMethod ? JSON.stringify(p.packagingMethod) : null,
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
});

export const productSchema: TableSchema = {
  name: "product",
  create: productCreateSql,
  indexes: [
    `CREATE INDEX IF NOT EXISTS idx_product_outlet ON product(outletId);`,
    `CREATE INDEX IF NOT EXISTS idx_product_category ON product(category);`,
    `CREATE INDEX IF NOT EXISTS idx_product_isActive ON product(isActive);`,
    `CREATE INDEX IF NOT EXISTS idx_product_lastSyncedAt ON product(lastSyncedAt);`,
  ],
};
