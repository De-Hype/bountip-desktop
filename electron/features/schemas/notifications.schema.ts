import { TableSchema } from "./types";

export const notificationsSchema: TableSchema = {
  name: "notifications",

  create: `
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      isRead INTEGER DEFAULT 0 NOT NULL,
      createdAt TEXT,
      userId TEXT
    );
  `,
};

