import { DatabaseService } from "../../services/DatabaseService";
import { SYNC_ACTIONS } from "../../types/action.types";

export const updateServiceCharges = async (
  db: DatabaseService,
  payload: {
    outletId: string;
    charges: any;
  },
) => {
  const { outletId, charges } = payload;

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
      serviceCharges: JSON.stringify(charges),
      updatedAt: now,
    },
  );

  // 2. Queue Sync
  const fullOutlet = db.getOutlet(outletId);

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
