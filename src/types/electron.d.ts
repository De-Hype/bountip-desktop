export {};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export interface ElectronAPI {
  getOutlets: () => Promise<any[]>;
  createOutlet: (payload: any) => Promise<{ success: boolean; outlet: any }>;
  updateOutlet: (payload: { outletId: string; location: any }) => Promise<void>;
  deleteOutlet: (payload: { outletId: string }) => Promise<void>;

  cachePut: (key: string, value: any) => Promise<void>;
  cacheGet: (key: string) => Promise<any>;
  broadcast: (message: any) => void;

  importAsset: (filePath: string) => Promise<string>;
  updateBusinessDetails: (payload: {
    outletId: string;
    data: any;
  }) => Promise<{ success: boolean } | void>;

  updateOperatingHours: (payload: {
    outletId: string;
    operatingHours: any;
  }) => Promise<{ success: boolean }>;

  updateTaxSettings: (payload: {
    outletId: string;
    settings: any;
  }) => Promise<{ success: boolean }>;

  updateServiceCharges: (payload: {
    outletId: string;
    charges: any;
  }) => Promise<{ success: boolean }>;

  updatePaymentMethods: (payload: {
    outletId: string;
    paymentMethods: any;
  }) => Promise<{ success: boolean }>;

  triggerSync: (forceFullPull?: boolean) => Promise<void>;
  syncTrigger: () => void; // Deprecated, use triggerSync instead if possible

  getNetworkStatus: () => Promise<{ online: boolean }>;
  onNetworkStatus: (
    callback: (status: { online: boolean }) => void,
  ) => () => void;
  setNetworkStatus: (online: boolean) => void;

  queueAdd: (op: {
    method: string;
    path: string;
    data?: any;
    useAuth?: boolean;
  }) => Promise<void>;

  savePinHash: (pin: string) => Promise<void>;

  storeTokens: (payload: any) => void;
  clearTokens: () => void;
  getTokens: () => Promise<any | null>;

  saveUser: (user: any) => Promise<void>;
  getUser: () => Promise<any | null>;

  verifyLoginHash: (email: string, password: string) => Promise<boolean>;
  saveLoginHash: (email: string, password: string) => Promise<void>;

  getPeers: () => Promise<any[]>;
  onPeers: (cb: (list: any[]) => void) => () => void;
  onP2PMessage: (cb: (payload: any) => void) => () => void;

  dbQuery: (sql: string, params?: any[]) => Promise<any>;

  openExternal: (url: string) => Promise<boolean>;
}
