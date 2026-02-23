import { TableSchema } from "./types";

export const cartItemSchema: TableSchema = {
  name: "cart_item",

  create: `
    CREATE TABLE IF NOT EXISTS cart_item (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unitPrice REAL DEFAULT 0 NOT NULL,
      cartId TEXT,
      priceTierDiscount REAL DEFAULT 0 NOT NULL,
      priceTierMarkup REAL DEFAULT 0 NOT NULL
    );
  `,
};

