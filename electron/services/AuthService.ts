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
    await saveLoginHash(this.db, `${salt}:${hash}`);
  }

  async verifyLoginHash(email: string, password: string): Promise<boolean> {
    const stored = await getLoginHash(this.db);
    if (!stored) return false;

    const [salt, hash] = stored.split(":");
    const currentHash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, "sha512")
      .toString("hex");

    return hash === currentHash;
  }

  async savePinHash(pin: string) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
      .pbkdf2Sync(pin, salt, 1000, 64, "sha512")
      .toString("hex");
    await savePinHash(this.db, `${salt}:${hash}`);
  }

  async verifyPinHash(pin: string): Promise<boolean> {
    const stored = await getPinHash(this.db);
    if (!stored) return false;

    const [salt, hash] = stored.split(":");
    const currentHash = crypto
      .pbkdf2Sync(pin, salt, 1000, 64, "sha512")
      .toString("hex");

    return hash === currentHash;
  }
}
