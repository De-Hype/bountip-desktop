import { TableSchema } from "./types";

export const productionV2ApprovalLogItemUpsertSql = `
  INSERT INTO production_v2_approval_log_items (
    id,
    requiredQuantity,
    availableQuantity,
    isSufficient,
    createdAt,
    approvalLogId,
    inventoryItemId,
    ingredientType,
    itemName,
    componentId,
    recordId,
    version
  ) VALUES (
    @id,
    @requiredQuantity,
    @availableQuantity,
    @isSufficient,
    @createdAt,
    @approvalLogId,
    @inventoryItemId,
    @ingredientType,
    @itemName,
    @componentId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    requiredQuantity = excluded.requiredQuantity,
    availableQuantity = excluded.availableQuantity,
    isSufficient = excluded.isSufficient,
    createdAt = excluded.createdAt,
    approvalLogId = excluded.approvalLogId,
    inventoryItemId = excluded.inventoryItemId,
    ingredientType = excluded.ingredientType,
    itemName = excluded.itemName,
    componentId = excluded.componentId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= production_v2_approval_log_items.version
     OR production_v2_approval_log_items.version IS NULL
`;

export const buildProductionV2ApprovalLogItemUpsertParams = (it: any) => ({
  id: it.id,
  requiredQuantity: it.requiredQuantity,
  availableQuantity: it.availableQuantity,
  isSufficient: it.isSufficient ? 1 : 0,
  createdAt: it.createdAt,
  approvalLogId: it.approvalLogId,
  inventoryItemId: it.inventoryItemId,
  ingredientType: it.ingredientType,
  itemName: it.itemName,
  componentId: it.componentId,
  recordId: it.recordId,
  version: Number(it.version || 0),
});

export const productionV2ApprovalLogItemSchema: TableSchema = {
  name: "production_v2_approval_log_items",
  create: `
    CREATE TABLE IF NOT EXISTS production_v2_approval_log_items (
      id TEXT PRIMARY KEY,
      requiredQuantity TEXT,
      availableQuantity TEXT,
      isSufficient INTEGER,
      createdAt TEXT,
      approvalLogId TEXT,
      inventoryItemId TEXT,
      ingredientType TEXT,
      itemName TEXT,
      componentId TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0 NOT NULL
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_production_v2_approval_log_items_approvalLogId ON production_v2_approval_log_items(approvalLogId)",
    "CREATE INDEX IF NOT EXISTS idx_production_v2_approval_log_items_inventoryItemId ON production_v2_approval_log_items(inventoryItemId)",
  ],
};

