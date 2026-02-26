import keytar from "keytar";
import crypto from "crypto";
import { DatabaseService } from "./DatabaseService";
import { LocalUserProfile } from "../types/user.types";

const SERVICE_NAME = "bountip-desktop";
const ACCOUNT_NAME = "auth-tokens";

export class AuthService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  async storeTokens(payload: any) {
    try {
      const serialized = JSON.stringify(payload);
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, serialized);
    } catch (error) {
      console.error("Failed to store tokens in keytar", error);
    }
  }

  async clearTokens() {
    try {
      await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
    } catch (error) {
      console.error("Failed to clear tokens in keytar", error);
    }
  }

  async getTokens() {
    try {
      const serialized = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
      if (!serialized) return null;
      return JSON.parse(serialized);
    } catch (error) {
      console.error("Failed to read tokens from keytar", error);
      return null;
    }
  }

  getUser(): LocalUserProfile {
    return this.db.getUserProfile();
  }

  saveUser(user: any) {
    this.db.saveIdentity(user);
  }

  saveLoginHash(email: string, password: string) {
    const normalizedEmail = (email || "").trim().toLowerCase();
    const raw = `${normalizedEmail}::${password}`;
    const hash = crypto.createHash("sha256").update(raw).digest("hex");
    this.db.saveLoginHash(hash);
  }

  verifyLoginHash(email: string, password: string): boolean {
    const stored = this.db.getLoginHash();
    if (!stored) return false;
    const normalizedEmail = (email || "").trim().toLowerCase();
    const raw = `${normalizedEmail}::${password}`;
    const hash = crypto.createHash("sha256").update(raw).digest("hex");
    return stored === hash;
  }

  savePinHash(pin: string) {
    const hash = crypto.createHash("sha256").update(pin).digest("hex");
    this.db.savePinHash(hash);
  }

  verifyPinHash(pin: string): boolean {
    const stored = this.db.getPinHash();
    if (!stored) return false;
    const hash = crypto.createHash("sha256").update(pin).digest("hex");
    return stored === hash;
  }
}
