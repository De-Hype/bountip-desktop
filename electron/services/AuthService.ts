import keytar from 'keytar';
import { DatabaseService } from './DatabaseService';

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

  getUser() {
    return this.db.getIdentity();
  }

  saveUser(user: any) {
    this.db.saveIdentity(user);
  }
}
