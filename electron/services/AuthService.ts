import keytar from "keytar";
import crypto from "crypto";
import { DatabaseService } from "./DatabaseService";
import { LocalUserProfile } from "../types/user.types";
import {
  saveLoginHash,
  getLoginHash,
  savePinHash,
  getPinHash,
} from "../features/auth";

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

  async saveLoginHash(email: string, password: string) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, "sha512")
      .toString("hex");
    await saveLoginHash(this.db, email, `${salt}:${hash}`);
  }

  async verifyLoginHash(email: string, password: string): Promise<boolean> {
    const stored = await getLoginHash(this.db);
    if (!stored) return false;

    // Verify email matches the one stored in the hash
    if (stored.email !== email.toLowerCase()) return false;

    const [salt, hash] = stored.hash.split(":");
    const currentHash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, "sha512")
      .toString("hex");

    return hash === currentHash;
  }

  async savePinHash(email: string, pin: string) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
      .pbkdf2Sync(pin, salt, 1000, 64, "sha512")
      .toString("hex");
    await savePinHash(this.db, email, `${salt}:${hash}`);
  }

  async verifyPinHash(email: string, pin: string): Promise<boolean> {
    const stored = await getPinHash(this.db);
    if (!stored) return false;

    // Verify email matches the one stored in the hash
    if (stored.email !== email.toLowerCase()) return false;

    const [salt, hash] = stored.hash.split(":");
    const currentHash = crypto
      .pbkdf2Sync(pin, salt, 1000, 64, "sha512")
      .toString("hex");

    return hash === currentHash;
  }
}
