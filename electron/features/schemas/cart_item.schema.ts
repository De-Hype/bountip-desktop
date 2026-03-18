import { TableSchema } from "./types";

export const cartItemUpsertSql = `
  INSERT INTO cart_item (
    id,
    productId,
    quantity,
    unitPrice,
    cartId,
    priceTierDiscount,
    priceTierMarkup,
    recordId,
    version
  ) VALUES (
    @id,
    @productId,
    @quantity,
    @unitPrice,
    @cartId,
    @priceTierDiscount,
    @priceTierMarkup,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    productId = excluded.productId,
    quantity = excluded.quantity,
    unitPrice = excluded.unitPrice,
    cartId = excluded.cartId,
    priceTierDiscount = excluded.priceTierDiscount,
    priceTierMarkup = excluded.priceTierMarkup,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= cart_item.version OR cart_item.version IS NULL
`;

export const buildCartItemUpsertParams = (ci: any) => ({
  id: ci.id,
  productId: ci.productId,
  quantity: ci.quantity,
  unitPrice: ci.unitPrice,
  cartId: ci.cartId,
  priceTierDiscount: ci.priceTierDiscount,
  priceTierMarkup: ci.priceTierMarkup,
  recordId: ci.recordId,
  version: ci.version,
});

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
      priceTierMarkup REAL DEFAULT 0 NOT NULL,
      recordId TEXT,
      version INTEGER DEFAULT 0
    );
  `,
  indexes: ["CREATE INDEX IF NOT EXISTS idx_cart_item_cartId ON cart_item(cartId)"],
};
