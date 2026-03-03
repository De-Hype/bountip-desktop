import { DatabaseService } from "../../services/DatabaseService";

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
      action: "UPDATE",
      data: fullOutlet,
      id: outletId,
    });
  }

  return { success: true, charges };
};
