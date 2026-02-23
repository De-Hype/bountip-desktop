import { TableSchema } from "./types";
import { userSchema } from "./user.schema";
import { productSchema } from "./product.schema";
import { businessOutletSchema } from "./business_outlet.schema";
import { businessSchema } from "./business.schema";
import { businessRoleSchema } from "./business-role.schema";

export const schemas: TableSchema[] = [
  userSchema,
  productSchema,
  businessOutletSchema,
  businessSchema,
  businessRoleSchema,
];
