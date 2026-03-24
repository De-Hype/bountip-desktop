import { DatabaseService } from "../../services/DatabaseService";

export const saveLoginHash = async (db: DatabaseService, hash: string) => {
  db.run("INSERT OR REPLACE INTO identity (key, value) VALUES (?, ?)", [
    "login_hash",
    JSON.stringify({ hash }),
  ]);
};

export const getLoginHash = async (
  db: DatabaseService,
): Promise<string | null> => {
  const row = db.get("SELECT value FROM identity WHERE key = ?", [
    "login_hash",
  ]) as { value: string } | undefined;
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.value) as { hash?: string };
    return parsed.hash ?? null;
  } catch {
    return null;
  }
};

export const savePinHash = async (db: DatabaseService, hash: string) => {
  db.run("INSERT OR REPLACE INTO identity (key, value) VALUES (?, ?)", [
    "pin_hash",
    JSON.stringify({ hash }),
  ]);
};

export const getPinHash = async (
  db: DatabaseService,
): Promise<string | null> => {
  const row = db.get("SELECT value FROM identity WHERE key = ?", [
    "pin_hash",
  ]) as { value: string } | undefined;
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.value) as { hash?: string };
    return parsed.hash ?? null;
  } catch {
    return null;
  }
};
