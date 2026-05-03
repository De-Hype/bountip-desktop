import { v4 as uuidv4 } from "uuid";
import { DatabaseService } from "../../services/DatabaseService";
import { SYNC_ACTIONS } from "../../types/action.types";
import {
  itemMasterUpsertSql,
  buildItemMasterUpsertParams,
} from "../schemas/item_master.schema";
import {
  inventoryUpsertSql,
  buildInventoryUpsertParams,
} from "../schemas/inventory.schema";
import {
  inventoryItemUpsertSql,
  buildInventoryItemUpsertParams,
} from "../schemas/inventory_item.schema";
import {
  itemLotUpsertSql,
  buildItemLotUpsertParams,
} from "../schemas/item_lot.schema";

export const createInventoryItem = async (
  db: DatabaseService,
  payload: any,
) => {

  const now = new Date().toISOString();
  const identity: any = db.getIdentity?.() as any;
  let businessId = String(
    identity?.businessId ??
      identity?.business?.id ??
      identity?.primaryBusiness?.id ??
      "",
  ).trim();

  if (!businessId) {
    try {
      const outletId = String(payload?.outletId ?? "").trim();
      if (outletId) {
        const row = db.get(
          "SELECT businessId FROM business_outlet WHERE id = ? LIMIT 1",
          [outletId],
        ) as any;
        businessId = String(row?.businessId ?? "").trim();
      }
    } catch {}
  }

  // We wrap in a transaction using the dbService.transaction helper
  // Since db.transaction is a wrapper around better-sqlite3 transaction,
  // it returns a function that when called executes the transaction.
  const tx = db.transaction(() => {
    // 1. Create or Get Item Master
    const itemMasterId = uuidv4();
    const itemMaster = {
      id: itemMasterId,
      name: payload.itemName,
      itemCode: payload.itemCode,
      businessId: businessId,
      category: payload.itemCategory,
      itemType: payload.itemType,
      unitOfPurchase: payload.unitOfPurchase,
      unitOfTransfer: payload.unitOfTransfer,
      unitOfConsumption: payload.unitOfConsumption,
      displayedUnitOfMeasure: payload.displayedUnitOfMeasure,
      transferPerPurchase: parseFloat(payload.noOfTransferBasedOnPurchase),
      consumptionPerTransfer:
        parseFloat(payload.noOfConsumptionUnitBasedOnPurchase) /
        parseFloat(payload.noOfTransferBasedOnPurchase),
      isTraceable: payload.makeItemTraceable ? 1 : 0,
      isTrackable: payload.trackInventory ? 1 : 0,
      createdAt: now,
      updatedAt: now,
      recordId: null,
      version: 1,
    };

    db.run(
      itemMasterUpsertSql,
      db.sanitize(buildItemMasterUpsertParams(itemMaster)),
    );
    db.addToQueue({
      table: "item-master",
      action: SYNC_ACTIONS.CREATE,
      data: itemMaster,
      id: itemMasterId,
    });

    // 2. Ensure Inventory exists for this outlet
    let inventory = (
      db.query("SELECT * FROM inventory WHERE outletId = ? LIMIT 1", [
        payload.outletId,
      ]) as any[]
    )[0];

    if (!inventory) {
      const inventoryId = uuidv4();
      inventory = {
        id: inventoryId,
        type: "central",
        allowProcurement: 1,
        outletId: payload.outletId,
        businessId: businessId,
        createdAt: now,
        updatedAt: now,
        recordId: null,
        version: 1,
      };
      db.run(
        inventoryUpsertSql,
        db.sanitize(buildInventoryUpsertParams(inventory)),
      );
      db.addToQueue({
        table: "inventory",
        action: SYNC_ACTIONS.CREATE,
        data: inventory,
        id: inventoryId,
      });
    }

    // 3. Create Inventory Item
    const inventoryItemId = uuidv4();
    const inventoryItem = {
      id: inventoryItemId,
      costMethod: "weighted_average",
      costPrice: parseFloat(payload.costPrice),
      currentStockLevel: parseFloat(payload.quantityPurchased),
      minimumStockLevel: parseFloat(payload.minimumStockLevel),
      reOrderLevel: parseFloat(payload.reOrderLevel),
      isDeleted: 0,
      addedBy: db.getSyncUserId(),
      modifiedBy: db.getSyncUserId(),
      createdAt: now,
      updatedAt: now,
      itemMasterId: itemMasterId,
      inventoryId: inventory.id,
      recordId: null,
      version: 1,
    };

    db.run(
      inventoryItemUpsertSql,
      db.sanitize(buildInventoryItemUpsertParams(inventoryItem)),
    );
    db.addToQueue({
      table: "inventory-item",
      action: SYNC_ACTIONS.CREATE,
      data: inventoryItem,
      id: inventoryItemId,
    });

    // 4. Create Item Lot
    const itemLotId = uuidv4();
    let supplierName = "";
    if (Array.isArray(payload.suppliers)) {
      const supplierIds = payload.suppliers.filter(Boolean);
      if (supplierIds.length > 0) {
        const placeholders = supplierIds.map(() => "?").join(",");
        const supplierRows = db.query(
          `SELECT id, name FROM customers WHERE id IN (${placeholders})`,
          supplierIds,
        ) as any[];
        const names = supplierIds.map((id: string) => {
          const found = supplierRows.find((r) => r.id === id);
          return found?.name || id;
        });
        supplierName = names.join(", ");
      }
    } else {
      supplierName = payload.suppliers || "";
    }

    const itemLot = {
      id: itemLotId,
      lotNumber: payload.lotNumber,
      quantityPurchased: parseFloat(payload.quantityPurchased),
      supplierName,
      supplierSesrialNumber: payload.supplierBarcode,
      supplierAddress: "",
      currentStockLevel: parseFloat(payload.quantityPurchased),
      initialStockLevel: parseFloat(payload.quantityPurchased),
      expiryDate: payload.expiryDate,
      costPrice: parseFloat(payload.costPrice),
      createdAt: now,
      updatedAt: now,
      itemId: inventoryItemId,
      recordId: null,
      version: 1,
    };

    db.run(itemLotUpsertSql, db.sanitize(buildItemLotUpsertParams(itemLot)));
    db.addToQueue({
      table: "item_lot",
      action: SYNC_ACTIONS.CREATE,
      data: itemLot,
      id: itemLotId,
    });

    return { itemMasterId, inventoryItemId, itemLotId };
  });

  return tx();
};
