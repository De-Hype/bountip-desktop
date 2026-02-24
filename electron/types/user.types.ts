export type LocalUserProfile = {
  id: string | null;
  email: string | null;
  name: string | null;
  status: string | null;
  isEmailVerified?: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  deviceId?: string | null;
};