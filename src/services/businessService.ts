/* eslint-disable @typescript-eslint/no-explicit-any */
import { Business } from "@/types/business";
import httpService from "./httpService";

export interface BaseResponse {
  status: boolean;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  logoUrl?: string;
  failedLoginCount: number | null;
  failedLoginRetryTime: string | null;
  lastFailedLogin: string | null;
  isEmailVerified: boolean;
  isPin: boolean;
  isDeleted: boolean;
  lastLoginAt: string | null;
  status: "active" | "inactive";
  authProvider: string | null;
  providerId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  providerData: any | null;
  createdAt: string;
  updatedAt: string;
}

export interface PrimaryBusinessResponse extends BaseResponse {
  data: Business;
}

export interface Outlet {
  id: string;
  name?: string;
  address?: string | null;
  phoneNumber?: string | null;
  isOnboarded?: boolean;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  businessType?: string | null;
  currency?: string | null;
  revenueRange?: string | null;
  logoUrl?: string | null;
  isOfflineImage?: number;
  localLogoPath?: string | null;
  operatingHours?: any;
  paymentMethods?: any;
  receiptSettings?: any;
  serviceCharges?: any;
  priceTier?: any;
}

export interface OutletListResponse extends BaseResponse {
  data: Outlet[];
}

class BusinessService {
  private request: typeof httpService;

  constructor() {
    this.request = httpService;
  }

  async loadAllOutlet() {
    return this.request.get<OutletListResponse>("/business/all", true);
  }

  async loadBusiness() {
    return this.request.get<PrimaryBusinessResponse>("/business/primary", true);
  }
}

const businessService = new BusinessService();
export default businessService;
