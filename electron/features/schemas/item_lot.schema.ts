import { TableSchema } from "./types";

export const itemLotUpsertSql = `
  INSERT INTO item_lot (
    id,
    lotNumber,
    quantityPurchased,
    supplierName,
    supplierSesrialNumber,
    supplierAddress,
    currentStockLevel,
    initialStockLevel,
    expiryDate,
    costPrice,
    createdAt,
    updatedAt,
    itemId,
    recordId,
    version
  ) VALUES (
    @id,
    @lotNumber,
    @quantityPurchased,
    @supplierName,
    @supplierSesrialNumber,
    @supplierAddress,
    @currentStockLevel,
    @initialStockLevel,
    @expiryDate,
    @costPrice,
    @createdAt,
    @updatedAt,
    @itemId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    lotNumber = excluded.lotNumber,
    quantityPurchased = excluded.quantityPurchased,
    supplierName = excluded.supplierName,
    supplierSesrialNumber = excluded.supplierSesrialNumber,
    supplierAddress = excluded.supplierAddress,
    currentStockLevel = excluded.currentStockLevel,
    initialStockLevel = excluded.initialStockLevel,
    expiryDate = excluded.expiryDate,
    costPrice = excluded.costPrice,
    updatedAt = excluded.updatedAt,
    itemId = excluded.itemId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= item_lot.version OR excluded.updatedAt >= item_lot.updatedAt OR item_lot.updatedAt IS NULL
`;

export const buildItemLotUpsertParams = (il: any) => ({
  id: il.id,
  lotNumber: il.lotNumber,
  quantityPurchased: parseFloat(il.quantityPurchased || 0),
  supplierName: il.supplierName,
  supplierSesrialNumber: il.supplierSesrialNumber,
  supplierAddress: il.supplierAddress,
  currentStockLevel: parseFloat(il.currentStockLevel || 0),
  initialStockLevel: parseFloat(il.initialStockLevel || 0),
  expiryDate: il.expiryDate,
  costPrice: parseFloat(il.costPrice || 0),
  createdAt: il.createdAt,
  updatedAt: il.updatedAt,
  itemId: il.itemId,
  recordId: il.recordId,
  version: il.version,
});

export const itemLotSchema: TableSchema = {
  name: "item_lot",

  create: `
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
      itemId TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0 NOT NULL
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_item_lot_itemId ON item_lot(itemId)",
  ],
};

