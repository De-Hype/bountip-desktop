import { DatabaseService } from "../../services/DatabaseService";

export const updatePaymentMethods = async (
  db: DatabaseService,
  payload: {
    outletId: string;
    paymentMethods: any;
  },
) => {
  const { outletId, paymentMethods } = payload;

  // 1. Update local DB
  const now = new Date().toISOString();
  db.run(
    `
    UPDATE business_outlet
    SET
      paymentMethods = @paymentMethods,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId,
      paymentMethods: JSON.stringify(paymentMethods),
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

  return { success: true, paymentMethods };
};
