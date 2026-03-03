import { DatabaseService } from "../../services/DatabaseService";

export const updateInvoiceSettings = async (
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
      invoiceSettings = @invoiceSettings,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId,
      invoiceSettings: JSON.stringify(settings),
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

  return { success: true, settings };
};
