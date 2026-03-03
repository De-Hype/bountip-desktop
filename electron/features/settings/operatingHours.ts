import { DatabaseService } from "../../services/DatabaseService";

export const updateOperatingHours = async (
  db: DatabaseService,
  payload: {
    outletId: string;
    operatingHours: any;
  },
) => {
  const { outletId, operatingHours } = payload;

  // 1. Update local DB
  const now = new Date().toISOString();
  db.run(
    `
    UPDATE business_outlet
    SET
      operatingHours = @operatingHours,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId,
      operatingHours: JSON.stringify(operatingHours),
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

  return { success: true, operatingHours };
};
