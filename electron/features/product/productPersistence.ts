import type Database from "better-sqlite3";

export type SqliteBoolean = 0 | 1;

export type ProductCreatePayload = {
  id?: string;
  name: string;
  description?: string | null;
  category?: string | null;
  price?: number | null;
  preparationArea?: string | null;
  weight?: number | null;
  productCode?: string | null;
  weightScale?: string | null;
  productAvailableStock?: number | null;
  packagingMethod?: string[];
  priceTierId?: string[] | null;
  allergenList?: string[];
  allergens?: string[];
  logoUrl?: string | null;
  logoHash?: string | null;
  leadTime?: number | null;
  availableAtStorefront?: SqliteBoolean;
  createdAtStorefront?: SqliteBoolean;
  isDeleted?: SqliteBoolean;
  isActive?: SqliteBoolean;
  createdAt?: string;
  updatedAt?: string;
  lastSyncedAt?: string | null;
  outletId?: string | null;
};

export type ProductRow = {
  id: string;
  name: string;
  isActive: SqliteBoolean;
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
  availableAtStorefront: SqliteBoolean;
  createdAtStorefront: SqliteBoolean;
  isDeleted: SqliteBoolean;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string | null;
  outletId: string | null;
};

export type ProductSyncOp = {
  type: "product";
  op: "upsert";
  id: string;
  outletId: string | null;
  data: ProductRow;
  ts: string;
};

export function createProductRecord(
  db: Database.Database,
  payload: ProductCreatePayload,
  id: string,
  now: string,
): ProductRow {
  const stmt = db.prepare(`
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
    `);

  const effectiveAllergenList =
    payload.allergenList && payload.allergenList.length > 0
      ? payload.allergenList
      : payload.allergens && payload.allergens.length > 0
        ? payload.allergens
        : [];

  const row: ProductRow = {
    id,
    name: payload.name,
    isActive: (payload.isActive ?? 1) as SqliteBoolean,
    description: payload.description ?? null,
    category: payload.category ?? null,
    price: payload.price ?? null,
    preparationArea: payload.preparationArea ?? null,
    weight: payload.weight ?? null,
    productCode: payload.productCode ?? null,
    weightScale: payload.weightScale ?? null,
    productAvailableStock: payload.productAvailableStock ?? null,
    packagingMethod: payload.packagingMethod
      ? JSON.stringify(payload.packagingMethod)
      : null,
    priceTierId: payload.priceTierId
      ? JSON.stringify(payload.priceTierId)
      : null,
    allergenList:
      effectiveAllergenList.length > 0
        ? JSON.stringify(effectiveAllergenList)
        : null,
    logoUrl: payload.logoUrl ?? null,
    logoHash: payload.logoHash ?? null,
    leadTime: payload.leadTime ?? null,
    availableAtStorefront: (payload.availableAtStorefront ?? 1) as SqliteBoolean,
    createdAtStorefront: (payload.createdAtStorefront ?? 1) as SqliteBoolean,
    isDeleted: (payload.isDeleted ?? 0) as SqliteBoolean,
    createdAt: payload.createdAt ?? now,
    updatedAt: payload.updatedAt ?? now,
    lastSyncedAt: payload.lastSyncedAt ?? null,
    outletId: payload.outletId ?? null,
  };

  stmt.run(row);

  return row;
}

export function buildProductSyncOp(
  row: ProductRow,
  id: string,
  ts: string,
): ProductSyncOp {
  return {
    type: "product",
    op: "upsert",
    id,
    outletId: row.outletId,
    data: row,
    ts,
  };
}

