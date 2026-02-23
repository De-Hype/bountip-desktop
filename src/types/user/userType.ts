export type UserType = {
  id: string;
  email: string | null;
  fullName: string | null;
  password: string | null;
  pin: string | null;
  otpCodeHash: string | null;
  otpCodeExpiry: string | null;

  failedLoginCount: number;
  failedLoginRetryTime: string | null;
  lastFailedLogin: string | null;

  isEmailVerified: boolean;
  isPin: boolean;
  isDeleted: boolean;

  lastLoginAt: string | null;
  status: "active" | "inactive" | "suspended" | string | null;

  authProvider: string | null;
  providerId: string | null;
  publicId: string | null;

  providerData: Record<string, unknown> | null;

  createdAt: string | null;
  updatedAt: string | null;
  lastSyncedAt: string | null;
};
