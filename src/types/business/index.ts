import { User } from "@/services/businessService";

export interface Business {
  id: string;
  name: string;
  slug: string;
  status: "active" | "inactive";
  logoUrl: string | null;
  country: string | null;
  businessType: string | null;
  address: string | null;
  currency: string | null;
  revenueRange: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  owner: User;
}