import { DatabaseService } from "../../services/DatabaseService";
import { SYNC_ACTIONS } from "../../types/action.types";
import { getOutlet } from "../outlets";

export const updateServiceCharges = async (
  db: DatabaseService,
  payload: {
    outletId: string;
    charges?: any;
    settings?: any;
  },
) => {
  const { outletId } = payload;
  const charges = payload.charges ?? payload.settings;

  // 1. Update local DB
  const now = new Date().toISOString();
  db.run(
    `
    UPDATE business_outlet
    SET
      serviceCharges = @serviceCharges,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId,
      serviceCharges: JSON.stringify(charges ?? null),
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

  return { success: true, charges };
};
