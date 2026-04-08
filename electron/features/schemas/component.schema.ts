import { TableSchema } from "./types";

export type ComponentUpsertParams = {
  id: string;
  name: string | null;
  reference: string | null;
  description: string | null;
  howToCreate: string | null;
  image: string | null;
  componentSize: string | null;
  componentWeight: string | null;
  minimumStockLevel: number;
  unitOfMeasure: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedAt: string | null;
  inventoryId: string | null;
  recordId: string | null;
  version: number;
};

export const componentUpsertSql = `
  INSERT INTO components (
    id,
    name,
    reference,
    description,
    howToCreate,
    image,
    componentSize,
    componentWeight,
    minimumStockLevel,
    unitOfMeasure,
    status,
    createdAt,
    updatedAt,
    createdBy,
    updatedBy,
    deletedAt,
    inventoryId,
    recordId,
    version
  ) VALUES (
    @id,
    @name,
    @reference,
    @description,
    @howToCreate,
    @image,
    @componentSize,
    @componentWeight,
    @minimumStockLevel,
    @unitOfMeasure,
    @status,
    @createdAt,
    @updatedAt,
    @createdBy,
    @updatedBy,
    @deletedAt,
    @inventoryId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    reference = excluded.reference,
    description = excluded.description,
    howToCreate = excluded.howToCreate,
    image = excluded.image,
    componentSize = excluded.componentSize,
    componentWeight = excluded.componentWeight,
    minimumStockLevel = excluded.minimumStockLevel,
    unitOfMeasure = excluded.unitOfMeasure,
    status = excluded.status,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    createdBy = excluded.createdBy,
    updatedBy = excluded.updatedBy,
    deletedAt = excluded.deletedAt,
    inventoryId = excluded.inventoryId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= components.version
     OR excluded.updatedAt >= components.updatedAt
     OR components.updatedAt IS NULL
`;

export const buildComponentUpsertParams = (c: any): ComponentUpsertParams => ({
  id: c.id,
  name: c.name ?? null,
  reference: c.reference ?? null,
  description: c.description ?? null,
  howToCreate: c.howToCreate ?? null,
  image: c.image ?? null,
  componentSize: c.componentSize ?? null,
  componentWeight: c.componentWeight ?? null,
  minimumStockLevel: Number(c.minimumStockLevel || 0),
  unitOfMeasure: c.unitOfMeasure ?? null,
  status: c.status ?? null,
  createdAt: c.createdAt ?? null,
  updatedAt: c.updatedAt ?? c.createdAt ?? null,
  createdBy: c.createdBy ?? null,
  updatedBy: c.updatedBy ?? null,
  deletedAt: c.deletedAt ?? c.deleted_at ?? null,
  inventoryId: c.inventoryId ?? null,
  recordId: c.recordId ?? null,
  version: Number(c.version || 0),
});

export const componentSchema: TableSchema = {
  name: "components",
  create: `
    CREATE TABLE IF NOT EXISTS components (
      id TEXT PRIMARY KEY,
      name TEXT,
      reference TEXT,
      description TEXT,
      howToCreate TEXT,
      image TEXT,
      componentSize TEXT,
      componentWeight TEXT,
      minimumStockLevel REAL,
      unitOfMeasure TEXT,
      status TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      createdBy TEXT,
      updatedBy TEXT,
      deletedAt TEXT,
      inventoryId TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0 NOT NULL
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_components_inventoryId ON components(inventoryId);",
    "CREATE INDEX IF NOT EXISTS idx_components_reference ON components(reference);",
    "CREATE INDEX IF NOT EXISTS idx_components_updatedAt ON components(updatedAt);",
  ],
};

