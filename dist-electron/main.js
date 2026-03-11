import St, { app as We, BrowserWindow as ht, net as vt, protocol as Js, ipcMain as ve, nativeImage as tf } from "electron";
import Se from "path";
import Vt, { pathToFileURL as bo, fileURLToPath as rf } from "url";
import nf from "better-sqlite3";
import Ce from "fs";
import Je, { randomUUID as sf } from "crypto";
import hn from "keytar";
import of from "dgram";
import Ro from "net";
import af from "constants";
import br from "stream";
import Zr from "util";
import gc from "assert";
import Rr from "child_process";
import en from "events";
import mc from "tty";
import At from "os";
import lf from "string_decoder";
import Ec from "zlib";
import Tc from "http";
import uf from "https";
const cf = `
  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    fullName TEXT NOT NULL,
    password TEXT,
    pin TEXT NOT NULL,
    otpCodeHash TEXT,
    otpCodeExpiry TEXT,
    failedLoginCount INTEGER DEFAULT 0,
    failedLoginRetryTime TEXT,
    lastFailedLogin TEXT,
    isEmailVerified INTEGER DEFAULT 0 NOT NULL,
    isPin INTEGER DEFAULT 0 NOT NULL,
    isDeleted INTEGER DEFAULT 0 NOT NULL,
    lastLoginAt TEXT,
    status TEXT DEFAULT 'inactive' NOT NULL,
    authProvider TEXT,
    providerId TEXT,
    publicId TEXT,
    providerData TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    lastSyncedAt TEXT
  );
`, df = `
  INSERT OR REPLACE INTO user (
    id,
    email,
    fullName,
    password,
    pin,
    otpCodeHash,
    otpCodeExpiry,
    failedLoginCount,
    failedLoginRetryTime,
    lastFailedLogin,
    isEmailVerified,
    isPin,
    isDeleted,
    lastLoginAt,
    status,
    authProvider,
    providerId,
    publicId,
    providerData,
    createdAt,
    updatedAt,
    lastSyncedAt
  ) VALUES (
    @id,
    @email,
    @fullName,
    @password,
    @pin,
    @otpCodeHash,
    @otpCodeExpiry,
    @failedLoginCount,
    @failedLoginRetryTime,
    @lastFailedLogin,
    @isEmailVerified,
    @isPin,
    @isDeleted,
    @lastLoginAt,
    @status,
    @authProvider,
    @providerId,
    @publicId,
    @providerData,
    @createdAt,
    @updatedAt,
    @lastSyncedAt
  )
`, ff = (e) => ({
  id: e.id,
  email: e.email ?? null,
  fullName: e.fullName ?? null,
  password: e.password ?? null,
  pin: e.pin ?? null,
  otpCodeHash: e.otpCodeHash ?? null,
  otpCodeExpiry: e.otpCodeExpiry ?? null,
  failedLoginCount: e.failedLoginCount ?? 0,
  failedLoginRetryTime: e.failedLoginRetryTime ?? null,
  lastFailedLogin: e.lastFailedLogin ?? null,
  isEmailVerified: e.isEmailVerified ? 1 : 0,
  isPin: e.isPin ? 1 : 0,
  isDeleted: e.isDeleted ? 1 : 0,
  lastLoginAt: e.lastLoginAt ?? null,
  status: e.status ?? "inactive",
  authProvider: e.authProvider ?? null,
  providerId: e.providerId ?? null,
  publicId: e.publicId ?? null,
  providerData: e.providerData && typeof e.providerData == "object" ? JSON.stringify(e.providerData) : e.providerData ?? null,
  createdAt: e.createdAt ?? null,
  updatedAt: e.updatedAt ?? null,
  lastSyncedAt: e.lastSyncedAt ?? null
}), hf = {
  name: "user",
  create: cf,
  indexes: [
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email ON user(email);",
    "CREATE INDEX IF NOT EXISTS idx_user_status ON user(status);",
    "CREATE INDEX IF NOT EXISTS idx_user_lastSyncedAt ON user(lastSyncedAt);"
  ]
}, pf = `
  CREATE TABLE IF NOT EXISTS product (
    localId INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT,
    name TEXT NOT NULL,
    isActive INTEGER DEFAULT 1 NOT NULL,
    description TEXT,
    category TEXT,
    price REAL,
    preparationArea TEXT,
    weight REAL,
    productCode TEXT,
    weightScale TEXT,
    productAvailableStock REAL,
    packagingMethod TEXT,
    priceTierId TEXT,
    allergenList TEXT,
    logoUrl TEXT,
    logoHash TEXT,
    leadTime INTEGER,
    availableAtStorefront INTEGER DEFAULT 0 NOT NULL,
    createdAtStorefront INTEGER DEFAULT 0 NOT NULL,
    isDeleted INTEGER DEFAULT 0 NOT NULL,
    createdAt TEXT,
    updatedAt TEXT,
    lastSyncedAt TEXT,
    outletId TEXT
  );
`, gf = `
  INSERT OR REPLACE INTO product (
    id,
    name,
    isActive,
    description,
    category,
    price,
    preparationArea,
    weight,
    productCode,
    weightScale,
    productAvailableStock,
    packagingMethod,
    priceTierId,
    allergenList,
    logoUrl,
    logoHash,
    leadTime,
    availableAtStorefront,
    createdAtStorefront,
    isDeleted,
    createdAt,
    updatedAt,
    lastSyncedAt,
    outletId
  ) VALUES (
    @id,
    @name,
    @isActive,
    @description,
    @category,
    @price,
    @preparationArea,
    @weight,
    @productCode,
    @weightScale,
    @productAvailableStock,
    @packagingMethod,
    @priceTierId,
    @allergenList,
    @logoUrl,
    @logoHash,
    @leadTime,
    @availableAtStorefront,
    @createdAtStorefront,
    @isDeleted,
    @createdAt,
    @updatedAt,
    @lastSyncedAt,
    @outletId
  )
`, mf = (e) => {
  let n = null;
  return Array.isArray(e.allergenList) ? n = JSON.stringify(e.allergenList) : e.allergenList && typeof e.allergenList == "object" && Array.isArray(e.allergenList.allergies) ? n = JSON.stringify(e.allergenList.allergies) : Array.isArray(e.allergens) && (n = JSON.stringify(e.allergens)), {
    id: e.id,
    name: e.name ?? null,
    isActive: (e.isActive, 1),
    description: e.description ?? null,
    category: e.category ?? null,
    price: e.price ?? null,
    preparationArea: e.preparationArea ?? null,
    weight: e.weight ?? null,
    productCode: e.productCode ?? null,
    weightScale: e.weightScale ?? null,
    productAvailableStock: e.productAvailableStock ?? null,
    packagingMethod: e.packagingMethod ? JSON.stringify(e.packagingMethod) : null,
    priceTierId: e.priceTierId ? JSON.stringify(e.priceTierId) : null,
    allergenList: n && n !== "[]" && n !== "null" ? n : null,
    logoUrl: e.logoUrl ?? null,
    logoHash: e.logoHash ?? null,
    leadTime: e.leadTime ?? null,
    availableAtStorefront: e.availableAtStorefront ? 1 : 0,
    createdAtStorefront: e.createdAtStorefront ? 1 : 0,
    isDeleted: e.isDeleted ? 1 : 0,
    createdAt: e.createdAt ?? null,
    updatedAt: e.updatedAt ?? null,
    lastSyncedAt: e.lastSyncedAt ?? null,
    outletId: e.outletId ?? null
  };
}, Ef = {
  name: "product",
  create: pf,
  indexes: [
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_product_id ON product(id);",
    "CREATE INDEX IF NOT EXISTS idx_product_outlet ON product(outletId);",
    "CREATE INDEX IF NOT EXISTS idx_product_category ON product(category);",
    "CREATE INDEX IF NOT EXISTS idx_product_isActive ON product(isActive);",
    "CREATE INDEX IF NOT EXISTS idx_product_lastSyncedAt ON product(lastSyncedAt);"
  ]
}, Tf = `
  CREATE TABLE IF NOT EXISTS business_outlet (
    localId INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    state TEXT,
    email TEXT,
    postalCode TEXT,
    phoneNumber TEXT,
    whatsappNumber TEXT,
    currency TEXT,
    revenueRange TEXT,
    country TEXT,
    storeCode TEXT,
    localInventoryRef TEXT,
    centralInventoryRef TEXT,
    outletRef TEXT,
    isMainLocation INTEGER DEFAULT 0 NOT NULL,
    businessType TEXT,
    isActive INTEGER DEFAULT 1 NOT NULL,
    whatsappChannel INTEGER DEFAULT 1 NOT NULL,
    emailChannel INTEGER DEFAULT 1 NOT NULL,
    isDeleted INTEGER DEFAULT 0 NOT NULL,
    isOnboarded INTEGER DEFAULT 0 NOT NULL,
    isOfflineImage INTEGER DEFAULT 0 NOT NULL,
    localLogoPath TEXT,
    operatingHours TEXT,
    logoUrl TEXT,
    taxSettings TEXT,
    serviceCharges TEXT,
    paymentMethods TEXT,
    priceTier TEXT,
    receiptSettings TEXT,
    labelSettings TEXT,
    invoiceSettings TEXT,
    generalSettings TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    lastSyncedAt TEXT,
    businessId TEXT,
    bankDetails TEXT
  );
`, yc = `
  INSERT INTO business_outlet (
    id,
    name,
    description,
    address,
    state,
    email,
    postalCode,
    phoneNumber,
    whatsappNumber,
    currency,
    revenueRange,
    country,
    storeCode,
    localInventoryRef,
    centralInventoryRef,
    outletRef,
    isMainLocation,
    businessType,
    isActive,
    whatsappChannel,
    emailChannel,
    isDeleted,
    isOnboarded,
    isOfflineImage,
    localLogoPath,
    operatingHours,
    logoUrl,
    taxSettings,
    serviceCharges,
    paymentMethods,
    priceTier,
    receiptSettings,
    labelSettings,
    invoiceSettings,
    generalSettings,
    createdAt,
    updatedAt,
    lastSyncedAt,
    businessId,
    bankDetails
  ) VALUES (
    @id,
    @name,
    @description,
    @address,
    @state,
    @email,
    @postalCode,
    @phoneNumber,
    @whatsappNumber,
    @currency,
    @revenueRange,
    @country,
    @storeCode,
    @localInventoryRef,
    @centralInventoryRef,
    @outletRef,
    @isMainLocation,
    @businessType,
    @isActive,
    @whatsappChannel,
    @emailChannel,
    @isDeleted,
    @isOnboarded,
    @isOfflineImage,
    @localLogoPath,
    @operatingHours,
    @logoUrl,
    @taxSettings,
    @serviceCharges,
    @paymentMethods,
    @priceTier,
    @receiptSettings,
    @labelSettings,
    @invoiceSettings,
    @generalSettings,
    @createdAt,
    @updatedAt,
    @lastSyncedAt,
    @businessId,
    @bankDetails
  )
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    description = excluded.description,
    address = excluded.address,
    state = excluded.state,
    email = excluded.email,
    postalCode = excluded.postalCode,
    phoneNumber = excluded.phoneNumber,
    whatsappNumber = excluded.whatsappNumber,
    currency = excluded.currency,
    revenueRange = excluded.revenueRange,
    country = excluded.country,
    storeCode = excluded.storeCode,
    localInventoryRef = excluded.localInventoryRef,
    centralInventoryRef = excluded.centralInventoryRef,
    outletRef = excluded.outletRef,
    isMainLocation = excluded.isMainLocation,
    businessType = excluded.businessType,
    isActive = excluded.isActive,
    whatsappChannel = excluded.whatsappChannel,
    emailChannel = excluded.emailChannel,
    isDeleted = excluded.isDeleted,
    isOnboarded = excluded.isOnboarded,
    operatingHours = excluded.operatingHours,
    logoUrl = excluded.logoUrl,
    taxSettings = excluded.taxSettings,
    serviceCharges = excluded.serviceCharges,
    paymentMethods = excluded.paymentMethods,
    priceTier = excluded.priceTier,
    receiptSettings = excluded.receiptSettings,
    labelSettings = excluded.labelSettings,
    invoiceSettings = excluded.invoiceSettings,
    generalSettings = excluded.generalSettings,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    lastSyncedAt = excluded.lastSyncedAt,
    businessId = excluded.businessId,
    bankDetails = excluded.bankDetails
`, vc = (e) => ({
  id: e.id,
  name: e.name ?? null,
  description: e.description ?? null,
  address: e.address ?? null,
  state: e.state ?? null,
  email: e.email ?? null,
  postalCode: e.postalCode ?? null,
  phoneNumber: e.phoneNumber ?? null,
  whatsappNumber: e.whatsappNumber ?? null,
  currency: e.currency ?? null,
  revenueRange: e.revenueRange ?? null,
  country: e.country ?? null,
  storeCode: e.storeCode ?? null,
  localInventoryRef: e.localInventoryRef ?? null,
  centralInventoryRef: e.centralInventoryRef ?? null,
  outletRef: e.outletRef ?? null,
  isMainLocation: e.isMainLocation ? 1 : 0,
  businessType: e.businessType ?? null,
  isActive: e.isActive ? 1 : 0,
  whatsappChannel: e.whatsappChannel ? 1 : 0,
  emailChannel: e.emailChannel ? 1 : 0,
  isDeleted: e.isDeleted ?? 0,
  isOnboarded: e.isOnboarded ?? 0,
  isOfflineImage: e.isOfflineImage ?? 0,
  localLogoPath: e.localLogoPath ?? null,
  operatingHours: e.operatingHours ?? null,
  logoUrl: e.logoUrl ?? null,
  taxSettings: e.taxSettings && typeof e.taxSettings == "object" ? JSON.stringify(e.taxSettings) : e.taxSettings ?? null,
  serviceCharges: e.serviceCharges && typeof e.serviceCharges == "object" ? JSON.stringify(e.serviceCharges) : e.serviceCharges ?? null,
  paymentMethods: e.paymentMethods && typeof e.paymentMethods == "object" ? JSON.stringify(e.paymentMethods) : e.paymentMethods ?? null,
  priceTier: e.priceTier && typeof e.priceTier == "object" ? JSON.stringify(e.priceTier) : e.priceTier ?? null,
  receiptSettings: e.receiptSettings && typeof e.receiptSettings == "object" ? JSON.stringify(e.receiptSettings) : e.receiptSettings ?? null,
  labelSettings: e.labelSettings && typeof e.labelSettings == "object" ? JSON.stringify(e.labelSettings) : e.labelSettings ?? null,
  invoiceSettings: e.invoiceSettings && typeof e.invoiceSettings == "object" ? JSON.stringify(e.invoiceSettings) : e.invoiceSettings ?? null,
  generalSettings: e.generalSettings && typeof e.generalSettings == "object" ? JSON.stringify(e.generalSettings) : e.generalSettings ?? null,
  createdAt: e.createdAt ?? null,
  updatedAt: e.updatedAt ?? null,
  lastSyncedAt: e.lastSyncedAt ?? null,
  businessId: e.businessId ?? null,
  bankDetails: e.bankDetails && typeof e.bankDetails == "object" ? JSON.stringify(e.bankDetails) : e.bankDetails ?? null
}), yf = {
  name: "business_outlet",
  create: Tf,
  indexes: [
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_outlet_id ON business_outlet(id);",
    "CREATE INDEX IF NOT EXISTS idx_outlet_businessId ON business_outlet(businessId);",
    "CREATE INDEX IF NOT EXISTS idx_outlet_isActive ON business_outlet(isActive);",
    "CREATE INDEX IF NOT EXISTS idx_outlet_isOnboarded ON business_outlet(isOnboarded);",
    "CREATE INDEX IF NOT EXISTS idx_outlet_lastSyncedAt ON business_outlet(lastSyncedAt);"
  ]
}, vf = `
  CREATE TABLE IF NOT EXISTS business (
    localId INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT,
    name TEXT,
    slug TEXT,
    status TEXT DEFAULT 'active' NOT NULL,
    logoUrl TEXT,
    country TEXT,
    businessType TEXT,
    address TEXT,
    currency TEXT,
    revenueRange TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    lastSyncedAt TEXT,
    ownerId TEXT
  );
`, Sf = `
  INSERT OR REPLACE INTO business (
    id,
    name,
    slug,
    status,
    logoUrl,
    country,
    businessType,
    address,
    currency,
    revenueRange,
    createdAt,
    updatedAt,
    lastSyncedAt,
    ownerId
  ) VALUES (
    @id,
    @name,
    @slug,
    @status,
    @logoUrl,
    @country,
    @businessType,
    @address,
    @currency,
    @revenueRange,
    @createdAt,
    @updatedAt,
    @lastSyncedAt,
    @ownerId
  )
`, Af = (e) => ({
  id: e.id,
  name: e.name ?? null,
  slug: e.slug ?? null,
  status: e.status ?? "active",
  logoUrl: e.logoUrl ?? null,
  country: e.country ?? null,
  businessType: e.businessType ?? null,
  address: e.address ?? null,
  currency: e.currency ?? null,
  revenueRange: e.revenueRange ?? null,
  createdAt: e.createdAt ?? null,
  updatedAt: e.updatedAt ?? null,
  lastSyncedAt: e.lastSyncedAt ?? null,
  ownerId: e.ownerId ?? null
}), wf = {
  name: "business",
  create: vf,
  indexes: [
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_business_id ON business(id);",
    "CREATE INDEX IF NOT EXISTS idx_business_status ON business(status);",
    "CREATE INDEX IF NOT EXISTS idx_business_slug ON business(slug);",
    "CREATE INDEX IF NOT EXISTS idx_business_lastSyncedAt ON business(lastSyncedAt);"
  ]
}, _f = {
  name: "business_role",
  create: `
    CREATE TABLE IF NOT EXISTS business_role (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      permissions TEXT NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      businessId TEXT NOT NULL
    );
  `,
  indexes: [
    // Speeds up queries like: get roles for a business
    `CREATE INDEX IF NOT EXISTS idx_business_role_businessId 
     ON business_role(businessId);`,
    // Optional but useful if you search roles by name inside a business
    `CREATE INDEX IF NOT EXISTS idx_business_role_name 
     ON business_role(name);`
  ]
}, bf = {
  name: "business_user",
  create: `
    CREATE TABLE IF NOT EXISTS business_user (
      id TEXT PRIMARY KEY,
      accessType TEXT DEFAULT 'super_admin' NOT NULL,
      permissions TEXT,
      status TEXT DEFAULT 'active' NOT NULL,
      invitedBy TEXT,
      invitationToken TEXT,
      invitationExpiry TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      lastSyncedAt TEXT,
      userId TEXT,
      outletId TEXT NOT NULL,
      businessId TEXT NOT NULL
    );
  `
}, Rf = {
  name: "business_user_roles_business_role",
  create: `
    CREATE TABLE IF NOT EXISTS business_user_roles_business_role (
      businessUserId TEXT NOT NULL,
      businessRoleId TEXT NOT NULL,
      PRIMARY KEY (businessUserId, businessRoleId)
    );
  `
}, If = {
  name: "customers",
  create: `
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      email TEXT,
      name TEXT,
      phoneNumber TEXT,
      customerCode TEXT,
      status TEXT DEFAULT 'active' NOT NULL,
      verificationCode TEXT,
      verificationCodeExpiry TEXT,
      emailVerified INTEGER DEFAULT 0 NOT NULL,
      phoneVerfied INTEGER DEFAULT 0 NOT NULL,
      reference TEXT,
      createdAt TEXT,
      outletId TEXT,
      otherEmails TEXT,
      otherNames TEXT,
      otherPhoneNumbers TEXT,
      customerType TEXT DEFAULT 'individual' NOT NULL,
      pricingTier TEXT,
      paymentTermId TEXT,
      organizationName TEXT,
      addedBy TEXT,
      updatedBy TEXT,
      updatedAt TEXT,
      deletedAt TEXT
    );
  `
}, Nf = {
  name: "customer_address",
  create: `
    CREATE TABLE IF NOT EXISTS customer_address (
      id TEXT PRIMARY KEY,
      address TEXT,
      isDefault INTEGER DEFAULT 0 NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      customerId TEXT
    );
  `
}, Of = {
  name: "cart",
  create: `
    CREATE TABLE IF NOT EXISTS cart (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL,
      status TEXT DEFAULT 'active' NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      outletId TEXT,
      itemCount INTEGER DEFAULT 0 NOT NULL,
      totalQuantity INTEGER DEFAULT 0 NOT NULL,
      totalAmount REAL DEFAULT 0 NOT NULL,
      customerId TEXT
    );
  `
}, Cf = {
  name: "cart_item",
  create: `
    CREATE TABLE IF NOT EXISTS cart_item (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unitPrice REAL DEFAULT 0 NOT NULL,
      cartId TEXT,
      priceTierDiscount REAL DEFAULT 0 NOT NULL,
      priceTierMarkup REAL DEFAULT 0 NOT NULL
    );
  `
}, Lf = {
  name: "cart_item_modifier",
  create: `
    CREATE TABLE IF NOT EXISTS cart_item_modifier (
      id TEXT PRIMARY KEY,
      unitAmount REAL NOT NULL,
      modifierOptionId TEXT NOT NULL,
      modifierOptionName TEXT NOT NULL,
      quantity INTEGER DEFAULT 1 NOT NULL,
      cartItemId TEXT,
      modifierId TEXT,
      priceTierDiscount REAL DEFAULT 0 NOT NULL,
      priceTierMarkup REAL DEFAULT 0 NOT NULL
    );
  `
}, Pf = {
  name: "inventory",
  create: `
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      type TEXT DEFAULT 'central' NOT NULL,
      allowProcurement INTEGER DEFAULT 1 NOT NULL,
      location TEXT,
      reference TEXT,
      externalReference TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      businessId TEXT,
      outletId TEXT
    );
  `
}, Df = {
  name: "inventory_item",
  create: `
    CREATE TABLE IF NOT EXISTS inventory_item (
      id TEXT PRIMARY KEY,
      costMethod TEXT DEFAULT 'weighted_average' NOT NULL,
      costPrice REAL DEFAULT 0 NOT NULL,
      currentStockLevel REAL DEFAULT 0 NOT NULL,
      minimumStockLevel REAL DEFAULT 0 NOT NULL,
      reOrderLevel REAL DEFAULT 0 NOT NULL,
      isDeleted INTEGER DEFAULT 0 NOT NULL,
      addedBy TEXT,
      modifiedBy TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      itemMasterId TEXT NOT NULL,
      inventoryId TEXT
    );
  `
}, Uf = {
  name: "item_master",
  create: `
    CREATE TABLE IF NOT EXISTS item_master (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      itemCode TEXT NOT NULL,
      businessId TEXT NOT NULL,
      category TEXT NOT NULL,
      itemType TEXT NOT NULL,
      unitOfPurchase TEXT NOT NULL,
      unitOfTransfer TEXT NOT NULL,
      unitOfConsumption TEXT NOT NULL,
      displayedUnitOfMeasure TEXT NOT NULL,
      transferPerPurchase REAL DEFAULT 0 NOT NULL,
      consumptionPerTransfer REAL DEFAULT 0 NOT NULL,
      isTraceable INTEGER DEFAULT 0 NOT NULL,
      isTrackable INTEGER DEFAULT 0 NOT NULL,
      createdAt TEXT,
      updatedAt TEXT
    );
  `
}, Ff = {
  name: "item_lot",
  create: `
    CREATE TABLE IF NOT EXISTS item_lot (
      id TEXT PRIMARY KEY,
      lotNumber TEXT NOT NULL,
      quantityPurchased REAL NOT NULL,
      supplierName TEXT,
      supplierSesrialNumber TEXT,
      supplierAddress TEXT,
      currentStockLevel REAL NOT NULL,
      initialStockLevel REAL NOT NULL,
      expiryDate TEXT,
      costPrice REAL NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      itemId TEXT
    );
  `
}, xf = {
  name: "recipes",
  create: `
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      productReference TEXT NOT NULL,
      productName TEXT NOT NULL,
      outletId TEXT NOT NULL,
      mix TEXT DEFAULT 'standard' NOT NULL,
      totalPortions REAL NOT NULL,
      totalMixCost REAL DEFAULT 0 NOT NULL,
      preparationTime REAL DEFAULT 0 NOT NULL,
      difficulty_level TEXT DEFAULT 'Medium' NOT NULL,
      instructions TEXT NOT NULL,
      imageUrl TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      createdBy TEXT NOT NULL,
      isDeleted INTEGER DEFAULT 0 NOT NULL,
      inventoryId TEXT
    );
  `
}, kf = {
  name: "recipe_ingredients",
  create: `
    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id TEXT PRIMARY KEY,
      itemName TEXT NOT NULL,
      unitOfMeasure TEXT NOT NULL,
      quantity REAL NOT NULL,
      proposedFoodCost REAL DEFAULT 0 NOT NULL,
      prepWaste REAL DEFAULT 0 NOT NULL,
      critical INTEGER DEFAULT 0 NOT NULL,
      isDeleted INTEGER DEFAULT 0 NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      recipeId TEXT,
      itemId TEXT
    );
  `
}, qf = {
  name: "system_default",
  create: `
    CREATE TABLE IF NOT EXISTS system_default (
      id TEXT PRIMARY KEY,
      key TEXT DEFAULT 'category' NOT NULL,
      data TEXT DEFAULT '[]' NOT NULL,
      outletId TEXT
    );
  `
}, $f = {
  name: "sync_session",
  create: `
    CREATE TABLE IF NOT EXISTS sync_session (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      deviceId TEXT,
      deviceName TEXT,
      status TEXT DEFAULT 'initial' NOT NULL,
      direction TEXT DEFAULT 'pull' NOT NULL,
      scope TEXT,
      recordsPulled INTEGER DEFAULT 0 NOT NULL,
      recordsPushed INTEGER DEFAULT 0 NOT NULL,
      tableStats TEXT,
      startedAt TEXT,
      completedAt TEXT,
      nextSyncFrom TEXT,
      conflicts TEXT,
      errorMessage TEXT,
      errorDetails TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );
  `
}, Mf = {
  name: "sync_table_log",
  create: `
    CREATE TABLE IF NOT EXISTS sync_table_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT NOT NULL,
      userId TEXT NOT NULL,
      businessId TEXT,
      outletId TEXT,
      tableName TEXT NOT NULL,
      operation TEXT DEFAULT 'pull' NOT NULL,
      recordsProcessed INTEGER DEFAULT 0 NOT NULL,
      syncVersion INTEGER DEFAULT 1 NOT NULL,
      syncedAt TEXT NOT NULL,
      lastRecordTimestamp TEXT,
      cursorState TEXT,
      filterState TEXT,
      conflictsDetected INTEGER DEFAULT 0 NOT NULL,
      conflictsResolved INTEGER DEFAULT 0 NOT NULL,
      createdAt TEXT
    );
  `
}, Bf = {
  name: "notifications",
  create: `
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      isRead INTEGER DEFAULT 0 NOT NULL,
      createdAt TEXT,
      userId TEXT
    );
  `
}, Hf = [
  hf,
  Ef,
  yf,
  wf,
  _f,
  bf,
  Rf,
  If,
  Nf,
  Of,
  Cf,
  Lf,
  Pf,
  Df,
  Uf,
  Ff,
  xf,
  kf,
  qf,
  $f,
  Mf,
  Bf
];
function Io(e, n, r, i) {
  const o = e.prepare(`
      INSERT OR REPLACE INTO product (
        id,
        name,
        isActive,
        description,
        category,
        price,
        preparationArea,
        weight,
        productCode,
        weightScale,
        productAvailableStock,
        packagingMethod,
        priceTierId,
        allergenList,
        logoUrl,
        logoHash,
        leadTime,
        availableAtStorefront,
        createdAtStorefront,
        isDeleted,
        createdAt,
        updatedAt,
        lastSyncedAt,
        outletId
      ) VALUES (
        @id,
        @name,
        @isActive,
        @description,
        @category,
        @price,
        @preparationArea,
        @weight,
        @productCode,
        @weightScale,
        @productAvailableStock,
        @packagingMethod,
        @priceTierId,
        @allergenList,
        @logoUrl,
        @logoHash,
        @leadTime,
        @availableAtStorefront,
        @createdAtStorefront,
        @isDeleted,
        @createdAt,
        @updatedAt,
        @lastSyncedAt,
        @outletId
      )
    `), s = n.allergenList && n.allergenList.length > 0 ? n.allergenList : n.allergens && n.allergens.length > 0 ? n.allergens : [], t = {
    id: r,
    name: n.name,
    isActive: n.isActive ?? 1,
    description: n.description ?? null,
    category: n.category ?? null,
    price: n.price ?? null,
    preparationArea: n.preparationArea ?? null,
    weight: n.weight ?? null,
    productCode: n.productCode ?? null,
    weightScale: n.weightScale ?? null,
    productAvailableStock: n.productAvailableStock ?? null,
    packagingMethod: n.packagingMethod ? JSON.stringify(n.packagingMethod) : null,
    priceTierId: n.priceTierId ? JSON.stringify(n.priceTierId) : null,
    allergenList: s.length > 0 ? JSON.stringify(s) : null,
    logoUrl: n.logoUrl ?? null,
    logoHash: n.logoHash ?? null,
    leadTime: n.leadTime ?? null,
    availableAtStorefront: n.availableAtStorefront ?? 1,
    createdAtStorefront: n.createdAtStorefront ?? 1,
    isDeleted: n.isDeleted ?? 0,
    createdAt: n.createdAt ?? i,
    updatedAt: n.updatedAt ?? i,
    lastSyncedAt: n.lastSyncedAt ?? null,
    outletId: n.outletId ?? null
  };
  return o.run(t), t;
}
function No(e, n, r) {
  return {
    type: "product",
    op: "upsert",
    id: n,
    outletId: e.outletId,
    data: e,
    ts: r
  };
}
var nt = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function jf(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var pn, Oo;
function Sc() {
  if (Oo) return pn;
  Oo = 1;
  var e = Je;
  return pn = function() {
    return e.randomBytes(16);
  }, pn;
}
var gn, Co;
function Ac() {
  if (Co) return gn;
  Co = 1;
  for (var e = [], n = 0; n < 256; ++n)
    e[n] = (n + 256).toString(16).substr(1);
  function r(i, o) {
    var s = o || 0, t = e;
    return [
      t[i[s++]],
      t[i[s++]],
      t[i[s++]],
      t[i[s++]],
      "-",
      t[i[s++]],
      t[i[s++]],
      "-",
      t[i[s++]],
      t[i[s++]],
      "-",
      t[i[s++]],
      t[i[s++]],
      "-",
      t[i[s++]],
      t[i[s++]],
      t[i[s++]],
      t[i[s++]],
      t[i[s++]],
      t[i[s++]]
    ].join("");
  }
  return gn = r, gn;
}
var mn, Lo;
function Xf() {
  if (Lo) return mn;
  Lo = 1;
  var e = Sc(), n = Ac(), r, i, o = 0, s = 0;
  function t(l, a, u) {
    var c = a && u || 0, d = a || [];
    l = l || {};
    var f = l.node || r, g = l.clockseq !== void 0 ? l.clockseq : i;
    if (f == null || g == null) {
      var m = e();
      f == null && (f = r = [
        m[0] | 1,
        m[1],
        m[2],
        m[3],
        m[4],
        m[5]
      ]), g == null && (g = i = (m[6] << 8 | m[7]) & 16383);
    }
    var T = l.msecs !== void 0 ? l.msecs : (/* @__PURE__ */ new Date()).getTime(), p = l.nsecs !== void 0 ? l.nsecs : s + 1, v = T - o + (p - s) / 1e4;
    if (v < 0 && l.clockseq === void 0 && (g = g + 1 & 16383), (v < 0 || T > o) && l.nsecs === void 0 && (p = 0), p >= 1e4)
      throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
    o = T, s = p, i = g, T += 122192928e5;
    var b = ((T & 268435455) * 1e4 + p) % 4294967296;
    d[c++] = b >>> 24 & 255, d[c++] = b >>> 16 & 255, d[c++] = b >>> 8 & 255, d[c++] = b & 255;
    var N = T / 4294967296 * 1e4 & 268435455;
    d[c++] = N >>> 8 & 255, d[c++] = N & 255, d[c++] = N >>> 24 & 15 | 16, d[c++] = N >>> 16 & 255, d[c++] = g >>> 8 | 128, d[c++] = g & 255;
    for (var O = 0; O < 6; ++O)
      d[c + O] = f[O];
    return a || n(d);
  }
  return mn = t, mn;
}
var En, Po;
function Gf() {
  if (Po) return En;
  Po = 1;
  var e = Sc(), n = Ac();
  function r(i, o, s) {
    var t = o && s || 0;
    typeof i == "string" && (o = i === "binary" ? new Array(16) : null, i = null), i = i || {};
    var l = i.random || (i.rng || e)();
    if (l[6] = l[6] & 15 | 64, l[8] = l[8] & 63 | 128, o)
      for (var a = 0; a < 16; ++a)
        o[t + a] = l[a];
    return o || n(l);
  }
  return En = r, En;
}
var Tn, Do;
function Wf() {
  if (Do) return Tn;
  Do = 1;
  var e = Xf(), n = Gf(), r = n;
  return r.v1 = e, r.v4 = n, Tn = r, Tn;
}
var Wt = Wf();
class Vf {
  constructor() {
    const n = We.getPath("userData"), r = Se.join(n, "bountip.db"), i = Se.dirname(r);
    Ce.existsSync(i) || Ce.mkdirSync(i, { recursive: !0 }), this.db = new nf(r), this.initSchema();
  }
  clearAllData() {
    try {
      this.db && this.db.close();
      const n = We.getPath("userData"), r = Se.join(n, "bountip.db");
      Ce.existsSync(r) && Ce.unlinkSync(r);
    } catch (n) {
      throw console.error("Failed to clear database:", n), n;
    }
  }
  initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS identity (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `), this.db.exec(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `), this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        op TEXT,
        status TEXT DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_error TEXT
      );
    `), this.db.exec(`
      CREATE TABLE IF NOT EXISTS image_upload_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        localPath TEXT,
        tableName TEXT,
        recordId TEXT,
        columnName TEXT,
        status TEXT DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_error TEXT
      );
    `);
    for (const n of Hf)
      if (this.db.exec(n.create), n.indexes?.length)
        for (const r of n.indexes)
          this.db.exec(r);
    this.runMigrations();
  }
  runMigrations() {
    try {
      this.db.exec(
        "ALTER TABLE business_outlet ADD COLUMN isOfflineImage INTEGER DEFAULT 0"
      );
    } catch (n) {
      n.message.includes("duplicate column name") || console.error("Migration error (isOfflineImage):", n);
    }
    try {
      this.db.exec("ALTER TABLE business_outlet ADD COLUMN localLogoPath TEXT");
    } catch (n) {
      n.message.includes("duplicate column name") || console.error("Migration error (localLogoPath):", n);
    }
  }
  query(n, r = []) {
    try {
      const i = this.db.prepare(n);
      return i.reader ? i.all(r) : i.run(r);
    } catch (i) {
      throw console.error("DB Query Error:", i), i;
    }
  }
  // Identity Methods
  getIdentity() {
    const n = this.db.prepare("SELECT value FROM identity WHERE key = ?").get("user_identity");
    return n ? JSON.parse(n.value) : null;
  }
  saveIdentity(n) {
    const i = { ...this.getIdentity() || {}, ...n };
    this.db.prepare("INSERT OR REPLACE INTO identity (key, value) VALUES (?, ?)").run("user_identity", JSON.stringify(i));
  }
  getUserProfile() {
    const n = this.getIdentity(), r = this.db.prepare("SELECT * FROM user LIMIT 1").get(), i = n && typeof n == "object" ? {
      id: n.id ?? n.userId ?? n.user?.id ?? r?.id ?? null,
      email: n.email ?? n.user?.email ?? r?.email ?? null,
      fullName: n.fullName ?? n.user?.fullName ?? r?.fullName ?? null,
      status: n.status ?? n.user?.status ?? r?.status ?? null,
      isEmailVerified: n.isEmailVerified ?? n.user?.isEmailVerified ?? (r && typeof r.isEmailVerified == "number" ? r.isEmailVerified === 1 : void 0),
      createdAt: n.createdAt ?? n.user?.createdAt ?? r?.createdAt ?? null,
      updatedAt: n.updatedAt ?? n.user?.updatedAt ?? r?.updatedAt ?? null
    } : {
      id: r?.id ?? null,
      email: r?.email ?? null,
      fullName: r?.fullName ?? null,
      status: r?.status ?? null,
      isEmailVerified: r && typeof r.isEmailVerified == "number" ? r.isEmailVerified === 1 : void 0,
      createdAt: r?.createdAt ?? null,
      updatedAt: r?.updatedAt ?? null
    }, o = n && typeof n == "object" ? n.deviceId ?? n.user?.deviceId ?? null : null;
    return {
      id: i.id ?? null,
      email: i.email ?? null,
      name: i.fullName ?? null,
      status: i.status ?? null,
      isEmailVerified: i.isEmailVerified,
      createdAt: i.createdAt ?? null,
      updatedAt: i.updatedAt ?? null,
      deviceId: o
    };
  }
  getSyncUserId() {
    const n = this.getIdentity();
    if (n && typeof n == "object") {
      const i = n.id ?? n.userId ?? n.user?.id ?? null;
      if (i) return String(i);
    }
    const r = this.db.prepare("SELECT id FROM user LIMIT 1").get();
    return r && r.id ? String(r.id) : null;
  }
  saveLoginHash(n) {
    this.db.prepare("INSERT OR REPLACE INTO identity (key, value) VALUES (?, ?)").run("login_hash", JSON.stringify({ hash: n }));
  }
  getLoginHash() {
    const n = this.db.prepare("SELECT value FROM identity WHERE key = ?").get("login_hash");
    if (!n) return null;
    try {
      return JSON.parse(n.value).hash ?? null;
    } catch {
      return null;
    }
  }
  savePinHash(n) {
    this.db.prepare("INSERT OR REPLACE INTO identity (key, value) VALUES (?, ?)").run("pin_hash", JSON.stringify({ hash: n }));
  }
  getPinHash() {
    const n = this.db.prepare("SELECT value FROM identity WHERE key = ?").get("pin_hash");
    if (!n) return null;
    try {
      return JSON.parse(n.value).hash ?? null;
    } catch {
      return null;
    }
  }
  // Cache Methods
  getCache(n) {
    const r = this.db.prepare("SELECT value FROM cache WHERE key = ?").get(n);
    return r ? JSON.parse(r.value) : null;
  }
  putCache(n, r) {
    this.db.prepare("INSERT OR REPLACE INTO cache (key, value) VALUES (?, ?)").run(n, JSON.stringify(r));
  }
  // Image Queue Methods
  addToImageQueue(n) {
    this.db.prepare(
      "INSERT INTO image_upload_queue (localPath, tableName, recordId, columnName, status) VALUES (@localPath, @tableName, @recordId, @columnName, 'pending')"
    ).run(n);
  }
  getPendingImageUploads() {
    return this.db.prepare("SELECT * FROM image_upload_queue WHERE status = 'pending'").all();
  }
  markImageAsUploaded(n) {
    this.db.prepare("DELETE FROM image_upload_queue WHERE id = ?").run(n);
  }
  failImageUpload(n, r) {
    this.db.prepare(
      "UPDATE image_upload_queue SET status = 'failed', last_error = ? WHERE id = ?"
    ).run(r, n);
  }
  updateRecordColumn(n, r, i, o) {
    if (/[^a-zA-Z0-9_]/.test(n) || /[^a-zA-Z0-9_]/.test(i)) {
      console.error(
        `[DatabaseService] Invalid table/column name: ${n}.${i}`
      );
      return;
    }
    const s = (/* @__PURE__ */ new Date()).toISOString(), t = `UPDATE ${n} SET ${i} = ?, updatedAt = ? WHERE id = ?`;
    this.db.prepare(t).run(o, s, r);
  }
  // Queue Methods
  addToQueue(n) {
    return this.db.prepare("INSERT INTO sync_queue (op, status) VALUES (?, ?)").run(JSON.stringify(n), "pending"), !0;
  }
  getQueue() {
    return this.db.prepare(
      "SELECT op FROM sync_queue WHERE status = 'pending' ORDER BY id ASC"
    ).all().map((r) => JSON.parse(r.op));
  }
  // Get Raw Queue Items with ID
  getPendingQueueItems() {
    return this.db.prepare(
      "SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY id ASC"
    ).all();
  }
  markAsSynced(n) {
    if (n.length === 0) return;
    const r = n.map(() => "?").join(",");
    this.db.prepare(`DELETE FROM sync_queue WHERE id IN (${r})`).run(...n);
  }
  markAsFailed(n, r) {
    this.db.prepare(
      "UPDATE sync_queue SET status = 'failed', last_error = ? WHERE id = ?"
    ).run(r, n);
  }
  clearQueue() {
    this.db.prepare("DELETE FROM sync_queue").run();
  }
  setQueue(n) {
    const r = this.db.prepare(
      "INSERT INTO sync_queue (op, status) VALUES (?, ?)"
    ), i = this.db.prepare("DELETE FROM sync_queue");
    return this.db.transaction((s) => {
      i.run();
      for (const t of s) r.run(JSON.stringify(t), "pending");
    })(n), !0;
  }
  saveOutletOnboarding(n) {
    const r = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare(
      `
        UPDATE business_outlet
        SET
          country = COALESCE(@country, country),
          address = COALESCE(@address, address),
          businessType = COALESCE(@businessType, businessType),
          currency = COALESCE(@currency, currency),
          revenueRange = COALESCE(@revenueRange, revenueRange),
          logoUrl = COALESCE(@logoUrl, logoUrl),
          isOfflineImage = COALESCE(@isOfflineImage, isOfflineImage),
          localLogoPath = COALESCE(@localLogoPath, localLogoPath),
          isOnboarded = 1,
          updatedAt = COALESCE(@updatedAt, updatedAt)
        WHERE id = @outletId
      `
    ).run({
      outletId: n.outletId,
      country: n.data.country,
      address: n.data.address,
      businessType: n.data.businessType,
      currency: n.data.currency,
      revenueRange: n.data.revenueRange,
      logoUrl: n.data.logoUrl,
      isOfflineImage: n.data.isOfflineImage,
      localLogoPath: n.data.localLogoPath,
      updatedAt: r
    });
  }
  run(n, r = []) {
    return this.db.prepare(n).run(r);
  }
  getOfflineImages() {
    return this.db.prepare("SELECT * FROM business_outlet WHERE isOfflineImage = 1").all();
  }
  updateOfflineImage(n, r) {
    const i = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare(
      "UPDATE business_outlet SET logoUrl = ?, isOfflineImage = 0, localLogoPath = NULL, updatedAt = ? WHERE id = ?"
    ).run(r, i, n);
  }
  getOutlet(n) {
    return this.db.prepare("SELECT * FROM business_outlet WHERE id = ?").get(n);
  }
  getOutlets() {
    return this.db.prepare("SELECT * FROM business_outlet").all();
  }
  applyPullData(n) {
    const { data: r } = n, i = (t) => {
      if (t == null) return null;
      const l = typeof t;
      return l === "number" || l === "string" || l === "bigint" || typeof Buffer < "u" && Buffer.isBuffer?.(t) ? t : t instanceof Date ? t.toISOString() : l === "boolean" ? t ? 1 : 0 : JSON.stringify(t);
    }, o = (t) => {
      const l = {};
      for (const [a, u] of Object.entries(t))
        l[a] = i(u);
      return l;
    };
    this.db.transaction(() => {
      if (r.user) {
        const t = r.user;
        this.db.prepare(df).run(o(ff(t)));
      }
      if (Array.isArray(r.businesses) && r.businesses.length > 0) {
        const t = this.db.prepare(Sf);
        for (const l of r.businesses)
          t.run(o(Af(l)));
      }
      if (Array.isArray(r.outlets) && r.outlets.length > 0) {
        const t = this.db.prepare(yc);
        for (const l of r.outlets)
          t.run(o(vc(l)));
      }
      if (Array.isArray(r.products) && r.products.length > 0) {
        const t = this.db.prepare(gf);
        for (const l of r.products)
          t.run(o(mf(l)));
      }
    })();
  }
  createProduct(n) {
    const r = n.id || Wt.v4(), i = (/* @__PURE__ */ new Date()).toISOString(), o = Io(this.db, n, r, i), s = No(o, r, i);
    return this.addToQueue(s), { id: r };
  }
  bulkCreateProducts(n) {
    const { outletId: r, data: i } = n, o = (/* @__PURE__ */ new Date()).toISOString(), s = [];
    return this.db.transaction(() => {
      for (const l of i) {
        const a = l.id || Wt.v4(), u = { ...l, outletId: r }, c = Io(this.db, u, a, o), d = No(c, a, o);
        this.addToQueue(d), s.push(a);
      }
    })(), { ids: s, status: "success", count: s.length };
  }
}
const yn = "bountip-desktop", vn = "auth-tokens";
class Yf {
  constructor(n) {
    this.db = n;
  }
  async storeTokens(n) {
    try {
      const r = JSON.stringify(n);
      await hn.setPassword(yn, vn, r);
    } catch (r) {
      console.error("Failed to store tokens in keytar", r);
    }
  }
  async clearTokens() {
    try {
      await hn.deletePassword(yn, vn);
    } catch (n) {
      console.error("Failed to clear tokens in keytar", n);
    }
  }
  async getTokens() {
    try {
      const n = await hn.getPassword(yn, vn);
      return n ? JSON.parse(n) : null;
    } catch (n) {
      return console.error("Failed to read tokens from keytar", n), null;
    }
  }
  getUser() {
    return this.db.getUserProfile();
  }
  saveUser(n) {
    this.db.saveIdentity(n);
  }
  saveLoginHash(n, r) {
    const o = `${(n || "").trim().toLowerCase()}::${r}`, s = Je.createHash("sha256").update(o).digest("hex");
    this.db.saveLoginHash(s);
  }
  verifyLoginHash(n, r) {
    const i = this.db.getLoginHash();
    if (!i) return !1;
    const s = `${(n || "").trim().toLowerCase()}::${r}`, t = Je.createHash("sha256").update(s).digest("hex");
    return i === t;
  }
  savePinHash(n) {
    const r = Je.createHash("sha256").update(n).digest("hex");
    this.db.savePinHash(r);
  }
  verifyPinHash(n) {
    const r = this.db.getPinHash();
    if (!r) return !1;
    const i = Je.createHash("sha256").update(n).digest("hex");
    return r === i;
  }
}
const zf = "https://seal-app-wzqhf.ondigitalocean.app/api/v1";
class Jf {
  constructor() {
    this.online = !1, this.checkInterval = null, this.isChecking = !1, this.listeners = [], this.startConnectivityCheck();
  }
  onStatusChange(n) {
    return this.listeners.push(n), () => {
      this.listeners = this.listeners.filter((r) => r !== n);
    };
  }
  getStatus() {
    return { online: this.online };
  }
  // Called by Frontend (navigator.onLine updates)
  setOnline(n) {
    n ? this.checkConnectivity() : this.updateStatus(!1);
  }
  updateStatus(n) {
    if (this.online !== n) {
      this.online = n, console.log(
        `[NetworkService] Status changed to: ${n ? "ONLINE" : "OFFLINE"}`
      );
      const r = ht.getAllWindows()[0];
      r && !r.isDestroyed() && r.webContents.send("network:status", { online: this.online }), this.listeners.forEach((i) => i(this.online));
    }
  }
  startConnectivityCheck() {
    this.checkConnectivity(), this.checkInterval = setInterval(() => {
      this.checkConnectivity();
    }, 1e4);
  }
  checkConnectivity() {
    if (this.isChecking) return;
    this.isChecking = !0;
    const n = vt.request({
      method: "HEAD",
      url: "https://www.google.com",
      redirect: "follow"
    });
    let r = !1;
    const i = setTimeout(() => {
      r = !0, n.abort(), this.isChecking = !1, this.online ? this.checkConnectivityBackup() : this.updateStatus(!1);
    }, 5e3);
    n.on("response", (o) => {
      clearTimeout(i), this.isChecking = !1, this.updateStatus(!0);
    }), n.on("error", () => {
      r || (clearTimeout(i), this.isChecking = !1, this.checkConnectivityBackup());
    }), n.end();
  }
  checkConnectivityBackup() {
    const n = vt.request({
      method: "HEAD",
      url: zf,
      redirect: "follow"
    });
    let r = !1;
    const i = setTimeout(() => {
      r = !0, n.abort(), this.updateStatus(!1);
    }, 5e3);
    n.on("response", () => {
      clearTimeout(i), this.updateStatus(!0);
    }), n.on("error", () => {
      r || (clearTimeout(i), this.updateStatus(!1));
    }), n.end();
  }
}
const er = "bountip", Uo = "239.192.0.1", Fo = 45454;
class Kf {
  constructor(n) {
    this.tcpPort = 0, this.udpSocket = null, this.tcpServer = null, this.peers = /* @__PURE__ */ new Map(), this.listeners = [], this.deviceId = n;
  }
  onMessage(n) {
    return this.listeners.push(n), () => {
      this.listeners = this.listeners.filter((r) => r !== n);
    };
  }
  start() {
    this.startTcpServer((n) => {
      this.listeners.forEach((i) => i(n));
      const r = ht.getAllWindows()[0];
      r && r.webContents.send("p2p:message", n);
    }), this.startUdpDiscovery();
  }
  startTcpServer(n) {
    this.tcpServer = Ro.createServer((r) => {
      r.on("data", (i) => {
        try {
          const o = i.toString(), s = JSON.parse(o);
          s.app === er && s.payload && n(s.payload);
        } catch {
        }
      });
    }), this.tcpServer.listen(0, () => {
      this.tcpPort = this.tcpServer.address().port;
    });
  }
  startUdpDiscovery() {
    this.udpSocket = of.createSocket({ type: "udp4", reuseAddr: !0 }), this.udpSocket.on("error", (n) => {
      if (n.code === "EADDRNOTAVAIL") {
        console.warn(
          "[P2PService] Multicast address not available. P2P discovery disabled."
        ), this.udpSocket?.close(), this.udpSocket = null;
        return;
      }
      console.error("[P2PService] UDP socket error:", n);
    }), this.udpSocket.on("message", (n, r) => {
      try {
        const i = JSON.parse(n.toString());
        i.app === er && i.deviceId !== this.deviceId && (this.peers.has(i.deviceId) || this.peers.set(i.deviceId, {
          ip: r.address,
          port: i.tcpPort
        }));
      } catch {
      }
    }), this.udpSocket.bind(Fo, () => {
      try {
        this.udpSocket?.addMembership(Uo), this.udpSocket?.setMulticastLoopback(!0);
      } catch (n) {
        if (n.code === "EADDRNOTAVAIL") {
          console.warn(
            "[P2PService] addMembership failed with EADDRNOTAVAIL. P2P discovery disabled."
          ), this.udpSocket?.close(), this.udpSocket = null;
          return;
        }
        console.error(
          "[P2PService] Unexpected error during multicast setup:",
          n
        );
      }
    }), setInterval(() => {
      const n = JSON.stringify({
        app: er,
        deviceId: this.deviceId,
        tcpPort: this.tcpPort
      });
      this.udpSocket?.send(n, Fo, Uo);
    }, 3e3);
  }
  getPeers() {
    return Array.from(this.peers.values());
  }
  // New method to get active devices sorted (or just list them to decide leader)
  getDevices() {
    return Array.from(this.peers.keys());
  }
  getDeviceId() {
    return this.deviceId;
  }
  async broadcast(n) {
    const r = Array.from(this.peers.values());
    for (const i of r)
      try {
        await this.sendToPeer(i, { app: er, payload: n });
      } catch {
      }
  }
  async sendToPeerById(n, r) {
    const i = this.peers.get(n);
    if (i)
      try {
        await this.sendToPeer(i, { app: er, payload: r });
      } catch (o) {
        console.error("sendToPeer error", o);
      }
  }
  sendToPeer(n, r) {
    return new Promise((i, o) => {
      const s = new Ro.Socket();
      s.connect(n.port, n.ip, () => {
        s.write(JSON.stringify(r)), s.end(), i();
      }), s.on("error", o);
    });
  }
}
var Ot = {}, Sn = {}, kr = {}, xo;
function Ke() {
  return xo || (xo = 1, kr.fromCallback = function(e) {
    return Object.defineProperty(function(...n) {
      if (typeof n[n.length - 1] == "function") e.apply(this, n);
      else
        return new Promise((r, i) => {
          n.push((o, s) => o != null ? i(o) : r(s)), e.apply(this, n);
        });
    }, "name", { value: e.name });
  }, kr.fromPromise = function(e) {
    return Object.defineProperty(function(...n) {
      const r = n[n.length - 1];
      if (typeof r != "function") return e.apply(this, n);
      n.pop(), e.apply(this, n).then((i) => r(null, i), r);
    }, "name", { value: e.name });
  }), kr;
}
var An, ko;
function Qf() {
  if (ko) return An;
  ko = 1;
  var e = af, n = process.cwd, r = null, i = process.env.GRACEFUL_FS_PLATFORM || process.platform;
  process.cwd = function() {
    return r || (r = n.call(process)), r;
  };
  try {
    process.cwd();
  } catch {
  }
  if (typeof process.chdir == "function") {
    var o = process.chdir;
    process.chdir = function(t) {
      r = null, o.call(process, t);
    }, Object.setPrototypeOf && Object.setPrototypeOf(process.chdir, o);
  }
  An = s;
  function s(t) {
    e.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./) && l(t), t.lutimes || a(t), t.chown = d(t.chown), t.fchown = d(t.fchown), t.lchown = d(t.lchown), t.chmod = u(t.chmod), t.fchmod = u(t.fchmod), t.lchmod = u(t.lchmod), t.chownSync = f(t.chownSync), t.fchownSync = f(t.fchownSync), t.lchownSync = f(t.lchownSync), t.chmodSync = c(t.chmodSync), t.fchmodSync = c(t.fchmodSync), t.lchmodSync = c(t.lchmodSync), t.stat = g(t.stat), t.fstat = g(t.fstat), t.lstat = g(t.lstat), t.statSync = m(t.statSync), t.fstatSync = m(t.fstatSync), t.lstatSync = m(t.lstatSync), t.chmod && !t.lchmod && (t.lchmod = function(p, v, b) {
      b && process.nextTick(b);
    }, t.lchmodSync = function() {
    }), t.chown && !t.lchown && (t.lchown = function(p, v, b, N) {
      N && process.nextTick(N);
    }, t.lchownSync = function() {
    }), i === "win32" && (t.rename = typeof t.rename != "function" ? t.rename : (function(p) {
      function v(b, N, O) {
        var k = Date.now(), R = 0;
        p(b, N, function S(w) {
          if (w && (w.code === "EACCES" || w.code === "EPERM" || w.code === "EBUSY") && Date.now() - k < 6e4) {
            setTimeout(function() {
              t.stat(N, function(y, $) {
                y && y.code === "ENOENT" ? p(b, N, S) : O(w);
              });
            }, R), R < 100 && (R += 10);
            return;
          }
          O && O(w);
        });
      }
      return Object.setPrototypeOf && Object.setPrototypeOf(v, p), v;
    })(t.rename)), t.read = typeof t.read != "function" ? t.read : (function(p) {
      function v(b, N, O, k, R, S) {
        var w;
        if (S && typeof S == "function") {
          var y = 0;
          w = function($, x, F) {
            if ($ && $.code === "EAGAIN" && y < 10)
              return y++, p.call(t, b, N, O, k, R, w);
            S.apply(this, arguments);
          };
        }
        return p.call(t, b, N, O, k, R, w);
      }
      return Object.setPrototypeOf && Object.setPrototypeOf(v, p), v;
    })(t.read), t.readSync = typeof t.readSync != "function" ? t.readSync : /* @__PURE__ */ (function(p) {
      return function(v, b, N, O, k) {
        for (var R = 0; ; )
          try {
            return p.call(t, v, b, N, O, k);
          } catch (S) {
            if (S.code === "EAGAIN" && R < 10) {
              R++;
              continue;
            }
            throw S;
          }
      };
    })(t.readSync);
    function l(p) {
      p.lchmod = function(v, b, N) {
        p.open(
          v,
          e.O_WRONLY | e.O_SYMLINK,
          b,
          function(O, k) {
            if (O) {
              N && N(O);
              return;
            }
            p.fchmod(k, b, function(R) {
              p.close(k, function(S) {
                N && N(R || S);
              });
            });
          }
        );
      }, p.lchmodSync = function(v, b) {
        var N = p.openSync(v, e.O_WRONLY | e.O_SYMLINK, b), O = !0, k;
        try {
          k = p.fchmodSync(N, b), O = !1;
        } finally {
          if (O)
            try {
              p.closeSync(N);
            } catch {
            }
          else
            p.closeSync(N);
        }
        return k;
      };
    }
    function a(p) {
      e.hasOwnProperty("O_SYMLINK") && p.futimes ? (p.lutimes = function(v, b, N, O) {
        p.open(v, e.O_SYMLINK, function(k, R) {
          if (k) {
            O && O(k);
            return;
          }
          p.futimes(R, b, N, function(S) {
            p.close(R, function(w) {
              O && O(S || w);
            });
          });
        });
      }, p.lutimesSync = function(v, b, N) {
        var O = p.openSync(v, e.O_SYMLINK), k, R = !0;
        try {
          k = p.futimesSync(O, b, N), R = !1;
        } finally {
          if (R)
            try {
              p.closeSync(O);
            } catch {
            }
          else
            p.closeSync(O);
        }
        return k;
      }) : p.futimes && (p.lutimes = function(v, b, N, O) {
        O && process.nextTick(O);
      }, p.lutimesSync = function() {
      });
    }
    function u(p) {
      return p && function(v, b, N) {
        return p.call(t, v, b, function(O) {
          T(O) && (O = null), N && N.apply(this, arguments);
        });
      };
    }
    function c(p) {
      return p && function(v, b) {
        try {
          return p.call(t, v, b);
        } catch (N) {
          if (!T(N)) throw N;
        }
      };
    }
    function d(p) {
      return p && function(v, b, N, O) {
        return p.call(t, v, b, N, function(k) {
          T(k) && (k = null), O && O.apply(this, arguments);
        });
      };
    }
    function f(p) {
      return p && function(v, b, N) {
        try {
          return p.call(t, v, b, N);
        } catch (O) {
          if (!T(O)) throw O;
        }
      };
    }
    function g(p) {
      return p && function(v, b, N) {
        typeof b == "function" && (N = b, b = null);
        function O(k, R) {
          R && (R.uid < 0 && (R.uid += 4294967296), R.gid < 0 && (R.gid += 4294967296)), N && N.apply(this, arguments);
        }
        return b ? p.call(t, v, b, O) : p.call(t, v, O);
      };
    }
    function m(p) {
      return p && function(v, b) {
        var N = b ? p.call(t, v, b) : p.call(t, v);
        return N && (N.uid < 0 && (N.uid += 4294967296), N.gid < 0 && (N.gid += 4294967296)), N;
      };
    }
    function T(p) {
      if (!p || p.code === "ENOSYS")
        return !0;
      var v = !process.getuid || process.getuid() !== 0;
      return !!(v && (p.code === "EINVAL" || p.code === "EPERM"));
    }
  }
  return An;
}
var wn, qo;
function Zf() {
  if (qo) return wn;
  qo = 1;
  var e = br.Stream;
  wn = n;
  function n(r) {
    return {
      ReadStream: i,
      WriteStream: o
    };
    function i(s, t) {
      if (!(this instanceof i)) return new i(s, t);
      e.call(this);
      var l = this;
      this.path = s, this.fd = null, this.readable = !0, this.paused = !1, this.flags = "r", this.mode = 438, this.bufferSize = 64 * 1024, t = t || {};
      for (var a = Object.keys(t), u = 0, c = a.length; u < c; u++) {
        var d = a[u];
        this[d] = t[d];
      }
      if (this.encoding && this.setEncoding(this.encoding), this.start !== void 0) {
        if (typeof this.start != "number")
          throw TypeError("start must be a Number");
        if (this.end === void 0)
          this.end = 1 / 0;
        else if (typeof this.end != "number")
          throw TypeError("end must be a Number");
        if (this.start > this.end)
          throw new Error("start must be <= end");
        this.pos = this.start;
      }
      if (this.fd !== null) {
        process.nextTick(function() {
          l._read();
        });
        return;
      }
      r.open(this.path, this.flags, this.mode, function(f, g) {
        if (f) {
          l.emit("error", f), l.readable = !1;
          return;
        }
        l.fd = g, l.emit("open", g), l._read();
      });
    }
    function o(s, t) {
      if (!(this instanceof o)) return new o(s, t);
      e.call(this), this.path = s, this.fd = null, this.writable = !0, this.flags = "w", this.encoding = "binary", this.mode = 438, this.bytesWritten = 0, t = t || {};
      for (var l = Object.keys(t), a = 0, u = l.length; a < u; a++) {
        var c = l[a];
        this[c] = t[c];
      }
      if (this.start !== void 0) {
        if (typeof this.start != "number")
          throw TypeError("start must be a Number");
        if (this.start < 0)
          throw new Error("start must be >= zero");
        this.pos = this.start;
      }
      this.busy = !1, this._queue = [], this.fd === null && (this._open = r.open, this._queue.push([this._open, this.path, this.flags, this.mode, void 0]), this.flush());
    }
  }
  return wn;
}
var _n, $o;
function eh() {
  if ($o) return _n;
  $o = 1, _n = n;
  var e = Object.getPrototypeOf || function(r) {
    return r.__proto__;
  };
  function n(r) {
    if (r === null || typeof r != "object")
      return r;
    if (r instanceof Object)
      var i = { __proto__: e(r) };
    else
      var i = /* @__PURE__ */ Object.create(null);
    return Object.getOwnPropertyNames(r).forEach(function(o) {
      Object.defineProperty(i, o, Object.getOwnPropertyDescriptor(r, o));
    }), i;
  }
  return _n;
}
var qr, Mo;
function Ve() {
  if (Mo) return qr;
  Mo = 1;
  var e = Ce, n = Qf(), r = Zf(), i = eh(), o = Zr, s, t;
  typeof Symbol == "function" && typeof Symbol.for == "function" ? (s = /* @__PURE__ */ Symbol.for("graceful-fs.queue"), t = /* @__PURE__ */ Symbol.for("graceful-fs.previous")) : (s = "___graceful-fs.queue", t = "___graceful-fs.previous");
  function l() {
  }
  function a(p, v) {
    Object.defineProperty(p, s, {
      get: function() {
        return v;
      }
    });
  }
  var u = l;
  if (o.debuglog ? u = o.debuglog("gfs4") : /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && (u = function() {
    var p = o.format.apply(o, arguments);
    p = "GFS4: " + p.split(/\n/).join(`
GFS4: `), console.error(p);
  }), !e[s]) {
    var c = nt[s] || [];
    a(e, c), e.close = (function(p) {
      function v(b, N) {
        return p.call(e, b, function(O) {
          O || m(), typeof N == "function" && N.apply(this, arguments);
        });
      }
      return Object.defineProperty(v, t, {
        value: p
      }), v;
    })(e.close), e.closeSync = (function(p) {
      function v(b) {
        p.apply(e, arguments), m();
      }
      return Object.defineProperty(v, t, {
        value: p
      }), v;
    })(e.closeSync), /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && process.on("exit", function() {
      u(e[s]), gc.equal(e[s].length, 0);
    });
  }
  nt[s] || a(nt, e[s]), qr = d(i(e)), process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !e.__patched && (qr = d(e), e.__patched = !0);
  function d(p) {
    n(p), p.gracefulify = d, p.createReadStream = fe, p.createWriteStream = ce;
    var v = p.readFile;
    p.readFile = b;
    function b(K, Ee, A) {
      return typeof Ee == "function" && (A = Ee, Ee = null), E(K, Ee, A);
      function E(H, P, ue, he) {
        return v(H, P, function(pe) {
          pe && (pe.code === "EMFILE" || pe.code === "ENFILE") ? f([E, [H, P, ue], pe, he || Date.now(), Date.now()]) : typeof ue == "function" && ue.apply(this, arguments);
        });
      }
    }
    var N = p.writeFile;
    p.writeFile = O;
    function O(K, Ee, A, E) {
      return typeof A == "function" && (E = A, A = null), H(K, Ee, A, E);
      function H(P, ue, he, pe, we) {
        return N(P, ue, he, function(ye) {
          ye && (ye.code === "EMFILE" || ye.code === "ENFILE") ? f([H, [P, ue, he, pe], ye, we || Date.now(), Date.now()]) : typeof pe == "function" && pe.apply(this, arguments);
        });
      }
    }
    var k = p.appendFile;
    k && (p.appendFile = R);
    function R(K, Ee, A, E) {
      return typeof A == "function" && (E = A, A = null), H(K, Ee, A, E);
      function H(P, ue, he, pe, we) {
        return k(P, ue, he, function(ye) {
          ye && (ye.code === "EMFILE" || ye.code === "ENFILE") ? f([H, [P, ue, he, pe], ye, we || Date.now(), Date.now()]) : typeof pe == "function" && pe.apply(this, arguments);
        });
      }
    }
    var S = p.copyFile;
    S && (p.copyFile = w);
    function w(K, Ee, A, E) {
      return typeof A == "function" && (E = A, A = 0), H(K, Ee, A, E);
      function H(P, ue, he, pe, we) {
        return S(P, ue, he, function(ye) {
          ye && (ye.code === "EMFILE" || ye.code === "ENFILE") ? f([H, [P, ue, he, pe], ye, we || Date.now(), Date.now()]) : typeof pe == "function" && pe.apply(this, arguments);
        });
      }
    }
    var y = p.readdir;
    p.readdir = x;
    var $ = /^v[0-5]\./;
    function x(K, Ee, A) {
      typeof Ee == "function" && (A = Ee, Ee = null);
      var E = $.test(process.version) ? function(ue, he, pe, we) {
        return y(ue, H(
          ue,
          he,
          pe,
          we
        ));
      } : function(ue, he, pe, we) {
        return y(ue, he, H(
          ue,
          he,
          pe,
          we
        ));
      };
      return E(K, Ee, A);
      function H(P, ue, he, pe) {
        return function(we, ye) {
          we && (we.code === "EMFILE" || we.code === "ENFILE") ? f([
            E,
            [P, ue, he],
            we,
            pe || Date.now(),
            Date.now()
          ]) : (ye && ye.sort && ye.sort(), typeof he == "function" && he.call(this, we, ye));
        };
      }
    }
    if (process.version.substr(0, 4) === "v0.8") {
      var F = r(p);
      C = F.ReadStream, V = F.WriteStream;
    }
    var M = p.ReadStream;
    M && (C.prototype = Object.create(M.prototype), C.prototype.open = Q);
    var L = p.WriteStream;
    L && (V.prototype = Object.create(L.prototype), V.prototype.open = ne), Object.defineProperty(p, "ReadStream", {
      get: function() {
        return C;
      },
      set: function(K) {
        C = K;
      },
      enumerable: !0,
      configurable: !0
    }), Object.defineProperty(p, "WriteStream", {
      get: function() {
        return V;
      },
      set: function(K) {
        V = K;
      },
      enumerable: !0,
      configurable: !0
    });
    var D = C;
    Object.defineProperty(p, "FileReadStream", {
      get: function() {
        return D;
      },
      set: function(K) {
        D = K;
      },
      enumerable: !0,
      configurable: !0
    });
    var j = V;
    Object.defineProperty(p, "FileWriteStream", {
      get: function() {
        return j;
      },
      set: function(K) {
        j = K;
      },
      enumerable: !0,
      configurable: !0
    });
    function C(K, Ee) {
      return this instanceof C ? (M.apply(this, arguments), this) : C.apply(Object.create(C.prototype), arguments);
    }
    function Q() {
      var K = this;
      Te(K.path, K.flags, K.mode, function(Ee, A) {
        Ee ? (K.autoClose && K.destroy(), K.emit("error", Ee)) : (K.fd = A, K.emit("open", A), K.read());
      });
    }
    function V(K, Ee) {
      return this instanceof V ? (L.apply(this, arguments), this) : V.apply(Object.create(V.prototype), arguments);
    }
    function ne() {
      var K = this;
      Te(K.path, K.flags, K.mode, function(Ee, A) {
        Ee ? (K.destroy(), K.emit("error", Ee)) : (K.fd = A, K.emit("open", A));
      });
    }
    function fe(K, Ee) {
      return new p.ReadStream(K, Ee);
    }
    function ce(K, Ee) {
      return new p.WriteStream(K, Ee);
    }
    var me = p.open;
    p.open = Te;
    function Te(K, Ee, A, E) {
      return typeof A == "function" && (E = A, A = null), H(K, Ee, A, E);
      function H(P, ue, he, pe, we) {
        return me(P, ue, he, function(ye, Ge) {
          ye && (ye.code === "EMFILE" || ye.code === "ENFILE") ? f([H, [P, ue, he, pe], ye, we || Date.now(), Date.now()]) : typeof pe == "function" && pe.apply(this, arguments);
        });
      }
    }
    return p;
  }
  function f(p) {
    u("ENQUEUE", p[0].name, p[1]), e[s].push(p), T();
  }
  var g;
  function m() {
    for (var p = Date.now(), v = 0; v < e[s].length; ++v)
      e[s][v].length > 2 && (e[s][v][3] = p, e[s][v][4] = p);
    T();
  }
  function T() {
    if (clearTimeout(g), g = void 0, e[s].length !== 0) {
      var p = e[s].shift(), v = p[0], b = p[1], N = p[2], O = p[3], k = p[4];
      if (O === void 0)
        u("RETRY", v.name, b), v.apply(null, b);
      else if (Date.now() - O >= 6e4) {
        u("TIMEOUT", v.name, b);
        var R = b.pop();
        typeof R == "function" && R.call(null, N);
      } else {
        var S = Date.now() - k, w = Math.max(k - O, 1), y = Math.min(w * 1.2, 100);
        S >= y ? (u("RETRY", v.name, b), v.apply(null, b.concat([O]))) : e[s].push(p);
      }
      g === void 0 && (g = setTimeout(T, 0));
    }
  }
  return qr;
}
var Bo;
function Yt() {
  return Bo || (Bo = 1, (function(e) {
    const n = Ke().fromCallback, r = Ve(), i = [
      "access",
      "appendFile",
      "chmod",
      "chown",
      "close",
      "copyFile",
      "fchmod",
      "fchown",
      "fdatasync",
      "fstat",
      "fsync",
      "ftruncate",
      "futimes",
      "lchmod",
      "lchown",
      "link",
      "lstat",
      "mkdir",
      "mkdtemp",
      "open",
      "opendir",
      "readdir",
      "readFile",
      "readlink",
      "realpath",
      "rename",
      "rm",
      "rmdir",
      "stat",
      "symlink",
      "truncate",
      "unlink",
      "utimes",
      "writeFile"
    ].filter((o) => typeof r[o] == "function");
    Object.assign(e, r), i.forEach((o) => {
      e[o] = n(r[o]);
    }), e.exists = function(o, s) {
      return typeof s == "function" ? r.exists(o, s) : new Promise((t) => r.exists(o, t));
    }, e.read = function(o, s, t, l, a, u) {
      return typeof u == "function" ? r.read(o, s, t, l, a, u) : new Promise((c, d) => {
        r.read(o, s, t, l, a, (f, g, m) => {
          if (f) return d(f);
          c({ bytesRead: g, buffer: m });
        });
      });
    }, e.write = function(o, s, ...t) {
      return typeof t[t.length - 1] == "function" ? r.write(o, s, ...t) : new Promise((l, a) => {
        r.write(o, s, ...t, (u, c, d) => {
          if (u) return a(u);
          l({ bytesWritten: c, buffer: d });
        });
      });
    }, typeof r.writev == "function" && (e.writev = function(o, s, ...t) {
      return typeof t[t.length - 1] == "function" ? r.writev(o, s, ...t) : new Promise((l, a) => {
        r.writev(o, s, ...t, (u, c, d) => {
          if (u) return a(u);
          l({ bytesWritten: c, buffers: d });
        });
      });
    }), typeof r.realpath.native == "function" ? e.realpath.native = n(r.realpath.native) : process.emitWarning(
      "fs.realpath.native is not a function. Is fs being monkey-patched?",
      "Warning",
      "fs-extra-WARN0003"
    );
  })(Sn)), Sn;
}
var $r = {}, bn = {}, Ho;
function th() {
  if (Ho) return bn;
  Ho = 1;
  const e = Se;
  return bn.checkPath = function(r) {
    if (process.platform === "win32" && /[<>:"|?*]/.test(r.replace(e.parse(r).root, ""))) {
      const o = new Error(`Path contains invalid characters: ${r}`);
      throw o.code = "EINVAL", o;
    }
  }, bn;
}
var jo;
function rh() {
  if (jo) return $r;
  jo = 1;
  const e = /* @__PURE__ */ Yt(), { checkPath: n } = /* @__PURE__ */ th(), r = (i) => {
    const o = { mode: 511 };
    return typeof i == "number" ? i : { ...o, ...i }.mode;
  };
  return $r.makeDir = async (i, o) => (n(i), e.mkdir(i, {
    mode: r(o),
    recursive: !0
  })), $r.makeDirSync = (i, o) => (n(i), e.mkdirSync(i, {
    mode: r(o),
    recursive: !0
  })), $r;
}
var Rn, Xo;
function lt() {
  if (Xo) return Rn;
  Xo = 1;
  const e = Ke().fromPromise, { makeDir: n, makeDirSync: r } = /* @__PURE__ */ rh(), i = e(n);
  return Rn = {
    mkdirs: i,
    mkdirsSync: r,
    // alias
    mkdirp: i,
    mkdirpSync: r,
    ensureDir: i,
    ensureDirSync: r
  }, Rn;
}
var In, Go;
function Ft() {
  if (Go) return In;
  Go = 1;
  const e = Ke().fromPromise, n = /* @__PURE__ */ Yt();
  function r(i) {
    return n.access(i).then(() => !0).catch(() => !1);
  }
  return In = {
    pathExists: e(r),
    pathExistsSync: n.existsSync
  }, In;
}
var Nn, Wo;
function wc() {
  if (Wo) return Nn;
  Wo = 1;
  const e = Ve();
  function n(i, o, s, t) {
    e.open(i, "r+", (l, a) => {
      if (l) return t(l);
      e.futimes(a, o, s, (u) => {
        e.close(a, (c) => {
          t && t(u || c);
        });
      });
    });
  }
  function r(i, o, s) {
    const t = e.openSync(i, "r+");
    return e.futimesSync(t, o, s), e.closeSync(t);
  }
  return Nn = {
    utimesMillis: n,
    utimesMillisSync: r
  }, Nn;
}
var On, Vo;
function zt() {
  if (Vo) return On;
  Vo = 1;
  const e = /* @__PURE__ */ Yt(), n = Se, r = Zr;
  function i(f, g, m) {
    const T = m.dereference ? (p) => e.stat(p, { bigint: !0 }) : (p) => e.lstat(p, { bigint: !0 });
    return Promise.all([
      T(f),
      T(g).catch((p) => {
        if (p.code === "ENOENT") return null;
        throw p;
      })
    ]).then(([p, v]) => ({ srcStat: p, destStat: v }));
  }
  function o(f, g, m) {
    let T;
    const p = m.dereference ? (b) => e.statSync(b, { bigint: !0 }) : (b) => e.lstatSync(b, { bigint: !0 }), v = p(f);
    try {
      T = p(g);
    } catch (b) {
      if (b.code === "ENOENT") return { srcStat: v, destStat: null };
      throw b;
    }
    return { srcStat: v, destStat: T };
  }
  function s(f, g, m, T, p) {
    r.callbackify(i)(f, g, T, (v, b) => {
      if (v) return p(v);
      const { srcStat: N, destStat: O } = b;
      if (O) {
        if (u(N, O)) {
          const k = n.basename(f), R = n.basename(g);
          return m === "move" && k !== R && k.toLowerCase() === R.toLowerCase() ? p(null, { srcStat: N, destStat: O, isChangingCase: !0 }) : p(new Error("Source and destination must not be the same."));
        }
        if (N.isDirectory() && !O.isDirectory())
          return p(new Error(`Cannot overwrite non-directory '${g}' with directory '${f}'.`));
        if (!N.isDirectory() && O.isDirectory())
          return p(new Error(`Cannot overwrite directory '${g}' with non-directory '${f}'.`));
      }
      return N.isDirectory() && c(f, g) ? p(new Error(d(f, g, m))) : p(null, { srcStat: N, destStat: O });
    });
  }
  function t(f, g, m, T) {
    const { srcStat: p, destStat: v } = o(f, g, T);
    if (v) {
      if (u(p, v)) {
        const b = n.basename(f), N = n.basename(g);
        if (m === "move" && b !== N && b.toLowerCase() === N.toLowerCase())
          return { srcStat: p, destStat: v, isChangingCase: !0 };
        throw new Error("Source and destination must not be the same.");
      }
      if (p.isDirectory() && !v.isDirectory())
        throw new Error(`Cannot overwrite non-directory '${g}' with directory '${f}'.`);
      if (!p.isDirectory() && v.isDirectory())
        throw new Error(`Cannot overwrite directory '${g}' with non-directory '${f}'.`);
    }
    if (p.isDirectory() && c(f, g))
      throw new Error(d(f, g, m));
    return { srcStat: p, destStat: v };
  }
  function l(f, g, m, T, p) {
    const v = n.resolve(n.dirname(f)), b = n.resolve(n.dirname(m));
    if (b === v || b === n.parse(b).root) return p();
    e.stat(b, { bigint: !0 }, (N, O) => N ? N.code === "ENOENT" ? p() : p(N) : u(g, O) ? p(new Error(d(f, m, T))) : l(f, g, b, T, p));
  }
  function a(f, g, m, T) {
    const p = n.resolve(n.dirname(f)), v = n.resolve(n.dirname(m));
    if (v === p || v === n.parse(v).root) return;
    let b;
    try {
      b = e.statSync(v, { bigint: !0 });
    } catch (N) {
      if (N.code === "ENOENT") return;
      throw N;
    }
    if (u(g, b))
      throw new Error(d(f, m, T));
    return a(f, g, v, T);
  }
  function u(f, g) {
    return g.ino && g.dev && g.ino === f.ino && g.dev === f.dev;
  }
  function c(f, g) {
    const m = n.resolve(f).split(n.sep).filter((p) => p), T = n.resolve(g).split(n.sep).filter((p) => p);
    return m.reduce((p, v, b) => p && T[b] === v, !0);
  }
  function d(f, g, m) {
    return `Cannot ${m} '${f}' to a subdirectory of itself, '${g}'.`;
  }
  return On = {
    checkPaths: s,
    checkPathsSync: t,
    checkParentPaths: l,
    checkParentPathsSync: a,
    isSrcSubdir: c,
    areIdentical: u
  }, On;
}
var Cn, Yo;
function nh() {
  if (Yo) return Cn;
  Yo = 1;
  const e = Ve(), n = Se, r = lt().mkdirs, i = Ft().pathExists, o = wc().utimesMillis, s = /* @__PURE__ */ zt();
  function t(x, F, M, L) {
    typeof M == "function" && !L ? (L = M, M = {}) : typeof M == "function" && (M = { filter: M }), L = L || function() {
    }, M = M || {}, M.clobber = "clobber" in M ? !!M.clobber : !0, M.overwrite = "overwrite" in M ? !!M.overwrite : M.clobber, M.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
      `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
      "Warning",
      "fs-extra-WARN0001"
    ), s.checkPaths(x, F, "copy", M, (D, j) => {
      if (D) return L(D);
      const { srcStat: C, destStat: Q } = j;
      s.checkParentPaths(x, C, F, "copy", (V) => V ? L(V) : M.filter ? a(l, Q, x, F, M, L) : l(Q, x, F, M, L));
    });
  }
  function l(x, F, M, L, D) {
    const j = n.dirname(M);
    i(j, (C, Q) => {
      if (C) return D(C);
      if (Q) return c(x, F, M, L, D);
      r(j, (V) => V ? D(V) : c(x, F, M, L, D));
    });
  }
  function a(x, F, M, L, D, j) {
    Promise.resolve(D.filter(M, L)).then((C) => C ? x(F, M, L, D, j) : j(), (C) => j(C));
  }
  function u(x, F, M, L, D) {
    return L.filter ? a(c, x, F, M, L, D) : c(x, F, M, L, D);
  }
  function c(x, F, M, L, D) {
    (L.dereference ? e.stat : e.lstat)(F, (C, Q) => C ? D(C) : Q.isDirectory() ? O(Q, x, F, M, L, D) : Q.isFile() || Q.isCharacterDevice() || Q.isBlockDevice() ? d(Q, x, F, M, L, D) : Q.isSymbolicLink() ? y(x, F, M, L, D) : Q.isSocket() ? D(new Error(`Cannot copy a socket file: ${F}`)) : Q.isFIFO() ? D(new Error(`Cannot copy a FIFO pipe: ${F}`)) : D(new Error(`Unknown file: ${F}`)));
  }
  function d(x, F, M, L, D, j) {
    return F ? f(x, M, L, D, j) : g(x, M, L, D, j);
  }
  function f(x, F, M, L, D) {
    if (L.overwrite)
      e.unlink(M, (j) => j ? D(j) : g(x, F, M, L, D));
    else return L.errorOnExist ? D(new Error(`'${M}' already exists`)) : D();
  }
  function g(x, F, M, L, D) {
    e.copyFile(F, M, (j) => j ? D(j) : L.preserveTimestamps ? m(x.mode, F, M, D) : b(M, x.mode, D));
  }
  function m(x, F, M, L) {
    return T(x) ? p(M, x, (D) => D ? L(D) : v(x, F, M, L)) : v(x, F, M, L);
  }
  function T(x) {
    return (x & 128) === 0;
  }
  function p(x, F, M) {
    return b(x, F | 128, M);
  }
  function v(x, F, M, L) {
    N(F, M, (D) => D ? L(D) : b(M, x, L));
  }
  function b(x, F, M) {
    return e.chmod(x, F, M);
  }
  function N(x, F, M) {
    e.stat(x, (L, D) => L ? M(L) : o(F, D.atime, D.mtime, M));
  }
  function O(x, F, M, L, D, j) {
    return F ? R(M, L, D, j) : k(x.mode, M, L, D, j);
  }
  function k(x, F, M, L, D) {
    e.mkdir(M, (j) => {
      if (j) return D(j);
      R(F, M, L, (C) => C ? D(C) : b(M, x, D));
    });
  }
  function R(x, F, M, L) {
    e.readdir(x, (D, j) => D ? L(D) : S(j, x, F, M, L));
  }
  function S(x, F, M, L, D) {
    const j = x.pop();
    return j ? w(x, j, F, M, L, D) : D();
  }
  function w(x, F, M, L, D, j) {
    const C = n.join(M, F), Q = n.join(L, F);
    s.checkPaths(C, Q, "copy", D, (V, ne) => {
      if (V) return j(V);
      const { destStat: fe } = ne;
      u(fe, C, Q, D, (ce) => ce ? j(ce) : S(x, M, L, D, j));
    });
  }
  function y(x, F, M, L, D) {
    e.readlink(F, (j, C) => {
      if (j) return D(j);
      if (L.dereference && (C = n.resolve(process.cwd(), C)), x)
        e.readlink(M, (Q, V) => Q ? Q.code === "EINVAL" || Q.code === "UNKNOWN" ? e.symlink(C, M, D) : D(Q) : (L.dereference && (V = n.resolve(process.cwd(), V)), s.isSrcSubdir(C, V) ? D(new Error(`Cannot copy '${C}' to a subdirectory of itself, '${V}'.`)) : x.isDirectory() && s.isSrcSubdir(V, C) ? D(new Error(`Cannot overwrite '${V}' with '${C}'.`)) : $(C, M, D)));
      else
        return e.symlink(C, M, D);
    });
  }
  function $(x, F, M) {
    e.unlink(F, (L) => L ? M(L) : e.symlink(x, F, M));
  }
  return Cn = t, Cn;
}
var Ln, zo;
function ih() {
  if (zo) return Ln;
  zo = 1;
  const e = Ve(), n = Se, r = lt().mkdirsSync, i = wc().utimesMillisSync, o = /* @__PURE__ */ zt();
  function s(S, w, y) {
    typeof y == "function" && (y = { filter: y }), y = y || {}, y.clobber = "clobber" in y ? !!y.clobber : !0, y.overwrite = "overwrite" in y ? !!y.overwrite : y.clobber, y.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
      `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
      "Warning",
      "fs-extra-WARN0002"
    );
    const { srcStat: $, destStat: x } = o.checkPathsSync(S, w, "copy", y);
    return o.checkParentPathsSync(S, $, w, "copy"), t(x, S, w, y);
  }
  function t(S, w, y, $) {
    if ($.filter && !$.filter(w, y)) return;
    const x = n.dirname(y);
    return e.existsSync(x) || r(x), a(S, w, y, $);
  }
  function l(S, w, y, $) {
    if (!($.filter && !$.filter(w, y)))
      return a(S, w, y, $);
  }
  function a(S, w, y, $) {
    const F = ($.dereference ? e.statSync : e.lstatSync)(w);
    if (F.isDirectory()) return v(F, S, w, y, $);
    if (F.isFile() || F.isCharacterDevice() || F.isBlockDevice()) return u(F, S, w, y, $);
    if (F.isSymbolicLink()) return k(S, w, y, $);
    throw F.isSocket() ? new Error(`Cannot copy a socket file: ${w}`) : F.isFIFO() ? new Error(`Cannot copy a FIFO pipe: ${w}`) : new Error(`Unknown file: ${w}`);
  }
  function u(S, w, y, $, x) {
    return w ? c(S, y, $, x) : d(S, y, $, x);
  }
  function c(S, w, y, $) {
    if ($.overwrite)
      return e.unlinkSync(y), d(S, w, y, $);
    if ($.errorOnExist)
      throw new Error(`'${y}' already exists`);
  }
  function d(S, w, y, $) {
    return e.copyFileSync(w, y), $.preserveTimestamps && f(S.mode, w, y), T(y, S.mode);
  }
  function f(S, w, y) {
    return g(S) && m(y, S), p(w, y);
  }
  function g(S) {
    return (S & 128) === 0;
  }
  function m(S, w) {
    return T(S, w | 128);
  }
  function T(S, w) {
    return e.chmodSync(S, w);
  }
  function p(S, w) {
    const y = e.statSync(S);
    return i(w, y.atime, y.mtime);
  }
  function v(S, w, y, $, x) {
    return w ? N(y, $, x) : b(S.mode, y, $, x);
  }
  function b(S, w, y, $) {
    return e.mkdirSync(y), N(w, y, $), T(y, S);
  }
  function N(S, w, y) {
    e.readdirSync(S).forEach(($) => O($, S, w, y));
  }
  function O(S, w, y, $) {
    const x = n.join(w, S), F = n.join(y, S), { destStat: M } = o.checkPathsSync(x, F, "copy", $);
    return l(M, x, F, $);
  }
  function k(S, w, y, $) {
    let x = e.readlinkSync(w);
    if ($.dereference && (x = n.resolve(process.cwd(), x)), S) {
      let F;
      try {
        F = e.readlinkSync(y);
      } catch (M) {
        if (M.code === "EINVAL" || M.code === "UNKNOWN") return e.symlinkSync(x, y);
        throw M;
      }
      if ($.dereference && (F = n.resolve(process.cwd(), F)), o.isSrcSubdir(x, F))
        throw new Error(`Cannot copy '${x}' to a subdirectory of itself, '${F}'.`);
      if (e.statSync(y).isDirectory() && o.isSrcSubdir(F, x))
        throw new Error(`Cannot overwrite '${F}' with '${x}'.`);
      return R(x, y);
    } else
      return e.symlinkSync(x, y);
  }
  function R(S, w) {
    return e.unlinkSync(w), e.symlinkSync(S, w);
  }
  return Ln = s, Ln;
}
var Pn, Jo;
function Ks() {
  if (Jo) return Pn;
  Jo = 1;
  const e = Ke().fromCallback;
  return Pn = {
    copy: e(/* @__PURE__ */ nh()),
    copySync: /* @__PURE__ */ ih()
  }, Pn;
}
var Dn, Ko;
function sh() {
  if (Ko) return Dn;
  Ko = 1;
  const e = Ve(), n = Se, r = gc, i = process.platform === "win32";
  function o(m) {
    [
      "unlink",
      "chmod",
      "stat",
      "lstat",
      "rmdir",
      "readdir"
    ].forEach((p) => {
      m[p] = m[p] || e[p], p = p + "Sync", m[p] = m[p] || e[p];
    }), m.maxBusyTries = m.maxBusyTries || 3;
  }
  function s(m, T, p) {
    let v = 0;
    typeof T == "function" && (p = T, T = {}), r(m, "rimraf: missing path"), r.strictEqual(typeof m, "string", "rimraf: path should be a string"), r.strictEqual(typeof p, "function", "rimraf: callback function required"), r(T, "rimraf: invalid options argument provided"), r.strictEqual(typeof T, "object", "rimraf: options should be object"), o(T), t(m, T, function b(N) {
      if (N) {
        if ((N.code === "EBUSY" || N.code === "ENOTEMPTY" || N.code === "EPERM") && v < T.maxBusyTries) {
          v++;
          const O = v * 100;
          return setTimeout(() => t(m, T, b), O);
        }
        N.code === "ENOENT" && (N = null);
      }
      p(N);
    });
  }
  function t(m, T, p) {
    r(m), r(T), r(typeof p == "function"), T.lstat(m, (v, b) => {
      if (v && v.code === "ENOENT")
        return p(null);
      if (v && v.code === "EPERM" && i)
        return l(m, T, v, p);
      if (b && b.isDirectory())
        return u(m, T, v, p);
      T.unlink(m, (N) => {
        if (N) {
          if (N.code === "ENOENT")
            return p(null);
          if (N.code === "EPERM")
            return i ? l(m, T, N, p) : u(m, T, N, p);
          if (N.code === "EISDIR")
            return u(m, T, N, p);
        }
        return p(N);
      });
    });
  }
  function l(m, T, p, v) {
    r(m), r(T), r(typeof v == "function"), T.chmod(m, 438, (b) => {
      b ? v(b.code === "ENOENT" ? null : p) : T.stat(m, (N, O) => {
        N ? v(N.code === "ENOENT" ? null : p) : O.isDirectory() ? u(m, T, p, v) : T.unlink(m, v);
      });
    });
  }
  function a(m, T, p) {
    let v;
    r(m), r(T);
    try {
      T.chmodSync(m, 438);
    } catch (b) {
      if (b.code === "ENOENT")
        return;
      throw p;
    }
    try {
      v = T.statSync(m);
    } catch (b) {
      if (b.code === "ENOENT")
        return;
      throw p;
    }
    v.isDirectory() ? f(m, T, p) : T.unlinkSync(m);
  }
  function u(m, T, p, v) {
    r(m), r(T), r(typeof v == "function"), T.rmdir(m, (b) => {
      b && (b.code === "ENOTEMPTY" || b.code === "EEXIST" || b.code === "EPERM") ? c(m, T, v) : b && b.code === "ENOTDIR" ? v(p) : v(b);
    });
  }
  function c(m, T, p) {
    r(m), r(T), r(typeof p == "function"), T.readdir(m, (v, b) => {
      if (v) return p(v);
      let N = b.length, O;
      if (N === 0) return T.rmdir(m, p);
      b.forEach((k) => {
        s(n.join(m, k), T, (R) => {
          if (!O) {
            if (R) return p(O = R);
            --N === 0 && T.rmdir(m, p);
          }
        });
      });
    });
  }
  function d(m, T) {
    let p;
    T = T || {}, o(T), r(m, "rimraf: missing path"), r.strictEqual(typeof m, "string", "rimraf: path should be a string"), r(T, "rimraf: missing options"), r.strictEqual(typeof T, "object", "rimraf: options should be object");
    try {
      p = T.lstatSync(m);
    } catch (v) {
      if (v.code === "ENOENT")
        return;
      v.code === "EPERM" && i && a(m, T, v);
    }
    try {
      p && p.isDirectory() ? f(m, T, null) : T.unlinkSync(m);
    } catch (v) {
      if (v.code === "ENOENT")
        return;
      if (v.code === "EPERM")
        return i ? a(m, T, v) : f(m, T, v);
      if (v.code !== "EISDIR")
        throw v;
      f(m, T, v);
    }
  }
  function f(m, T, p) {
    r(m), r(T);
    try {
      T.rmdirSync(m);
    } catch (v) {
      if (v.code === "ENOTDIR")
        throw p;
      if (v.code === "ENOTEMPTY" || v.code === "EEXIST" || v.code === "EPERM")
        g(m, T);
      else if (v.code !== "ENOENT")
        throw v;
    }
  }
  function g(m, T) {
    if (r(m), r(T), T.readdirSync(m).forEach((p) => d(n.join(m, p), T)), i) {
      const p = Date.now();
      do
        try {
          return T.rmdirSync(m, T);
        } catch {
        }
      while (Date.now() - p < 500);
    } else
      return T.rmdirSync(m, T);
  }
  return Dn = s, s.sync = d, Dn;
}
var Un, Qo;
function tn() {
  if (Qo) return Un;
  Qo = 1;
  const e = Ve(), n = Ke().fromCallback, r = /* @__PURE__ */ sh();
  function i(s, t) {
    if (e.rm) return e.rm(s, { recursive: !0, force: !0 }, t);
    r(s, t);
  }
  function o(s) {
    if (e.rmSync) return e.rmSync(s, { recursive: !0, force: !0 });
    r.sync(s);
  }
  return Un = {
    remove: n(i),
    removeSync: o
  }, Un;
}
var Fn, Zo;
function oh() {
  if (Zo) return Fn;
  Zo = 1;
  const e = Ke().fromPromise, n = /* @__PURE__ */ Yt(), r = Se, i = /* @__PURE__ */ lt(), o = /* @__PURE__ */ tn(), s = e(async function(a) {
    let u;
    try {
      u = await n.readdir(a);
    } catch {
      return i.mkdirs(a);
    }
    return Promise.all(u.map((c) => o.remove(r.join(a, c))));
  });
  function t(l) {
    let a;
    try {
      a = n.readdirSync(l);
    } catch {
      return i.mkdirsSync(l);
    }
    a.forEach((u) => {
      u = r.join(l, u), o.removeSync(u);
    });
  }
  return Fn = {
    emptyDirSync: t,
    emptydirSync: t,
    emptyDir: s,
    emptydir: s
  }, Fn;
}
var xn, ea;
function ah() {
  if (ea) return xn;
  ea = 1;
  const e = Ke().fromCallback, n = Se, r = Ve(), i = /* @__PURE__ */ lt();
  function o(t, l) {
    function a() {
      r.writeFile(t, "", (u) => {
        if (u) return l(u);
        l();
      });
    }
    r.stat(t, (u, c) => {
      if (!u && c.isFile()) return l();
      const d = n.dirname(t);
      r.stat(d, (f, g) => {
        if (f)
          return f.code === "ENOENT" ? i.mkdirs(d, (m) => {
            if (m) return l(m);
            a();
          }) : l(f);
        g.isDirectory() ? a() : r.readdir(d, (m) => {
          if (m) return l(m);
        });
      });
    });
  }
  function s(t) {
    let l;
    try {
      l = r.statSync(t);
    } catch {
    }
    if (l && l.isFile()) return;
    const a = n.dirname(t);
    try {
      r.statSync(a).isDirectory() || r.readdirSync(a);
    } catch (u) {
      if (u && u.code === "ENOENT") i.mkdirsSync(a);
      else throw u;
    }
    r.writeFileSync(t, "");
  }
  return xn = {
    createFile: e(o),
    createFileSync: s
  }, xn;
}
var kn, ta;
function lh() {
  if (ta) return kn;
  ta = 1;
  const e = Ke().fromCallback, n = Se, r = Ve(), i = /* @__PURE__ */ lt(), o = Ft().pathExists, { areIdentical: s } = /* @__PURE__ */ zt();
  function t(a, u, c) {
    function d(f, g) {
      r.link(f, g, (m) => {
        if (m) return c(m);
        c(null);
      });
    }
    r.lstat(u, (f, g) => {
      r.lstat(a, (m, T) => {
        if (m)
          return m.message = m.message.replace("lstat", "ensureLink"), c(m);
        if (g && s(T, g)) return c(null);
        const p = n.dirname(u);
        o(p, (v, b) => {
          if (v) return c(v);
          if (b) return d(a, u);
          i.mkdirs(p, (N) => {
            if (N) return c(N);
            d(a, u);
          });
        });
      });
    });
  }
  function l(a, u) {
    let c;
    try {
      c = r.lstatSync(u);
    } catch {
    }
    try {
      const g = r.lstatSync(a);
      if (c && s(g, c)) return;
    } catch (g) {
      throw g.message = g.message.replace("lstat", "ensureLink"), g;
    }
    const d = n.dirname(u);
    return r.existsSync(d) || i.mkdirsSync(d), r.linkSync(a, u);
  }
  return kn = {
    createLink: e(t),
    createLinkSync: l
  }, kn;
}
var qn, ra;
function uh() {
  if (ra) return qn;
  ra = 1;
  const e = Se, n = Ve(), r = Ft().pathExists;
  function i(s, t, l) {
    if (e.isAbsolute(s))
      return n.lstat(s, (a) => a ? (a.message = a.message.replace("lstat", "ensureSymlink"), l(a)) : l(null, {
        toCwd: s,
        toDst: s
      }));
    {
      const a = e.dirname(t), u = e.join(a, s);
      return r(u, (c, d) => c ? l(c) : d ? l(null, {
        toCwd: u,
        toDst: s
      }) : n.lstat(s, (f) => f ? (f.message = f.message.replace("lstat", "ensureSymlink"), l(f)) : l(null, {
        toCwd: s,
        toDst: e.relative(a, s)
      })));
    }
  }
  function o(s, t) {
    let l;
    if (e.isAbsolute(s)) {
      if (l = n.existsSync(s), !l) throw new Error("absolute srcpath does not exist");
      return {
        toCwd: s,
        toDst: s
      };
    } else {
      const a = e.dirname(t), u = e.join(a, s);
      if (l = n.existsSync(u), l)
        return {
          toCwd: u,
          toDst: s
        };
      if (l = n.existsSync(s), !l) throw new Error("relative srcpath does not exist");
      return {
        toCwd: s,
        toDst: e.relative(a, s)
      };
    }
  }
  return qn = {
    symlinkPaths: i,
    symlinkPathsSync: o
  }, qn;
}
var $n, na;
function ch() {
  if (na) return $n;
  na = 1;
  const e = Ve();
  function n(i, o, s) {
    if (s = typeof o == "function" ? o : s, o = typeof o == "function" ? !1 : o, o) return s(null, o);
    e.lstat(i, (t, l) => {
      if (t) return s(null, "file");
      o = l && l.isDirectory() ? "dir" : "file", s(null, o);
    });
  }
  function r(i, o) {
    let s;
    if (o) return o;
    try {
      s = e.lstatSync(i);
    } catch {
      return "file";
    }
    return s && s.isDirectory() ? "dir" : "file";
  }
  return $n = {
    symlinkType: n,
    symlinkTypeSync: r
  }, $n;
}
var Mn, ia;
function dh() {
  if (ia) return Mn;
  ia = 1;
  const e = Ke().fromCallback, n = Se, r = /* @__PURE__ */ Yt(), i = /* @__PURE__ */ lt(), o = i.mkdirs, s = i.mkdirsSync, t = /* @__PURE__ */ uh(), l = t.symlinkPaths, a = t.symlinkPathsSync, u = /* @__PURE__ */ ch(), c = u.symlinkType, d = u.symlinkTypeSync, f = Ft().pathExists, { areIdentical: g } = /* @__PURE__ */ zt();
  function m(v, b, N, O) {
    O = typeof N == "function" ? N : O, N = typeof N == "function" ? !1 : N, r.lstat(b, (k, R) => {
      !k && R.isSymbolicLink() ? Promise.all([
        r.stat(v),
        r.stat(b)
      ]).then(([S, w]) => {
        if (g(S, w)) return O(null);
        T(v, b, N, O);
      }) : T(v, b, N, O);
    });
  }
  function T(v, b, N, O) {
    l(v, b, (k, R) => {
      if (k) return O(k);
      v = R.toDst, c(R.toCwd, N, (S, w) => {
        if (S) return O(S);
        const y = n.dirname(b);
        f(y, ($, x) => {
          if ($) return O($);
          if (x) return r.symlink(v, b, w, O);
          o(y, (F) => {
            if (F) return O(F);
            r.symlink(v, b, w, O);
          });
        });
      });
    });
  }
  function p(v, b, N) {
    let O;
    try {
      O = r.lstatSync(b);
    } catch {
    }
    if (O && O.isSymbolicLink()) {
      const w = r.statSync(v), y = r.statSync(b);
      if (g(w, y)) return;
    }
    const k = a(v, b);
    v = k.toDst, N = d(k.toCwd, N);
    const R = n.dirname(b);
    return r.existsSync(R) || s(R), r.symlinkSync(v, b, N);
  }
  return Mn = {
    createSymlink: e(m),
    createSymlinkSync: p
  }, Mn;
}
var Bn, sa;
function fh() {
  if (sa) return Bn;
  sa = 1;
  const { createFile: e, createFileSync: n } = /* @__PURE__ */ ah(), { createLink: r, createLinkSync: i } = /* @__PURE__ */ lh(), { createSymlink: o, createSymlinkSync: s } = /* @__PURE__ */ dh();
  return Bn = {
    // file
    createFile: e,
    createFileSync: n,
    ensureFile: e,
    ensureFileSync: n,
    // link
    createLink: r,
    createLinkSync: i,
    ensureLink: r,
    ensureLinkSync: i,
    // symlink
    createSymlink: o,
    createSymlinkSync: s,
    ensureSymlink: o,
    ensureSymlinkSync: s
  }, Bn;
}
var Hn, oa;
function Qs() {
  if (oa) return Hn;
  oa = 1;
  function e(r, { EOL: i = `
`, finalEOL: o = !0, replacer: s = null, spaces: t } = {}) {
    const l = o ? i : "";
    return JSON.stringify(r, s, t).replace(/\n/g, i) + l;
  }
  function n(r) {
    return Buffer.isBuffer(r) && (r = r.toString("utf8")), r.replace(/^\uFEFF/, "");
  }
  return Hn = { stringify: e, stripBom: n }, Hn;
}
var jn, aa;
function hh() {
  if (aa) return jn;
  aa = 1;
  let e;
  try {
    e = Ve();
  } catch {
    e = Ce;
  }
  const n = Ke(), { stringify: r, stripBom: i } = Qs();
  async function o(c, d = {}) {
    typeof d == "string" && (d = { encoding: d });
    const f = d.fs || e, g = "throws" in d ? d.throws : !0;
    let m = await n.fromCallback(f.readFile)(c, d);
    m = i(m);
    let T;
    try {
      T = JSON.parse(m, d ? d.reviver : null);
    } catch (p) {
      if (g)
        throw p.message = `${c}: ${p.message}`, p;
      return null;
    }
    return T;
  }
  const s = n.fromPromise(o);
  function t(c, d = {}) {
    typeof d == "string" && (d = { encoding: d });
    const f = d.fs || e, g = "throws" in d ? d.throws : !0;
    try {
      let m = f.readFileSync(c, d);
      return m = i(m), JSON.parse(m, d.reviver);
    } catch (m) {
      if (g)
        throw m.message = `${c}: ${m.message}`, m;
      return null;
    }
  }
  async function l(c, d, f = {}) {
    const g = f.fs || e, m = r(d, f);
    await n.fromCallback(g.writeFile)(c, m, f);
  }
  const a = n.fromPromise(l);
  function u(c, d, f = {}) {
    const g = f.fs || e, m = r(d, f);
    return g.writeFileSync(c, m, f);
  }
  return jn = {
    readFile: s,
    readFileSync: t,
    writeFile: a,
    writeFileSync: u
  }, jn;
}
var Xn, la;
function ph() {
  if (la) return Xn;
  la = 1;
  const e = hh();
  return Xn = {
    // jsonfile exports
    readJson: e.readFile,
    readJsonSync: e.readFileSync,
    writeJson: e.writeFile,
    writeJsonSync: e.writeFileSync
  }, Xn;
}
var Gn, ua;
function Zs() {
  if (ua) return Gn;
  ua = 1;
  const e = Ke().fromCallback, n = Ve(), r = Se, i = /* @__PURE__ */ lt(), o = Ft().pathExists;
  function s(l, a, u, c) {
    typeof u == "function" && (c = u, u = "utf8");
    const d = r.dirname(l);
    o(d, (f, g) => {
      if (f) return c(f);
      if (g) return n.writeFile(l, a, u, c);
      i.mkdirs(d, (m) => {
        if (m) return c(m);
        n.writeFile(l, a, u, c);
      });
    });
  }
  function t(l, ...a) {
    const u = r.dirname(l);
    if (n.existsSync(u))
      return n.writeFileSync(l, ...a);
    i.mkdirsSync(u), n.writeFileSync(l, ...a);
  }
  return Gn = {
    outputFile: e(s),
    outputFileSync: t
  }, Gn;
}
var Wn, ca;
function gh() {
  if (ca) return Wn;
  ca = 1;
  const { stringify: e } = Qs(), { outputFile: n } = /* @__PURE__ */ Zs();
  async function r(i, o, s = {}) {
    const t = e(o, s);
    await n(i, t, s);
  }
  return Wn = r, Wn;
}
var Vn, da;
function mh() {
  if (da) return Vn;
  da = 1;
  const { stringify: e } = Qs(), { outputFileSync: n } = /* @__PURE__ */ Zs();
  function r(i, o, s) {
    const t = e(o, s);
    n(i, t, s);
  }
  return Vn = r, Vn;
}
var Yn, fa;
function Eh() {
  if (fa) return Yn;
  fa = 1;
  const e = Ke().fromPromise, n = /* @__PURE__ */ ph();
  return n.outputJson = e(/* @__PURE__ */ gh()), n.outputJsonSync = /* @__PURE__ */ mh(), n.outputJSON = n.outputJson, n.outputJSONSync = n.outputJsonSync, n.writeJSON = n.writeJson, n.writeJSONSync = n.writeJsonSync, n.readJSON = n.readJson, n.readJSONSync = n.readJsonSync, Yn = n, Yn;
}
var zn, ha;
function Th() {
  if (ha) return zn;
  ha = 1;
  const e = Ve(), n = Se, r = Ks().copy, i = tn().remove, o = lt().mkdirp, s = Ft().pathExists, t = /* @__PURE__ */ zt();
  function l(f, g, m, T) {
    typeof m == "function" && (T = m, m = {}), m = m || {};
    const p = m.overwrite || m.clobber || !1;
    t.checkPaths(f, g, "move", m, (v, b) => {
      if (v) return T(v);
      const { srcStat: N, isChangingCase: O = !1 } = b;
      t.checkParentPaths(f, N, g, "move", (k) => {
        if (k) return T(k);
        if (a(g)) return u(f, g, p, O, T);
        o(n.dirname(g), (R) => R ? T(R) : u(f, g, p, O, T));
      });
    });
  }
  function a(f) {
    const g = n.dirname(f);
    return n.parse(g).root === g;
  }
  function u(f, g, m, T, p) {
    if (T) return c(f, g, m, p);
    if (m)
      return i(g, (v) => v ? p(v) : c(f, g, m, p));
    s(g, (v, b) => v ? p(v) : b ? p(new Error("dest already exists.")) : c(f, g, m, p));
  }
  function c(f, g, m, T) {
    e.rename(f, g, (p) => p ? p.code !== "EXDEV" ? T(p) : d(f, g, m, T) : T());
  }
  function d(f, g, m, T) {
    r(f, g, {
      overwrite: m,
      errorOnExist: !0
    }, (v) => v ? T(v) : i(f, T));
  }
  return zn = l, zn;
}
var Jn, pa;
function yh() {
  if (pa) return Jn;
  pa = 1;
  const e = Ve(), n = Se, r = Ks().copySync, i = tn().removeSync, o = lt().mkdirpSync, s = /* @__PURE__ */ zt();
  function t(d, f, g) {
    g = g || {};
    const m = g.overwrite || g.clobber || !1, { srcStat: T, isChangingCase: p = !1 } = s.checkPathsSync(d, f, "move", g);
    return s.checkParentPathsSync(d, T, f, "move"), l(f) || o(n.dirname(f)), a(d, f, m, p);
  }
  function l(d) {
    const f = n.dirname(d);
    return n.parse(f).root === f;
  }
  function a(d, f, g, m) {
    if (m) return u(d, f, g);
    if (g)
      return i(f), u(d, f, g);
    if (e.existsSync(f)) throw new Error("dest already exists.");
    return u(d, f, g);
  }
  function u(d, f, g) {
    try {
      e.renameSync(d, f);
    } catch (m) {
      if (m.code !== "EXDEV") throw m;
      return c(d, f, g);
    }
  }
  function c(d, f, g) {
    return r(d, f, {
      overwrite: g,
      errorOnExist: !0
    }), i(d);
  }
  return Jn = t, Jn;
}
var Kn, ga;
function vh() {
  if (ga) return Kn;
  ga = 1;
  const e = Ke().fromCallback;
  return Kn = {
    move: e(/* @__PURE__ */ Th()),
    moveSync: /* @__PURE__ */ yh()
  }, Kn;
}
var Qn, ma;
function wt() {
  return ma || (ma = 1, Qn = {
    // Export promiseified graceful-fs:
    .../* @__PURE__ */ Yt(),
    // Export extra methods:
    .../* @__PURE__ */ Ks(),
    .../* @__PURE__ */ oh(),
    .../* @__PURE__ */ fh(),
    .../* @__PURE__ */ Eh(),
    .../* @__PURE__ */ lt(),
    .../* @__PURE__ */ vh(),
    .../* @__PURE__ */ Zs(),
    .../* @__PURE__ */ Ft(),
    .../* @__PURE__ */ tn()
  }), Qn;
}
var tr = {}, Ct = {}, Zn = {}, Lt = {}, Ea;
function eo() {
  if (Ea) return Lt;
  Ea = 1, Object.defineProperty(Lt, "__esModule", { value: !0 }), Lt.CancellationError = Lt.CancellationToken = void 0;
  const e = en;
  let n = class extends e.EventEmitter {
    get cancelled() {
      return this._cancelled || this._parent != null && this._parent.cancelled;
    }
    set parent(o) {
      this.removeParentCancelHandler(), this._parent = o, this.parentCancelHandler = () => this.cancel(), this._parent.onCancel(this.parentCancelHandler);
    }
    // babel cannot compile ... correctly for super calls
    constructor(o) {
      super(), this.parentCancelHandler = null, this._parent = null, this._cancelled = !1, o != null && (this.parent = o);
    }
    cancel() {
      this._cancelled = !0, this.emit("cancel");
    }
    onCancel(o) {
      this.cancelled ? o() : this.once("cancel", o);
    }
    createPromise(o) {
      if (this.cancelled)
        return Promise.reject(new r());
      const s = () => {
        if (t != null)
          try {
            this.removeListener("cancel", t), t = null;
          } catch {
          }
      };
      let t = null;
      return new Promise((l, a) => {
        let u = null;
        if (t = () => {
          try {
            u != null && (u(), u = null);
          } finally {
            a(new r());
          }
        }, this.cancelled) {
          t();
          return;
        }
        this.onCancel(t), o(l, a, (c) => {
          u = c;
        });
      }).then((l) => (s(), l)).catch((l) => {
        throw s(), l;
      });
    }
    removeParentCancelHandler() {
      const o = this._parent;
      o != null && this.parentCancelHandler != null && (o.removeListener("cancel", this.parentCancelHandler), this.parentCancelHandler = null);
    }
    dispose() {
      try {
        this.removeParentCancelHandler();
      } finally {
        this.removeAllListeners(), this._parent = null;
      }
    }
  };
  Lt.CancellationToken = n;
  class r extends Error {
    constructor() {
      super("cancelled");
    }
  }
  return Lt.CancellationError = r, Lt;
}
var Mr = {}, Ta;
function rn() {
  if (Ta) return Mr;
  Ta = 1, Object.defineProperty(Mr, "__esModule", { value: !0 }), Mr.newError = e;
  function e(n, r) {
    const i = new Error(n);
    return i.code = r, i;
  }
  return Mr;
}
var Me = {}, Br = { exports: {} }, Hr = { exports: {} }, ei, ya;
function Sh() {
  if (ya) return ei;
  ya = 1;
  var e = 1e3, n = e * 60, r = n * 60, i = r * 24, o = i * 7, s = i * 365.25;
  ei = function(c, d) {
    d = d || {};
    var f = typeof c;
    if (f === "string" && c.length > 0)
      return t(c);
    if (f === "number" && isFinite(c))
      return d.long ? a(c) : l(c);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(c)
    );
  };
  function t(c) {
    if (c = String(c), !(c.length > 100)) {
      var d = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        c
      );
      if (d) {
        var f = parseFloat(d[1]), g = (d[2] || "ms").toLowerCase();
        switch (g) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return f * s;
          case "weeks":
          case "week":
          case "w":
            return f * o;
          case "days":
          case "day":
          case "d":
            return f * i;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return f * r;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return f * n;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return f * e;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return f;
          default:
            return;
        }
      }
    }
  }
  function l(c) {
    var d = Math.abs(c);
    return d >= i ? Math.round(c / i) + "d" : d >= r ? Math.round(c / r) + "h" : d >= n ? Math.round(c / n) + "m" : d >= e ? Math.round(c / e) + "s" : c + "ms";
  }
  function a(c) {
    var d = Math.abs(c);
    return d >= i ? u(c, d, i, "day") : d >= r ? u(c, d, r, "hour") : d >= n ? u(c, d, n, "minute") : d >= e ? u(c, d, e, "second") : c + " ms";
  }
  function u(c, d, f, g) {
    var m = d >= f * 1.5;
    return Math.round(c / f) + " " + g + (m ? "s" : "");
  }
  return ei;
}
var ti, va;
function _c() {
  if (va) return ti;
  va = 1;
  function e(n) {
    i.debug = i, i.default = i, i.coerce = u, i.disable = l, i.enable = s, i.enabled = a, i.humanize = Sh(), i.destroy = c, Object.keys(n).forEach((d) => {
      i[d] = n[d];
    }), i.names = [], i.skips = [], i.formatters = {};
    function r(d) {
      let f = 0;
      for (let g = 0; g < d.length; g++)
        f = (f << 5) - f + d.charCodeAt(g), f |= 0;
      return i.colors[Math.abs(f) % i.colors.length];
    }
    i.selectColor = r;
    function i(d) {
      let f, g = null, m, T;
      function p(...v) {
        if (!p.enabled)
          return;
        const b = p, N = Number(/* @__PURE__ */ new Date()), O = N - (f || N);
        b.diff = O, b.prev = f, b.curr = N, f = N, v[0] = i.coerce(v[0]), typeof v[0] != "string" && v.unshift("%O");
        let k = 0;
        v[0] = v[0].replace(/%([a-zA-Z%])/g, (S, w) => {
          if (S === "%%")
            return "%";
          k++;
          const y = i.formatters[w];
          if (typeof y == "function") {
            const $ = v[k];
            S = y.call(b, $), v.splice(k, 1), k--;
          }
          return S;
        }), i.formatArgs.call(b, v), (b.log || i.log).apply(b, v);
      }
      return p.namespace = d, p.useColors = i.useColors(), p.color = i.selectColor(d), p.extend = o, p.destroy = i.destroy, Object.defineProperty(p, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => g !== null ? g : (m !== i.namespaces && (m = i.namespaces, T = i.enabled(d)), T),
        set: (v) => {
          g = v;
        }
      }), typeof i.init == "function" && i.init(p), p;
    }
    function o(d, f) {
      const g = i(this.namespace + (typeof f > "u" ? ":" : f) + d);
      return g.log = this.log, g;
    }
    function s(d) {
      i.save(d), i.namespaces = d, i.names = [], i.skips = [];
      const f = (typeof d == "string" ? d : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const g of f)
        g[0] === "-" ? i.skips.push(g.slice(1)) : i.names.push(g);
    }
    function t(d, f) {
      let g = 0, m = 0, T = -1, p = 0;
      for (; g < d.length; )
        if (m < f.length && (f[m] === d[g] || f[m] === "*"))
          f[m] === "*" ? (T = m, p = g, m++) : (g++, m++);
        else if (T !== -1)
          m = T + 1, p++, g = p;
        else
          return !1;
      for (; m < f.length && f[m] === "*"; )
        m++;
      return m === f.length;
    }
    function l() {
      const d = [
        ...i.names,
        ...i.skips.map((f) => "-" + f)
      ].join(",");
      return i.enable(""), d;
    }
    function a(d) {
      for (const f of i.skips)
        if (t(d, f))
          return !1;
      for (const f of i.names)
        if (t(d, f))
          return !0;
      return !1;
    }
    function u(d) {
      return d instanceof Error ? d.stack || d.message : d;
    }
    function c() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return i.enable(i.load()), i;
  }
  return ti = e, ti;
}
var Sa;
function Ah() {
  return Sa || (Sa = 1, (function(e, n) {
    n.formatArgs = i, n.save = o, n.load = s, n.useColors = r, n.storage = t(), n.destroy = /* @__PURE__ */ (() => {
      let a = !1;
      return () => {
        a || (a = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      };
    })(), n.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function r() {
      if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs))
        return !0;
      if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
        return !1;
      let a;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (a = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(a[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function i(a) {
      if (a[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + a[0] + (this.useColors ? "%c " : " ") + "+" + e.exports.humanize(this.diff), !this.useColors)
        return;
      const u = "color: " + this.color;
      a.splice(1, 0, u, "color: inherit");
      let c = 0, d = 0;
      a[0].replace(/%[a-zA-Z%]/g, (f) => {
        f !== "%%" && (c++, f === "%c" && (d = c));
      }), a.splice(d, 0, u);
    }
    n.log = console.debug || console.log || (() => {
    });
    function o(a) {
      try {
        a ? n.storage.setItem("debug", a) : n.storage.removeItem("debug");
      } catch {
      }
    }
    function s() {
      let a;
      try {
        a = n.storage.getItem("debug") || n.storage.getItem("DEBUG");
      } catch {
      }
      return !a && typeof process < "u" && "env" in process && (a = process.env.DEBUG), a;
    }
    function t() {
      try {
        return localStorage;
      } catch {
      }
    }
    e.exports = _c()(n);
    const { formatters: l } = e.exports;
    l.j = function(a) {
      try {
        return JSON.stringify(a);
      } catch (u) {
        return "[UnexpectedJSONParseError]: " + u.message;
      }
    };
  })(Hr, Hr.exports)), Hr.exports;
}
var jr = { exports: {} }, ri, Aa;
function wh() {
  return Aa || (Aa = 1, ri = (e, n = process.argv) => {
    const r = e.startsWith("-") ? "" : e.length === 1 ? "-" : "--", i = n.indexOf(r + e), o = n.indexOf("--");
    return i !== -1 && (o === -1 || i < o);
  }), ri;
}
var ni, wa;
function _h() {
  if (wa) return ni;
  wa = 1;
  const e = At, n = mc, r = wh(), { env: i } = process;
  let o;
  r("no-color") || r("no-colors") || r("color=false") || r("color=never") ? o = 0 : (r("color") || r("colors") || r("color=true") || r("color=always")) && (o = 1);
  function s() {
    if ("FORCE_COLOR" in i)
      return i.FORCE_COLOR === "true" ? 1 : i.FORCE_COLOR === "false" ? 0 : i.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(i.FORCE_COLOR, 10), 3);
  }
  function t(u) {
    return u === 0 ? !1 : {
      level: u,
      hasBasic: !0,
      has256: u >= 2,
      has16m: u >= 3
    };
  }
  function l(u, { streamIsTTY: c, sniffFlags: d = !0 } = {}) {
    const f = s();
    f !== void 0 && (o = f);
    const g = d ? o : f;
    if (g === 0)
      return 0;
    if (d) {
      if (r("color=16m") || r("color=full") || r("color=truecolor"))
        return 3;
      if (r("color=256"))
        return 2;
    }
    if (u && !c && g === void 0)
      return 0;
    const m = g || 0;
    if (i.TERM === "dumb")
      return m;
    if (process.platform === "win32") {
      const T = e.release().split(".");
      return Number(T[0]) >= 10 && Number(T[2]) >= 10586 ? Number(T[2]) >= 14931 ? 3 : 2 : 1;
    }
    if ("CI" in i)
      return ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE", "DRONE"].some((T) => T in i) || i.CI_NAME === "codeship" ? 1 : m;
    if ("TEAMCITY_VERSION" in i)
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(i.TEAMCITY_VERSION) ? 1 : 0;
    if (i.COLORTERM === "truecolor")
      return 3;
    if ("TERM_PROGRAM" in i) {
      const T = Number.parseInt((i.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (i.TERM_PROGRAM) {
        case "iTerm.app":
          return T >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    return /-256(color)?$/i.test(i.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(i.TERM) || "COLORTERM" in i ? 1 : m;
  }
  function a(u, c = {}) {
    const d = l(u, {
      streamIsTTY: u && u.isTTY,
      ...c
    });
    return t(d);
  }
  return ni = {
    supportsColor: a,
    stdout: a({ isTTY: n.isatty(1) }),
    stderr: a({ isTTY: n.isatty(2) })
  }, ni;
}
var _a;
function bh() {
  return _a || (_a = 1, (function(e, n) {
    const r = mc, i = Zr;
    n.init = c, n.log = l, n.formatArgs = s, n.save = a, n.load = u, n.useColors = o, n.destroy = i.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), n.colors = [6, 2, 3, 4, 5, 1];
    try {
      const f = _h();
      f && (f.stderr || f).level >= 2 && (n.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221
      ]);
    } catch {
    }
    n.inspectOpts = Object.keys(process.env).filter((f) => /^debug_/i.test(f)).reduce((f, g) => {
      const m = g.substring(6).toLowerCase().replace(/_([a-z])/g, (p, v) => v.toUpperCase());
      let T = process.env[g];
      return /^(yes|on|true|enabled)$/i.test(T) ? T = !0 : /^(no|off|false|disabled)$/i.test(T) ? T = !1 : T === "null" ? T = null : T = Number(T), f[m] = T, f;
    }, {});
    function o() {
      return "colors" in n.inspectOpts ? !!n.inspectOpts.colors : r.isatty(process.stderr.fd);
    }
    function s(f) {
      const { namespace: g, useColors: m } = this;
      if (m) {
        const T = this.color, p = "\x1B[3" + (T < 8 ? T : "8;5;" + T), v = `  ${p};1m${g} \x1B[0m`;
        f[0] = v + f[0].split(`
`).join(`
` + v), f.push(p + "m+" + e.exports.humanize(this.diff) + "\x1B[0m");
      } else
        f[0] = t() + g + " " + f[0];
    }
    function t() {
      return n.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function l(...f) {
      return process.stderr.write(i.formatWithOptions(n.inspectOpts, ...f) + `
`);
    }
    function a(f) {
      f ? process.env.DEBUG = f : delete process.env.DEBUG;
    }
    function u() {
      return process.env.DEBUG;
    }
    function c(f) {
      f.inspectOpts = {};
      const g = Object.keys(n.inspectOpts);
      for (let m = 0; m < g.length; m++)
        f.inspectOpts[g[m]] = n.inspectOpts[g[m]];
    }
    e.exports = _c()(n);
    const { formatters: d } = e.exports;
    d.o = function(f) {
      return this.inspectOpts.colors = this.useColors, i.inspect(f, this.inspectOpts).split(`
`).map((g) => g.trim()).join(" ");
    }, d.O = function(f) {
      return this.inspectOpts.colors = this.useColors, i.inspect(f, this.inspectOpts);
    };
  })(jr, jr.exports)), jr.exports;
}
var ba;
function Rh() {
  return ba || (ba = 1, typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? Br.exports = Ah() : Br.exports = bh()), Br.exports;
}
var rr = {}, Ra;
function bc() {
  if (Ra) return rr;
  Ra = 1, Object.defineProperty(rr, "__esModule", { value: !0 }), rr.ProgressCallbackTransform = void 0;
  const e = br;
  let n = class extends e.Transform {
    constructor(i, o, s) {
      super(), this.total = i, this.cancellationToken = o, this.onProgress = s, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.nextUpdate = this.start + 1e3;
    }
    _transform(i, o, s) {
      if (this.cancellationToken.cancelled) {
        s(new Error("cancelled"), null);
        return;
      }
      this.transferred += i.length, this.delta += i.length;
      const t = Date.now();
      t >= this.nextUpdate && this.transferred !== this.total && (this.nextUpdate = t + 1e3, this.onProgress({
        total: this.total,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.total * 100,
        bytesPerSecond: Math.round(this.transferred / ((t - this.start) / 1e3))
      }), this.delta = 0), s(null, i);
    }
    _flush(i) {
      if (this.cancellationToken.cancelled) {
        i(new Error("cancelled"));
        return;
      }
      this.onProgress({
        total: this.total,
        delta: this.delta,
        transferred: this.total,
        percent: 100,
        bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
      }), this.delta = 0, i(null);
    }
  };
  return rr.ProgressCallbackTransform = n, rr;
}
var Ia;
function Ih() {
  if (Ia) return Me;
  Ia = 1, Object.defineProperty(Me, "__esModule", { value: !0 }), Me.DigestTransform = Me.HttpExecutor = Me.HttpError = void 0, Me.createHttpError = u, Me.parseJson = f, Me.configureRequestOptionsFromUrl = m, Me.configureRequestUrl = T, Me.safeGetHeader = b, Me.configureRequestOptions = O, Me.safeStringifyJson = k;
  const e = Je, n = Rh(), r = Ce, i = br, o = Vt, s = eo(), t = rn(), l = bc(), a = (0, n.default)("electron-builder");
  function u(R, S = null) {
    return new d(R.statusCode || -1, `${R.statusCode} ${R.statusMessage}` + (S == null ? "" : `
` + JSON.stringify(S, null, "  ")) + `
Headers: ` + k(R.headers), S);
  }
  const c = /* @__PURE__ */ new Map([
    [429, "Too many requests"],
    [400, "Bad request"],
    [403, "Forbidden"],
    [404, "Not found"],
    [405, "Method not allowed"],
    [406, "Not acceptable"],
    [408, "Request timeout"],
    [413, "Request entity too large"],
    [500, "Internal server error"],
    [502, "Bad gateway"],
    [503, "Service unavailable"],
    [504, "Gateway timeout"],
    [505, "HTTP version not supported"]
  ]);
  class d extends Error {
    constructor(S, w = `HTTP error: ${c.get(S) || S}`, y = null) {
      super(w), this.statusCode = S, this.description = y, this.name = "HttpError", this.code = `HTTP_ERROR_${S}`;
    }
    isServerError() {
      return this.statusCode >= 500 && this.statusCode <= 599;
    }
  }
  Me.HttpError = d;
  function f(R) {
    return R.then((S) => S == null || S.length === 0 ? null : JSON.parse(S));
  }
  class g {
    constructor() {
      this.maxRedirects = 10;
    }
    request(S, w = new s.CancellationToken(), y) {
      O(S);
      const $ = y == null ? void 0 : JSON.stringify(y), x = $ ? Buffer.from($) : void 0;
      if (x != null) {
        a($);
        const { headers: F, ...M } = S;
        S = {
          method: "post",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": x.length,
            ...F
          },
          ...M
        };
      }
      return this.doApiRequest(S, w, (F) => F.end(x));
    }
    doApiRequest(S, w, y, $ = 0) {
      return a.enabled && a(`Request: ${k(S)}`), w.createPromise((x, F, M) => {
        const L = this.createRequest(S, (D) => {
          try {
            this.handleResponse(D, S, w, x, F, $, y);
          } catch (j) {
            F(j);
          }
        });
        this.addErrorAndTimeoutHandlers(L, F, S.timeout), this.addRedirectHandlers(L, S, F, $, (D) => {
          this.doApiRequest(D, w, y, $).then(x).catch(F);
        }), y(L, F), M(() => L.abort());
      });
    }
    // noinspection JSUnusedLocalSymbols
    // eslint-disable-next-line
    addRedirectHandlers(S, w, y, $, x) {
    }
    addErrorAndTimeoutHandlers(S, w, y = 60 * 1e3) {
      this.addTimeOutHandler(S, w, y), S.on("error", w), S.on("aborted", () => {
        w(new Error("Request has been aborted by the server"));
      });
    }
    handleResponse(S, w, y, $, x, F, M) {
      var L;
      if (a.enabled && a(`Response: ${S.statusCode} ${S.statusMessage}, request options: ${k(w)}`), S.statusCode === 404) {
        x(u(S, `method: ${w.method || "GET"} url: ${w.protocol || "https:"}//${w.hostname}${w.port ? `:${w.port}` : ""}${w.path}

Please double check that your authentication token is correct. Due to security reasons, actual status maybe not reported, but 404.
`));
        return;
      } else if (S.statusCode === 204) {
        $();
        return;
      }
      const D = (L = S.statusCode) !== null && L !== void 0 ? L : 0, j = D >= 300 && D < 400, C = b(S, "location");
      if (j && C != null) {
        if (F > this.maxRedirects) {
          x(this.createMaxRedirectError());
          return;
        }
        this.doApiRequest(g.prepareRedirectUrlOptions(C, w), y, M, F).then($).catch(x);
        return;
      }
      S.setEncoding("utf8");
      let Q = "";
      S.on("error", x), S.on("data", (V) => Q += V), S.on("end", () => {
        try {
          if (S.statusCode != null && S.statusCode >= 400) {
            const V = b(S, "content-type"), ne = V != null && (Array.isArray(V) ? V.find((fe) => fe.includes("json")) != null : V.includes("json"));
            x(u(S, `method: ${w.method || "GET"} url: ${w.protocol || "https:"}//${w.hostname}${w.port ? `:${w.port}` : ""}${w.path}

          Data:
          ${ne ? JSON.stringify(JSON.parse(Q)) : Q}
          `));
          } else
            $(Q.length === 0 ? null : Q);
        } catch (V) {
          x(V);
        }
      });
    }
    async downloadToBuffer(S, w) {
      return await w.cancellationToken.createPromise((y, $, x) => {
        const F = [], M = {
          headers: w.headers || void 0,
          // because PrivateGitHubProvider requires HttpExecutor.prepareRedirectUrlOptions logic, so, we need to redirect manually
          redirect: "manual"
        };
        T(S, M), O(M), this.doDownload(M, {
          destination: null,
          options: w,
          onCancel: x,
          callback: (L) => {
            L == null ? y(Buffer.concat(F)) : $(L);
          },
          responseHandler: (L, D) => {
            let j = 0;
            L.on("data", (C) => {
              if (j += C.length, j > 524288e3) {
                D(new Error("Maximum allowed size is 500 MB"));
                return;
              }
              F.push(C);
            }), L.on("end", () => {
              D(null);
            });
          }
        }, 0);
      });
    }
    doDownload(S, w, y) {
      const $ = this.createRequest(S, (x) => {
        if (x.statusCode >= 400) {
          w.callback(new Error(`Cannot download "${S.protocol || "https:"}//${S.hostname}${S.path}", status ${x.statusCode}: ${x.statusMessage}`));
          return;
        }
        x.on("error", w.callback);
        const F = b(x, "location");
        if (F != null) {
          y < this.maxRedirects ? this.doDownload(g.prepareRedirectUrlOptions(F, S), w, y++) : w.callback(this.createMaxRedirectError());
          return;
        }
        w.responseHandler == null ? N(w, x) : w.responseHandler(x, w.callback);
      });
      this.addErrorAndTimeoutHandlers($, w.callback, S.timeout), this.addRedirectHandlers($, S, w.callback, y, (x) => {
        this.doDownload(x, w, y++);
      }), $.end();
    }
    createMaxRedirectError() {
      return new Error(`Too many redirects (> ${this.maxRedirects})`);
    }
    addTimeOutHandler(S, w, y) {
      S.on("socket", ($) => {
        $.setTimeout(y, () => {
          S.abort(), w(new Error("Request timed out"));
        });
      });
    }
    static prepareRedirectUrlOptions(S, w) {
      const y = m(S, { ...w }), $ = y.headers;
      if ($?.authorization) {
        const x = new o.URL(S);
        (x.hostname.endsWith(".amazonaws.com") || x.searchParams.has("X-Amz-Credential")) && delete $.authorization;
      }
      return y;
    }
    static retryOnServerError(S, w = 3) {
      for (let y = 0; ; y++)
        try {
          return S();
        } catch ($) {
          if (y < w && ($ instanceof d && $.isServerError() || $.code === "EPIPE"))
            continue;
          throw $;
        }
    }
  }
  Me.HttpExecutor = g;
  function m(R, S) {
    const w = O(S);
    return T(new o.URL(R), w), w;
  }
  function T(R, S) {
    S.protocol = R.protocol, S.hostname = R.hostname, R.port ? S.port = R.port : S.port && delete S.port, S.path = R.pathname + R.search;
  }
  class p extends i.Transform {
    // noinspection JSUnusedGlobalSymbols
    get actual() {
      return this._actual;
    }
    constructor(S, w = "sha512", y = "base64") {
      super(), this.expected = S, this.algorithm = w, this.encoding = y, this._actual = null, this.isValidateOnEnd = !0, this.digester = (0, e.createHash)(w);
    }
    // noinspection JSUnusedGlobalSymbols
    _transform(S, w, y) {
      this.digester.update(S), y(null, S);
    }
    // noinspection JSUnusedGlobalSymbols
    _flush(S) {
      if (this._actual = this.digester.digest(this.encoding), this.isValidateOnEnd)
        try {
          this.validate();
        } catch (w) {
          S(w);
          return;
        }
      S(null);
    }
    validate() {
      if (this._actual == null)
        throw (0, t.newError)("Not finished yet", "ERR_STREAM_NOT_FINISHED");
      if (this._actual !== this.expected)
        throw (0, t.newError)(`${this.algorithm} checksum mismatch, expected ${this.expected}, got ${this._actual}`, "ERR_CHECKSUM_MISMATCH");
      return null;
    }
  }
  Me.DigestTransform = p;
  function v(R, S, w) {
    return R != null && S != null && R !== S ? (w(new Error(`checksum mismatch: expected ${S} but got ${R} (X-Checksum-Sha2 header)`)), !1) : !0;
  }
  function b(R, S) {
    const w = R.headers[S];
    return w == null ? null : Array.isArray(w) ? w.length === 0 ? null : w[w.length - 1] : w;
  }
  function N(R, S) {
    if (!v(b(S, "X-Checksum-Sha2"), R.options.sha2, R.callback))
      return;
    const w = [];
    if (R.options.onProgress != null) {
      const F = b(S, "content-length");
      F != null && w.push(new l.ProgressCallbackTransform(parseInt(F, 10), R.options.cancellationToken, R.options.onProgress));
    }
    const y = R.options.sha512;
    y != null ? w.push(new p(y, "sha512", y.length === 128 && !y.includes("+") && !y.includes("Z") && !y.includes("=") ? "hex" : "base64")) : R.options.sha2 != null && w.push(new p(R.options.sha2, "sha256", "hex"));
    const $ = (0, r.createWriteStream)(R.destination);
    w.push($);
    let x = S;
    for (const F of w)
      F.on("error", (M) => {
        $.close(), R.options.cancellationToken.cancelled || R.callback(M);
      }), x = x.pipe(F);
    $.on("finish", () => {
      $.close(R.callback);
    });
  }
  function O(R, S, w) {
    w != null && (R.method = w), R.headers = { ...R.headers };
    const y = R.headers;
    return S != null && (y.authorization = S.startsWith("Basic") || S.startsWith("Bearer") ? S : `token ${S}`), y["User-Agent"] == null && (y["User-Agent"] = "electron-builder"), (w == null || w === "GET" || y["Cache-Control"] == null) && (y["Cache-Control"] = "no-cache"), R.protocol == null && process.versions.electron != null && (R.protocol = "https:"), R;
  }
  function k(R, S) {
    return JSON.stringify(R, (w, y) => w.endsWith("Authorization") || w.endsWith("authorization") || w.endsWith("Password") || w.endsWith("PASSWORD") || w.endsWith("Token") || w.includes("password") || w.includes("token") || S != null && S.has(w) ? "<stripped sensitive data>" : y, 2);
  }
  return Me;
}
var nr = {}, Na;
function Nh() {
  if (Na) return nr;
  Na = 1, Object.defineProperty(nr, "__esModule", { value: !0 }), nr.MemoLazy = void 0;
  let e = class {
    constructor(i, o) {
      this.selector = i, this.creator = o, this.selected = void 0, this._value = void 0;
    }
    get hasValue() {
      return this._value !== void 0;
    }
    get value() {
      const i = this.selector();
      if (this._value !== void 0 && n(this.selected, i))
        return this._value;
      this.selected = i;
      const o = this.creator(i);
      return this.value = o, o;
    }
    set value(i) {
      this._value = i;
    }
  };
  nr.MemoLazy = e;
  function n(r, i) {
    if (typeof r == "object" && r !== null && (typeof i == "object" && i !== null)) {
      const t = Object.keys(r), l = Object.keys(i);
      return t.length === l.length && t.every((a) => n(r[a], i[a]));
    }
    return r === i;
  }
  return nr;
}
var ir = {}, Oa;
function Oh() {
  if (Oa) return ir;
  Oa = 1, Object.defineProperty(ir, "__esModule", { value: !0 }), ir.githubUrl = e, ir.getS3LikeProviderBaseUrl = n;
  function e(s, t = "github.com") {
    return `${s.protocol || "https"}://${s.host || t}`;
  }
  function n(s) {
    const t = s.provider;
    if (t === "s3")
      return r(s);
    if (t === "spaces")
      return o(s);
    throw new Error(`Not supported provider: ${t}`);
  }
  function r(s) {
    let t;
    if (s.accelerate == !0)
      t = `https://${s.bucket}.s3-accelerate.amazonaws.com`;
    else if (s.endpoint != null)
      t = `${s.endpoint}/${s.bucket}`;
    else if (s.bucket.includes(".")) {
      if (s.region == null)
        throw new Error(`Bucket name "${s.bucket}" includes a dot, but S3 region is missing`);
      s.region === "us-east-1" ? t = `https://s3.amazonaws.com/${s.bucket}` : t = `https://s3-${s.region}.amazonaws.com/${s.bucket}`;
    } else s.region === "cn-north-1" ? t = `https://${s.bucket}.s3.${s.region}.amazonaws.com.cn` : t = `https://${s.bucket}.s3.amazonaws.com`;
    return i(t, s.path);
  }
  function i(s, t) {
    return t != null && t.length > 0 && (t.startsWith("/") || (s += "/"), s += t), s;
  }
  function o(s) {
    if (s.name == null)
      throw new Error("name is missing");
    if (s.region == null)
      throw new Error("region is missing");
    return i(`https://${s.name}.${s.region}.digitaloceanspaces.com`, s.path);
  }
  return ir;
}
var Xr = {}, Ca;
function Ch() {
  if (Ca) return Xr;
  Ca = 1, Object.defineProperty(Xr, "__esModule", { value: !0 }), Xr.retry = n;
  const e = eo();
  async function n(r, i, o, s = 0, t = 0, l) {
    var a;
    const u = new e.CancellationToken();
    try {
      return await r();
    } catch (c) {
      if ((!((a = l?.(c)) !== null && a !== void 0) || a) && i > 0 && !u.cancelled)
        return await new Promise((d) => setTimeout(d, o + s * t)), await n(r, i - 1, o, s, t + 1, l);
      throw c;
    }
  }
  return Xr;
}
var Gr = {}, La;
function Lh() {
  if (La) return Gr;
  La = 1, Object.defineProperty(Gr, "__esModule", { value: !0 }), Gr.parseDn = e;
  function e(n) {
    let r = !1, i = null, o = "", s = 0;
    n = n.trim();
    const t = /* @__PURE__ */ new Map();
    for (let l = 0; l <= n.length; l++) {
      if (l === n.length) {
        i !== null && t.set(i, o);
        break;
      }
      const a = n[l];
      if (r) {
        if (a === '"') {
          r = !1;
          continue;
        }
      } else {
        if (a === '"') {
          r = !0;
          continue;
        }
        if (a === "\\") {
          l++;
          const u = parseInt(n.slice(l, l + 2), 16);
          Number.isNaN(u) ? o += n[l] : (l++, o += String.fromCharCode(u));
          continue;
        }
        if (i === null && a === "=") {
          i = o, o = "";
          continue;
        }
        if (a === "," || a === ";" || a === "+") {
          i !== null && t.set(i, o), i = null, o = "";
          continue;
        }
      }
      if (a === " " && !r) {
        if (o.length === 0)
          continue;
        if (l > s) {
          let u = l;
          for (; n[u] === " "; )
            u++;
          s = u;
        }
        if (s >= n.length || n[s] === "," || n[s] === ";" || i === null && n[s] === "=" || i !== null && n[s] === "+") {
          l = s - 1;
          continue;
        }
      }
      o += a;
    }
    return t;
  }
  return Gr;
}
var Pt = {}, Pa;
function Ph() {
  if (Pa) return Pt;
  Pa = 1, Object.defineProperty(Pt, "__esModule", { value: !0 }), Pt.nil = Pt.UUID = void 0;
  const e = Je, n = rn(), r = "options.name must be either a string or a Buffer", i = (0, e.randomBytes)(16);
  i[0] = i[0] | 1;
  const o = {}, s = [];
  for (let d = 0; d < 256; d++) {
    const f = (d + 256).toString(16).substr(1);
    o[f] = d, s[d] = f;
  }
  class t {
    constructor(f) {
      this.ascii = null, this.binary = null;
      const g = t.check(f);
      if (!g)
        throw new Error("not a UUID");
      this.version = g.version, g.format === "ascii" ? this.ascii = f : this.binary = f;
    }
    static v5(f, g) {
      return u(f, "sha1", 80, g);
    }
    toString() {
      return this.ascii == null && (this.ascii = c(this.binary)), this.ascii;
    }
    inspect() {
      return `UUID v${this.version} ${this.toString()}`;
    }
    static check(f, g = 0) {
      if (typeof f == "string")
        return f = f.toLowerCase(), /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-([a-f0-9]{12})$/.test(f) ? f === "00000000-0000-0000-0000-000000000000" ? { version: void 0, variant: "nil", format: "ascii" } : {
          version: (o[f[14] + f[15]] & 240) >> 4,
          variant: l((o[f[19] + f[20]] & 224) >> 5),
          format: "ascii"
        } : !1;
      if (Buffer.isBuffer(f)) {
        if (f.length < g + 16)
          return !1;
        let m = 0;
        for (; m < 16 && f[g + m] === 0; m++)
          ;
        return m === 16 ? { version: void 0, variant: "nil", format: "binary" } : {
          version: (f[g + 6] & 240) >> 4,
          variant: l((f[g + 8] & 224) >> 5),
          format: "binary"
        };
      }
      throw (0, n.newError)("Unknown type of uuid", "ERR_UNKNOWN_UUID_TYPE");
    }
    // read stringified uuid into a Buffer
    static parse(f) {
      const g = Buffer.allocUnsafe(16);
      let m = 0;
      for (let T = 0; T < 16; T++)
        g[T] = o[f[m++] + f[m++]], (T === 3 || T === 5 || T === 7 || T === 9) && (m += 1);
      return g;
    }
  }
  Pt.UUID = t, t.OID = t.parse("6ba7b812-9dad-11d1-80b4-00c04fd430c8");
  function l(d) {
    switch (d) {
      case 0:
      case 1:
      case 3:
        return "ncs";
      case 4:
      case 5:
        return "rfc4122";
      case 6:
        return "microsoft";
      default:
        return "future";
    }
  }
  var a;
  (function(d) {
    d[d.ASCII = 0] = "ASCII", d[d.BINARY = 1] = "BINARY", d[d.OBJECT = 2] = "OBJECT";
  })(a || (a = {}));
  function u(d, f, g, m, T = a.ASCII) {
    const p = (0, e.createHash)(f);
    if (typeof d != "string" && !Buffer.isBuffer(d))
      throw (0, n.newError)(r, "ERR_INVALID_UUID_NAME");
    p.update(m), p.update(d);
    const b = p.digest();
    let N;
    switch (T) {
      case a.BINARY:
        b[6] = b[6] & 15 | g, b[8] = b[8] & 63 | 128, N = b;
        break;
      case a.OBJECT:
        b[6] = b[6] & 15 | g, b[8] = b[8] & 63 | 128, N = new t(b);
        break;
      default:
        N = s[b[0]] + s[b[1]] + s[b[2]] + s[b[3]] + "-" + s[b[4]] + s[b[5]] + "-" + s[b[6] & 15 | g] + s[b[7]] + "-" + s[b[8] & 63 | 128] + s[b[9]] + "-" + s[b[10]] + s[b[11]] + s[b[12]] + s[b[13]] + s[b[14]] + s[b[15]];
        break;
    }
    return N;
  }
  function c(d) {
    return s[d[0]] + s[d[1]] + s[d[2]] + s[d[3]] + "-" + s[d[4]] + s[d[5]] + "-" + s[d[6]] + s[d[7]] + "-" + s[d[8]] + s[d[9]] + "-" + s[d[10]] + s[d[11]] + s[d[12]] + s[d[13]] + s[d[14]] + s[d[15]];
  }
  return Pt.nil = new t("00000000-0000-0000-0000-000000000000"), Pt;
}
var Bt = {}, ii = {}, Da;
function Dh() {
  return Da || (Da = 1, (function(e) {
    (function(n) {
      n.parser = function(A, E) {
        return new i(A, E);
      }, n.SAXParser = i, n.SAXStream = c, n.createStream = u, n.MAX_BUFFER_LENGTH = 64 * 1024;
      var r = [
        "comment",
        "sgmlDecl",
        "textNode",
        "tagName",
        "doctype",
        "procInstName",
        "procInstBody",
        "entity",
        "attribName",
        "attribValue",
        "cdata",
        "script"
      ];
      n.EVENTS = [
        "text",
        "processinginstruction",
        "sgmldeclaration",
        "doctype",
        "comment",
        "opentagstart",
        "attribute",
        "opentag",
        "closetag",
        "opencdata",
        "cdata",
        "closecdata",
        "error",
        "end",
        "ready",
        "script",
        "opennamespace",
        "closenamespace"
      ];
      function i(A, E) {
        if (!(this instanceof i))
          return new i(A, E);
        var H = this;
        s(H), H.q = H.c = "", H.bufferCheckPosition = n.MAX_BUFFER_LENGTH, H.opt = E || {}, H.opt.lowercase = H.opt.lowercase || H.opt.lowercasetags, H.looseCase = H.opt.lowercase ? "toLowerCase" : "toUpperCase", H.tags = [], H.closed = H.closedRoot = H.sawRoot = !1, H.tag = H.error = null, H.strict = !!A, H.noscript = !!(A || H.opt.noscript), H.state = y.BEGIN, H.strictEntities = H.opt.strictEntities, H.ENTITIES = H.strictEntities ? Object.create(n.XML_ENTITIES) : Object.create(n.ENTITIES), H.attribList = [], H.opt.xmlns && (H.ns = Object.create(T)), H.opt.unquotedAttributeValues === void 0 && (H.opt.unquotedAttributeValues = !A), H.trackPosition = H.opt.position !== !1, H.trackPosition && (H.position = H.line = H.column = 0), x(H, "onready");
      }
      Object.create || (Object.create = function(A) {
        function E() {
        }
        E.prototype = A;
        var H = new E();
        return H;
      }), Object.keys || (Object.keys = function(A) {
        var E = [];
        for (var H in A) A.hasOwnProperty(H) && E.push(H);
        return E;
      });
      function o(A) {
        for (var E = Math.max(n.MAX_BUFFER_LENGTH, 10), H = 0, P = 0, ue = r.length; P < ue; P++) {
          var he = A[r[P]].length;
          if (he > E)
            switch (r[P]) {
              case "textNode":
                M(A);
                break;
              case "cdata":
                F(A, "oncdata", A.cdata), A.cdata = "";
                break;
              case "script":
                F(A, "onscript", A.script), A.script = "";
                break;
              default:
                D(A, "Max buffer length exceeded: " + r[P]);
            }
          H = Math.max(H, he);
        }
        var pe = n.MAX_BUFFER_LENGTH - H;
        A.bufferCheckPosition = pe + A.position;
      }
      function s(A) {
        for (var E = 0, H = r.length; E < H; E++)
          A[r[E]] = "";
      }
      function t(A) {
        M(A), A.cdata !== "" && (F(A, "oncdata", A.cdata), A.cdata = ""), A.script !== "" && (F(A, "onscript", A.script), A.script = "");
      }
      i.prototype = {
        end: function() {
          j(this);
        },
        write: Ee,
        resume: function() {
          return this.error = null, this;
        },
        close: function() {
          return this.write(null);
        },
        flush: function() {
          t(this);
        }
      };
      var l;
      try {
        l = require("stream").Stream;
      } catch {
        l = function() {
        };
      }
      l || (l = function() {
      });
      var a = n.EVENTS.filter(function(A) {
        return A !== "error" && A !== "end";
      });
      function u(A, E) {
        return new c(A, E);
      }
      function c(A, E) {
        if (!(this instanceof c))
          return new c(A, E);
        l.apply(this), this._parser = new i(A, E), this.writable = !0, this.readable = !0;
        var H = this;
        this._parser.onend = function() {
          H.emit("end");
        }, this._parser.onerror = function(P) {
          H.emit("error", P), H._parser.error = null;
        }, this._decoder = null, a.forEach(function(P) {
          Object.defineProperty(H, "on" + P, {
            get: function() {
              return H._parser["on" + P];
            },
            set: function(ue) {
              if (!ue)
                return H.removeAllListeners(P), H._parser["on" + P] = ue, ue;
              H.on(P, ue);
            },
            enumerable: !0,
            configurable: !1
          });
        });
      }
      c.prototype = Object.create(l.prototype, {
        constructor: {
          value: c
        }
      }), c.prototype.write = function(A) {
        if (typeof Buffer == "function" && typeof Buffer.isBuffer == "function" && Buffer.isBuffer(A)) {
          if (!this._decoder) {
            var E = lf.StringDecoder;
            this._decoder = new E("utf8");
          }
          A = this._decoder.write(A);
        }
        return this._parser.write(A.toString()), this.emit("data", A), !0;
      }, c.prototype.end = function(A) {
        return A && A.length && this.write(A), this._parser.end(), !0;
      }, c.prototype.on = function(A, E) {
        var H = this;
        return !H._parser["on" + A] && a.indexOf(A) !== -1 && (H._parser["on" + A] = function() {
          var P = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
          P.splice(0, 0, A), H.emit.apply(H, P);
        }), l.prototype.on.call(H, A, E);
      };
      var d = "[CDATA[", f = "DOCTYPE", g = "http://www.w3.org/XML/1998/namespace", m = "http://www.w3.org/2000/xmlns/", T = { xml: g, xmlns: m }, p = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, v = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/, b = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, N = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
      function O(A) {
        return A === " " || A === `
` || A === "\r" || A === "	";
      }
      function k(A) {
        return A === '"' || A === "'";
      }
      function R(A) {
        return A === ">" || O(A);
      }
      function S(A, E) {
        return A.test(E);
      }
      function w(A, E) {
        return !S(A, E);
      }
      var y = 0;
      n.STATE = {
        BEGIN: y++,
        // leading byte order mark or whitespace
        BEGIN_WHITESPACE: y++,
        // leading whitespace
        TEXT: y++,
        // general stuff
        TEXT_ENTITY: y++,
        // &amp and such.
        OPEN_WAKA: y++,
        // <
        SGML_DECL: y++,
        // <!BLARG
        SGML_DECL_QUOTED: y++,
        // <!BLARG foo "bar
        DOCTYPE: y++,
        // <!DOCTYPE
        DOCTYPE_QUOTED: y++,
        // <!DOCTYPE "//blah
        DOCTYPE_DTD: y++,
        // <!DOCTYPE "//blah" [ ...
        DOCTYPE_DTD_QUOTED: y++,
        // <!DOCTYPE "//blah" [ "foo
        COMMENT_STARTING: y++,
        // <!-
        COMMENT: y++,
        // <!--
        COMMENT_ENDING: y++,
        // <!-- blah -
        COMMENT_ENDED: y++,
        // <!-- blah --
        CDATA: y++,
        // <![CDATA[ something
        CDATA_ENDING: y++,
        // ]
        CDATA_ENDING_2: y++,
        // ]]
        PROC_INST: y++,
        // <?hi
        PROC_INST_BODY: y++,
        // <?hi there
        PROC_INST_ENDING: y++,
        // <?hi "there" ?
        OPEN_TAG: y++,
        // <strong
        OPEN_TAG_SLASH: y++,
        // <strong /
        ATTRIB: y++,
        // <a
        ATTRIB_NAME: y++,
        // <a foo
        ATTRIB_NAME_SAW_WHITE: y++,
        // <a foo _
        ATTRIB_VALUE: y++,
        // <a foo=
        ATTRIB_VALUE_QUOTED: y++,
        // <a foo="bar
        ATTRIB_VALUE_CLOSED: y++,
        // <a foo="bar"
        ATTRIB_VALUE_UNQUOTED: y++,
        // <a foo=bar
        ATTRIB_VALUE_ENTITY_Q: y++,
        // <foo bar="&quot;"
        ATTRIB_VALUE_ENTITY_U: y++,
        // <foo bar=&quot
        CLOSE_TAG: y++,
        // </a
        CLOSE_TAG_SAW_WHITE: y++,
        // </a   >
        SCRIPT: y++,
        // <script> ...
        SCRIPT_ENDING: y++
        // <script> ... <
      }, n.XML_ENTITIES = {
        amp: "&",
        gt: ">",
        lt: "<",
        quot: '"',
        apos: "'"
      }, n.ENTITIES = {
        amp: "&",
        gt: ">",
        lt: "<",
        quot: '"',
        apos: "'",
        AElig: 198,
        Aacute: 193,
        Acirc: 194,
        Agrave: 192,
        Aring: 197,
        Atilde: 195,
        Auml: 196,
        Ccedil: 199,
        ETH: 208,
        Eacute: 201,
        Ecirc: 202,
        Egrave: 200,
        Euml: 203,
        Iacute: 205,
        Icirc: 206,
        Igrave: 204,
        Iuml: 207,
        Ntilde: 209,
        Oacute: 211,
        Ocirc: 212,
        Ograve: 210,
        Oslash: 216,
        Otilde: 213,
        Ouml: 214,
        THORN: 222,
        Uacute: 218,
        Ucirc: 219,
        Ugrave: 217,
        Uuml: 220,
        Yacute: 221,
        aacute: 225,
        acirc: 226,
        aelig: 230,
        agrave: 224,
        aring: 229,
        atilde: 227,
        auml: 228,
        ccedil: 231,
        eacute: 233,
        ecirc: 234,
        egrave: 232,
        eth: 240,
        euml: 235,
        iacute: 237,
        icirc: 238,
        igrave: 236,
        iuml: 239,
        ntilde: 241,
        oacute: 243,
        ocirc: 244,
        ograve: 242,
        oslash: 248,
        otilde: 245,
        ouml: 246,
        szlig: 223,
        thorn: 254,
        uacute: 250,
        ucirc: 251,
        ugrave: 249,
        uuml: 252,
        yacute: 253,
        yuml: 255,
        copy: 169,
        reg: 174,
        nbsp: 160,
        iexcl: 161,
        cent: 162,
        pound: 163,
        curren: 164,
        yen: 165,
        brvbar: 166,
        sect: 167,
        uml: 168,
        ordf: 170,
        laquo: 171,
        not: 172,
        shy: 173,
        macr: 175,
        deg: 176,
        plusmn: 177,
        sup1: 185,
        sup2: 178,
        sup3: 179,
        acute: 180,
        micro: 181,
        para: 182,
        middot: 183,
        cedil: 184,
        ordm: 186,
        raquo: 187,
        frac14: 188,
        frac12: 189,
        frac34: 190,
        iquest: 191,
        times: 215,
        divide: 247,
        OElig: 338,
        oelig: 339,
        Scaron: 352,
        scaron: 353,
        Yuml: 376,
        fnof: 402,
        circ: 710,
        tilde: 732,
        Alpha: 913,
        Beta: 914,
        Gamma: 915,
        Delta: 916,
        Epsilon: 917,
        Zeta: 918,
        Eta: 919,
        Theta: 920,
        Iota: 921,
        Kappa: 922,
        Lambda: 923,
        Mu: 924,
        Nu: 925,
        Xi: 926,
        Omicron: 927,
        Pi: 928,
        Rho: 929,
        Sigma: 931,
        Tau: 932,
        Upsilon: 933,
        Phi: 934,
        Chi: 935,
        Psi: 936,
        Omega: 937,
        alpha: 945,
        beta: 946,
        gamma: 947,
        delta: 948,
        epsilon: 949,
        zeta: 950,
        eta: 951,
        theta: 952,
        iota: 953,
        kappa: 954,
        lambda: 955,
        mu: 956,
        nu: 957,
        xi: 958,
        omicron: 959,
        pi: 960,
        rho: 961,
        sigmaf: 962,
        sigma: 963,
        tau: 964,
        upsilon: 965,
        phi: 966,
        chi: 967,
        psi: 968,
        omega: 969,
        thetasym: 977,
        upsih: 978,
        piv: 982,
        ensp: 8194,
        emsp: 8195,
        thinsp: 8201,
        zwnj: 8204,
        zwj: 8205,
        lrm: 8206,
        rlm: 8207,
        ndash: 8211,
        mdash: 8212,
        lsquo: 8216,
        rsquo: 8217,
        sbquo: 8218,
        ldquo: 8220,
        rdquo: 8221,
        bdquo: 8222,
        dagger: 8224,
        Dagger: 8225,
        bull: 8226,
        hellip: 8230,
        permil: 8240,
        prime: 8242,
        Prime: 8243,
        lsaquo: 8249,
        rsaquo: 8250,
        oline: 8254,
        frasl: 8260,
        euro: 8364,
        image: 8465,
        weierp: 8472,
        real: 8476,
        trade: 8482,
        alefsym: 8501,
        larr: 8592,
        uarr: 8593,
        rarr: 8594,
        darr: 8595,
        harr: 8596,
        crarr: 8629,
        lArr: 8656,
        uArr: 8657,
        rArr: 8658,
        dArr: 8659,
        hArr: 8660,
        forall: 8704,
        part: 8706,
        exist: 8707,
        empty: 8709,
        nabla: 8711,
        isin: 8712,
        notin: 8713,
        ni: 8715,
        prod: 8719,
        sum: 8721,
        minus: 8722,
        lowast: 8727,
        radic: 8730,
        prop: 8733,
        infin: 8734,
        ang: 8736,
        and: 8743,
        or: 8744,
        cap: 8745,
        cup: 8746,
        int: 8747,
        there4: 8756,
        sim: 8764,
        cong: 8773,
        asymp: 8776,
        ne: 8800,
        equiv: 8801,
        le: 8804,
        ge: 8805,
        sub: 8834,
        sup: 8835,
        nsub: 8836,
        sube: 8838,
        supe: 8839,
        oplus: 8853,
        otimes: 8855,
        perp: 8869,
        sdot: 8901,
        lceil: 8968,
        rceil: 8969,
        lfloor: 8970,
        rfloor: 8971,
        lang: 9001,
        rang: 9002,
        loz: 9674,
        spades: 9824,
        clubs: 9827,
        hearts: 9829,
        diams: 9830
      }, Object.keys(n.ENTITIES).forEach(function(A) {
        var E = n.ENTITIES[A], H = typeof E == "number" ? String.fromCharCode(E) : E;
        n.ENTITIES[A] = H;
      });
      for (var $ in n.STATE)
        n.STATE[n.STATE[$]] = $;
      y = n.STATE;
      function x(A, E, H) {
        A[E] && A[E](H);
      }
      function F(A, E, H) {
        A.textNode && M(A), x(A, E, H);
      }
      function M(A) {
        A.textNode = L(A.opt, A.textNode), A.textNode && x(A, "ontext", A.textNode), A.textNode = "";
      }
      function L(A, E) {
        return A.trim && (E = E.trim()), A.normalize && (E = E.replace(/\s+/g, " ")), E;
      }
      function D(A, E) {
        return M(A), A.trackPosition && (E += `
Line: ` + A.line + `
Column: ` + A.column + `
Char: ` + A.c), E = new Error(E), A.error = E, x(A, "onerror", E), A;
      }
      function j(A) {
        return A.sawRoot && !A.closedRoot && C(A, "Unclosed root tag"), A.state !== y.BEGIN && A.state !== y.BEGIN_WHITESPACE && A.state !== y.TEXT && D(A, "Unexpected end"), M(A), A.c = "", A.closed = !0, x(A, "onend"), i.call(A, A.strict, A.opt), A;
      }
      function C(A, E) {
        if (typeof A != "object" || !(A instanceof i))
          throw new Error("bad call to strictFail");
        A.strict && D(A, E);
      }
      function Q(A) {
        A.strict || (A.tagName = A.tagName[A.looseCase]());
        var E = A.tags[A.tags.length - 1] || A, H = A.tag = { name: A.tagName, attributes: {} };
        A.opt.xmlns && (H.ns = E.ns), A.attribList.length = 0, F(A, "onopentagstart", H);
      }
      function V(A, E) {
        var H = A.indexOf(":"), P = H < 0 ? ["", A] : A.split(":"), ue = P[0], he = P[1];
        return E && A === "xmlns" && (ue = "xmlns", he = ""), { prefix: ue, local: he };
      }
      function ne(A) {
        if (A.strict || (A.attribName = A.attribName[A.looseCase]()), A.attribList.indexOf(A.attribName) !== -1 || A.tag.attributes.hasOwnProperty(A.attribName)) {
          A.attribName = A.attribValue = "";
          return;
        }
        if (A.opt.xmlns) {
          var E = V(A.attribName, !0), H = E.prefix, P = E.local;
          if (H === "xmlns")
            if (P === "xml" && A.attribValue !== g)
              C(
                A,
                "xml: prefix must be bound to " + g + `
Actual: ` + A.attribValue
              );
            else if (P === "xmlns" && A.attribValue !== m)
              C(
                A,
                "xmlns: prefix must be bound to " + m + `
Actual: ` + A.attribValue
              );
            else {
              var ue = A.tag, he = A.tags[A.tags.length - 1] || A;
              ue.ns === he.ns && (ue.ns = Object.create(he.ns)), ue.ns[P] = A.attribValue;
            }
          A.attribList.push([A.attribName, A.attribValue]);
        } else
          A.tag.attributes[A.attribName] = A.attribValue, F(A, "onattribute", {
            name: A.attribName,
            value: A.attribValue
          });
        A.attribName = A.attribValue = "";
      }
      function fe(A, E) {
        if (A.opt.xmlns) {
          var H = A.tag, P = V(A.tagName);
          H.prefix = P.prefix, H.local = P.local, H.uri = H.ns[P.prefix] || "", H.prefix && !H.uri && (C(
            A,
            "Unbound namespace prefix: " + JSON.stringify(A.tagName)
          ), H.uri = P.prefix);
          var ue = A.tags[A.tags.length - 1] || A;
          H.ns && ue.ns !== H.ns && Object.keys(H.ns).forEach(function(h) {
            F(A, "onopennamespace", {
              prefix: h,
              uri: H.ns[h]
            });
          });
          for (var he = 0, pe = A.attribList.length; he < pe; he++) {
            var we = A.attribList[he], ye = we[0], Ge = we[1], be = V(ye, !0), He = be.prefix, pt = be.local, ut = He === "" ? "" : H.ns[He] || "", ot = {
              name: ye,
              value: Ge,
              prefix: He,
              local: pt,
              uri: ut
            };
            He && He !== "xmlns" && !ut && (C(
              A,
              "Unbound namespace prefix: " + JSON.stringify(He)
            ), ot.uri = He), A.tag.attributes[ye] = ot, F(A, "onattribute", ot);
          }
          A.attribList.length = 0;
        }
        A.tag.isSelfClosing = !!E, A.sawRoot = !0, A.tags.push(A.tag), F(A, "onopentag", A.tag), E || (!A.noscript && A.tagName.toLowerCase() === "script" ? A.state = y.SCRIPT : A.state = y.TEXT, A.tag = null, A.tagName = ""), A.attribName = A.attribValue = "", A.attribList.length = 0;
      }
      function ce(A) {
        if (!A.tagName) {
          C(A, "Weird empty close tag."), A.textNode += "</>", A.state = y.TEXT;
          return;
        }
        if (A.script) {
          if (A.tagName !== "script") {
            A.script += "</" + A.tagName + ">", A.tagName = "", A.state = y.SCRIPT;
            return;
          }
          F(A, "onscript", A.script), A.script = "";
        }
        var E = A.tags.length, H = A.tagName;
        A.strict || (H = H[A.looseCase]());
        for (var P = H; E--; ) {
          var ue = A.tags[E];
          if (ue.name !== P)
            C(A, "Unexpected close tag");
          else
            break;
        }
        if (E < 0) {
          C(A, "Unmatched closing tag: " + A.tagName), A.textNode += "</" + A.tagName + ">", A.state = y.TEXT;
          return;
        }
        A.tagName = H;
        for (var he = A.tags.length; he-- > E; ) {
          var pe = A.tag = A.tags.pop();
          A.tagName = A.tag.name, F(A, "onclosetag", A.tagName);
          var we = {};
          for (var ye in pe.ns)
            we[ye] = pe.ns[ye];
          var Ge = A.tags[A.tags.length - 1] || A;
          A.opt.xmlns && pe.ns !== Ge.ns && Object.keys(pe.ns).forEach(function(be) {
            var He = pe.ns[be];
            F(A, "onclosenamespace", { prefix: be, uri: He });
          });
        }
        E === 0 && (A.closedRoot = !0), A.tagName = A.attribValue = A.attribName = "", A.attribList.length = 0, A.state = y.TEXT;
      }
      function me(A) {
        var E = A.entity, H = E.toLowerCase(), P, ue = "";
        return A.ENTITIES[E] ? A.ENTITIES[E] : A.ENTITIES[H] ? A.ENTITIES[H] : (E = H, E.charAt(0) === "#" && (E.charAt(1) === "x" ? (E = E.slice(2), P = parseInt(E, 16), ue = P.toString(16)) : (E = E.slice(1), P = parseInt(E, 10), ue = P.toString(10))), E = E.replace(/^0+/, ""), isNaN(P) || ue.toLowerCase() !== E || P < 0 || P > 1114111 ? (C(A, "Invalid character entity"), "&" + A.entity + ";") : String.fromCodePoint(P));
      }
      function Te(A, E) {
        E === "<" ? (A.state = y.OPEN_WAKA, A.startTagPosition = A.position) : O(E) || (C(A, "Non-whitespace before first tag."), A.textNode = E, A.state = y.TEXT);
      }
      function K(A, E) {
        var H = "";
        return E < A.length && (H = A.charAt(E)), H;
      }
      function Ee(A) {
        var E = this;
        if (this.error)
          throw this.error;
        if (E.closed)
          return D(
            E,
            "Cannot write after close. Assign an onready handler."
          );
        if (A === null)
          return j(E);
        typeof A == "object" && (A = A.toString());
        for (var H = 0, P = ""; P = K(A, H++), E.c = P, !!P; )
          switch (E.trackPosition && (E.position++, P === `
` ? (E.line++, E.column = 0) : E.column++), E.state) {
            case y.BEGIN:
              if (E.state = y.BEGIN_WHITESPACE, P === "\uFEFF")
                continue;
              Te(E, P);
              continue;
            case y.BEGIN_WHITESPACE:
              Te(E, P);
              continue;
            case y.TEXT:
              if (E.sawRoot && !E.closedRoot) {
                for (var he = H - 1; P && P !== "<" && P !== "&"; )
                  P = K(A, H++), P && E.trackPosition && (E.position++, P === `
` ? (E.line++, E.column = 0) : E.column++);
                E.textNode += A.substring(he, H - 1);
              }
              P === "<" && !(E.sawRoot && E.closedRoot && !E.strict) ? (E.state = y.OPEN_WAKA, E.startTagPosition = E.position) : (!O(P) && (!E.sawRoot || E.closedRoot) && C(E, "Text data outside of root node."), P === "&" ? E.state = y.TEXT_ENTITY : E.textNode += P);
              continue;
            case y.SCRIPT:
              P === "<" ? E.state = y.SCRIPT_ENDING : E.script += P;
              continue;
            case y.SCRIPT_ENDING:
              P === "/" ? E.state = y.CLOSE_TAG : (E.script += "<" + P, E.state = y.SCRIPT);
              continue;
            case y.OPEN_WAKA:
              if (P === "!")
                E.state = y.SGML_DECL, E.sgmlDecl = "";
              else if (!O(P)) if (S(p, P))
                E.state = y.OPEN_TAG, E.tagName = P;
              else if (P === "/")
                E.state = y.CLOSE_TAG, E.tagName = "";
              else if (P === "?")
                E.state = y.PROC_INST, E.procInstName = E.procInstBody = "";
              else {
                if (C(E, "Unencoded <"), E.startTagPosition + 1 < E.position) {
                  var ue = E.position - E.startTagPosition;
                  P = new Array(ue).join(" ") + P;
                }
                E.textNode += "<" + P, E.state = y.TEXT;
              }
              continue;
            case y.SGML_DECL:
              if (E.sgmlDecl + P === "--") {
                E.state = y.COMMENT, E.comment = "", E.sgmlDecl = "";
                continue;
              }
              E.doctype && E.doctype !== !0 && E.sgmlDecl ? (E.state = y.DOCTYPE_DTD, E.doctype += "<!" + E.sgmlDecl + P, E.sgmlDecl = "") : (E.sgmlDecl + P).toUpperCase() === d ? (F(E, "onopencdata"), E.state = y.CDATA, E.sgmlDecl = "", E.cdata = "") : (E.sgmlDecl + P).toUpperCase() === f ? (E.state = y.DOCTYPE, (E.doctype || E.sawRoot) && C(
                E,
                "Inappropriately located doctype declaration"
              ), E.doctype = "", E.sgmlDecl = "") : P === ">" ? (F(E, "onsgmldeclaration", E.sgmlDecl), E.sgmlDecl = "", E.state = y.TEXT) : (k(P) && (E.state = y.SGML_DECL_QUOTED), E.sgmlDecl += P);
              continue;
            case y.SGML_DECL_QUOTED:
              P === E.q && (E.state = y.SGML_DECL, E.q = ""), E.sgmlDecl += P;
              continue;
            case y.DOCTYPE:
              P === ">" ? (E.state = y.TEXT, F(E, "ondoctype", E.doctype), E.doctype = !0) : (E.doctype += P, P === "[" ? E.state = y.DOCTYPE_DTD : k(P) && (E.state = y.DOCTYPE_QUOTED, E.q = P));
              continue;
            case y.DOCTYPE_QUOTED:
              E.doctype += P, P === E.q && (E.q = "", E.state = y.DOCTYPE);
              continue;
            case y.DOCTYPE_DTD:
              P === "]" ? (E.doctype += P, E.state = y.DOCTYPE) : P === "<" ? (E.state = y.OPEN_WAKA, E.startTagPosition = E.position) : k(P) ? (E.doctype += P, E.state = y.DOCTYPE_DTD_QUOTED, E.q = P) : E.doctype += P;
              continue;
            case y.DOCTYPE_DTD_QUOTED:
              E.doctype += P, P === E.q && (E.state = y.DOCTYPE_DTD, E.q = "");
              continue;
            case y.COMMENT:
              P === "-" ? E.state = y.COMMENT_ENDING : E.comment += P;
              continue;
            case y.COMMENT_ENDING:
              P === "-" ? (E.state = y.COMMENT_ENDED, E.comment = L(E.opt, E.comment), E.comment && F(E, "oncomment", E.comment), E.comment = "") : (E.comment += "-" + P, E.state = y.COMMENT);
              continue;
            case y.COMMENT_ENDED:
              P !== ">" ? (C(E, "Malformed comment"), E.comment += "--" + P, E.state = y.COMMENT) : E.doctype && E.doctype !== !0 ? E.state = y.DOCTYPE_DTD : E.state = y.TEXT;
              continue;
            case y.CDATA:
              for (var he = H - 1; P && P !== "]"; )
                P = K(A, H++), P && E.trackPosition && (E.position++, P === `
` ? (E.line++, E.column = 0) : E.column++);
              E.cdata += A.substring(he, H - 1), P === "]" && (E.state = y.CDATA_ENDING);
              continue;
            case y.CDATA_ENDING:
              P === "]" ? E.state = y.CDATA_ENDING_2 : (E.cdata += "]" + P, E.state = y.CDATA);
              continue;
            case y.CDATA_ENDING_2:
              P === ">" ? (E.cdata && F(E, "oncdata", E.cdata), F(E, "onclosecdata"), E.cdata = "", E.state = y.TEXT) : P === "]" ? E.cdata += "]" : (E.cdata += "]]" + P, E.state = y.CDATA);
              continue;
            case y.PROC_INST:
              P === "?" ? E.state = y.PROC_INST_ENDING : O(P) ? E.state = y.PROC_INST_BODY : E.procInstName += P;
              continue;
            case y.PROC_INST_BODY:
              if (!E.procInstBody && O(P))
                continue;
              P === "?" ? E.state = y.PROC_INST_ENDING : E.procInstBody += P;
              continue;
            case y.PROC_INST_ENDING:
              P === ">" ? (F(E, "onprocessinginstruction", {
                name: E.procInstName,
                body: E.procInstBody
              }), E.procInstName = E.procInstBody = "", E.state = y.TEXT) : (E.procInstBody += "?" + P, E.state = y.PROC_INST_BODY);
              continue;
            case y.OPEN_TAG:
              S(v, P) ? E.tagName += P : (Q(E), P === ">" ? fe(E) : P === "/" ? E.state = y.OPEN_TAG_SLASH : (O(P) || C(E, "Invalid character in tag name"), E.state = y.ATTRIB));
              continue;
            case y.OPEN_TAG_SLASH:
              P === ">" ? (fe(E, !0), ce(E)) : (C(
                E,
                "Forward-slash in opening tag not followed by >"
              ), E.state = y.ATTRIB);
              continue;
            case y.ATTRIB:
              if (O(P))
                continue;
              P === ">" ? fe(E) : P === "/" ? E.state = y.OPEN_TAG_SLASH : S(p, P) ? (E.attribName = P, E.attribValue = "", E.state = y.ATTRIB_NAME) : C(E, "Invalid attribute name");
              continue;
            case y.ATTRIB_NAME:
              P === "=" ? E.state = y.ATTRIB_VALUE : P === ">" ? (C(E, "Attribute without value"), E.attribValue = E.attribName, ne(E), fe(E)) : O(P) ? E.state = y.ATTRIB_NAME_SAW_WHITE : S(v, P) ? E.attribName += P : C(E, "Invalid attribute name");
              continue;
            case y.ATTRIB_NAME_SAW_WHITE:
              if (P === "=")
                E.state = y.ATTRIB_VALUE;
              else {
                if (O(P))
                  continue;
                C(E, "Attribute without value"), E.tag.attributes[E.attribName] = "", E.attribValue = "", F(E, "onattribute", {
                  name: E.attribName,
                  value: ""
                }), E.attribName = "", P === ">" ? fe(E) : S(p, P) ? (E.attribName = P, E.state = y.ATTRIB_NAME) : (C(E, "Invalid attribute name"), E.state = y.ATTRIB);
              }
              continue;
            case y.ATTRIB_VALUE:
              if (O(P))
                continue;
              k(P) ? (E.q = P, E.state = y.ATTRIB_VALUE_QUOTED) : (E.opt.unquotedAttributeValues || D(E, "Unquoted attribute value"), E.state = y.ATTRIB_VALUE_UNQUOTED, E.attribValue = P);
              continue;
            case y.ATTRIB_VALUE_QUOTED:
              if (P !== E.q) {
                P === "&" ? E.state = y.ATTRIB_VALUE_ENTITY_Q : E.attribValue += P;
                continue;
              }
              ne(E), E.q = "", E.state = y.ATTRIB_VALUE_CLOSED;
              continue;
            case y.ATTRIB_VALUE_CLOSED:
              O(P) ? E.state = y.ATTRIB : P === ">" ? fe(E) : P === "/" ? E.state = y.OPEN_TAG_SLASH : S(p, P) ? (C(E, "No whitespace between attributes"), E.attribName = P, E.attribValue = "", E.state = y.ATTRIB_NAME) : C(E, "Invalid attribute name");
              continue;
            case y.ATTRIB_VALUE_UNQUOTED:
              if (!R(P)) {
                P === "&" ? E.state = y.ATTRIB_VALUE_ENTITY_U : E.attribValue += P;
                continue;
              }
              ne(E), P === ">" ? fe(E) : E.state = y.ATTRIB;
              continue;
            case y.CLOSE_TAG:
              if (E.tagName)
                P === ">" ? ce(E) : S(v, P) ? E.tagName += P : E.script ? (E.script += "</" + E.tagName, E.tagName = "", E.state = y.SCRIPT) : (O(P) || C(E, "Invalid tagname in closing tag"), E.state = y.CLOSE_TAG_SAW_WHITE);
              else {
                if (O(P))
                  continue;
                w(p, P) ? E.script ? (E.script += "</" + P, E.state = y.SCRIPT) : C(E, "Invalid tagname in closing tag.") : E.tagName = P;
              }
              continue;
            case y.CLOSE_TAG_SAW_WHITE:
              if (O(P))
                continue;
              P === ">" ? ce(E) : C(E, "Invalid characters in closing tag");
              continue;
            case y.TEXT_ENTITY:
            case y.ATTRIB_VALUE_ENTITY_Q:
            case y.ATTRIB_VALUE_ENTITY_U:
              var pe, we;
              switch (E.state) {
                case y.TEXT_ENTITY:
                  pe = y.TEXT, we = "textNode";
                  break;
                case y.ATTRIB_VALUE_ENTITY_Q:
                  pe = y.ATTRIB_VALUE_QUOTED, we = "attribValue";
                  break;
                case y.ATTRIB_VALUE_ENTITY_U:
                  pe = y.ATTRIB_VALUE_UNQUOTED, we = "attribValue";
                  break;
              }
              if (P === ";") {
                var ye = me(E);
                E.opt.unparsedEntities && !Object.values(n.XML_ENTITIES).includes(ye) ? (E.entity = "", E.state = pe, E.write(ye)) : (E[we] += ye, E.entity = "", E.state = pe);
              } else S(E.entity.length ? N : b, P) ? E.entity += P : (C(E, "Invalid character in entity name"), E[we] += "&" + E.entity + P, E.entity = "", E.state = pe);
              continue;
            default:
              throw new Error(E, "Unknown state: " + E.state);
          }
        return E.position >= E.bufferCheckPosition && o(E), E;
      }
      String.fromCodePoint || (function() {
        var A = String.fromCharCode, E = Math.floor, H = function() {
          var P = 16384, ue = [], he, pe, we = -1, ye = arguments.length;
          if (!ye)
            return "";
          for (var Ge = ""; ++we < ye; ) {
            var be = Number(arguments[we]);
            if (!isFinite(be) || // `NaN`, `+Infinity`, or `-Infinity`
            be < 0 || // not a valid Unicode code point
            be > 1114111 || // not a valid Unicode code point
            E(be) !== be)
              throw RangeError("Invalid code point: " + be);
            be <= 65535 ? ue.push(be) : (be -= 65536, he = (be >> 10) + 55296, pe = be % 1024 + 56320, ue.push(he, pe)), (we + 1 === ye || ue.length > P) && (Ge += A.apply(null, ue), ue.length = 0);
          }
          return Ge;
        };
        Object.defineProperty ? Object.defineProperty(String, "fromCodePoint", {
          value: H,
          configurable: !0,
          writable: !0
        }) : String.fromCodePoint = H;
      })();
    })(e);
  })(ii)), ii;
}
var Ua;
function Uh() {
  if (Ua) return Bt;
  Ua = 1, Object.defineProperty(Bt, "__esModule", { value: !0 }), Bt.XElement = void 0, Bt.parseXml = t;
  const e = Dh(), n = rn();
  class r {
    constructor(a) {
      if (this.name = a, this.value = "", this.attributes = null, this.isCData = !1, this.elements = null, !a)
        throw (0, n.newError)("Element name cannot be empty", "ERR_XML_ELEMENT_NAME_EMPTY");
      if (!o(a))
        throw (0, n.newError)(`Invalid element name: ${a}`, "ERR_XML_ELEMENT_INVALID_NAME");
    }
    attribute(a) {
      const u = this.attributes === null ? null : this.attributes[a];
      if (u == null)
        throw (0, n.newError)(`No attribute "${a}"`, "ERR_XML_MISSED_ATTRIBUTE");
      return u;
    }
    removeAttribute(a) {
      this.attributes !== null && delete this.attributes[a];
    }
    element(a, u = !1, c = null) {
      const d = this.elementOrNull(a, u);
      if (d === null)
        throw (0, n.newError)(c || `No element "${a}"`, "ERR_XML_MISSED_ELEMENT");
      return d;
    }
    elementOrNull(a, u = !1) {
      if (this.elements === null)
        return null;
      for (const c of this.elements)
        if (s(c, a, u))
          return c;
      return null;
    }
    getElements(a, u = !1) {
      return this.elements === null ? [] : this.elements.filter((c) => s(c, a, u));
    }
    elementValueOrEmpty(a, u = !1) {
      const c = this.elementOrNull(a, u);
      return c === null ? "" : c.value;
    }
  }
  Bt.XElement = r;
  const i = new RegExp(/^[A-Za-z_][:A-Za-z0-9_-]*$/i);
  function o(l) {
    return i.test(l);
  }
  function s(l, a, u) {
    const c = l.name;
    return c === a || u === !0 && c.length === a.length && c.toLowerCase() === a.toLowerCase();
  }
  function t(l) {
    let a = null;
    const u = e.parser(!0, {}), c = [];
    return u.onopentag = (d) => {
      const f = new r(d.name);
      if (f.attributes = d.attributes, a === null)
        a = f;
      else {
        const g = c[c.length - 1];
        g.elements == null && (g.elements = []), g.elements.push(f);
      }
      c.push(f);
    }, u.onclosetag = () => {
      c.pop();
    }, u.ontext = (d) => {
      c.length > 0 && (c[c.length - 1].value = d);
    }, u.oncdata = (d) => {
      const f = c[c.length - 1];
      f.value = d, f.isCData = !0;
    }, u.onerror = (d) => {
      throw d;
    }, u.write(l), a;
  }
  return Bt;
}
var Fa;
function qe() {
  return Fa || (Fa = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.CURRENT_APP_PACKAGE_FILE_NAME = e.CURRENT_APP_INSTALLER_FILE_NAME = e.XElement = e.parseXml = e.UUID = e.parseDn = e.retry = e.githubUrl = e.getS3LikeProviderBaseUrl = e.ProgressCallbackTransform = e.MemoLazy = e.safeStringifyJson = e.safeGetHeader = e.parseJson = e.HttpExecutor = e.HttpError = e.DigestTransform = e.createHttpError = e.configureRequestUrl = e.configureRequestOptionsFromUrl = e.configureRequestOptions = e.newError = e.CancellationToken = e.CancellationError = void 0, e.asArray = d;
    var n = eo();
    Object.defineProperty(e, "CancellationError", { enumerable: !0, get: function() {
      return n.CancellationError;
    } }), Object.defineProperty(e, "CancellationToken", { enumerable: !0, get: function() {
      return n.CancellationToken;
    } });
    var r = rn();
    Object.defineProperty(e, "newError", { enumerable: !0, get: function() {
      return r.newError;
    } });
    var i = Ih();
    Object.defineProperty(e, "configureRequestOptions", { enumerable: !0, get: function() {
      return i.configureRequestOptions;
    } }), Object.defineProperty(e, "configureRequestOptionsFromUrl", { enumerable: !0, get: function() {
      return i.configureRequestOptionsFromUrl;
    } }), Object.defineProperty(e, "configureRequestUrl", { enumerable: !0, get: function() {
      return i.configureRequestUrl;
    } }), Object.defineProperty(e, "createHttpError", { enumerable: !0, get: function() {
      return i.createHttpError;
    } }), Object.defineProperty(e, "DigestTransform", { enumerable: !0, get: function() {
      return i.DigestTransform;
    } }), Object.defineProperty(e, "HttpError", { enumerable: !0, get: function() {
      return i.HttpError;
    } }), Object.defineProperty(e, "HttpExecutor", { enumerable: !0, get: function() {
      return i.HttpExecutor;
    } }), Object.defineProperty(e, "parseJson", { enumerable: !0, get: function() {
      return i.parseJson;
    } }), Object.defineProperty(e, "safeGetHeader", { enumerable: !0, get: function() {
      return i.safeGetHeader;
    } }), Object.defineProperty(e, "safeStringifyJson", { enumerable: !0, get: function() {
      return i.safeStringifyJson;
    } });
    var o = Nh();
    Object.defineProperty(e, "MemoLazy", { enumerable: !0, get: function() {
      return o.MemoLazy;
    } });
    var s = bc();
    Object.defineProperty(e, "ProgressCallbackTransform", { enumerable: !0, get: function() {
      return s.ProgressCallbackTransform;
    } });
    var t = Oh();
    Object.defineProperty(e, "getS3LikeProviderBaseUrl", { enumerable: !0, get: function() {
      return t.getS3LikeProviderBaseUrl;
    } }), Object.defineProperty(e, "githubUrl", { enumerable: !0, get: function() {
      return t.githubUrl;
    } });
    var l = Ch();
    Object.defineProperty(e, "retry", { enumerable: !0, get: function() {
      return l.retry;
    } });
    var a = Lh();
    Object.defineProperty(e, "parseDn", { enumerable: !0, get: function() {
      return a.parseDn;
    } });
    var u = Ph();
    Object.defineProperty(e, "UUID", { enumerable: !0, get: function() {
      return u.UUID;
    } });
    var c = Uh();
    Object.defineProperty(e, "parseXml", { enumerable: !0, get: function() {
      return c.parseXml;
    } }), Object.defineProperty(e, "XElement", { enumerable: !0, get: function() {
      return c.XElement;
    } }), e.CURRENT_APP_INSTALLER_FILE_NAME = "installer.exe", e.CURRENT_APP_PACKAGE_FILE_NAME = "package.7z";
    function d(f) {
      return f == null ? [] : Array.isArray(f) ? f : [f];
    }
  })(Zn)), Zn;
}
var Be = {}, Wr = {}, Tt = {}, xa;
function Ir() {
  if (xa) return Tt;
  xa = 1;
  function e(t) {
    return typeof t > "u" || t === null;
  }
  function n(t) {
    return typeof t == "object" && t !== null;
  }
  function r(t) {
    return Array.isArray(t) ? t : e(t) ? [] : [t];
  }
  function i(t, l) {
    var a, u, c, d;
    if (l)
      for (d = Object.keys(l), a = 0, u = d.length; a < u; a += 1)
        c = d[a], t[c] = l[c];
    return t;
  }
  function o(t, l) {
    var a = "", u;
    for (u = 0; u < l; u += 1)
      a += t;
    return a;
  }
  function s(t) {
    return t === 0 && Number.NEGATIVE_INFINITY === 1 / t;
  }
  return Tt.isNothing = e, Tt.isObject = n, Tt.toArray = r, Tt.repeat = o, Tt.isNegativeZero = s, Tt.extend = i, Tt;
}
var si, ka;
function Nr() {
  if (ka) return si;
  ka = 1;
  function e(r, i) {
    var o = "", s = r.reason || "(unknown reason)";
    return r.mark ? (r.mark.name && (o += 'in "' + r.mark.name + '" '), o += "(" + (r.mark.line + 1) + ":" + (r.mark.column + 1) + ")", !i && r.mark.snippet && (o += `

` + r.mark.snippet), s + " " + o) : s;
  }
  function n(r, i) {
    Error.call(this), this.name = "YAMLException", this.reason = r, this.mark = i, this.message = e(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack || "";
  }
  return n.prototype = Object.create(Error.prototype), n.prototype.constructor = n, n.prototype.toString = function(i) {
    return this.name + ": " + e(this, i);
  }, si = n, si;
}
var oi, qa;
function Fh() {
  if (qa) return oi;
  qa = 1;
  var e = Ir();
  function n(o, s, t, l, a) {
    var u = "", c = "", d = Math.floor(a / 2) - 1;
    return l - s > d && (u = " ... ", s = l - d + u.length), t - l > d && (c = " ...", t = l + d - c.length), {
      str: u + o.slice(s, t).replace(/\t/g, "→") + c,
      pos: l - s + u.length
      // relative position
    };
  }
  function r(o, s) {
    return e.repeat(" ", s - o.length) + o;
  }
  function i(o, s) {
    if (s = Object.create(s || null), !o.buffer) return null;
    s.maxLength || (s.maxLength = 79), typeof s.indent != "number" && (s.indent = 1), typeof s.linesBefore != "number" && (s.linesBefore = 3), typeof s.linesAfter != "number" && (s.linesAfter = 2);
    for (var t = /\r?\n|\r|\0/g, l = [0], a = [], u, c = -1; u = t.exec(o.buffer); )
      a.push(u.index), l.push(u.index + u[0].length), o.position <= u.index && c < 0 && (c = l.length - 2);
    c < 0 && (c = l.length - 1);
    var d = "", f, g, m = Math.min(o.line + s.linesAfter, a.length).toString().length, T = s.maxLength - (s.indent + m + 3);
    for (f = 1; f <= s.linesBefore && !(c - f < 0); f++)
      g = n(
        o.buffer,
        l[c - f],
        a[c - f],
        o.position - (l[c] - l[c - f]),
        T
      ), d = e.repeat(" ", s.indent) + r((o.line - f + 1).toString(), m) + " | " + g.str + `
` + d;
    for (g = n(o.buffer, l[c], a[c], o.position, T), d += e.repeat(" ", s.indent) + r((o.line + 1).toString(), m) + " | " + g.str + `
`, d += e.repeat("-", s.indent + m + 3 + g.pos) + `^
`, f = 1; f <= s.linesAfter && !(c + f >= a.length); f++)
      g = n(
        o.buffer,
        l[c + f],
        a[c + f],
        o.position - (l[c] - l[c + f]),
        T
      ), d += e.repeat(" ", s.indent) + r((o.line + f + 1).toString(), m) + " | " + g.str + `
`;
    return d.replace(/\n$/, "");
  }
  return oi = i, oi;
}
var ai, $a;
function je() {
  if ($a) return ai;
  $a = 1;
  var e = Nr(), n = [
    "kind",
    "multi",
    "resolve",
    "construct",
    "instanceOf",
    "predicate",
    "represent",
    "representName",
    "defaultStyle",
    "styleAliases"
  ], r = [
    "scalar",
    "sequence",
    "mapping"
  ];
  function i(s) {
    var t = {};
    return s !== null && Object.keys(s).forEach(function(l) {
      s[l].forEach(function(a) {
        t[String(a)] = l;
      });
    }), t;
  }
  function o(s, t) {
    if (t = t || {}, Object.keys(t).forEach(function(l) {
      if (n.indexOf(l) === -1)
        throw new e('Unknown option "' + l + '" is met in definition of "' + s + '" YAML type.');
    }), this.options = t, this.tag = s, this.kind = t.kind || null, this.resolve = t.resolve || function() {
      return !0;
    }, this.construct = t.construct || function(l) {
      return l;
    }, this.instanceOf = t.instanceOf || null, this.predicate = t.predicate || null, this.represent = t.represent || null, this.representName = t.representName || null, this.defaultStyle = t.defaultStyle || null, this.multi = t.multi || !1, this.styleAliases = i(t.styleAliases || null), r.indexOf(this.kind) === -1)
      throw new e('Unknown kind "' + this.kind + '" is specified for "' + s + '" YAML type.');
  }
  return ai = o, ai;
}
var li, Ma;
function Rc() {
  if (Ma) return li;
  Ma = 1;
  var e = Nr(), n = je();
  function r(s, t) {
    var l = [];
    return s[t].forEach(function(a) {
      var u = l.length;
      l.forEach(function(c, d) {
        c.tag === a.tag && c.kind === a.kind && c.multi === a.multi && (u = d);
      }), l[u] = a;
    }), l;
  }
  function i() {
    var s = {
      scalar: {},
      sequence: {},
      mapping: {},
      fallback: {},
      multi: {
        scalar: [],
        sequence: [],
        mapping: [],
        fallback: []
      }
    }, t, l;
    function a(u) {
      u.multi ? (s.multi[u.kind].push(u), s.multi.fallback.push(u)) : s[u.kind][u.tag] = s.fallback[u.tag] = u;
    }
    for (t = 0, l = arguments.length; t < l; t += 1)
      arguments[t].forEach(a);
    return s;
  }
  function o(s) {
    return this.extend(s);
  }
  return o.prototype.extend = function(t) {
    var l = [], a = [];
    if (t instanceof n)
      a.push(t);
    else if (Array.isArray(t))
      a = a.concat(t);
    else if (t && (Array.isArray(t.implicit) || Array.isArray(t.explicit)))
      t.implicit && (l = l.concat(t.implicit)), t.explicit && (a = a.concat(t.explicit));
    else
      throw new e("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
    l.forEach(function(c) {
      if (!(c instanceof n))
        throw new e("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      if (c.loadKind && c.loadKind !== "scalar")
        throw new e("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
      if (c.multi)
        throw new e("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
    }), a.forEach(function(c) {
      if (!(c instanceof n))
        throw new e("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    });
    var u = Object.create(o.prototype);
    return u.implicit = (this.implicit || []).concat(l), u.explicit = (this.explicit || []).concat(a), u.compiledImplicit = r(u, "implicit"), u.compiledExplicit = r(u, "explicit"), u.compiledTypeMap = i(u.compiledImplicit, u.compiledExplicit), u;
  }, li = o, li;
}
var ui, Ba;
function Ic() {
  if (Ba) return ui;
  Ba = 1;
  var e = je();
  return ui = new e("tag:yaml.org,2002:str", {
    kind: "scalar",
    construct: function(n) {
      return n !== null ? n : "";
    }
  }), ui;
}
var ci, Ha;
function Nc() {
  if (Ha) return ci;
  Ha = 1;
  var e = je();
  return ci = new e("tag:yaml.org,2002:seq", {
    kind: "sequence",
    construct: function(n) {
      return n !== null ? n : [];
    }
  }), ci;
}
var di, ja;
function Oc() {
  if (ja) return di;
  ja = 1;
  var e = je();
  return di = new e("tag:yaml.org,2002:map", {
    kind: "mapping",
    construct: function(n) {
      return n !== null ? n : {};
    }
  }), di;
}
var fi, Xa;
function Cc() {
  if (Xa) return fi;
  Xa = 1;
  var e = Rc();
  return fi = new e({
    explicit: [
      Ic(),
      Nc(),
      Oc()
    ]
  }), fi;
}
var hi, Ga;
function Lc() {
  if (Ga) return hi;
  Ga = 1;
  var e = je();
  function n(o) {
    if (o === null) return !0;
    var s = o.length;
    return s === 1 && o === "~" || s === 4 && (o === "null" || o === "Null" || o === "NULL");
  }
  function r() {
    return null;
  }
  function i(o) {
    return o === null;
  }
  return hi = new e("tag:yaml.org,2002:null", {
    kind: "scalar",
    resolve: n,
    construct: r,
    predicate: i,
    represent: {
      canonical: function() {
        return "~";
      },
      lowercase: function() {
        return "null";
      },
      uppercase: function() {
        return "NULL";
      },
      camelcase: function() {
        return "Null";
      },
      empty: function() {
        return "";
      }
    },
    defaultStyle: "lowercase"
  }), hi;
}
var pi, Wa;
function Pc() {
  if (Wa) return pi;
  Wa = 1;
  var e = je();
  function n(o) {
    if (o === null) return !1;
    var s = o.length;
    return s === 4 && (o === "true" || o === "True" || o === "TRUE") || s === 5 && (o === "false" || o === "False" || o === "FALSE");
  }
  function r(o) {
    return o === "true" || o === "True" || o === "TRUE";
  }
  function i(o) {
    return Object.prototype.toString.call(o) === "[object Boolean]";
  }
  return pi = new e("tag:yaml.org,2002:bool", {
    kind: "scalar",
    resolve: n,
    construct: r,
    predicate: i,
    represent: {
      lowercase: function(o) {
        return o ? "true" : "false";
      },
      uppercase: function(o) {
        return o ? "TRUE" : "FALSE";
      },
      camelcase: function(o) {
        return o ? "True" : "False";
      }
    },
    defaultStyle: "lowercase"
  }), pi;
}
var gi, Va;
function Dc() {
  if (Va) return gi;
  Va = 1;
  var e = Ir(), n = je();
  function r(a) {
    return 48 <= a && a <= 57 || 65 <= a && a <= 70 || 97 <= a && a <= 102;
  }
  function i(a) {
    return 48 <= a && a <= 55;
  }
  function o(a) {
    return 48 <= a && a <= 57;
  }
  function s(a) {
    if (a === null) return !1;
    var u = a.length, c = 0, d = !1, f;
    if (!u) return !1;
    if (f = a[c], (f === "-" || f === "+") && (f = a[++c]), f === "0") {
      if (c + 1 === u) return !0;
      if (f = a[++c], f === "b") {
        for (c++; c < u; c++)
          if (f = a[c], f !== "_") {
            if (f !== "0" && f !== "1") return !1;
            d = !0;
          }
        return d && f !== "_";
      }
      if (f === "x") {
        for (c++; c < u; c++)
          if (f = a[c], f !== "_") {
            if (!r(a.charCodeAt(c))) return !1;
            d = !0;
          }
        return d && f !== "_";
      }
      if (f === "o") {
        for (c++; c < u; c++)
          if (f = a[c], f !== "_") {
            if (!i(a.charCodeAt(c))) return !1;
            d = !0;
          }
        return d && f !== "_";
      }
    }
    if (f === "_") return !1;
    for (; c < u; c++)
      if (f = a[c], f !== "_") {
        if (!o(a.charCodeAt(c)))
          return !1;
        d = !0;
      }
    return !(!d || f === "_");
  }
  function t(a) {
    var u = a, c = 1, d;
    if (u.indexOf("_") !== -1 && (u = u.replace(/_/g, "")), d = u[0], (d === "-" || d === "+") && (d === "-" && (c = -1), u = u.slice(1), d = u[0]), u === "0") return 0;
    if (d === "0") {
      if (u[1] === "b") return c * parseInt(u.slice(2), 2);
      if (u[1] === "x") return c * parseInt(u.slice(2), 16);
      if (u[1] === "o") return c * parseInt(u.slice(2), 8);
    }
    return c * parseInt(u, 10);
  }
  function l(a) {
    return Object.prototype.toString.call(a) === "[object Number]" && a % 1 === 0 && !e.isNegativeZero(a);
  }
  return gi = new n("tag:yaml.org,2002:int", {
    kind: "scalar",
    resolve: s,
    construct: t,
    predicate: l,
    represent: {
      binary: function(a) {
        return a >= 0 ? "0b" + a.toString(2) : "-0b" + a.toString(2).slice(1);
      },
      octal: function(a) {
        return a >= 0 ? "0o" + a.toString(8) : "-0o" + a.toString(8).slice(1);
      },
      decimal: function(a) {
        return a.toString(10);
      },
      /* eslint-disable max-len */
      hexadecimal: function(a) {
        return a >= 0 ? "0x" + a.toString(16).toUpperCase() : "-0x" + a.toString(16).toUpperCase().slice(1);
      }
    },
    defaultStyle: "decimal",
    styleAliases: {
      binary: [2, "bin"],
      octal: [8, "oct"],
      decimal: [10, "dec"],
      hexadecimal: [16, "hex"]
    }
  }), gi;
}
var mi, Ya;
function Uc() {
  if (Ya) return mi;
  Ya = 1;
  var e = Ir(), n = je(), r = new RegExp(
    // 2.5e4, 2.5 and integers
    "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  );
  function i(a) {
    return !(a === null || !r.test(a) || // Quick hack to not allow integers end with `_`
    // Probably should update regexp & check speed
    a[a.length - 1] === "_");
  }
  function o(a) {
    var u, c;
    return u = a.replace(/_/g, "").toLowerCase(), c = u[0] === "-" ? -1 : 1, "+-".indexOf(u[0]) >= 0 && (u = u.slice(1)), u === ".inf" ? c === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : u === ".nan" ? NaN : c * parseFloat(u, 10);
  }
  var s = /^[-+]?[0-9]+e/;
  function t(a, u) {
    var c;
    if (isNaN(a))
      switch (u) {
        case "lowercase":
          return ".nan";
        case "uppercase":
          return ".NAN";
        case "camelcase":
          return ".NaN";
      }
    else if (Number.POSITIVE_INFINITY === a)
      switch (u) {
        case "lowercase":
          return ".inf";
        case "uppercase":
          return ".INF";
        case "camelcase":
          return ".Inf";
      }
    else if (Number.NEGATIVE_INFINITY === a)
      switch (u) {
        case "lowercase":
          return "-.inf";
        case "uppercase":
          return "-.INF";
        case "camelcase":
          return "-.Inf";
      }
    else if (e.isNegativeZero(a))
      return "-0.0";
    return c = a.toString(10), s.test(c) ? c.replace("e", ".e") : c;
  }
  function l(a) {
    return Object.prototype.toString.call(a) === "[object Number]" && (a % 1 !== 0 || e.isNegativeZero(a));
  }
  return mi = new n("tag:yaml.org,2002:float", {
    kind: "scalar",
    resolve: i,
    construct: o,
    predicate: l,
    represent: t,
    defaultStyle: "lowercase"
  }), mi;
}
var Ei, za;
function Fc() {
  return za || (za = 1, Ei = Cc().extend({
    implicit: [
      Lc(),
      Pc(),
      Dc(),
      Uc()
    ]
  })), Ei;
}
var Ti, Ja;
function xc() {
  return Ja || (Ja = 1, Ti = Fc()), Ti;
}
var yi, Ka;
function kc() {
  if (Ka) return yi;
  Ka = 1;
  var e = je(), n = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
  ), r = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
  );
  function i(t) {
    return t === null ? !1 : n.exec(t) !== null || r.exec(t) !== null;
  }
  function o(t) {
    var l, a, u, c, d, f, g, m = 0, T = null, p, v, b;
    if (l = n.exec(t), l === null && (l = r.exec(t)), l === null) throw new Error("Date resolve error");
    if (a = +l[1], u = +l[2] - 1, c = +l[3], !l[4])
      return new Date(Date.UTC(a, u, c));
    if (d = +l[4], f = +l[5], g = +l[6], l[7]) {
      for (m = l[7].slice(0, 3); m.length < 3; )
        m += "0";
      m = +m;
    }
    return l[9] && (p = +l[10], v = +(l[11] || 0), T = (p * 60 + v) * 6e4, l[9] === "-" && (T = -T)), b = new Date(Date.UTC(a, u, c, d, f, g, m)), T && b.setTime(b.getTime() - T), b;
  }
  function s(t) {
    return t.toISOString();
  }
  return yi = new e("tag:yaml.org,2002:timestamp", {
    kind: "scalar",
    resolve: i,
    construct: o,
    instanceOf: Date,
    represent: s
  }), yi;
}
var vi, Qa;
function qc() {
  if (Qa) return vi;
  Qa = 1;
  var e = je();
  function n(r) {
    return r === "<<" || r === null;
  }
  return vi = new e("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: n
  }), vi;
}
var Si, Za;
function $c() {
  if (Za) return Si;
  Za = 1;
  var e = je(), n = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
  function r(t) {
    if (t === null) return !1;
    var l, a, u = 0, c = t.length, d = n;
    for (a = 0; a < c; a++)
      if (l = d.indexOf(t.charAt(a)), !(l > 64)) {
        if (l < 0) return !1;
        u += 6;
      }
    return u % 8 === 0;
  }
  function i(t) {
    var l, a, u = t.replace(/[\r\n=]/g, ""), c = u.length, d = n, f = 0, g = [];
    for (l = 0; l < c; l++)
      l % 4 === 0 && l && (g.push(f >> 16 & 255), g.push(f >> 8 & 255), g.push(f & 255)), f = f << 6 | d.indexOf(u.charAt(l));
    return a = c % 4 * 6, a === 0 ? (g.push(f >> 16 & 255), g.push(f >> 8 & 255), g.push(f & 255)) : a === 18 ? (g.push(f >> 10 & 255), g.push(f >> 2 & 255)) : a === 12 && g.push(f >> 4 & 255), new Uint8Array(g);
  }
  function o(t) {
    var l = "", a = 0, u, c, d = t.length, f = n;
    for (u = 0; u < d; u++)
      u % 3 === 0 && u && (l += f[a >> 18 & 63], l += f[a >> 12 & 63], l += f[a >> 6 & 63], l += f[a & 63]), a = (a << 8) + t[u];
    return c = d % 3, c === 0 ? (l += f[a >> 18 & 63], l += f[a >> 12 & 63], l += f[a >> 6 & 63], l += f[a & 63]) : c === 2 ? (l += f[a >> 10 & 63], l += f[a >> 4 & 63], l += f[a << 2 & 63], l += f[64]) : c === 1 && (l += f[a >> 2 & 63], l += f[a << 4 & 63], l += f[64], l += f[64]), l;
  }
  function s(t) {
    return Object.prototype.toString.call(t) === "[object Uint8Array]";
  }
  return Si = new e("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: r,
    construct: i,
    predicate: s,
    represent: o
  }), Si;
}
var Ai, el;
function Mc() {
  if (el) return Ai;
  el = 1;
  var e = je(), n = Object.prototype.hasOwnProperty, r = Object.prototype.toString;
  function i(s) {
    if (s === null) return !0;
    var t = [], l, a, u, c, d, f = s;
    for (l = 0, a = f.length; l < a; l += 1) {
      if (u = f[l], d = !1, r.call(u) !== "[object Object]") return !1;
      for (c in u)
        if (n.call(u, c))
          if (!d) d = !0;
          else return !1;
      if (!d) return !1;
      if (t.indexOf(c) === -1) t.push(c);
      else return !1;
    }
    return !0;
  }
  function o(s) {
    return s !== null ? s : [];
  }
  return Ai = new e("tag:yaml.org,2002:omap", {
    kind: "sequence",
    resolve: i,
    construct: o
  }), Ai;
}
var wi, tl;
function Bc() {
  if (tl) return wi;
  tl = 1;
  var e = je(), n = Object.prototype.toString;
  function r(o) {
    if (o === null) return !0;
    var s, t, l, a, u, c = o;
    for (u = new Array(c.length), s = 0, t = c.length; s < t; s += 1) {
      if (l = c[s], n.call(l) !== "[object Object]" || (a = Object.keys(l), a.length !== 1)) return !1;
      u[s] = [a[0], l[a[0]]];
    }
    return !0;
  }
  function i(o) {
    if (o === null) return [];
    var s, t, l, a, u, c = o;
    for (u = new Array(c.length), s = 0, t = c.length; s < t; s += 1)
      l = c[s], a = Object.keys(l), u[s] = [a[0], l[a[0]]];
    return u;
  }
  return wi = new e("tag:yaml.org,2002:pairs", {
    kind: "sequence",
    resolve: r,
    construct: i
  }), wi;
}
var _i, rl;
function Hc() {
  if (rl) return _i;
  rl = 1;
  var e = je(), n = Object.prototype.hasOwnProperty;
  function r(o) {
    if (o === null) return !0;
    var s, t = o;
    for (s in t)
      if (n.call(t, s) && t[s] !== null)
        return !1;
    return !0;
  }
  function i(o) {
    return o !== null ? o : {};
  }
  return _i = new e("tag:yaml.org,2002:set", {
    kind: "mapping",
    resolve: r,
    construct: i
  }), _i;
}
var bi, nl;
function to() {
  return nl || (nl = 1, bi = xc().extend({
    implicit: [
      kc(),
      qc()
    ],
    explicit: [
      $c(),
      Mc(),
      Bc(),
      Hc()
    ]
  })), bi;
}
var il;
function xh() {
  if (il) return Wr;
  il = 1;
  var e = Ir(), n = Nr(), r = Fh(), i = to(), o = Object.prototype.hasOwnProperty, s = 1, t = 2, l = 3, a = 4, u = 1, c = 2, d = 3, f = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, g = /[\x85\u2028\u2029]/, m = /[,\[\]\{\}]/, T = /^(?:!|!!|![a-z\-]+!)$/i, p = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
  function v(h) {
    return Object.prototype.toString.call(h);
  }
  function b(h) {
    return h === 10 || h === 13;
  }
  function N(h) {
    return h === 9 || h === 32;
  }
  function O(h) {
    return h === 9 || h === 32 || h === 10 || h === 13;
  }
  function k(h) {
    return h === 44 || h === 91 || h === 93 || h === 123 || h === 125;
  }
  function R(h) {
    var B;
    return 48 <= h && h <= 57 ? h - 48 : (B = h | 32, 97 <= B && B <= 102 ? B - 97 + 10 : -1);
  }
  function S(h) {
    return h === 120 ? 2 : h === 117 ? 4 : h === 85 ? 8 : 0;
  }
  function w(h) {
    return 48 <= h && h <= 57 ? h - 48 : -1;
  }
  function y(h) {
    return h === 48 ? "\0" : h === 97 ? "\x07" : h === 98 ? "\b" : h === 116 || h === 9 ? "	" : h === 110 ? `
` : h === 118 ? "\v" : h === 102 ? "\f" : h === 114 ? "\r" : h === 101 ? "\x1B" : h === 32 ? " " : h === 34 ? '"' : h === 47 ? "/" : h === 92 ? "\\" : h === 78 ? "" : h === 95 ? " " : h === 76 ? "\u2028" : h === 80 ? "\u2029" : "";
  }
  function $(h) {
    return h <= 65535 ? String.fromCharCode(h) : String.fromCharCode(
      (h - 65536 >> 10) + 55296,
      (h - 65536 & 1023) + 56320
    );
  }
  function x(h, B, X) {
    B === "__proto__" ? Object.defineProperty(h, B, {
      configurable: !0,
      enumerable: !0,
      writable: !0,
      value: X
    }) : h[B] = X;
  }
  for (var F = new Array(256), M = new Array(256), L = 0; L < 256; L++)
    F[L] = y(L) ? 1 : 0, M[L] = y(L);
  function D(h, B) {
    this.input = h, this.filename = B.filename || null, this.schema = B.schema || i, this.onWarning = B.onWarning || null, this.legacy = B.legacy || !1, this.json = B.json || !1, this.listener = B.listener || null, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = h.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.firstTabInLine = -1, this.documents = [];
  }
  function j(h, B) {
    var X = {
      name: h.filename,
      buffer: h.input.slice(0, -1),
      // omit trailing \0
      position: h.position,
      line: h.line,
      column: h.position - h.lineStart
    };
    return X.snippet = r(X), new n(B, X);
  }
  function C(h, B) {
    throw j(h, B);
  }
  function Q(h, B) {
    h.onWarning && h.onWarning.call(null, j(h, B));
  }
  var V = {
    YAML: function(B, X, re) {
      var G, te, Z;
      B.version !== null && C(B, "duplication of %YAML directive"), re.length !== 1 && C(B, "YAML directive accepts exactly one argument"), G = /^([0-9]+)\.([0-9]+)$/.exec(re[0]), G === null && C(B, "ill-formed argument of the YAML directive"), te = parseInt(G[1], 10), Z = parseInt(G[2], 10), te !== 1 && C(B, "unacceptable YAML version of the document"), B.version = re[0], B.checkLineBreaks = Z < 2, Z !== 1 && Z !== 2 && Q(B, "unsupported YAML version of the document");
    },
    TAG: function(B, X, re) {
      var G, te;
      re.length !== 2 && C(B, "TAG directive accepts exactly two arguments"), G = re[0], te = re[1], T.test(G) || C(B, "ill-formed tag handle (first argument) of the TAG directive"), o.call(B.tagMap, G) && C(B, 'there is a previously declared suffix for "' + G + '" tag handle'), p.test(te) || C(B, "ill-formed tag prefix (second argument) of the TAG directive");
      try {
        te = decodeURIComponent(te);
      } catch {
        C(B, "tag prefix is malformed: " + te);
      }
      B.tagMap[G] = te;
    }
  };
  function ne(h, B, X, re) {
    var G, te, Z, se;
    if (B < X) {
      if (se = h.input.slice(B, X), re)
        for (G = 0, te = se.length; G < te; G += 1)
          Z = se.charCodeAt(G), Z === 9 || 32 <= Z && Z <= 1114111 || C(h, "expected valid JSON character");
      else f.test(se) && C(h, "the stream contains non-printable characters");
      h.result += se;
    }
  }
  function fe(h, B, X, re) {
    var G, te, Z, se;
    for (e.isObject(X) || C(h, "cannot merge mappings; the provided source object is unacceptable"), G = Object.keys(X), Z = 0, se = G.length; Z < se; Z += 1)
      te = G[Z], o.call(B, te) || (x(B, te, X[te]), re[te] = !0);
  }
  function ce(h, B, X, re, G, te, Z, se, le) {
    var Re, Ie;
    if (Array.isArray(G))
      for (G = Array.prototype.slice.call(G), Re = 0, Ie = G.length; Re < Ie; Re += 1)
        Array.isArray(G[Re]) && C(h, "nested arrays are not supported inside keys"), typeof G == "object" && v(G[Re]) === "[object Object]" && (G[Re] = "[object Object]");
    if (typeof G == "object" && v(G) === "[object Object]" && (G = "[object Object]"), G = String(G), B === null && (B = {}), re === "tag:yaml.org,2002:merge")
      if (Array.isArray(te))
        for (Re = 0, Ie = te.length; Re < Ie; Re += 1)
          fe(h, B, te[Re], X);
      else
        fe(h, B, te, X);
    else
      !h.json && !o.call(X, G) && o.call(B, G) && (h.line = Z || h.line, h.lineStart = se || h.lineStart, h.position = le || h.position, C(h, "duplicated mapping key")), x(B, G, te), delete X[G];
    return B;
  }
  function me(h) {
    var B;
    B = h.input.charCodeAt(h.position), B === 10 ? h.position++ : B === 13 ? (h.position++, h.input.charCodeAt(h.position) === 10 && h.position++) : C(h, "a line break is expected"), h.line += 1, h.lineStart = h.position, h.firstTabInLine = -1;
  }
  function Te(h, B, X) {
    for (var re = 0, G = h.input.charCodeAt(h.position); G !== 0; ) {
      for (; N(G); )
        G === 9 && h.firstTabInLine === -1 && (h.firstTabInLine = h.position), G = h.input.charCodeAt(++h.position);
      if (B && G === 35)
        do
          G = h.input.charCodeAt(++h.position);
        while (G !== 10 && G !== 13 && G !== 0);
      if (b(G))
        for (me(h), G = h.input.charCodeAt(h.position), re++, h.lineIndent = 0; G === 32; )
          h.lineIndent++, G = h.input.charCodeAt(++h.position);
      else
        break;
    }
    return X !== -1 && re !== 0 && h.lineIndent < X && Q(h, "deficient indentation"), re;
  }
  function K(h) {
    var B = h.position, X;
    return X = h.input.charCodeAt(B), !!((X === 45 || X === 46) && X === h.input.charCodeAt(B + 1) && X === h.input.charCodeAt(B + 2) && (B += 3, X = h.input.charCodeAt(B), X === 0 || O(X)));
  }
  function Ee(h, B) {
    B === 1 ? h.result += " " : B > 1 && (h.result += e.repeat(`
`, B - 1));
  }
  function A(h, B, X) {
    var re, G, te, Z, se, le, Re, Ie, ge = h.kind, _ = h.result, q;
    if (q = h.input.charCodeAt(h.position), O(q) || k(q) || q === 35 || q === 38 || q === 42 || q === 33 || q === 124 || q === 62 || q === 39 || q === 34 || q === 37 || q === 64 || q === 96 || (q === 63 || q === 45) && (G = h.input.charCodeAt(h.position + 1), O(G) || X && k(G)))
      return !1;
    for (h.kind = "scalar", h.result = "", te = Z = h.position, se = !1; q !== 0; ) {
      if (q === 58) {
        if (G = h.input.charCodeAt(h.position + 1), O(G) || X && k(G))
          break;
      } else if (q === 35) {
        if (re = h.input.charCodeAt(h.position - 1), O(re))
          break;
      } else {
        if (h.position === h.lineStart && K(h) || X && k(q))
          break;
        if (b(q))
          if (le = h.line, Re = h.lineStart, Ie = h.lineIndent, Te(h, !1, -1), h.lineIndent >= B) {
            se = !0, q = h.input.charCodeAt(h.position);
            continue;
          } else {
            h.position = Z, h.line = le, h.lineStart = Re, h.lineIndent = Ie;
            break;
          }
      }
      se && (ne(h, te, Z, !1), Ee(h, h.line - le), te = Z = h.position, se = !1), N(q) || (Z = h.position + 1), q = h.input.charCodeAt(++h.position);
    }
    return ne(h, te, Z, !1), h.result ? !0 : (h.kind = ge, h.result = _, !1);
  }
  function E(h, B) {
    var X, re, G;
    if (X = h.input.charCodeAt(h.position), X !== 39)
      return !1;
    for (h.kind = "scalar", h.result = "", h.position++, re = G = h.position; (X = h.input.charCodeAt(h.position)) !== 0; )
      if (X === 39)
        if (ne(h, re, h.position, !0), X = h.input.charCodeAt(++h.position), X === 39)
          re = h.position, h.position++, G = h.position;
        else
          return !0;
      else b(X) ? (ne(h, re, G, !0), Ee(h, Te(h, !1, B)), re = G = h.position) : h.position === h.lineStart && K(h) ? C(h, "unexpected end of the document within a single quoted scalar") : (h.position++, G = h.position);
    C(h, "unexpected end of the stream within a single quoted scalar");
  }
  function H(h, B) {
    var X, re, G, te, Z, se;
    if (se = h.input.charCodeAt(h.position), se !== 34)
      return !1;
    for (h.kind = "scalar", h.result = "", h.position++, X = re = h.position; (se = h.input.charCodeAt(h.position)) !== 0; ) {
      if (se === 34)
        return ne(h, X, h.position, !0), h.position++, !0;
      if (se === 92) {
        if (ne(h, X, h.position, !0), se = h.input.charCodeAt(++h.position), b(se))
          Te(h, !1, B);
        else if (se < 256 && F[se])
          h.result += M[se], h.position++;
        else if ((Z = S(se)) > 0) {
          for (G = Z, te = 0; G > 0; G--)
            se = h.input.charCodeAt(++h.position), (Z = R(se)) >= 0 ? te = (te << 4) + Z : C(h, "expected hexadecimal character");
          h.result += $(te), h.position++;
        } else
          C(h, "unknown escape sequence");
        X = re = h.position;
      } else b(se) ? (ne(h, X, re, !0), Ee(h, Te(h, !1, B)), X = re = h.position) : h.position === h.lineStart && K(h) ? C(h, "unexpected end of the document within a double quoted scalar") : (h.position++, re = h.position);
    }
    C(h, "unexpected end of the stream within a double quoted scalar");
  }
  function P(h, B) {
    var X = !0, re, G, te, Z = h.tag, se, le = h.anchor, Re, Ie, ge, _, q, W = /* @__PURE__ */ Object.create(null), Y, z, ie, ee;
    if (ee = h.input.charCodeAt(h.position), ee === 91)
      Ie = 93, q = !1, se = [];
    else if (ee === 123)
      Ie = 125, q = !0, se = {};
    else
      return !1;
    for (h.anchor !== null && (h.anchorMap[h.anchor] = se), ee = h.input.charCodeAt(++h.position); ee !== 0; ) {
      if (Te(h, !0, B), ee = h.input.charCodeAt(h.position), ee === Ie)
        return h.position++, h.tag = Z, h.anchor = le, h.kind = q ? "mapping" : "sequence", h.result = se, !0;
      X ? ee === 44 && C(h, "expected the node content, but found ','") : C(h, "missed comma between flow collection entries"), z = Y = ie = null, ge = _ = !1, ee === 63 && (Re = h.input.charCodeAt(h.position + 1), O(Re) && (ge = _ = !0, h.position++, Te(h, !0, B))), re = h.line, G = h.lineStart, te = h.position, be(h, B, s, !1, !0), z = h.tag, Y = h.result, Te(h, !0, B), ee = h.input.charCodeAt(h.position), (_ || h.line === re) && ee === 58 && (ge = !0, ee = h.input.charCodeAt(++h.position), Te(h, !0, B), be(h, B, s, !1, !0), ie = h.result), q ? ce(h, se, W, z, Y, ie, re, G, te) : ge ? se.push(ce(h, null, W, z, Y, ie, re, G, te)) : se.push(Y), Te(h, !0, B), ee = h.input.charCodeAt(h.position), ee === 44 ? (X = !0, ee = h.input.charCodeAt(++h.position)) : X = !1;
    }
    C(h, "unexpected end of the stream within a flow collection");
  }
  function ue(h, B) {
    var X, re, G = u, te = !1, Z = !1, se = B, le = 0, Re = !1, Ie, ge;
    if (ge = h.input.charCodeAt(h.position), ge === 124)
      re = !1;
    else if (ge === 62)
      re = !0;
    else
      return !1;
    for (h.kind = "scalar", h.result = ""; ge !== 0; )
      if (ge = h.input.charCodeAt(++h.position), ge === 43 || ge === 45)
        u === G ? G = ge === 43 ? d : c : C(h, "repeat of a chomping mode identifier");
      else if ((Ie = w(ge)) >= 0)
        Ie === 0 ? C(h, "bad explicit indentation width of a block scalar; it cannot be less than one") : Z ? C(h, "repeat of an indentation width identifier") : (se = B + Ie - 1, Z = !0);
      else
        break;
    if (N(ge)) {
      do
        ge = h.input.charCodeAt(++h.position);
      while (N(ge));
      if (ge === 35)
        do
          ge = h.input.charCodeAt(++h.position);
        while (!b(ge) && ge !== 0);
    }
    for (; ge !== 0; ) {
      for (me(h), h.lineIndent = 0, ge = h.input.charCodeAt(h.position); (!Z || h.lineIndent < se) && ge === 32; )
        h.lineIndent++, ge = h.input.charCodeAt(++h.position);
      if (!Z && h.lineIndent > se && (se = h.lineIndent), b(ge)) {
        le++;
        continue;
      }
      if (h.lineIndent < se) {
        G === d ? h.result += e.repeat(`
`, te ? 1 + le : le) : G === u && te && (h.result += `
`);
        break;
      }
      for (re ? N(ge) ? (Re = !0, h.result += e.repeat(`
`, te ? 1 + le : le)) : Re ? (Re = !1, h.result += e.repeat(`
`, le + 1)) : le === 0 ? te && (h.result += " ") : h.result += e.repeat(`
`, le) : h.result += e.repeat(`
`, te ? 1 + le : le), te = !0, Z = !0, le = 0, X = h.position; !b(ge) && ge !== 0; )
        ge = h.input.charCodeAt(++h.position);
      ne(h, X, h.position, !1);
    }
    return !0;
  }
  function he(h, B) {
    var X, re = h.tag, G = h.anchor, te = [], Z, se = !1, le;
    if (h.firstTabInLine !== -1) return !1;
    for (h.anchor !== null && (h.anchorMap[h.anchor] = te), le = h.input.charCodeAt(h.position); le !== 0 && (h.firstTabInLine !== -1 && (h.position = h.firstTabInLine, C(h, "tab characters must not be used in indentation")), !(le !== 45 || (Z = h.input.charCodeAt(h.position + 1), !O(Z)))); ) {
      if (se = !0, h.position++, Te(h, !0, -1) && h.lineIndent <= B) {
        te.push(null), le = h.input.charCodeAt(h.position);
        continue;
      }
      if (X = h.line, be(h, B, l, !1, !0), te.push(h.result), Te(h, !0, -1), le = h.input.charCodeAt(h.position), (h.line === X || h.lineIndent > B) && le !== 0)
        C(h, "bad indentation of a sequence entry");
      else if (h.lineIndent < B)
        break;
    }
    return se ? (h.tag = re, h.anchor = G, h.kind = "sequence", h.result = te, !0) : !1;
  }
  function pe(h, B, X) {
    var re, G, te, Z, se, le, Re = h.tag, Ie = h.anchor, ge = {}, _ = /* @__PURE__ */ Object.create(null), q = null, W = null, Y = null, z = !1, ie = !1, ee;
    if (h.firstTabInLine !== -1) return !1;
    for (h.anchor !== null && (h.anchorMap[h.anchor] = ge), ee = h.input.charCodeAt(h.position); ee !== 0; ) {
      if (!z && h.firstTabInLine !== -1 && (h.position = h.firstTabInLine, C(h, "tab characters must not be used in indentation")), re = h.input.charCodeAt(h.position + 1), te = h.line, (ee === 63 || ee === 58) && O(re))
        ee === 63 ? (z && (ce(h, ge, _, q, W, null, Z, se, le), q = W = Y = null), ie = !0, z = !0, G = !0) : z ? (z = !1, G = !0) : C(h, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), h.position += 1, ee = re;
      else {
        if (Z = h.line, se = h.lineStart, le = h.position, !be(h, X, t, !1, !0))
          break;
        if (h.line === te) {
          for (ee = h.input.charCodeAt(h.position); N(ee); )
            ee = h.input.charCodeAt(++h.position);
          if (ee === 58)
            ee = h.input.charCodeAt(++h.position), O(ee) || C(h, "a whitespace character is expected after the key-value separator within a block mapping"), z && (ce(h, ge, _, q, W, null, Z, se, le), q = W = Y = null), ie = !0, z = !1, G = !1, q = h.tag, W = h.result;
          else if (ie)
            C(h, "can not read an implicit mapping pair; a colon is missed");
          else
            return h.tag = Re, h.anchor = Ie, !0;
        } else if (ie)
          C(h, "can not read a block mapping entry; a multiline key may not be an implicit key");
        else
          return h.tag = Re, h.anchor = Ie, !0;
      }
      if ((h.line === te || h.lineIndent > B) && (z && (Z = h.line, se = h.lineStart, le = h.position), be(h, B, a, !0, G) && (z ? W = h.result : Y = h.result), z || (ce(h, ge, _, q, W, Y, Z, se, le), q = W = Y = null), Te(h, !0, -1), ee = h.input.charCodeAt(h.position)), (h.line === te || h.lineIndent > B) && ee !== 0)
        C(h, "bad indentation of a mapping entry");
      else if (h.lineIndent < B)
        break;
    }
    return z && ce(h, ge, _, q, W, null, Z, se, le), ie && (h.tag = Re, h.anchor = Ie, h.kind = "mapping", h.result = ge), ie;
  }
  function we(h) {
    var B, X = !1, re = !1, G, te, Z;
    if (Z = h.input.charCodeAt(h.position), Z !== 33) return !1;
    if (h.tag !== null && C(h, "duplication of a tag property"), Z = h.input.charCodeAt(++h.position), Z === 60 ? (X = !0, Z = h.input.charCodeAt(++h.position)) : Z === 33 ? (re = !0, G = "!!", Z = h.input.charCodeAt(++h.position)) : G = "!", B = h.position, X) {
      do
        Z = h.input.charCodeAt(++h.position);
      while (Z !== 0 && Z !== 62);
      h.position < h.length ? (te = h.input.slice(B, h.position), Z = h.input.charCodeAt(++h.position)) : C(h, "unexpected end of the stream within a verbatim tag");
    } else {
      for (; Z !== 0 && !O(Z); )
        Z === 33 && (re ? C(h, "tag suffix cannot contain exclamation marks") : (G = h.input.slice(B - 1, h.position + 1), T.test(G) || C(h, "named tag handle cannot contain such characters"), re = !0, B = h.position + 1)), Z = h.input.charCodeAt(++h.position);
      te = h.input.slice(B, h.position), m.test(te) && C(h, "tag suffix cannot contain flow indicator characters");
    }
    te && !p.test(te) && C(h, "tag name cannot contain such characters: " + te);
    try {
      te = decodeURIComponent(te);
    } catch {
      C(h, "tag name is malformed: " + te);
    }
    return X ? h.tag = te : o.call(h.tagMap, G) ? h.tag = h.tagMap[G] + te : G === "!" ? h.tag = "!" + te : G === "!!" ? h.tag = "tag:yaml.org,2002:" + te : C(h, 'undeclared tag handle "' + G + '"'), !0;
  }
  function ye(h) {
    var B, X;
    if (X = h.input.charCodeAt(h.position), X !== 38) return !1;
    for (h.anchor !== null && C(h, "duplication of an anchor property"), X = h.input.charCodeAt(++h.position), B = h.position; X !== 0 && !O(X) && !k(X); )
      X = h.input.charCodeAt(++h.position);
    return h.position === B && C(h, "name of an anchor node must contain at least one character"), h.anchor = h.input.slice(B, h.position), !0;
  }
  function Ge(h) {
    var B, X, re;
    if (re = h.input.charCodeAt(h.position), re !== 42) return !1;
    for (re = h.input.charCodeAt(++h.position), B = h.position; re !== 0 && !O(re) && !k(re); )
      re = h.input.charCodeAt(++h.position);
    return h.position === B && C(h, "name of an alias node must contain at least one character"), X = h.input.slice(B, h.position), o.call(h.anchorMap, X) || C(h, 'unidentified alias "' + X + '"'), h.result = h.anchorMap[X], Te(h, !0, -1), !0;
  }
  function be(h, B, X, re, G) {
    var te, Z, se, le = 1, Re = !1, Ie = !1, ge, _, q, W, Y, z;
    if (h.listener !== null && h.listener("open", h), h.tag = null, h.anchor = null, h.kind = null, h.result = null, te = Z = se = a === X || l === X, re && Te(h, !0, -1) && (Re = !0, h.lineIndent > B ? le = 1 : h.lineIndent === B ? le = 0 : h.lineIndent < B && (le = -1)), le === 1)
      for (; we(h) || ye(h); )
        Te(h, !0, -1) ? (Re = !0, se = te, h.lineIndent > B ? le = 1 : h.lineIndent === B ? le = 0 : h.lineIndent < B && (le = -1)) : se = !1;
    if (se && (se = Re || G), (le === 1 || a === X) && (s === X || t === X ? Y = B : Y = B + 1, z = h.position - h.lineStart, le === 1 ? se && (he(h, z) || pe(h, z, Y)) || P(h, Y) ? Ie = !0 : (Z && ue(h, Y) || E(h, Y) || H(h, Y) ? Ie = !0 : Ge(h) ? (Ie = !0, (h.tag !== null || h.anchor !== null) && C(h, "alias node should not have any properties")) : A(h, Y, s === X) && (Ie = !0, h.tag === null && (h.tag = "?")), h.anchor !== null && (h.anchorMap[h.anchor] = h.result)) : le === 0 && (Ie = se && he(h, z))), h.tag === null)
      h.anchor !== null && (h.anchorMap[h.anchor] = h.result);
    else if (h.tag === "?") {
      for (h.result !== null && h.kind !== "scalar" && C(h, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + h.kind + '"'), ge = 0, _ = h.implicitTypes.length; ge < _; ge += 1)
        if (W = h.implicitTypes[ge], W.resolve(h.result)) {
          h.result = W.construct(h.result), h.tag = W.tag, h.anchor !== null && (h.anchorMap[h.anchor] = h.result);
          break;
        }
    } else if (h.tag !== "!") {
      if (o.call(h.typeMap[h.kind || "fallback"], h.tag))
        W = h.typeMap[h.kind || "fallback"][h.tag];
      else
        for (W = null, q = h.typeMap.multi[h.kind || "fallback"], ge = 0, _ = q.length; ge < _; ge += 1)
          if (h.tag.slice(0, q[ge].tag.length) === q[ge].tag) {
            W = q[ge];
            break;
          }
      W || C(h, "unknown tag !<" + h.tag + ">"), h.result !== null && W.kind !== h.kind && C(h, "unacceptable node kind for !<" + h.tag + '> tag; it should be "' + W.kind + '", not "' + h.kind + '"'), W.resolve(h.result, h.tag) ? (h.result = W.construct(h.result, h.tag), h.anchor !== null && (h.anchorMap[h.anchor] = h.result)) : C(h, "cannot resolve a node with !<" + h.tag + "> explicit tag");
    }
    return h.listener !== null && h.listener("close", h), h.tag !== null || h.anchor !== null || Ie;
  }
  function He(h) {
    var B = h.position, X, re, G, te = !1, Z;
    for (h.version = null, h.checkLineBreaks = h.legacy, h.tagMap = /* @__PURE__ */ Object.create(null), h.anchorMap = /* @__PURE__ */ Object.create(null); (Z = h.input.charCodeAt(h.position)) !== 0 && (Te(h, !0, -1), Z = h.input.charCodeAt(h.position), !(h.lineIndent > 0 || Z !== 37)); ) {
      for (te = !0, Z = h.input.charCodeAt(++h.position), X = h.position; Z !== 0 && !O(Z); )
        Z = h.input.charCodeAt(++h.position);
      for (re = h.input.slice(X, h.position), G = [], re.length < 1 && C(h, "directive name must not be less than one character in length"); Z !== 0; ) {
        for (; N(Z); )
          Z = h.input.charCodeAt(++h.position);
        if (Z === 35) {
          do
            Z = h.input.charCodeAt(++h.position);
          while (Z !== 0 && !b(Z));
          break;
        }
        if (b(Z)) break;
        for (X = h.position; Z !== 0 && !O(Z); )
          Z = h.input.charCodeAt(++h.position);
        G.push(h.input.slice(X, h.position));
      }
      Z !== 0 && me(h), o.call(V, re) ? V[re](h, re, G) : Q(h, 'unknown document directive "' + re + '"');
    }
    if (Te(h, !0, -1), h.lineIndent === 0 && h.input.charCodeAt(h.position) === 45 && h.input.charCodeAt(h.position + 1) === 45 && h.input.charCodeAt(h.position + 2) === 45 ? (h.position += 3, Te(h, !0, -1)) : te && C(h, "directives end mark is expected"), be(h, h.lineIndent - 1, a, !1, !0), Te(h, !0, -1), h.checkLineBreaks && g.test(h.input.slice(B, h.position)) && Q(h, "non-ASCII line breaks are interpreted as content"), h.documents.push(h.result), h.position === h.lineStart && K(h)) {
      h.input.charCodeAt(h.position) === 46 && (h.position += 3, Te(h, !0, -1));
      return;
    }
    if (h.position < h.length - 1)
      C(h, "end of the stream or a document separator is expected");
    else
      return;
  }
  function pt(h, B) {
    h = String(h), B = B || {}, h.length !== 0 && (h.charCodeAt(h.length - 1) !== 10 && h.charCodeAt(h.length - 1) !== 13 && (h += `
`), h.charCodeAt(0) === 65279 && (h = h.slice(1)));
    var X = new D(h, B), re = h.indexOf("\0");
    for (re !== -1 && (X.position = re, C(X, "null byte is not allowed in input")), X.input += "\0"; X.input.charCodeAt(X.position) === 32; )
      X.lineIndent += 1, X.position += 1;
    for (; X.position < X.length - 1; )
      He(X);
    return X.documents;
  }
  function ut(h, B, X) {
    B !== null && typeof B == "object" && typeof X > "u" && (X = B, B = null);
    var re = pt(h, X);
    if (typeof B != "function")
      return re;
    for (var G = 0, te = re.length; G < te; G += 1)
      B(re[G]);
  }
  function ot(h, B) {
    var X = pt(h, B);
    if (X.length !== 0) {
      if (X.length === 1)
        return X[0];
      throw new n("expected a single document in the stream, but found more");
    }
  }
  return Wr.loadAll = ut, Wr.load = ot, Wr;
}
var Ri = {}, sl;
function kh() {
  if (sl) return Ri;
  sl = 1;
  var e = Ir(), n = Nr(), r = to(), i = Object.prototype.toString, o = Object.prototype.hasOwnProperty, s = 65279, t = 9, l = 10, a = 13, u = 32, c = 33, d = 34, f = 35, g = 37, m = 38, T = 39, p = 42, v = 44, b = 45, N = 58, O = 61, k = 62, R = 63, S = 64, w = 91, y = 93, $ = 96, x = 123, F = 124, M = 125, L = {};
  L[0] = "\\0", L[7] = "\\a", L[8] = "\\b", L[9] = "\\t", L[10] = "\\n", L[11] = "\\v", L[12] = "\\f", L[13] = "\\r", L[27] = "\\e", L[34] = '\\"', L[92] = "\\\\", L[133] = "\\N", L[160] = "\\_", L[8232] = "\\L", L[8233] = "\\P";
  var D = [
    "y",
    "Y",
    "yes",
    "Yes",
    "YES",
    "on",
    "On",
    "ON",
    "n",
    "N",
    "no",
    "No",
    "NO",
    "off",
    "Off",
    "OFF"
  ], j = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
  function C(_, q) {
    var W, Y, z, ie, ee, oe, de;
    if (q === null) return {};
    for (W = {}, Y = Object.keys(q), z = 0, ie = Y.length; z < ie; z += 1)
      ee = Y[z], oe = String(q[ee]), ee.slice(0, 2) === "!!" && (ee = "tag:yaml.org,2002:" + ee.slice(2)), de = _.compiledTypeMap.fallback[ee], de && o.call(de.styleAliases, oe) && (oe = de.styleAliases[oe]), W[ee] = oe;
    return W;
  }
  function Q(_) {
    var q, W, Y;
    if (q = _.toString(16).toUpperCase(), _ <= 255)
      W = "x", Y = 2;
    else if (_ <= 65535)
      W = "u", Y = 4;
    else if (_ <= 4294967295)
      W = "U", Y = 8;
    else
      throw new n("code point within a string may not be greater than 0xFFFFFFFF");
    return "\\" + W + e.repeat("0", Y - q.length) + q;
  }
  var V = 1, ne = 2;
  function fe(_) {
    this.schema = _.schema || r, this.indent = Math.max(1, _.indent || 2), this.noArrayIndent = _.noArrayIndent || !1, this.skipInvalid = _.skipInvalid || !1, this.flowLevel = e.isNothing(_.flowLevel) ? -1 : _.flowLevel, this.styleMap = C(this.schema, _.styles || null), this.sortKeys = _.sortKeys || !1, this.lineWidth = _.lineWidth || 80, this.noRefs = _.noRefs || !1, this.noCompatMode = _.noCompatMode || !1, this.condenseFlow = _.condenseFlow || !1, this.quotingType = _.quotingType === '"' ? ne : V, this.forceQuotes = _.forceQuotes || !1, this.replacer = typeof _.replacer == "function" ? _.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
  }
  function ce(_, q) {
    for (var W = e.repeat(" ", q), Y = 0, z = -1, ie = "", ee, oe = _.length; Y < oe; )
      z = _.indexOf(`
`, Y), z === -1 ? (ee = _.slice(Y), Y = oe) : (ee = _.slice(Y, z + 1), Y = z + 1), ee.length && ee !== `
` && (ie += W), ie += ee;
    return ie;
  }
  function me(_, q) {
    return `
` + e.repeat(" ", _.indent * q);
  }
  function Te(_, q) {
    var W, Y, z;
    for (W = 0, Y = _.implicitTypes.length; W < Y; W += 1)
      if (z = _.implicitTypes[W], z.resolve(q))
        return !0;
    return !1;
  }
  function K(_) {
    return _ === u || _ === t;
  }
  function Ee(_) {
    return 32 <= _ && _ <= 126 || 161 <= _ && _ <= 55295 && _ !== 8232 && _ !== 8233 || 57344 <= _ && _ <= 65533 && _ !== s || 65536 <= _ && _ <= 1114111;
  }
  function A(_) {
    return Ee(_) && _ !== s && _ !== a && _ !== l;
  }
  function E(_, q, W) {
    var Y = A(_), z = Y && !K(_);
    return (
      // ns-plain-safe
      (W ? (
        // c = flow-in
        Y
      ) : Y && _ !== v && _ !== w && _ !== y && _ !== x && _ !== M) && _ !== f && !(q === N && !z) || A(q) && !K(q) && _ === f || q === N && z
    );
  }
  function H(_) {
    return Ee(_) && _ !== s && !K(_) && _ !== b && _ !== R && _ !== N && _ !== v && _ !== w && _ !== y && _ !== x && _ !== M && _ !== f && _ !== m && _ !== p && _ !== c && _ !== F && _ !== O && _ !== k && _ !== T && _ !== d && _ !== g && _ !== S && _ !== $;
  }
  function P(_) {
    return !K(_) && _ !== N;
  }
  function ue(_, q) {
    var W = _.charCodeAt(q), Y;
    return W >= 55296 && W <= 56319 && q + 1 < _.length && (Y = _.charCodeAt(q + 1), Y >= 56320 && Y <= 57343) ? (W - 55296) * 1024 + Y - 56320 + 65536 : W;
  }
  function he(_) {
    var q = /^\n* /;
    return q.test(_);
  }
  var pe = 1, we = 2, ye = 3, Ge = 4, be = 5;
  function He(_, q, W, Y, z, ie, ee, oe) {
    var de, Ae = 0, Le = null, Ue = !1, Oe = !1, $t = Y !== -1, tt = -1, _t = H(ue(_, 0)) && P(ue(_, _.length - 1));
    if (q || ee)
      for (de = 0; de < _.length; Ae >= 65536 ? de += 2 : de++) {
        if (Ae = ue(_, de), !Ee(Ae))
          return be;
        _t = _t && E(Ae, Le, oe), Le = Ae;
      }
    else {
      for (de = 0; de < _.length; Ae >= 65536 ? de += 2 : de++) {
        if (Ae = ue(_, de), Ae === l)
          Ue = !0, $t && (Oe = Oe || // Foldable line = too long, and not more-indented.
          de - tt - 1 > Y && _[tt + 1] !== " ", tt = de);
        else if (!Ee(Ae))
          return be;
        _t = _t && E(Ae, Le, oe), Le = Ae;
      }
      Oe = Oe || $t && de - tt - 1 > Y && _[tt + 1] !== " ";
    }
    return !Ue && !Oe ? _t && !ee && !z(_) ? pe : ie === ne ? be : we : W > 9 && he(_) ? be : ee ? ie === ne ? be : we : Oe ? Ge : ye;
  }
  function pt(_, q, W, Y, z) {
    _.dump = (function() {
      if (q.length === 0)
        return _.quotingType === ne ? '""' : "''";
      if (!_.noCompatMode && (D.indexOf(q) !== -1 || j.test(q)))
        return _.quotingType === ne ? '"' + q + '"' : "'" + q + "'";
      var ie = _.indent * Math.max(1, W), ee = _.lineWidth === -1 ? -1 : Math.max(Math.min(_.lineWidth, 40), _.lineWidth - ie), oe = Y || _.flowLevel > -1 && W >= _.flowLevel;
      function de(Ae) {
        return Te(_, Ae);
      }
      switch (He(
        q,
        oe,
        _.indent,
        ee,
        de,
        _.quotingType,
        _.forceQuotes && !Y,
        z
      )) {
        case pe:
          return q;
        case we:
          return "'" + q.replace(/'/g, "''") + "'";
        case ye:
          return "|" + ut(q, _.indent) + ot(ce(q, ie));
        case Ge:
          return ">" + ut(q, _.indent) + ot(ce(h(q, ee), ie));
        case be:
          return '"' + X(q) + '"';
        default:
          throw new n("impossible error: invalid scalar style");
      }
    })();
  }
  function ut(_, q) {
    var W = he(_) ? String(q) : "", Y = _[_.length - 1] === `
`, z = Y && (_[_.length - 2] === `
` || _ === `
`), ie = z ? "+" : Y ? "" : "-";
    return W + ie + `
`;
  }
  function ot(_) {
    return _[_.length - 1] === `
` ? _.slice(0, -1) : _;
  }
  function h(_, q) {
    for (var W = /(\n+)([^\n]*)/g, Y = (function() {
      var Ae = _.indexOf(`
`);
      return Ae = Ae !== -1 ? Ae : _.length, W.lastIndex = Ae, B(_.slice(0, Ae), q);
    })(), z = _[0] === `
` || _[0] === " ", ie, ee; ee = W.exec(_); ) {
      var oe = ee[1], de = ee[2];
      ie = de[0] === " ", Y += oe + (!z && !ie && de !== "" ? `
` : "") + B(de, q), z = ie;
    }
    return Y;
  }
  function B(_, q) {
    if (_ === "" || _[0] === " ") return _;
    for (var W = / [^ ]/g, Y, z = 0, ie, ee = 0, oe = 0, de = ""; Y = W.exec(_); )
      oe = Y.index, oe - z > q && (ie = ee > z ? ee : oe, de += `
` + _.slice(z, ie), z = ie + 1), ee = oe;
    return de += `
`, _.length - z > q && ee > z ? de += _.slice(z, ee) + `
` + _.slice(ee + 1) : de += _.slice(z), de.slice(1);
  }
  function X(_) {
    for (var q = "", W = 0, Y, z = 0; z < _.length; W >= 65536 ? z += 2 : z++)
      W = ue(_, z), Y = L[W], !Y && Ee(W) ? (q += _[z], W >= 65536 && (q += _[z + 1])) : q += Y || Q(W);
    return q;
  }
  function re(_, q, W) {
    var Y = "", z = _.tag, ie, ee, oe;
    for (ie = 0, ee = W.length; ie < ee; ie += 1)
      oe = W[ie], _.replacer && (oe = _.replacer.call(W, String(ie), oe)), (le(_, q, oe, !1, !1) || typeof oe > "u" && le(_, q, null, !1, !1)) && (Y !== "" && (Y += "," + (_.condenseFlow ? "" : " ")), Y += _.dump);
    _.tag = z, _.dump = "[" + Y + "]";
  }
  function G(_, q, W, Y) {
    var z = "", ie = _.tag, ee, oe, de;
    for (ee = 0, oe = W.length; ee < oe; ee += 1)
      de = W[ee], _.replacer && (de = _.replacer.call(W, String(ee), de)), (le(_, q + 1, de, !0, !0, !1, !0) || typeof de > "u" && le(_, q + 1, null, !0, !0, !1, !0)) && ((!Y || z !== "") && (z += me(_, q)), _.dump && l === _.dump.charCodeAt(0) ? z += "-" : z += "- ", z += _.dump);
    _.tag = ie, _.dump = z || "[]";
  }
  function te(_, q, W) {
    var Y = "", z = _.tag, ie = Object.keys(W), ee, oe, de, Ae, Le;
    for (ee = 0, oe = ie.length; ee < oe; ee += 1)
      Le = "", Y !== "" && (Le += ", "), _.condenseFlow && (Le += '"'), de = ie[ee], Ae = W[de], _.replacer && (Ae = _.replacer.call(W, de, Ae)), le(_, q, de, !1, !1) && (_.dump.length > 1024 && (Le += "? "), Le += _.dump + (_.condenseFlow ? '"' : "") + ":" + (_.condenseFlow ? "" : " "), le(_, q, Ae, !1, !1) && (Le += _.dump, Y += Le));
    _.tag = z, _.dump = "{" + Y + "}";
  }
  function Z(_, q, W, Y) {
    var z = "", ie = _.tag, ee = Object.keys(W), oe, de, Ae, Le, Ue, Oe;
    if (_.sortKeys === !0)
      ee.sort();
    else if (typeof _.sortKeys == "function")
      ee.sort(_.sortKeys);
    else if (_.sortKeys)
      throw new n("sortKeys must be a boolean or a function");
    for (oe = 0, de = ee.length; oe < de; oe += 1)
      Oe = "", (!Y || z !== "") && (Oe += me(_, q)), Ae = ee[oe], Le = W[Ae], _.replacer && (Le = _.replacer.call(W, Ae, Le)), le(_, q + 1, Ae, !0, !0, !0) && (Ue = _.tag !== null && _.tag !== "?" || _.dump && _.dump.length > 1024, Ue && (_.dump && l === _.dump.charCodeAt(0) ? Oe += "?" : Oe += "? "), Oe += _.dump, Ue && (Oe += me(_, q)), le(_, q + 1, Le, !0, Ue) && (_.dump && l === _.dump.charCodeAt(0) ? Oe += ":" : Oe += ": ", Oe += _.dump, z += Oe));
    _.tag = ie, _.dump = z || "{}";
  }
  function se(_, q, W) {
    var Y, z, ie, ee, oe, de;
    for (z = W ? _.explicitTypes : _.implicitTypes, ie = 0, ee = z.length; ie < ee; ie += 1)
      if (oe = z[ie], (oe.instanceOf || oe.predicate) && (!oe.instanceOf || typeof q == "object" && q instanceof oe.instanceOf) && (!oe.predicate || oe.predicate(q))) {
        if (W ? oe.multi && oe.representName ? _.tag = oe.representName(q) : _.tag = oe.tag : _.tag = "?", oe.represent) {
          if (de = _.styleMap[oe.tag] || oe.defaultStyle, i.call(oe.represent) === "[object Function]")
            Y = oe.represent(q, de);
          else if (o.call(oe.represent, de))
            Y = oe.represent[de](q, de);
          else
            throw new n("!<" + oe.tag + '> tag resolver accepts not "' + de + '" style');
          _.dump = Y;
        }
        return !0;
      }
    return !1;
  }
  function le(_, q, W, Y, z, ie, ee) {
    _.tag = null, _.dump = W, se(_, W, !1) || se(_, W, !0);
    var oe = i.call(_.dump), de = Y, Ae;
    Y && (Y = _.flowLevel < 0 || _.flowLevel > q);
    var Le = oe === "[object Object]" || oe === "[object Array]", Ue, Oe;
    if (Le && (Ue = _.duplicates.indexOf(W), Oe = Ue !== -1), (_.tag !== null && _.tag !== "?" || Oe || _.indent !== 2 && q > 0) && (z = !1), Oe && _.usedDuplicates[Ue])
      _.dump = "*ref_" + Ue;
    else {
      if (Le && Oe && !_.usedDuplicates[Ue] && (_.usedDuplicates[Ue] = !0), oe === "[object Object]")
        Y && Object.keys(_.dump).length !== 0 ? (Z(_, q, _.dump, z), Oe && (_.dump = "&ref_" + Ue + _.dump)) : (te(_, q, _.dump), Oe && (_.dump = "&ref_" + Ue + " " + _.dump));
      else if (oe === "[object Array]")
        Y && _.dump.length !== 0 ? (_.noArrayIndent && !ee && q > 0 ? G(_, q - 1, _.dump, z) : G(_, q, _.dump, z), Oe && (_.dump = "&ref_" + Ue + _.dump)) : (re(_, q, _.dump), Oe && (_.dump = "&ref_" + Ue + " " + _.dump));
      else if (oe === "[object String]")
        _.tag !== "?" && pt(_, _.dump, q, ie, de);
      else {
        if (oe === "[object Undefined]")
          return !1;
        if (_.skipInvalid) return !1;
        throw new n("unacceptable kind of an object to dump " + oe);
      }
      _.tag !== null && _.tag !== "?" && (Ae = encodeURI(
        _.tag[0] === "!" ? _.tag.slice(1) : _.tag
      ).replace(/!/g, "%21"), _.tag[0] === "!" ? Ae = "!" + Ae : Ae.slice(0, 18) === "tag:yaml.org,2002:" ? Ae = "!!" + Ae.slice(18) : Ae = "!<" + Ae + ">", _.dump = Ae + " " + _.dump);
    }
    return !0;
  }
  function Re(_, q) {
    var W = [], Y = [], z, ie;
    for (Ie(_, W, Y), z = 0, ie = Y.length; z < ie; z += 1)
      q.duplicates.push(W[Y[z]]);
    q.usedDuplicates = new Array(ie);
  }
  function Ie(_, q, W) {
    var Y, z, ie;
    if (_ !== null && typeof _ == "object")
      if (z = q.indexOf(_), z !== -1)
        W.indexOf(z) === -1 && W.push(z);
      else if (q.push(_), Array.isArray(_))
        for (z = 0, ie = _.length; z < ie; z += 1)
          Ie(_[z], q, W);
      else
        for (Y = Object.keys(_), z = 0, ie = Y.length; z < ie; z += 1)
          Ie(_[Y[z]], q, W);
  }
  function ge(_, q) {
    q = q || {};
    var W = new fe(q);
    W.noRefs || Re(_, W);
    var Y = _;
    return W.replacer && (Y = W.replacer.call({ "": Y }, "", Y)), le(W, 0, Y, !0, !0) ? W.dump + `
` : "";
  }
  return Ri.dump = ge, Ri;
}
var ol;
function ro() {
  if (ol) return Be;
  ol = 1;
  var e = xh(), n = kh();
  function r(i, o) {
    return function() {
      throw new Error("Function yaml." + i + " is removed in js-yaml 4. Use yaml." + o + " instead, which is now safe by default.");
    };
  }
  return Be.Type = je(), Be.Schema = Rc(), Be.FAILSAFE_SCHEMA = Cc(), Be.JSON_SCHEMA = Fc(), Be.CORE_SCHEMA = xc(), Be.DEFAULT_SCHEMA = to(), Be.load = e.load, Be.loadAll = e.loadAll, Be.dump = n.dump, Be.YAMLException = Nr(), Be.types = {
    binary: $c(),
    float: Uc(),
    map: Oc(),
    null: Lc(),
    pairs: Bc(),
    set: Hc(),
    timestamp: kc(),
    bool: Pc(),
    int: Dc(),
    merge: qc(),
    omap: Mc(),
    seq: Nc(),
    str: Ic()
  }, Be.safeLoad = r("safeLoad", "load"), Be.safeLoadAll = r("safeLoadAll", "loadAll"), Be.safeDump = r("safeDump", "dump"), Be;
}
var sr = {}, al;
function qh() {
  if (al) return sr;
  al = 1, Object.defineProperty(sr, "__esModule", { value: !0 }), sr.Lazy = void 0;
  class e {
    constructor(r) {
      this._value = null, this.creator = r;
    }
    get hasValue() {
      return this.creator == null;
    }
    get value() {
      if (this.creator == null)
        return this._value;
      const r = this.creator();
      return this.value = r, r;
    }
    set value(r) {
      this._value = r, this.creator = null;
    }
  }
  return sr.Lazy = e, sr;
}
var Vr = { exports: {} }, Ii, ll;
function nn() {
  if (ll) return Ii;
  ll = 1;
  const e = "2.0.0", n = 256, r = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
  9007199254740991, i = 16, o = n - 6;
  return Ii = {
    MAX_LENGTH: n,
    MAX_SAFE_COMPONENT_LENGTH: i,
    MAX_SAFE_BUILD_LENGTH: o,
    MAX_SAFE_INTEGER: r,
    RELEASE_TYPES: [
      "major",
      "premajor",
      "minor",
      "preminor",
      "patch",
      "prepatch",
      "prerelease"
    ],
    SEMVER_SPEC_VERSION: e,
    FLAG_INCLUDE_PRERELEASE: 1,
    FLAG_LOOSE: 2
  }, Ii;
}
var Ni, ul;
function sn() {
  return ul || (ul = 1, Ni = typeof process == "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...n) => console.error("SEMVER", ...n) : () => {
  }), Ni;
}
var cl;
function Or() {
  return cl || (cl = 1, (function(e, n) {
    const {
      MAX_SAFE_COMPONENT_LENGTH: r,
      MAX_SAFE_BUILD_LENGTH: i,
      MAX_LENGTH: o
    } = nn(), s = sn();
    n = e.exports = {};
    const t = n.re = [], l = n.safeRe = [], a = n.src = [], u = n.safeSrc = [], c = n.t = {};
    let d = 0;
    const f = "[a-zA-Z0-9-]", g = [
      ["\\s", 1],
      ["\\d", o],
      [f, i]
    ], m = (p) => {
      for (const [v, b] of g)
        p = p.split(`${v}*`).join(`${v}{0,${b}}`).split(`${v}+`).join(`${v}{1,${b}}`);
      return p;
    }, T = (p, v, b) => {
      const N = m(v), O = d++;
      s(p, O, v), c[p] = O, a[O] = v, u[O] = N, t[O] = new RegExp(v, b ? "g" : void 0), l[O] = new RegExp(N, b ? "g" : void 0);
    };
    T("NUMERICIDENTIFIER", "0|[1-9]\\d*"), T("NUMERICIDENTIFIERLOOSE", "\\d+"), T("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${f}*`), T("MAINVERSION", `(${a[c.NUMERICIDENTIFIER]})\\.(${a[c.NUMERICIDENTIFIER]})\\.(${a[c.NUMERICIDENTIFIER]})`), T("MAINVERSIONLOOSE", `(${a[c.NUMERICIDENTIFIERLOOSE]})\\.(${a[c.NUMERICIDENTIFIERLOOSE]})\\.(${a[c.NUMERICIDENTIFIERLOOSE]})`), T("PRERELEASEIDENTIFIER", `(?:${a[c.NONNUMERICIDENTIFIER]}|${a[c.NUMERICIDENTIFIER]})`), T("PRERELEASEIDENTIFIERLOOSE", `(?:${a[c.NONNUMERICIDENTIFIER]}|${a[c.NUMERICIDENTIFIERLOOSE]})`), T("PRERELEASE", `(?:-(${a[c.PRERELEASEIDENTIFIER]}(?:\\.${a[c.PRERELEASEIDENTIFIER]})*))`), T("PRERELEASELOOSE", `(?:-?(${a[c.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${a[c.PRERELEASEIDENTIFIERLOOSE]})*))`), T("BUILDIDENTIFIER", `${f}+`), T("BUILD", `(?:\\+(${a[c.BUILDIDENTIFIER]}(?:\\.${a[c.BUILDIDENTIFIER]})*))`), T("FULLPLAIN", `v?${a[c.MAINVERSION]}${a[c.PRERELEASE]}?${a[c.BUILD]}?`), T("FULL", `^${a[c.FULLPLAIN]}$`), T("LOOSEPLAIN", `[v=\\s]*${a[c.MAINVERSIONLOOSE]}${a[c.PRERELEASELOOSE]}?${a[c.BUILD]}?`), T("LOOSE", `^${a[c.LOOSEPLAIN]}$`), T("GTLT", "((?:<|>)?=?)"), T("XRANGEIDENTIFIERLOOSE", `${a[c.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`), T("XRANGEIDENTIFIER", `${a[c.NUMERICIDENTIFIER]}|x|X|\\*`), T("XRANGEPLAIN", `[v=\\s]*(${a[c.XRANGEIDENTIFIER]})(?:\\.(${a[c.XRANGEIDENTIFIER]})(?:\\.(${a[c.XRANGEIDENTIFIER]})(?:${a[c.PRERELEASE]})?${a[c.BUILD]}?)?)?`), T("XRANGEPLAINLOOSE", `[v=\\s]*(${a[c.XRANGEIDENTIFIERLOOSE]})(?:\\.(${a[c.XRANGEIDENTIFIERLOOSE]})(?:\\.(${a[c.XRANGEIDENTIFIERLOOSE]})(?:${a[c.PRERELEASELOOSE]})?${a[c.BUILD]}?)?)?`), T("XRANGE", `^${a[c.GTLT]}\\s*${a[c.XRANGEPLAIN]}$`), T("XRANGELOOSE", `^${a[c.GTLT]}\\s*${a[c.XRANGEPLAINLOOSE]}$`), T("COERCEPLAIN", `(^|[^\\d])(\\d{1,${r}})(?:\\.(\\d{1,${r}}))?(?:\\.(\\d{1,${r}}))?`), T("COERCE", `${a[c.COERCEPLAIN]}(?:$|[^\\d])`), T("COERCEFULL", a[c.COERCEPLAIN] + `(?:${a[c.PRERELEASE]})?(?:${a[c.BUILD]})?(?:$|[^\\d])`), T("COERCERTL", a[c.COERCE], !0), T("COERCERTLFULL", a[c.COERCEFULL], !0), T("LONETILDE", "(?:~>?)"), T("TILDETRIM", `(\\s*)${a[c.LONETILDE]}\\s+`, !0), n.tildeTrimReplace = "$1~", T("TILDE", `^${a[c.LONETILDE]}${a[c.XRANGEPLAIN]}$`), T("TILDELOOSE", `^${a[c.LONETILDE]}${a[c.XRANGEPLAINLOOSE]}$`), T("LONECARET", "(?:\\^)"), T("CARETTRIM", `(\\s*)${a[c.LONECARET]}\\s+`, !0), n.caretTrimReplace = "$1^", T("CARET", `^${a[c.LONECARET]}${a[c.XRANGEPLAIN]}$`), T("CARETLOOSE", `^${a[c.LONECARET]}${a[c.XRANGEPLAINLOOSE]}$`), T("COMPARATORLOOSE", `^${a[c.GTLT]}\\s*(${a[c.LOOSEPLAIN]})$|^$`), T("COMPARATOR", `^${a[c.GTLT]}\\s*(${a[c.FULLPLAIN]})$|^$`), T("COMPARATORTRIM", `(\\s*)${a[c.GTLT]}\\s*(${a[c.LOOSEPLAIN]}|${a[c.XRANGEPLAIN]})`, !0), n.comparatorTrimReplace = "$1$2$3", T("HYPHENRANGE", `^\\s*(${a[c.XRANGEPLAIN]})\\s+-\\s+(${a[c.XRANGEPLAIN]})\\s*$`), T("HYPHENRANGELOOSE", `^\\s*(${a[c.XRANGEPLAINLOOSE]})\\s+-\\s+(${a[c.XRANGEPLAINLOOSE]})\\s*$`), T("STAR", "(<|>)?=?\\s*\\*"), T("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$"), T("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  })(Vr, Vr.exports)), Vr.exports;
}
var Oi, dl;
function no() {
  if (dl) return Oi;
  dl = 1;
  const e = Object.freeze({ loose: !0 }), n = Object.freeze({});
  return Oi = (i) => i ? typeof i != "object" ? e : i : n, Oi;
}
var Ci, fl;
function jc() {
  if (fl) return Ci;
  fl = 1;
  const e = /^[0-9]+$/, n = (i, o) => {
    if (typeof i == "number" && typeof o == "number")
      return i === o ? 0 : i < o ? -1 : 1;
    const s = e.test(i), t = e.test(o);
    return s && t && (i = +i, o = +o), i === o ? 0 : s && !t ? -1 : t && !s ? 1 : i < o ? -1 : 1;
  };
  return Ci = {
    compareIdentifiers: n,
    rcompareIdentifiers: (i, o) => n(o, i)
  }, Ci;
}
var Li, hl;
function Xe() {
  if (hl) return Li;
  hl = 1;
  const e = sn(), { MAX_LENGTH: n, MAX_SAFE_INTEGER: r } = nn(), { safeRe: i, t: o } = Or(), s = no(), { compareIdentifiers: t } = jc();
  class l {
    constructor(u, c) {
      if (c = s(c), u instanceof l) {
        if (u.loose === !!c.loose && u.includePrerelease === !!c.includePrerelease)
          return u;
        u = u.version;
      } else if (typeof u != "string")
        throw new TypeError(`Invalid version. Must be a string. Got type "${typeof u}".`);
      if (u.length > n)
        throw new TypeError(
          `version is longer than ${n} characters`
        );
      e("SemVer", u, c), this.options = c, this.loose = !!c.loose, this.includePrerelease = !!c.includePrerelease;
      const d = u.trim().match(c.loose ? i[o.LOOSE] : i[o.FULL]);
      if (!d)
        throw new TypeError(`Invalid Version: ${u}`);
      if (this.raw = u, this.major = +d[1], this.minor = +d[2], this.patch = +d[3], this.major > r || this.major < 0)
        throw new TypeError("Invalid major version");
      if (this.minor > r || this.minor < 0)
        throw new TypeError("Invalid minor version");
      if (this.patch > r || this.patch < 0)
        throw new TypeError("Invalid patch version");
      d[4] ? this.prerelease = d[4].split(".").map((f) => {
        if (/^[0-9]+$/.test(f)) {
          const g = +f;
          if (g >= 0 && g < r)
            return g;
        }
        return f;
      }) : this.prerelease = [], this.build = d[5] ? d[5].split(".") : [], this.format();
    }
    format() {
      return this.version = `${this.major}.${this.minor}.${this.patch}`, this.prerelease.length && (this.version += `-${this.prerelease.join(".")}`), this.version;
    }
    toString() {
      return this.version;
    }
    compare(u) {
      if (e("SemVer.compare", this.version, this.options, u), !(u instanceof l)) {
        if (typeof u == "string" && u === this.version)
          return 0;
        u = new l(u, this.options);
      }
      return u.version === this.version ? 0 : this.compareMain(u) || this.comparePre(u);
    }
    compareMain(u) {
      return u instanceof l || (u = new l(u, this.options)), this.major < u.major ? -1 : this.major > u.major ? 1 : this.minor < u.minor ? -1 : this.minor > u.minor ? 1 : this.patch < u.patch ? -1 : this.patch > u.patch ? 1 : 0;
    }
    comparePre(u) {
      if (u instanceof l || (u = new l(u, this.options)), this.prerelease.length && !u.prerelease.length)
        return -1;
      if (!this.prerelease.length && u.prerelease.length)
        return 1;
      if (!this.prerelease.length && !u.prerelease.length)
        return 0;
      let c = 0;
      do {
        const d = this.prerelease[c], f = u.prerelease[c];
        if (e("prerelease compare", c, d, f), d === void 0 && f === void 0)
          return 0;
        if (f === void 0)
          return 1;
        if (d === void 0)
          return -1;
        if (d === f)
          continue;
        return t(d, f);
      } while (++c);
    }
    compareBuild(u) {
      u instanceof l || (u = new l(u, this.options));
      let c = 0;
      do {
        const d = this.build[c], f = u.build[c];
        if (e("build compare", c, d, f), d === void 0 && f === void 0)
          return 0;
        if (f === void 0)
          return 1;
        if (d === void 0)
          return -1;
        if (d === f)
          continue;
        return t(d, f);
      } while (++c);
    }
    // preminor will bump the version up to the next minor release, and immediately
    // down to pre-release. premajor and prepatch work the same way.
    inc(u, c, d) {
      if (u.startsWith("pre")) {
        if (!c && d === !1)
          throw new Error("invalid increment argument: identifier is empty");
        if (c) {
          const f = `-${c}`.match(this.options.loose ? i[o.PRERELEASELOOSE] : i[o.PRERELEASE]);
          if (!f || f[1] !== c)
            throw new Error(`invalid identifier: ${c}`);
        }
      }
      switch (u) {
        case "premajor":
          this.prerelease.length = 0, this.patch = 0, this.minor = 0, this.major++, this.inc("pre", c, d);
          break;
        case "preminor":
          this.prerelease.length = 0, this.patch = 0, this.minor++, this.inc("pre", c, d);
          break;
        case "prepatch":
          this.prerelease.length = 0, this.inc("patch", c, d), this.inc("pre", c, d);
          break;
        // If the input is a non-prerelease version, this acts the same as
        // prepatch.
        case "prerelease":
          this.prerelease.length === 0 && this.inc("patch", c, d), this.inc("pre", c, d);
          break;
        case "release":
          if (this.prerelease.length === 0)
            throw new Error(`version ${this.raw} is not a prerelease`);
          this.prerelease.length = 0;
          break;
        case "major":
          (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) && this.major++, this.minor = 0, this.patch = 0, this.prerelease = [];
          break;
        case "minor":
          (this.patch !== 0 || this.prerelease.length === 0) && this.minor++, this.patch = 0, this.prerelease = [];
          break;
        case "patch":
          this.prerelease.length === 0 && this.patch++, this.prerelease = [];
          break;
        // This probably shouldn't be used publicly.
        // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
        case "pre": {
          const f = Number(d) ? 1 : 0;
          if (this.prerelease.length === 0)
            this.prerelease = [f];
          else {
            let g = this.prerelease.length;
            for (; --g >= 0; )
              typeof this.prerelease[g] == "number" && (this.prerelease[g]++, g = -2);
            if (g === -1) {
              if (c === this.prerelease.join(".") && d === !1)
                throw new Error("invalid increment argument: identifier already exists");
              this.prerelease.push(f);
            }
          }
          if (c) {
            let g = [c, f];
            d === !1 && (g = [c]), t(this.prerelease[0], c) === 0 ? isNaN(this.prerelease[1]) && (this.prerelease = g) : this.prerelease = g;
          }
          break;
        }
        default:
          throw new Error(`invalid increment argument: ${u}`);
      }
      return this.raw = this.format(), this.build.length && (this.raw += `+${this.build.join(".")}`), this;
    }
  }
  return Li = l, Li;
}
var Pi, pl;
function Jt() {
  if (pl) return Pi;
  pl = 1;
  const e = Xe();
  return Pi = (r, i, o = !1) => {
    if (r instanceof e)
      return r;
    try {
      return new e(r, i);
    } catch (s) {
      if (!o)
        return null;
      throw s;
    }
  }, Pi;
}
var Di, gl;
function $h() {
  if (gl) return Di;
  gl = 1;
  const e = Jt();
  return Di = (r, i) => {
    const o = e(r, i);
    return o ? o.version : null;
  }, Di;
}
var Ui, ml;
function Mh() {
  if (ml) return Ui;
  ml = 1;
  const e = Jt();
  return Ui = (r, i) => {
    const o = e(r.trim().replace(/^[=v]+/, ""), i);
    return o ? o.version : null;
  }, Ui;
}
var Fi, El;
function Bh() {
  if (El) return Fi;
  El = 1;
  const e = Xe();
  return Fi = (r, i, o, s, t) => {
    typeof o == "string" && (t = s, s = o, o = void 0);
    try {
      return new e(
        r instanceof e ? r.version : r,
        o
      ).inc(i, s, t).version;
    } catch {
      return null;
    }
  }, Fi;
}
var xi, Tl;
function Hh() {
  if (Tl) return xi;
  Tl = 1;
  const e = Jt();
  return xi = (r, i) => {
    const o = e(r, null, !0), s = e(i, null, !0), t = o.compare(s);
    if (t === 0)
      return null;
    const l = t > 0, a = l ? o : s, u = l ? s : o, c = !!a.prerelease.length;
    if (!!u.prerelease.length && !c) {
      if (!u.patch && !u.minor)
        return "major";
      if (u.compareMain(a) === 0)
        return u.minor && !u.patch ? "minor" : "patch";
    }
    const f = c ? "pre" : "";
    return o.major !== s.major ? f + "major" : o.minor !== s.minor ? f + "minor" : o.patch !== s.patch ? f + "patch" : "prerelease";
  }, xi;
}
var ki, yl;
function jh() {
  if (yl) return ki;
  yl = 1;
  const e = Xe();
  return ki = (r, i) => new e(r, i).major, ki;
}
var qi, vl;
function Xh() {
  if (vl) return qi;
  vl = 1;
  const e = Xe();
  return qi = (r, i) => new e(r, i).minor, qi;
}
var $i, Sl;
function Gh() {
  if (Sl) return $i;
  Sl = 1;
  const e = Xe();
  return $i = (r, i) => new e(r, i).patch, $i;
}
var Mi, Al;
function Wh() {
  if (Al) return Mi;
  Al = 1;
  const e = Jt();
  return Mi = (r, i) => {
    const o = e(r, i);
    return o && o.prerelease.length ? o.prerelease : null;
  }, Mi;
}
var Bi, wl;
function it() {
  if (wl) return Bi;
  wl = 1;
  const e = Xe();
  return Bi = (r, i, o) => new e(r, o).compare(new e(i, o)), Bi;
}
var Hi, _l;
function Vh() {
  if (_l) return Hi;
  _l = 1;
  const e = it();
  return Hi = (r, i, o) => e(i, r, o), Hi;
}
var ji, bl;
function Yh() {
  if (bl) return ji;
  bl = 1;
  const e = it();
  return ji = (r, i) => e(r, i, !0), ji;
}
var Xi, Rl;
function io() {
  if (Rl) return Xi;
  Rl = 1;
  const e = Xe();
  return Xi = (r, i, o) => {
    const s = new e(r, o), t = new e(i, o);
    return s.compare(t) || s.compareBuild(t);
  }, Xi;
}
var Gi, Il;
function zh() {
  if (Il) return Gi;
  Il = 1;
  const e = io();
  return Gi = (r, i) => r.sort((o, s) => e(o, s, i)), Gi;
}
var Wi, Nl;
function Jh() {
  if (Nl) return Wi;
  Nl = 1;
  const e = io();
  return Wi = (r, i) => r.sort((o, s) => e(s, o, i)), Wi;
}
var Vi, Ol;
function on() {
  if (Ol) return Vi;
  Ol = 1;
  const e = it();
  return Vi = (r, i, o) => e(r, i, o) > 0, Vi;
}
var Yi, Cl;
function so() {
  if (Cl) return Yi;
  Cl = 1;
  const e = it();
  return Yi = (r, i, o) => e(r, i, o) < 0, Yi;
}
var zi, Ll;
function Xc() {
  if (Ll) return zi;
  Ll = 1;
  const e = it();
  return zi = (r, i, o) => e(r, i, o) === 0, zi;
}
var Ji, Pl;
function Gc() {
  if (Pl) return Ji;
  Pl = 1;
  const e = it();
  return Ji = (r, i, o) => e(r, i, o) !== 0, Ji;
}
var Ki, Dl;
function oo() {
  if (Dl) return Ki;
  Dl = 1;
  const e = it();
  return Ki = (r, i, o) => e(r, i, o) >= 0, Ki;
}
var Qi, Ul;
function ao() {
  if (Ul) return Qi;
  Ul = 1;
  const e = it();
  return Qi = (r, i, o) => e(r, i, o) <= 0, Qi;
}
var Zi, Fl;
function Wc() {
  if (Fl) return Zi;
  Fl = 1;
  const e = Xc(), n = Gc(), r = on(), i = oo(), o = so(), s = ao();
  return Zi = (l, a, u, c) => {
    switch (a) {
      case "===":
        return typeof l == "object" && (l = l.version), typeof u == "object" && (u = u.version), l === u;
      case "!==":
        return typeof l == "object" && (l = l.version), typeof u == "object" && (u = u.version), l !== u;
      case "":
      case "=":
      case "==":
        return e(l, u, c);
      case "!=":
        return n(l, u, c);
      case ">":
        return r(l, u, c);
      case ">=":
        return i(l, u, c);
      case "<":
        return o(l, u, c);
      case "<=":
        return s(l, u, c);
      default:
        throw new TypeError(`Invalid operator: ${a}`);
    }
  }, Zi;
}
var es, xl;
function Kh() {
  if (xl) return es;
  xl = 1;
  const e = Xe(), n = Jt(), { safeRe: r, t: i } = Or();
  return es = (s, t) => {
    if (s instanceof e)
      return s;
    if (typeof s == "number" && (s = String(s)), typeof s != "string")
      return null;
    t = t || {};
    let l = null;
    if (!t.rtl)
      l = s.match(t.includePrerelease ? r[i.COERCEFULL] : r[i.COERCE]);
    else {
      const g = t.includePrerelease ? r[i.COERCERTLFULL] : r[i.COERCERTL];
      let m;
      for (; (m = g.exec(s)) && (!l || l.index + l[0].length !== s.length); )
        (!l || m.index + m[0].length !== l.index + l[0].length) && (l = m), g.lastIndex = m.index + m[1].length + m[2].length;
      g.lastIndex = -1;
    }
    if (l === null)
      return null;
    const a = l[2], u = l[3] || "0", c = l[4] || "0", d = t.includePrerelease && l[5] ? `-${l[5]}` : "", f = t.includePrerelease && l[6] ? `+${l[6]}` : "";
    return n(`${a}.${u}.${c}${d}${f}`, t);
  }, es;
}
var ts, kl;
function Qh() {
  if (kl) return ts;
  kl = 1;
  class e {
    constructor() {
      this.max = 1e3, this.map = /* @__PURE__ */ new Map();
    }
    get(r) {
      const i = this.map.get(r);
      if (i !== void 0)
        return this.map.delete(r), this.map.set(r, i), i;
    }
    delete(r) {
      return this.map.delete(r);
    }
    set(r, i) {
      if (!this.delete(r) && i !== void 0) {
        if (this.map.size >= this.max) {
          const s = this.map.keys().next().value;
          this.delete(s);
        }
        this.map.set(r, i);
      }
      return this;
    }
  }
  return ts = e, ts;
}
var rs, ql;
function st() {
  if (ql) return rs;
  ql = 1;
  const e = /\s+/g;
  class n {
    constructor(D, j) {
      if (j = o(j), D instanceof n)
        return D.loose === !!j.loose && D.includePrerelease === !!j.includePrerelease ? D : new n(D.raw, j);
      if (D instanceof s)
        return this.raw = D.value, this.set = [[D]], this.formatted = void 0, this;
      if (this.options = j, this.loose = !!j.loose, this.includePrerelease = !!j.includePrerelease, this.raw = D.trim().replace(e, " "), this.set = this.raw.split("||").map((C) => this.parseRange(C.trim())).filter((C) => C.length), !this.set.length)
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      if (this.set.length > 1) {
        const C = this.set[0];
        if (this.set = this.set.filter((Q) => !T(Q[0])), this.set.length === 0)
          this.set = [C];
        else if (this.set.length > 1) {
          for (const Q of this.set)
            if (Q.length === 1 && p(Q[0])) {
              this.set = [Q];
              break;
            }
        }
      }
      this.formatted = void 0;
    }
    get range() {
      if (this.formatted === void 0) {
        this.formatted = "";
        for (let D = 0; D < this.set.length; D++) {
          D > 0 && (this.formatted += "||");
          const j = this.set[D];
          for (let C = 0; C < j.length; C++)
            C > 0 && (this.formatted += " "), this.formatted += j[C].toString().trim();
        }
      }
      return this.formatted;
    }
    format() {
      return this.range;
    }
    toString() {
      return this.range;
    }
    parseRange(D) {
      const C = ((this.options.includePrerelease && g) | (this.options.loose && m)) + ":" + D, Q = i.get(C);
      if (Q)
        return Q;
      const V = this.options.loose, ne = V ? a[u.HYPHENRANGELOOSE] : a[u.HYPHENRANGE];
      D = D.replace(ne, F(this.options.includePrerelease)), t("hyphen replace", D), D = D.replace(a[u.COMPARATORTRIM], c), t("comparator trim", D), D = D.replace(a[u.TILDETRIM], d), t("tilde trim", D), D = D.replace(a[u.CARETTRIM], f), t("caret trim", D);
      let fe = D.split(" ").map((K) => b(K, this.options)).join(" ").split(/\s+/).map((K) => x(K, this.options));
      V && (fe = fe.filter((K) => (t("loose invalid filter", K, this.options), !!K.match(a[u.COMPARATORLOOSE])))), t("range list", fe);
      const ce = /* @__PURE__ */ new Map(), me = fe.map((K) => new s(K, this.options));
      for (const K of me) {
        if (T(K))
          return [K];
        ce.set(K.value, K);
      }
      ce.size > 1 && ce.has("") && ce.delete("");
      const Te = [...ce.values()];
      return i.set(C, Te), Te;
    }
    intersects(D, j) {
      if (!(D instanceof n))
        throw new TypeError("a Range is required");
      return this.set.some((C) => v(C, j) && D.set.some((Q) => v(Q, j) && C.every((V) => Q.every((ne) => V.intersects(ne, j)))));
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test(D) {
      if (!D)
        return !1;
      if (typeof D == "string")
        try {
          D = new l(D, this.options);
        } catch {
          return !1;
        }
      for (let j = 0; j < this.set.length; j++)
        if (M(this.set[j], D, this.options))
          return !0;
      return !1;
    }
  }
  rs = n;
  const r = Qh(), i = new r(), o = no(), s = an(), t = sn(), l = Xe(), {
    safeRe: a,
    t: u,
    comparatorTrimReplace: c,
    tildeTrimReplace: d,
    caretTrimReplace: f
  } = Or(), { FLAG_INCLUDE_PRERELEASE: g, FLAG_LOOSE: m } = nn(), T = (L) => L.value === "<0.0.0-0", p = (L) => L.value === "", v = (L, D) => {
    let j = !0;
    const C = L.slice();
    let Q = C.pop();
    for (; j && C.length; )
      j = C.every((V) => Q.intersects(V, D)), Q = C.pop();
    return j;
  }, b = (L, D) => (L = L.replace(a[u.BUILD], ""), t("comp", L, D), L = R(L, D), t("caret", L), L = O(L, D), t("tildes", L), L = w(L, D), t("xrange", L), L = $(L, D), t("stars", L), L), N = (L) => !L || L.toLowerCase() === "x" || L === "*", O = (L, D) => L.trim().split(/\s+/).map((j) => k(j, D)).join(" "), k = (L, D) => {
    const j = D.loose ? a[u.TILDELOOSE] : a[u.TILDE];
    return L.replace(j, (C, Q, V, ne, fe) => {
      t("tilde", L, C, Q, V, ne, fe);
      let ce;
      return N(Q) ? ce = "" : N(V) ? ce = `>=${Q}.0.0 <${+Q + 1}.0.0-0` : N(ne) ? ce = `>=${Q}.${V}.0 <${Q}.${+V + 1}.0-0` : fe ? (t("replaceTilde pr", fe), ce = `>=${Q}.${V}.${ne}-${fe} <${Q}.${+V + 1}.0-0`) : ce = `>=${Q}.${V}.${ne} <${Q}.${+V + 1}.0-0`, t("tilde return", ce), ce;
    });
  }, R = (L, D) => L.trim().split(/\s+/).map((j) => S(j, D)).join(" "), S = (L, D) => {
    t("caret", L, D);
    const j = D.loose ? a[u.CARETLOOSE] : a[u.CARET], C = D.includePrerelease ? "-0" : "";
    return L.replace(j, (Q, V, ne, fe, ce) => {
      t("caret", L, Q, V, ne, fe, ce);
      let me;
      return N(V) ? me = "" : N(ne) ? me = `>=${V}.0.0${C} <${+V + 1}.0.0-0` : N(fe) ? V === "0" ? me = `>=${V}.${ne}.0${C} <${V}.${+ne + 1}.0-0` : me = `>=${V}.${ne}.0${C} <${+V + 1}.0.0-0` : ce ? (t("replaceCaret pr", ce), V === "0" ? ne === "0" ? me = `>=${V}.${ne}.${fe}-${ce} <${V}.${ne}.${+fe + 1}-0` : me = `>=${V}.${ne}.${fe}-${ce} <${V}.${+ne + 1}.0-0` : me = `>=${V}.${ne}.${fe}-${ce} <${+V + 1}.0.0-0`) : (t("no pr"), V === "0" ? ne === "0" ? me = `>=${V}.${ne}.${fe}${C} <${V}.${ne}.${+fe + 1}-0` : me = `>=${V}.${ne}.${fe}${C} <${V}.${+ne + 1}.0-0` : me = `>=${V}.${ne}.${fe} <${+V + 1}.0.0-0`), t("caret return", me), me;
    });
  }, w = (L, D) => (t("replaceXRanges", L, D), L.split(/\s+/).map((j) => y(j, D)).join(" ")), y = (L, D) => {
    L = L.trim();
    const j = D.loose ? a[u.XRANGELOOSE] : a[u.XRANGE];
    return L.replace(j, (C, Q, V, ne, fe, ce) => {
      t("xRange", L, C, Q, V, ne, fe, ce);
      const me = N(V), Te = me || N(ne), K = Te || N(fe), Ee = K;
      return Q === "=" && Ee && (Q = ""), ce = D.includePrerelease ? "-0" : "", me ? Q === ">" || Q === "<" ? C = "<0.0.0-0" : C = "*" : Q && Ee ? (Te && (ne = 0), fe = 0, Q === ">" ? (Q = ">=", Te ? (V = +V + 1, ne = 0, fe = 0) : (ne = +ne + 1, fe = 0)) : Q === "<=" && (Q = "<", Te ? V = +V + 1 : ne = +ne + 1), Q === "<" && (ce = "-0"), C = `${Q + V}.${ne}.${fe}${ce}`) : Te ? C = `>=${V}.0.0${ce} <${+V + 1}.0.0-0` : K && (C = `>=${V}.${ne}.0${ce} <${V}.${+ne + 1}.0-0`), t("xRange return", C), C;
    });
  }, $ = (L, D) => (t("replaceStars", L, D), L.trim().replace(a[u.STAR], "")), x = (L, D) => (t("replaceGTE0", L, D), L.trim().replace(a[D.includePrerelease ? u.GTE0PRE : u.GTE0], "")), F = (L) => (D, j, C, Q, V, ne, fe, ce, me, Te, K, Ee) => (N(C) ? j = "" : N(Q) ? j = `>=${C}.0.0${L ? "-0" : ""}` : N(V) ? j = `>=${C}.${Q}.0${L ? "-0" : ""}` : ne ? j = `>=${j}` : j = `>=${j}${L ? "-0" : ""}`, N(me) ? ce = "" : N(Te) ? ce = `<${+me + 1}.0.0-0` : N(K) ? ce = `<${me}.${+Te + 1}.0-0` : Ee ? ce = `<=${me}.${Te}.${K}-${Ee}` : L ? ce = `<${me}.${Te}.${+K + 1}-0` : ce = `<=${ce}`, `${j} ${ce}`.trim()), M = (L, D, j) => {
    for (let C = 0; C < L.length; C++)
      if (!L[C].test(D))
        return !1;
    if (D.prerelease.length && !j.includePrerelease) {
      for (let C = 0; C < L.length; C++)
        if (t(L[C].semver), L[C].semver !== s.ANY && L[C].semver.prerelease.length > 0) {
          const Q = L[C].semver;
          if (Q.major === D.major && Q.minor === D.minor && Q.patch === D.patch)
            return !0;
        }
      return !1;
    }
    return !0;
  };
  return rs;
}
var ns, $l;
function an() {
  if ($l) return ns;
  $l = 1;
  const e = /* @__PURE__ */ Symbol("SemVer ANY");
  class n {
    static get ANY() {
      return e;
    }
    constructor(c, d) {
      if (d = r(d), c instanceof n) {
        if (c.loose === !!d.loose)
          return c;
        c = c.value;
      }
      c = c.trim().split(/\s+/).join(" "), t("comparator", c, d), this.options = d, this.loose = !!d.loose, this.parse(c), this.semver === e ? this.value = "" : this.value = this.operator + this.semver.version, t("comp", this);
    }
    parse(c) {
      const d = this.options.loose ? i[o.COMPARATORLOOSE] : i[o.COMPARATOR], f = c.match(d);
      if (!f)
        throw new TypeError(`Invalid comparator: ${c}`);
      this.operator = f[1] !== void 0 ? f[1] : "", this.operator === "=" && (this.operator = ""), f[2] ? this.semver = new l(f[2], this.options.loose) : this.semver = e;
    }
    toString() {
      return this.value;
    }
    test(c) {
      if (t("Comparator.test", c, this.options.loose), this.semver === e || c === e)
        return !0;
      if (typeof c == "string")
        try {
          c = new l(c, this.options);
        } catch {
          return !1;
        }
      return s(c, this.operator, this.semver, this.options);
    }
    intersects(c, d) {
      if (!(c instanceof n))
        throw new TypeError("a Comparator is required");
      return this.operator === "" ? this.value === "" ? !0 : new a(c.value, d).test(this.value) : c.operator === "" ? c.value === "" ? !0 : new a(this.value, d).test(c.semver) : (d = r(d), d.includePrerelease && (this.value === "<0.0.0-0" || c.value === "<0.0.0-0") || !d.includePrerelease && (this.value.startsWith("<0.0.0") || c.value.startsWith("<0.0.0")) ? !1 : !!(this.operator.startsWith(">") && c.operator.startsWith(">") || this.operator.startsWith("<") && c.operator.startsWith("<") || this.semver.version === c.semver.version && this.operator.includes("=") && c.operator.includes("=") || s(this.semver, "<", c.semver, d) && this.operator.startsWith(">") && c.operator.startsWith("<") || s(this.semver, ">", c.semver, d) && this.operator.startsWith("<") && c.operator.startsWith(">")));
    }
  }
  ns = n;
  const r = no(), { safeRe: i, t: o } = Or(), s = Wc(), t = sn(), l = Xe(), a = st();
  return ns;
}
var is, Ml;
function ln() {
  if (Ml) return is;
  Ml = 1;
  const e = st();
  return is = (r, i, o) => {
    try {
      i = new e(i, o);
    } catch {
      return !1;
    }
    return i.test(r);
  }, is;
}
var ss, Bl;
function Zh() {
  if (Bl) return ss;
  Bl = 1;
  const e = st();
  return ss = (r, i) => new e(r, i).set.map((o) => o.map((s) => s.value).join(" ").trim().split(" ")), ss;
}
var os, Hl;
function ep() {
  if (Hl) return os;
  Hl = 1;
  const e = Xe(), n = st();
  return os = (i, o, s) => {
    let t = null, l = null, a = null;
    try {
      a = new n(o, s);
    } catch {
      return null;
    }
    return i.forEach((u) => {
      a.test(u) && (!t || l.compare(u) === -1) && (t = u, l = new e(t, s));
    }), t;
  }, os;
}
var as, jl;
function tp() {
  if (jl) return as;
  jl = 1;
  const e = Xe(), n = st();
  return as = (i, o, s) => {
    let t = null, l = null, a = null;
    try {
      a = new n(o, s);
    } catch {
      return null;
    }
    return i.forEach((u) => {
      a.test(u) && (!t || l.compare(u) === 1) && (t = u, l = new e(t, s));
    }), t;
  }, as;
}
var ls, Xl;
function rp() {
  if (Xl) return ls;
  Xl = 1;
  const e = Xe(), n = st(), r = on();
  return ls = (o, s) => {
    o = new n(o, s);
    let t = new e("0.0.0");
    if (o.test(t) || (t = new e("0.0.0-0"), o.test(t)))
      return t;
    t = null;
    for (let l = 0; l < o.set.length; ++l) {
      const a = o.set[l];
      let u = null;
      a.forEach((c) => {
        const d = new e(c.semver.version);
        switch (c.operator) {
          case ">":
            d.prerelease.length === 0 ? d.patch++ : d.prerelease.push(0), d.raw = d.format();
          /* fallthrough */
          case "":
          case ">=":
            (!u || r(d, u)) && (u = d);
            break;
          case "<":
          case "<=":
            break;
          /* istanbul ignore next */
          default:
            throw new Error(`Unexpected operation: ${c.operator}`);
        }
      }), u && (!t || r(t, u)) && (t = u);
    }
    return t && o.test(t) ? t : null;
  }, ls;
}
var us, Gl;
function np() {
  if (Gl) return us;
  Gl = 1;
  const e = st();
  return us = (r, i) => {
    try {
      return new e(r, i).range || "*";
    } catch {
      return null;
    }
  }, us;
}
var cs, Wl;
function lo() {
  if (Wl) return cs;
  Wl = 1;
  const e = Xe(), n = an(), { ANY: r } = n, i = st(), o = ln(), s = on(), t = so(), l = ao(), a = oo();
  return cs = (c, d, f, g) => {
    c = new e(c, g), d = new i(d, g);
    let m, T, p, v, b;
    switch (f) {
      case ">":
        m = s, T = l, p = t, v = ">", b = ">=";
        break;
      case "<":
        m = t, T = a, p = s, v = "<", b = "<=";
        break;
      default:
        throw new TypeError('Must provide a hilo val of "<" or ">"');
    }
    if (o(c, d, g))
      return !1;
    for (let N = 0; N < d.set.length; ++N) {
      const O = d.set[N];
      let k = null, R = null;
      if (O.forEach((S) => {
        S.semver === r && (S = new n(">=0.0.0")), k = k || S, R = R || S, m(S.semver, k.semver, g) ? k = S : p(S.semver, R.semver, g) && (R = S);
      }), k.operator === v || k.operator === b || (!R.operator || R.operator === v) && T(c, R.semver))
        return !1;
      if (R.operator === b && p(c, R.semver))
        return !1;
    }
    return !0;
  }, cs;
}
var ds, Vl;
function ip() {
  if (Vl) return ds;
  Vl = 1;
  const e = lo();
  return ds = (r, i, o) => e(r, i, ">", o), ds;
}
var fs, Yl;
function sp() {
  if (Yl) return fs;
  Yl = 1;
  const e = lo();
  return fs = (r, i, o) => e(r, i, "<", o), fs;
}
var hs, zl;
function op() {
  if (zl) return hs;
  zl = 1;
  const e = st();
  return hs = (r, i, o) => (r = new e(r, o), i = new e(i, o), r.intersects(i, o)), hs;
}
var ps, Jl;
function ap() {
  if (Jl) return ps;
  Jl = 1;
  const e = ln(), n = it();
  return ps = (r, i, o) => {
    const s = [];
    let t = null, l = null;
    const a = r.sort((f, g) => n(f, g, o));
    for (const f of a)
      e(f, i, o) ? (l = f, t || (t = f)) : (l && s.push([t, l]), l = null, t = null);
    t && s.push([t, null]);
    const u = [];
    for (const [f, g] of s)
      f === g ? u.push(f) : !g && f === a[0] ? u.push("*") : g ? f === a[0] ? u.push(`<=${g}`) : u.push(`${f} - ${g}`) : u.push(`>=${f}`);
    const c = u.join(" || "), d = typeof i.raw == "string" ? i.raw : String(i);
    return c.length < d.length ? c : i;
  }, ps;
}
var gs, Kl;
function lp() {
  if (Kl) return gs;
  Kl = 1;
  const e = st(), n = an(), { ANY: r } = n, i = ln(), o = it(), s = (d, f, g = {}) => {
    if (d === f)
      return !0;
    d = new e(d, g), f = new e(f, g);
    let m = !1;
    e: for (const T of d.set) {
      for (const p of f.set) {
        const v = a(T, p, g);
        if (m = m || v !== null, v)
          continue e;
      }
      if (m)
        return !1;
    }
    return !0;
  }, t = [new n(">=0.0.0-0")], l = [new n(">=0.0.0")], a = (d, f, g) => {
    if (d === f)
      return !0;
    if (d.length === 1 && d[0].semver === r) {
      if (f.length === 1 && f[0].semver === r)
        return !0;
      g.includePrerelease ? d = t : d = l;
    }
    if (f.length === 1 && f[0].semver === r) {
      if (g.includePrerelease)
        return !0;
      f = l;
    }
    const m = /* @__PURE__ */ new Set();
    let T, p;
    for (const w of d)
      w.operator === ">" || w.operator === ">=" ? T = u(T, w, g) : w.operator === "<" || w.operator === "<=" ? p = c(p, w, g) : m.add(w.semver);
    if (m.size > 1)
      return null;
    let v;
    if (T && p) {
      if (v = o(T.semver, p.semver, g), v > 0)
        return null;
      if (v === 0 && (T.operator !== ">=" || p.operator !== "<="))
        return null;
    }
    for (const w of m) {
      if (T && !i(w, String(T), g) || p && !i(w, String(p), g))
        return null;
      for (const y of f)
        if (!i(w, String(y), g))
          return !1;
      return !0;
    }
    let b, N, O, k, R = p && !g.includePrerelease && p.semver.prerelease.length ? p.semver : !1, S = T && !g.includePrerelease && T.semver.prerelease.length ? T.semver : !1;
    R && R.prerelease.length === 1 && p.operator === "<" && R.prerelease[0] === 0 && (R = !1);
    for (const w of f) {
      if (k = k || w.operator === ">" || w.operator === ">=", O = O || w.operator === "<" || w.operator === "<=", T) {
        if (S && w.semver.prerelease && w.semver.prerelease.length && w.semver.major === S.major && w.semver.minor === S.minor && w.semver.patch === S.patch && (S = !1), w.operator === ">" || w.operator === ">=") {
          if (b = u(T, w, g), b === w && b !== T)
            return !1;
        } else if (T.operator === ">=" && !i(T.semver, String(w), g))
          return !1;
      }
      if (p) {
        if (R && w.semver.prerelease && w.semver.prerelease.length && w.semver.major === R.major && w.semver.minor === R.minor && w.semver.patch === R.patch && (R = !1), w.operator === "<" || w.operator === "<=") {
          if (N = c(p, w, g), N === w && N !== p)
            return !1;
        } else if (p.operator === "<=" && !i(p.semver, String(w), g))
          return !1;
      }
      if (!w.operator && (p || T) && v !== 0)
        return !1;
    }
    return !(T && O && !p && v !== 0 || p && k && !T && v !== 0 || S || R);
  }, u = (d, f, g) => {
    if (!d)
      return f;
    const m = o(d.semver, f.semver, g);
    return m > 0 ? d : m < 0 || f.operator === ">" && d.operator === ">=" ? f : d;
  }, c = (d, f, g) => {
    if (!d)
      return f;
    const m = o(d.semver, f.semver, g);
    return m < 0 ? d : m > 0 || f.operator === "<" && d.operator === "<=" ? f : d;
  };
  return gs = s, gs;
}
var ms, Ql;
function Vc() {
  if (Ql) return ms;
  Ql = 1;
  const e = Or(), n = nn(), r = Xe(), i = jc(), o = Jt(), s = $h(), t = Mh(), l = Bh(), a = Hh(), u = jh(), c = Xh(), d = Gh(), f = Wh(), g = it(), m = Vh(), T = Yh(), p = io(), v = zh(), b = Jh(), N = on(), O = so(), k = Xc(), R = Gc(), S = oo(), w = ao(), y = Wc(), $ = Kh(), x = an(), F = st(), M = ln(), L = Zh(), D = ep(), j = tp(), C = rp(), Q = np(), V = lo(), ne = ip(), fe = sp(), ce = op(), me = ap(), Te = lp();
  return ms = {
    parse: o,
    valid: s,
    clean: t,
    inc: l,
    diff: a,
    major: u,
    minor: c,
    patch: d,
    prerelease: f,
    compare: g,
    rcompare: m,
    compareLoose: T,
    compareBuild: p,
    sort: v,
    rsort: b,
    gt: N,
    lt: O,
    eq: k,
    neq: R,
    gte: S,
    lte: w,
    cmp: y,
    coerce: $,
    Comparator: x,
    Range: F,
    satisfies: M,
    toComparators: L,
    maxSatisfying: D,
    minSatisfying: j,
    minVersion: C,
    validRange: Q,
    outside: V,
    gtr: ne,
    ltr: fe,
    intersects: ce,
    simplifyRange: me,
    subset: Te,
    SemVer: r,
    re: e.re,
    src: e.src,
    tokens: e.t,
    SEMVER_SPEC_VERSION: n.SEMVER_SPEC_VERSION,
    RELEASE_TYPES: n.RELEASE_TYPES,
    compareIdentifiers: i.compareIdentifiers,
    rcompareIdentifiers: i.rcompareIdentifiers
  }, ms;
}
var Ht = {}, _r = { exports: {} };
_r.exports;
var Zl;
function up() {
  return Zl || (Zl = 1, (function(e, n) {
    var r = 200, i = "__lodash_hash_undefined__", o = 1, s = 2, t = 9007199254740991, l = "[object Arguments]", a = "[object Array]", u = "[object AsyncFunction]", c = "[object Boolean]", d = "[object Date]", f = "[object Error]", g = "[object Function]", m = "[object GeneratorFunction]", T = "[object Map]", p = "[object Number]", v = "[object Null]", b = "[object Object]", N = "[object Promise]", O = "[object Proxy]", k = "[object RegExp]", R = "[object Set]", S = "[object String]", w = "[object Symbol]", y = "[object Undefined]", $ = "[object WeakMap]", x = "[object ArrayBuffer]", F = "[object DataView]", M = "[object Float32Array]", L = "[object Float64Array]", D = "[object Int8Array]", j = "[object Int16Array]", C = "[object Int32Array]", Q = "[object Uint8Array]", V = "[object Uint8ClampedArray]", ne = "[object Uint16Array]", fe = "[object Uint32Array]", ce = /[\\^$.*+?()[\]{}|]/g, me = /^\[object .+?Constructor\]$/, Te = /^(?:0|[1-9]\d*)$/, K = {};
    K[M] = K[L] = K[D] = K[j] = K[C] = K[Q] = K[V] = K[ne] = K[fe] = !0, K[l] = K[a] = K[x] = K[c] = K[F] = K[d] = K[f] = K[g] = K[T] = K[p] = K[b] = K[k] = K[R] = K[S] = K[$] = !1;
    var Ee = typeof nt == "object" && nt && nt.Object === Object && nt, A = typeof self == "object" && self && self.Object === Object && self, E = Ee || A || Function("return this")(), H = n && !n.nodeType && n, P = H && !0 && e && !e.nodeType && e, ue = P && P.exports === H, he = ue && Ee.process, pe = (function() {
      try {
        return he && he.binding && he.binding("util");
      } catch {
      }
    })(), we = pe && pe.isTypedArray;
    function ye(I, U) {
      for (var J = -1, ae = I == null ? 0 : I.length, Pe = 0, _e = []; ++J < ae; ) {
        var Fe = I[J];
        U(Fe, J, I) && (_e[Pe++] = Fe);
      }
      return _e;
    }
    function Ge(I, U) {
      for (var J = -1, ae = U.length, Pe = I.length; ++J < ae; )
        I[Pe + J] = U[J];
      return I;
    }
    function be(I, U) {
      for (var J = -1, ae = I == null ? 0 : I.length; ++J < ae; )
        if (U(I[J], J, I))
          return !0;
      return !1;
    }
    function He(I, U) {
      for (var J = -1, ae = Array(I); ++J < I; )
        ae[J] = U(J);
      return ae;
    }
    function pt(I) {
      return function(U) {
        return I(U);
      };
    }
    function ut(I, U) {
      return I.has(U);
    }
    function ot(I, U) {
      return I?.[U];
    }
    function h(I) {
      var U = -1, J = Array(I.size);
      return I.forEach(function(ae, Pe) {
        J[++U] = [Pe, ae];
      }), J;
    }
    function B(I, U) {
      return function(J) {
        return I(U(J));
      };
    }
    function X(I) {
      var U = -1, J = Array(I.size);
      return I.forEach(function(ae) {
        J[++U] = ae;
      }), J;
    }
    var re = Array.prototype, G = Function.prototype, te = Object.prototype, Z = E["__core-js_shared__"], se = G.toString, le = te.hasOwnProperty, Re = (function() {
      var I = /[^.]+$/.exec(Z && Z.keys && Z.keys.IE_PROTO || "");
      return I ? "Symbol(src)_1." + I : "";
    })(), Ie = te.toString, ge = RegExp(
      "^" + se.call(le).replace(ce, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
    ), _ = ue ? E.Buffer : void 0, q = E.Symbol, W = E.Uint8Array, Y = te.propertyIsEnumerable, z = re.splice, ie = q ? q.toStringTag : void 0, ee = Object.getOwnPropertySymbols, oe = _ ? _.isBuffer : void 0, de = B(Object.keys, Object), Ae = Mt(E, "DataView"), Le = Mt(E, "Map"), Ue = Mt(E, "Promise"), Oe = Mt(E, "Set"), $t = Mt(E, "WeakMap"), tt = Mt(Object, "create"), _t = It(Ae), ld = It(Le), ud = It(Ue), cd = It(Oe), dd = It($t), po = q ? q.prototype : void 0, dn = po ? po.valueOf : void 0;
    function bt(I) {
      var U = -1, J = I == null ? 0 : I.length;
      for (this.clear(); ++U < J; ) {
        var ae = I[U];
        this.set(ae[0], ae[1]);
      }
    }
    function fd() {
      this.__data__ = tt ? tt(null) : {}, this.size = 0;
    }
    function hd(I) {
      var U = this.has(I) && delete this.__data__[I];
      return this.size -= U ? 1 : 0, U;
    }
    function pd(I) {
      var U = this.__data__;
      if (tt) {
        var J = U[I];
        return J === i ? void 0 : J;
      }
      return le.call(U, I) ? U[I] : void 0;
    }
    function gd(I) {
      var U = this.__data__;
      return tt ? U[I] !== void 0 : le.call(U, I);
    }
    function md(I, U) {
      var J = this.__data__;
      return this.size += this.has(I) ? 0 : 1, J[I] = tt && U === void 0 ? i : U, this;
    }
    bt.prototype.clear = fd, bt.prototype.delete = hd, bt.prototype.get = pd, bt.prototype.has = gd, bt.prototype.set = md;
    function ct(I) {
      var U = -1, J = I == null ? 0 : I.length;
      for (this.clear(); ++U < J; ) {
        var ae = I[U];
        this.set(ae[0], ae[1]);
      }
    }
    function Ed() {
      this.__data__ = [], this.size = 0;
    }
    function Td(I) {
      var U = this.__data__, J = Pr(U, I);
      if (J < 0)
        return !1;
      var ae = U.length - 1;
      return J == ae ? U.pop() : z.call(U, J, 1), --this.size, !0;
    }
    function yd(I) {
      var U = this.__data__, J = Pr(U, I);
      return J < 0 ? void 0 : U[J][1];
    }
    function vd(I) {
      return Pr(this.__data__, I) > -1;
    }
    function Sd(I, U) {
      var J = this.__data__, ae = Pr(J, I);
      return ae < 0 ? (++this.size, J.push([I, U])) : J[ae][1] = U, this;
    }
    ct.prototype.clear = Ed, ct.prototype.delete = Td, ct.prototype.get = yd, ct.prototype.has = vd, ct.prototype.set = Sd;
    function Rt(I) {
      var U = -1, J = I == null ? 0 : I.length;
      for (this.clear(); ++U < J; ) {
        var ae = I[U];
        this.set(ae[0], ae[1]);
      }
    }
    function Ad() {
      this.size = 0, this.__data__ = {
        hash: new bt(),
        map: new (Le || ct)(),
        string: new bt()
      };
    }
    function wd(I) {
      var U = Dr(this, I).delete(I);
      return this.size -= U ? 1 : 0, U;
    }
    function _d(I) {
      return Dr(this, I).get(I);
    }
    function bd(I) {
      return Dr(this, I).has(I);
    }
    function Rd(I, U) {
      var J = Dr(this, I), ae = J.size;
      return J.set(I, U), this.size += J.size == ae ? 0 : 1, this;
    }
    Rt.prototype.clear = Ad, Rt.prototype.delete = wd, Rt.prototype.get = _d, Rt.prototype.has = bd, Rt.prototype.set = Rd;
    function Lr(I) {
      var U = -1, J = I == null ? 0 : I.length;
      for (this.__data__ = new Rt(); ++U < J; )
        this.add(I[U]);
    }
    function Id(I) {
      return this.__data__.set(I, i), this;
    }
    function Nd(I) {
      return this.__data__.has(I);
    }
    Lr.prototype.add = Lr.prototype.push = Id, Lr.prototype.has = Nd;
    function gt(I) {
      var U = this.__data__ = new ct(I);
      this.size = U.size;
    }
    function Od() {
      this.__data__ = new ct(), this.size = 0;
    }
    function Cd(I) {
      var U = this.__data__, J = U.delete(I);
      return this.size = U.size, J;
    }
    function Ld(I) {
      return this.__data__.get(I);
    }
    function Pd(I) {
      return this.__data__.has(I);
    }
    function Dd(I, U) {
      var J = this.__data__;
      if (J instanceof ct) {
        var ae = J.__data__;
        if (!Le || ae.length < r - 1)
          return ae.push([I, U]), this.size = ++J.size, this;
        J = this.__data__ = new Rt(ae);
      }
      return J.set(I, U), this.size = J.size, this;
    }
    gt.prototype.clear = Od, gt.prototype.delete = Cd, gt.prototype.get = Ld, gt.prototype.has = Pd, gt.prototype.set = Dd;
    function Ud(I, U) {
      var J = Ur(I), ae = !J && zd(I), Pe = !J && !ae && fn(I), _e = !J && !ae && !Pe && wo(I), Fe = J || ae || Pe || _e, xe = Fe ? He(I.length, String) : [], ke = xe.length;
      for (var De in I)
        le.call(I, De) && !(Fe && // Safari 9 has enumerable `arguments.length` in strict mode.
        (De == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
        Pe && (De == "offset" || De == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
        _e && (De == "buffer" || De == "byteLength" || De == "byteOffset") || // Skip index properties.
        Xd(De, ke))) && xe.push(De);
      return xe;
    }
    function Pr(I, U) {
      for (var J = I.length; J--; )
        if (yo(I[J][0], U))
          return J;
      return -1;
    }
    function Fd(I, U, J) {
      var ae = U(I);
      return Ur(I) ? ae : Ge(ae, J(I));
    }
    function Qt(I) {
      return I == null ? I === void 0 ? y : v : ie && ie in Object(I) ? Hd(I) : Yd(I);
    }
    function go(I) {
      return Zt(I) && Qt(I) == l;
    }
    function mo(I, U, J, ae, Pe) {
      return I === U ? !0 : I == null || U == null || !Zt(I) && !Zt(U) ? I !== I && U !== U : xd(I, U, J, ae, mo, Pe);
    }
    function xd(I, U, J, ae, Pe, _e) {
      var Fe = Ur(I), xe = Ur(U), ke = Fe ? a : mt(I), De = xe ? a : mt(U);
      ke = ke == l ? b : ke, De = De == l ? b : De;
      var Ye = ke == b, rt = De == b, $e = ke == De;
      if ($e && fn(I)) {
        if (!fn(U))
          return !1;
        Fe = !0, Ye = !1;
      }
      if ($e && !Ye)
        return _e || (_e = new gt()), Fe || wo(I) ? Eo(I, U, J, ae, Pe, _e) : Md(I, U, ke, J, ae, Pe, _e);
      if (!(J & o)) {
        var Qe = Ye && le.call(I, "__wrapped__"), Ze = rt && le.call(U, "__wrapped__");
        if (Qe || Ze) {
          var Et = Qe ? I.value() : I, dt = Ze ? U.value() : U;
          return _e || (_e = new gt()), Pe(Et, dt, J, ae, _e);
        }
      }
      return $e ? (_e || (_e = new gt()), Bd(I, U, J, ae, Pe, _e)) : !1;
    }
    function kd(I) {
      if (!Ao(I) || Wd(I))
        return !1;
      var U = vo(I) ? ge : me;
      return U.test(It(I));
    }
    function qd(I) {
      return Zt(I) && So(I.length) && !!K[Qt(I)];
    }
    function $d(I) {
      if (!Vd(I))
        return de(I);
      var U = [];
      for (var J in Object(I))
        le.call(I, J) && J != "constructor" && U.push(J);
      return U;
    }
    function Eo(I, U, J, ae, Pe, _e) {
      var Fe = J & o, xe = I.length, ke = U.length;
      if (xe != ke && !(Fe && ke > xe))
        return !1;
      var De = _e.get(I);
      if (De && _e.get(U))
        return De == U;
      var Ye = -1, rt = !0, $e = J & s ? new Lr() : void 0;
      for (_e.set(I, U), _e.set(U, I); ++Ye < xe; ) {
        var Qe = I[Ye], Ze = U[Ye];
        if (ae)
          var Et = Fe ? ae(Ze, Qe, Ye, U, I, _e) : ae(Qe, Ze, Ye, I, U, _e);
        if (Et !== void 0) {
          if (Et)
            continue;
          rt = !1;
          break;
        }
        if ($e) {
          if (!be(U, function(dt, Nt) {
            if (!ut($e, Nt) && (Qe === dt || Pe(Qe, dt, J, ae, _e)))
              return $e.push(Nt);
          })) {
            rt = !1;
            break;
          }
        } else if (!(Qe === Ze || Pe(Qe, Ze, J, ae, _e))) {
          rt = !1;
          break;
        }
      }
      return _e.delete(I), _e.delete(U), rt;
    }
    function Md(I, U, J, ae, Pe, _e, Fe) {
      switch (J) {
        case F:
          if (I.byteLength != U.byteLength || I.byteOffset != U.byteOffset)
            return !1;
          I = I.buffer, U = U.buffer;
        case x:
          return !(I.byteLength != U.byteLength || !_e(new W(I), new W(U)));
        case c:
        case d:
        case p:
          return yo(+I, +U);
        case f:
          return I.name == U.name && I.message == U.message;
        case k:
        case S:
          return I == U + "";
        case T:
          var xe = h;
        case R:
          var ke = ae & o;
          if (xe || (xe = X), I.size != U.size && !ke)
            return !1;
          var De = Fe.get(I);
          if (De)
            return De == U;
          ae |= s, Fe.set(I, U);
          var Ye = Eo(xe(I), xe(U), ae, Pe, _e, Fe);
          return Fe.delete(I), Ye;
        case w:
          if (dn)
            return dn.call(I) == dn.call(U);
      }
      return !1;
    }
    function Bd(I, U, J, ae, Pe, _e) {
      var Fe = J & o, xe = To(I), ke = xe.length, De = To(U), Ye = De.length;
      if (ke != Ye && !Fe)
        return !1;
      for (var rt = ke; rt--; ) {
        var $e = xe[rt];
        if (!(Fe ? $e in U : le.call(U, $e)))
          return !1;
      }
      var Qe = _e.get(I);
      if (Qe && _e.get(U))
        return Qe == U;
      var Ze = !0;
      _e.set(I, U), _e.set(U, I);
      for (var Et = Fe; ++rt < ke; ) {
        $e = xe[rt];
        var dt = I[$e], Nt = U[$e];
        if (ae)
          var _o = Fe ? ae(Nt, dt, $e, U, I, _e) : ae(dt, Nt, $e, I, U, _e);
        if (!(_o === void 0 ? dt === Nt || Pe(dt, Nt, J, ae, _e) : _o)) {
          Ze = !1;
          break;
        }
        Et || (Et = $e == "constructor");
      }
      if (Ze && !Et) {
        var Fr = I.constructor, xr = U.constructor;
        Fr != xr && "constructor" in I && "constructor" in U && !(typeof Fr == "function" && Fr instanceof Fr && typeof xr == "function" && xr instanceof xr) && (Ze = !1);
      }
      return _e.delete(I), _e.delete(U), Ze;
    }
    function To(I) {
      return Fd(I, Qd, jd);
    }
    function Dr(I, U) {
      var J = I.__data__;
      return Gd(U) ? J[typeof U == "string" ? "string" : "hash"] : J.map;
    }
    function Mt(I, U) {
      var J = ot(I, U);
      return kd(J) ? J : void 0;
    }
    function Hd(I) {
      var U = le.call(I, ie), J = I[ie];
      try {
        I[ie] = void 0;
        var ae = !0;
      } catch {
      }
      var Pe = Ie.call(I);
      return ae && (U ? I[ie] = J : delete I[ie]), Pe;
    }
    var jd = ee ? function(I) {
      return I == null ? [] : (I = Object(I), ye(ee(I), function(U) {
        return Y.call(I, U);
      }));
    } : Zd, mt = Qt;
    (Ae && mt(new Ae(new ArrayBuffer(1))) != F || Le && mt(new Le()) != T || Ue && mt(Ue.resolve()) != N || Oe && mt(new Oe()) != R || $t && mt(new $t()) != $) && (mt = function(I) {
      var U = Qt(I), J = U == b ? I.constructor : void 0, ae = J ? It(J) : "";
      if (ae)
        switch (ae) {
          case _t:
            return F;
          case ld:
            return T;
          case ud:
            return N;
          case cd:
            return R;
          case dd:
            return $;
        }
      return U;
    });
    function Xd(I, U) {
      return U = U ?? t, !!U && (typeof I == "number" || Te.test(I)) && I > -1 && I % 1 == 0 && I < U;
    }
    function Gd(I) {
      var U = typeof I;
      return U == "string" || U == "number" || U == "symbol" || U == "boolean" ? I !== "__proto__" : I === null;
    }
    function Wd(I) {
      return !!Re && Re in I;
    }
    function Vd(I) {
      var U = I && I.constructor, J = typeof U == "function" && U.prototype || te;
      return I === J;
    }
    function Yd(I) {
      return Ie.call(I);
    }
    function It(I) {
      if (I != null) {
        try {
          return se.call(I);
        } catch {
        }
        try {
          return I + "";
        } catch {
        }
      }
      return "";
    }
    function yo(I, U) {
      return I === U || I !== I && U !== U;
    }
    var zd = go(/* @__PURE__ */ (function() {
      return arguments;
    })()) ? go : function(I) {
      return Zt(I) && le.call(I, "callee") && !Y.call(I, "callee");
    }, Ur = Array.isArray;
    function Jd(I) {
      return I != null && So(I.length) && !vo(I);
    }
    var fn = oe || ef;
    function Kd(I, U) {
      return mo(I, U);
    }
    function vo(I) {
      if (!Ao(I))
        return !1;
      var U = Qt(I);
      return U == g || U == m || U == u || U == O;
    }
    function So(I) {
      return typeof I == "number" && I > -1 && I % 1 == 0 && I <= t;
    }
    function Ao(I) {
      var U = typeof I;
      return I != null && (U == "object" || U == "function");
    }
    function Zt(I) {
      return I != null && typeof I == "object";
    }
    var wo = we ? pt(we) : qd;
    function Qd(I) {
      return Jd(I) ? Ud(I) : $d(I);
    }
    function Zd() {
      return [];
    }
    function ef() {
      return !1;
    }
    e.exports = Kd;
  })(_r, _r.exports)), _r.exports;
}
var eu;
function cp() {
  if (eu) return Ht;
  eu = 1, Object.defineProperty(Ht, "__esModule", { value: !0 }), Ht.DownloadedUpdateHelper = void 0, Ht.createTempUpdateFile = l;
  const e = Je, n = Ce, r = up(), i = /* @__PURE__ */ wt(), o = Se;
  let s = class {
    constructor(u) {
      this.cacheDir = u, this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, this._downloadedFileInfo = null;
    }
    get downloadedFileInfo() {
      return this._downloadedFileInfo;
    }
    get file() {
      return this._file;
    }
    get packageFile() {
      return this._packageFile;
    }
    get cacheDirForPendingUpdate() {
      return o.join(this.cacheDir, "pending");
    }
    async validateDownloadedPath(u, c, d, f) {
      if (this.versionInfo != null && this.file === u && this.fileInfo != null)
        return r(this.versionInfo, c) && r(this.fileInfo.info, d.info) && await (0, i.pathExists)(u) ? u : null;
      const g = await this.getValidCachedUpdateFile(d, f);
      return g === null ? null : (f.info(`Update has already been downloaded to ${u}).`), this._file = g, g);
    }
    async setDownloadedFile(u, c, d, f, g, m) {
      this._file = u, this._packageFile = c, this.versionInfo = d, this.fileInfo = f, this._downloadedFileInfo = {
        fileName: g,
        sha512: f.info.sha512,
        isAdminRightsRequired: f.info.isAdminRightsRequired === !0
      }, m && await (0, i.outputJson)(this.getUpdateInfoFile(), this._downloadedFileInfo);
    }
    async clear() {
      this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, await this.cleanCacheDirForPendingUpdate();
    }
    async cleanCacheDirForPendingUpdate() {
      try {
        await (0, i.emptyDir)(this.cacheDirForPendingUpdate);
      } catch {
      }
    }
    /**
     * Returns "update-info.json" which is created in the update cache directory's "pending" subfolder after the first update is downloaded.  If the update file does not exist then the cache is cleared and recreated.  If the update file exists then its properties are validated.
     * @param fileInfo
     * @param logger
     */
    async getValidCachedUpdateFile(u, c) {
      const d = this.getUpdateInfoFile();
      if (!await (0, i.pathExists)(d))
        return null;
      let g;
      try {
        g = await (0, i.readJson)(d);
      } catch (v) {
        let b = "No cached update info available";
        return v.code !== "ENOENT" && (await this.cleanCacheDirForPendingUpdate(), b += ` (error on read: ${v.message})`), c.info(b), null;
      }
      if (!(g?.fileName !== null))
        return c.warn("Cached update info is corrupted: no fileName, directory for cached update will be cleaned"), await this.cleanCacheDirForPendingUpdate(), null;
      if (u.info.sha512 !== g.sha512)
        return c.info(`Cached update sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${g.sha512}, expected: ${u.info.sha512}. Directory for cached update will be cleaned`), await this.cleanCacheDirForPendingUpdate(), null;
      const T = o.join(this.cacheDirForPendingUpdate, g.fileName);
      if (!await (0, i.pathExists)(T))
        return c.info("Cached update file doesn't exist"), null;
      const p = await t(T);
      return u.info.sha512 !== p ? (c.warn(`Sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${p}, expected: ${u.info.sha512}`), await this.cleanCacheDirForPendingUpdate(), null) : (this._downloadedFileInfo = g, T);
    }
    getUpdateInfoFile() {
      return o.join(this.cacheDirForPendingUpdate, "update-info.json");
    }
  };
  Ht.DownloadedUpdateHelper = s;
  function t(a, u = "sha512", c = "base64", d) {
    return new Promise((f, g) => {
      const m = (0, e.createHash)(u);
      m.on("error", g).setEncoding(c), (0, n.createReadStream)(a, {
        ...d,
        highWaterMark: 1024 * 1024
        /* better to use more memory but hash faster */
      }).on("error", g).on("end", () => {
        m.end(), f(m.read());
      }).pipe(m, { end: !1 });
    });
  }
  async function l(a, u, c) {
    let d = 0, f = o.join(u, a);
    for (let g = 0; g < 3; g++)
      try {
        return await (0, i.unlink)(f), f;
      } catch (m) {
        if (m.code === "ENOENT")
          return f;
        c.warn(`Error on remove temp update file: ${m}`), f = o.join(u, `${d++}-${a}`);
      }
    return f;
  }
  return Ht;
}
var or = {}, Yr = {}, tu;
function dp() {
  if (tu) return Yr;
  tu = 1, Object.defineProperty(Yr, "__esModule", { value: !0 }), Yr.getAppCacheDir = r;
  const e = Se, n = At;
  function r() {
    const i = (0, n.homedir)();
    let o;
    return process.platform === "win32" ? o = process.env.LOCALAPPDATA || e.join(i, "AppData", "Local") : process.platform === "darwin" ? o = e.join(i, "Library", "Caches") : o = process.env.XDG_CACHE_HOME || e.join(i, ".cache"), o;
  }
  return Yr;
}
var ru;
function fp() {
  if (ru) return or;
  ru = 1, Object.defineProperty(or, "__esModule", { value: !0 }), or.ElectronAppAdapter = void 0;
  const e = Se, n = dp();
  let r = class {
    constructor(o = St.app) {
      this.app = o;
    }
    whenReady() {
      return this.app.whenReady();
    }
    get version() {
      return this.app.getVersion();
    }
    get name() {
      return this.app.getName();
    }
    get isPackaged() {
      return this.app.isPackaged === !0;
    }
    get appUpdateConfigPath() {
      return this.isPackaged ? e.join(process.resourcesPath, "app-update.yml") : e.join(this.app.getAppPath(), "dev-app-update.yml");
    }
    get userDataPath() {
      return this.app.getPath("userData");
    }
    get baseCachePath() {
      return (0, n.getAppCacheDir)();
    }
    quit() {
      this.app.quit();
    }
    relaunch() {
      this.app.relaunch();
    }
    onQuit(o) {
      this.app.once("quit", (s, t) => o(t));
    }
  };
  return or.ElectronAppAdapter = r, or;
}
var Es = {}, nu;
function hp() {
  return nu || (nu = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.ElectronHttpExecutor = e.NET_SESSION_NAME = void 0, e.getNetSession = r;
    const n = qe();
    e.NET_SESSION_NAME = "electron-updater";
    function r() {
      return St.session.fromPartition(e.NET_SESSION_NAME, {
        cache: !1
      });
    }
    class i extends n.HttpExecutor {
      constructor(s) {
        super(), this.proxyLoginCallback = s, this.cachedSession = null;
      }
      async download(s, t, l) {
        return await l.cancellationToken.createPromise((a, u, c) => {
          const d = {
            headers: l.headers || void 0,
            redirect: "manual"
          };
          (0, n.configureRequestUrl)(s, d), (0, n.configureRequestOptions)(d), this.doDownload(d, {
            destination: t,
            options: l,
            onCancel: c,
            callback: (f) => {
              f == null ? a(t) : u(f);
            },
            responseHandler: null
          }, 0);
        });
      }
      createRequest(s, t) {
        s.headers && s.headers.Host && (s.host = s.headers.Host, delete s.headers.Host), this.cachedSession == null && (this.cachedSession = r());
        const l = St.net.request({
          ...s,
          session: this.cachedSession
        });
        return l.on("response", t), this.proxyLoginCallback != null && l.on("login", this.proxyLoginCallback), l;
      }
      addRedirectHandlers(s, t, l, a, u) {
        s.on("redirect", (c, d, f) => {
          s.abort(), a > this.maxRedirects ? l(this.createMaxRedirectError()) : u(n.HttpExecutor.prepareRedirectUrlOptions(f, t));
        });
      }
    }
    e.ElectronHttpExecutor = i;
  })(Es)), Es;
}
var ar = {}, Dt = {}, Ts, iu;
function pp() {
  if (iu) return Ts;
  iu = 1;
  var e = "[object Symbol]", n = /[\\^$.*+?()[\]{}|]/g, r = RegExp(n.source), i = typeof nt == "object" && nt && nt.Object === Object && nt, o = typeof self == "object" && self && self.Object === Object && self, s = i || o || Function("return this")(), t = Object.prototype, l = t.toString, a = s.Symbol, u = a ? a.prototype : void 0, c = u ? u.toString : void 0;
  function d(p) {
    if (typeof p == "string")
      return p;
    if (g(p))
      return c ? c.call(p) : "";
    var v = p + "";
    return v == "0" && 1 / p == -1 / 0 ? "-0" : v;
  }
  function f(p) {
    return !!p && typeof p == "object";
  }
  function g(p) {
    return typeof p == "symbol" || f(p) && l.call(p) == e;
  }
  function m(p) {
    return p == null ? "" : d(p);
  }
  function T(p) {
    return p = m(p), p && r.test(p) ? p.replace(n, "\\$&") : p;
  }
  return Ts = T, Ts;
}
var su;
function xt() {
  if (su) return Dt;
  su = 1, Object.defineProperty(Dt, "__esModule", { value: !0 }), Dt.newBaseUrl = r, Dt.newUrlFromBase = i, Dt.getChannelFilename = o, Dt.blockmapFiles = s;
  const e = Vt, n = pp();
  function r(t) {
    const l = new e.URL(t);
    return l.pathname.endsWith("/") || (l.pathname += "/"), l;
  }
  function i(t, l, a = !1) {
    const u = new e.URL(t, l), c = l.search;
    return c != null && c.length !== 0 ? u.search = c : a && (u.search = `noCache=${Date.now().toString(32)}`), u;
  }
  function o(t) {
    return `${t}.yml`;
  }
  function s(t, l, a) {
    const u = i(`${t.pathname}.blockmap`, t);
    return [i(`${t.pathname.replace(new RegExp(n(a), "g"), l)}.blockmap`, t), u];
  }
  return Dt;
}
var ft = {}, ou;
function et() {
  if (ou) return ft;
  ou = 1, Object.defineProperty(ft, "__esModule", { value: !0 }), ft.Provider = void 0, ft.findFile = o, ft.parseUpdateInfo = s, ft.getFileList = t, ft.resolveFiles = l;
  const e = qe(), n = ro(), r = xt();
  let i = class {
    constructor(u) {
      this.runtimeOptions = u, this.requestHeaders = null, this.executor = u.executor;
    }
    get isUseMultipleRangeRequest() {
      return this.runtimeOptions.isUseMultipleRangeRequest !== !1;
    }
    getChannelFilePrefix() {
      if (this.runtimeOptions.platform === "linux") {
        const u = process.env.TEST_UPDATER_ARCH || process.arch;
        return "-linux" + (u === "x64" ? "" : `-${u}`);
      } else
        return this.runtimeOptions.platform === "darwin" ? "-mac" : "";
    }
    // due to historical reasons for windows we use channel name without platform specifier
    getDefaultChannelName() {
      return this.getCustomChannelName("latest");
    }
    getCustomChannelName(u) {
      return `${u}${this.getChannelFilePrefix()}`;
    }
    get fileExtraDownloadHeaders() {
      return null;
    }
    setRequestHeaders(u) {
      this.requestHeaders = u;
    }
    /**
     * Method to perform API request only to resolve update info, but not to download update.
     */
    httpRequest(u, c, d) {
      return this.executor.request(this.createRequestOptions(u, c), d);
    }
    createRequestOptions(u, c) {
      const d = {};
      return this.requestHeaders == null ? c != null && (d.headers = c) : d.headers = c == null ? this.requestHeaders : { ...this.requestHeaders, ...c }, (0, e.configureRequestUrl)(u, d), d;
    }
  };
  ft.Provider = i;
  function o(a, u, c) {
    if (a.length === 0)
      throw (0, e.newError)("No files provided", "ERR_UPDATER_NO_FILES_PROVIDED");
    const d = a.find((f) => f.url.pathname.toLowerCase().endsWith(`.${u}`));
    return d ?? (c == null ? a[0] : a.find((f) => !c.some((g) => f.url.pathname.toLowerCase().endsWith(`.${g}`))));
  }
  function s(a, u, c) {
    if (a == null)
      throw (0, e.newError)(`Cannot parse update info from ${u} in the latest release artifacts (${c}): rawData: null`, "ERR_UPDATER_INVALID_UPDATE_INFO");
    let d;
    try {
      d = (0, n.load)(a);
    } catch (f) {
      throw (0, e.newError)(`Cannot parse update info from ${u} in the latest release artifacts (${c}): ${f.stack || f.message}, rawData: ${a}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
    }
    return d;
  }
  function t(a) {
    const u = a.files;
    if (u != null && u.length > 0)
      return u;
    if (a.path != null)
      return [
        {
          url: a.path,
          sha2: a.sha2,
          sha512: a.sha512
        }
      ];
    throw (0, e.newError)(`No files provided: ${(0, e.safeStringifyJson)(a)}`, "ERR_UPDATER_NO_FILES_PROVIDED");
  }
  function l(a, u, c = (d) => d) {
    const f = t(a).map((T) => {
      if (T.sha2 == null && T.sha512 == null)
        throw (0, e.newError)(`Update info doesn't contain nor sha256 neither sha512 checksum: ${(0, e.safeStringifyJson)(T)}`, "ERR_UPDATER_NO_CHECKSUM");
      return {
        url: (0, r.newUrlFromBase)(c(T.url), u),
        info: T
      };
    }), g = a.packages, m = g == null ? null : g[process.arch] || g.ia32;
    return m != null && (f[0].packageInfo = {
      ...m,
      path: (0, r.newUrlFromBase)(c(m.path), u).href
    }), f;
  }
  return ft;
}
var au;
function Yc() {
  if (au) return ar;
  au = 1, Object.defineProperty(ar, "__esModule", { value: !0 }), ar.GenericProvider = void 0;
  const e = qe(), n = xt(), r = et();
  let i = class extends r.Provider {
    constructor(s, t, l) {
      super(l), this.configuration = s, this.updater = t, this.baseUrl = (0, n.newBaseUrl)(this.configuration.url);
    }
    get channel() {
      const s = this.updater.channel || this.configuration.channel;
      return s == null ? this.getDefaultChannelName() : this.getCustomChannelName(s);
    }
    async getLatestVersion() {
      const s = (0, n.getChannelFilename)(this.channel), t = (0, n.newUrlFromBase)(s, this.baseUrl, this.updater.isAddNoCacheQuery);
      for (let l = 0; ; l++)
        try {
          return (0, r.parseUpdateInfo)(await this.httpRequest(t), s, t);
        } catch (a) {
          if (a instanceof e.HttpError && a.statusCode === 404)
            throw (0, e.newError)(`Cannot find channel "${s}" update info: ${a.stack || a.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
          if (a.code === "ECONNREFUSED" && l < 3) {
            await new Promise((u, c) => {
              try {
                setTimeout(u, 1e3 * l);
              } catch (d) {
                c(d);
              }
            });
            continue;
          }
          throw a;
        }
    }
    resolveFiles(s) {
      return (0, r.resolveFiles)(s, this.baseUrl);
    }
  };
  return ar.GenericProvider = i, ar;
}
var lr = {}, ur = {}, lu;
function gp() {
  if (lu) return ur;
  lu = 1, Object.defineProperty(ur, "__esModule", { value: !0 }), ur.BitbucketProvider = void 0;
  const e = qe(), n = xt(), r = et();
  let i = class extends r.Provider {
    constructor(s, t, l) {
      super({
        ...l,
        isUseMultipleRangeRequest: !1
      }), this.configuration = s, this.updater = t;
      const { owner: a, slug: u } = s;
      this.baseUrl = (0, n.newBaseUrl)(`https://api.bitbucket.org/2.0/repositories/${a}/${u}/downloads`);
    }
    get channel() {
      return this.updater.channel || this.configuration.channel || "latest";
    }
    async getLatestVersion() {
      const s = new e.CancellationToken(), t = (0, n.getChannelFilename)(this.getCustomChannelName(this.channel)), l = (0, n.newUrlFromBase)(t, this.baseUrl, this.updater.isAddNoCacheQuery);
      try {
        const a = await this.httpRequest(l, void 0, s);
        return (0, r.parseUpdateInfo)(a, t, l);
      } catch (a) {
        throw (0, e.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${a.stack || a.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    resolveFiles(s) {
      return (0, r.resolveFiles)(s, this.baseUrl);
    }
    toString() {
      const { owner: s, slug: t } = this.configuration;
      return `Bitbucket (owner: ${s}, slug: ${t}, channel: ${this.channel})`;
    }
  };
  return ur.BitbucketProvider = i, ur;
}
var yt = {}, uu;
function zc() {
  if (uu) return yt;
  uu = 1, Object.defineProperty(yt, "__esModule", { value: !0 }), yt.GitHubProvider = yt.BaseGitHubProvider = void 0, yt.computeReleaseNotes = u;
  const e = qe(), n = Vc(), r = Vt, i = xt(), o = et(), s = /\/tag\/([^/]+)$/;
  class t extends o.Provider {
    constructor(d, f, g) {
      super({
        ...g,
        /* because GitHib uses S3 */
        isUseMultipleRangeRequest: !1
      }), this.options = d, this.baseUrl = (0, i.newBaseUrl)((0, e.githubUrl)(d, f));
      const m = f === "github.com" ? "api.github.com" : f;
      this.baseApiUrl = (0, i.newBaseUrl)((0, e.githubUrl)(d, m));
    }
    computeGithubBasePath(d) {
      const f = this.options.host;
      return f && !["github.com", "api.github.com"].includes(f) ? `/api/v3${d}` : d;
    }
  }
  yt.BaseGitHubProvider = t;
  let l = class extends t {
    constructor(d, f, g) {
      super(d, "github.com", g), this.options = d, this.updater = f;
    }
    get channel() {
      const d = this.updater.channel || this.options.channel;
      return d == null ? this.getDefaultChannelName() : this.getCustomChannelName(d);
    }
    async getLatestVersion() {
      var d, f, g, m, T;
      const p = new e.CancellationToken(), v = await this.httpRequest((0, i.newUrlFromBase)(`${this.basePath}.atom`, this.baseUrl), {
        accept: "application/xml, application/atom+xml, text/xml, */*"
      }, p), b = (0, e.parseXml)(v);
      let N = b.element("entry", !1, "No published versions on GitHub"), O = null;
      try {
        if (this.updater.allowPrerelease) {
          const $ = ((d = this.updater) === null || d === void 0 ? void 0 : d.channel) || ((f = n.prerelease(this.updater.currentVersion)) === null || f === void 0 ? void 0 : f[0]) || null;
          if ($ === null)
            O = s.exec(N.element("link").attribute("href"))[1];
          else
            for (const x of b.getElements("entry")) {
              const F = s.exec(x.element("link").attribute("href"));
              if (F === null)
                continue;
              const M = F[1], L = ((g = n.prerelease(M)) === null || g === void 0 ? void 0 : g[0]) || null, D = !$ || ["alpha", "beta"].includes($), j = L !== null && !["alpha", "beta"].includes(String(L));
              if (D && !j && !($ === "beta" && L === "alpha")) {
                O = M;
                break;
              }
              if (L && L === $) {
                O = M;
                break;
              }
            }
        } else {
          O = await this.getLatestTagName(p);
          for (const $ of b.getElements("entry"))
            if (s.exec($.element("link").attribute("href"))[1] === O) {
              N = $;
              break;
            }
        }
      } catch ($) {
        throw (0, e.newError)(`Cannot parse releases feed: ${$.stack || $.message},
XML:
${v}`, "ERR_UPDATER_INVALID_RELEASE_FEED");
      }
      if (O == null)
        throw (0, e.newError)("No published versions on GitHub", "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
      let k, R = "", S = "";
      const w = async ($) => {
        R = (0, i.getChannelFilename)($), S = (0, i.newUrlFromBase)(this.getBaseDownloadPath(String(O), R), this.baseUrl);
        const x = this.createRequestOptions(S);
        try {
          return await this.executor.request(x, p);
        } catch (F) {
          throw F instanceof e.HttpError && F.statusCode === 404 ? (0, e.newError)(`Cannot find ${R} in the latest release artifacts (${S}): ${F.stack || F.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : F;
        }
      };
      try {
        let $ = this.channel;
        this.updater.allowPrerelease && (!((m = n.prerelease(O)) === null || m === void 0) && m[0]) && ($ = this.getCustomChannelName(String((T = n.prerelease(O)) === null || T === void 0 ? void 0 : T[0]))), k = await w($);
      } catch ($) {
        if (this.updater.allowPrerelease)
          k = await w(this.getDefaultChannelName());
        else
          throw $;
      }
      const y = (0, o.parseUpdateInfo)(k, R, S);
      return y.releaseName == null && (y.releaseName = N.elementValueOrEmpty("title")), y.releaseNotes == null && (y.releaseNotes = u(this.updater.currentVersion, this.updater.fullChangelog, b, N)), {
        tag: O,
        ...y
      };
    }
    async getLatestTagName(d) {
      const f = this.options, g = f.host == null || f.host === "github.com" ? (0, i.newUrlFromBase)(`${this.basePath}/latest`, this.baseUrl) : new r.URL(`${this.computeGithubBasePath(`/repos/${f.owner}/${f.repo}/releases`)}/latest`, this.baseApiUrl);
      try {
        const m = await this.httpRequest(g, { Accept: "application/json" }, d);
        return m == null ? null : JSON.parse(m).tag_name;
      } catch (m) {
        throw (0, e.newError)(`Unable to find latest version on GitHub (${g}), please ensure a production release exists: ${m.stack || m.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    get basePath() {
      return `/${this.options.owner}/${this.options.repo}/releases`;
    }
    resolveFiles(d) {
      return (0, o.resolveFiles)(d, this.baseUrl, (f) => this.getBaseDownloadPath(d.tag, f.replace(/ /g, "-")));
    }
    getBaseDownloadPath(d, f) {
      return `${this.basePath}/download/${d}/${f}`;
    }
  };
  yt.GitHubProvider = l;
  function a(c) {
    const d = c.elementValueOrEmpty("content");
    return d === "No content." ? "" : d;
  }
  function u(c, d, f, g) {
    if (!d)
      return a(g);
    const m = [];
    for (const T of f.getElements("entry")) {
      const p = /\/tag\/v?([^/]+)$/.exec(T.element("link").attribute("href"))[1];
      n.lt(c, p) && m.push({
        version: p,
        note: a(T)
      });
    }
    return m.sort((T, p) => n.rcompare(T.version, p.version));
  }
  return yt;
}
var cr = {}, cu;
function mp() {
  if (cu) return cr;
  cu = 1, Object.defineProperty(cr, "__esModule", { value: !0 }), cr.KeygenProvider = void 0;
  const e = qe(), n = xt(), r = et();
  let i = class extends r.Provider {
    constructor(s, t, l) {
      super({
        ...l,
        isUseMultipleRangeRequest: !1
      }), this.configuration = s, this.updater = t, this.defaultHostname = "api.keygen.sh";
      const a = this.configuration.host || this.defaultHostname;
      this.baseUrl = (0, n.newBaseUrl)(`https://${a}/v1/accounts/${this.configuration.account}/artifacts?product=${this.configuration.product}`);
    }
    get channel() {
      return this.updater.channel || this.configuration.channel || "stable";
    }
    async getLatestVersion() {
      const s = new e.CancellationToken(), t = (0, n.getChannelFilename)(this.getCustomChannelName(this.channel)), l = (0, n.newUrlFromBase)(t, this.baseUrl, this.updater.isAddNoCacheQuery);
      try {
        const a = await this.httpRequest(l, {
          Accept: "application/vnd.api+json",
          "Keygen-Version": "1.1"
        }, s);
        return (0, r.parseUpdateInfo)(a, t, l);
      } catch (a) {
        throw (0, e.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${a.stack || a.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    resolveFiles(s) {
      return (0, r.resolveFiles)(s, this.baseUrl);
    }
    toString() {
      const { account: s, product: t, platform: l } = this.configuration;
      return `Keygen (account: ${s}, product: ${t}, platform: ${l}, channel: ${this.channel})`;
    }
  };
  return cr.KeygenProvider = i, cr;
}
var dr = {}, du;
function Ep() {
  if (du) return dr;
  du = 1, Object.defineProperty(dr, "__esModule", { value: !0 }), dr.PrivateGitHubProvider = void 0;
  const e = qe(), n = ro(), r = Se, i = Vt, o = xt(), s = zc(), t = et();
  let l = class extends s.BaseGitHubProvider {
    constructor(u, c, d, f) {
      super(u, "api.github.com", f), this.updater = c, this.token = d;
    }
    createRequestOptions(u, c) {
      const d = super.createRequestOptions(u, c);
      return d.redirect = "manual", d;
    }
    async getLatestVersion() {
      const u = new e.CancellationToken(), c = (0, o.getChannelFilename)(this.getDefaultChannelName()), d = await this.getLatestVersionInfo(u), f = d.assets.find((T) => T.name === c);
      if (f == null)
        throw (0, e.newError)(`Cannot find ${c} in the release ${d.html_url || d.name}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
      const g = new i.URL(f.url);
      let m;
      try {
        m = (0, n.load)(await this.httpRequest(g, this.configureHeaders("application/octet-stream"), u));
      } catch (T) {
        throw T instanceof e.HttpError && T.statusCode === 404 ? (0, e.newError)(`Cannot find ${c} in the latest release artifacts (${g}): ${T.stack || T.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : T;
      }
      return m.assets = d.assets, m;
    }
    get fileExtraDownloadHeaders() {
      return this.configureHeaders("application/octet-stream");
    }
    configureHeaders(u) {
      return {
        accept: u,
        authorization: `token ${this.token}`
      };
    }
    async getLatestVersionInfo(u) {
      const c = this.updater.allowPrerelease;
      let d = this.basePath;
      c || (d = `${d}/latest`);
      const f = (0, o.newUrlFromBase)(d, this.baseUrl);
      try {
        const g = JSON.parse(await this.httpRequest(f, this.configureHeaders("application/vnd.github.v3+json"), u));
        return c ? g.find((m) => m.prerelease) || g[0] : g;
      } catch (g) {
        throw (0, e.newError)(`Unable to find latest version on GitHub (${f}), please ensure a production release exists: ${g.stack || g.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    get basePath() {
      return this.computeGithubBasePath(`/repos/${this.options.owner}/${this.options.repo}/releases`);
    }
    resolveFiles(u) {
      return (0, t.getFileList)(u).map((c) => {
        const d = r.posix.basename(c.url).replace(/ /g, "-"), f = u.assets.find((g) => g != null && g.name === d);
        if (f == null)
          throw (0, e.newError)(`Cannot find asset "${d}" in: ${JSON.stringify(u.assets, null, 2)}`, "ERR_UPDATER_ASSET_NOT_FOUND");
        return {
          url: new i.URL(f.url),
          info: c
        };
      });
    }
  };
  return dr.PrivateGitHubProvider = l, dr;
}
var fu;
function Tp() {
  if (fu) return lr;
  fu = 1, Object.defineProperty(lr, "__esModule", { value: !0 }), lr.isUrlProbablySupportMultiRangeRequests = t, lr.createClient = l;
  const e = qe(), n = gp(), r = Yc(), i = zc(), o = mp(), s = Ep();
  function t(a) {
    return !a.includes("s3.amazonaws.com");
  }
  function l(a, u, c) {
    if (typeof a == "string")
      throw (0, e.newError)("Please pass PublishConfiguration object", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
    const d = a.provider;
    switch (d) {
      case "github": {
        const f = a, g = (f.private ? process.env.GH_TOKEN || process.env.GITHUB_TOKEN : null) || f.token;
        return g == null ? new i.GitHubProvider(f, u, c) : new s.PrivateGitHubProvider(f, u, g, c);
      }
      case "bitbucket":
        return new n.BitbucketProvider(a, u, c);
      case "keygen":
        return new o.KeygenProvider(a, u, c);
      case "s3":
      case "spaces":
        return new r.GenericProvider({
          provider: "generic",
          url: (0, e.getS3LikeProviderBaseUrl)(a),
          channel: a.channel || null
        }, u, {
          ...c,
          // https://github.com/minio/minio/issues/5285#issuecomment-350428955
          isUseMultipleRangeRequest: !1
        });
      case "generic": {
        const f = a;
        return new r.GenericProvider(f, u, {
          ...c,
          isUseMultipleRangeRequest: f.useMultipleRangeRequest !== !1 && t(f.url)
        });
      }
      case "custom": {
        const f = a, g = f.updateProvider;
        if (!g)
          throw (0, e.newError)("Custom provider not specified", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
        return new g(f, u, c);
      }
      default:
        throw (0, e.newError)(`Unsupported provider: ${d}`, "ERR_UPDATER_UNSUPPORTED_PROVIDER");
    }
  }
  return lr;
}
var fr = {}, hr = {}, jt = {}, Xt = {}, hu;
function uo() {
  if (hu) return Xt;
  hu = 1, Object.defineProperty(Xt, "__esModule", { value: !0 }), Xt.OperationKind = void 0, Xt.computeOperations = n;
  var e;
  (function(t) {
    t[t.COPY = 0] = "COPY", t[t.DOWNLOAD = 1] = "DOWNLOAD";
  })(e || (Xt.OperationKind = e = {}));
  function n(t, l, a) {
    const u = s(t.files), c = s(l.files);
    let d = null;
    const f = l.files[0], g = [], m = f.name, T = u.get(m);
    if (T == null)
      throw new Error(`no file ${m} in old blockmap`);
    const p = c.get(m);
    let v = 0;
    const { checksumToOffset: b, checksumToOldSize: N } = o(u.get(m), T.offset, a);
    let O = f.offset;
    for (let k = 0; k < p.checksums.length; O += p.sizes[k], k++) {
      const R = p.sizes[k], S = p.checksums[k];
      let w = b.get(S);
      w != null && N.get(S) !== R && (a.warn(`Checksum ("${S}") matches, but size differs (old: ${N.get(S)}, new: ${R})`), w = void 0), w === void 0 ? (v++, d != null && d.kind === e.DOWNLOAD && d.end === O ? d.end += R : (d = {
        kind: e.DOWNLOAD,
        start: O,
        end: O + R
        // oldBlocks: null,
      }, i(d, g, S, k))) : d != null && d.kind === e.COPY && d.end === w ? d.end += R : (d = {
        kind: e.COPY,
        start: w,
        end: w + R
        // oldBlocks: [checksum]
      }, i(d, g, S, k));
    }
    return v > 0 && a.info(`File${f.name === "file" ? "" : " " + f.name} has ${v} changed blocks`), g;
  }
  const r = process.env.DIFFERENTIAL_DOWNLOAD_PLAN_BUILDER_VALIDATE_RANGES === "true";
  function i(t, l, a, u) {
    if (r && l.length !== 0) {
      const c = l[l.length - 1];
      if (c.kind === t.kind && t.start < c.end && t.start > c.start) {
        const d = [c.start, c.end, t.start, t.end].reduce((f, g) => f < g ? f : g);
        throw new Error(`operation (block index: ${u}, checksum: ${a}, kind: ${e[t.kind]}) overlaps previous operation (checksum: ${a}):
abs: ${c.start} until ${c.end} and ${t.start} until ${t.end}
rel: ${c.start - d} until ${c.end - d} and ${t.start - d} until ${t.end - d}`);
      }
    }
    l.push(t);
  }
  function o(t, l, a) {
    const u = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map();
    let d = l;
    for (let f = 0; f < t.checksums.length; f++) {
      const g = t.checksums[f], m = t.sizes[f], T = c.get(g);
      if (T === void 0)
        u.set(g, d), c.set(g, m);
      else if (a.debug != null) {
        const p = T === m ? "(same size)" : `(size: ${T}, this size: ${m})`;
        a.debug(`${g} duplicated in blockmap ${p}, it doesn't lead to broken differential downloader, just corresponding block will be skipped)`);
      }
      d += m;
    }
    return { checksumToOffset: u, checksumToOldSize: c };
  }
  function s(t) {
    const l = /* @__PURE__ */ new Map();
    for (const a of t)
      l.set(a.name, a);
    return l;
  }
  return Xt;
}
var pu;
function Jc() {
  if (pu) return jt;
  pu = 1, Object.defineProperty(jt, "__esModule", { value: !0 }), jt.DataSplitter = void 0, jt.copyData = t;
  const e = qe(), n = Ce, r = br, i = uo(), o = Buffer.from(`\r
\r
`);
  var s;
  (function(a) {
    a[a.INIT = 0] = "INIT", a[a.HEADER = 1] = "HEADER", a[a.BODY = 2] = "BODY";
  })(s || (s = {}));
  function t(a, u, c, d, f) {
    const g = (0, n.createReadStream)("", {
      fd: c,
      autoClose: !1,
      start: a.start,
      // end is inclusive
      end: a.end - 1
    });
    g.on("error", d), g.once("end", f), g.pipe(u, {
      end: !1
    });
  }
  let l = class extends r.Writable {
    constructor(u, c, d, f, g, m) {
      super(), this.out = u, this.options = c, this.partIndexToTaskIndex = d, this.partIndexToLength = g, this.finishHandler = m, this.partIndex = -1, this.headerListBuffer = null, this.readState = s.INIT, this.ignoreByteCount = 0, this.remainingPartDataCount = 0, this.actualPartLength = 0, this.boundaryLength = f.length + 4, this.ignoreByteCount = this.boundaryLength - 2;
    }
    get isFinished() {
      return this.partIndex === this.partIndexToLength.length;
    }
    // noinspection JSUnusedGlobalSymbols
    _write(u, c, d) {
      if (this.isFinished) {
        console.error(`Trailing ignored data: ${u.length} bytes`);
        return;
      }
      this.handleData(u).then(d).catch(d);
    }
    async handleData(u) {
      let c = 0;
      if (this.ignoreByteCount !== 0 && this.remainingPartDataCount !== 0)
        throw (0, e.newError)("Internal error", "ERR_DATA_SPLITTER_BYTE_COUNT_MISMATCH");
      if (this.ignoreByteCount > 0) {
        const d = Math.min(this.ignoreByteCount, u.length);
        this.ignoreByteCount -= d, c = d;
      } else if (this.remainingPartDataCount > 0) {
        const d = Math.min(this.remainingPartDataCount, u.length);
        this.remainingPartDataCount -= d, await this.processPartData(u, 0, d), c = d;
      }
      if (c !== u.length) {
        if (this.readState === s.HEADER) {
          const d = this.searchHeaderListEnd(u, c);
          if (d === -1)
            return;
          c = d, this.readState = s.BODY, this.headerListBuffer = null;
        }
        for (; ; ) {
          if (this.readState === s.BODY)
            this.readState = s.INIT;
          else {
            this.partIndex++;
            let m = this.partIndexToTaskIndex.get(this.partIndex);
            if (m == null)
              if (this.isFinished)
                m = this.options.end;
              else
                throw (0, e.newError)("taskIndex is null", "ERR_DATA_SPLITTER_TASK_INDEX_IS_NULL");
            const T = this.partIndex === 0 ? this.options.start : this.partIndexToTaskIndex.get(this.partIndex - 1) + 1;
            if (T < m)
              await this.copyExistingData(T, m);
            else if (T > m)
              throw (0, e.newError)("prevTaskIndex must be < taskIndex", "ERR_DATA_SPLITTER_TASK_INDEX_ASSERT_FAILED");
            if (this.isFinished) {
              this.onPartEnd(), this.finishHandler();
              return;
            }
            if (c = this.searchHeaderListEnd(u, c), c === -1) {
              this.readState = s.HEADER;
              return;
            }
          }
          const d = this.partIndexToLength[this.partIndex], f = c + d, g = Math.min(f, u.length);
          if (await this.processPartStarted(u, c, g), this.remainingPartDataCount = d - (g - c), this.remainingPartDataCount > 0)
            return;
          if (c = f + this.boundaryLength, c >= u.length) {
            this.ignoreByteCount = this.boundaryLength - (u.length - f);
            return;
          }
        }
      }
    }
    copyExistingData(u, c) {
      return new Promise((d, f) => {
        const g = () => {
          if (u === c) {
            d();
            return;
          }
          const m = this.options.tasks[u];
          if (m.kind !== i.OperationKind.COPY) {
            f(new Error("Task kind must be COPY"));
            return;
          }
          t(m, this.out, this.options.oldFileFd, f, () => {
            u++, g();
          });
        };
        g();
      });
    }
    searchHeaderListEnd(u, c) {
      const d = u.indexOf(o, c);
      if (d !== -1)
        return d + o.length;
      const f = c === 0 ? u : u.slice(c);
      return this.headerListBuffer == null ? this.headerListBuffer = f : this.headerListBuffer = Buffer.concat([this.headerListBuffer, f]), -1;
    }
    onPartEnd() {
      const u = this.partIndexToLength[this.partIndex - 1];
      if (this.actualPartLength !== u)
        throw (0, e.newError)(`Expected length: ${u} differs from actual: ${this.actualPartLength}`, "ERR_DATA_SPLITTER_LENGTH_MISMATCH");
      this.actualPartLength = 0;
    }
    processPartStarted(u, c, d) {
      return this.partIndex !== 0 && this.onPartEnd(), this.processPartData(u, c, d);
    }
    processPartData(u, c, d) {
      this.actualPartLength += d - c;
      const f = this.out;
      return f.write(c === 0 && u.length === d ? u : u.slice(c, d)) ? Promise.resolve() : new Promise((g, m) => {
        f.on("error", m), f.once("drain", () => {
          f.removeListener("error", m), g();
        });
      });
    }
  };
  return jt.DataSplitter = l, jt;
}
var pr = {}, gu;
function yp() {
  if (gu) return pr;
  gu = 1, Object.defineProperty(pr, "__esModule", { value: !0 }), pr.executeTasksUsingMultipleRangeRequests = i, pr.checkIsRangesSupported = s;
  const e = qe(), n = Jc(), r = uo();
  function i(t, l, a, u, c) {
    const d = (f) => {
      if (f >= l.length) {
        t.fileMetadataBuffer != null && a.write(t.fileMetadataBuffer), a.end();
        return;
      }
      const g = f + 1e3;
      o(t, {
        tasks: l,
        start: f,
        end: Math.min(l.length, g),
        oldFileFd: u
      }, a, () => d(g), c);
    };
    return d;
  }
  function o(t, l, a, u, c) {
    let d = "bytes=", f = 0;
    const g = /* @__PURE__ */ new Map(), m = [];
    for (let v = l.start; v < l.end; v++) {
      const b = l.tasks[v];
      b.kind === r.OperationKind.DOWNLOAD && (d += `${b.start}-${b.end - 1}, `, g.set(f, v), f++, m.push(b.end - b.start));
    }
    if (f <= 1) {
      const v = (b) => {
        if (b >= l.end) {
          u();
          return;
        }
        const N = l.tasks[b++];
        if (N.kind === r.OperationKind.COPY)
          (0, n.copyData)(N, a, l.oldFileFd, c, () => v(b));
        else {
          const O = t.createRequestOptions();
          O.headers.Range = `bytes=${N.start}-${N.end - 1}`;
          const k = t.httpExecutor.createRequest(O, (R) => {
            s(R, c) && (R.pipe(a, {
              end: !1
            }), R.once("end", () => v(b)));
          });
          t.httpExecutor.addErrorAndTimeoutHandlers(k, c), k.end();
        }
      };
      v(l.start);
      return;
    }
    const T = t.createRequestOptions();
    T.headers.Range = d.substring(0, d.length - 2);
    const p = t.httpExecutor.createRequest(T, (v) => {
      if (!s(v, c))
        return;
      const b = (0, e.safeGetHeader)(v, "content-type"), N = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i.exec(b);
      if (N == null) {
        c(new Error(`Content-Type "multipart/byteranges" is expected, but got "${b}"`));
        return;
      }
      const O = new n.DataSplitter(a, l, g, N[1] || N[2], m, u);
      O.on("error", c), v.pipe(O), v.on("end", () => {
        setTimeout(() => {
          p.abort(), c(new Error("Response ends without calling any handlers"));
        }, 1e4);
      });
    });
    t.httpExecutor.addErrorAndTimeoutHandlers(p, c), p.end();
  }
  function s(t, l) {
    if (t.statusCode >= 400)
      return l((0, e.createHttpError)(t)), !1;
    if (t.statusCode !== 206) {
      const a = (0, e.safeGetHeader)(t, "accept-ranges");
      if (a == null || a === "none")
        return l(new Error(`Server doesn't support Accept-Ranges (response code ${t.statusCode})`)), !1;
    }
    return !0;
  }
  return pr;
}
var gr = {}, mu;
function vp() {
  if (mu) return gr;
  mu = 1, Object.defineProperty(gr, "__esModule", { value: !0 }), gr.ProgressDifferentialDownloadCallbackTransform = void 0;
  const e = br;
  var n;
  (function(i) {
    i[i.COPY = 0] = "COPY", i[i.DOWNLOAD = 1] = "DOWNLOAD";
  })(n || (n = {}));
  let r = class extends e.Transform {
    constructor(o, s, t) {
      super(), this.progressDifferentialDownloadInfo = o, this.cancellationToken = s, this.onProgress = t, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.expectedBytes = 0, this.index = 0, this.operationType = n.COPY, this.nextUpdate = this.start + 1e3;
    }
    _transform(o, s, t) {
      if (this.cancellationToken.cancelled) {
        t(new Error("cancelled"), null);
        return;
      }
      if (this.operationType == n.COPY) {
        t(null, o);
        return;
      }
      this.transferred += o.length, this.delta += o.length;
      const l = Date.now();
      l >= this.nextUpdate && this.transferred !== this.expectedBytes && this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && (this.nextUpdate = l + 1e3, this.onProgress({
        total: this.progressDifferentialDownloadInfo.grandTotal,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
        bytesPerSecond: Math.round(this.transferred / ((l - this.start) / 1e3))
      }), this.delta = 0), t(null, o);
    }
    beginFileCopy() {
      this.operationType = n.COPY;
    }
    beginRangeDownload() {
      this.operationType = n.DOWNLOAD, this.expectedBytes += this.progressDifferentialDownloadInfo.expectedByteCounts[this.index++];
    }
    endRangeDownload() {
      this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && this.onProgress({
        total: this.progressDifferentialDownloadInfo.grandTotal,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
        bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
      });
    }
    // Called when we are 100% done with the connection/download
    _flush(o) {
      if (this.cancellationToken.cancelled) {
        o(new Error("cancelled"));
        return;
      }
      this.onProgress({
        total: this.progressDifferentialDownloadInfo.grandTotal,
        delta: this.delta,
        transferred: this.transferred,
        percent: 100,
        bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
      }), this.delta = 0, this.transferred = 0, o(null);
    }
  };
  return gr.ProgressDifferentialDownloadCallbackTransform = r, gr;
}
var Eu;
function Kc() {
  if (Eu) return hr;
  Eu = 1, Object.defineProperty(hr, "__esModule", { value: !0 }), hr.DifferentialDownloader = void 0;
  const e = qe(), n = /* @__PURE__ */ wt(), r = Ce, i = Jc(), o = Vt, s = uo(), t = yp(), l = vp();
  let a = class {
    // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
    constructor(f, g, m) {
      this.blockAwareFileInfo = f, this.httpExecutor = g, this.options = m, this.fileMetadataBuffer = null, this.logger = m.logger;
    }
    createRequestOptions() {
      const f = {
        headers: {
          ...this.options.requestHeaders,
          accept: "*/*"
        }
      };
      return (0, e.configureRequestUrl)(this.options.newUrl, f), (0, e.configureRequestOptions)(f), f;
    }
    doDownload(f, g) {
      if (f.version !== g.version)
        throw new Error(`version is different (${f.version} - ${g.version}), full download is required`);
      const m = this.logger, T = (0, s.computeOperations)(f, g, m);
      m.debug != null && m.debug(JSON.stringify(T, null, 2));
      let p = 0, v = 0;
      for (const N of T) {
        const O = N.end - N.start;
        N.kind === s.OperationKind.DOWNLOAD ? p += O : v += O;
      }
      const b = this.blockAwareFileInfo.size;
      if (p + v + (this.fileMetadataBuffer == null ? 0 : this.fileMetadataBuffer.length) !== b)
        throw new Error(`Internal error, size mismatch: downloadSize: ${p}, copySize: ${v}, newSize: ${b}`);
      return m.info(`Full: ${u(b)}, To download: ${u(p)} (${Math.round(p / (b / 100))}%)`), this.downloadFile(T);
    }
    downloadFile(f) {
      const g = [], m = () => Promise.all(g.map((T) => (0, n.close)(T.descriptor).catch((p) => {
        this.logger.error(`cannot close file "${T.path}": ${p}`);
      })));
      return this.doDownloadFile(f, g).then(m).catch((T) => m().catch((p) => {
        try {
          this.logger.error(`cannot close files: ${p}`);
        } catch (v) {
          try {
            console.error(v);
          } catch {
          }
        }
        throw T;
      }).then(() => {
        throw T;
      }));
    }
    async doDownloadFile(f, g) {
      const m = await (0, n.open)(this.options.oldFile, "r");
      g.push({ descriptor: m, path: this.options.oldFile });
      const T = await (0, n.open)(this.options.newFile, "w");
      g.push({ descriptor: T, path: this.options.newFile });
      const p = (0, r.createWriteStream)(this.options.newFile, { fd: T });
      await new Promise((v, b) => {
        const N = [];
        let O;
        if (!this.options.isUseMultipleRangeRequest && this.options.onProgress) {
          const F = [];
          let M = 0;
          for (const D of f)
            D.kind === s.OperationKind.DOWNLOAD && (F.push(D.end - D.start), M += D.end - D.start);
          const L = {
            expectedByteCounts: F,
            grandTotal: M
          };
          O = new l.ProgressDifferentialDownloadCallbackTransform(L, this.options.cancellationToken, this.options.onProgress), N.push(O);
        }
        const k = new e.DigestTransform(this.blockAwareFileInfo.sha512);
        k.isValidateOnEnd = !1, N.push(k), p.on("finish", () => {
          p.close(() => {
            g.splice(1, 1);
            try {
              k.validate();
            } catch (F) {
              b(F);
              return;
            }
            v(void 0);
          });
        }), N.push(p);
        let R = null;
        for (const F of N)
          F.on("error", b), R == null ? R = F : R = R.pipe(F);
        const S = N[0];
        let w;
        if (this.options.isUseMultipleRangeRequest) {
          w = (0, t.executeTasksUsingMultipleRangeRequests)(this, f, S, m, b), w(0);
          return;
        }
        let y = 0, $ = null;
        this.logger.info(`Differential download: ${this.options.newUrl}`);
        const x = this.createRequestOptions();
        x.redirect = "manual", w = (F) => {
          var M, L;
          if (F >= f.length) {
            this.fileMetadataBuffer != null && S.write(this.fileMetadataBuffer), S.end();
            return;
          }
          const D = f[F++];
          if (D.kind === s.OperationKind.COPY) {
            O && O.beginFileCopy(), (0, i.copyData)(D, S, m, b, () => w(F));
            return;
          }
          const j = `bytes=${D.start}-${D.end - 1}`;
          x.headers.range = j, (L = (M = this.logger) === null || M === void 0 ? void 0 : M.debug) === null || L === void 0 || L.call(M, `download range: ${j}`), O && O.beginRangeDownload();
          const C = this.httpExecutor.createRequest(x, (Q) => {
            Q.on("error", b), Q.on("aborted", () => {
              b(new Error("response has been aborted by the server"));
            }), Q.statusCode >= 400 && b((0, e.createHttpError)(Q)), Q.pipe(S, {
              end: !1
            }), Q.once("end", () => {
              O && O.endRangeDownload(), ++y === 100 ? (y = 0, setTimeout(() => w(F), 1e3)) : w(F);
            });
          });
          C.on("redirect", (Q, V, ne) => {
            this.logger.info(`Redirect to ${c(ne)}`), $ = ne, (0, e.configureRequestUrl)(new o.URL($), x), C.followRedirect();
          }), this.httpExecutor.addErrorAndTimeoutHandlers(C, b), C.end();
        }, w(0);
      });
    }
    async readRemoteBytes(f, g) {
      const m = Buffer.allocUnsafe(g + 1 - f), T = this.createRequestOptions();
      T.headers.range = `bytes=${f}-${g}`;
      let p = 0;
      if (await this.request(T, (v) => {
        v.copy(m, p), p += v.length;
      }), p !== m.length)
        throw new Error(`Received data length ${p} is not equal to expected ${m.length}`);
      return m;
    }
    request(f, g) {
      return new Promise((m, T) => {
        const p = this.httpExecutor.createRequest(f, (v) => {
          (0, t.checkIsRangesSupported)(v, T) && (v.on("error", T), v.on("aborted", () => {
            T(new Error("response has been aborted by the server"));
          }), v.on("data", g), v.on("end", () => m()));
        });
        this.httpExecutor.addErrorAndTimeoutHandlers(p, T), p.end();
      });
    }
  };
  hr.DifferentialDownloader = a;
  function u(d, f = " KB") {
    return new Intl.NumberFormat("en").format((d / 1024).toFixed(2)) + f;
  }
  function c(d) {
    const f = d.indexOf("?");
    return f < 0 ? d : d.substring(0, f);
  }
  return hr;
}
var Tu;
function Sp() {
  if (Tu) return fr;
  Tu = 1, Object.defineProperty(fr, "__esModule", { value: !0 }), fr.GenericDifferentialDownloader = void 0;
  const e = Kc();
  let n = class extends e.DifferentialDownloader {
    download(i, o) {
      return this.doDownload(i, o);
    }
  };
  return fr.GenericDifferentialDownloader = n, fr;
}
var ys = {}, yu;
function kt() {
  return yu || (yu = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.UpdaterSignal = e.UPDATE_DOWNLOADED = e.DOWNLOAD_PROGRESS = e.CancellationToken = void 0, e.addHandler = i;
    const n = qe();
    Object.defineProperty(e, "CancellationToken", { enumerable: !0, get: function() {
      return n.CancellationToken;
    } }), e.DOWNLOAD_PROGRESS = "download-progress", e.UPDATE_DOWNLOADED = "update-downloaded";
    class r {
      constructor(s) {
        this.emitter = s;
      }
      /**
       * Emitted when an authenticating proxy is [asking for user credentials](https://github.com/electron/electron/blob/master/docs/api/client-request.md#event-login).
       */
      login(s) {
        i(this.emitter, "login", s);
      }
      progress(s) {
        i(this.emitter, e.DOWNLOAD_PROGRESS, s);
      }
      updateDownloaded(s) {
        i(this.emitter, e.UPDATE_DOWNLOADED, s);
      }
      updateCancelled(s) {
        i(this.emitter, "update-cancelled", s);
      }
    }
    e.UpdaterSignal = r;
    function i(o, s, t) {
      o.on(s, t);
    }
  })(ys)), ys;
}
var vu;
function co() {
  if (vu) return Ct;
  vu = 1, Object.defineProperty(Ct, "__esModule", { value: !0 }), Ct.NoOpLogger = Ct.AppUpdater = void 0;
  const e = qe(), n = Je, r = At, i = en, o = /* @__PURE__ */ wt(), s = ro(), t = qh(), l = Se, a = Vc(), u = cp(), c = fp(), d = hp(), f = Yc(), g = Tp(), m = Ec, T = xt(), p = Sp(), v = kt();
  let b = class Qc extends i.EventEmitter {
    /**
     * Get the update channel. Doesn't return `channel` from the update configuration, only if was previously set.
     */
    get channel() {
      return this._channel;
    }
    /**
     * Set the update channel. Overrides `channel` in the update configuration.
     *
     * `allowDowngrade` will be automatically set to `true`. If this behavior is not suitable for you, simple set `allowDowngrade` explicitly after.
     */
    set channel(R) {
      if (this._channel != null) {
        if (typeof R != "string")
          throw (0, e.newError)(`Channel must be a string, but got: ${R}`, "ERR_UPDATER_INVALID_CHANNEL");
        if (R.length === 0)
          throw (0, e.newError)("Channel must be not an empty string", "ERR_UPDATER_INVALID_CHANNEL");
      }
      this._channel = R, this.allowDowngrade = !0;
    }
    /**
     *  Shortcut for explicitly adding auth tokens to request headers
     */
    addAuthHeader(R) {
      this.requestHeaders = Object.assign({}, this.requestHeaders, {
        authorization: R
      });
    }
    // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    get netSession() {
      return (0, d.getNetSession)();
    }
    /**
     * The logger. You can pass [electron-log](https://github.com/megahertz/electron-log), [winston](https://github.com/winstonjs/winston) or another logger with the following interface: `{ info(), warn(), error() }`.
     * Set it to `null` if you would like to disable a logging feature.
     */
    get logger() {
      return this._logger;
    }
    set logger(R) {
      this._logger = R ?? new O();
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * test only
     * @private
     */
    set updateConfigPath(R) {
      this.clientPromise = null, this._appUpdateConfigPath = R, this.configOnDisk = new t.Lazy(() => this.loadUpdateConfig());
    }
    /**
     * Allows developer to override default logic for determining if an update is supported.
     * The default logic compares the `UpdateInfo` minimum system version against the `os.release()` with `semver` package
     */
    get isUpdateSupported() {
      return this._isUpdateSupported;
    }
    set isUpdateSupported(R) {
      R && (this._isUpdateSupported = R);
    }
    constructor(R, S) {
      super(), this.autoDownload = !0, this.autoInstallOnAppQuit = !0, this.autoRunAppAfterInstall = !0, this.allowPrerelease = !1, this.fullChangelog = !1, this.allowDowngrade = !1, this.disableWebInstaller = !1, this.disableDifferentialDownload = !1, this.forceDevUpdateConfig = !1, this._channel = null, this.downloadedUpdateHelper = null, this.requestHeaders = null, this._logger = console, this.signals = new v.UpdaterSignal(this), this._appUpdateConfigPath = null, this._isUpdateSupported = ($) => this.checkIfUpdateSupported($), this.clientPromise = null, this.stagingUserIdPromise = new t.Lazy(() => this.getOrCreateStagingUserId()), this.configOnDisk = new t.Lazy(() => this.loadUpdateConfig()), this.checkForUpdatesPromise = null, this.downloadPromise = null, this.updateInfoAndProvider = null, this._testOnlyOptions = null, this.on("error", ($) => {
        this._logger.error(`Error: ${$.stack || $.message}`);
      }), S == null ? (this.app = new c.ElectronAppAdapter(), this.httpExecutor = new d.ElectronHttpExecutor(($, x) => this.emit("login", $, x))) : (this.app = S, this.httpExecutor = null);
      const w = this.app.version, y = (0, a.parse)(w);
      if (y == null)
        throw (0, e.newError)(`App version is not a valid semver version: "${w}"`, "ERR_UPDATER_INVALID_VERSION");
      this.currentVersion = y, this.allowPrerelease = N(y), R != null && (this.setFeedURL(R), typeof R != "string" && R.requestHeaders && (this.requestHeaders = R.requestHeaders));
    }
    //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    getFeedURL() {
      return "Deprecated. Do not use it.";
    }
    /**
     * Configure update provider. If value is `string`, [GenericServerOptions](./publish.md#genericserveroptions) will be set with value as `url`.
     * @param options If you want to override configuration in the `app-update.yml`.
     */
    setFeedURL(R) {
      const S = this.createProviderRuntimeOptions();
      let w;
      typeof R == "string" ? w = new f.GenericProvider({ provider: "generic", url: R }, this, {
        ...S,
        isUseMultipleRangeRequest: (0, g.isUrlProbablySupportMultiRangeRequests)(R)
      }) : w = (0, g.createClient)(R, this, S), this.clientPromise = Promise.resolve(w);
    }
    /**
     * Asks the server whether there is an update.
     * @returns null if the updater is disabled, otherwise info about the latest version
     */
    checkForUpdates() {
      if (!this.isUpdaterActive())
        return Promise.resolve(null);
      let R = this.checkForUpdatesPromise;
      if (R != null)
        return this._logger.info("Checking for update (already in progress)"), R;
      const S = () => this.checkForUpdatesPromise = null;
      return this._logger.info("Checking for update"), R = this.doCheckForUpdates().then((w) => (S(), w)).catch((w) => {
        throw S(), this.emit("error", w, `Cannot check for updates: ${(w.stack || w).toString()}`), w;
      }), this.checkForUpdatesPromise = R, R;
    }
    isUpdaterActive() {
      return this.app.isPackaged || this.forceDevUpdateConfig ? !0 : (this._logger.info("Skip checkForUpdates because application is not packed and dev update config is not forced"), !1);
    }
    // noinspection JSUnusedGlobalSymbols
    checkForUpdatesAndNotify(R) {
      return this.checkForUpdates().then((S) => S?.downloadPromise ? (S.downloadPromise.then(() => {
        const w = Qc.formatDownloadNotification(S.updateInfo.version, this.app.name, R);
        new St.Notification(w).show();
      }), S) : (this._logger.debug != null && this._logger.debug("checkForUpdatesAndNotify called, downloadPromise is null"), S));
    }
    static formatDownloadNotification(R, S, w) {
      return w == null && (w = {
        title: "A new update is ready to install",
        body: "{appName} version {version} has been downloaded and will be automatically installed on exit"
      }), w = {
        title: w.title.replace("{appName}", S).replace("{version}", R),
        body: w.body.replace("{appName}", S).replace("{version}", R)
      }, w;
    }
    async isStagingMatch(R) {
      const S = R.stagingPercentage;
      let w = S;
      if (w == null)
        return !0;
      if (w = parseInt(w, 10), isNaN(w))
        return this._logger.warn(`Staging percentage is NaN: ${S}`), !0;
      w = w / 100;
      const y = await this.stagingUserIdPromise.value, x = e.UUID.parse(y).readUInt32BE(12) / 4294967295;
      return this._logger.info(`Staging percentage: ${w}, percentage: ${x}, user id: ${y}`), x < w;
    }
    computeFinalHeaders(R) {
      return this.requestHeaders != null && Object.assign(R, this.requestHeaders), R;
    }
    async isUpdateAvailable(R) {
      const S = (0, a.parse)(R.version);
      if (S == null)
        throw (0, e.newError)(`This file could not be downloaded, or the latest version (from update server) does not have a valid semver version: "${R.version}"`, "ERR_UPDATER_INVALID_VERSION");
      const w = this.currentVersion;
      if ((0, a.eq)(S, w) || !await Promise.resolve(this.isUpdateSupported(R)) || !await this.isStagingMatch(R))
        return !1;
      const $ = (0, a.gt)(S, w), x = (0, a.lt)(S, w);
      return $ ? !0 : this.allowDowngrade && x;
    }
    checkIfUpdateSupported(R) {
      const S = R?.minimumSystemVersion, w = (0, r.release)();
      if (S)
        try {
          if ((0, a.lt)(w, S))
            return this._logger.info(`Current OS version ${w} is less than the minimum OS version required ${S} for version ${w}`), !1;
        } catch (y) {
          this._logger.warn(`Failed to compare current OS version(${w}) with minimum OS version(${S}): ${(y.message || y).toString()}`);
        }
      return !0;
    }
    async getUpdateInfoAndProvider() {
      await this.app.whenReady(), this.clientPromise == null && (this.clientPromise = this.configOnDisk.value.then((w) => (0, g.createClient)(w, this, this.createProviderRuntimeOptions())));
      const R = await this.clientPromise, S = await this.stagingUserIdPromise.value;
      return R.setRequestHeaders(this.computeFinalHeaders({ "x-user-staging-id": S })), {
        info: await R.getLatestVersion(),
        provider: R
      };
    }
    createProviderRuntimeOptions() {
      return {
        isUseMultipleRangeRequest: !0,
        platform: this._testOnlyOptions == null ? process.platform : this._testOnlyOptions.platform,
        executor: this.httpExecutor
      };
    }
    async doCheckForUpdates() {
      this.emit("checking-for-update");
      const R = await this.getUpdateInfoAndProvider(), S = R.info;
      if (!await this.isUpdateAvailable(S))
        return this._logger.info(`Update for version ${this.currentVersion.format()} is not available (latest version: ${S.version}, downgrade is ${this.allowDowngrade ? "allowed" : "disallowed"}).`), this.emit("update-not-available", S), {
          isUpdateAvailable: !1,
          versionInfo: S,
          updateInfo: S
        };
      this.updateInfoAndProvider = R, this.onUpdateAvailable(S);
      const w = new e.CancellationToken();
      return {
        isUpdateAvailable: !0,
        versionInfo: S,
        updateInfo: S,
        cancellationToken: w,
        downloadPromise: this.autoDownload ? this.downloadUpdate(w) : null
      };
    }
    onUpdateAvailable(R) {
      this._logger.info(`Found version ${R.version} (url: ${(0, e.asArray)(R.files).map((S) => S.url).join(", ")})`), this.emit("update-available", R);
    }
    /**
     * Start downloading update manually. You can use this method if `autoDownload` option is set to `false`.
     * @returns {Promise<Array<string>>} Paths to downloaded files.
     */
    downloadUpdate(R = new e.CancellationToken()) {
      const S = this.updateInfoAndProvider;
      if (S == null) {
        const y = new Error("Please check update first");
        return this.dispatchError(y), Promise.reject(y);
      }
      if (this.downloadPromise != null)
        return this._logger.info("Downloading update (already in progress)"), this.downloadPromise;
      this._logger.info(`Downloading update from ${(0, e.asArray)(S.info.files).map((y) => y.url).join(", ")}`);
      const w = (y) => {
        if (!(y instanceof e.CancellationError))
          try {
            this.dispatchError(y);
          } catch ($) {
            this._logger.warn(`Cannot dispatch error event: ${$.stack || $}`);
          }
        return y;
      };
      return this.downloadPromise = this.doDownloadUpdate({
        updateInfoAndProvider: S,
        requestHeaders: this.computeRequestHeaders(S.provider),
        cancellationToken: R,
        disableWebInstaller: this.disableWebInstaller,
        disableDifferentialDownload: this.disableDifferentialDownload
      }).catch((y) => {
        throw w(y);
      }).finally(() => {
        this.downloadPromise = null;
      }), this.downloadPromise;
    }
    dispatchError(R) {
      this.emit("error", R, (R.stack || R).toString());
    }
    dispatchUpdateDownloaded(R) {
      this.emit(v.UPDATE_DOWNLOADED, R);
    }
    async loadUpdateConfig() {
      return this._appUpdateConfigPath == null && (this._appUpdateConfigPath = this.app.appUpdateConfigPath), (0, s.load)(await (0, o.readFile)(this._appUpdateConfigPath, "utf-8"));
    }
    computeRequestHeaders(R) {
      const S = R.fileExtraDownloadHeaders;
      if (S != null) {
        const w = this.requestHeaders;
        return w == null ? S : {
          ...S,
          ...w
        };
      }
      return this.computeFinalHeaders({ accept: "*/*" });
    }
    async getOrCreateStagingUserId() {
      const R = l.join(this.app.userDataPath, ".updaterId");
      try {
        const w = await (0, o.readFile)(R, "utf-8");
        if (e.UUID.check(w))
          return w;
        this._logger.warn(`Staging user id file exists, but content was invalid: ${w}`);
      } catch (w) {
        w.code !== "ENOENT" && this._logger.warn(`Couldn't read staging user ID, creating a blank one: ${w}`);
      }
      const S = e.UUID.v5((0, n.randomBytes)(4096), e.UUID.OID);
      this._logger.info(`Generated new staging user ID: ${S}`);
      try {
        await (0, o.outputFile)(R, S);
      } catch (w) {
        this._logger.warn(`Couldn't write out staging user ID: ${w}`);
      }
      return S;
    }
    /** @internal */
    get isAddNoCacheQuery() {
      const R = this.requestHeaders;
      if (R == null)
        return !0;
      for (const S of Object.keys(R)) {
        const w = S.toLowerCase();
        if (w === "authorization" || w === "private-token")
          return !1;
      }
      return !0;
    }
    async getOrCreateDownloadHelper() {
      let R = this.downloadedUpdateHelper;
      if (R == null) {
        const S = (await this.configOnDisk.value).updaterCacheDirName, w = this._logger;
        S == null && w.error("updaterCacheDirName is not specified in app-update.yml Was app build using at least electron-builder 20.34.0?");
        const y = l.join(this.app.baseCachePath, S || this.app.name);
        w.debug != null && w.debug(`updater cache dir: ${y}`), R = new u.DownloadedUpdateHelper(y), this.downloadedUpdateHelper = R;
      }
      return R;
    }
    async executeDownload(R) {
      const S = R.fileInfo, w = {
        headers: R.downloadUpdateOptions.requestHeaders,
        cancellationToken: R.downloadUpdateOptions.cancellationToken,
        sha2: S.info.sha2,
        sha512: S.info.sha512
      };
      this.listenerCount(v.DOWNLOAD_PROGRESS) > 0 && (w.onProgress = (me) => this.emit(v.DOWNLOAD_PROGRESS, me));
      const y = R.downloadUpdateOptions.updateInfoAndProvider.info, $ = y.version, x = S.packageInfo;
      function F() {
        const me = decodeURIComponent(R.fileInfo.url.pathname);
        return me.endsWith(`.${R.fileExtension}`) ? l.basename(me) : R.fileInfo.info.url;
      }
      const M = await this.getOrCreateDownloadHelper(), L = M.cacheDirForPendingUpdate;
      await (0, o.mkdir)(L, { recursive: !0 });
      const D = F();
      let j = l.join(L, D);
      const C = x == null ? null : l.join(L, `package-${$}${l.extname(x.path) || ".7z"}`), Q = async (me) => (await M.setDownloadedFile(j, C, y, S, D, me), await R.done({
        ...y,
        downloadedFile: j
      }), C == null ? [j] : [j, C]), V = this._logger, ne = await M.validateDownloadedPath(j, y, S, V);
      if (ne != null)
        return j = ne, await Q(!1);
      const fe = async () => (await M.clear().catch(() => {
      }), await (0, o.unlink)(j).catch(() => {
      })), ce = await (0, u.createTempUpdateFile)(`temp-${D}`, L, V);
      try {
        await R.task(ce, w, C, fe), await (0, e.retry)(() => (0, o.rename)(ce, j), 60, 500, 0, 0, (me) => me instanceof Error && /^EBUSY:/.test(me.message));
      } catch (me) {
        throw await fe(), me instanceof e.CancellationError && (V.info("cancelled"), this.emit("update-cancelled", y)), me;
      }
      return V.info(`New version ${$} has been downloaded to ${j}`), await Q(!0);
    }
    async differentialDownloadInstaller(R, S, w, y, $) {
      try {
        if (this._testOnlyOptions != null && !this._testOnlyOptions.isUseDifferentialDownload)
          return !0;
        const x = (0, T.blockmapFiles)(R.url, this.app.version, S.updateInfoAndProvider.info.version);
        this._logger.info(`Download block maps (old: "${x[0]}", new: ${x[1]})`);
        const F = async (D) => {
          const j = await this.httpExecutor.downloadToBuffer(D, {
            headers: S.requestHeaders,
            cancellationToken: S.cancellationToken
          });
          if (j == null || j.length === 0)
            throw new Error(`Blockmap "${D.href}" is empty`);
          try {
            return JSON.parse((0, m.gunzipSync)(j).toString());
          } catch (C) {
            throw new Error(`Cannot parse blockmap "${D.href}", error: ${C}`);
          }
        }, M = {
          newUrl: R.url,
          oldFile: l.join(this.downloadedUpdateHelper.cacheDir, $),
          logger: this._logger,
          newFile: w,
          isUseMultipleRangeRequest: y.isUseMultipleRangeRequest,
          requestHeaders: S.requestHeaders,
          cancellationToken: S.cancellationToken
        };
        this.listenerCount(v.DOWNLOAD_PROGRESS) > 0 && (M.onProgress = (D) => this.emit(v.DOWNLOAD_PROGRESS, D));
        const L = await Promise.all(x.map((D) => F(D)));
        return await new p.GenericDifferentialDownloader(R.info, this.httpExecutor, M).download(L[0], L[1]), !1;
      } catch (x) {
        if (this._logger.error(`Cannot download differentially, fallback to full download: ${x.stack || x}`), this._testOnlyOptions != null)
          throw x;
        return !0;
      }
    }
  };
  Ct.AppUpdater = b;
  function N(k) {
    const R = (0, a.prerelease)(k);
    return R != null && R.length > 0;
  }
  class O {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    info(R) {
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    warn(R) {
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    error(R) {
    }
  }
  return Ct.NoOpLogger = O, Ct;
}
var Su;
function Kt() {
  if (Su) return tr;
  Su = 1, Object.defineProperty(tr, "__esModule", { value: !0 }), tr.BaseUpdater = void 0;
  const e = Rr, n = co();
  let r = class extends n.AppUpdater {
    constructor(o, s) {
      super(o, s), this.quitAndInstallCalled = !1, this.quitHandlerAdded = !1;
    }
    quitAndInstall(o = !1, s = !1) {
      this._logger.info("Install on explicit quitAndInstall"), this.install(o, o ? s : this.autoRunAppAfterInstall) ? setImmediate(() => {
        St.autoUpdater.emit("before-quit-for-update"), this.app.quit();
      }) : this.quitAndInstallCalled = !1;
    }
    executeDownload(o) {
      return super.executeDownload({
        ...o,
        done: (s) => (this.dispatchUpdateDownloaded(s), this.addQuitHandler(), Promise.resolve())
      });
    }
    get installerPath() {
      return this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.file;
    }
    // must be sync (because quit even handler is not async)
    install(o = !1, s = !1) {
      if (this.quitAndInstallCalled)
        return this._logger.warn("install call ignored: quitAndInstallCalled is set to true"), !1;
      const t = this.downloadedUpdateHelper, l = this.installerPath, a = t == null ? null : t.downloadedFileInfo;
      if (l == null || a == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      this.quitAndInstallCalled = !0;
      try {
        return this._logger.info(`Install: isSilent: ${o}, isForceRunAfter: ${s}`), this.doInstall({
          isSilent: o,
          isForceRunAfter: s,
          isAdminRightsRequired: a.isAdminRightsRequired
        });
      } catch (u) {
        return this.dispatchError(u), !1;
      }
    }
    addQuitHandler() {
      this.quitHandlerAdded || !this.autoInstallOnAppQuit || (this.quitHandlerAdded = !0, this.app.onQuit((o) => {
        if (this.quitAndInstallCalled) {
          this._logger.info("Update installer has already been triggered. Quitting application.");
          return;
        }
        if (!this.autoInstallOnAppQuit) {
          this._logger.info("Update will not be installed on quit because autoInstallOnAppQuit is set to false.");
          return;
        }
        if (o !== 0) {
          this._logger.info(`Update will be not installed on quit because application is quitting with exit code ${o}`);
          return;
        }
        this._logger.info("Auto install update on quit"), this.install(!0, !1);
      }));
    }
    wrapSudo() {
      const { name: o } = this.app, s = `"${o} would like to update"`, t = this.spawnSyncLog("which gksudo || which kdesudo || which pkexec || which beesu"), l = [t];
      return /kdesudo/i.test(t) ? (l.push("--comment", s), l.push("-c")) : /gksudo/i.test(t) ? l.push("--message", s) : /pkexec/i.test(t) && l.push("--disable-internal-agent"), l.join(" ");
    }
    spawnSyncLog(o, s = [], t = {}) {
      this._logger.info(`Executing: ${o} with args: ${s}`);
      const l = (0, e.spawnSync)(o, s, {
        env: { ...process.env, ...t },
        encoding: "utf-8",
        shell: !0
      }), { error: a, status: u, stdout: c, stderr: d } = l;
      if (a != null)
        throw this._logger.error(d), a;
      if (u != null && u !== 0)
        throw this._logger.error(d), new Error(`Command ${o} exited with code ${u}`);
      return c.trim();
    }
    /**
     * This handles both node 8 and node 10 way of emitting error when spawning a process
     *   - node 8: Throws the error
     *   - node 10: Emit the error(Need to listen with on)
     */
    // https://github.com/electron-userland/electron-builder/issues/1129
    // Node 8 sends errors: https://nodejs.org/dist/latest-v8.x/docs/api/errors.html#errors_common_system_errors
    async spawnLog(o, s = [], t = void 0, l = "ignore") {
      return this._logger.info(`Executing: ${o} with args: ${s}`), new Promise((a, u) => {
        try {
          const c = { stdio: l, env: t, detached: !0 }, d = (0, e.spawn)(o, s, c);
          d.on("error", (f) => {
            u(f);
          }), d.unref(), d.pid !== void 0 && a(!0);
        } catch (c) {
          u(c);
        }
      });
    }
  };
  return tr.BaseUpdater = r, tr;
}
var mr = {}, Er = {}, Au;
function Zc() {
  if (Au) return Er;
  Au = 1, Object.defineProperty(Er, "__esModule", { value: !0 }), Er.FileWithEmbeddedBlockMapDifferentialDownloader = void 0;
  const e = /* @__PURE__ */ wt(), n = Kc(), r = Ec;
  let i = class extends n.DifferentialDownloader {
    async download() {
      const l = this.blockAwareFileInfo, a = l.size, u = a - (l.blockMapSize + 4);
      this.fileMetadataBuffer = await this.readRemoteBytes(u, a - 1);
      const c = o(this.fileMetadataBuffer.slice(0, this.fileMetadataBuffer.length - 4));
      await this.doDownload(await s(this.options.oldFile), c);
    }
  };
  Er.FileWithEmbeddedBlockMapDifferentialDownloader = i;
  function o(t) {
    return JSON.parse((0, r.inflateRawSync)(t).toString());
  }
  async function s(t) {
    const l = await (0, e.open)(t, "r");
    try {
      const a = (await (0, e.fstat)(l)).size, u = Buffer.allocUnsafe(4);
      await (0, e.read)(l, u, 0, u.length, a - u.length);
      const c = Buffer.allocUnsafe(u.readUInt32BE(0));
      return await (0, e.read)(l, c, 0, c.length, a - u.length - c.length), await (0, e.close)(l), o(c);
    } catch (a) {
      throw await (0, e.close)(l), a;
    }
  }
  return Er;
}
var wu;
function _u() {
  if (wu) return mr;
  wu = 1, Object.defineProperty(mr, "__esModule", { value: !0 }), mr.AppImageUpdater = void 0;
  const e = qe(), n = Rr, r = /* @__PURE__ */ wt(), i = Ce, o = Se, s = Kt(), t = Zc(), l = et(), a = kt();
  let u = class extends s.BaseUpdater {
    constructor(d, f) {
      super(d, f);
    }
    isUpdaterActive() {
      return process.env.APPIMAGE == null ? (process.env.SNAP == null ? this._logger.warn("APPIMAGE env is not defined, current application is not an AppImage") : this._logger.info("SNAP env is defined, updater is disabled"), !1) : super.isUpdaterActive();
    }
    /*** @private */
    doDownloadUpdate(d) {
      const f = d.updateInfoAndProvider.provider, g = (0, l.findFile)(f.resolveFiles(d.updateInfoAndProvider.info), "AppImage", ["rpm", "deb", "pacman"]);
      return this.executeDownload({
        fileExtension: "AppImage",
        fileInfo: g,
        downloadUpdateOptions: d,
        task: async (m, T) => {
          const p = process.env.APPIMAGE;
          if (p == null)
            throw (0, e.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
          (d.disableDifferentialDownload || await this.downloadDifferential(g, p, m, f, d)) && await this.httpExecutor.download(g.url, m, T), await (0, r.chmod)(m, 493);
        }
      });
    }
    async downloadDifferential(d, f, g, m, T) {
      try {
        const p = {
          newUrl: d.url,
          oldFile: f,
          logger: this._logger,
          newFile: g,
          isUseMultipleRangeRequest: m.isUseMultipleRangeRequest,
          requestHeaders: T.requestHeaders,
          cancellationToken: T.cancellationToken
        };
        return this.listenerCount(a.DOWNLOAD_PROGRESS) > 0 && (p.onProgress = (v) => this.emit(a.DOWNLOAD_PROGRESS, v)), await new t.FileWithEmbeddedBlockMapDifferentialDownloader(d.info, this.httpExecutor, p).download(), !1;
      } catch (p) {
        return this._logger.error(`Cannot download differentially, fallback to full download: ${p.stack || p}`), process.platform === "linux";
      }
    }
    doInstall(d) {
      const f = process.env.APPIMAGE;
      if (f == null)
        throw (0, e.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
      (0, i.unlinkSync)(f);
      let g;
      const m = o.basename(f), T = this.installerPath;
      if (T == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      o.basename(T) === m || !/\d+\.\d+\.\d+/.test(m) ? g = f : g = o.join(o.dirname(f), o.basename(T)), (0, n.execFileSync)("mv", ["-f", T, g]), g !== f && this.emit("appimage-filename-updated", g);
      const p = {
        ...process.env,
        APPIMAGE_SILENT_INSTALL: "true"
      };
      return d.isForceRunAfter ? this.spawnLog(g, [], p) : (p.APPIMAGE_EXIT_AFTER_INSTALL = "true", (0, n.execFileSync)(g, [], { env: p })), !0;
    }
  };
  return mr.AppImageUpdater = u, mr;
}
var Tr = {}, bu;
function Ru() {
  if (bu) return Tr;
  bu = 1, Object.defineProperty(Tr, "__esModule", { value: !0 }), Tr.DebUpdater = void 0;
  const e = Kt(), n = et(), r = kt();
  let i = class extends e.BaseUpdater {
    constructor(s, t) {
      super(s, t);
    }
    /*** @private */
    doDownloadUpdate(s) {
      const t = s.updateInfoAndProvider.provider, l = (0, n.findFile)(t.resolveFiles(s.updateInfoAndProvider.info), "deb", ["AppImage", "rpm", "pacman"]);
      return this.executeDownload({
        fileExtension: "deb",
        fileInfo: l,
        downloadUpdateOptions: s,
        task: async (a, u) => {
          this.listenerCount(r.DOWNLOAD_PROGRESS) > 0 && (u.onProgress = (c) => this.emit(r.DOWNLOAD_PROGRESS, c)), await this.httpExecutor.download(l.url, a, u);
        }
      });
    }
    get installerPath() {
      var s, t;
      return (t = (s = super.installerPath) === null || s === void 0 ? void 0 : s.replace(/ /g, "\\ ")) !== null && t !== void 0 ? t : null;
    }
    doInstall(s) {
      const t = this.wrapSudo(), l = /pkexec/i.test(t) ? "" : '"', a = this.installerPath;
      if (a == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      const u = ["dpkg", "-i", a, "||", "apt-get", "install", "-f", "-y"];
      return this.spawnSyncLog(t, [`${l}/bin/bash`, "-c", `'${u.join(" ")}'${l}`]), s.isForceRunAfter && this.app.relaunch(), !0;
    }
  };
  return Tr.DebUpdater = i, Tr;
}
var yr = {}, Iu;
function Nu() {
  if (Iu) return yr;
  Iu = 1, Object.defineProperty(yr, "__esModule", { value: !0 }), yr.PacmanUpdater = void 0;
  const e = Kt(), n = kt(), r = et();
  let i = class extends e.BaseUpdater {
    constructor(s, t) {
      super(s, t);
    }
    /*** @private */
    doDownloadUpdate(s) {
      const t = s.updateInfoAndProvider.provider, l = (0, r.findFile)(t.resolveFiles(s.updateInfoAndProvider.info), "pacman", ["AppImage", "deb", "rpm"]);
      return this.executeDownload({
        fileExtension: "pacman",
        fileInfo: l,
        downloadUpdateOptions: s,
        task: async (a, u) => {
          this.listenerCount(n.DOWNLOAD_PROGRESS) > 0 && (u.onProgress = (c) => this.emit(n.DOWNLOAD_PROGRESS, c)), await this.httpExecutor.download(l.url, a, u);
        }
      });
    }
    get installerPath() {
      var s, t;
      return (t = (s = super.installerPath) === null || s === void 0 ? void 0 : s.replace(/ /g, "\\ ")) !== null && t !== void 0 ? t : null;
    }
    doInstall(s) {
      const t = this.wrapSudo(), l = /pkexec/i.test(t) ? "" : '"', a = this.installerPath;
      if (a == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      const u = ["pacman", "-U", "--noconfirm", a];
      return this.spawnSyncLog(t, [`${l}/bin/bash`, "-c", `'${u.join(" ")}'${l}`]), s.isForceRunAfter && this.app.relaunch(), !0;
    }
  };
  return yr.PacmanUpdater = i, yr;
}
var vr = {}, Ou;
function Cu() {
  if (Ou) return vr;
  Ou = 1, Object.defineProperty(vr, "__esModule", { value: !0 }), vr.RpmUpdater = void 0;
  const e = Kt(), n = kt(), r = et();
  let i = class extends e.BaseUpdater {
    constructor(s, t) {
      super(s, t);
    }
    /*** @private */
    doDownloadUpdate(s) {
      const t = s.updateInfoAndProvider.provider, l = (0, r.findFile)(t.resolveFiles(s.updateInfoAndProvider.info), "rpm", ["AppImage", "deb", "pacman"]);
      return this.executeDownload({
        fileExtension: "rpm",
        fileInfo: l,
        downloadUpdateOptions: s,
        task: async (a, u) => {
          this.listenerCount(n.DOWNLOAD_PROGRESS) > 0 && (u.onProgress = (c) => this.emit(n.DOWNLOAD_PROGRESS, c)), await this.httpExecutor.download(l.url, a, u);
        }
      });
    }
    get installerPath() {
      var s, t;
      return (t = (s = super.installerPath) === null || s === void 0 ? void 0 : s.replace(/ /g, "\\ ")) !== null && t !== void 0 ? t : null;
    }
    doInstall(s) {
      const t = this.wrapSudo(), l = /pkexec/i.test(t) ? "" : '"', a = this.spawnSyncLog("which zypper"), u = this.installerPath;
      if (u == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      let c;
      return a ? c = [a, "--no-refresh", "install", "--allow-unsigned-rpm", "-y", "-f", u] : c = [this.spawnSyncLog("which dnf || which yum"), "-y", "install", u], this.spawnSyncLog(t, [`${l}/bin/bash`, "-c", `'${c.join(" ")}'${l}`]), s.isForceRunAfter && this.app.relaunch(), !0;
    }
  };
  return vr.RpmUpdater = i, vr;
}
var Sr = {}, Lu;
function Pu() {
  if (Lu) return Sr;
  Lu = 1, Object.defineProperty(Sr, "__esModule", { value: !0 }), Sr.MacUpdater = void 0;
  const e = qe(), n = /* @__PURE__ */ wt(), r = Ce, i = Se, o = Tc, s = co(), t = et(), l = Rr, a = Je;
  let u = class extends s.AppUpdater {
    constructor(d, f) {
      super(d, f), this.nativeUpdater = St.autoUpdater, this.squirrelDownloadedUpdate = !1, this.nativeUpdater.on("error", (g) => {
        this._logger.warn(g), this.emit("error", g);
      }), this.nativeUpdater.on("update-downloaded", () => {
        this.squirrelDownloadedUpdate = !0, this.debug("nativeUpdater.update-downloaded");
      });
    }
    debug(d) {
      this._logger.debug != null && this._logger.debug(d);
    }
    closeServerIfExists() {
      this.server && (this.debug("Closing proxy server"), this.server.close((d) => {
        d && this.debug("proxy server wasn't already open, probably attempted closing again as a safety check before quit");
      }));
    }
    async doDownloadUpdate(d) {
      let f = d.updateInfoAndProvider.provider.resolveFiles(d.updateInfoAndProvider.info);
      const g = this._logger, m = "sysctl.proc_translated";
      let T = !1;
      try {
        this.debug("Checking for macOS Rosetta environment"), T = (0, l.execFileSync)("sysctl", [m], { encoding: "utf8" }).includes(`${m}: 1`), g.info(`Checked for macOS Rosetta environment (isRosetta=${T})`);
      } catch (k) {
        g.warn(`sysctl shell command to check for macOS Rosetta environment failed: ${k}`);
      }
      let p = !1;
      try {
        this.debug("Checking for arm64 in uname");
        const R = (0, l.execFileSync)("uname", ["-a"], { encoding: "utf8" }).includes("ARM");
        g.info(`Checked 'uname -a': arm64=${R}`), p = p || R;
      } catch (k) {
        g.warn(`uname shell command to check for arm64 failed: ${k}`);
      }
      p = p || process.arch === "arm64" || T;
      const v = (k) => {
        var R;
        return k.url.pathname.includes("arm64") || ((R = k.info.url) === null || R === void 0 ? void 0 : R.includes("arm64"));
      };
      p && f.some(v) ? f = f.filter((k) => p === v(k)) : f = f.filter((k) => !v(k));
      const b = (0, t.findFile)(f, "zip", ["pkg", "dmg"]);
      if (b == null)
        throw (0, e.newError)(`ZIP file not provided: ${(0, e.safeStringifyJson)(f)}`, "ERR_UPDATER_ZIP_FILE_NOT_FOUND");
      const N = d.updateInfoAndProvider.provider, O = "update.zip";
      return this.executeDownload({
        fileExtension: "zip",
        fileInfo: b,
        downloadUpdateOptions: d,
        task: async (k, R) => {
          const S = i.join(this.downloadedUpdateHelper.cacheDir, O), w = () => (0, n.pathExistsSync)(S) ? !d.disableDifferentialDownload : (g.info("Unable to locate previous update.zip for differential download (is this first install?), falling back to full download"), !1);
          let y = !0;
          w() && (y = await this.differentialDownloadInstaller(b, d, k, N, O)), y && await this.httpExecutor.download(b.url, k, R);
        },
        done: async (k) => {
          if (!d.disableDifferentialDownload)
            try {
              const R = i.join(this.downloadedUpdateHelper.cacheDir, O);
              await (0, n.copyFile)(k.downloadedFile, R);
            } catch (R) {
              this._logger.warn(`Unable to copy file for caching for future differential downloads: ${R.message}`);
            }
          return this.updateDownloaded(b, k);
        }
      });
    }
    async updateDownloaded(d, f) {
      var g;
      const m = f.downloadedFile, T = (g = d.info.size) !== null && g !== void 0 ? g : (await (0, n.stat)(m)).size, p = this._logger, v = `fileToProxy=${d.url.href}`;
      this.closeServerIfExists(), this.debug(`Creating proxy server for native Squirrel.Mac (${v})`), this.server = (0, o.createServer)(), this.debug(`Proxy server for native Squirrel.Mac is created (${v})`), this.server.on("close", () => {
        p.info(`Proxy server for native Squirrel.Mac is closed (${v})`);
      });
      const b = (N) => {
        const O = N.address();
        return typeof O == "string" ? O : `http://127.0.0.1:${O?.port}`;
      };
      return await new Promise((N, O) => {
        const k = (0, a.randomBytes)(64).toString("base64").replace(/\//g, "_").replace(/\+/g, "-"), R = Buffer.from(`autoupdater:${k}`, "ascii"), S = `/${(0, a.randomBytes)(64).toString("hex")}.zip`;
        this.server.on("request", (w, y) => {
          const $ = w.url;
          if (p.info(`${$} requested`), $ === "/") {
            if (!w.headers.authorization || w.headers.authorization.indexOf("Basic ") === -1) {
              y.statusCode = 401, y.statusMessage = "Invalid Authentication Credentials", y.end(), p.warn("No authenthication info");
              return;
            }
            const M = w.headers.authorization.split(" ")[1], L = Buffer.from(M, "base64").toString("ascii"), [D, j] = L.split(":");
            if (D !== "autoupdater" || j !== k) {
              y.statusCode = 401, y.statusMessage = "Invalid Authentication Credentials", y.end(), p.warn("Invalid authenthication credentials");
              return;
            }
            const C = Buffer.from(`{ "url": "${b(this.server)}${S}" }`);
            y.writeHead(200, { "Content-Type": "application/json", "Content-Length": C.length }), y.end(C);
            return;
          }
          if (!$.startsWith(S)) {
            p.warn(`${$} requested, but not supported`), y.writeHead(404), y.end();
            return;
          }
          p.info(`${S} requested by Squirrel.Mac, pipe ${m}`);
          let x = !1;
          y.on("finish", () => {
            x || (this.nativeUpdater.removeListener("error", O), N([]));
          });
          const F = (0, r.createReadStream)(m);
          F.on("error", (M) => {
            try {
              y.end();
            } catch (L) {
              p.warn(`cannot end response: ${L}`);
            }
            x = !0, this.nativeUpdater.removeListener("error", O), O(new Error(`Cannot pipe "${m}": ${M}`));
          }), y.writeHead(200, {
            "Content-Type": "application/zip",
            "Content-Length": T
          }), F.pipe(y);
        }), this.debug(`Proxy server for native Squirrel.Mac is starting to listen (${v})`), this.server.listen(0, "127.0.0.1", () => {
          this.debug(`Proxy server for native Squirrel.Mac is listening (address=${b(this.server)}, ${v})`), this.nativeUpdater.setFeedURL({
            url: b(this.server),
            headers: {
              "Cache-Control": "no-cache",
              Authorization: `Basic ${R.toString("base64")}`
            }
          }), this.dispatchUpdateDownloaded(f), this.autoInstallOnAppQuit ? (this.nativeUpdater.once("error", O), this.nativeUpdater.checkForUpdates()) : N([]);
        });
      });
    }
    handleUpdateDownloaded() {
      this.autoRunAppAfterInstall ? this.nativeUpdater.quitAndInstall() : this.app.quit(), this.closeServerIfExists();
    }
    quitAndInstall() {
      this.squirrelDownloadedUpdate ? this.handleUpdateDownloaded() : (this.nativeUpdater.on("update-downloaded", () => this.handleUpdateDownloaded()), this.autoInstallOnAppQuit || this.nativeUpdater.checkForUpdates());
    }
  };
  return Sr.MacUpdater = u, Sr;
}
var Ar = {}, zr = {}, Du;
function Ap() {
  if (Du) return zr;
  Du = 1, Object.defineProperty(zr, "__esModule", { value: !0 }), zr.verifySignature = o;
  const e = qe(), n = Rr, r = At, i = Se;
  function o(a, u, c) {
    return new Promise((d, f) => {
      const g = u.replace(/'/g, "''");
      c.info(`Verifying signature ${g}`), (0, n.execFile)('set "PSModulePath=" & chcp 65001 >NUL & powershell.exe', ["-NoProfile", "-NonInteractive", "-InputFormat", "None", "-Command", `"Get-AuthenticodeSignature -LiteralPath '${g}' | ConvertTo-Json -Compress"`], {
        shell: !0,
        timeout: 20 * 1e3
      }, (m, T, p) => {
        var v;
        try {
          if (m != null || p) {
            t(c, m, p, f), d(null);
            return;
          }
          const b = s(T);
          if (b.Status === 0) {
            try {
              const R = i.normalize(b.Path), S = i.normalize(u);
              if (c.info(`LiteralPath: ${R}. Update Path: ${S}`), R !== S) {
                t(c, new Error(`LiteralPath of ${R} is different than ${S}`), p, f), d(null);
                return;
              }
            } catch (R) {
              c.warn(`Unable to verify LiteralPath of update asset due to missing data.Path. Skipping this step of validation. Message: ${(v = R.message) !== null && v !== void 0 ? v : R.stack}`);
            }
            const O = (0, e.parseDn)(b.SignerCertificate.Subject);
            let k = !1;
            for (const R of a) {
              const S = (0, e.parseDn)(R);
              if (S.size ? k = Array.from(S.keys()).every((y) => S.get(y) === O.get(y)) : R === O.get("CN") && (c.warn(`Signature validated using only CN ${R}. Please add your full Distinguished Name (DN) to publisherNames configuration`), k = !0), k) {
                d(null);
                return;
              }
            }
          }
          const N = `publisherNames: ${a.join(" | ")}, raw info: ` + JSON.stringify(b, (O, k) => O === "RawData" ? void 0 : k, 2);
          c.warn(`Sign verification failed, installer signed with incorrect certificate: ${N}`), d(N);
        } catch (b) {
          t(c, b, null, f), d(null);
          return;
        }
      });
    });
  }
  function s(a) {
    const u = JSON.parse(a);
    delete u.PrivateKey, delete u.IsOSBinary, delete u.SignatureType;
    const c = u.SignerCertificate;
    return c != null && (delete c.Archived, delete c.Extensions, delete c.Handle, delete c.HasPrivateKey, delete c.SubjectName), u;
  }
  function t(a, u, c, d) {
    if (l()) {
      a.warn(`Cannot execute Get-AuthenticodeSignature: ${u || c}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
      return;
    }
    try {
      (0, n.execFileSync)("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "ConvertTo-Json test"], { timeout: 10 * 1e3 });
    } catch (f) {
      a.warn(`Cannot execute ConvertTo-Json: ${f.message}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
      return;
    }
    u != null && d(u), c && d(new Error(`Cannot execute Get-AuthenticodeSignature, stderr: ${c}. Failing signature validation due to unknown stderr.`));
  }
  function l() {
    const a = r.release();
    return a.startsWith("6.") && !a.startsWith("6.3");
  }
  return zr;
}
var Uu;
function Fu() {
  if (Uu) return Ar;
  Uu = 1, Object.defineProperty(Ar, "__esModule", { value: !0 }), Ar.NsisUpdater = void 0;
  const e = qe(), n = Se, r = Kt(), i = Zc(), o = kt(), s = et(), t = /* @__PURE__ */ wt(), l = Ap(), a = Vt;
  let u = class extends r.BaseUpdater {
    constructor(d, f) {
      super(d, f), this._verifyUpdateCodeSignature = (g, m) => (0, l.verifySignature)(g, m, this._logger);
    }
    /**
     * The verifyUpdateCodeSignature. You can pass [win-verify-signature](https://github.com/beyondkmp/win-verify-trust) or another custom verify function: ` (publisherName: string[], path: string) => Promise<string | null>`.
     * The default verify function uses [windowsExecutableCodeSignatureVerifier](https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/src/windowsExecutableCodeSignatureVerifier.ts)
     */
    get verifyUpdateCodeSignature() {
      return this._verifyUpdateCodeSignature;
    }
    set verifyUpdateCodeSignature(d) {
      d && (this._verifyUpdateCodeSignature = d);
    }
    /*** @private */
    doDownloadUpdate(d) {
      const f = d.updateInfoAndProvider.provider, g = (0, s.findFile)(f.resolveFiles(d.updateInfoAndProvider.info), "exe");
      return this.executeDownload({
        fileExtension: "exe",
        downloadUpdateOptions: d,
        fileInfo: g,
        task: async (m, T, p, v) => {
          const b = g.packageInfo, N = b != null && p != null;
          if (N && d.disableWebInstaller)
            throw (0, e.newError)(`Unable to download new version ${d.updateInfoAndProvider.info.version}. Web Installers are disabled`, "ERR_UPDATER_WEB_INSTALLER_DISABLED");
          !N && !d.disableWebInstaller && this._logger.warn("disableWebInstaller is set to false, you should set it to true if you do not plan on using a web installer. This will default to true in a future version."), (N || d.disableDifferentialDownload || await this.differentialDownloadInstaller(g, d, m, f, e.CURRENT_APP_INSTALLER_FILE_NAME)) && await this.httpExecutor.download(g.url, m, T);
          const O = await this.verifySignature(m);
          if (O != null)
            throw await v(), (0, e.newError)(`New version ${d.updateInfoAndProvider.info.version} is not signed by the application owner: ${O}`, "ERR_UPDATER_INVALID_SIGNATURE");
          if (N && await this.differentialDownloadWebPackage(d, b, p, f))
            try {
              await this.httpExecutor.download(new a.URL(b.path), p, {
                headers: d.requestHeaders,
                cancellationToken: d.cancellationToken,
                sha512: b.sha512
              });
            } catch (k) {
              try {
                await (0, t.unlink)(p);
              } catch {
              }
              throw k;
            }
        }
      });
    }
    // $certificateInfo = (Get-AuthenticodeSignature 'xxx\yyy.exe'
    // | where {$_.Status.Equals([System.Management.Automation.SignatureStatus]::Valid) -and $_.SignerCertificate.Subject.Contains("CN=siemens.com")})
    // | Out-String ; if ($certificateInfo) { exit 0 } else { exit 1 }
    async verifySignature(d) {
      let f;
      try {
        if (f = (await this.configOnDisk.value).publisherName, f == null)
          return null;
      } catch (g) {
        if (g.code === "ENOENT")
          return null;
        throw g;
      }
      return await this._verifyUpdateCodeSignature(Array.isArray(f) ? f : [f], d);
    }
    doInstall(d) {
      const f = this.installerPath;
      if (f == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      const g = ["--updated"];
      d.isSilent && g.push("/S"), d.isForceRunAfter && g.push("--force-run"), this.installDirectory && g.push(`/D=${this.installDirectory}`);
      const m = this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.packageFile;
      m != null && g.push(`--package-file=${m}`);
      const T = () => {
        this.spawnLog(n.join(process.resourcesPath, "elevate.exe"), [f].concat(g)).catch((p) => this.dispatchError(p));
      };
      return d.isAdminRightsRequired ? (this._logger.info("isAdminRightsRequired is set to true, run installer using elevate.exe"), T(), !0) : (this.spawnLog(f, g).catch((p) => {
        const v = p.code;
        this._logger.info(`Cannot run installer: error code: ${v}, error message: "${p.message}", will be executed again using elevate if EACCES, and will try to use electron.shell.openItem if ENOENT`), v === "UNKNOWN" || v === "EACCES" ? T() : v === "ENOENT" ? St.shell.openPath(f).catch((b) => this.dispatchError(b)) : this.dispatchError(p);
      }), !0);
    }
    async differentialDownloadWebPackage(d, f, g, m) {
      if (f.blockMapSize == null)
        return !0;
      try {
        const T = {
          newUrl: new a.URL(f.path),
          oldFile: n.join(this.downloadedUpdateHelper.cacheDir, e.CURRENT_APP_PACKAGE_FILE_NAME),
          logger: this._logger,
          newFile: g,
          requestHeaders: this.requestHeaders,
          isUseMultipleRangeRequest: m.isUseMultipleRangeRequest,
          cancellationToken: d.cancellationToken
        };
        this.listenerCount(o.DOWNLOAD_PROGRESS) > 0 && (T.onProgress = (p) => this.emit(o.DOWNLOAD_PROGRESS, p)), await new i.FileWithEmbeddedBlockMapDifferentialDownloader(f, this.httpExecutor, T).download();
      } catch (T) {
        return this._logger.error(`Cannot download differentially, fallback to full download: ${T.stack || T}`), process.platform === "win32";
      }
      return !1;
    }
  };
  return Ar.NsisUpdater = u, Ar;
}
var xu;
function wp() {
  return xu || (xu = 1, (function(e) {
    var n = Ot && Ot.__createBinding || (Object.create ? (function(p, v, b, N) {
      N === void 0 && (N = b);
      var O = Object.getOwnPropertyDescriptor(v, b);
      (!O || ("get" in O ? !v.__esModule : O.writable || O.configurable)) && (O = { enumerable: !0, get: function() {
        return v[b];
      } }), Object.defineProperty(p, N, O);
    }) : (function(p, v, b, N) {
      N === void 0 && (N = b), p[N] = v[b];
    })), r = Ot && Ot.__exportStar || function(p, v) {
      for (var b in p) b !== "default" && !Object.prototype.hasOwnProperty.call(v, b) && n(v, p, b);
    };
    Object.defineProperty(e, "__esModule", { value: !0 }), e.NsisUpdater = e.MacUpdater = e.RpmUpdater = e.PacmanUpdater = e.DebUpdater = e.AppImageUpdater = e.Provider = e.NoOpLogger = e.AppUpdater = e.BaseUpdater = void 0;
    const i = /* @__PURE__ */ wt(), o = Se;
    var s = Kt();
    Object.defineProperty(e, "BaseUpdater", { enumerable: !0, get: function() {
      return s.BaseUpdater;
    } });
    var t = co();
    Object.defineProperty(e, "AppUpdater", { enumerable: !0, get: function() {
      return t.AppUpdater;
    } }), Object.defineProperty(e, "NoOpLogger", { enumerable: !0, get: function() {
      return t.NoOpLogger;
    } });
    var l = et();
    Object.defineProperty(e, "Provider", { enumerable: !0, get: function() {
      return l.Provider;
    } });
    var a = _u();
    Object.defineProperty(e, "AppImageUpdater", { enumerable: !0, get: function() {
      return a.AppImageUpdater;
    } });
    var u = Ru();
    Object.defineProperty(e, "DebUpdater", { enumerable: !0, get: function() {
      return u.DebUpdater;
    } });
    var c = Nu();
    Object.defineProperty(e, "PacmanUpdater", { enumerable: !0, get: function() {
      return c.PacmanUpdater;
    } });
    var d = Cu();
    Object.defineProperty(e, "RpmUpdater", { enumerable: !0, get: function() {
      return d.RpmUpdater;
    } });
    var f = Pu();
    Object.defineProperty(e, "MacUpdater", { enumerable: !0, get: function() {
      return f.MacUpdater;
    } });
    var g = Fu();
    Object.defineProperty(e, "NsisUpdater", { enumerable: !0, get: function() {
      return g.NsisUpdater;
    } }), r(kt(), e);
    let m;
    function T() {
      if (process.platform === "win32")
        m = new (Fu()).NsisUpdater();
      else if (process.platform === "darwin")
        m = new (Pu()).MacUpdater();
      else {
        m = new (_u()).AppImageUpdater();
        try {
          const p = o.join(process.resourcesPath, "package-type");
          if (!(0, i.existsSync)(p))
            return m;
          console.info("Checking for beta autoupdate feature for deb/rpm distributions");
          const v = (0, i.readFileSync)(p).toString().trim();
          switch (console.info("Found package-type:", v), v) {
            case "deb":
              m = new (Ru()).DebUpdater();
              break;
            case "rpm":
              m = new (Cu()).RpmUpdater();
              break;
            case "pacman":
              m = new (Nu()).PacmanUpdater();
              break;
            default:
              break;
          }
        } catch (p) {
          console.warn("Unable to detect 'package-type' for autoUpdater (beta rpm/deb support). If you'd like to expand support, please consider contributing to electron-builder", p.message);
        }
      }
      return m;
    }
    Object.defineProperty(e, "autoUpdater", {
      enumerable: !0,
      get: () => m || T()
    });
  })(Ot)), Ot;
}
var at = wp(), wr = { exports: {} }, vs = { exports: {} }, ku;
function ed() {
  return ku || (ku = 1, (function(e) {
    let n = {};
    try {
      n = require("electron");
    } catch {
    }
    n.ipcRenderer && r(n), e.exports = r;
    function r({ contextBridge: i, ipcRenderer: o }) {
      if (!o)
        return;
      o.on("__ELECTRON_LOG_IPC__", (t, l) => {
        window.postMessage({ cmd: "message", ...l });
      }), o.invoke("__ELECTRON_LOG__", { cmd: "getOptions" }).catch((t) => console.error(new Error(
        `electron-log isn't initialized in the main process. Please call log.initialize() before. ${t.message}`
      )));
      const s = {
        sendToMain(t) {
          try {
            o.send("__ELECTRON_LOG__", t);
          } catch (l) {
            console.error("electronLog.sendToMain ", l, "data:", t), o.send("__ELECTRON_LOG__", {
              cmd: "errorHandler",
              error: { message: l?.message, stack: l?.stack },
              errorName: "sendToMain"
            });
          }
        },
        log(...t) {
          s.sendToMain({ data: t, level: "info" });
        }
      };
      for (const t of ["error", "warn", "info", "verbose", "debug", "silly"])
        s[t] = (...l) => s.sendToMain({
          data: l,
          level: t
        });
      if (i && process.contextIsolated)
        try {
          i.exposeInMainWorld("__electronLog", s);
        } catch {
        }
      typeof window == "object" ? window.__electronLog = s : __electronLog = s;
    }
  })(vs)), vs.exports;
}
var Ss = { exports: {} }, As, qu;
function _p() {
  if (qu) return As;
  qu = 1, As = e;
  function e(n) {
    return Object.defineProperties(r, {
      defaultLabel: { value: "", writable: !0 },
      labelPadding: { value: !0, writable: !0 },
      maxLabelLength: { value: 0, writable: !0 },
      labelLength: {
        get() {
          switch (typeof r.labelPadding) {
            case "boolean":
              return r.labelPadding ? r.maxLabelLength : 0;
            case "number":
              return r.labelPadding;
            default:
              return 0;
          }
        }
      }
    });
    function r(i) {
      r.maxLabelLength = Math.max(r.maxLabelLength, i.length);
      const o = {};
      for (const s of n.levels)
        o[s] = (...t) => n.logData(t, { level: s, scope: i });
      return o.log = o.info, o;
    }
  }
  return As;
}
var ws, $u;
function bp() {
  if ($u) return ws;
  $u = 1;
  class e {
    constructor({ processMessage: r }) {
      this.processMessage = r, this.buffer = [], this.enabled = !1, this.begin = this.begin.bind(this), this.commit = this.commit.bind(this), this.reject = this.reject.bind(this);
    }
    addMessage(r) {
      this.buffer.push(r);
    }
    begin() {
      this.enabled = [];
    }
    commit() {
      this.enabled = !1, this.buffer.forEach((r) => this.processMessage(r)), this.buffer = [];
    }
    reject() {
      this.enabled = !1, this.buffer = [];
    }
  }
  return ws = e, ws;
}
var _s, Mu;
function td() {
  if (Mu) return _s;
  Mu = 1;
  const e = _p(), n = bp();
  class r {
    static instances = {};
    dependencies = {};
    errorHandler = null;
    eventLogger = null;
    functions = {};
    hooks = [];
    isDev = !1;
    levels = null;
    logId = null;
    scope = null;
    transports = {};
    variables = {};
    constructor({
      allowUnknownLevel: o = !1,
      dependencies: s = {},
      errorHandler: t,
      eventLogger: l,
      initializeFn: a,
      isDev: u = !1,
      levels: c = ["error", "warn", "info", "verbose", "debug", "silly"],
      logId: d,
      transportFactories: f = {},
      variables: g
    } = {}) {
      this.addLevel = this.addLevel.bind(this), this.create = this.create.bind(this), this.initialize = this.initialize.bind(this), this.logData = this.logData.bind(this), this.processMessage = this.processMessage.bind(this), this.allowUnknownLevel = o, this.buffering = new n(this), this.dependencies = s, this.initializeFn = a, this.isDev = u, this.levels = c, this.logId = d, this.scope = e(this), this.transportFactories = f, this.variables = g || {};
      for (const m of this.levels)
        this.addLevel(m, !1);
      this.log = this.info, this.functions.log = this.log, this.errorHandler = t, t?.setOptions({ ...s, logFn: this.error }), this.eventLogger = l, l?.setOptions({ ...s, logger: this });
      for (const [m, T] of Object.entries(f))
        this.transports[m] = T(this, s);
      r.instances[d] = this;
    }
    static getInstance({ logId: o }) {
      return this.instances[o] || this.instances.default;
    }
    addLevel(o, s = this.levels.length) {
      s !== !1 && this.levels.splice(s, 0, o), this[o] = (...t) => this.logData(t, { level: o }), this.functions[o] = this[o];
    }
    catchErrors(o) {
      return this.processMessage(
        {
          data: ["log.catchErrors is deprecated. Use log.errorHandler instead"],
          level: "warn"
        },
        { transports: ["console"] }
      ), this.errorHandler.startCatching(o);
    }
    create(o) {
      return typeof o == "string" && (o = { logId: o }), new r({
        dependencies: this.dependencies,
        errorHandler: this.errorHandler,
        initializeFn: this.initializeFn,
        isDev: this.isDev,
        transportFactories: this.transportFactories,
        variables: { ...this.variables },
        ...o
      });
    }
    compareLevels(o, s, t = this.levels) {
      const l = t.indexOf(o), a = t.indexOf(s);
      return a === -1 || l === -1 ? !0 : a <= l;
    }
    initialize(o = {}) {
      this.initializeFn({ logger: this, ...this.dependencies, ...o });
    }
    logData(o, s = {}) {
      this.buffering.enabled ? this.buffering.addMessage({ data: o, date: /* @__PURE__ */ new Date(), ...s }) : this.processMessage({ data: o, ...s });
    }
    processMessage(o, { transports: s = this.transports } = {}) {
      if (o.cmd === "errorHandler") {
        this.errorHandler.handle(o.error, {
          errorName: o.errorName,
          processType: "renderer",
          showDialog: !!o.showDialog
        });
        return;
      }
      let t = o.level;
      this.allowUnknownLevel || (t = this.levels.includes(o.level) ? o.level : "info");
      const l = {
        date: /* @__PURE__ */ new Date(),
        logId: this.logId,
        ...o,
        level: t,
        variables: {
          ...this.variables,
          ...o.variables
        }
      };
      for (const [a, u] of this.transportEntries(s))
        if (!(typeof u != "function" || u.level === !1) && this.compareLevels(u.level, o.level))
          try {
            const c = this.hooks.reduce((d, f) => d && f(d, u, a), l);
            c && u({ ...c, data: [...c.data] });
          } catch (c) {
            this.processInternalErrorFn(c);
          }
    }
    processInternalErrorFn(o) {
    }
    transportEntries(o = this.transports) {
      return (Array.isArray(o) ? o : Object.entries(o)).map((t) => {
        switch (typeof t) {
          case "string":
            return this.transports[t] ? [t, this.transports[t]] : null;
          case "function":
            return [t.name, t];
          default:
            return Array.isArray(t) ? t : null;
        }
      }).filter(Boolean);
    }
  }
  return _s = r, _s;
}
var bs, Bu;
function Rp() {
  if (Bu) return bs;
  Bu = 1;
  const e = console.error;
  class n {
    logFn = null;
    onError = null;
    showDialog = !1;
    preventDefault = !0;
    constructor({ logFn: i = null } = {}) {
      this.handleError = this.handleError.bind(this), this.handleRejection = this.handleRejection.bind(this), this.startCatching = this.startCatching.bind(this), this.logFn = i;
    }
    handle(i, {
      logFn: o = this.logFn,
      errorName: s = "",
      onError: t = this.onError,
      showDialog: l = this.showDialog
    } = {}) {
      try {
        t?.({ error: i, errorName: s, processType: "renderer" }) !== !1 && o({ error: i, errorName: s, showDialog: l });
      } catch {
        e(i);
      }
    }
    setOptions({ logFn: i, onError: o, preventDefault: s, showDialog: t }) {
      typeof i == "function" && (this.logFn = i), typeof o == "function" && (this.onError = o), typeof s == "boolean" && (this.preventDefault = s), typeof t == "boolean" && (this.showDialog = t);
    }
    startCatching({ onError: i, showDialog: o } = {}) {
      this.isActive || (this.isActive = !0, this.setOptions({ onError: i, showDialog: o }), window.addEventListener("error", (s) => {
        this.preventDefault && s.preventDefault?.(), this.handleError(s.error || s);
      }), window.addEventListener("unhandledrejection", (s) => {
        this.preventDefault && s.preventDefault?.(), this.handleRejection(s.reason || s);
      }));
    }
    handleError(i) {
      this.handle(i, { errorName: "Unhandled" });
    }
    handleRejection(i) {
      const o = i instanceof Error ? i : new Error(JSON.stringify(i));
      this.handle(o, { errorName: "Unhandled rejection" });
    }
  }
  return bs = n, bs;
}
var Rs, Hu;
function qt() {
  if (Hu) return Rs;
  Hu = 1, Rs = { transform: e };
  function e({
    logger: n,
    message: r,
    transport: i,
    initialData: o = r?.data || [],
    transforms: s = i?.transforms
  }) {
    return s.reduce((t, l) => typeof l == "function" ? l({ data: t, logger: n, message: r, transport: i }) : t, o);
  }
  return Rs;
}
var Is, ju;
function Ip() {
  if (ju) return Is;
  ju = 1;
  const { transform: e } = qt();
  Is = r;
  const n = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    verbose: console.info,
    debug: console.debug,
    silly: console.debug,
    log: console.log
  };
  function r(o) {
    return Object.assign(s, {
      format: "{h}:{i}:{s}.{ms}{scope} › {text}",
      transforms: [i],
      writeFn({ message: { level: t, data: l } }) {
        const a = n[t] || n.info;
        setTimeout(() => a(...l));
      }
    });
    function s(t) {
      s.writeFn({
        message: { ...t, data: e({ logger: o, message: t, transport: s }) }
      });
    }
  }
  function i({
    data: o = [],
    logger: s = {},
    message: t = {},
    transport: l = {}
  }) {
    if (typeof l.format == "function")
      return l.format({
        data: o,
        level: t?.level || "info",
        logger: s,
        message: t,
        transport: l
      });
    if (typeof l.format != "string")
      return o;
    o.unshift(l.format), typeof o[1] == "string" && o[1].match(/%[1cdfiOos]/) && (o = [`${o[0]}${o[1]}`, ...o.slice(2)]);
    const a = t.date || /* @__PURE__ */ new Date();
    return o[0] = o[0].replace(/\{(\w+)}/g, (u, c) => {
      switch (c) {
        case "level":
          return t.level;
        case "logId":
          return t.logId;
        case "scope": {
          const d = t.scope || s.scope?.defaultLabel;
          return d ? ` (${d})` : "";
        }
        case "text":
          return "";
        case "y":
          return a.getFullYear().toString(10);
        case "m":
          return (a.getMonth() + 1).toString(10).padStart(2, "0");
        case "d":
          return a.getDate().toString(10).padStart(2, "0");
        case "h":
          return a.getHours().toString(10).padStart(2, "0");
        case "i":
          return a.getMinutes().toString(10).padStart(2, "0");
        case "s":
          return a.getSeconds().toString(10).padStart(2, "0");
        case "ms":
          return a.getMilliseconds().toString(10).padStart(3, "0");
        case "iso":
          return a.toISOString();
        default:
          return t.variables?.[c] || u;
      }
    }).trim(), o;
  }
  return Is;
}
var Ns, Xu;
function Np() {
  if (Xu) return Ns;
  Xu = 1;
  const { transform: e } = qt();
  Ns = r;
  const n = /* @__PURE__ */ new Set([Promise, WeakMap, WeakSet]);
  function r(s) {
    return Object.assign(t, {
      depth: 5,
      transforms: [o]
    });
    function t(l) {
      if (!window.__electronLog) {
        s.processMessage(
          {
            data: ["electron-log: logger isn't initialized in the main process"],
            level: "error"
          },
          { transports: ["console"] }
        );
        return;
      }
      try {
        const a = e({
          initialData: l,
          logger: s,
          message: l,
          transport: t
        });
        __electronLog.sendToMain(a);
      } catch (a) {
        s.transports.console({
          data: ["electronLog.transports.ipc", a, "data:", l.data],
          level: "error"
        });
      }
    }
  }
  function i(s) {
    return Object(s) !== s;
  }
  function o({
    data: s,
    depth: t,
    seen: l = /* @__PURE__ */ new WeakSet(),
    transport: a = {}
  } = {}) {
    const u = t || a.depth || 5;
    return l.has(s) ? "[Circular]" : u < 1 ? i(s) ? s : Array.isArray(s) ? "[Array]" : `[${typeof s}]` : ["function", "symbol"].includes(typeof s) ? s.toString() : i(s) ? s : n.has(s.constructor) ? `[${s.constructor.name}]` : Array.isArray(s) ? s.map((c) => o({
      data: c,
      depth: u - 1,
      seen: l
    })) : s instanceof Date ? s.toISOString() : s instanceof Error ? s.stack : s instanceof Map ? new Map(
      Array.from(s).map(([c, d]) => [
        o({ data: c, depth: u - 1, seen: l }),
        o({ data: d, depth: u - 1, seen: l })
      ])
    ) : s instanceof Set ? new Set(
      Array.from(s).map(
        (c) => o({ data: c, depth: u - 1, seen: l })
      )
    ) : (l.add(s), Object.fromEntries(
      Object.entries(s).map(
        ([c, d]) => [
          c,
          o({ data: d, depth: u - 1, seen: l })
        ]
      )
    ));
  }
  return Ns;
}
var Gu;
function Op() {
  return Gu || (Gu = 1, (function(e) {
    const n = td(), r = Rp(), i = Ip(), o = Np();
    typeof process == "object" && process.type === "browser" && console.warn(
      "electron-log/renderer is loaded in the main process. It could cause unexpected behaviour."
    ), e.exports = s(), e.exports.Logger = n, e.exports.default = e.exports;
    function s() {
      const t = new n({
        allowUnknownLevel: !0,
        errorHandler: new r(),
        initializeFn: () => {
        },
        logId: "default",
        transportFactories: {
          console: i,
          ipc: o
        },
        variables: {
          processType: "renderer"
        }
      });
      return t.errorHandler.setOptions({
        logFn({ error: l, errorName: a, showDialog: u }) {
          t.transports.console({
            data: [a, l].filter(Boolean),
            level: "error"
          }), t.transports.ipc({
            cmd: "errorHandler",
            error: {
              cause: l?.cause,
              code: l?.code,
              name: l?.name,
              message: l?.message,
              stack: l?.stack
            },
            errorName: a,
            logId: t.logId,
            showDialog: u
          });
        }
      }), typeof window == "object" && window.addEventListener("message", (l) => {
        const { cmd: a, logId: u, ...c } = l.data || {}, d = n.getInstance({ logId: u });
        a === "message" && d.processMessage(c, { transports: ["console"] });
      }), new Proxy(t, {
        get(l, a) {
          return typeof l[a] < "u" ? l[a] : (...u) => t.logData(u, { level: a });
        }
      });
    }
  })(Ss)), Ss.exports;
}
var Os, Wu;
function Cp() {
  if (Wu) return Os;
  Wu = 1;
  const e = Ce, n = Se;
  Os = {
    findAndReadPackageJson: r,
    tryReadJsonAt: i
  };
  function r() {
    return i(t()) || i(s()) || i(process.resourcesPath, "app.asar") || i(process.resourcesPath, "app") || i(process.cwd()) || { name: void 0, version: void 0 };
  }
  function i(...l) {
    if (l[0])
      try {
        const a = n.join(...l), u = o("package.json", a);
        if (!u)
          return;
        const c = JSON.parse(e.readFileSync(u, "utf8")), d = c?.productName || c?.name;
        return !d || d.toLowerCase() === "electron" ? void 0 : d ? { name: d, version: c?.version } : void 0;
      } catch {
        return;
      }
  }
  function o(l, a) {
    let u = a;
    for (; ; ) {
      const c = n.parse(u), d = c.root, f = c.dir;
      if (e.existsSync(n.join(u, l)))
        return n.resolve(n.join(u, l));
      if (u === d)
        return null;
      u = f;
    }
  }
  function s() {
    const l = process.argv.filter((u) => u.indexOf("--user-data-dir=") === 0);
    return l.length === 0 || typeof l[0] != "string" ? null : l[0].replace("--user-data-dir=", "");
  }
  function t() {
    try {
      return require.main?.filename;
    } catch {
      return;
    }
  }
  return Os;
}
var Cs, Vu;
function rd() {
  if (Vu) return Cs;
  Vu = 1;
  const e = Rr, n = At, r = Se, i = Cp();
  class o {
    appName = void 0;
    appPackageJson = void 0;
    platform = process.platform;
    getAppLogPath(t = this.getAppName()) {
      return this.platform === "darwin" ? r.join(this.getSystemPathHome(), "Library/Logs", t) : r.join(this.getAppUserDataPath(t), "logs");
    }
    getAppName() {
      const t = this.appName || this.getAppPackageJson()?.name;
      if (!t)
        throw new Error(
          "electron-log can't determine the app name. It tried these methods:\n1. Use `electron.app.name`\n2. Use productName or name from the nearest package.json`\nYou can also set it through log.transports.file.setAppName()"
        );
      return t;
    }
    /**
     * @private
     * @returns {undefined}
     */
    getAppPackageJson() {
      return typeof this.appPackageJson != "object" && (this.appPackageJson = i.findAndReadPackageJson()), this.appPackageJson;
    }
    getAppUserDataPath(t = this.getAppName()) {
      return t ? r.join(this.getSystemPathAppData(), t) : void 0;
    }
    getAppVersion() {
      return this.getAppPackageJson()?.version;
    }
    getElectronLogPath() {
      return this.getAppLogPath();
    }
    getMacOsVersion() {
      const t = Number(n.release().split(".")[0]);
      return t <= 19 ? `10.${t - 4}` : t - 9;
    }
    /**
     * @protected
     * @returns {string}
     */
    getOsVersion() {
      let t = n.type().replace("_", " "), l = n.release();
      return t === "Darwin" && (t = "macOS", l = this.getMacOsVersion()), `${t} ${l}`;
    }
    /**
     * @return {PathVariables}
     */
    getPathVariables() {
      const t = this.getAppName(), l = this.getAppVersion(), a = this;
      return {
        appData: this.getSystemPathAppData(),
        appName: t,
        appVersion: l,
        get electronDefaultDir() {
          return a.getElectronLogPath();
        },
        home: this.getSystemPathHome(),
        libraryDefaultDir: this.getAppLogPath(t),
        libraryTemplate: this.getAppLogPath("{appName}"),
        temp: this.getSystemPathTemp(),
        userData: this.getAppUserDataPath(t)
      };
    }
    getSystemPathAppData() {
      const t = this.getSystemPathHome();
      switch (this.platform) {
        case "darwin":
          return r.join(t, "Library/Application Support");
        case "win32":
          return process.env.APPDATA || r.join(t, "AppData/Roaming");
        default:
          return process.env.XDG_CONFIG_HOME || r.join(t, ".config");
      }
    }
    getSystemPathHome() {
      return n.homedir?.() || process.env.HOME;
    }
    getSystemPathTemp() {
      return n.tmpdir();
    }
    getVersions() {
      return {
        app: `${this.getAppName()} ${this.getAppVersion()}`,
        electron: void 0,
        os: this.getOsVersion()
      };
    }
    isDev() {
      return process.env.NODE_ENV === "development" || process.env.ELECTRON_IS_DEV === "1";
    }
    isElectron() {
      return !!process.versions.electron;
    }
    onAppEvent(t, l) {
    }
    onAppReady(t) {
      t();
    }
    onEveryWebContentsEvent(t, l) {
    }
    /**
     * Listen to async messages sent from opposite process
     * @param {string} channel
     * @param {function} listener
     */
    onIpc(t, l) {
    }
    onIpcInvoke(t, l) {
    }
    /**
     * @param {string} url
     * @param {Function} [logFunction]
     */
    openUrl(t, l = console.error) {
      const u = { darwin: "open", win32: "start", linux: "xdg-open" }[process.platform] || "xdg-open";
      e.exec(`${u} ${t}`, {}, (c) => {
        c && l(c);
      });
    }
    setAppName(t) {
      this.appName = t;
    }
    setPlatform(t) {
      this.platform = t;
    }
    setPreloadFileForSessions({
      filePath: t,
      // eslint-disable-line no-unused-vars
      includeFutureSession: l = !0,
      // eslint-disable-line no-unused-vars
      getSessions: a = () => []
      // eslint-disable-line no-unused-vars
    }) {
    }
    /**
     * Sent a message to opposite process
     * @param {string} channel
     * @param {any} message
     */
    sendIpc(t, l) {
    }
    showErrorBox(t, l) {
    }
  }
  return Cs = o, Cs;
}
var Ls, Yu;
function Lp() {
  if (Yu) return Ls;
  Yu = 1;
  const e = Se, n = rd();
  class r extends n {
    /**
     * @type {typeof Electron}
     */
    electron = void 0;
    /**
     * @param {object} options
     * @param {typeof Electron} [options.electron]
     */
    constructor({ electron: o } = {}) {
      super(), this.electron = o;
    }
    getAppName() {
      let o;
      try {
        o = this.appName || this.electron.app?.name || this.electron.app?.getName();
      } catch {
      }
      return o || super.getAppName();
    }
    getAppUserDataPath(o) {
      return this.getPath("userData") || super.getAppUserDataPath(o);
    }
    getAppVersion() {
      let o;
      try {
        o = this.electron.app?.getVersion();
      } catch {
      }
      return o || super.getAppVersion();
    }
    getElectronLogPath() {
      return this.getPath("logs") || super.getElectronLogPath();
    }
    /**
     * @private
     * @param {any} name
     * @returns {string|undefined}
     */
    getPath(o) {
      try {
        return this.electron.app?.getPath(o);
      } catch {
        return;
      }
    }
    getVersions() {
      return {
        app: `${this.getAppName()} ${this.getAppVersion()}`,
        electron: `Electron ${process.versions.electron}`,
        os: this.getOsVersion()
      };
    }
    getSystemPathAppData() {
      return this.getPath("appData") || super.getSystemPathAppData();
    }
    isDev() {
      return this.electron.app?.isPackaged !== void 0 ? !this.electron.app.isPackaged : typeof process.execPath == "string" ? e.basename(process.execPath).toLowerCase().startsWith("electron") : super.isDev();
    }
    onAppEvent(o, s) {
      return this.electron.app?.on(o, s), () => {
        this.electron.app?.off(o, s);
      };
    }
    onAppReady(o) {
      this.electron.app?.isReady() ? o() : this.electron.app?.once ? this.electron.app?.once("ready", o) : o();
    }
    onEveryWebContentsEvent(o, s) {
      return this.electron.webContents?.getAllWebContents()?.forEach((l) => {
        l.on(o, s);
      }), this.electron.app?.on("web-contents-created", t), () => {
        this.electron.webContents?.getAllWebContents().forEach((l) => {
          l.off(o, s);
        }), this.electron.app?.off("web-contents-created", t);
      };
      function t(l, a) {
        a.on(o, s);
      }
    }
    /**
     * Listen to async messages sent from opposite process
     * @param {string} channel
     * @param {function} listener
     */
    onIpc(o, s) {
      this.electron.ipcMain?.on(o, s);
    }
    onIpcInvoke(o, s) {
      this.electron.ipcMain?.handle?.(o, s);
    }
    /**
     * @param {string} url
     * @param {Function} [logFunction]
     */
    openUrl(o, s = console.error) {
      this.electron.shell?.openExternal(o).catch(s);
    }
    setPreloadFileForSessions({
      filePath: o,
      includeFutureSession: s = !0,
      getSessions: t = () => [this.electron.session?.defaultSession]
    }) {
      for (const a of t().filter(Boolean))
        l(a);
      s && this.onAppEvent("session-created", (a) => {
        l(a);
      });
      function l(a) {
        typeof a.registerPreloadScript == "function" ? a.registerPreloadScript({
          filePath: o,
          id: "electron-log-preload",
          type: "frame"
        }) : a.setPreloads([...a.getPreloads(), o]);
      }
    }
    /**
     * Sent a message to opposite process
     * @param {string} channel
     * @param {any} message
     */
    sendIpc(o, s) {
      this.electron.BrowserWindow?.getAllWindows()?.forEach((t) => {
        t.webContents?.isDestroyed() === !1 && t.webContents?.isCrashed() === !1 && t.webContents.send(o, s);
      });
    }
    showErrorBox(o, s) {
      this.electron.dialog?.showErrorBox(o, s);
    }
  }
  return Ls = r, Ls;
}
var Ps, zu;
function Pp() {
  if (zu) return Ps;
  zu = 1;
  const e = Ce, n = At, r = Se, i = ed();
  let o = !1, s = !1;
  Ps = {
    initialize({
      externalApi: a,
      getSessions: u,
      includeFutureSession: c,
      logger: d,
      preload: f = !0,
      spyRendererConsole: g = !1
    }) {
      a.onAppReady(() => {
        try {
          f && t({
            externalApi: a,
            getSessions: u,
            includeFutureSession: c,
            logger: d,
            preloadOption: f
          }), g && l({ externalApi: a, logger: d });
        } catch (m) {
          d.warn(m);
        }
      });
    }
  };
  function t({
    externalApi: a,
    getSessions: u,
    includeFutureSession: c,
    logger: d,
    preloadOption: f
  }) {
    let g = typeof f == "string" ? f : void 0;
    if (o) {
      d.warn(new Error("log.initialize({ preload }) already called").stack);
      return;
    }
    o = !0;
    try {
      g = r.resolve(
        __dirname,
        "../renderer/electron-log-preload.js"
      );
    } catch {
    }
    if (!g || !e.existsSync(g)) {
      g = r.join(
        a.getAppUserDataPath() || n.tmpdir(),
        "electron-log-preload.js"
      );
      const m = `
      try {
        (${i.toString()})(require('electron'));
      } catch(e) {
        console.error(e);
      }
    `;
      e.writeFileSync(g, m, "utf8");
    }
    a.setPreloadFileForSessions({
      filePath: g,
      includeFutureSession: c,
      getSessions: u
    });
  }
  function l({ externalApi: a, logger: u }) {
    if (s) {
      u.warn(
        new Error("log.initialize({ spyRendererConsole }) already called").stack
      );
      return;
    }
    s = !0;
    const c = ["debug", "info", "warn", "error"];
    a.onEveryWebContentsEvent(
      "console-message",
      (d, f, g) => {
        u.processMessage({
          data: [g],
          level: c[f],
          variables: { processType: "renderer" }
        });
      }
    );
  }
  return Ps;
}
var Ds, Ju;
function Dp() {
  if (Ju) return Ds;
  Ju = 1;
  class e {
    externalApi = void 0;
    isActive = !1;
    logFn = void 0;
    onError = void 0;
    showDialog = !0;
    constructor({
      externalApi: i,
      logFn: o = void 0,
      onError: s = void 0,
      showDialog: t = void 0
    } = {}) {
      this.createIssue = this.createIssue.bind(this), this.handleError = this.handleError.bind(this), this.handleRejection = this.handleRejection.bind(this), this.setOptions({ externalApi: i, logFn: o, onError: s, showDialog: t }), this.startCatching = this.startCatching.bind(this), this.stopCatching = this.stopCatching.bind(this);
    }
    handle(i, {
      logFn: o = this.logFn,
      onError: s = this.onError,
      processType: t = "browser",
      showDialog: l = this.showDialog,
      errorName: a = ""
    } = {}) {
      i = n(i);
      try {
        if (typeof s == "function") {
          const u = this.externalApi?.getVersions() || {}, c = this.createIssue;
          if (s({
            createIssue: c,
            error: i,
            errorName: a,
            processType: t,
            versions: u
          }) === !1)
            return;
        }
        a ? o(a, i) : o(i), l && !a.includes("rejection") && this.externalApi && this.externalApi.showErrorBox(
          `A JavaScript error occurred in the ${t} process`,
          i.stack
        );
      } catch {
        console.error(i);
      }
    }
    setOptions({ externalApi: i, logFn: o, onError: s, showDialog: t }) {
      typeof i == "object" && (this.externalApi = i), typeof o == "function" && (this.logFn = o), typeof s == "function" && (this.onError = s), typeof t == "boolean" && (this.showDialog = t);
    }
    startCatching({ onError: i, showDialog: o } = {}) {
      this.isActive || (this.isActive = !0, this.setOptions({ onError: i, showDialog: o }), process.on("uncaughtException", this.handleError), process.on("unhandledRejection", this.handleRejection));
    }
    stopCatching() {
      this.isActive = !1, process.removeListener("uncaughtException", this.handleError), process.removeListener("unhandledRejection", this.handleRejection);
    }
    createIssue(i, o) {
      this.externalApi?.openUrl(
        `${i}?${new URLSearchParams(o).toString()}`
      );
    }
    handleError(i) {
      this.handle(i, { errorName: "Unhandled" });
    }
    handleRejection(i) {
      const o = i instanceof Error ? i : new Error(JSON.stringify(i));
      this.handle(o, { errorName: "Unhandled rejection" });
    }
  }
  function n(r) {
    if (r instanceof Error)
      return r;
    if (r && typeof r == "object") {
      if (r.message)
        return Object.assign(new Error(r.message), r);
      try {
        return new Error(JSON.stringify(r));
      } catch (i) {
        return new Error(`Couldn't normalize error ${String(r)}: ${i}`);
      }
    }
    return new Error(`Can't normalize error ${String(r)}`);
  }
  return Ds = e, Ds;
}
var Us, Ku;
function Up() {
  if (Ku) return Us;
  Ku = 1;
  class e {
    disposers = [];
    format = "{eventSource}#{eventName}:";
    formatters = {
      app: {
        "certificate-error": ({ args: r }) => this.arrayToObject(r.slice(1, 4), [
          "url",
          "error",
          "certificate"
        ]),
        "child-process-gone": ({ args: r }) => r.length === 1 ? r[0] : r,
        "render-process-gone": ({ args: [r, i] }) => i && typeof i == "object" ? { ...i, ...this.getWebContentsDetails(r) } : []
      },
      webContents: {
        "console-message": ({ args: [r, i, o, s] }) => {
          if (!(r < 3))
            return { message: i, source: `${s}:${o}` };
        },
        "did-fail-load": ({ args: r }) => this.arrayToObject(r, [
          "errorCode",
          "errorDescription",
          "validatedURL",
          "isMainFrame",
          "frameProcessId",
          "frameRoutingId"
        ]),
        "did-fail-provisional-load": ({ args: r }) => this.arrayToObject(r, [
          "errorCode",
          "errorDescription",
          "validatedURL",
          "isMainFrame",
          "frameProcessId",
          "frameRoutingId"
        ]),
        "plugin-crashed": ({ args: r }) => this.arrayToObject(r, ["name", "version"]),
        "preload-error": ({ args: r }) => this.arrayToObject(r, ["preloadPath", "error"])
      }
    };
    events = {
      app: {
        "certificate-error": !0,
        "child-process-gone": !0,
        "render-process-gone": !0
      },
      webContents: {
        // 'console-message': true,
        "did-fail-load": !0,
        "did-fail-provisional-load": !0,
        "plugin-crashed": !0,
        "preload-error": !0,
        unresponsive: !0
      }
    };
    externalApi = void 0;
    level = "error";
    scope = "";
    constructor(r = {}) {
      this.setOptions(r);
    }
    setOptions({
      events: r,
      externalApi: i,
      level: o,
      logger: s,
      format: t,
      formatters: l,
      scope: a
    }) {
      typeof r == "object" && (this.events = r), typeof i == "object" && (this.externalApi = i), typeof o == "string" && (this.level = o), typeof s == "object" && (this.logger = s), (typeof t == "string" || typeof t == "function") && (this.format = t), typeof l == "object" && (this.formatters = l), typeof a == "string" && (this.scope = a);
    }
    startLogging(r = {}) {
      this.setOptions(r), this.disposeListeners();
      for (const i of this.getEventNames(this.events.app))
        this.disposers.push(
          this.externalApi.onAppEvent(i, (...o) => {
            this.handleEvent({ eventSource: "app", eventName: i, handlerArgs: o });
          })
        );
      for (const i of this.getEventNames(this.events.webContents))
        this.disposers.push(
          this.externalApi.onEveryWebContentsEvent(
            i,
            (...o) => {
              this.handleEvent(
                { eventSource: "webContents", eventName: i, handlerArgs: o }
              );
            }
          )
        );
    }
    stopLogging() {
      this.disposeListeners();
    }
    arrayToObject(r, i) {
      const o = {};
      return i.forEach((s, t) => {
        o[s] = r[t];
      }), r.length > i.length && (o.unknownArgs = r.slice(i.length)), o;
    }
    disposeListeners() {
      this.disposers.forEach((r) => r()), this.disposers = [];
    }
    formatEventLog({ eventName: r, eventSource: i, handlerArgs: o }) {
      const [s, ...t] = o;
      if (typeof this.format == "function")
        return this.format({ args: t, event: s, eventName: r, eventSource: i });
      const l = this.formatters[i]?.[r];
      let a = t;
      if (typeof l == "function" && (a = l({ args: t, event: s, eventName: r, eventSource: i })), !a)
        return;
      const u = {};
      return Array.isArray(a) ? u.args = a : typeof a == "object" && Object.assign(u, a), i === "webContents" && Object.assign(u, this.getWebContentsDetails(s?.sender)), [this.format.replace("{eventSource}", i === "app" ? "App" : "WebContents").replace("{eventName}", r), u];
    }
    getEventNames(r) {
      return !r || typeof r != "object" ? [] : Object.entries(r).filter(([i, o]) => o).map(([i]) => i);
    }
    getWebContentsDetails(r) {
      if (!r?.loadURL)
        return {};
      try {
        return {
          webContents: {
            id: r.id,
            url: r.getURL()
          }
        };
      } catch {
        return {};
      }
    }
    handleEvent({ eventName: r, eventSource: i, handlerArgs: o }) {
      const s = this.formatEventLog({ eventName: r, eventSource: i, handlerArgs: o });
      s && (this.scope ? this.logger.scope(this.scope) : this.logger)?.[this.level]?.(...s);
    }
  }
  return Us = e, Us;
}
var Fs, Qu;
function nd() {
  if (Qu) return Fs;
  Qu = 1;
  const { transform: e } = qt();
  Fs = {
    concatFirstStringElements: n,
    formatScope: i,
    formatText: s,
    formatVariables: o,
    timeZoneFromOffset: r,
    format({ message: t, logger: l, transport: a, data: u = t?.data }) {
      switch (typeof a.format) {
        case "string":
          return e({
            message: t,
            logger: l,
            transforms: [o, i, s],
            transport: a,
            initialData: [a.format, ...u]
          });
        case "function":
          return a.format({
            data: u,
            level: t?.level || "info",
            logger: l,
            message: t,
            transport: a
          });
        default:
          return u;
      }
    }
  };
  function n({ data: t }) {
    return typeof t[0] != "string" || typeof t[1] != "string" || t[0].match(/%[1cdfiOos]/) ? t : [`${t[0]} ${t[1]}`, ...t.slice(2)];
  }
  function r(t) {
    const l = Math.abs(t), a = t > 0 ? "-" : "+", u = Math.floor(l / 60).toString().padStart(2, "0"), c = (l % 60).toString().padStart(2, "0");
    return `${a}${u}:${c}`;
  }
  function i({ data: t, logger: l, message: a }) {
    const { defaultLabel: u, labelLength: c } = l?.scope || {}, d = t[0];
    let f = a.scope;
    f || (f = u);
    let g;
    return f === "" ? g = c > 0 ? "".padEnd(c + 3) : "" : typeof f == "string" ? g = ` (${f})`.padEnd(c + 3) : g = "", t[0] = d.replace("{scope}", g), t;
  }
  function o({ data: t, message: l }) {
    let a = t[0];
    if (typeof a != "string")
      return t;
    a = a.replace("{level}]", `${l.level}]`.padEnd(6, " "));
    const u = l.date || /* @__PURE__ */ new Date();
    return t[0] = a.replace(/\{(\w+)}/g, (c, d) => {
      switch (d) {
        case "level":
          return l.level || "info";
        case "logId":
          return l.logId;
        case "y":
          return u.getFullYear().toString(10);
        case "m":
          return (u.getMonth() + 1).toString(10).padStart(2, "0");
        case "d":
          return u.getDate().toString(10).padStart(2, "0");
        case "h":
          return u.getHours().toString(10).padStart(2, "0");
        case "i":
          return u.getMinutes().toString(10).padStart(2, "0");
        case "s":
          return u.getSeconds().toString(10).padStart(2, "0");
        case "ms":
          return u.getMilliseconds().toString(10).padStart(3, "0");
        case "z":
          return r(u.getTimezoneOffset());
        case "iso":
          return u.toISOString();
        default:
          return l.variables?.[d] || c;
      }
    }).trim(), t;
  }
  function s({ data: t }) {
    const l = t[0];
    if (typeof l != "string")
      return t;
    if (l.lastIndexOf("{text}") === l.length - 6)
      return t[0] = l.replace(/\s?{text}/, ""), t[0] === "" && t.shift(), t;
    const u = l.split("{text}");
    let c = [];
    return u[0] !== "" && c.push(u[0]), c = c.concat(t.slice(1)), u[1] !== "" && c.push(u[1]), c;
  }
  return Fs;
}
var xs = { exports: {} }, Zu;
function un() {
  return Zu || (Zu = 1, (function(e) {
    const n = Zr;
    e.exports = {
      serialize: i,
      maxDepth({ data: o, transport: s, depth: t = s?.depth ?? 6 }) {
        if (!o)
          return o;
        if (t < 1)
          return Array.isArray(o) ? "[array]" : typeof o == "object" && o ? "[object]" : o;
        if (Array.isArray(o))
          return o.map((a) => e.exports.maxDepth({
            data: a,
            depth: t - 1
          }));
        if (typeof o != "object" || o && typeof o.toISOString == "function")
          return o;
        if (o === null)
          return null;
        if (o instanceof Error)
          return o;
        const l = {};
        for (const a in o)
          Object.prototype.hasOwnProperty.call(o, a) && (l[a] = e.exports.maxDepth({
            data: o[a],
            depth: t - 1
          }));
        return l;
      },
      toJSON({ data: o }) {
        return JSON.parse(JSON.stringify(o, r()));
      },
      toString({ data: o, transport: s }) {
        const t = s?.inspectOptions || {}, l = o.map((a) => {
          if (a !== void 0)
            try {
              const u = JSON.stringify(a, r(), "  ");
              return u === void 0 ? void 0 : JSON.parse(u);
            } catch {
              return a;
            }
        });
        return n.formatWithOptions(t, ...l);
      }
    };
    function r(o = {}) {
      const s = /* @__PURE__ */ new WeakSet();
      return function(t, l) {
        if (typeof l == "object" && l !== null) {
          if (s.has(l))
            return;
          s.add(l);
        }
        return i(t, l, o);
      };
    }
    function i(o, s, t = {}) {
      const l = t?.serializeMapAndSet !== !1;
      return s instanceof Error ? s.stack : s && (typeof s == "function" ? `[function] ${s.toString()}` : s instanceof Date ? s.toISOString() : l && s instanceof Map && Object.fromEntries ? Object.fromEntries(s) : l && s instanceof Set && Array.from ? Array.from(s) : s);
    }
  })(xs)), xs.exports;
}
var ks, ec;
function fo() {
  if (ec) return ks;
  ec = 1, ks = {
    transformStyles: i,
    applyAnsiStyles({ data: o }) {
      return i(o, n, r);
    },
    removeStyles({ data: o }) {
      return i(o, () => "");
    }
  };
  const e = {
    unset: "\x1B[0m",
    black: "\x1B[30m",
    red: "\x1B[31m",
    green: "\x1B[32m",
    yellow: "\x1B[33m",
    blue: "\x1B[34m",
    magenta: "\x1B[35m",
    cyan: "\x1B[36m",
    white: "\x1B[37m",
    gray: "\x1B[90m"
  };
  function n(o) {
    const s = o.replace(/color:\s*(\w+).*/, "$1").toLowerCase();
    return e[s] || "";
  }
  function r(o) {
    return o + e.unset;
  }
  function i(o, s, t) {
    const l = {};
    return o.reduce((a, u, c, d) => {
      if (l[c])
        return a;
      if (typeof u == "string") {
        let f = c, g = !1;
        u = u.replace(/%[1cdfiOos]/g, (m) => {
          if (f += 1, m !== "%c")
            return m;
          const T = d[f];
          return typeof T == "string" ? (l[f] = !0, g = !0, s(T, u)) : m;
        }), g && t && (u = t(u));
      }
      return a.push(u), a;
    }, []);
  }
  return ks;
}
var qs, tc;
function Fp() {
  if (tc) return qs;
  tc = 1;
  const {
    concatFirstStringElements: e,
    format: n
  } = nd(), { maxDepth: r, toJSON: i } = un(), {
    applyAnsiStyles: o,
    removeStyles: s
  } = fo(), { transform: t } = qt(), l = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    verbose: console.info,
    debug: console.debug,
    silly: console.debug,
    log: console.log
  };
  qs = c;
  const u = `%c{h}:{i}:{s}.{ms}{scope}%c ${process.platform === "win32" ? ">" : "›"} {text}`;
  Object.assign(c, {
    DEFAULT_FORMAT: u
  });
  function c(T) {
    return Object.assign(p, {
      colorMap: {
        error: "red",
        warn: "yellow",
        info: "cyan",
        verbose: "unset",
        debug: "gray",
        silly: "gray",
        default: "unset"
      },
      format: u,
      level: "silly",
      transforms: [
        d,
        n,
        g,
        e,
        r,
        i
      ],
      useStyles: process.env.FORCE_STYLES,
      writeFn({ message: v }) {
        (l[v.level] || l.info)(...v.data);
      }
    });
    function p(v) {
      const b = t({ logger: T, message: v, transport: p });
      p.writeFn({
        message: { ...v, data: b }
      });
    }
  }
  function d({ data: T, message: p, transport: v }) {
    return typeof v.format != "string" || !v.format.includes("%c") ? T : [
      `color:${m(p.level, v)}`,
      "color:unset",
      ...T
    ];
  }
  function f(T, p) {
    if (typeof T == "boolean")
      return T;
    const b = p === "error" || p === "warn" ? process.stderr : process.stdout;
    return b && b.isTTY;
  }
  function g(T) {
    const { message: p, transport: v } = T;
    return (f(v.useStyles, p.level) ? o : s)(T);
  }
  function m(T, p) {
    return p.colorMap[T] || p.colorMap.default;
  }
  return qs;
}
var $s, rc;
function id() {
  if (rc) return $s;
  rc = 1;
  const e = en, n = Ce, r = At;
  class i extends e {
    asyncWriteQueue = [];
    bytesWritten = 0;
    hasActiveAsyncWriting = !1;
    path = null;
    initialSize = void 0;
    writeOptions = null;
    writeAsync = !1;
    constructor({
      path: t,
      writeOptions: l = { encoding: "utf8", flag: "a", mode: 438 },
      writeAsync: a = !1
    }) {
      super(), this.path = t, this.writeOptions = l, this.writeAsync = a;
    }
    get size() {
      return this.getSize();
    }
    clear() {
      try {
        return n.writeFileSync(this.path, "", {
          mode: this.writeOptions.mode,
          flag: "w"
        }), this.reset(), !0;
      } catch (t) {
        return t.code === "ENOENT" ? !0 : (this.emit("error", t, this), !1);
      }
    }
    crop(t) {
      try {
        const l = o(this.path, t || 4096);
        this.clear(), this.writeLine(`[log cropped]${r.EOL}${l}`);
      } catch (l) {
        this.emit(
          "error",
          new Error(`Couldn't crop file ${this.path}. ${l.message}`),
          this
        );
      }
    }
    getSize() {
      if (this.initialSize === void 0)
        try {
          const t = n.statSync(this.path);
          this.initialSize = t.size;
        } catch {
          this.initialSize = 0;
        }
      return this.initialSize + this.bytesWritten;
    }
    increaseBytesWrittenCounter(t) {
      this.bytesWritten += Buffer.byteLength(t, this.writeOptions.encoding);
    }
    isNull() {
      return !1;
    }
    nextAsyncWrite() {
      const t = this;
      if (this.hasActiveAsyncWriting || this.asyncWriteQueue.length === 0)
        return;
      const l = this.asyncWriteQueue.join("");
      this.asyncWriteQueue = [], this.hasActiveAsyncWriting = !0, n.writeFile(this.path, l, this.writeOptions, (a) => {
        t.hasActiveAsyncWriting = !1, a ? t.emit(
          "error",
          new Error(`Couldn't write to ${t.path}. ${a.message}`),
          this
        ) : t.increaseBytesWrittenCounter(l), t.nextAsyncWrite();
      });
    }
    reset() {
      this.initialSize = void 0, this.bytesWritten = 0;
    }
    toString() {
      return this.path;
    }
    writeLine(t) {
      if (t += r.EOL, this.writeAsync) {
        this.asyncWriteQueue.push(t), this.nextAsyncWrite();
        return;
      }
      try {
        n.writeFileSync(this.path, t, this.writeOptions), this.increaseBytesWrittenCounter(t);
      } catch (l) {
        this.emit(
          "error",
          new Error(`Couldn't write to ${this.path}. ${l.message}`),
          this
        );
      }
    }
  }
  $s = i;
  function o(s, t) {
    const l = Buffer.alloc(t), a = n.statSync(s), u = Math.min(a.size, t), c = Math.max(0, a.size - t), d = n.openSync(s, "r"), f = n.readSync(d, l, 0, u, c);
    return n.closeSync(d), l.toString("utf8", 0, f);
  }
  return $s;
}
var Ms, nc;
function xp() {
  if (nc) return Ms;
  nc = 1;
  const e = id();
  class n extends e {
    clear() {
    }
    crop() {
    }
    getSize() {
      return 0;
    }
    isNull() {
      return !0;
    }
    writeLine() {
    }
  }
  return Ms = n, Ms;
}
var Bs, ic;
function kp() {
  if (ic) return Bs;
  ic = 1;
  const e = en, n = Ce, r = Se, i = id(), o = xp();
  class s extends e {
    store = {};
    constructor() {
      super(), this.emitError = this.emitError.bind(this);
    }
    /**
     * Provide a File object corresponding to the filePath
     * @param {string} filePath
     * @param {WriteOptions} [writeOptions]
     * @param {boolean} [writeAsync]
     * @return {File}
     */
    provide({ filePath: l, writeOptions: a = {}, writeAsync: u = !1 }) {
      let c;
      try {
        if (l = r.resolve(l), this.store[l])
          return this.store[l];
        c = this.createFile({ filePath: l, writeOptions: a, writeAsync: u });
      } catch (d) {
        c = new o({ path: l }), this.emitError(d, c);
      }
      return c.on("error", this.emitError), this.store[l] = c, c;
    }
    /**
     * @param {string} filePath
     * @param {WriteOptions} writeOptions
     * @param {boolean} async
     * @return {File}
     * @private
     */
    createFile({ filePath: l, writeOptions: a, writeAsync: u }) {
      return this.testFileWriting({ filePath: l, writeOptions: a }), new i({ path: l, writeOptions: a, writeAsync: u });
    }
    /**
     * @param {Error} error
     * @param {File} file
     * @private
     */
    emitError(l, a) {
      this.emit("error", l, a);
    }
    /**
     * @param {string} filePath
     * @param {WriteOptions} writeOptions
     * @private
     */
    testFileWriting({ filePath: l, writeOptions: a }) {
      n.mkdirSync(r.dirname(l), { recursive: !0 }), n.writeFileSync(l, "", { flag: "a", mode: a.mode });
    }
  }
  return Bs = s, Bs;
}
var Hs, sc;
function qp() {
  if (sc) return Hs;
  sc = 1;
  const e = Ce, n = At, r = Se, i = kp(), { transform: o } = qt(), { removeStyles: s } = fo(), {
    format: t,
    concatFirstStringElements: l
  } = nd(), { toString: a } = un();
  Hs = c;
  const u = new i();
  function c(f, { registry: g = u, externalApi: m } = {}) {
    let T;
    return g.listenerCount("error") < 1 && g.on("error", (k, R) => {
      b(`Can't write to ${R}`, k);
    }), Object.assign(p, {
      fileName: d(f.variables.processType),
      format: "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}",
      getFile: N,
      inspectOptions: { depth: 5 },
      level: "silly",
      maxSize: 1024 ** 2,
      readAllLogs: O,
      sync: !0,
      transforms: [s, t, l, a],
      writeOptions: { flag: "a", mode: 438, encoding: "utf8" },
      archiveLogFn(k) {
        const R = k.toString(), S = r.parse(R);
        try {
          e.renameSync(R, r.join(S.dir, `${S.name}.old${S.ext}`));
        } catch (w) {
          b("Could not rotate log", w);
          const y = Math.round(p.maxSize / 4);
          k.crop(Math.min(y, 256 * 1024));
        }
      },
      resolvePathFn(k) {
        return r.join(k.libraryDefaultDir, k.fileName);
      },
      setAppName(k) {
        f.dependencies.externalApi.setAppName(k);
      }
    });
    function p(k) {
      const R = N(k);
      p.maxSize > 0 && R.size > p.maxSize && (p.archiveLogFn(R), R.reset());
      const w = o({ logger: f, message: k, transport: p });
      R.writeLine(w);
    }
    function v() {
      T || (T = Object.create(
        Object.prototype,
        {
          ...Object.getOwnPropertyDescriptors(
            m.getPathVariables()
          ),
          fileName: {
            get() {
              return p.fileName;
            },
            enumerable: !0
          }
        }
      ), typeof p.archiveLog == "function" && (p.archiveLogFn = p.archiveLog, b("archiveLog is deprecated. Use archiveLogFn instead")), typeof p.resolvePath == "function" && (p.resolvePathFn = p.resolvePath, b("resolvePath is deprecated. Use resolvePathFn instead")));
    }
    function b(k, R = null, S = "error") {
      const w = [`electron-log.transports.file: ${k}`];
      R && w.push(R), f.transports.console({ data: w, date: /* @__PURE__ */ new Date(), level: S });
    }
    function N(k) {
      v();
      const R = p.resolvePathFn(T, k);
      return g.provide({
        filePath: R,
        writeAsync: !p.sync,
        writeOptions: p.writeOptions
      });
    }
    function O({ fileFilter: k = (R) => R.endsWith(".log") } = {}) {
      v();
      const R = r.dirname(p.resolvePathFn(T));
      return e.existsSync(R) ? e.readdirSync(R).map((S) => r.join(R, S)).filter(k).map((S) => {
        try {
          return {
            path: S,
            lines: e.readFileSync(S, "utf8").split(n.EOL)
          };
        } catch {
          return null;
        }
      }).filter(Boolean) : [];
    }
  }
  function d(f = process.type) {
    switch (f) {
      case "renderer":
        return "renderer.log";
      case "worker":
        return "worker.log";
      default:
        return "main.log";
    }
  }
  return Hs;
}
var js, oc;
function $p() {
  if (oc) return js;
  oc = 1;
  const { maxDepth: e, toJSON: n } = un(), { transform: r } = qt();
  js = i;
  function i(o, { externalApi: s }) {
    return Object.assign(t, {
      depth: 3,
      eventId: "__ELECTRON_LOG_IPC__",
      level: o.isDev ? "silly" : !1,
      transforms: [n, e]
    }), s?.isElectron() ? t : void 0;
    function t(l) {
      l?.variables?.processType !== "renderer" && s?.sendIpc(t.eventId, {
        ...l,
        data: r({ logger: o, message: l, transport: t })
      });
    }
  }
  return js;
}
var Xs, ac;
function Mp() {
  if (ac) return Xs;
  ac = 1;
  const e = Tc, n = uf, { transform: r } = qt(), { removeStyles: i } = fo(), { toJSON: o, maxDepth: s } = un();
  Xs = t;
  function t(l) {
    return Object.assign(a, {
      client: { name: "electron-application" },
      depth: 6,
      level: !1,
      requestOptions: {},
      transforms: [i, o, s],
      makeBodyFn({ message: u }) {
        return JSON.stringify({
          client: a.client,
          data: u.data,
          date: u.date.getTime(),
          level: u.level,
          scope: u.scope,
          variables: u.variables
        });
      },
      processErrorFn({ error: u }) {
        l.processMessage(
          {
            data: [`electron-log: can't POST ${a.url}`, u],
            level: "warn"
          },
          { transports: ["console", "file"] }
        );
      },
      sendRequestFn({ serverUrl: u, requestOptions: c, body: d }) {
        const g = (u.startsWith("https:") ? n : e).request(u, {
          method: "POST",
          ...c,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": d.length,
            ...c.headers
          }
        });
        return g.write(d), g.end(), g;
      }
    });
    function a(u) {
      if (!a.url)
        return;
      const c = a.makeBodyFn({
        logger: l,
        message: { ...u, data: r({ logger: l, message: u, transport: a }) },
        transport: a
      }), d = a.sendRequestFn({
        serverUrl: a.url,
        requestOptions: a.requestOptions,
        body: Buffer.from(c, "utf8")
      });
      d.on("error", (f) => a.processErrorFn({
        error: f,
        logger: l,
        message: u,
        request: d,
        transport: a
      }));
    }
  }
  return Xs;
}
var Gs, lc;
function sd() {
  if (lc) return Gs;
  lc = 1;
  const e = td(), n = Dp(), r = Up(), i = Fp(), o = qp(), s = $p(), t = Mp();
  Gs = l;
  function l({ dependencies: a, initializeFn: u }) {
    const c = new e({
      dependencies: a,
      errorHandler: new n(),
      eventLogger: new r(),
      initializeFn: u,
      isDev: a.externalApi?.isDev(),
      logId: "default",
      transportFactories: {
        console: i,
        file: o,
        ipc: s,
        remote: t
      },
      variables: {
        processType: "main"
      }
    });
    return c.default = c, c.Logger = e, c.processInternalErrorFn = (d) => {
      c.transports.console.writeFn({
        message: {
          data: ["Unhandled electron-log error", d],
          level: "error"
        }
      });
    }, c;
  }
  return Gs;
}
var Ws, uc;
function Bp() {
  if (uc) return Ws;
  uc = 1;
  const e = St, n = Lp(), { initialize: r } = Pp(), i = sd(), o = new n({ electron: e }), s = i({
    dependencies: { externalApi: o },
    initializeFn: r
  });
  Ws = s, o.onIpc("__ELECTRON_LOG__", (l, a) => {
    a.scope && s.Logger.getInstance(a).scope(a.scope);
    const u = new Date(a.date);
    t({
      ...a,
      date: u.getTime() ? u : /* @__PURE__ */ new Date()
    });
  }), o.onIpcInvoke("__ELECTRON_LOG__", (l, { cmd: a = "", logId: u }) => a === "getOptions" ? {
    levels: s.Logger.getInstance({ logId: u }).levels,
    logId: u
  } : (t({ data: [`Unknown cmd '${a}'`], level: "error" }), {}));
  function t(l) {
    s.Logger.getInstance(l)?.processMessage(l);
  }
  return Ws;
}
var Vs, cc;
function Hp() {
  if (cc) return Vs;
  cc = 1;
  const e = rd(), n = sd(), r = new e();
  return Vs = n({
    dependencies: { externalApi: r }
  }), Vs;
}
var dc;
function jp() {
  if (dc) return wr.exports;
  dc = 1;
  const e = typeof process > "u" || process.type === "renderer" || process.type === "worker", n = typeof process == "object" && process.type === "browser";
  return e ? (ed(), wr.exports = Op()) : n ? wr.exports = Bp() : wr.exports = Hp(), wr.exports;
}
var Xp = jp();
const Ys = /* @__PURE__ */ jf(Xp);
class Gp {
  constructor() {
    Ys.transports.file.level = "info", at.autoUpdater.logger = Ys, this.initListeners();
  }
  initListeners() {
    at.autoUpdater.on("checking-for-update", () => {
      this.sendStatusToWindow("Checking for update...");
    }), at.autoUpdater.on("update-available", (n) => {
      this.sendStatusToWindow("Update available.");
      const r = ht.getAllWindows()[0];
      r && r.webContents.send("updater:update-available", n);
    }), at.autoUpdater.on("update-not-available", (n) => {
      this.sendStatusToWindow("Update not available.");
      const r = ht.getAllWindows()[0];
      r && r.webContents.send("updater:update-not-available", n);
    }), at.autoUpdater.on("error", (n) => {
      this.sendStatusToWindow("Error in auto-updater. " + n);
      const r = ht.getAllWindows()[0];
      r && r.webContents.send("updater:error", n.toString());
    }), at.autoUpdater.on("download-progress", (n) => {
      let r = "Download speed: " + n.bytesPerSecond;
      r = r + " - Downloaded " + n.percent + "%", r = r + " (" + n.transferred + "/" + n.total + ")", this.sendStatusToWindow(r);
    }), at.autoUpdater.on("update-downloaded", (n) => {
      this.sendStatusToWindow("Update downloaded");
      const r = ht.getAllWindows()[0];
      r && r.webContents.send("updater:update-downloaded", n);
    });
  }
  sendStatusToWindow(n) {
    Ys.info(n);
    const r = ht.getAllWindows()[0];
    r && r.webContents.send("updater:status", n);
  }
  checkForUpdates() {
    at.autoUpdater.checkForUpdates();
  }
  quitAndInstall() {
    at.autoUpdater.quitAndInstall();
  }
  checkForUpdatesAndNotify() {
    at.autoUpdater.checkForUpdatesAndNotify();
  }
}
const Wp = [
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".gif",
  ".webp",
  ".woff",
  ".woff2",
  ".ttf"
], Gt = Se.join(We.getPath("userData"), "assets");
Ce.existsSync(Gt) || Ce.mkdirSync(Gt, { recursive: !0 });
class Vp {
  constructor(n) {
    this.pendingRequests = /* @__PURE__ */ new Map(), this.p2pService = n, this.initP2P(), this.initProtocol();
  }
  getHash(n) {
    return Je.createHash("md5").update(n).digest("hex");
  }
  getFilePath(n) {
    const r = this.getHash(n), i = Se.extname(new URL(n).pathname) || ".bin";
    return Se.join(Gt, `${r}${i}`);
  }
  importLocalAsset(n) {
    const r = Se.extname(n), o = `${Je.createHash("md5").update(n + Date.now().toString()).digest("hex")}${r}`, s = Se.join(Gt, o);
    return Ce.copyFileSync(n, s), `asset:///${o}`;
  }
  initP2P() {
    this.p2pService.onMessage((n) => {
      n.type === "REQUEST_ASSET" ? this.handleAssetRequest(n) : n.type === "RESPONSE_ASSET" && this.handleAssetResponse(n);
    });
  }
  async handleAssetRequest(n) {
    const { url: r, requestId: i } = n, o = this.getFilePath(r);
    if (Ce.existsSync(o))
      try {
        const s = Ce.readFileSync(o);
        this.p2pService.broadcast({
          type: "RESPONSE_ASSET",
          requestId: i,
          url: r,
          data: s.toString("base64")
        });
      } catch (s) {
        console.error("Error reading asset for P2P:", s);
      }
  }
  handleAssetResponse(n) {
    const { requestId: r, data: i, url: o } = n;
    if (this.pendingRequests.has(r)) {
      const s = this.pendingRequests.get(r);
      if (s) {
        const t = Buffer.from(i, "base64"), l = this.getFilePath(o);
        Ce.writeFileSync(l, t), s(t), this.pendingRequests.delete(r);
      }
    }
  }
  initProtocol() {
    Js.handle("asset", async (n) => {
      try {
        const r = new URL(n.url);
        let i = r.pathname.replace(/^\//, "");
        !i && r.host && (i = r.host);
        const o = Se.join(Gt, i);
        if (!o.startsWith(Gt))
          return new Response("Forbidden", { status: 403 });
        const s = bo(o).toString();
        return vt.fetch(s);
      } catch (r) {
        return console.error("Asset protocol error:", r), new Response("Not Found", { status: 404 });
      }
    }), Js.handle("https", async (n) => {
      const r = n.url, i = r.split("?")[0].toLowerCase();
      if (!Wp.some((l) => i.endsWith(l)))
        return vt.fetch(n, { bypassCustomProtocolHandlers: !0 });
      const s = this.getFilePath(r);
      if (Ce.existsSync(s)) {
        console.log(`[AssetService] Serving from cache: ${r}`);
        const l = bo(s).toString();
        return vt.fetch(l);
      }
      try {
        const l = await vt.fetch(n, {
          bypassCustomProtocolHandlers: !0
        });
        if (l.ok) {
          const a = await l.arrayBuffer();
          return Ce.writeFileSync(s, Buffer.from(a)), new Response(a, {
            headers: l.headers,
            status: l.status,
            statusText: l.statusText
          });
        }
      } catch {
        console.log(`[AssetService] Fetch failed, trying P2P: ${r}`);
      }
      const t = await this.requestFromPeers(r);
      return t ? new Response(t) : new Response("Not Found", { status: 404 });
    });
  }
  requestFromPeers(n) {
    return new Promise((r) => {
      const i = Je.randomUUID(), o = setTimeout(() => {
        this.pendingRequests.delete(i), r(null);
      }, 3e3);
      this.pendingRequests.set(i, (s) => {
        clearTimeout(o), r(s);
      }), this.p2pService.broadcast({
        type: "REQUEST_ASSET",
        requestId: i,
        url: n
      });
    });
  }
}
var ho = /* @__PURE__ */ ((e) => (e.CREATE = "CREATE", e.UPDATE = "UPDATE", e.DELETE = "DELETE", e))(ho || {});
const Yp = "https://seal-app-wzqhf.ondigitalocean.app/api/v1", od = "https://seahorse-app-jb6pe.ondigitalocean.app/sync", fc = `${Yp}/upload`, hc = `${od}/push`, zp = `${od}/pull`, Jp = 300 * 1e3;
class Kp {
  constructor(n, r, i) {
    this.isSyncing = !1, this.isPulling = !1, this.isUploading = !1, this.lastPullAt = 0, this.db = n, this.network = r, this.p2p = i, this.init();
  }
  async triggerSync() {
    console.log("[SyncService] Triggering manual sync..."), this.lastPullAt = 0, await this.checkLeaderAndSync();
  }
  init() {
    this.network.onStatusChange((n) => {
      n && this.checkLeaderAndSync();
    }), setInterval(() => this.checkLeaderAndSync(), 6e4), this.checkLeaderAndSync();
  }
  async checkLeaderAndSync() {
    if (!this.network.getStatus().online || !this.db.getSyncUserId())
      return;
    await this.processOfflineImages(), this.p2p.getPeers();
    const i = this.p2p.getDeviceId(), o = this.p2p.getDevices(), t = [i, ...o].sort()[0];
    if (i !== t) {
      console.log(
        `[SyncService] I am not the leader. Leader is ${t}. Waiting for leader to sync (or sending to leader).`
      );
      return;
    }
    Date.now() - this.lastPullAt >= Jp && (console.log("[SyncService] I am the leader. Initiating pull sync..."), await this.performPull(), this.lastPullAt = Date.now());
    const a = this.db.getPendingQueueItems();
    a.length !== 0 && (console.log(
      `[SyncService] Initiating push sync for ${a.length} pending items...`
    ), await this.attemptSync(a));
  }
  async performPull() {
    if (!this.isPulling) {
      this.isPulling = !0;
      try {
        const n = this.db.getSyncUserId();
        if (!n)
          return;
        const r = new URL(zp);
        r.searchParams.set("userId", String(n));
        const i = this.db.getCache("last_sync_timestamp");
        i && r.searchParams.set("lastSyncTimestamp", i), console.log(`[SyncService] Pulling data from ${r.toString()}...`);
        const o = await vt.fetch(r.toString(), {
          method: "GET"
        });
        if (!o.ok) {
          const t = await o.text();
          console.error(
            `[SyncService] Pull sync failed: HTTP ${o.status}: ${t}`
          );
          return;
        }
        const s = await o.json();
        if (!s || !s.data || !s.currentTimestamp) {
          console.error(
            "[SyncService] Pull sync response missing data or currentTimestamp"
          );
          return;
        }
        console.log("Pulled stuff", s), this.db.applyPullData({
          currentTimestamp: s.currentTimestamp,
          data: s.data
        }), this.db.putCache("last_sync_timestamp", s.currentTimestamp);
      } catch (n) {
        console.error("[SyncService] Pull sync error:", n);
      } finally {
        this.isPulling = !1;
      }
    }
  }
  async processOfflineImages() {
    if (!this.isUploading) {
      this.isUploading = !0;
      try {
        const n = this.db.getPendingImageUploads();
        if (n.length === 0) return;
        console.log(
          `[SyncService] Found ${n.length} offline images to upload...`
        );
        for (const r of n) {
          let i = r.localPath;
          i.startsWith("file://") && (i = i.replace("file://", ""));
          try {
            i = decodeURIComponent(i);
          } catch {
          }
          if (!Ce.existsSync(i)) {
            console.error(
              `[SyncService] Local image file not found: ${i}`
            ), this.db.failImageUpload(r.id, "File not found");
            continue;
          }
          const o = Se.basename(i), s = Ce.readFileSync(i), t = new Blob([s]), l = new FormData();
          l.append("image", t, o), console.log(
            `[SyncService] Uploading ${o} to ${fc}...`
          );
          const a = await fetch(fc, {
            method: "POST",
            body: l
          });
          if (!a.ok) {
            const d = await a.text();
            console.error(
              `[SyncService] Upload failed for ${r.id}: ${a.status} ${d}`
            );
            continue;
          }
          const u = await a.json(), c = u.url || u.data?.url;
          if (c) {
            console.log(`[SyncService] Upload successful. URL: ${c}`), this.db.updateRecordColumn(
              r.tableName,
              r.recordId,
              r.columnName,
              c
            ), r.tableName === "business_outlet" && r.columnName === "logoUrl" && this.db.run(
              "UPDATE business_outlet SET isOfflineImage = 0, localLogoPath = NULL WHERE id = ?",
              [r.recordId]
            ), this.db.markImageAsUploaded(r.id);
            const d = this.db.query(
              `SELECT * FROM ${r.tableName} WHERE id = ?`,
              [r.recordId]
            );
            if (d && d.length > 0) {
              const f = d[0], g = {
                table: r.tableName,
                action: ho.UPDATE,
                data: f,
                id: r.recordId
              };
              this.db.addToQueue(g);
            }
          } else
            console.error("[SyncService] Upload response missing URL", u);
        }
      } catch (n) {
        console.error("[SyncService] processOfflineImages error:", n);
      } finally {
        this.isUploading = !1;
      }
    }
  }
  async attemptSync(n) {
    if (!this.isSyncing) {
      this.isSyncing = !0;
      try {
        const r = n || this.db.getPendingQueueItems();
        if (r.length === 0) {
          this.isSyncing = !1;
          return;
        }
        console.log(
          `[SyncService] Syncing ${r.length} items to ${hc}...`
        );
        const i = this.db.getIdentity()?.deviceId || "unknown-device";
        console.log("Device", this.db.getIdentity());
        const o = r.map((l) => {
          const a = JSON.parse(l.op);
          return {
            id: l.id,
            tableName: a.tableName || a.table,
            recordId: a.recordId || a.id,
            recordData: JSON.stringify(a.data),
            sourceDeviceId: i,
            action: a.action,
            timestamp: l.created_at,
            version: 1,
            syncedTo: [],
            createdAt: l.created_at,
            updatedAt: l.created_at
          };
        });
        console.log("Recordss stuff", o);
        const s = { records: o };
        console.log(s);
        const t = await vt.fetch(hc, {
          method: "POST",
          body: JSON.stringify(s),
          headers: { "Content-Type": "application/json" }
        });
        if (t.ok) {
          const l = r.map((a) => a.id);
          this.db.markAsSynced(l), console.log(`[SyncService] Successfully synced ${l.length} items.`);
        } else {
          const l = await t.text();
          console.error(`[SyncService] Sync failed: ${t.status} ${l}`);
        }
      } catch (r) {
        console.error("[SyncService] Sync process error:", r);
      } finally {
        this.isSyncing = !1;
      }
    }
  }
}
const Qp = async (e, n) => {
  const { outletId: r, data: i } = n;
  console.log(i);
  let o = 0, s;
  if (i.logoUrl && i.logoUrl.startsWith("asset://")) {
    o = 1;
    try {
      const l = new URL(i.logoUrl);
      let a = l.pathname.replace(/^\//, "");
      !a && l.host && (a = l.host);
      const u = We.getPath("userData");
      s = Se.join(u, "assets", a);
    } catch (l) {
      console.error("Failed to parse asset URL", l);
    }
  }
  const t = (/* @__PURE__ */ new Date()).toISOString();
  if (e.run(
    `
    UPDATE business_outlet
    SET
      name = COALESCE(@name, name),
      email = COALESCE(@email, email),
      phoneNumber = COALESCE(@phoneNumber, phoneNumber),
      country = COALESCE(@country, country),
      state = COALESCE(@state, state),
      address = COALESCE(@address, address),
      postalCode = COALESCE(@postalCode, postalCode),
      businessType = COALESCE(@businessType, businessType),
      currency = COALESCE(@currency, currency),

      logoUrl = COALESCE(@logoUrl, logoUrl),
      isOfflineImage = COALESCE(@isOfflineImage, isOfflineImage),
      localLogoPath = COALESCE(@localLogoPath, localLogoPath),
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId: r,
      name: i.name,
      email: i.email,
      phoneNumber: i.phoneNumber,
      country: i.country,
      state: i.state,
      address: i.address,
      postalCode: i.postalCode,
      businessType: i.businessType,
      currency: i.currency,
      logoUrl: i.logoUrl,
      isOfflineImage: o,
      localLogoPath: s,
      updatedAt: t
    }
  ), s)
    e.addToImageQueue({
      localPath: s,
      tableName: "business_outlet",
      recordId: r,
      columnName: "logoUrl"
    });
  else {
    const l = e.getOutlet(r);
    l && e.addToQueue({
      table: "business_outlet",
      action: ho.UPDATE,
      data: l,
      id: r
    });
  }
  return { success: !0 };
}, cn = (e, n) => {
  const r = e.getOutlet(n);
  if (!r || !r.priceTier) return [];
  try {
    return typeof r.priceTier == "string" ? JSON.parse(r.priceTier) : r.priceTier;
  } catch {
    return [];
  }
}, Cr = (e, n, r) => {
  const i = (/* @__PURE__ */ new Date()).toISOString(), o = JSON.stringify(r);
  e.run(
    `
    UPDATE business_outlet
    SET
      priceTier = @priceTier,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId: n,
      priceTier: o,
      updatedAt: i
    }
  );
  const s = e.getOutlet(n);
  s && e.addToQueue({
    table: "business_outlet",
    action: "UPDATE",
    data: s,
    id: n
  });
}, Zp = async (e, n) => {
  const { outletId: r, priceTier: i } = n;
  return Cr(e, r, i), { success: !0 };
}, eg = async (e, n) => {
  const { outletId: r, tiers: i } = n, o = cn(e, r), s = i.map((t) => ({
    ...t,
    id: typeof t.id == "number" && t.id < 0 ? Wt.v4() : t.id || Wt.v4(),
    isNew: !1
  }));
  return o.push(...s), Cr(e, r, o), { success: !0, tiers: o };
}, tg = async (e, n) => {
  const { outletId: r, tier: i } = n, o = cn(e, r), s = {
    ...i,
    id: typeof i.id == "number" && i.id < 0 ? Wt.v4() : i.id || Wt.v4(),
    isNew: !1
    // Ensure isNew is false when saving to DB
  };
  return o.push(s), Cr(e, r, o), { success: !0, tier: s, tiers: o };
}, rg = async (e, n) => {
  const { outletId: r, tierId: i } = n;
  let o = cn(e, r);
  return o = o.filter((s) => s.id !== i), Cr(e, r, o), { success: !0, tiers: o };
}, ng = async (e, n) => {
  const { outletId: r, tier: i } = n, o = cn(e, r), s = o.findIndex((t) => t.id === i.id);
  return s !== -1 ? (o[s] = { ...o[s], ...i, isNew: !1 }, Cr(e, r, o), { success: !0, tier: o[s], tiers: o }) : { success: !1, message: "Tier not found" };
}, ig = async (e, n) => {
  const { outletId: r, settings: i } = n, o = (/* @__PURE__ */ new Date()).toISOString();
  e.run(
    `
    UPDATE business_outlet
    SET
      receiptSettings = @receiptSettings,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId: r,
      receiptSettings: JSON.stringify(i),
      updatedAt: o
    }
  );
  const s = e.getOutlet(r);
  return s && e.addToQueue({
    table: "business_outlet",
    action: "UPDATE",
    data: s,
    id: r
  }), { success: !0, settings: i };
}, sg = async (e, n) => {
  const { outletId: r, settings: i } = n, o = (/* @__PURE__ */ new Date()).toISOString();
  e.run(
    `
    UPDATE business_outlet
    SET
      labelSettings = @labelSettings,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId: r,
      labelSettings: JSON.stringify(i),
      updatedAt: o
    }
  );
  const s = e.getOutlet(r);
  return s && e.addToQueue({
    table: "business_outlet",
    action: "UPDATE",
    data: s,
    id: r
  }), { success: !0, settings: i };
}, og = async (e, n) => {
  const { outletId: r, settings: i } = n, o = (/* @__PURE__ */ new Date()).toISOString();
  e.run(
    `
    UPDATE business_outlet
    SET
      invoiceSettings = @invoiceSettings,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId: r,
      invoiceSettings: JSON.stringify(i),
      updatedAt: o
    }
  );
  const s = e.getOutlet(r);
  return s && e.addToQueue({
    table: "business_outlet",
    action: "UPDATE",
    data: s,
    id: r
  }), { success: !0, settings: i };
}, ag = async (e, n) => {
  const { outletId: r, operatingHours: i } = n, o = (/* @__PURE__ */ new Date()).toISOString();
  e.run(
    `
    UPDATE business_outlet
    SET
      operatingHours = @operatingHours,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId: r,
      operatingHours: JSON.stringify(i),
      updatedAt: o
    }
  );
  const s = e.getOutlet(r);
  return s && e.addToQueue({
    table: "business_outlet",
    action: "UPDATE",
    data: s,
    id: r
  }), { success: !0, operatingHours: i };
}, lg = async (e, n) => {
  const { outletId: r, paymentMethods: i } = n, o = (/* @__PURE__ */ new Date()).toISOString();
  e.run(
    `
    UPDATE business_outlet
    SET
      paymentMethods = @paymentMethods,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId: r,
      paymentMethods: JSON.stringify(i),
      updatedAt: o
    }
  );
  const s = e.getOutlet(r);
  return s && e.addToQueue({
    table: "business_outlet",
    action: "UPDATE",
    data: s,
    id: r
  }), { success: !0, paymentMethods: i };
}, ug = async (e, n) => {
  const { outletId: r, settings: i } = n, o = (/* @__PURE__ */ new Date()).toISOString();
  e.run(
    `
    UPDATE business_outlet
    SET
      taxSettings = @taxSettings,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId: r,
      taxSettings: JSON.stringify(i),
      updatedAt: o
    }
  );
  const s = e.getOutlet(r);
  return s && e.addToQueue({
    table: "business_outlet",
    action: "UPDATE",
    data: s,
    id: r
  }), { success: !0, settings: i };
}, cg = async (e, n) => {
  const { outletId: r, charges: i } = n, o = (/* @__PURE__ */ new Date()).toISOString();
  e.run(
    `
    UPDATE business_outlet
    SET
      serviceCharges = @serviceCharges,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId: r,
      serviceCharges: JSON.stringify(i),
      updatedAt: o
    }
  );
  const s = e.getOutlet(r);
  return s && e.addToQueue({
    table: "business_outlet",
    action: "UPDATE",
    data: s,
    id: r
  }), { success: !0, charges: i };
}, dg = async (e, n) => {
  const { businessId: r, location: i } = n, o = sf(), s = (/* @__PURE__ */ new Date()).toISOString(), t = {
    id: o,
    businessId: r,
    name: i.name,
    address: i.address,
    phoneNumber: i.phoneNumber,
    isMainLocation: i.isMainLocation ? 1 : 0,
    isActive: 1,
    isOnboarded: 0,
    // Assuming created via settings is onboarded
    isDeleted: 0,
    createdAt: s,
    updatedAt: s
    // Default values for other fields to match schema expectations or avoid nulls if strict
  }, l = vc(t);
  return e.run(yc, l), e.addToQueue({
    table: "business_outlet",
    action: "CREATE",
    // or UPDATE since we use Upsert logic, but CREATE is semantically correct for sync
    data: t,
    id: o
  }), { success: !0, outlet: t };
}, fg = async (e, n) => {
  const { outletId: r, data: i } = n, o = (/* @__PURE__ */ new Date()).toISOString(), s = [], t = { outletId: r, updatedAt: o };
  if (i.name !== void 0 && (s.push("name = @name"), t.name = i.name), i.address !== void 0 && (s.push("address = @address"), t.address = i.address), i.phoneNumber !== void 0 && (s.push("phoneNumber = @phoneNumber"), t.phoneNumber = i.phoneNumber), i.isMainLocation !== void 0 && (s.push("isMainLocation = @isMainLocation"), t.isMainLocation = i.isMainLocation ? 1 : 0), s.length === 0) return { success: !0 };
  const l = `
    UPDATE business_outlet
    SET ${s.join(", ")}, updatedAt = @updatedAt
    WHERE id = @outletId
  `;
  e.run(l, t);
  const a = e.getOutlet(r);
  return a && e.addToQueue({
    table: "business_outlet",
    action: "UPDATE",
    data: a,
    id: r
  }), { success: !0, outlet: a };
}, hg = async (e, n) => {
  const { outletId: r } = n, i = (/* @__PURE__ */ new Date()).toISOString();
  e.run(
    "UPDATE business_outlet SET isDeleted = 1, updatedAt = @updatedAt WHERE id = @outletId",
    { outletId: r, updatedAt: i }
  );
  const o = e.getOutlet(r);
  return o && e.addToQueue({
    table: "business_outlet",
    action: "UPDATE",
    // Sync usually handles soft delete as an update to isDeleted flag
    data: o,
    id: r
  }), { success: !0 };
};
Js.registerSchemesAsPrivileged([
  {
    scheme: "asset",
    privileges: {
      secure: !0,
      standard: !0,
      supportFetchAPI: !0,
      corsEnabled: !0,
      bypassCSP: !0
    }
  }
]);
const pg = rf(import.meta.url), zs = Se.dirname(pg);
let Ne, ze, Jr, Ut, Kr, pc, Qr;
function gg() {
  return "dev-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function ad() {
  let e = Se.join(zs, "../electron/assets/icon.png");
  We.isPackaged ? e = Se.join(process.resourcesPath, "assets/icon.png") : e = Se.join(process.cwd(), "electron/assets/icon.png");
  const n = tf.createFromPath(e), r = new ht({
    width: 1200,
    height: 800,
    show: !1,
    backgroundColor: "#ffffff",
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0,
      preload: Se.join(zs, "preload.cjs")
    },
    icon: n
  });
  process.platform === "darwin" && We.dock.setIcon(n), r.webContents.on("render-process-gone", (i, o) => {
    console.error("Renderer process gone:", o), We.isPackaged && r.reload();
  }), r.webContents.on("did-fail-load", (i, o, s, t) => {
    console.error("FAILED LOAD:", o, s, t);
  }), process.env.VITE_DEV_SERVER_URL ? (r.loadURL(process.env.VITE_DEV_SERVER_URL), r.webContents.openDevTools()) : r.loadFile(Se.join(zs, "../dist/index.html")), r.once("ready-to-show", () => r.show());
}
We.whenReady().then(() => {
  Ne = new Vf(), ze = new Yf(Ne), Jr = new Jf(), Kr = new Gp();
  const e = ze.getUser() || {}, n = e.deviceId || gg();
  e.deviceId || ze.saveUser({ deviceId: n }), Ut = new Kf(n), Ut.start(), pc = new Vp(Ut), Qr = new Kp(Ne, Jr, Ut), ve.on("auth:storeTokens", async (r, i) => {
    await ze.storeTokens(i), Qr.triggerSync();
  }), ve.on("auth:clearTokens", () => ze.clearTokens()), ve.handle("auth:getTokens", () => ze.getTokens()), ve.handle(
    "auth:saveLoginHash",
    (r, i, o) => ze.saveLoginHash(i, o)
  ), ve.handle(
    "auth:verifyLoginHash",
    (r, i, o) => ze.verifyLoginHash(i, o)
  ), ve.handle(
    "auth:savePinHash",
    (r, i) => ze.savePinHash(i)
  ), ve.handle(
    "auth:verifyPinHash",
    (r, i) => ze.verifyPinHash(i)
  ), ve.handle("db:getUser", () => ze.getUser()), ve.handle("db:saveUser", (r, i) => {
    ze.saveUser(i), Qr.triggerSync();
  }), ve.handle("cache:get", (r, i) => Ne.getCache(i)), ve.handle(
    "cache:put",
    (r, i, o) => Ne.putCache(i, o)
  ), ve.handle(
    "db:saveOutletOnboarding",
    (r, i) => Ne.saveOutletOnboarding(i)
  ), ve.handle("db:getOutlets", () => Ne.getOutlets()), ve.handle(
    "db:updateBusinessDetails",
    (r, i) => Qp(Ne, i)
  ), ve.handle(
    "db:updatePaymentTier",
    (r, i) => Zp(Ne, i)
  ), ve.handle(
    "db:addPaymentTier",
    (r, i) => tg(Ne, i)
  ), ve.handle(
    "db:deletePaymentTier",
    (r, i) => rg(Ne, i)
  ), ve.handle(
    "db:editPaymentTier",
    (r, i) => ng(Ne, i)
  ), ve.handle(
    "db:bulkAddPaymentTiers",
    (r, i) => eg(Ne, i)
  ), ve.handle(
    "db:updateReceiptSettings",
    (r, i) => ig(Ne, i)
  ), ve.handle(
    "db:updateLabelSettings",
    (r, i) => sg(Ne, i)
  ), ve.handle(
    "db:updateInvoiceSettings",
    (r, i) => og(Ne, i)
  ), ve.handle(
    "db:updateOperatingHours",
    (r, i) => ag(Ne, i)
  ), ve.handle(
    "db:updatePaymentMethods",
    (r, i) => lg(Ne, i)
  ), ve.handle(
    "db:updateTaxSettings",
    (r, i) => ug(Ne, i)
  ), ve.handle(
    "db:updateServiceCharges",
    (r, i) => cg(Ne, i)
  ), ve.handle(
    "db:createOutlet",
    (r, i) => dg(Ne, i)
  ), ve.handle(
    "db:updateOutlet",
    (r, i) => fg(Ne, i)
  ), ve.handle(
    "db:deleteOutlet",
    (r, i) => hg(Ne, i)
  ), ve.handle(
    "db:createProduct",
    (r, i) => Ne.createProduct(i)
  ), ve.handle(
    "db:bulkCreateProducts",
    (r, i) => Ne.bulkCreateProducts(i)
  ), ve.handle(
    "db:query",
    (r, i, o) => Ne.query(i, o)
  ), ve.handle(
    "assets:import",
    (r, i) => pc.importLocalAsset(i)
  ), ve.handle("sync:trigger", () => Qr.triggerSync()), ve.handle("queue:add", (r, i) => Ne.addToQueue(i)), ve.handle("queue:list", () => Ne.getQueue()), ve.handle("queue:clear", () => Ne.clearQueue()), ve.handle("queue:set", (r, i) => Ne.setQueue(i)), ve.handle("network:getStatus", () => Jr.getStatus()), ve.on(
    "network:setOnline",
    (r, i) => Jr.setOnline(i)
  ), ve.handle("p2p:getPeers", () => Ut.getPeers()), ve.on(
    "p2p:broadcast",
    (r, i) => Ut.broadcast(i)
  ), ve.on(
    "p2p:sendToPeer",
    (r, i, o) => Ut.sendToPeerById(i, o)
  ), ve.on("updater:check", () => Kr.checkForUpdates()), ve.on("updater:quitAndInstall", () => Kr.quitAndInstall()), ve.on("system:factoryReset", async () => {
    try {
      console.log("Factory reset requested..."), await ze.clearTokens(), Ne.clearAllData(), console.log("Factory reset complete. Relaunching..."), We.relaunch(), We.exit(0);
    } catch (r) {
      console.error("Factory reset failed:", r);
    }
  }), setTimeout(() => {
    We.isPackaged && Kr.checkForUpdatesAndNotify();
  }, 3e3), ad();
});
We.on("window-all-closed", () => {
  process.platform !== "darwin" && We.quit();
});
We.on("activate", () => {
  ht.getAllWindows().length === 0 && ad();
});
