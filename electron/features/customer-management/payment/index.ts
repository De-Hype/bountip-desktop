import { v4 as uuidv4 } from "uuid";
import { DatabaseService } from "../../../services/DatabaseService";
import { SYNC_ACTIONS } from "../../../types/action.types";

export const getPaymentTerms = async (
  db: DatabaseService,
  outletId: string,
) => {
  return db.query(
    "SELECT * FROM payment_terms WHERE outletId = ? AND deletedAt IS NULL",
    [outletId],
  ) as any[];
};

export const savePaymentTerm = async (
  db: DatabaseService,
  payload: {
    id?: string;
    name: string;
    paymentType: string;
    instantPayment: boolean;
    paymentOnDelivery: boolean;
    paymentInInstallment: any;
    outletId: string;
  },
) => {
  const id = payload.id || uuidv4();
  const now = new Date().toISOString();

  const data = {
    id,
    name: payload.name,
    paymentType: payload.paymentType,
    instantPayment: payload.instantPayment ? 1 : 0,
    paymentOnDelivery: payload.paymentOnDelivery ? 1 : 0,
    paymentInInstallment: payload.paymentInInstallment
      ? JSON.stringify(payload.paymentInInstallment)
      : null,
    outletId: payload.outletId,
    version: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  db.run(
    `
    INSERT INTO payment_terms (
      id, name, paymentType, instantPayment, paymentOnDelivery, 
      paymentInInstallment, outletId, version, createdAt, updatedAt, deletedAt
    ) VALUES (
      @id, @name, @paymentType, @instantPayment, @paymentOnDelivery, 
      @paymentInInstallment, @outletId, @version, @createdAt, @updatedAt, @deletedAt
    ) ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      paymentType = excluded.paymentType,
      instantPayment = excluded.instantPayment,
      paymentOnDelivery = excluded.paymentOnDelivery,
      paymentInInstallment = excluded.paymentInInstallment,
      version = payment_terms.version + 1,
      updatedAt = excluded.updatedAt
  `,
    data,
  );

  // Queue Sync
  db.addToQueue({
    table: "payment_terms",
    action: payload.id ? SYNC_ACTIONS.UPDATE : SYNC_ACTIONS.CREATE,
    data: {
      ...data,
      paymentInInstallment: payload.paymentInInstallment, // Send original object to sync
    },
    id,
  });

  return data;
};

export const deletePaymentTerm = async (db: DatabaseService, id: string) => {
  const now = new Date().toISOString();
  db.run("UPDATE payment_terms SET deletedAt = ? WHERE id = ?", [now, id]);

  const record = (
    db.query("SELECT * FROM payment_terms WHERE id = ?", [id]) as any[]
  )[0];

  if (record) {
    db.addToQueue({
      table: "payment_terms",
      action: SYNC_ACTIONS.DELETE,
      data: record,
      id,
    });
  }
};
