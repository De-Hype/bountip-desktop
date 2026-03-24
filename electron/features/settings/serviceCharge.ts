import { DatabaseService } from "../../services/DatabaseService";
import { SYNC_ACTIONS } from "../../types/action.types";
import { getOutlet } from "../outlets";

export const updateServiceCharges = async (
  db: DatabaseService,
  payload: {
    outletId: string;
    settings: any;
  },
) => {
  const { outletId, settings } = payload;

  // 1. Update local DB
  const now = new Date().toISOString();
  db.run(
    `
    UPDATE business_outlet
    SET
      serviceChargeSettings = @serviceChargeSettings,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId,
      serviceChargeSettings: JSON.stringify(settings),
      updatedAt: now,
    },
  );

  // 2. Queue Sync
  const fullOutlet = await getOutlet(db, outletId);

  if (fullOutlet) {
    db.addToQueue({
      table: "business_outlet",
      action: SYNC_ACTIONS.UPDATE,
      data: fullOutlet,
      id: outletId,
    });
  }

  return { success: true, settings };
};
