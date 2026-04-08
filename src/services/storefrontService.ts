import {
  LoadCategoryResponse,
  LoadProductResponse,
  LoadStorefrontInfoResponse,
  OperatingHours,
  Outlet,
} from "@/types/storefront";
import httpService from "./httpService";

class StoreFrontService {
  private request: typeof httpService;

  constructor() {
    this.request = httpService;
  }

  async loadStorefrontInfo(outlet_id: string) {
    return this.request.get<LoadStorefrontInfoResponse>(
      `/outlet-store/${outlet_id}/store-info`,
      true,
    );
  }

  async activateStoreFront(outlet_id: string) {
    return this.request.post<Outlet>(
      "/business/activate-storefront",
      {
        outletId: outlet_id,
      },
      true,
    );
  }
  async updateStoreChannels(
    outlet_id: string,
    channels: {
      whatsappChannel: boolean;
      whatsappNumber: string | null;
      emailChannel: boolean;
      webChannel: boolean;
    },
  ) {
    return this.request.patch<Outlet>(
      `/outlet-store/${outlet_id}/store-channels`,
      {
        whatsappChannel: channels.whatsappChannel,
        whatsappNumber: channels.whatsappNumber,
        emailChannel: channels.emailChannel,
        webChannel: channels.webChannel,
      },
      true,
    );
  }

  async updateStorefrontLogo(
    outlet_id: string,
    data: {
      logoUrl: string | null;
      coverUrl: string | null;
      color: string;
    },
  ) {
    return this.request.patch(
      `/outlet-store/${outlet_id}/logo-update`,
      {
        logoUrl: data.logoUrl,
        coverUrl: data.coverUrl,
        color: data.color,
      },
      true,
    );
  }

  async updateStoreOperations(
    outlet_id: string,
    data: {
      storeCode: string;
      delivery: boolean;
      pickup: boolean;
      bankName: string;
      accountName: string;
      accountNumber: string;
      iban?: string;
      swiftCode?: string;
      sortCode?: string;
      operatingHours: OperatingHours;
      leadTime: number;
    },
  ) {
    const iban = String(data.iban ?? "").trim();
    const swiftCode = String(data.swiftCode ?? "").trim();
    const sortCode = String(data.sortCode ?? "").trim();
    return this.request.patch<Outlet>(
      `/outlet-store/${outlet_id}/store-operations`,
      {
        storeCode: data.storeCode,
        delivery: data.delivery,
        pickup: data.pickup,
        bankName: data.bankName,
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        ...(iban ? { iban } : {}),
        ...(swiftCode ? { swiftCode } : {}),
        ...(sortCode ? { sortCode } : {}),
        operatingHours: data.operatingHours,
        leadTime: data.leadTime,
      },
      true,
    );
  }

  async bulkProductAvailability(
    outlet_id: string,
    data: { id: "all"; availableAtStorefront: boolean; updateData: true },
  ) {
    return this.request.patch(
      `/${outlet_id}/products/availability/bulk`,
      {
        id: data.id,
        availableAtStorefront: data.availableAtStorefront,
        updateData: data.updateData,
      },
      true,
    );
  }
  async markAvailability(
    outlet_id: string,
    product_id: string,
    data: { availableAtStorefront: boolean },
  ) {
    return this.request.patch(
      `/${outlet_id}/products/${product_id}/availability`,
      {
        availableAtStorefront: data.availableAtStorefront,
      },
      true,
    );
  }
  async loadProducts(
    outlet_id: string,
    limit: string | number,
    page: string | number,
  ) {
    if (!limit) limit = 10;
    if (!page) page = 1;

    return this.request.get<LoadProductResponse>(
      `/${outlet_id}/products?limit=${limit}&page=${page}`,
      true,
    );
  }

  async loadCategories(storeCode: string) {
    const code = String(storeCode || "").trim();
    return this.request.get<LoadCategoryResponse>(
      `https://jellyfish-app-dvaxa.ondigitalocean.app/${code}/products/categories/all`,
      false,
    );
  }

  async loadProductForPreview(
    storeCode: string,
    limit: number = 10,
    page: number = 1,
  ) {
    const code = String(storeCode || "").trim();
    return this.request.get<LoadProductResponse>(
      `https://jellyfish-app-dvaxa.ondigitalocean.app/${code}/products?limit=${limit}&page=${page}`,
      false,
    );
  }
}

const storeFrontService = new StoreFrontService();
export default storeFrontService;
