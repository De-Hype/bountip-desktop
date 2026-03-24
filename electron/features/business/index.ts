import { DatabaseService } from "../../services/DatabaseService";

export const getBusinesses = async (db: DatabaseService) => {
  return db.query("SELECT * FROM business") as any[];
};
