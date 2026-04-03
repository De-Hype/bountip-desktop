export interface LoadStorefrontInfoResponse {
  status: "success" | "error" | string;
  message: string;
  data: string | BusinessOutlet;
}

export interface BusinessOutlet {
  id: string;
  name: string;
  storeCode: string;
  businessId: string;
  colourTheme: string | null;
  coverUrl: string | null;
  waPhoneNumber: string;
  phoneNumber: string | null;
  webChannel: boolean;
  address: string;
  waChannel: boolean;
  emailChannel: boolean;
  logoUrl: string;
  country: string;
  revenueRange: string | null;
  businessType: string | null;
  customSubDomain: string;
  emailAlias: string;
  leadTime: number;
  currency: string;
  status: string;

  operatingHours: OperatingHours;
  taxSettings: TaxSettings;
  serviceCharges: ServiceCharges;
  paymentMethods: PaymentMethods;

  receiptSettings: ReceiptSettings;
  labelSettings: LabelSettings;
  invoiceSettings: InvoiceSettings;

  bankDetails: BankDetails;
  businessOperation: BusinessOperation;

  paymentTiers: any | null;

  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/* ---------------- OPERATING HOURS ---------------- */

export interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  open: string;
  close: string;
  isActive: boolean;
}

/* ---------------- TAX ---------------- */

export interface TaxSettings {
  taxes: Tax[];
}

export interface Tax {
  id: string;
  name: string;
  rate: number;
  applicationType: string;
  scope: string;
}

/* ---------------- SERVICE CHARGES ---------------- */

export interface ServiceCharges {
  charges: ServiceCharge[];
}

export interface ServiceCharge {
  id: string;
  name: string;
  rate: number;
  applicationType: string;
}

/* ---------------- PAYMENT METHODS ---------------- */

export interface PaymentMethods {
  methods: PaymentMethod[];
}

export interface PaymentMethod {
  id: string;
  name: string;
  isActive: boolean;
}

/* ---------------- RECEIPT SETTINGS ---------------- */

export interface ReceiptSettings {
  customizedLogoUrl: string;
  fontStyle: string;
  paperSize: string;

  showBakeryName: boolean;
  showPaymentSuccessText: boolean;
  customSuccessText: string;

  showTotalPaidAtTop: boolean;
  showCustomerName: boolean;
  showOrderName: boolean;
  showOrderTime: boolean;

  showCompanyCashierName: boolean;
  showCompanyPhoneNumber: boolean;
  showCompanyEmail: boolean;
  showCompanyBankDetails: boolean;
  showCompanyBarcode: boolean;

  showModifiedBelowItems: boolean;

  selectedColumns: SelectedColumns;

  showDiscounts: boolean;
  showTaxDetails: boolean;
  showPaymentMethod: boolean;

  customThankYouMessage: string;
  customHeader: string;

  showLogo: boolean;
}

/* ---------------- LABEL SETTINGS ---------------- */

export interface LabelSettings {
  customizedLogoUrl: string;
  paperSize: string;
  fontStyle: string;

  showBakeryName: boolean;
  showBakeryLogo: boolean;

  customHeader: string;

  showPaymentSuccessText: boolean;
  customSuccessText: string;

  showTotalPaidAtTop: boolean;

  showLabelName: boolean;
  showLabelType: boolean;
  showProductName: boolean;
  showProductBarCode: boolean;

  showExpiryDate: boolean;
  showBatchNumber: boolean;
  showManufacturingDate: boolean;
  showWeight: boolean;

  showIngredientsSummary: boolean;
  showAllergenInfo: boolean;

  showPrice: boolean;

  customThankYouMessage: string;
}

/* ---------------- INVOICE SETTINGS ---------------- */

export interface InvoiceSettings {
  customizedLogoUrl: string;
  fontStyle: string;
  showBakeryName: boolean;
  paperSize: string;

  showPaymentSucessText: boolean;
  customizedPaymentSucessText: string;

  showTotalPaidAtTop: boolean;

  showInvoiceNumber: boolean;
  showInvoiceIssueDate: boolean;
  showInvoiceDueDate: boolean;

  showInvoiceClientName: boolean;
  showInvoiceClientAddress: boolean;

  showModifierBelowItems: boolean;

  selectedColumns: SelectedColumns;

  showDiscountLine: boolean;
  showTax: boolean;
  showShippingFee: boolean;

  showPaymentStatus: boolean;
  showPaymentMethod: boolean;

  showTaxOnOrderReceipt: boolean;
  showTaxOnPaymentReceipt: boolean;

  showAccountDetails: boolean;
  showEmail: boolean;
  showAddress: boolean;

  customThankYouMessage: string;

  showLogo: boolean;
}

/* ---------------- SHARED ---------------- */

export interface SelectedColumns {
  orderName: boolean;
  sku: boolean;
  qty: boolean;
  subTotal: boolean;
  total: boolean;
}

/* ---------------- BANK ---------------- */

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string;
  swiftCode: string;
  sortCode: string;
}

/* ---------------- BUSINESS OPERATION ---------------- */

export interface BusinessOperation {
  delivery: boolean;
  pickup: boolean;
  both: boolean;
}

export interface Outlet {
  recordId: string | null;
  version: number;
  id: string;
  name: string;
  description: string | null;
  address: string;
  state: string;
  email: string;
  postalCode: string;
  phoneNumber: string;
  whatsappNumber: string | null;
  currency: string;
  revenueRange: string | null;
  country: string;
  storeCode: string;

  localInventoryRef: string | null;
  centralInventoryRef: string | null;
  outletRef: string;

  isMainLocation: boolean;
  businessType: string;
  isActive: boolean;

  whatsappChannel: boolean;
  emailChannel: boolean;

  isDeleted: boolean;
  isOnboarded: boolean;

  operatingHours: OperatingHours;

  logoUrl: string;

  taxSettings: TaxSettings;
  serviceCharges: ServiceCharges;
  paymentMethods: PaymentMethods;

  bankDetails: BankDetails | null;

  priceTier: PriceTier[];

  receiptSettings: ReceiptSettings;
  labelSettings: LabelSettings;
  invoiceSettings: InvoiceSettings;

  generalSettings: any | null;

  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string | null;

  business: Business;
}

/* ---------------- PRICE TIER ---------------- */

export interface PriceTier {
  id: string;
  name: string;
  description: string;
  pricingRules: {
    markupPercentage: number;
  };
  isActive: boolean;
}
/* ---------------- BUSINESS ---------------- */

export interface Business {
  recordId: string | null;
  version: number;
  id: string;
  name: string;
  slug: string;
  status: string;

  logoUrl: string | null;
  country: string | null;
  businessType: string | null;
  address: string | null;
  currency: string | null;
  revenueRange: string | null;

  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string | null;

  ownerId: string;
}

type WeightScale = "gram" | "kg" | "lb"; // extend if needed

export type ProductType = {
  recordId: string | null;
  version: number;
  id: string;
  isActive: boolean;
  name: string;
  description: string;
  category: string;
  price: string;
  preparationArea: string | null;
  weight: string;
  productCode: string | null;
  weightScale: WeightScale;
  productAvailableStock: number | null;
  packagingMethod: string[];
  priceTierId: string | null;
  allergenList: string[];
  logoUrl: string;
  logoHash: string | null;
  leadTime: number;
  availableAtStorefront: boolean;
  createdAtStorefront: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string | null;
  modifiers: unknown[];
};

export type Meta = {
  total: number;

  page: number;
  limit: number;
  totalPages: number;
};

export interface LoadProductResponse {
  status: boolean;
  message: string;
  data: {
    data: ProductType[];
    meta:Meta
  };
}


export interface LoadCategoryResponse{
  status: boolean;
  message: string;
  data: {
    id: string;
    key: string;
    data: {
      name: string;
    }[];
  };
}
