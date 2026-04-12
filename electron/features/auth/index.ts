import { DatabaseService } from "../../services/DatabaseService";

export const saveLoginHash = async (
  db: DatabaseService,
  email: string,
  hash: string,
) => {
  db.run("INSERT OR REPLACE INTO identity (key, value) VALUES (?, ?)", [
    "login_hash",
    JSON.stringify({ email: email.toLowerCase(), hash }),
  ]);
};

export const getLoginHash = async (
  db: DatabaseService,
): Promise<{ email: string; hash: string } | null> => {
  const row = db.get("SELECT value FROM identity WHERE key = ?", [
    "login_hash",
  ]) as { value: string } | undefined;
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.value) as { email?: string; hash?: string };
    if (!parsed.email || !parsed.hash) return null;
    return { email: parsed.email, hash: parsed.hash };
  } catch {
    return null;
  }
};

export const savePinHash = async (
  db: DatabaseService,
  email: string,
  hash: string,
) => {
  db.run("INSERT OR REPLACE INTO identity (key, value) VALUES (?, ?)", [
    "pin_hash",
    JSON.stringify({ email: email.toLowerCase(), hash }),
  ]);
};

export const getPinHash = async (
  db: DatabaseService,
): Promise<{ email: string; hash: string } | null> => {
  const row = db.get("SELECT value FROM identity WHERE key = ?", [
    "pin_hash",
  ]) as { value: string } | undefined;
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.value) as { email?: string; hash?: string };
    if (!parsed.email || !parsed.hash) return null;
    return { email: parsed.email, hash: parsed.hash };
  } catch {
    return null;
  }
};
