export interface TableSchema {
  name: string;
  create: string;
  indexes?: string[];
  foreignKeys?: string[]; 
}
