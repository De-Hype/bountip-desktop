import { v4 as uuidv4 } from "uuid";
import { DatabaseService } from "../../../services/DatabaseService";
import { SYNC_ACTIONS } from "../../../types/action.types";
import {
  customerUpsertSql,
  buildCustomerUpsertParams,
} from "../../schemas/customers.schema";

export const bulkCreateCustomers = async (
  db: DatabaseService,
  payload: { outletId: string; data: any[] },
) => {
  const { outletId, data } = payload;
  const now = new Date().toISOString();
  const createdIds: string[] = [];

  const tx = db.transaction(() => {
    for (const c of data) {
      const id = c.id || uuidv4();
      const customerData = {
        ...c,
        id,
        outletId,
        createdAt: c.createdAt || now,
        updatedAt: now,
        status: c.status || "active",
        customerType: c.customerType || "individual",
        emailVerified: c.emailVerified ? 1 : 0,
        phoneVerfied: c.phoneVerfied ? 1 : 0,
        version: c.version || 1,
      };

      const params = buildCustomerUpsertParams(customerData);
      db.run(customerUpsertSql, db.sanitize(params));

      db.addToQueue({
        table: "customers",
        action: SYNC_ACTIONS.CREATE,
        data: customerData,
        id,
      });

      createdIds.push(id);
    }
  });

  tx();

  return { ids: createdIds, status: "success", count: createdIds.length };
};

export const upsertCustomer = async (db: DatabaseService, payload: any) => {
  const id = payload.id || uuidv4();
  const params = db.sanitize(buildCustomerUpsertParams(payload));

  db.run(customerUpsertSql, params);

  db.addToQueue({
    table: "customers",
    action:
      payload.createdAt === payload.updatedAt
        ? SYNC_ACTIONS.CREATE
        : SYNC_ACTIONS.UPDATE,
    data: payload,
    id,
  });

  return { id };
};

export const getCustomers = async (db: DatabaseService) => {
  return db.query("SELECT * FROM customers") as any[];
};
