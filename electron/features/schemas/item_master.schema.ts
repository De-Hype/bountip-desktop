import { TableSchema } from "./types";

export const itemMasterUpsertSql = `
  INSERT INTO item_master (
    id,
    name,
    itemCode,
    businessId,
    category,
    itemType,
    unitOfPurchase,
    unitOfTransfer,
    unitOfConsumption,
    displayedUnitOfMeasure,
    transferPerPurchase,
    consumptionPerTransfer,
    isTraceable,
    isTrackable,
    createdAt,
    updatedAt,
    recordId,
    version
  ) VALUES (
    @id,
    @name,
    @itemCode,
    @businessId,
    @category,
    @itemType,
    @unitOfPurchase,
    @unitOfTransfer,
    @unitOfConsumption,
    @displayedUnitOfMeasure,
    @transferPerPurchase,
    @consumptionPerTransfer,
    @isTraceable,
    @isTrackable,
    @createdAt,
    @updatedAt,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    itemCode = excluded.itemCode,
    businessId = excluded.businessId,
    category = excluded.category,
    itemType = excluded.itemType,
    unitOfPurchase = excluded.unitOfPurchase,
    unitOfTransfer = excluded.unitOfTransfer,
    unitOfConsumption = excluded.unitOfConsumption,
    displayedUnitOfMeasure = excluded.displayedUnitOfMeasure,
    transferPerPurchase = excluded.transferPerPurchase,
    consumptionPerTransfer = excluded.consumptionPerTransfer,
    isTraceable = excluded.isTraceable,
    isTrackable = excluded.isTrackable,
    updatedAt = excluded.updatedAt,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= item_master.version OR excluded.updatedAt >= item_master.updatedAt OR item_master.updatedAt IS NULL
`;

export const buildItemMasterUpsertParams = (im: any) => ({
  id: im.id,
  name: im.name,
  itemCode: im.itemCode,
  businessId: im.businessId,
  category: im.category,
  itemType: im.itemType,
  unitOfPurchase: im.unitOfPurchase,
  unitOfTransfer: im.unitOfTransfer,
  unitOfConsumption: im.unitOfConsumption,
  displayedUnitOfMeasure: im.displayedUnitOfMeasure,
  transferPerPurchase: parseFloat(im.transferPerPurchase || 0),
  consumptionPerTransfer: parseFloat(im.consumptionPerTransfer || 0),
  isTraceable: im.isTraceable ? 1 : 0,
  isTrackable: im.isTrackable ? 1 : 0,
  createdAt: im.createdAt,
  updatedAt: im.updatedAt,
  recordId: im.recordId,
  version: im.version,
});

export const itemMasterSchema: TableSchema = {
  name: "item_master",

  create: `
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
      updatedAt TEXT,
      recordId TEXT,
      version INTEGER
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_item_master_businessId ON item_master(businessId)",
    "CREATE INDEX IF NOT EXISTS idx_item_master_category ON item_master(category)",
  ],
};

