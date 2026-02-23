export interface TableSchema {
  name: string;
  create: string;
  indexes?: string[];
  foreignKeys?: string[]; // optional if needed later
}
