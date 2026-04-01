import wt, { app as je, BrowserWindow as st, net as pt, protocol as Zs, ipcMain as fe, shell as vf, nativeImage as Af } from "electron";
import be from "fs";
import ye from "path";
import Me, { randomUUID as If } from "crypto";
import Jt, { pathToFileURL as bo, fileURLToPath as Sf } from "url";
import yt from "os";
import Lo from "better-sqlite3";
import En from "keytar";
import Nf from "dgram";
import Co from "net";
import _f from "constants";
import Or from "stream";
import rn from "util";
import Au from "assert";
import br from "child_process";
import nn from "events";
import Iu from "tty";
import wf from "string_decoder";
import Su from "zlib";
import Nu from "http";
import Rf from "https";
var ot = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function _u(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var dt = { exports: {} };
const Of = "17.3.1", bf = {
  version: Of
};
var Do;
function Lf() {
  if (Do) return dt.exports;
  Do = 1;
  const e = be, r = ye, t = yt, n = Me, i = bf.version, o = [
    "🔐 encrypt with Dotenvx: https://dotenvx.com",
    "🔐 prevent committing .env to code: https://dotenvx.com/precommit",
    "🔐 prevent building .env in docker: https://dotenvx.com/prebuild",
    "🤖 agentic secret storage: https://dotenvx.com/as2",
    "⚡️ secrets for agents: https://dotenvx.com/as2",
    "🛡️ auth for agents: https://vestauth.com",
    "🛠️  run anywhere with `dotenvx run -- yourcommand`",
    "⚙️  specify custom .env file path with { path: '/custom/path/.env' }",
    "⚙️  enable debug logging with { debug: true }",
    "⚙️  override existing env vars with { override: true }",
    "⚙️  suppress all logs with { quiet: true }",
    "⚙️  write to custom object with { processEnv: myObject }",
    "⚙️  load multiple .env files with { path: ['.env.local', '.env'] }"
  ];
  function c() {
    return o[Math.floor(Math.random() * o.length)];
  }
  function a(O) {
    return typeof O == "string" ? !["false", "0", "no", "off", ""].includes(O.toLowerCase()) : !!O;
  }
  function u() {
    return process.stdout.isTTY;
  }
  function l(O) {
    return u() ? `\x1B[2m${O}\x1B[0m` : O;
  }
  const d = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
  function f(O) {
    const P = {};
    let k = O.toString();
    k = k.replace(/\r\n?/mg, `
`);
    let C;
    for (; (C = d.exec(k)) != null; ) {
      const x = C[1];
      let $ = C[2] || "";
      $ = $.trim();
      const L = $[0];
      $ = $.replace(/^(['"`])([\s\S]*)\1$/mg, "$2"), L === '"' && ($ = $.replace(/\\n/g, `
`), $ = $.replace(/\\r/g, "\r")), P[x] = $;
    }
    return P;
  }
  function h(O) {
    O = O || {};
    const P = b(O);
    O.path = P;
    const k = q.configDotenv(O);
    if (!k.parsed) {
      const L = new Error(`MISSING_DATA: Cannot parse ${P} for an unknown reason`);
      throw L.code = "MISSING_DATA", L;
    }
    const C = v(O).split(","), x = C.length;
    let $;
    for (let L = 0; L < x; L++)
      try {
        const j = C[L].trim(), G = N(k, j);
        $ = q.decrypt(G.ciphertext, G.key);
        break;
      } catch (j) {
        if (L + 1 >= x)
          throw j;
      }
    return q.parse($);
  }
  function E(O) {
    console.error(`[dotenv@${i}][WARN] ${O}`);
  }
  function g(O) {
    console.log(`[dotenv@${i}][DEBUG] ${O}`);
  }
  function m(O) {
    console.log(`[dotenv@${i}] ${O}`);
  }
  function v(O) {
    return O && O.DOTENV_KEY && O.DOTENV_KEY.length > 0 ? O.DOTENV_KEY : process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0 ? process.env.DOTENV_KEY : "";
  }
  function N(O, P) {
    let k;
    try {
      k = new URL(P);
    } catch (j) {
      if (j.code === "ERR_INVALID_URL") {
        const G = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
        throw G.code = "INVALID_DOTENV_KEY", G;
      }
      throw j;
    }
    const C = k.password;
    if (!C) {
      const j = new Error("INVALID_DOTENV_KEY: Missing key part");
      throw j.code = "INVALID_DOTENV_KEY", j;
    }
    const x = k.searchParams.get("environment");
    if (!x) {
      const j = new Error("INVALID_DOTENV_KEY: Missing environment part");
      throw j.code = "INVALID_DOTENV_KEY", j;
    }
    const $ = `DOTENV_VAULT_${x.toUpperCase()}`, L = O.parsed[$];
    if (!L) {
      const j = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${$} in your .env.vault file.`);
      throw j.code = "NOT_FOUND_DOTENV_ENVIRONMENT", j;
    }
    return { ciphertext: L, key: C };
  }
  function b(O) {
    let P = null;
    if (O && O.path && O.path.length > 0)
      if (Array.isArray(O.path))
        for (const k of O.path)
          e.existsSync(k) && (P = k.endsWith(".vault") ? k : `${k}.vault`);
      else
        P = O.path.endsWith(".vault") ? O.path : `${O.path}.vault`;
    else
      P = r.resolve(process.cwd(), ".env.vault");
    return e.existsSync(P) ? P : null;
  }
  function D(O) {
    return O[0] === "~" ? r.join(t.homedir(), O.slice(1)) : O;
  }
  function M(O) {
    const P = a(process.env.DOTENV_CONFIG_DEBUG || O && O.debug), k = a(process.env.DOTENV_CONFIG_QUIET || O && O.quiet);
    (P || !k) && m("Loading env from encrypted .env.vault");
    const C = q._parseVault(O);
    let x = process.env;
    return O && O.processEnv != null && (x = O.processEnv), q.populate(x, C, O), { parsed: C };
  }
  function _(O) {
    const P = r.resolve(process.cwd(), ".env");
    let k = "utf8", C = process.env;
    O && O.processEnv != null && (C = O.processEnv);
    let x = a(C.DOTENV_CONFIG_DEBUG || O && O.debug), $ = a(C.DOTENV_CONFIG_QUIET || O && O.quiet);
    O && O.encoding ? k = O.encoding : x && g("No encoding is specified. UTF-8 is used by default");
    let L = [P];
    if (O && O.path)
      if (!Array.isArray(O.path))
        L = [D(O.path)];
      else {
        L = [];
        for (const ae of O.path)
          L.push(D(ae));
      }
    let j;
    const G = {};
    for (const ae of L)
      try {
        const se = q.parse(e.readFileSync(ae, { encoding: k }));
        q.populate(G, se, O);
      } catch (se) {
        x && g(`Failed to load ${ae} ${se.message}`), j = se;
      }
    const re = q.populate(C, G, O);
    if (x = a(C.DOTENV_CONFIG_DEBUG || x), $ = a(C.DOTENV_CONFIG_QUIET || $), x || !$) {
      const ae = Object.keys(re).length, se = [];
      for (const pe of L)
        try {
          const Te = r.relative(process.cwd(), pe);
          se.push(Te);
        } catch (Te) {
          x && g(`Failed to load ${pe} ${Te.message}`), j = Te;
        }
      m(`injecting env (${ae}) from ${se.join(",")} ${l(`-- tip: ${c()}`)}`);
    }
    return j ? { parsed: G, error: j } : { parsed: G };
  }
  function A(O) {
    if (v(O).length === 0)
      return q.configDotenv(O);
    const P = b(O);
    return P ? q._configVault(O) : (E(`You set DOTENV_KEY but you are missing a .env.vault file at ${P}. Did you forget to build it?`), q.configDotenv(O));
  }
  function S(O, P) {
    const k = Buffer.from(P.slice(-64), "hex");
    let C = Buffer.from(O, "base64");
    const x = C.subarray(0, 12), $ = C.subarray(-16);
    C = C.subarray(12, -16);
    try {
      const L = n.createDecipheriv("aes-256-gcm", k, x);
      return L.setAuthTag($), `${L.update(C)}${L.final()}`;
    } catch (L) {
      const j = L instanceof RangeError, G = L.message === "Invalid key length", re = L.message === "Unsupported state or unable to authenticate data";
      if (j || G) {
        const ae = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
        throw ae.code = "INVALID_DOTENV_KEY", ae;
      } else if (re) {
        const ae = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
        throw ae.code = "DECRYPTION_FAILED", ae;
      } else
        throw L;
    }
  }
  function y(O, P, k = {}) {
    const C = !!(k && k.debug), x = !!(k && k.override), $ = {};
    if (typeof P != "object") {
      const L = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
      throw L.code = "OBJECT_REQUIRED", L;
    }
    for (const L of Object.keys(P))
      Object.prototype.hasOwnProperty.call(O, L) ? (x === !0 && (O[L] = P[L], $[L] = P[L]), C && g(x === !0 ? `"${L}" is already defined and WAS overwritten` : `"${L}" is already defined and was NOT overwritten`)) : (O[L] = P[L], $[L] = P[L]);
    return $;
  }
  const q = {
    configDotenv: _,
    _configVault: M,
    _parseVault: h,
    config: A,
    decrypt: S,
    parse: f,
    populate: y
  };
  return dt.exports.configDotenv = q.configDotenv, dt.exports._configVault = q._configVault, dt.exports._parseVault = q._parseVault, dt.exports.config = q.config, dt.exports.decrypt = q.decrypt, dt.exports.parse = q.parse, dt.exports.populate = q.populate, dt.exports = q, dt.exports;
}
var Cf = Lf();
const wu = /* @__PURE__ */ _u(Cf), Df = `
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
`, xo = `
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
`, Po = (e) => ({
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
}), xf = {
  name: "user",
  create: Df,
  indexes: [
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email ON user(email);",
    "CREATE INDEX IF NOT EXISTS idx_user_status ON user(status);",
    "CREATE INDEX IF NOT EXISTS idx_user_lastSyncedAt ON user(lastSyncedAt);"
  ]
}, Pf = `
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
`, Uf = `
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
`, Ff = (e) => {
  let r = null;
  return Array.isArray(e.allergenList) ? r = JSON.stringify(e.allergenList) : e.allergenList && typeof e.allergenList == "object" && Array.isArray(e.allergenList.allergies) ? r = JSON.stringify(e.allergenList.allergies) : Array.isArray(e.allergens) && (r = JSON.stringify(e.allergens)), {
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
    allergenList: r && r !== "[]" && r !== "null" ? r : null,
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
}, kf = {
  name: "product",
  create: Pf,
  indexes: [
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_product_id ON product(id);",
    "CREATE INDEX IF NOT EXISTS idx_product_outlet ON product(outletId);",
    "CREATE INDEX IF NOT EXISTS idx_product_category ON product(category);",
    "CREATE INDEX IF NOT EXISTS idx_product_isActive ON product(isActive);",
    "CREATE INDEX IF NOT EXISTS idx_product_lastSyncedAt ON product(lastSyncedAt);"
  ]
}, Mf = `
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
`, Ru = `
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
`, Ou = (e) => ({
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
}), qf = {
  name: "business_outlet",
  create: Mf,
  indexes: [
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_outlet_id ON business_outlet(id);",
    "CREATE INDEX IF NOT EXISTS idx_outlet_businessId ON business_outlet(businessId);",
    "CREATE INDEX IF NOT EXISTS idx_outlet_isActive ON business_outlet(isActive);",
    "CREATE INDEX IF NOT EXISTS idx_outlet_isOnboarded ON business_outlet(isOnboarded);",
    "CREATE INDEX IF NOT EXISTS idx_outlet_lastSyncedAt ON business_outlet(lastSyncedAt);"
  ]
}, $f = `
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
`, Xf = `
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
`, Bf = (e) => ({
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
}), Hf = {
  name: "business",
  create: $f,
  indexes: [
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_business_id ON business(id);",
    "CREATE INDEX IF NOT EXISTS idx_business_status ON business(status);",
    "CREATE INDEX IF NOT EXISTS idx_business_slug ON business(slug);",
    "CREATE INDEX IF NOT EXISTS idx_business_lastSyncedAt ON business(lastSyncedAt);"
  ]
}, jf = {
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
}, Gf = {
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
}, Vf = {
  name: "business_user_roles_business_role",
  create: `
    CREATE TABLE IF NOT EXISTS business_user_roles_business_role (
      businessUserId TEXT NOT NULL,
      businessRoleId TEXT NOT NULL,
      PRIMARY KEY (businessUserId, businessRoleId)
    );
  `
}, eo = `
  INSERT OR REPLACE INTO customers (
    id,
    email,
    name,
    phoneNumber,
    customerCode,
    status,
    verificationCode,
    verificationCodeExpiry,
    emailVerified,
    phoneVerfied,
    reference,
    createdAt,
    outletId,
    otherEmails,
    otherNames,
    otherPhoneNumbers,
    customerType,
    pricingTier,
    paymentTermId,
    organizationName,
    addedBy,
    updatedBy,
    updatedAt,
    deletedAt,
    reason,
    recordId,
    version
  ) VALUES (
    @id,
    @email,
    @name,
    @phoneNumber,
    @customerCode,
    @status,
    @verificationCode,
    @verificationCodeExpiry,
    @emailVerified,
    @phoneVerfied,
    @reference,
    @createdAt,
    @outletId,
    @otherEmails,
    @otherNames,
    @otherPhoneNumbers,
    @customerType,
    @pricingTier,
    @paymentTermId,
    @organizationName,
    @addedBy,
    @updatedBy,
    @updatedAt,
    @deletedAt,
    @reason,
    @recordId,
    @version
  )
`, to = (e) => ({
  id: e.id,
  email: e.email ?? null,
  name: e.name ?? null,
  phoneNumber: e.phoneNumber ?? null,
  customerCode: e.customerCode ?? null,
  status: e.status ?? "active",
  verificationCode: e.verificationCode ?? null,
  verificationCodeExpiry: e.verificationCodeExpiry ?? null,
  emailVerified: e.emailVerified ? 1 : 0,
  phoneVerfied: e.phoneVerfied ? 1 : 0,
  reference: e.reference ?? null,
  createdAt: e.createdAt ?? null,
  outletId: e.outletId ?? null,
  otherEmails: Array.isArray(e.otherEmails) ? JSON.stringify(e.otherEmails) : e.otherEmails ?? null,
  otherNames: Array.isArray(e.otherNames) ? JSON.stringify(e.otherNames) : e.otherNames ?? null,
  otherPhoneNumbers: Array.isArray(e.otherPhoneNumbers) ? JSON.stringify(e.otherPhoneNumbers) : e.otherPhoneNumbers ?? null,
  customerType: e.customerType ?? "individual",
  pricingTier: e.pricingTier ?? null,
  paymentTermId: e.paymentTermId ?? null,
  organizationName: e.organizationName ?? null,
  addedBy: e.addedBy ?? null,
  updatedBy: e.updatedBy ?? null,
  updatedAt: e.updatedAt ?? null,
  deletedAt: e.deletedAt ?? null,
  reason: e.reason ?? null,
  recordId: e.recordId ?? null,
  version: e.version ?? 0
}), Wf = {
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
      deletedAt TEXT,
      reason TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);",
    "CREATE INDEX IF NOT EXISTS idx_customers_phoneNumber ON customers(phoneNumber);",
    "CREATE INDEX IF NOT EXISTS idx_customers_outletId ON customers(outletId);"
  ]
}, Yf = {
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
}, zf = `
  INSERT INTO cart (
    id,
    reference,
    status,
    createdAt,
    updatedAt,
    outletId,
    itemCount,
    totalQuantity,
    totalAmount,
    customerId,
    recordId,
    version
  ) VALUES (
    @id,
    @reference,
    @status,
    @createdAt,
    @updatedAt,
    @outletId,
    @itemCount,
    @totalQuantity,
    @totalAmount,
    @customerId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    reference = excluded.reference,
    status = excluded.status,
    updatedAt = excluded.updatedAt,
    outletId = excluded.outletId,
    itemCount = excluded.itemCount,
    totalQuantity = excluded.totalQuantity,
    totalAmount = excluded.totalAmount,
    customerId = excluded.customerId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= cart.version OR excluded.updatedAt >= cart.updatedAt OR cart.updatedAt IS NULL
`, Jf = (e) => ({
  id: e.id,
  reference: e.reference,
  status: e.status,
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
  outletId: e.outletId,
  itemCount: e.itemCount,
  totalQuantity: e.totalQuantity,
  totalAmount: e.totalAmount,
  customerId: e.customerId,
  recordId: e.recordId,
  version: e.version
}), Kf = {
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
      customerId TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_cart_outletId ON cart(outletId)",
    "CREATE INDEX IF NOT EXISTS idx_cart_customerId ON cart(customerId)"
  ]
}, Qf = `
  INSERT INTO cart_item (
    id,
    productId,
    quantity,
    unitPrice,
    cartId,
    priceTierDiscount,
    priceTierMarkup,
    recordId,
    version
  ) VALUES (
    @id,
    @productId,
    @quantity,
    @unitPrice,
    @cartId,
    @priceTierDiscount,
    @priceTierMarkup,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    productId = excluded.productId,
    quantity = excluded.quantity,
    unitPrice = excluded.unitPrice,
    cartId = excluded.cartId,
    priceTierDiscount = excluded.priceTierDiscount,
    priceTierMarkup = excluded.priceTierMarkup,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= cart_item.version OR cart_item.version IS NULL
`, Zf = (e) => ({
  id: e.id,
  productId: e.productId,
  quantity: e.quantity,
  unitPrice: e.unitPrice,
  cartId: e.cartId,
  priceTierDiscount: e.priceTierDiscount,
  priceTierMarkup: e.priceTierMarkup,
  recordId: e.recordId,
  version: e.version
}), ep = {
  name: "cart_item",
  create: `
    CREATE TABLE IF NOT EXISTS cart_item (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unitPrice REAL DEFAULT 0 NOT NULL,
      cartId TEXT,
      priceTierDiscount REAL DEFAULT 0 NOT NULL,
      priceTierMarkup REAL DEFAULT 0 NOT NULL,
      recordId TEXT,
      version INTEGER DEFAULT 0
    );
  `,
  indexes: ["CREATE INDEX IF NOT EXISTS idx_cart_item_cartId ON cart_item(cartId)"]
}, tp = {
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
}, bu = `
  INSERT INTO inventory (
    id,
    type,
    allowProcurement,
    location,
    reference,
    externalReference,
    createdAt,
    updatedAt,
    recordId,
    version,
    outletId,
    businessId
  ) VALUES (
    @id,
    @type,
    @allowProcurement,
    @location,
    @reference,
    @externalReference,
    @createdAt,
    @updatedAt,
    @recordId,
    @version,
    @outletId,
    @businessId
  )
  ON CONFLICT(id) DO UPDATE SET
    type = excluded.type,
    allowProcurement = excluded.allowProcurement,
    location = excluded.location,
    reference = excluded.reference,
    externalReference = excluded.externalReference,
    updatedAt = excluded.updatedAt,
    recordId = excluded.recordId,
    version = excluded.version,
    outletId = excluded.outletId,
    businessId = excluded.businessId
  WHERE excluded.version >= inventory.version OR excluded.updatedAt >= inventory.updatedAt OR inventory.updatedAt IS NULL
`, Lu = (e) => ({
  id: e.id,
  type: e.type,
  allowProcurement: e.allowProcurement ? 1 : 0,
  location: e.location,
  reference: e.reference,
  externalReference: e.externalReference,
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
  recordId: e.recordId,
  version: e.version,
  outletId: e.outletId,
  businessId: e.businessId
}), rp = {
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
      recordId TEXT,
      version INTEGER,
      businessId TEXT,
      outletId TEXT
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_inventory_outletId ON inventory(outletId)",
    "CREATE INDEX IF NOT EXISTS idx_inventory_businessId ON inventory(businessId)"
  ]
}, Cu = `
  INSERT INTO inventory_item (
    id,
    costMethod,
    costPrice,
    currentStockLevel,
    minimumStockLevel,
    reOrderLevel,
    isDeleted,
    addedBy,
    modifiedBy,
    createdAt,
    updatedAt,
    itemMasterId,
    inventoryId,
    recordId,
    version
  ) VALUES (
    @id,
    @costMethod,
    @costPrice,
    @currentStockLevel,
    @minimumStockLevel,
    @reOrderLevel,
    @isDeleted,
    @addedBy,
    @modifiedBy,
    @createdAt,
    @updatedAt,
    @itemMasterId,
    @inventoryId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    costMethod = excluded.costMethod,
    costPrice = excluded.costPrice,
    currentStockLevel = excluded.currentStockLevel,
    minimumStockLevel = excluded.minimumStockLevel,
    reOrderLevel = excluded.reOrderLevel,
    isDeleted = excluded.isDeleted,
    addedBy = excluded.addedBy,
    modifiedBy = excluded.modifiedBy,
    updatedAt = excluded.updatedAt,
    itemMasterId = excluded.itemMasterId,
    inventoryId = excluded.inventoryId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= inventory_item.version OR excluded.updatedAt >= inventory_item.updatedAt OR inventory_item.updatedAt IS NULL
`, Du = (e) => ({
  id: e.id,
  costMethod: e.costMethod,
  costPrice: parseFloat(e.costPrice || 0),
  currentStockLevel: parseFloat(e.currentStockLevel || 0),
  minimumStockLevel: parseFloat(e.minimumStockLevel || 0),
  reOrderLevel: parseFloat(e.reOrderLevel || 0),
  isDeleted: e.isDeleted ? 1 : 0,
  addedBy: e.addedBy,
  modifiedBy: e.modifiedBy,
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
  itemMasterId: e.itemMasterId,
  inventoryId: e.inventoryId,
  recordId: e.recordId,
  version: e.version
}), np = {
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
      inventoryId TEXT,
      recordId TEXT,
      version INTEGER
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_inventory_item_inventoryId ON inventory_item(inventoryId)",
    "CREATE INDEX IF NOT EXISTS idx_inventory_item_itemMasterId ON inventory_item(itemMasterId)"
  ]
}, xu = `
  INSERT INTO item_master (
    id,
    name,
    itemCode,
    businessId,
    category,
    itemType,
    unitOfPurchase,
    unitOfTransfer,
    unitOfConsumption,
    displayedUnitOfMeasure,
    transferPerPurchase,
    consumptionPerTransfer,
    isTraceable,
    isTrackable,
    createdAt,
    updatedAt,
    recordId,
    version
  ) VALUES (
    @id,
    @name,
    @itemCode,
    @businessId,
    @category,
    @itemType,
    @unitOfPurchase,
    @unitOfTransfer,
    @unitOfConsumption,
    @displayedUnitOfMeasure,
    @transferPerPurchase,
    @consumptionPerTransfer,
    @isTraceable,
    @isTrackable,
    @createdAt,
    @updatedAt,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    itemCode = excluded.itemCode,
    businessId = excluded.businessId,
    category = excluded.category,
    itemType = excluded.itemType,
    unitOfPurchase = excluded.unitOfPurchase,
    unitOfTransfer = excluded.unitOfTransfer,
    unitOfConsumption = excluded.unitOfConsumption,
    displayedUnitOfMeasure = excluded.displayedUnitOfMeasure,
    transferPerPurchase = excluded.transferPerPurchase,
    consumptionPerTransfer = excluded.consumptionPerTransfer,
    isTraceable = excluded.isTraceable,
    isTrackable = excluded.isTrackable,
    updatedAt = excluded.updatedAt,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= item_master.version OR excluded.updatedAt >= item_master.updatedAt OR item_master.updatedAt IS NULL
`, Pu = (e) => ({
  id: e.id,
  name: e.name,
  itemCode: e.itemCode,
  businessId: e.businessId,
  category: e.category,
  itemType: e.itemType,
  unitOfPurchase: e.unitOfPurchase,
  unitOfTransfer: e.unitOfTransfer,
  unitOfConsumption: e.unitOfConsumption,
  displayedUnitOfMeasure: e.displayedUnitOfMeasure,
  transferPerPurchase: parseFloat(e.transferPerPurchase || 0),
  consumptionPerTransfer: parseFloat(e.consumptionPerTransfer || 0),
  isTraceable: e.isTraceable ? 1 : 0,
  isTrackable: e.isTrackable ? 1 : 0,
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
  recordId: e.recordId,
  version: e.version
}), ip = {
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
      updatedAt TEXT,
      recordId TEXT,
      version INTEGER
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_item_master_businessId ON item_master(businessId)",
    "CREATE INDEX IF NOT EXISTS idx_item_master_category ON item_master(category)"
  ]
}, Uu = `
  INSERT INTO item_lot (
    id,
    lotNumber,
    quantityPurchased,
    supplierName,
    supplierSesrialNumber,
    supplierAddress,
    currentStockLevel,
    initialStockLevel,
    expiryDate,
    costPrice,
    createdAt,
    updatedAt,
    itemId,
    recordId,
    version
  ) VALUES (
    @id,
    @lotNumber,
    @quantityPurchased,
    @supplierName,
    @supplierSesrialNumber,
    @supplierAddress,
    @currentStockLevel,
    @initialStockLevel,
    @expiryDate,
    @costPrice,
    @createdAt,
    @updatedAt,
    @itemId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    lotNumber = excluded.lotNumber,
    quantityPurchased = excluded.quantityPurchased,
    supplierName = excluded.supplierName,
    supplierSesrialNumber = excluded.supplierSesrialNumber,
    supplierAddress = excluded.supplierAddress,
    currentStockLevel = excluded.currentStockLevel,
    initialStockLevel = excluded.initialStockLevel,
    expiryDate = excluded.expiryDate,
    costPrice = excluded.costPrice,
    updatedAt = excluded.updatedAt,
    itemId = excluded.itemId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= item_lot.version OR excluded.updatedAt >= item_lot.updatedAt OR item_lot.updatedAt IS NULL
`, Fu = (e) => ({
  id: e.id,
  lotNumber: e.lotNumber,
  quantityPurchased: parseFloat(e.quantityPurchased || 0),
  supplierName: e.supplierName,
  supplierSesrialNumber: e.supplierSesrialNumber,
  supplierAddress: e.supplierAddress,
  currentStockLevel: parseFloat(e.currentStockLevel || 0),
  initialStockLevel: parseFloat(e.initialStockLevel || 0),
  expiryDate: e.expiryDate,
  costPrice: parseFloat(e.costPrice || 0),
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
  itemId: e.itemId,
  recordId: e.recordId,
  version: e.version
}), sp = {
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
      itemId TEXT,
      recordId TEXT,
      version INTEGER
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_item_lot_itemId ON item_lot(itemId)"
  ]
}, op = `
  INSERT INTO recipes (
    id,
    name,
    productReference,
    productName,
    outletId,
    mix,
    totalPortions,
    totalMixCost,
    preparationTime,
    difficulty_level,
    instructions,
    imageUrl,
    createdAt,
    updatedAt,
    createdBy,
    isDeleted,
    inventoryId
  ) VALUES (
    @id,
    @name,
    @productReference,
    @productName,
    @outletId,
    @mix,
    @totalPortions,
    @totalMixCost,
    @preparationTime,
    @difficulty_level,
    @instructions,
    @imageUrl,
    @createdAt,
    @updatedAt,
    @createdBy,
    @isDeleted,
    @inventoryId
  )
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    productReference = excluded.productReference,
    productName = excluded.productName,
    outletId = excluded.outletId,
    mix = excluded.mix,
    totalPortions = excluded.totalPortions,
    totalMixCost = excluded.totalMixCost,
    preparationTime = excluded.preparationTime,
    difficulty_level = excluded.difficulty_level,
    instructions = excluded.instructions,
    imageUrl = excluded.imageUrl,
    updatedAt = excluded.updatedAt,
    createdBy = excluded.createdBy,
    isDeleted = excluded.isDeleted,
    inventoryId = excluded.inventoryId
`, ap = (e) => ({
  id: e.id,
  name: e.name,
  productReference: e.productReference || e.productId || e.product_id,
  productName: e.productName || "",
  outletId: e.outletId,
  mix: e.mix || "standard",
  totalPortions: Number(e.totalPortions || 0),
  totalMixCost: Number(e.totalMixCost || 0),
  preparationTime: Number(e.preparationTime || 0),
  difficulty_level: e.difficulty_level || "Medium",
  instructions: e.instructions || "",
  imageUrl: e.imageUrl || null,
  createdAt: e.createdAt || null,
  updatedAt: e.updatedAt || null,
  createdBy: e.createdBy || "",
  isDeleted: e.isDeleted ? 1 : 0,
  inventoryId: e.inventoryId || null
}), lp = {
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
}, cp = `
  INSERT INTO recipe_ingredients (
    id,
    itemName,
    unitOfMeasure,
    quantity,
    proposedFoodCost,
    prepWaste,
    critical,
    isDeleted,
    createdAt,
    updatedAt,
    recipeId,
    itemId
  ) VALUES (
    @id,
    @itemName,
    @unitOfMeasure,
    @quantity,
    @proposedFoodCost,
    @prepWaste,
    @critical,
    @isDeleted,
    @createdAt,
    @updatedAt,
    @recipeId,
    @itemId
  )
  ON CONFLICT(id) DO UPDATE SET
    itemName = excluded.itemName,
    unitOfMeasure = excluded.unitOfMeasure,
    quantity = excluded.quantity,
    proposedFoodCost = excluded.proposedFoodCost,
    prepWaste = excluded.prepWaste,
    critical = excluded.critical,
    isDeleted = excluded.isDeleted,
    updatedAt = excluded.updatedAt,
    recipeId = excluded.recipeId,
    itemId = excluded.itemId
`, up = (e) => ({
  id: e.id,
  itemName: e.itemName,
  unitOfMeasure: e.unitOfMeasure,
  quantity: Number(e.quantity || 0),
  proposedFoodCost: Number(e.proposedFoodCost || 0),
  prepWaste: Number(e.prepWaste || 0),
  critical: e.critical ? 1 : 0,
  isDeleted: e.isDeleted ? 1 : 0,
  createdAt: e.createdAt || null,
  updatedAt: e.updatedAt || null,
  recipeId: e.recipeId || null,
  itemId: e.itemId || null
}), dp = {
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
}, fp = `
  INSERT INTO recipe_variants (
    id,
    modifierName,
    quantity,
    createdAt,
    updatedAt,
    isDeleted,
    recipeId,
    recordId,
    version
  ) VALUES (
    @id,
    @modifierName,
    @quantity,
    @createdAt,
    @updatedAt,
    @isDeleted,
    @recipeId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    modifierName = excluded.modifierName,
    quantity = excluded.quantity,
    updatedAt = excluded.updatedAt,
    isDeleted = excluded.isDeleted,
    recipeId = excluded.recipeId,
    recordId = excluded.recordId,
    version = excluded.version
`, pp = (e) => ({
  id: e.id,
  modifierName: e.modifierName || "",
  quantity: Number(e.quantity || 0),
  createdAt: e.createdAt || null,
  updatedAt: e.updatedAt || null,
  isDeleted: e.isDeleted ? 1 : 0,
  recipeId: e.recipeId || null,
  recordId: e.recordId || null,
  version: Number(e.version || 0)
}), hp = {
  name: "recipe_variants",
  create: `
    CREATE TABLE IF NOT EXISTS recipe_variants (
      id TEXT PRIMARY KEY,
      modifierName TEXT NOT NULL,
      quantity REAL DEFAULT 0 NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      isDeleted INTEGER DEFAULT 0 NOT NULL,
      recipeId TEXT NOT NULL,
      recordId TEXT,
      version INTEGER DEFAULT 0
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_recipe_variants_recipeId ON recipe_variants(recipeId);",
    "CREATE INDEX IF NOT EXISTS idx_recipe_variants_updatedAt ON recipe_variants(updatedAt);"
  ]
}, mp = `
  INSERT OR REPLACE INTO system_default (
    id,
    key,
    data,
    outletId,
    recordId,
    version
  ) VALUES (
    @id,
    @key,
    @data,
    @outletId,
    @recordId,
    @version
  )
`, Ep = (e) => ({
  id: e.id,
  key: e.key || "category",
  data: Array.isArray(e.data) ? JSON.stringify(e.data) : e.data || "[]",
  outletId: e.outletId || null,
  recordId: e.recordId || null,
  version: e.version || 0
}), gp = {
  name: "system_default",
  create: `
    CREATE TABLE IF NOT EXISTS system_default (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL,
      data TEXT NOT NULL,
      outletId TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_system_default_key ON system_default(key);",
    "CREATE INDEX IF NOT EXISTS idx_system_default_outletId ON system_default(outletId);"
  ]
}, Tp = {
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
}, yp = {
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
}, vp = {
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
}, Ap = {
  name: "payment_terms",
  create: `
    CREATE TABLE IF NOT EXISTS payment_terms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      paymentType TEXT,
      instantPayment BOOLEAN DEFAULT 0,
      paymentOnDelivery BOOLEAN DEFAULT 0,
      paymentInInstallment TEXT, -- JSON string
      outletId TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      deletedAt DATETIME
    );
  `,
  indexes: ["CREATE INDEX IF NOT EXISTS idx_payment_terms_outletId ON payment_terms(outletId)"]
}, Ip = `
  INSERT INTO orders (
    id,
    status,
    deliveryMethod,
    amount,
    tax,
    serviceCharge,
    cashCollected,
    changeGiven,
    total,
    deliveryFee,
    specialInstructions,
    recipientName,
    occasion,
    initiator,
    recipientPhone,
    scheduledAt,
    address,
    reference,
    externalReference,
    orderMode,
    orderChannel,
    orderType,
    confirmedBy,
    confirmedAt,
    cancelledBy,
    cancelledAt,
    cancellationReason,
    createdAt,
    updatedAt,
    timeline,
    customerId,
    outletId,
    cartId,
    paymentReference,
    paymentMethod,
    paymentStatus,
    discount,
    markup,
    deletedAt,
    recordId,
    version
  ) VALUES (
    @id,
    @status,
    @deliveryMethod,
    @amount,
    @tax,
    @serviceCharge,
    @cashCollected,
    @changeGiven,
    @total,
    @deliveryFee,
    @specialInstructions,
    @recipientName,
    @occasion,
    @initiator,
    @recipientPhone,
    @scheduledAt,
    @address,
    @reference,
    @externalReference,
    @orderMode,
    @orderChannel,
    @orderType,
    @confirmedBy,
    @confirmedAt,
    @cancelledBy,
    @cancelledAt,
    @cancellationReason,
    @createdAt,
    @updatedAt,
    @timeline,
    @customerId,
    @outletId,
    @cartId,
    @paymentReference,
    @paymentMethod,
    @paymentStatus,
    @discount,
    @markup,
    @deletedAt,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    status = excluded.status,
    deliveryMethod = excluded.deliveryMethod,
    amount = excluded.amount,
    tax = excluded.tax,
    serviceCharge = excluded.serviceCharge,
    cashCollected = excluded.cashCollected,
    changeGiven = excluded.changeGiven,
    total = excluded.total,
    deliveryFee = excluded.deliveryFee,
    specialInstructions = excluded.specialInstructions,
    recipientName = excluded.recipientName,
    occasion = excluded.occasion,
    initiator = excluded.initiator,
    recipientPhone = excluded.recipientPhone,
    scheduledAt = excluded.scheduledAt,
    address = excluded.address,
    reference = excluded.reference,
    externalReference = excluded.externalReference,
    orderMode = excluded.orderMode,
    orderChannel = excluded.orderChannel,
    orderType = excluded.orderType,
    confirmedBy = excluded.confirmedBy,
    confirmedAt = excluded.confirmedAt,
    cancelledBy = excluded.cancelledBy,
    cancelledAt = excluded.cancelledAt,
    cancellationReason = excluded.cancellationReason,
    updatedAt = excluded.updatedAt,
    timeline = excluded.timeline,
    customerId = excluded.customerId,
    outletId = excluded.outletId,
    cartId = excluded.cartId,
    paymentReference = excluded.paymentReference,
    paymentMethod = excluded.paymentMethod,
    paymentStatus = excluded.paymentStatus,
    discount = excluded.discount,
    markup = excluded.markup,
    deletedAt = excluded.deletedAt,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= orders.version OR excluded.updatedAt >= orders.updatedAt OR orders.updatedAt IS NULL OR orders.cartId IS NULL
`, Sp = (e) => ({
  id: e.id,
  status: e.status,
  deliveryMethod: e.deliveryMethod,
  amount: e.amount,
  tax: e.tax,
  serviceCharge: e.serviceCharge,
  cashCollected: e.cashCollected,
  changeGiven: e.changeGiven,
  total: e.total,
  deliveryFee: e.deliveryFee,
  specialInstructions: e.specialInstructions,
  recipientName: e.recipientName,
  occasion: e.occasion,
  initiator: e.initiator,
  recipientPhone: e.recipientPhone,
  scheduledAt: e.scheduledAt,
  address: e.address,
  reference: e.reference,
  externalReference: e.externalReference,
  orderMode: e.orderMode,
  orderChannel: e.orderChannel,
  orderType: e.orderType,
  confirmedBy: e.confirmedBy,
  confirmedAt: e.confirmedAt,
  cancelledBy: e.cancelledBy,
  cancelledAt: e.cancelledAt,
  cancellationReason: e.cancellationReason,
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
  timeline: Array.isArray(e.timeline) ? JSON.stringify(e.timeline) : e.timeline,
  customerId: e.customerId,
  outletId: e.outletId,
  cartId: e.cartId,
  paymentReference: e.paymentReference,
  paymentMethod: e.paymentMethod,
  paymentStatus: e.paymentStatus,
  discount: e.discount,
  markup: e.markup,
  deletedAt: e.deletedAt,
  recordId: e.recordId,
  version: e.version
}), Np = {
  name: "orders",
  create: `
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      status TEXT,
      deliveryMethod TEXT,
      amount REAL,
      tax REAL,
      serviceCharge REAL,
      cashCollected REAL,
      changeGiven REAL,
      total REAL,
      deliveryFee REAL,
      specialInstructions TEXT,
      recipientName TEXT,
      occasion TEXT,
      initiator TEXT,
      recipientPhone TEXT,
      scheduledAt TEXT,
      address TEXT,
      reference TEXT,
      externalReference TEXT,
      orderMode TEXT,
      orderChannel TEXT,
      orderType TEXT,
      confirmedBy TEXT,
      confirmedAt TEXT,
      cancelledBy TEXT,
      cancelledAt TEXT,
      cancellationReason TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      timeline TEXT,
      customerId TEXT,
      outletId TEXT,
      cartId TEXT,
      paymentReference TEXT,
      paymentMethod TEXT,
      paymentStatus TEXT,
      discount REAL,
      markup REAL,
      deletedAt TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_orders_outletId ON orders(outletId)",
    "CREATE INDEX IF NOT EXISTS idx_orders_customerId ON orders(customerId)",
    "CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)",
    "CREATE INDEX IF NOT EXISTS idx_orders_orderMode ON orders(orderMode)"
  ]
}, _p = `
  INSERT INTO productions (
    id,
    status,
    previousStatus,
    productionDate,
    additionalInformation,
    productionTime,
    initiator,
    cancelReason,
    batchId,
    scheduleId,
    createdAt,
    updatedAt,
    metadata,
    outletId,
    recordId,
    version,
    productionDueDate,
    productionManager
  ) VALUES (
    @id,
    @status,
    @previousStatus,
    @productionDate,
    @additionalInformation,
    @productionTime,
    @initiator,
    @cancelReason,
    @batchId,
    @scheduleId,
    @createdAt,
    @updatedAt,
    @metadata,
    @outletId,
    @recordId,
    @version,
    @productionDueDate,
    @productionManager
  )
  ON CONFLICT(id) DO UPDATE SET
    status = excluded.status,
    previousStatus = excluded.previousStatus,
    productionDate = excluded.productionDate,
    additionalInformation = excluded.additionalInformation,
    productionTime = excluded.productionTime,
    initiator = excluded.initiator,
    cancelReason = excluded.cancelReason,
    batchId = excluded.batchId,
    scheduleId = excluded.scheduleId,
    updatedAt = excluded.updatedAt,
    metadata = excluded.metadata,
    outletId = excluded.outletId,
    recordId = excluded.recordId,
    version = excluded.version,
    productionDueDate = excluded.productionDueDate,
    productionManager = excluded.productionManager
  WHERE excluded.version >= productions.version OR excluded.updatedAt >= productions.updatedAt OR productions.updatedAt IS NULL
`, wp = (e) => ({
  id: e.id,
  status: e.status,
  previousStatus: e.previousStatus,
  productionDate: e.productionDate,
  additionalInformation: e.additionalInformation,
  productionTime: e.productionTime,
  initiator: e.initiator,
  cancelReason: e.cancelReason,
  batchId: e.batchId,
  scheduleId: e.scheduleId,
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
  metadata: typeof e.metadata == "object" ? JSON.stringify(e.metadata) : e.metadata,
  outletId: e.outletId,
  recordId: e.recordId,
  version: e.version,
  productionDueDate: e.productionDueDate,
  productionManager: e.productionManager
}), Rp = {
  name: "productions",
  create: `
    CREATE TABLE IF NOT EXISTS productions (
      id TEXT PRIMARY KEY,
      status TEXT,
      previousStatus TEXT,
      productionDate TEXT,
      additionalInformation TEXT,
      productionTime TEXT,
      initiator TEXT,
      cancelReason TEXT,
      batchId TEXT,
      scheduleId TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      metadata TEXT,
      outletId TEXT,
      recordId TEXT,
      version INTEGER,
      productionDueDate TEXT,
      productionManager TEXT
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_productions_outletId ON productions(outletId)",
    "CREATE INDEX IF NOT EXISTS idx_productions_status ON productions(status)",
    "CREATE INDEX IF NOT EXISTS idx_productions_batchId ON productions(batchId)",
    "CREATE INDEX IF NOT EXISTS idx_productions_scheduleId ON productions(scheduleId)"
  ]
}, Op = `
  INSERT INTO production_items (
    id,
    createdAt,
    updatedAt,
    outletId,
    productionId,
    orderId,
    recordId,
    version
  ) VALUES (
    @id,
    @createdAt,
    @updatedAt,
    @outletId,
    @productionId,
    @orderId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    updatedAt = excluded.updatedAt,
    outletId = excluded.outletId,
    productionId = excluded.productionId,
    orderId = excluded.orderId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= production_items.version OR excluded.updatedAt >= production_items.updatedAt OR production_items.updatedAt IS NULL
`, bp = (e) => ({
  id: e.id,
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
  outletId: e.outletId,
  productionId: e.productionId,
  orderId: e.orderId,
  recordId: e.recordId,
  version: e.version
}), Lp = {
  name: "production_items",
  create: `
    CREATE TABLE IF NOT EXISTS production_items (
      id TEXT PRIMARY KEY,
      createdAt TEXT,
      updatedAt TEXT,
      outletId TEXT,
      productionId TEXT,
      orderId TEXT,
      recordId TEXT,
      version INTEGER
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_production_items_productionId ON production_items(productionId)",
    "CREATE INDEX IF NOT EXISTS idx_production_items_orderId ON production_items(orderId)"
  ]
}, Cp = `
  INSERT INTO invoices (
    id,
    invoiceNumber,
    subTotal,
    totalAmount,
    totalItemCount,
    status,
    submittedBy,
    taxes,
    charges,
    createdAt,
    updatedAt,
    deletedAt,
    outletId,
    supplierId,
    recordId,
    version
  ) VALUES (
    @id,
    @invoiceNumber,
    @subTotal,
    @totalAmount,
    @totalItemCount,
    @status,
    @submittedBy,
    @taxes,
    @charges,
    @createdAt,
    @updatedAt,
    @deletedAt,
    @outletId,
    @supplierId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    invoiceNumber = excluded.invoiceNumber,
    subTotal = excluded.subTotal,
    totalAmount = excluded.totalAmount,
    totalItemCount = excluded.totalItemCount,
    status = excluded.status,
    submittedBy = excluded.submittedBy,
    taxes = excluded.taxes,
    charges = excluded.charges,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    deletedAt = excluded.deletedAt,
    outletId = excluded.outletId,
    supplierId = excluded.supplierId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= invoices.version
     OR excluded.updatedAt >= invoices.updatedAt
     OR invoices.updatedAt IS NULL
`, Dp = (e) => ({
  id: e.id,
  invoiceNumber: e.invoiceNumber ?? null,
  subTotal: parseFloat(e.subTotal || 0),
  totalAmount: parseFloat(e.totalAmount || 0),
  totalItemCount: Number(e.totalItemCount || 0),
  status: e.status ?? null,
  submittedBy: e.submittedBy ?? null,
  taxes: e.taxes && typeof e.taxes == "object" ? JSON.stringify(e.taxes) : e.taxes ?? null,
  charges: e.charges && typeof e.charges == "object" ? JSON.stringify(e.charges) : e.charges ?? null,
  createdAt: e.createdAt ?? null,
  updatedAt: e.updatedAt ?? e.createdAt ?? null,
  deletedAt: e.deletedAt ?? null,
  outletId: e.outletId ?? null,
  supplierId: e.supplierId ?? null,
  recordId: e.recordId ?? null,
  version: Number(e.version || 0)
}), xp = {
  name: "invoices",
  create: `
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoiceNumber TEXT,
      subTotal REAL,
      totalAmount REAL,
      totalItemCount INTEGER,
      status TEXT,
      submittedBy TEXT,
      taxes TEXT,
      charges TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      deletedAt TEXT,
      outletId TEXT,
      supplierId TEXT,
      recordId TEXT,
      version INTEGER
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_invoices_outletId ON invoices(outletId);",
    "CREATE INDEX IF NOT EXISTS idx_invoices_supplierId ON invoices(supplierId);",
    "CREATE INDEX IF NOT EXISTS idx_invoices_createdAt ON invoices(createdAt);"
  ]
}, Pp = `
  INSERT INTO invoice_items (
    id,
    description,
    barcode,
    quantity,
    unitPrice,
    inventoryItemId,
    lineTotal,
    invoiceId,
    createdAt,
    updatedAt,
    deletedAt,
    recordId,
    version
  ) VALUES (
    @id,
    @description,
    @barcode,
    @quantity,
    @unitPrice,
    @inventoryItemId,
    @lineTotal,
    @invoiceId,
    @createdAt,
    @updatedAt,
    @deletedAt,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    description = excluded.description,
    barcode = excluded.barcode,
    quantity = excluded.quantity,
    unitPrice = excluded.unitPrice,
    inventoryItemId = excluded.inventoryItemId,
    lineTotal = excluded.lineTotal,
    invoiceId = excluded.invoiceId,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    deletedAt = excluded.deletedAt,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= invoice_items.version
     OR excluded.updatedAt >= invoice_items.updatedAt
     OR invoice_items.updatedAt IS NULL
`, Up = (e) => ({
  id: e.id,
  description: e.description ?? null,
  barcode: e.barcode ?? null,
  quantity: parseFloat(e.quantity || 0),
  unitPrice: parseFloat(e.unitPrice || 0),
  inventoryItemId: e.inventoryItemId ?? null,
  lineTotal: parseFloat(e.lineTotal || 0),
  invoiceId: e.invoiceId ?? null,
  createdAt: e.createdAt ?? null,
  updatedAt: e.updatedAt ?? e.createdAt ?? null,
  deletedAt: e.deletedAt ?? null,
  recordId: e.recordId ?? null,
  version: Number(e.version || 0)
}), Fp = {
  name: "invoice_items",
  create: `
    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      description TEXT,
      barcode TEXT,
      quantity REAL,
      unitPrice REAL,
      inventoryItemId TEXT,
      lineTotal REAL,
      invoiceId TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      deletedAt TEXT,
      recordId TEXT,
      version INTEGER
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_invoice_items_invoiceId ON invoice_items(invoiceId);",
    "CREATE INDEX IF NOT EXISTS idx_invoice_items_inventoryItemId ON invoice_items(inventoryItemId);"
  ]
}, kp = `
  INSERT INTO suppliers (
    id,
    isActive,
    name,
    representativeName,
    phoneNumbers,
    emailAddress,
    address,
    supplierCode,
    notes,
    taxNumber,
    createdAt,
    updatedAt,
    deletedAt,
    outletId,
    recordId,
    version
  ) VALUES (
    @id,
    @isActive,
    @name,
    @representativeName,
    @phoneNumbers,
    @emailAddress,
    @address,
    @supplierCode,
    @notes,
    @taxNumber,
    @createdAt,
    @updatedAt,
    @deletedAt,
    @outletId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    isActive = excluded.isActive,
    name = excluded.name,
    representativeName = excluded.representativeName,
    phoneNumbers = excluded.phoneNumbers,
    emailAddress = excluded.emailAddress,
    address = excluded.address,
    supplierCode = excluded.supplierCode,
    notes = excluded.notes,
    taxNumber = excluded.taxNumber,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    deletedAt = excluded.deletedAt,
    outletId = excluded.outletId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= suppliers.version
     OR excluded.updatedAt >= suppliers.updatedAt
     OR suppliers.updatedAt IS NULL
`, Mp = (e) => ({
  id: e.id,
  isActive: e.isActive ? 1 : 0,
  name: e.name ?? null,
  representativeName: e.representativeName && typeof e.representativeName == "object" ? JSON.stringify(e.representativeName) : e.representativeName ?? null,
  phoneNumbers: e.phoneNumbers && typeof e.phoneNumbers == "object" ? JSON.stringify(e.phoneNumbers) : e.phoneNumbers ?? null,
  emailAddress: e.emailAddress && typeof e.emailAddress == "object" ? JSON.stringify(e.emailAddress) : e.emailAddress ?? null,
  address: e.address ?? null,
  supplierCode: e.supplierCode ?? null,
  notes: e.notes ?? null,
  taxNumber: e.taxNumber ?? null,
  createdAt: e.createdAt ?? null,
  updatedAt: e.updatedAt ?? e.createdAt ?? null,
  deletedAt: e.deletedAt ?? null,
  outletId: e.outletId ?? null,
  recordId: e.recordId ?? null,
  version: Number(e.version || 0)
}), qp = {
  name: "suppliers",
  create: `
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      isActive INTEGER DEFAULT 1 NOT NULL,
      name TEXT,
      representativeName TEXT,
      phoneNumbers TEXT,
      emailAddress TEXT,
      address TEXT,
      supplierCode TEXT,
      notes TEXT,
      taxNumber TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      deletedAt TEXT,
      outletId TEXT,
      recordId TEXT,
      version INTEGER
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_suppliers_outletId ON suppliers(outletId);",
    "CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);",
    "CREATE INDEX IF NOT EXISTS idx_suppliers_supplierCode ON suppliers(supplierCode);"
  ]
}, $p = `
  INSERT INTO supplier_items (
    id,
    totalSupplied,
    createdAt,
    updatedAt,
    deletedAt,
    supplierId,
    itemId,
    recordId,
    version
  ) VALUES (
    @id,
    @totalSupplied,
    @createdAt,
    @updatedAt,
    @deletedAt,
    @supplierId,
    @itemId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    totalSupplied = excluded.totalSupplied,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    deletedAt = excluded.deletedAt,
    supplierId = excluded.supplierId,
    itemId = excluded.itemId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= supplier_items.version
     OR excluded.updatedAt >= supplier_items.updatedAt
     OR supplier_items.updatedAt IS NULL
`, Xp = (e) => ({
  id: e.id,
  totalSupplied: parseFloat(e.totalSupplied || 0),
  createdAt: e.createdAt ?? null,
  updatedAt: e.updatedAt ?? e.createdAt ?? null,
  deletedAt: e.deletedAt ?? null,
  supplierId: e.supplierId ?? null,
  itemId: e.itemId ?? null,
  recordId: e.recordId ?? null,
  version: Number(e.version || 0)
}), Bp = {
  name: "supplier_items",
  create: `
    CREATE TABLE IF NOT EXISTS supplier_items (
      id TEXT PRIMARY KEY,
      totalSupplied REAL,
      createdAt TEXT,
      updatedAt TEXT,
      deletedAt TEXT,
      supplierId TEXT,
      itemId TEXT,
      recordId TEXT,
      version INTEGER
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_supplier_items_supplierId ON supplier_items(supplierId);",
    "CREATE INDEX IF NOT EXISTS idx_supplier_items_itemId ON supplier_items(itemId);"
  ]
}, Hp = `
  INSERT INTO components (
    id,
    name,
    reference,
    description,
    howToCreate,
    image,
    componentSize,
    componentWeight,
    minimumStockLevel,
    unitOfMeasure,
    status,
    createdAt,
    updatedAt,
    createdBy,
    updatedBy,
    deletedAt,
    inventoryId,
    recordId,
    version
  ) VALUES (
    @id,
    @name,
    @reference,
    @description,
    @howToCreate,
    @image,
    @componentSize,
    @componentWeight,
    @minimumStockLevel,
    @unitOfMeasure,
    @status,
    @createdAt,
    @updatedAt,
    @createdBy,
    @updatedBy,
    @deletedAt,
    @inventoryId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    reference = excluded.reference,
    description = excluded.description,
    howToCreate = excluded.howToCreate,
    image = excluded.image,
    componentSize = excluded.componentSize,
    componentWeight = excluded.componentWeight,
    minimumStockLevel = excluded.minimumStockLevel,
    unitOfMeasure = excluded.unitOfMeasure,
    status = excluded.status,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    createdBy = excluded.createdBy,
    updatedBy = excluded.updatedBy,
    deletedAt = excluded.deletedAt,
    inventoryId = excluded.inventoryId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= components.version
     OR excluded.updatedAt >= components.updatedAt
     OR components.updatedAt IS NULL
`, jp = (e) => ({
  id: e.id,
  name: e.name ?? null,
  reference: e.reference ?? null,
  description: e.description ?? null,
  howToCreate: e.howToCreate ?? null,
  image: e.image ?? null,
  componentSize: e.componentSize ?? null,
  componentWeight: e.componentWeight ?? null,
  minimumStockLevel: Number(e.minimumStockLevel || 0),
  unitOfMeasure: e.unitOfMeasure ?? null,
  status: e.status ?? null,
  createdAt: e.createdAt ?? null,
  updatedAt: e.updatedAt ?? e.createdAt ?? null,
  createdBy: e.createdBy ?? null,
  updatedBy: e.updatedBy ?? null,
  deletedAt: e.deletedAt ?? e.deleted_at ?? null,
  inventoryId: e.inventoryId ?? null,
  recordId: e.recordId ?? null,
  version: Number(e.version || 0)
}), Gp = {
  name: "components",
  create: `
    CREATE TABLE IF NOT EXISTS components (
      id TEXT PRIMARY KEY,
      name TEXT,
      reference TEXT,
      description TEXT,
      howToCreate TEXT,
      image TEXT,
      componentSize TEXT,
      componentWeight TEXT,
      minimumStockLevel REAL,
      unitOfMeasure TEXT,
      status TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      createdBy TEXT,
      updatedBy TEXT,
      deletedAt TEXT,
      inventoryId TEXT,
      recordId TEXT,
      version INTEGER
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_components_inventoryId ON components(inventoryId);",
    "CREATE INDEX IF NOT EXISTS idx_components_reference ON components(reference);",
    "CREATE INDEX IF NOT EXISTS idx_components_updatedAt ON components(updatedAt);"
  ]
}, Vp = `
  INSERT INTO component_items (
    id,
    quantity,
    adjustWaste,
    isCritical,
    isRequired,
    costPrice,
    totalCost,
    createdAt,
    updatedAt,
    deletedAt,
    componentId,
    componentItemLotId,
    itemId,
    recordId,
    version
  ) VALUES (
    @id,
    @quantity,
    @adjustWaste,
    @isCritical,
    @isRequired,
    @costPrice,
    @totalCost,
    @createdAt,
    @updatedAt,
    @deletedAt,
    @componentId,
    @componentItemLotId,
    @itemId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    quantity = excluded.quantity,
    adjustWaste = excluded.adjustWaste,
    isCritical = excluded.isCritical,
    isRequired = excluded.isRequired,
    costPrice = excluded.costPrice,
    totalCost = excluded.totalCost,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    deletedAt = excluded.deletedAt,
    componentId = excluded.componentId,
    componentItemLotId = excluded.componentItemLotId,
    itemId = excluded.itemId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= component_items.version
     OR excluded.updatedAt >= component_items.updatedAt
     OR component_items.updatedAt IS NULL
`, Wp = (e) => ({
  id: e.id,
  quantity: parseFloat(e.quantity || 0),
  adjustWaste: parseFloat(e.adjustWaste || 0),
  isCritical: e.isCritical ? 1 : 0,
  isRequired: e.isRequired ? 1 : 0,
  costPrice: parseFloat(e.costPrice || 0),
  totalCost: parseFloat(e.totalCost || 0),
  createdAt: e.createdAt ?? null,
  updatedAt: e.updatedAt ?? e.createdAt ?? null,
  deletedAt: e.deletedAt ?? e.deleted_at ?? null,
  componentId: e.componentId ?? null,
  componentItemLotId: e.componentItemLotId ?? null,
  itemId: e.itemId ?? null,
  recordId: e.recordId ?? null,
  version: Number(e.version || 0)
}), Yp = {
  name: "component_items",
  create: `
    CREATE TABLE IF NOT EXISTS component_items (
      id TEXT PRIMARY KEY,
      quantity REAL,
      adjustWaste REAL,
      isCritical INTEGER,
      isRequired INTEGER,
      costPrice REAL,
      totalCost REAL,
      createdAt TEXT,
      updatedAt TEXT,
      deletedAt TEXT,
      componentId TEXT,
      componentItemLotId TEXT,
      itemId TEXT,
      recordId TEXT,
      version INTEGER
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_component_items_componentId ON component_items(componentId);",
    "CREATE INDEX IF NOT EXISTS idx_component_items_itemId ON component_items(itemId);"
  ]
}, zp = `
  INSERT INTO component_lots (
    id,
    initialStockLevel,
    quantity,
    currentStockLevel,
    ref,
    unitCost,
    expiry,
    createdAt,
    updatedAt,
    deletedAt,
    preparedBy,
    updatedBy,
    componentId,
    recordId,
    version,
    totalCost
  ) VALUES (
    @id,
    @initialStockLevel,
    @quantity,
    @currentStockLevel,
    @ref,
    @unitCost,
    @expiry,
    @createdAt,
    @updatedAt,
    @deletedAt,
    @preparedBy,
    @updatedBy,
    @componentId,
    @recordId,
    @version,
    @totalCost
  )
  ON CONFLICT(id) DO UPDATE SET
    initialStockLevel = excluded.initialStockLevel,
    quantity = excluded.quantity,
    currentStockLevel = excluded.currentStockLevel,
    ref = excluded.ref,
    unitCost = excluded.unitCost,
    expiry = excluded.expiry,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    deletedAt = excluded.deletedAt,
    preparedBy = excluded.preparedBy,
    updatedBy = excluded.updatedBy,
    componentId = excluded.componentId,
    recordId = excluded.recordId,
    version = excluded.version,
    totalCost = excluded.totalCost
  WHERE excluded.version >= component_lots.version
     OR excluded.updatedAt >= component_lots.updatedAt
     OR component_lots.updatedAt IS NULL
`, Jp = (e) => ({
  id: e.id,
  initialStockLevel: Number(e.initialStockLevel || 0),
  quantity: parseFloat(e.quantity || 0),
  currentStockLevel: parseFloat(e.currentStockLevel || 0),
  ref: e.ref ?? null,
  unitCost: parseFloat(e.unitCost || 0),
  expiry: e.expiry ?? null,
  createdAt: e.createdAt ?? null,
  updatedAt: e.updatedAt ?? e.createdAt ?? null,
  deletedAt: e.deletedAt ?? e.deleted_at ?? null,
  preparedBy: e.preparedBy ?? null,
  updatedBy: e.updatedBy ?? null,
  componentId: e.componentId ?? null,
  recordId: e.recordId ?? null,
  version: Number(e.version || 0),
  totalCost: parseFloat(e.totalCost || 0)
}), Kp = {
  name: "component_lots",
  create: `
    CREATE TABLE IF NOT EXISTS component_lots (
      id TEXT PRIMARY KEY,
      initialStockLevel REAL,
      quantity REAL,
      currentStockLevel REAL,
      ref TEXT,
      unitCost REAL,
      expiry TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      deletedAt TEXT,
      preparedBy TEXT,
      updatedBy TEXT,
      componentId TEXT,
      recordId TEXT,
      version INTEGER,
      totalCost REAL
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_component_lots_componentId ON component_lots(componentId);",
    "CREATE INDEX IF NOT EXISTS idx_component_lots_ref ON component_lots(ref);",
    "CREATE INDEX IF NOT EXISTS idx_component_lots_expiry ON component_lots(expiry);"
  ]
}, Qp = `
  INSERT INTO component_lot_logs (
    id,
    changeType,
    previousLevel,
    currentLevel,
    actionTakenBy,
    changeAmount,
    createdAt,
    updatedAt,
    deletedAt,
    lotId,
    recordId,
    version
  ) VALUES (
    @id,
    @changeType,
    @previousLevel,
    @currentLevel,
    @actionTakenBy,
    @changeAmount,
    @createdAt,
    @updatedAt,
    @deletedAt,
    @lotId,
    @recordId,
    @version
  )
  ON CONFLICT(id) DO UPDATE SET
    changeType = excluded.changeType,
    previousLevel = excluded.previousLevel,
    currentLevel = excluded.currentLevel,
    actionTakenBy = excluded.actionTakenBy,
    changeAmount = excluded.changeAmount,
    createdAt = excluded.createdAt,
    updatedAt = excluded.updatedAt,
    deletedAt = excluded.deletedAt,
    lotId = excluded.lotId,
    recordId = excluded.recordId,
    version = excluded.version
  WHERE excluded.version >= component_lot_logs.version
     OR excluded.updatedAt >= component_lot_logs.updatedAt
     OR component_lot_logs.updatedAt IS NULL
`, Zp = (e) => ({
  id: e.id,
  changeType: e.changeType ?? null,
  previousLevel: parseFloat(e.previousLevel || 0),
  currentLevel: parseFloat(e.currentLevel || 0),
  actionTakenBy: e.actionTakenBy ?? null,
  changeAmount: parseFloat(e.changeAmount || 0),
  createdAt: e.createdAt ?? null,
  updatedAt: e.updatedAt ?? e.createdAt ?? null,
  deletedAt: e.deletedAt ?? e.deleted_at ?? null,
  lotId: e.lotId ?? null,
  recordId: e.recordId ?? null,
  version: Number(e.version || 0)
}), eh = {
  name: "component_lot_logs",
  create: `
    CREATE TABLE IF NOT EXISTS component_lot_logs (
      id TEXT PRIMARY KEY,
      changeType TEXT,
      previousLevel REAL,
      currentLevel REAL,
      actionTakenBy TEXT,
      changeAmount REAL,
      createdAt TEXT,
      updatedAt TEXT,
      deletedAt TEXT,
      lotId TEXT,
      recordId TEXT,
      version INTEGER
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_component_lot_logs_lotId ON component_lot_logs(lotId);",
    "CREATE INDEX IF NOT EXISTS idx_component_lot_logs_createdAt ON component_lot_logs(createdAt);"
  ]
}, th = `
  INSERT OR REPLACE INTO modifier (
    id,
    modifierType,
    modifierMode,
    showInPos,
    name,
    limitTotalSelection,
    maximumQuantity,
    productId,
    outletId,
    reference,
    recordId,
    version,
    createdAt,
    updatedAt,
    deletedAt
  ) VALUES (
    @id,
    @modifierType,
    @modifierMode,
    @showInPos,
    @name,
    @limitTotalSelection,
    @maximumQuantity,
    @productId,
    @outletId,
    @reference,
    @recordId,
    @version,
    @createdAt,
    @updatedAt,
    @deletedAt
  )
`, rh = (e) => ({
  id: String(e.id || ""),
  modifierType: e.modifier_type ?? e.modifierType ?? null,
  modifierMode: e.modifier_mode ?? e.modifierMode ?? null,
  showInPos: e.show_in_pos || e.showInPos ? 1 : 0,
  name: e.name ?? null,
  limitTotalSelection: e.limit_total_selection || e.limitTotalSelection ? 1 : 0,
  maximumQuantity: Number(e.maximum_quantity ?? e.maximumQuantity ?? 0),
  productId: e.productId ?? e.product_id ?? null,
  outletId: e.outletId ?? e.outlet_id ?? null,
  reference: e.reference ?? null,
  recordId: e.recordId ?? e.record_id ?? null,
  version: Number(e.version ?? 0),
  createdAt: e.created_at ?? e.createdAt ?? null,
  updatedAt: e.updated_at ?? e.updatedAt ?? null,
  deletedAt: e.deleted_at ?? e.deletedAt ?? null
}), nh = {
  name: "modifier",
  create: `
    CREATE TABLE IF NOT EXISTS modifier (
      id TEXT PRIMARY KEY,
      modifierType TEXT,
      modifierMode TEXT,
      showInPos INTEGER DEFAULT 0 NOT NULL,
      name TEXT,
      limitTotalSelection INTEGER DEFAULT 0 NOT NULL,
      maximumQuantity INTEGER DEFAULT 0 NOT NULL,
      productId TEXT,
      outletId TEXT,
      reference TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0 NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      deletedAt TEXT
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_modifier_outletId ON modifier(outletId);",
    "CREATE INDEX IF NOT EXISTS idx_modifier_productId ON modifier(productId);",
    "CREATE INDEX IF NOT EXISTS idx_modifier_type ON modifier(modifierType);"
  ]
}, ih = `
  INSERT OR REPLACE INTO modifier_option (
    id,
    name,
    amount,
    maximumQuantity,
    limitQuantity,
    modifierId,
    reference,
    recordId,
    version,
    createdAt,
    updatedAt,
    deletedAt
  ) VALUES (
    @id,
    @name,
    @amount,
    @maximumQuantity,
    @limitQuantity,
    @modifierId,
    @reference,
    @recordId,
    @version,
    @createdAt,
    @updatedAt,
    @deletedAt
  )
`, sh = (e) => ({
  id: String(e.id || ""),
  name: e.name ?? null,
  amount: Number(e.amount ?? 0),
  maximumQuantity: Number(e.maximum_quantity ?? e.maximumQuantity ?? 0),
  limitQuantity: e.limit_quantity || e.limitQuantity ? 1 : 0,
  modifierId: e.modifierId ?? e.modifier_id ?? null,
  reference: e.reference ?? null,
  recordId: e.recordId ?? e.record_id ?? null,
  version: Number(e.version ?? 0),
  createdAt: e.created_at ?? e.createdAt ?? null,
  updatedAt: e.updated_at ?? e.updatedAt ?? null,
  deletedAt: e.deleted_at ?? e.deletedAt ?? null
}), oh = {
  name: "modifier_option",
  create: `
    CREATE TABLE IF NOT EXISTS modifier_option (
      id TEXT PRIMARY KEY,
      name TEXT,
      amount REAL DEFAULT 0 NOT NULL,
      maximumQuantity INTEGER DEFAULT 0 NOT NULL,
      limitQuantity INTEGER DEFAULT 0 NOT NULL,
      modifierId TEXT,
      reference TEXT,
      recordId TEXT,
      version INTEGER DEFAULT 0 NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      deletedAt TEXT
    );
  `,
  indexes: [
    "CREATE INDEX IF NOT EXISTS idx_modifier_option_modifierId ON modifier_option(modifierId);"
  ]
}, Uo = [
  xf,
  kf,
  qf,
  Hf,
  jf,
  Gf,
  Vf,
  Wf,
  Yf,
  Kf,
  ep,
  tp,
  rp,
  np,
  ip,
  sp,
  lp,
  dp,
  hp,
  gp,
  Tp,
  yp,
  vp,
  Ap,
  Np,
  Rp,
  Lp,
  xp,
  Fp,
  qp,
  Bp,
  Gp,
  Yp,
  Kp,
  eh,
  nh,
  oh
];
var gn, Fo;
function ku() {
  if (Fo) return gn;
  Fo = 1;
  var e = Me;
  return gn = function() {
    return e.randomBytes(16);
  }, gn;
}
var Tn, ko;
function Mu() {
  if (ko) return Tn;
  ko = 1;
  for (var e = [], r = 0; r < 256; ++r)
    e[r] = (r + 256).toString(16).substr(1);
  function t(n, s) {
    var i = s || 0, o = e;
    return [
      o[n[i++]],
      o[n[i++]],
      o[n[i++]],
      o[n[i++]],
      "-",
      o[n[i++]],
      o[n[i++]],
      "-",
      o[n[i++]],
      o[n[i++]],
      "-",
      o[n[i++]],
      o[n[i++]],
      "-",
      o[n[i++]],
      o[n[i++]],
      o[n[i++]],
      o[n[i++]],
      o[n[i++]],
      o[n[i++]]
    ].join("");
  }
  return Tn = t, Tn;
}
var yn, Mo;
function ah() {
  if (Mo) return yn;
  Mo = 1;
  var e = ku(), r = Mu(), t, n, s = 0, i = 0;
  function o(c, a, u) {
    var l = a && u || 0, d = a || [];
    c = c || {};
    var f = c.node || t, h = c.clockseq !== void 0 ? c.clockseq : n;
    if (f == null || h == null) {
      var E = e();
      f == null && (f = t = [
        E[0] | 1,
        E[1],
        E[2],
        E[3],
        E[4],
        E[5]
      ]), h == null && (h = n = (E[6] << 8 | E[7]) & 16383);
    }
    var g = c.msecs !== void 0 ? c.msecs : (/* @__PURE__ */ new Date()).getTime(), m = c.nsecs !== void 0 ? c.nsecs : i + 1, v = g - s + (m - i) / 1e4;
    if (v < 0 && c.clockseq === void 0 && (h = h + 1 & 16383), (v < 0 || g > s) && c.nsecs === void 0 && (m = 0), m >= 1e4)
      throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
    s = g, i = m, n = h, g += 122192928e5;
    var N = ((g & 268435455) * 1e4 + m) % 4294967296;
    d[l++] = N >>> 24 & 255, d[l++] = N >>> 16 & 255, d[l++] = N >>> 8 & 255, d[l++] = N & 255;
    var b = g / 4294967296 * 1e4 & 268435455;
    d[l++] = b >>> 8 & 255, d[l++] = b & 255, d[l++] = b >>> 24 & 15 | 16, d[l++] = b >>> 16 & 255, d[l++] = h >>> 8 | 128, d[l++] = h & 255;
    for (var D = 0; D < 6; ++D)
      d[l + D] = f[D];
    return a || r(d);
  }
  return yn = o, yn;
}
var vn, qo;
function lh() {
  if (qo) return vn;
  qo = 1;
  var e = ku(), r = Mu();
  function t(n, s, i) {
    var o = s && i || 0;
    typeof n == "string" && (s = n === "binary" ? new Array(16) : null, n = null), n = n || {};
    var c = n.random || (n.rng || e)();
    if (c[6] = c[6] & 15 | 64, c[8] = c[8] & 63 | 128, s)
      for (var a = 0; a < 16; ++a)
        s[o + a] = c[a];
    return s || r(c);
  }
  return vn = t, vn;
}
var An, $o;
function ch() {
  if ($o) return An;
  $o = 1;
  var e = ah(), r = lh(), t = r;
  return t.v1 = e, t.v4 = r, An = t, An;
}
var Ve = ch(), Ce = /* @__PURE__ */ ((e) => (e.CREATE = "CREATE", e.UPDATE = "UPDATE", e.DELETE = "DELETE", e))(Ce || {});
class uh {
  constructor() {
    const r = je.getPath("userData"), t = ye.join(r, "bountip.db"), n = ye.dirname(t);
    be.existsSync(n) || be.mkdirSync(n, { recursive: !0 }), this.db = new Lo(t), this.initConnection(!0);
  }
  initConnection(r = !1) {
    if (!r) {
      const t = je.getPath("userData"), n = ye.join(t, "bountip.db"), s = ye.dirname(n);
      be.existsSync(s) || be.mkdirSync(s, { recursive: !0 }), this.db = new Lo(n), console.log("[DatabaseService] Connection re-initialized.");
    }
    this.initSchema(), this.ensureDeviceId();
  }
  prepare(r) {
    try {
      return this.db.prepare(r);
    } catch (t) {
      const n = t.code === "SQLITE_READONLY_DBMOVED" || t.message?.includes("readonly database") || t.message?.includes("database is locked"), s = t.message?.includes("no such table");
      if (n || s) {
        console.warn(
          `[DatabaseService] Database error (${t.code || "MISSING_TABLE"}). Re-initializing connection...`
        );
        try {
          this.db.close();
        } catch {
        }
        return this.initConnection(), this.db.prepare(r);
      }
      throw t;
    }
  }
  transaction(r) {
    try {
      return this.db.transaction(r);
    } catch (t) {
      const n = t.code === "SQLITE_READONLY_DBMOVED" || t.message?.includes("readonly database") || t.message?.includes("database is locked"), s = t.message?.includes("no such table");
      if (n || s) {
        console.warn(
          `[DatabaseService] Transaction error (${t.code || "MISSING_TABLE"}). Re-initializing connection...`
        );
        try {
          this.db.close();
        } catch {
        }
        return this.initConnection(), this.db.transaction(r);
      }
      throw t;
    }
  }
  ensureDeviceId() {
    if (this.prepare("SELECT value FROM identity WHERE key = ?").get(
      "device_id"
    ))
      console.log("[DatabaseService] Existing deviceId loaded.");
    else {
      const t = Ve.v4();
      this.prepare(
        "INSERT OR REPLACE INTO identity (key, value) VALUES (?, ?)"
      ).run("device_id", JSON.stringify({ deviceId: t })), console.log("[DatabaseService] Generated new deviceId:", t);
    }
  }
  clearAllData() {
    try {
      this.db && this.db.close();
      const r = je.getPath("userData"), t = ye.join(r, "bountip.db");
      be.existsSync(t) && be.unlinkSync(t);
    } catch (r) {
      throw console.error("Failed to clear database:", r), r;
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
    for (const r of Uo)
      if (this.db.exec(r.create), r.indexes?.length)
        for (const t of r.indexes)
          this.db.exec(t);
    this.runMigrations();
  }
  runMigrations() {
    try {
      this.db.exec(
        "ALTER TABLE business_outlet ADD COLUMN isOfflineImage INTEGER DEFAULT 0"
      );
    } catch (l) {
      l.message.includes("duplicate column name") || console.error("Migration error (isOfflineImage):", l);
    }
    try {
      this.db.exec("ALTER TABLE business_outlet ADD COLUMN localLogoPath TEXT");
    } catch (l) {
      l.message.includes("duplicate column name") || console.error("Migration error (localLogoPath):", l);
    }
    const r = ["recordId", "version"];
    for (const l of r)
      try {
        const d = l === "version" ? "INTEGER DEFAULT 0" : "TEXT";
        this.db.exec(`ALTER TABLE system_default ADD COLUMN ${l} ${d}`);
      } catch (d) {
        d.message.includes("duplicate column name") || console.error(`Migration error (system_default.${l}):`, d);
      }
    const t = [
      "reason",
      "recordId",
      "version",
      "representativeName",
      "address",
      "taxNumber",
      "notes"
    ];
    for (const l of t)
      try {
        const d = l === "version" ? "INTEGER DEFAULT 0" : "TEXT";
        this.db.exec(`ALTER TABLE customers ADD COLUMN ${l} ${d}`);
      } catch (d) {
        d.message.includes("duplicate column name") || console.error(`Migration error (customers.${l}):`, d);
      }
    const n = ["cartId", "recordId", "version"];
    for (const l of n)
      try {
        const d = l === "version" ? "INTEGER DEFAULT 0" : "TEXT";
        this.db.exec(`ALTER TABLE orders ADD COLUMN ${l} ${d}`);
      } catch (d) {
        d.message.includes("duplicate column name") || console.error(`Migration error (orders.${l}):`, d);
      }
    const s = [
      "outletId",
      "itemCount",
      "totalQuantity",
      "totalAmount",
      "customerId",
      "recordId",
      "version"
    ];
    for (const l of s)
      try {
        let d = "TEXT";
        (l === "version" || l === "itemCount" || l === "totalQuantity") && (d = "INTEGER DEFAULT 0"), l === "totalAmount" && (d = "REAL DEFAULT 0"), this.db.exec(`ALTER TABLE cart ADD COLUMN ${l} ${d}`);
      } catch (d) {
        d.message.includes("duplicate column name") || console.error(`Migration error (cart.${l}):`, d);
      }
    const i = [
      "cartId",
      "priceTierDiscount",
      "priceTierMarkup",
      "recordId",
      "version"
    ];
    for (const l of i)
      try {
        let d = "TEXT";
        l === "version" && (d = "INTEGER DEFAULT 0"), (l === "priceTierDiscount" || l === "priceTierMarkup") && (d = "REAL DEFAULT 0"), this.db.exec(`ALTER TABLE cart_item ADD COLUMN ${l} ${d}`);
      } catch (d) {
        d.message.includes("duplicate column name") || console.error(`Migration error (cart_item.${l}):`, d);
      }
    const o = ["recordId", "version", "businessId", "outletId"];
    for (const l of o)
      try {
        let d = "TEXT";
        l === "version" && (d = "INTEGER DEFAULT 0"), this.db.exec(`ALTER TABLE inventory ADD COLUMN ${l} ${d}`);
      } catch (d) {
        d.message.includes("duplicate column name") || console.error(`Migration error (inventory.${l}):`, d);
      }
    const c = ["recordId", "version"];
    for (const l of c)
      try {
        let d = "TEXT";
        l === "version" && (d = "INTEGER DEFAULT 0"), this.db.exec(`ALTER TABLE inventory_item ADD COLUMN ${l} ${d}`);
      } catch (d) {
        d.message.includes("duplicate column name") || console.error(`Migration error (inventory_item.${l}):`, d);
      }
    const a = ["recordId", "version"];
    for (const l of a)
      try {
        let d = "TEXT";
        l === "version" && (d = "INTEGER DEFAULT 0"), this.db.exec(`ALTER TABLE item_master ADD COLUMN ${l} ${d}`);
      } catch (d) {
        d.message.includes("duplicate column name") || console.error(`Migration error (item_master.${l}):`, d);
      }
    const u = ["recordId", "version"];
    for (const l of u)
      try {
        let d = "TEXT";
        l === "version" && (d = "INTEGER DEFAULT 0"), this.db.exec(`ALTER TABLE item_lot ADD COLUMN ${l} ${d}`);
      } catch (d) {
        d.message.includes("duplicate column name") || console.error(`Migration error (item_lot.${l}):`, d);
      }
  }
  close() {
    this.db && (this.db.close(), console.log("[DatabaseService] Database closed."));
  }
  // Identity Methods
  getIdentity() {
    const r = this.prepare("SELECT value FROM identity WHERE key = ?").get(
      "user_identity"
    );
    return r ? JSON.parse(r.value) : null;
  }
  saveIdentity(r) {
    const n = { ...this.getIdentity() || {}, ...r };
    if (this.prepare(
      "INSERT OR REPLACE INTO identity (key, value) VALUES (?, ?)"
    ).run("user_identity", JSON.stringify(n)), r.id || r.email || r.fullName)
      try {
        const s = {
          ...n,
          id: n.id ?? n.userId ?? n.user?.id,
          email: n.email ?? n.user?.email,
          fullName: n.fullName ?? n.user?.fullName
        };
        s.id && (this.prepare("DELETE FROM user").run(), this.prepare(xo).run(
          this.sanitize(Po(s))
        ));
      } catch (s) {
        console.error("Failed to sync identity to user table:", s);
      }
  }
  toSqliteValue(r) {
    if (r == null) return null;
    const t = typeof r;
    return t === "number" || t === "string" || t === "bigint" || typeof Buffer < "u" && Buffer.isBuffer?.(r) ? r : r instanceof Date ? r.toISOString() : t === "boolean" ? r ? 1 : 0 : JSON.stringify(r);
  }
  sanitize(r) {
    const t = {};
    for (const [n, s] of Object.entries(r))
      t[n] = this.toSqliteValue(s);
    return t;
  }
  query(r, t = []) {
    try {
      const n = this.prepare(r);
      return n.reader ? n.all(t) : n.run(t);
    } catch (n) {
      throw console.error("DB Query Error:", n), n;
    }
  }
  run(r, t = []) {
    try {
      return this.prepare(r).run(t);
    } catch (n) {
      throw console.error("DB Run Error:", n), n;
    }
  }
  get(r, t = []) {
    try {
      return this.prepare(r).get(t);
    } catch (n) {
      throw console.error("DB Get Error:", n), n;
    }
  }
  getUserProfile() {
    const r = this.getIdentity(), t = this.prepare("SELECT * FROM user LIMIT 1").get(), n = r && typeof r == "object" ? {
      id: r.id ?? r.userId ?? r.user?.id ?? t?.id ?? null,
      email: r.email ?? r.user?.email ?? t?.email ?? null,
      fullName: r.fullName ?? r.user?.fullName ?? t?.fullName ?? null,
      status: r.status ?? r.user?.status ?? t?.status ?? null,
      isEmailVerified: r.isEmailVerified ?? r.user?.isEmailVerified ?? (t && typeof t.isEmailVerified == "number" ? t.isEmailVerified === 1 : void 0),
      createdAt: r.createdAt ?? r.user?.createdAt ?? t?.createdAt ?? null,
      updatedAt: r.updatedAt ?? r.user?.updatedAt ?? t?.updatedAt ?? null
    } : {
      id: t?.id ?? null,
      email: t?.email ?? null,
      fullName: t?.fullName ?? null,
      status: t?.status ?? null,
      isEmailVerified: t && typeof t.isEmailVerified == "number" ? t.isEmailVerified === 1 : void 0,
      createdAt: t?.createdAt ?? null,
      updatedAt: t?.updatedAt ?? null
    }, s = r && typeof r == "object" ? r.deviceId ?? r.user?.deviceId ?? null : null;
    return {
      id: n.id ?? null,
      email: n.email ?? null,
      name: n.fullName ?? null,
      status: n.status ?? null,
      isEmailVerified: n.isEmailVerified,
      createdAt: n.createdAt ?? null,
      updatedAt: n.updatedAt ?? null,
      deviceId: s
    };
  }
  getSyncUserId() {
    const r = this.getIdentity();
    if (r && typeof r == "object") {
      const n = r.id ?? r.userId ?? r.user?.id ?? null;
      if (n) return String(n);
    }
    const t = this.prepare("SELECT id FROM user LIMIT 1").get();
    return t && t.id ? String(t.id) : null;
  }
  getDeviceId() {
    const r = this.prepare("SELECT value FROM identity WHERE key = ?").get(
      "device_id"
    );
    if (!r) return null;
    try {
      return JSON.parse(r.value).deviceId ?? null;
    } catch {
      return null;
    }
  }
  /**
   * Gets the next global sync version and increments the counter in the database.
   * This ensures a strictly increasing integer for all sync operations.
   */
  getNextSyncVersion() {
    const r = this.prepare("SELECT value FROM identity WHERE key = ?").get(
      "last_sync_version"
    );
    let t = 1;
    if (r)
      try {
        t = JSON.parse(r.value).version ?? 1;
      } catch {
      }
    const n = t + 1;
    return this.prepare(
      "INSERT OR REPLACE INTO identity (key, value) VALUES (?, ?)"
    ).run("last_sync_version", JSON.stringify({ version: n })), n;
  }
  // Cache Methods
  getCache(r) {
    const t = this.prepare("SELECT value FROM cache WHERE key = ?").get(
      r
    );
    return t ? JSON.parse(t.value) : null;
  }
  putCache(r, t) {
    this.prepare("INSERT OR REPLACE INTO cache (key, value) VALUES (?, ?)").run(
      r,
      JSON.stringify(t)
    );
  }
  // Image Queue Methods
  addToImageQueue(r) {
    this.prepare(
      "INSERT INTO image_upload_queue (localPath, tableName, recordId, columnName, status) VALUES (@localPath, @tableName, @recordId, @columnName, 'pending')"
    ).run(r);
  }
  getPendingImageUploads() {
    return this.prepare(
      "SELECT * FROM image_upload_queue WHERE status = 'pending'"
    ).all();
  }
  markImageAsUploaded(r) {
    this.prepare("DELETE FROM image_upload_queue WHERE id = ?").run(r);
  }
  failImageUpload(r, t) {
    this.prepare(
      "UPDATE image_upload_queue SET status = 'failed', last_error = ? WHERE id = ?"
    ).run(t, r);
  }
  updateRecordColumn(r, t, n, s) {
    if (/[^a-zA-Z0-9_]/.test(r) || /[^a-zA-Z0-9_]/.test(n)) {
      console.error(
        `[DatabaseService] Invalid table/column name: ${r}.${n}`
      );
      return;
    }
    const i = (/* @__PURE__ */ new Date()).toISOString(), o = `UPDATE ${r} SET ${n} = ?, updatedAt = ? WHERE id = ?`;
    this.prepare(o).run(s, i, t);
  }
  // Queue Methods
  addToQueue(r) {
    this.prepare("INSERT INTO sync_queue (op, status) VALUES (?, ?)").run(
      JSON.stringify(r),
      "pending"
    );
  }
  // System Default Methods
  getSystemDefaults(r, t) {
    return t ? this.prepare(
      "SELECT * FROM system_default WHERE key = ? AND (outletId = ? OR outletId IS NULL)"
    ).all(r, t) : this.prepare("SELECT * FROM system_default WHERE key = ?").all(
      r
    );
  }
  addSystemDefault(r, t, n) {
    const s = Ve.v4(), i = {
      id: s,
      key: r,
      data: JSON.stringify(t),
      outletId: n,
      recordId: null,
      version: 0
    };
    return this.prepare(
      "INSERT INTO system_default (id, key, data, outletId, recordId, version) VALUES (@id, @key, @data, @outletId, @recordId, @version)"
    ).run(i), console.log(`[DatabaseService] Queuing sync for system_default: ${r}`), this.addToQueue({
      table: "system_default",
      action: Ce.CREATE,
      data: {
        ...i,
        data: t
        // Send parsed data to sync
      },
      id: s
    }), i;
  }
  deleteSystemDefault(r) {
    const t = this.prepare(
      "SELECT * FROM system_default WHERE id = ?"
    ).get(r);
    this.prepare("DELETE FROM system_default WHERE id = ?").run(r), t && (console.log(
      `[DatabaseService] Queuing sync for system_default delete: ${r}`
    ), this.addToQueue({
      table: "system_default",
      action: Ce.DELETE,
      data: t,
      id: r
    }));
  }
  getPendingQueue() {
    return this.prepare(
      "SELECT op FROM sync_queue WHERE status = 'pending' ORDER BY id ASC"
    ).all().map((t) => JSON.parse(t.op));
  }
  // Get Raw Queue Items with ID
  getPendingQueueItems() {
    return this.prepare(
      "SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY id ASC"
    ).all();
  }
  markAsSynced(r) {
    if (r.length === 0) return;
    const t = r.map(() => "?").join(",");
    this.prepare(`DELETE FROM sync_queue WHERE id IN (${t})`).run(
      ...r
    );
  }
  markAsFailed(r, t) {
    this.prepare(
      "UPDATE sync_queue SET status = 'failed', last_error = ? WHERE id = ?"
    ).run(t, r);
  }
  clearQueue() {
    this.prepare("DELETE FROM sync_queue").run();
  }
  setQueue(r) {
    const t = this.prepare(
      "INSERT INTO sync_queue (op, status) VALUES (?, ?)"
    ), n = this.prepare("DELETE FROM sync_queue");
    return this.transaction((i) => {
      n.run();
      for (const o of i) t.run(JSON.stringify(o), "pending");
    })(r), !0;
  }
  updateBusinessLogo(r, t) {
    const n = (/* @__PURE__ */ new Date()).toISOString();
    this.prepare(
      "UPDATE business_outlet SET logoUrl = ?, isOfflineImage = 0, localLogoPath = NULL, updatedAt = ? WHERE id = ?"
    ).run(t, n, r);
  }
  applyPullData(r) {
    const { data: t } = r;
    this.transaction(() => {
      if (Array.isArray(t.carts) && t.carts.length > 0) {
        const s = this.prepare(zf);
        for (const i of t.carts)
          s.run(this.sanitize(Jf(i)));
      }
      if (Array.isArray(t.cartItems) && t.cartItems.length > 0) {
        const s = this.prepare(Qf);
        for (const i of t.cartItems)
          s.run(this.sanitize(Zf(i)));
      }
      if (t.user) {
        const s = t.user;
        this.prepare("DELETE FROM user").run(), this.prepare(xo).run(
          this.sanitize(Po(s))
        );
      }
      if (Array.isArray(t.businesses) && t.businesses.length > 0) {
        const s = this.prepare(Xf);
        for (const i of t.businesses)
          s.run(this.sanitize(Bf(i)));
      }
      if (Array.isArray(t.outlets) && t.outlets.length > 0) {
        const s = this.prepare(Ru);
        for (const i of t.outlets)
          s.run(this.sanitize(Ou(i)));
      }
      if (Array.isArray(t.products) && t.products.length > 0) {
        const s = this.prepare(Uf);
        for (const i of t.products)
          s.run(this.sanitize(Ff(i)));
      }
      if (Array.isArray(t.modifiers) && t.modifiers.length > 0) {
        const s = this.prepare(th);
        for (const i of t.modifiers)
          s.run(this.sanitize(rh(i)));
      }
      if (Array.isArray(t.modifierOptions) && t.modifierOptions.length > 0) {
        const s = this.prepare(ih);
        for (const i of t.modifierOptions)
          s.run(this.sanitize(sh(i)));
      }
      if (Array.isArray(t.recipes) && t.recipes.length > 0) {
        const s = this.prepare(op), i = this.prepare(
          "SELECT name FROM product WHERE id = ? OR productCode = ? LIMIT 1"
        );
        for (const o of t.recipes) {
          const c = o.productReference || o.productId || o.product_id || "";
          let a = o.productName || "";
          if (!a && c) {
            const l = i.get(c, c);
            l?.name && (a = String(l.name));
          }
          const u = {
            ...o,
            productReference: c,
            productName: a
          };
          s.run(this.sanitize(ap(u)));
        }
      }
      if (Array.isArray(t.recipeIngredients) && t.recipeIngredients.length > 0) {
        const s = this.prepare(cp);
        for (const i of t.recipeIngredients)
          s.run(this.sanitize(up(i)));
      }
      if (Array.isArray(t.recipeVariants) && t.recipeVariants.length > 0) {
        const s = this.prepare(fp);
        for (const i of t.recipeVariants)
          s.run(this.sanitize(pp(i)));
      }
      if (Array.isArray(t.systemDefaults) && t.systemDefaults.length > 0) {
        const s = this.prepare(mp);
        for (const i of t.systemDefaults)
          s.run(this.sanitize(Ep(i)));
      }
      if (Array.isArray(t.customers) && t.customers.length > 0) {
        const s = this.prepare(eo);
        for (const i of t.customers)
          s.run(this.sanitize(to(i)));
      }
      if (Array.isArray(t.inventories) && t.inventories.length > 0) {
        const s = this.prepare(bu);
        for (const i of t.inventories)
          s.run(this.sanitize(Lu(i)));
      }
      if (Array.isArray(t.inventoryItems) && t.inventoryItems.length > 0) {
        const s = this.prepare(Cu);
        for (const i of t.inventoryItems)
          s.run(this.sanitize(Du(i)));
      }
      if (Array.isArray(t.itemMasters) && t.itemMasters.length > 0) {
        const s = this.prepare(xu);
        for (const i of t.itemMasters)
          s.run(this.sanitize(Pu(i)));
      }
      if (Array.isArray(t.itemLots) && t.itemLots.length > 0) {
        const s = this.prepare(Uu);
        for (const i of t.itemLots)
          s.run(this.sanitize(Fu(i)));
      }
      if (Array.isArray(t.orders) && t.orders.length > 0) {
        const s = this.prepare(Ip);
        for (const i of t.orders)
          s.run(this.sanitize(Sp(i)));
      }
      if (Array.isArray(t.productions) && t.productions.length > 0) {
        const s = this.prepare(_p);
        for (const i of t.productions)
          s.run(this.sanitize(wp(i)));
      }
      if (Array.isArray(t.productionItems) && t.productionItems.length > 0) {
        const s = this.prepare(Op);
        for (const i of t.productionItems)
          s.run(this.sanitize(bp(i)));
      }
      if (Array.isArray(t.invoices) && t.invoices.length > 0) {
        const s = this.prepare(Cp);
        for (const i of t.invoices)
          s.run(this.sanitize(Dp(i)));
      }
      if (Array.isArray(t.invoiceItems) && t.invoiceItems.length > 0) {
        const s = this.prepare(Pp);
        for (const i of t.invoiceItems)
          s.run(this.sanitize(Up(i)));
      }
      if (Array.isArray(t.suppliers) && t.suppliers.length > 0) {
        const s = this.prepare(kp);
        for (const i of t.suppliers)
          s.run(this.sanitize(Mp(i)));
      }
      if (Array.isArray(t.supplierItems) && t.supplierItems.length > 0) {
        const s = this.prepare($p);
        for (const i of t.supplierItems)
          s.run(this.sanitize(Xp(i)));
      }
      if (Array.isArray(t.components) && t.components.length > 0) {
        const s = this.prepare(Hp);
        for (const i of t.components)
          s.run(this.sanitize(jp(i)));
      }
      if (Array.isArray(t.componentItems) && t.componentItems.length > 0) {
        const s = this.prepare(Vp);
        for (const i of t.componentItems)
          s.run(this.sanitize(Wp(i)));
      }
      if (Array.isArray(t.componentLots) && t.componentLots.length > 0) {
        const s = this.prepare(zp);
        for (const i of t.componentLots)
          s.run(this.sanitize(Jp(i)));
      }
      if (Array.isArray(t.componentLotLogs) && t.componentLotLogs.length > 0) {
        const s = this.prepare(Qp);
        for (const i of t.componentLotLogs)
          s.run(this.sanitize(Zp(i)));
      }
      if (Array.isArray(t.paymentTerms) && t.paymentTerms.length > 0) {
        const s = this.prepare(`
          INSERT INTO payment_terms (
            id, name, paymentType, instantPayment, paymentOnDelivery, 
            paymentInInstallment, outletId, recordId, version, 
            createdAt, updatedAt, deletedAt
          ) VALUES (
            @id, @name, @paymentType, @instantPayment, @paymentOnDelivery, 
            @paymentInInstallment, @outletId, @recordId, @version, 
            @createdAt, @updatedAt, @deletedAt
          ) ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            paymentType = excluded.paymentType,
            instantPayment = excluded.instantPayment,
            paymentOnDelivery = excluded.paymentOnDelivery,
            paymentInInstallment = excluded.paymentInInstallment,
            outletId = excluded.outletId,
            recordId = excluded.recordId,
            version = excluded.version,
            updatedAt = excluded.updatedAt,
            deletedAt = excluded.deletedAt
          WHERE excluded.version >= payment_terms.version OR excluded.updatedAt >= payment_terms.updatedAt OR payment_terms.updatedAt IS NULL
        `);
        for (const i of t.paymentTerms)
          s.run({
            id: i.id,
            name: i.name,
            paymentType: i.paymentType,
            instantPayment: i.instantPayment ? 1 : 0,
            paymentOnDelivery: i.paymentOnDelivery ? 1 : 0,
            paymentInInstallment: i.paymentInInstallment ? JSON.stringify(i.paymentInInstallment) : null,
            outletId: i.outletId,
            recordId: i.recordId,
            version: i.version,
            createdAt: i.createdAt,
            updatedAt: i.updatedAt,
            deletedAt: i.deletedAt
          });
      }
    })();
  }
  /**
   * Wipes all user-specific data from the local database.
   * This is used when a new user logs in to prevent cross-user data leakage.
   */
  wipeUserData() {
    console.log("[DatabaseService] Wiping user data for fresh login...");
    const r = this.transaction(() => {
      for (const t of Uo)
        this.prepare(`DELETE FROM ${t.name}`).run();
      this.prepare("DELETE FROM sync_queue").run(), this.prepare("DELETE FROM image_upload_queue").run(), this.prepare(
        "DELETE FROM identity WHERE key NOT IN ('device_id', 'pin_hash', 'login_hash')"
      ).run(), this.prepare("DELETE FROM cache").run();
    });
    try {
      return r(), !0;
    } catch (t) {
      return console.error("[DatabaseService] Failed to wipe user data:", t), !1;
    }
  }
}
const dh = async (e, r) => {
  e.run("INSERT OR REPLACE INTO identity (key, value) VALUES (?, ?)", [
    "login_hash",
    JSON.stringify({ hash: r })
  ]);
}, fh = async (e) => {
  const r = e.get("SELECT value FROM identity WHERE key = ?", [
    "login_hash"
  ]);
  if (!r) return null;
  try {
    return JSON.parse(r.value).hash ?? null;
  } catch {
    return null;
  }
}, ph = async (e, r) => {
  e.run("INSERT OR REPLACE INTO identity (key, value) VALUES (?, ?)", [
    "pin_hash",
    JSON.stringify({ hash: r })
  ]);
}, hh = async (e) => {
  const r = e.get("SELECT value FROM identity WHERE key = ?", [
    "pin_hash"
  ]);
  if (!r) return null;
  try {
    return JSON.parse(r.value).hash ?? null;
  } catch {
    return null;
  }
}, In = "bountip-desktop", Sn = "auth-tokens";
class mh {
  constructor(r) {
    this.db = r;
  }
  async storeTokens(r) {
    try {
      const t = JSON.stringify(r);
      await En.setPassword(In, Sn, t);
    } catch (t) {
      console.error("Failed to store tokens in keytar", t);
    }
  }
  async clearTokens() {
    try {
      await En.deletePassword(In, Sn);
    } catch (r) {
      console.error("Failed to clear tokens in keytar", r);
    }
  }
  async getTokens() {
    try {
      const r = await En.getPassword(In, Sn);
      return r ? JSON.parse(r) : null;
    } catch (r) {
      return console.error("Failed to read tokens from keytar", r), null;
    }
  }
  getUser() {
    return this.db.getUserProfile();
  }
  saveUser(r) {
    this.db.saveIdentity(r);
  }
  async saveLoginHash(r, t) {
    const n = Me.randomBytes(16).toString("hex"), s = Me.pbkdf2Sync(t, n, 1e3, 64, "sha512").toString("hex");
    await dh(this.db, `${n}:${s}`);
  }
  async verifyLoginHash(r, t) {
    const n = await fh(this.db);
    if (!n) return !1;
    const [s, i] = n.split(":"), o = Me.pbkdf2Sync(t, s, 1e3, 64, "sha512").toString("hex");
    return i === o;
  }
  async savePinHash(r) {
    const t = Me.randomBytes(16).toString("hex"), n = Me.pbkdf2Sync(r, t, 1e3, 64, "sha512").toString("hex");
    await ph(this.db, `${t}:${n}`);
  }
  async verifyPinHash(r) {
    const t = await hh(this.db);
    if (!t) return !1;
    const [n, s] = t.split(":"), i = Me.pbkdf2Sync(r, n, 1e3, 64, "sha512").toString("hex");
    return s === i;
  }
}
const Eh = "https://seal-app-wzqhf.ondigitalocean.app/api/v1";
class gh {
  constructor() {
    this.online = !1, this.checkInterval = null, this.isChecking = !1, this.consecutiveFailures = 0, this.consecutiveSuccesses = 0, this.listeners = [], this.startConnectivityCheck();
  }
  onStatusChange(r) {
    return this.listeners.push(r), () => {
      this.listeners = this.listeners.filter((t) => t !== r);
    };
  }
  getStatus() {
    return { online: this.online };
  }
  // Called by Frontend (navigator.onLine updates)
  setOnline(r) {
    r ? this.checkConnectivity() : (this.consecutiveSuccesses = 0, this.updateStatus(!1));
  }
  updateStatus(r) {
    r ? (this.consecutiveFailures = 0, this.consecutiveSuccesses++, this.online !== !0 && this.consecutiveSuccesses >= 1 && this.applyStatus(!0)) : (this.consecutiveSuccesses = 0, this.consecutiveFailures++, this.online !== !1 && this.consecutiveFailures >= 3 && this.applyStatus(!1));
  }
  applyStatus(r) {
    this.online = r, console.log(
      `[NetworkService] Status changed to: ${r ? "ONLINE" : "OFFLINE"}`
    );
    const t = st.getAllWindows()[0];
    t && !t.isDestroyed() && t.webContents.send("network:status", { online: this.online }), this.listeners.forEach((n) => n(this.online));
  }
  startConnectivityCheck() {
    this.checkConnectivity(), this.checkInterval = setInterval(() => {
      this.checkConnectivity();
    }, 1e4);
  }
  checkConnectivity() {
    if (this.isChecking) return;
    this.isChecking = !0;
    const r = pt.request({
      method: "HEAD",
      url: "https://www.google.com",
      redirect: "follow"
    });
    let t = !1;
    const n = setTimeout(() => {
      t = !0, r.abort(), this.isChecking = !1, this.online ? this.checkConnectivityBackup() : this.updateStatus(!1);
    }, 5e3);
    r.on("response", (s) => {
      clearTimeout(n), this.isChecking = !1, this.updateStatus(!0);
    }), r.on("error", () => {
      t || (clearTimeout(n), this.isChecking = !1, this.checkConnectivityBackup());
    }), r.end();
  }
  checkConnectivityBackup() {
    const r = pt.request({
      method: "HEAD",
      url: Eh,
      redirect: "follow"
    });
    let t = !1;
    const n = setTimeout(() => {
      t = !0, r.abort(), this.updateStatus(!1);
    }, 5e3);
    r.on("response", () => {
      clearTimeout(n), this.updateStatus(!0);
    }), r.on("error", () => {
      t || (clearTimeout(n), this.updateStatus(!1));
    }), r.end();
  }
}
const nr = "bountip", Xo = "239.192.0.1", Bo = 45454;
class Th {
  constructor(r) {
    this.tcpPort = 0, this.udpSocket = null, this.tcpServer = null, this.peers = /* @__PURE__ */ new Map(), this.listeners = [], this.deviceId = r;
  }
  onMessage(r) {
    return this.listeners.push(r), () => {
      this.listeners = this.listeners.filter((t) => t !== r);
    };
  }
  start() {
    this.startTcpServer((r) => {
      this.listeners.forEach((n) => n(r));
      const t = st.getAllWindows()[0];
      t && t.webContents.send("p2p:message", r);
    }), this.startUdpDiscovery();
  }
  startTcpServer(r) {
    this.tcpServer = Co.createServer((t) => {
      t.on("data", (n) => {
        try {
          const s = n.toString(), i = JSON.parse(s);
          i.app === nr && i.payload && r(i.payload);
        } catch {
        }
      });
    }), this.tcpServer.listen(0, () => {
      this.tcpPort = this.tcpServer.address().port;
    });
  }
  startUdpDiscovery() {
    this.udpSocket = Nf.createSocket({ type: "udp4", reuseAddr: !0 }), this.udpSocket.on("error", (r) => {
      if (r.code === "EADDRNOTAVAIL") {
        console.warn(
          "[P2PService] Multicast address not available. P2P discovery disabled."
        ), this.udpSocket?.close(), this.udpSocket = null;
        return;
      }
      console.error("[P2PService] UDP socket error:", r);
    }), this.udpSocket.on("message", (r, t) => {
      try {
        const n = JSON.parse(r.toString());
        n.app === nr && n.deviceId !== this.deviceId && (this.peers.has(n.deviceId) || this.peers.set(n.deviceId, {
          ip: t.address,
          port: n.tcpPort
        }));
      } catch {
      }
    }), this.udpSocket.bind(Bo, () => {
      try {
        this.udpSocket?.addMembership(Xo), this.udpSocket?.setMulticastLoopback(!0);
      } catch (r) {
        if (r.code === "EADDRNOTAVAIL") {
          console.warn(
            "[P2PService] addMembership failed with EADDRNOTAVAIL. P2P discovery disabled."
          ), this.udpSocket?.close(), this.udpSocket = null;
          return;
        }
        console.error(
          "[P2PService] Unexpected error during multicast setup:",
          r
        );
      }
    }), setInterval(() => {
      const r = JSON.stringify({
        app: nr,
        deviceId: this.deviceId,
        tcpPort: this.tcpPort
      });
      this.udpSocket?.send(r, Bo, Xo);
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
  async broadcast(r) {
    const t = Array.from(this.peers.values());
    for (const n of t)
      try {
        await this.sendToPeer(n, { app: nr, payload: r });
      } catch {
      }
  }
  async sendToPeerById(r, t) {
    const n = this.peers.get(r);
    if (n)
      try {
        await this.sendToPeer(n, { app: nr, payload: t });
      } catch (s) {
        console.error("sendToPeer error", s);
      }
  }
  sendToPeer(r, t) {
    return new Promise((n, s) => {
      const i = new Co.Socket();
      i.connect(r.port, r.ip, () => {
        i.write(JSON.stringify(t)), i.end(), n();
      }), i.on("error", s);
    });
  }
}
var xt = {}, Nn = {}, $r = {}, Ho;
function Ze() {
  return Ho || (Ho = 1, $r.fromCallback = function(e) {
    return Object.defineProperty(function(...r) {
      if (typeof r[r.length - 1] == "function") e.apply(this, r);
      else
        return new Promise((t, n) => {
          r.push((s, i) => s != null ? n(s) : t(i)), e.apply(this, r);
        });
    }, "name", { value: e.name });
  }, $r.fromPromise = function(e) {
    return Object.defineProperty(function(...r) {
      const t = r[r.length - 1];
      if (typeof t != "function") return e.apply(this, r);
      r.pop(), e.apply(this, r).then((n) => t(null, n), t);
    }, "name", { value: e.name });
  }), $r;
}
var _n, jo;
function yh() {
  if (jo) return _n;
  jo = 1;
  var e = _f, r = process.cwd, t = null, n = process.env.GRACEFUL_FS_PLATFORM || process.platform;
  process.cwd = function() {
    return t || (t = r.call(process)), t;
  };
  try {
    process.cwd();
  } catch {
  }
  if (typeof process.chdir == "function") {
    var s = process.chdir;
    process.chdir = function(o) {
      t = null, s.call(process, o);
    }, Object.setPrototypeOf && Object.setPrototypeOf(process.chdir, s);
  }
  _n = i;
  function i(o) {
    e.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./) && c(o), o.lutimes || a(o), o.chown = d(o.chown), o.fchown = d(o.fchown), o.lchown = d(o.lchown), o.chmod = u(o.chmod), o.fchmod = u(o.fchmod), o.lchmod = u(o.lchmod), o.chownSync = f(o.chownSync), o.fchownSync = f(o.fchownSync), o.lchownSync = f(o.lchownSync), o.chmodSync = l(o.chmodSync), o.fchmodSync = l(o.fchmodSync), o.lchmodSync = l(o.lchmodSync), o.stat = h(o.stat), o.fstat = h(o.fstat), o.lstat = h(o.lstat), o.statSync = E(o.statSync), o.fstatSync = E(o.fstatSync), o.lstatSync = E(o.lstatSync), o.chmod && !o.lchmod && (o.lchmod = function(m, v, N) {
      N && process.nextTick(N);
    }, o.lchmodSync = function() {
    }), o.chown && !o.lchown && (o.lchown = function(m, v, N, b) {
      b && process.nextTick(b);
    }, o.lchownSync = function() {
    }), n === "win32" && (o.rename = typeof o.rename != "function" ? o.rename : (function(m) {
      function v(N, b, D) {
        var M = Date.now(), _ = 0;
        m(N, b, function A(S) {
          if (S && (S.code === "EACCES" || S.code === "EPERM" || S.code === "EBUSY") && Date.now() - M < 6e4) {
            setTimeout(function() {
              o.stat(b, function(y, q) {
                y && y.code === "ENOENT" ? m(N, b, A) : D(S);
              });
            }, _), _ < 100 && (_ += 10);
            return;
          }
          D && D(S);
        });
      }
      return Object.setPrototypeOf && Object.setPrototypeOf(v, m), v;
    })(o.rename)), o.read = typeof o.read != "function" ? o.read : (function(m) {
      function v(N, b, D, M, _, A) {
        var S;
        if (A && typeof A == "function") {
          var y = 0;
          S = function(q, O, P) {
            if (q && q.code === "EAGAIN" && y < 10)
              return y++, m.call(o, N, b, D, M, _, S);
            A.apply(this, arguments);
          };
        }
        return m.call(o, N, b, D, M, _, S);
      }
      return Object.setPrototypeOf && Object.setPrototypeOf(v, m), v;
    })(o.read), o.readSync = typeof o.readSync != "function" ? o.readSync : /* @__PURE__ */ (function(m) {
      return function(v, N, b, D, M) {
        for (var _ = 0; ; )
          try {
            return m.call(o, v, N, b, D, M);
          } catch (A) {
            if (A.code === "EAGAIN" && _ < 10) {
              _++;
              continue;
            }
            throw A;
          }
      };
    })(o.readSync);
    function c(m) {
      m.lchmod = function(v, N, b) {
        m.open(
          v,
          e.O_WRONLY | e.O_SYMLINK,
          N,
          function(D, M) {
            if (D) {
              b && b(D);
              return;
            }
            m.fchmod(M, N, function(_) {
              m.close(M, function(A) {
                b && b(_ || A);
              });
            });
          }
        );
      }, m.lchmodSync = function(v, N) {
        var b = m.openSync(v, e.O_WRONLY | e.O_SYMLINK, N), D = !0, M;
        try {
          M = m.fchmodSync(b, N), D = !1;
        } finally {
          if (D)
            try {
              m.closeSync(b);
            } catch {
            }
          else
            m.closeSync(b);
        }
        return M;
      };
    }
    function a(m) {
      e.hasOwnProperty("O_SYMLINK") && m.futimes ? (m.lutimes = function(v, N, b, D) {
        m.open(v, e.O_SYMLINK, function(M, _) {
          if (M) {
            D && D(M);
            return;
          }
          m.futimes(_, N, b, function(A) {
            m.close(_, function(S) {
              D && D(A || S);
            });
          });
        });
      }, m.lutimesSync = function(v, N, b) {
        var D = m.openSync(v, e.O_SYMLINK), M, _ = !0;
        try {
          M = m.futimesSync(D, N, b), _ = !1;
        } finally {
          if (_)
            try {
              m.closeSync(D);
            } catch {
            }
          else
            m.closeSync(D);
        }
        return M;
      }) : m.futimes && (m.lutimes = function(v, N, b, D) {
        D && process.nextTick(D);
      }, m.lutimesSync = function() {
      });
    }
    function u(m) {
      return m && function(v, N, b) {
        return m.call(o, v, N, function(D) {
          g(D) && (D = null), b && b.apply(this, arguments);
        });
      };
    }
    function l(m) {
      return m && function(v, N) {
        try {
          return m.call(o, v, N);
        } catch (b) {
          if (!g(b)) throw b;
        }
      };
    }
    function d(m) {
      return m && function(v, N, b, D) {
        return m.call(o, v, N, b, function(M) {
          g(M) && (M = null), D && D.apply(this, arguments);
        });
      };
    }
    function f(m) {
      return m && function(v, N, b) {
        try {
          return m.call(o, v, N, b);
        } catch (D) {
          if (!g(D)) throw D;
        }
      };
    }
    function h(m) {
      return m && function(v, N, b) {
        typeof N == "function" && (b = N, N = null);
        function D(M, _) {
          _ && (_.uid < 0 && (_.uid += 4294967296), _.gid < 0 && (_.gid += 4294967296)), b && b.apply(this, arguments);
        }
        return N ? m.call(o, v, N, D) : m.call(o, v, D);
      };
    }
    function E(m) {
      return m && function(v, N) {
        var b = N ? m.call(o, v, N) : m.call(o, v);
        return b && (b.uid < 0 && (b.uid += 4294967296), b.gid < 0 && (b.gid += 4294967296)), b;
      };
    }
    function g(m) {
      if (!m || m.code === "ENOSYS")
        return !0;
      var v = !process.getuid || process.getuid() !== 0;
      return !!(v && (m.code === "EINVAL" || m.code === "EPERM"));
    }
  }
  return _n;
}
var wn, Go;
function vh() {
  if (Go) return wn;
  Go = 1;
  var e = Or.Stream;
  wn = r;
  function r(t) {
    return {
      ReadStream: n,
      WriteStream: s
    };
    function n(i, o) {
      if (!(this instanceof n)) return new n(i, o);
      e.call(this);
      var c = this;
      this.path = i, this.fd = null, this.readable = !0, this.paused = !1, this.flags = "r", this.mode = 438, this.bufferSize = 64 * 1024, o = o || {};
      for (var a = Object.keys(o), u = 0, l = a.length; u < l; u++) {
        var d = a[u];
        this[d] = o[d];
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
          c._read();
        });
        return;
      }
      t.open(this.path, this.flags, this.mode, function(f, h) {
        if (f) {
          c.emit("error", f), c.readable = !1;
          return;
        }
        c.fd = h, c.emit("open", h), c._read();
      });
    }
    function s(i, o) {
      if (!(this instanceof s)) return new s(i, o);
      e.call(this), this.path = i, this.fd = null, this.writable = !0, this.flags = "w", this.encoding = "binary", this.mode = 438, this.bytesWritten = 0, o = o || {};
      for (var c = Object.keys(o), a = 0, u = c.length; a < u; a++) {
        var l = c[a];
        this[l] = o[l];
      }
      if (this.start !== void 0) {
        if (typeof this.start != "number")
          throw TypeError("start must be a Number");
        if (this.start < 0)
          throw new Error("start must be >= zero");
        this.pos = this.start;
      }
      this.busy = !1, this._queue = [], this.fd === null && (this._open = t.open, this._queue.push([this._open, this.path, this.flags, this.mode, void 0]), this.flush());
    }
  }
  return wn;
}
var Rn, Vo;
function Ah() {
  if (Vo) return Rn;
  Vo = 1, Rn = r;
  var e = Object.getPrototypeOf || function(t) {
    return t.__proto__;
  };
  function r(t) {
    if (t === null || typeof t != "object")
      return t;
    if (t instanceof Object)
      var n = { __proto__: e(t) };
    else
      var n = /* @__PURE__ */ Object.create(null);
    return Object.getOwnPropertyNames(t).forEach(function(s) {
      Object.defineProperty(n, s, Object.getOwnPropertyDescriptor(t, s));
    }), n;
  }
  return Rn;
}
var Xr, Wo;
function Je() {
  if (Wo) return Xr;
  Wo = 1;
  var e = be, r = yh(), t = vh(), n = Ah(), s = rn, i, o;
  typeof Symbol == "function" && typeof Symbol.for == "function" ? (i = /* @__PURE__ */ Symbol.for("graceful-fs.queue"), o = /* @__PURE__ */ Symbol.for("graceful-fs.previous")) : (i = "___graceful-fs.queue", o = "___graceful-fs.previous");
  function c() {
  }
  function a(m, v) {
    Object.defineProperty(m, i, {
      get: function() {
        return v;
      }
    });
  }
  var u = c;
  if (s.debuglog ? u = s.debuglog("gfs4") : /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && (u = function() {
    var m = s.format.apply(s, arguments);
    m = "GFS4: " + m.split(/\n/).join(`
GFS4: `), console.error(m);
  }), !e[i]) {
    var l = ot[i] || [];
    a(e, l), e.close = (function(m) {
      function v(N, b) {
        return m.call(e, N, function(D) {
          D || E(), typeof b == "function" && b.apply(this, arguments);
        });
      }
      return Object.defineProperty(v, o, {
        value: m
      }), v;
    })(e.close), e.closeSync = (function(m) {
      function v(N) {
        m.apply(e, arguments), E();
      }
      return Object.defineProperty(v, o, {
        value: m
      }), v;
    })(e.closeSync), /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && process.on("exit", function() {
      u(e[i]), Au.equal(e[i].length, 0);
    });
  }
  ot[i] || a(ot, e[i]), Xr = d(n(e)), process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !e.__patched && (Xr = d(e), e.__patched = !0);
  function d(m) {
    r(m), m.gracefulify = d, m.createReadStream = ae, m.createWriteStream = se;
    var v = m.readFile;
    m.readFile = N;
    function N(Q, ve, I) {
      return typeof ve == "function" && (I = ve, ve = null), T(Q, ve, I);
      function T(H, U, de, me) {
        return v(H, U, function(Ee) {
          Ee && (Ee.code === "EMFILE" || Ee.code === "ENFILE") ? f([T, [H, U, de], Ee, me || Date.now(), Date.now()]) : typeof de == "function" && de.apply(this, arguments);
        });
      }
    }
    var b = m.writeFile;
    m.writeFile = D;
    function D(Q, ve, I, T) {
      return typeof I == "function" && (T = I, I = null), H(Q, ve, I, T);
      function H(U, de, me, Ee, Ne) {
        return b(U, de, me, function(Ae) {
          Ae && (Ae.code === "EMFILE" || Ae.code === "ENFILE") ? f([H, [U, de, me, Ee], Ae, Ne || Date.now(), Date.now()]) : typeof Ee == "function" && Ee.apply(this, arguments);
        });
      }
    }
    var M = m.appendFile;
    M && (m.appendFile = _);
    function _(Q, ve, I, T) {
      return typeof I == "function" && (T = I, I = null), H(Q, ve, I, T);
      function H(U, de, me, Ee, Ne) {
        return M(U, de, me, function(Ae) {
          Ae && (Ae.code === "EMFILE" || Ae.code === "ENFILE") ? f([H, [U, de, me, Ee], Ae, Ne || Date.now(), Date.now()]) : typeof Ee == "function" && Ee.apply(this, arguments);
        });
      }
    }
    var A = m.copyFile;
    A && (m.copyFile = S);
    function S(Q, ve, I, T) {
      return typeof I == "function" && (T = I, I = 0), H(Q, ve, I, T);
      function H(U, de, me, Ee, Ne) {
        return A(U, de, me, function(Ae) {
          Ae && (Ae.code === "EMFILE" || Ae.code === "ENFILE") ? f([H, [U, de, me, Ee], Ae, Ne || Date.now(), Date.now()]) : typeof Ee == "function" && Ee.apply(this, arguments);
        });
      }
    }
    var y = m.readdir;
    m.readdir = O;
    var q = /^v[0-5]\./;
    function O(Q, ve, I) {
      typeof ve == "function" && (I = ve, ve = null);
      var T = q.test(process.version) ? function(de, me, Ee, Ne) {
        return y(de, H(
          de,
          me,
          Ee,
          Ne
        ));
      } : function(de, me, Ee, Ne) {
        return y(de, me, H(
          de,
          me,
          Ee,
          Ne
        ));
      };
      return T(Q, ve, I);
      function H(U, de, me, Ee) {
        return function(Ne, Ae) {
          Ne && (Ne.code === "EMFILE" || Ne.code === "ENFILE") ? f([
            T,
            [U, de, me],
            Ne,
            Ee || Date.now(),
            Date.now()
          ]) : (Ae && Ae.sort && Ae.sort(), typeof me == "function" && me.call(this, Ne, Ae));
        };
      }
    }
    if (process.version.substr(0, 4) === "v0.8") {
      var P = t(m);
      L = P.ReadStream, G = P.WriteStream;
    }
    var k = m.ReadStream;
    k && (L.prototype = Object.create(k.prototype), L.prototype.open = j);
    var C = m.WriteStream;
    C && (G.prototype = Object.create(C.prototype), G.prototype.open = re), Object.defineProperty(m, "ReadStream", {
      get: function() {
        return L;
      },
      set: function(Q) {
        L = Q;
      },
      enumerable: !0,
      configurable: !0
    }), Object.defineProperty(m, "WriteStream", {
      get: function() {
        return G;
      },
      set: function(Q) {
        G = Q;
      },
      enumerable: !0,
      configurable: !0
    });
    var x = L;
    Object.defineProperty(m, "FileReadStream", {
      get: function() {
        return x;
      },
      set: function(Q) {
        x = Q;
      },
      enumerable: !0,
      configurable: !0
    });
    var $ = G;
    Object.defineProperty(m, "FileWriteStream", {
      get: function() {
        return $;
      },
      set: function(Q) {
        $ = Q;
      },
      enumerable: !0,
      configurable: !0
    });
    function L(Q, ve) {
      return this instanceof L ? (k.apply(this, arguments), this) : L.apply(Object.create(L.prototype), arguments);
    }
    function j() {
      var Q = this;
      Te(Q.path, Q.flags, Q.mode, function(ve, I) {
        ve ? (Q.autoClose && Q.destroy(), Q.emit("error", ve)) : (Q.fd = I, Q.emit("open", I), Q.read());
      });
    }
    function G(Q, ve) {
      return this instanceof G ? (C.apply(this, arguments), this) : G.apply(Object.create(G.prototype), arguments);
    }
    function re() {
      var Q = this;
      Te(Q.path, Q.flags, Q.mode, function(ve, I) {
        ve ? (Q.destroy(), Q.emit("error", ve)) : (Q.fd = I, Q.emit("open", I));
      });
    }
    function ae(Q, ve) {
      return new m.ReadStream(Q, ve);
    }
    function se(Q, ve) {
      return new m.WriteStream(Q, ve);
    }
    var pe = m.open;
    m.open = Te;
    function Te(Q, ve, I, T) {
      return typeof I == "function" && (T = I, I = null), H(Q, ve, I, T);
      function H(U, de, me, Ee, Ne) {
        return pe(U, de, me, function(Ae, ze) {
          Ae && (Ae.code === "EMFILE" || Ae.code === "ENFILE") ? f([H, [U, de, me, Ee], Ae, Ne || Date.now(), Date.now()]) : typeof Ee == "function" && Ee.apply(this, arguments);
        });
      }
    }
    return m;
  }
  function f(m) {
    u("ENQUEUE", m[0].name, m[1]), e[i].push(m), g();
  }
  var h;
  function E() {
    for (var m = Date.now(), v = 0; v < e[i].length; ++v)
      e[i][v].length > 2 && (e[i][v][3] = m, e[i][v][4] = m);
    g();
  }
  function g() {
    if (clearTimeout(h), h = void 0, e[i].length !== 0) {
      var m = e[i].shift(), v = m[0], N = m[1], b = m[2], D = m[3], M = m[4];
      if (D === void 0)
        u("RETRY", v.name, N), v.apply(null, N);
      else if (Date.now() - D >= 6e4) {
        u("TIMEOUT", v.name, N);
        var _ = N.pop();
        typeof _ == "function" && _.call(null, b);
      } else {
        var A = Date.now() - M, S = Math.max(M - D, 1), y = Math.min(S * 1.2, 100);
        A >= y ? (u("RETRY", v.name, N), v.apply(null, N.concat([D]))) : e[i].push(m);
      }
      h === void 0 && (h = setTimeout(g, 0));
    }
  }
  return Xr;
}
var Yo;
function Kt() {
  return Yo || (Yo = 1, (function(e) {
    const r = Ze().fromCallback, t = Je(), n = [
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
    ].filter((s) => typeof t[s] == "function");
    Object.assign(e, t), n.forEach((s) => {
      e[s] = r(t[s]);
    }), e.exists = function(s, i) {
      return typeof i == "function" ? t.exists(s, i) : new Promise((o) => t.exists(s, o));
    }, e.read = function(s, i, o, c, a, u) {
      return typeof u == "function" ? t.read(s, i, o, c, a, u) : new Promise((l, d) => {
        t.read(s, i, o, c, a, (f, h, E) => {
          if (f) return d(f);
          l({ bytesRead: h, buffer: E });
        });
      });
    }, e.write = function(s, i, ...o) {
      return typeof o[o.length - 1] == "function" ? t.write(s, i, ...o) : new Promise((c, a) => {
        t.write(s, i, ...o, (u, l, d) => {
          if (u) return a(u);
          c({ bytesWritten: l, buffer: d });
        });
      });
    }, typeof t.writev == "function" && (e.writev = function(s, i, ...o) {
      return typeof o[o.length - 1] == "function" ? t.writev(s, i, ...o) : new Promise((c, a) => {
        t.writev(s, i, ...o, (u, l, d) => {
          if (u) return a(u);
          c({ bytesWritten: l, buffers: d });
        });
      });
    }), typeof t.realpath.native == "function" ? e.realpath.native = r(t.realpath.native) : process.emitWarning(
      "fs.realpath.native is not a function. Is fs being monkey-patched?",
      "Warning",
      "fs-extra-WARN0003"
    );
  })(Nn)), Nn;
}
var Br = {}, On = {}, zo;
function Ih() {
  if (zo) return On;
  zo = 1;
  const e = ye;
  return On.checkPath = function(t) {
    if (process.platform === "win32" && /[<>:"|?*]/.test(t.replace(e.parse(t).root, ""))) {
      const s = new Error(`Path contains invalid characters: ${t}`);
      throw s.code = "EINVAL", s;
    }
  }, On;
}
var Jo;
function Sh() {
  if (Jo) return Br;
  Jo = 1;
  const e = /* @__PURE__ */ Kt(), { checkPath: r } = /* @__PURE__ */ Ih(), t = (n) => {
    const s = { mode: 511 };
    return typeof n == "number" ? n : { ...s, ...n }.mode;
  };
  return Br.makeDir = async (n, s) => (r(n), e.mkdir(n, {
    mode: t(s),
    recursive: !0
  })), Br.makeDirSync = (n, s) => (r(n), e.mkdirSync(n, {
    mode: t(s),
    recursive: !0
  })), Br;
}
var bn, Ko;
function ht() {
  if (Ko) return bn;
  Ko = 1;
  const e = Ze().fromPromise, { makeDir: r, makeDirSync: t } = /* @__PURE__ */ Sh(), n = e(r);
  return bn = {
    mkdirs: n,
    mkdirsSync: t,
    // alias
    mkdirp: n,
    mkdirpSync: t,
    ensureDir: n,
    ensureDirSync: t
  }, bn;
}
var Ln, Qo;
function qt() {
  if (Qo) return Ln;
  Qo = 1;
  const e = Ze().fromPromise, r = /* @__PURE__ */ Kt();
  function t(n) {
    return r.access(n).then(() => !0).catch(() => !1);
  }
  return Ln = {
    pathExists: e(t),
    pathExistsSync: r.existsSync
  }, Ln;
}
var Cn, Zo;
function qu() {
  if (Zo) return Cn;
  Zo = 1;
  const e = Je();
  function r(n, s, i, o) {
    e.open(n, "r+", (c, a) => {
      if (c) return o(c);
      e.futimes(a, s, i, (u) => {
        e.close(a, (l) => {
          o && o(u || l);
        });
      });
    });
  }
  function t(n, s, i) {
    const o = e.openSync(n, "r+");
    return e.futimesSync(o, s, i), e.closeSync(o);
  }
  return Cn = {
    utimesMillis: r,
    utimesMillisSync: t
  }, Cn;
}
var Dn, ea;
function Qt() {
  if (ea) return Dn;
  ea = 1;
  const e = /* @__PURE__ */ Kt(), r = ye, t = rn;
  function n(f, h, E) {
    const g = E.dereference ? (m) => e.stat(m, { bigint: !0 }) : (m) => e.lstat(m, { bigint: !0 });
    return Promise.all([
      g(f),
      g(h).catch((m) => {
        if (m.code === "ENOENT") return null;
        throw m;
      })
    ]).then(([m, v]) => ({ srcStat: m, destStat: v }));
  }
  function s(f, h, E) {
    let g;
    const m = E.dereference ? (N) => e.statSync(N, { bigint: !0 }) : (N) => e.lstatSync(N, { bigint: !0 }), v = m(f);
    try {
      g = m(h);
    } catch (N) {
      if (N.code === "ENOENT") return { srcStat: v, destStat: null };
      throw N;
    }
    return { srcStat: v, destStat: g };
  }
  function i(f, h, E, g, m) {
    t.callbackify(n)(f, h, g, (v, N) => {
      if (v) return m(v);
      const { srcStat: b, destStat: D } = N;
      if (D) {
        if (u(b, D)) {
          const M = r.basename(f), _ = r.basename(h);
          return E === "move" && M !== _ && M.toLowerCase() === _.toLowerCase() ? m(null, { srcStat: b, destStat: D, isChangingCase: !0 }) : m(new Error("Source and destination must not be the same."));
        }
        if (b.isDirectory() && !D.isDirectory())
          return m(new Error(`Cannot overwrite non-directory '${h}' with directory '${f}'.`));
        if (!b.isDirectory() && D.isDirectory())
          return m(new Error(`Cannot overwrite directory '${h}' with non-directory '${f}'.`));
      }
      return b.isDirectory() && l(f, h) ? m(new Error(d(f, h, E))) : m(null, { srcStat: b, destStat: D });
    });
  }
  function o(f, h, E, g) {
    const { srcStat: m, destStat: v } = s(f, h, g);
    if (v) {
      if (u(m, v)) {
        const N = r.basename(f), b = r.basename(h);
        if (E === "move" && N !== b && N.toLowerCase() === b.toLowerCase())
          return { srcStat: m, destStat: v, isChangingCase: !0 };
        throw new Error("Source and destination must not be the same.");
      }
      if (m.isDirectory() && !v.isDirectory())
        throw new Error(`Cannot overwrite non-directory '${h}' with directory '${f}'.`);
      if (!m.isDirectory() && v.isDirectory())
        throw new Error(`Cannot overwrite directory '${h}' with non-directory '${f}'.`);
    }
    if (m.isDirectory() && l(f, h))
      throw new Error(d(f, h, E));
    return { srcStat: m, destStat: v };
  }
  function c(f, h, E, g, m) {
    const v = r.resolve(r.dirname(f)), N = r.resolve(r.dirname(E));
    if (N === v || N === r.parse(N).root) return m();
    e.stat(N, { bigint: !0 }, (b, D) => b ? b.code === "ENOENT" ? m() : m(b) : u(h, D) ? m(new Error(d(f, E, g))) : c(f, h, N, g, m));
  }
  function a(f, h, E, g) {
    const m = r.resolve(r.dirname(f)), v = r.resolve(r.dirname(E));
    if (v === m || v === r.parse(v).root) return;
    let N;
    try {
      N = e.statSync(v, { bigint: !0 });
    } catch (b) {
      if (b.code === "ENOENT") return;
      throw b;
    }
    if (u(h, N))
      throw new Error(d(f, E, g));
    return a(f, h, v, g);
  }
  function u(f, h) {
    return h.ino && h.dev && h.ino === f.ino && h.dev === f.dev;
  }
  function l(f, h) {
    const E = r.resolve(f).split(r.sep).filter((m) => m), g = r.resolve(h).split(r.sep).filter((m) => m);
    return E.reduce((m, v, N) => m && g[N] === v, !0);
  }
  function d(f, h, E) {
    return `Cannot ${E} '${f}' to a subdirectory of itself, '${h}'.`;
  }
  return Dn = {
    checkPaths: i,
    checkPathsSync: o,
    checkParentPaths: c,
    checkParentPathsSync: a,
    isSrcSubdir: l,
    areIdentical: u
  }, Dn;
}
var xn, ta;
function Nh() {
  if (ta) return xn;
  ta = 1;
  const e = Je(), r = ye, t = ht().mkdirs, n = qt().pathExists, s = qu().utimesMillis, i = /* @__PURE__ */ Qt();
  function o(O, P, k, C) {
    typeof k == "function" && !C ? (C = k, k = {}) : typeof k == "function" && (k = { filter: k }), C = C || function() {
    }, k = k || {}, k.clobber = "clobber" in k ? !!k.clobber : !0, k.overwrite = "overwrite" in k ? !!k.overwrite : k.clobber, k.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
      `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
      "Warning",
      "fs-extra-WARN0001"
    ), i.checkPaths(O, P, "copy", k, (x, $) => {
      if (x) return C(x);
      const { srcStat: L, destStat: j } = $;
      i.checkParentPaths(O, L, P, "copy", (G) => G ? C(G) : k.filter ? a(c, j, O, P, k, C) : c(j, O, P, k, C));
    });
  }
  function c(O, P, k, C, x) {
    const $ = r.dirname(k);
    n($, (L, j) => {
      if (L) return x(L);
      if (j) return l(O, P, k, C, x);
      t($, (G) => G ? x(G) : l(O, P, k, C, x));
    });
  }
  function a(O, P, k, C, x, $) {
    Promise.resolve(x.filter(k, C)).then((L) => L ? O(P, k, C, x, $) : $(), (L) => $(L));
  }
  function u(O, P, k, C, x) {
    return C.filter ? a(l, O, P, k, C, x) : l(O, P, k, C, x);
  }
  function l(O, P, k, C, x) {
    (C.dereference ? e.stat : e.lstat)(P, (L, j) => L ? x(L) : j.isDirectory() ? D(j, O, P, k, C, x) : j.isFile() || j.isCharacterDevice() || j.isBlockDevice() ? d(j, O, P, k, C, x) : j.isSymbolicLink() ? y(O, P, k, C, x) : j.isSocket() ? x(new Error(`Cannot copy a socket file: ${P}`)) : j.isFIFO() ? x(new Error(`Cannot copy a FIFO pipe: ${P}`)) : x(new Error(`Unknown file: ${P}`)));
  }
  function d(O, P, k, C, x, $) {
    return P ? f(O, k, C, x, $) : h(O, k, C, x, $);
  }
  function f(O, P, k, C, x) {
    if (C.overwrite)
      e.unlink(k, ($) => $ ? x($) : h(O, P, k, C, x));
    else return C.errorOnExist ? x(new Error(`'${k}' already exists`)) : x();
  }
  function h(O, P, k, C, x) {
    e.copyFile(P, k, ($) => $ ? x($) : C.preserveTimestamps ? E(O.mode, P, k, x) : N(k, O.mode, x));
  }
  function E(O, P, k, C) {
    return g(O) ? m(k, O, (x) => x ? C(x) : v(O, P, k, C)) : v(O, P, k, C);
  }
  function g(O) {
    return (O & 128) === 0;
  }
  function m(O, P, k) {
    return N(O, P | 128, k);
  }
  function v(O, P, k, C) {
    b(P, k, (x) => x ? C(x) : N(k, O, C));
  }
  function N(O, P, k) {
    return e.chmod(O, P, k);
  }
  function b(O, P, k) {
    e.stat(O, (C, x) => C ? k(C) : s(P, x.atime, x.mtime, k));
  }
  function D(O, P, k, C, x, $) {
    return P ? _(k, C, x, $) : M(O.mode, k, C, x, $);
  }
  function M(O, P, k, C, x) {
    e.mkdir(k, ($) => {
      if ($) return x($);
      _(P, k, C, (L) => L ? x(L) : N(k, O, x));
    });
  }
  function _(O, P, k, C) {
    e.readdir(O, (x, $) => x ? C(x) : A($, O, P, k, C));
  }
  function A(O, P, k, C, x) {
    const $ = O.pop();
    return $ ? S(O, $, P, k, C, x) : x();
  }
  function S(O, P, k, C, x, $) {
    const L = r.join(k, P), j = r.join(C, P);
    i.checkPaths(L, j, "copy", x, (G, re) => {
      if (G) return $(G);
      const { destStat: ae } = re;
      u(ae, L, j, x, (se) => se ? $(se) : A(O, k, C, x, $));
    });
  }
  function y(O, P, k, C, x) {
    e.readlink(P, ($, L) => {
      if ($) return x($);
      if (C.dereference && (L = r.resolve(process.cwd(), L)), O)
        e.readlink(k, (j, G) => j ? j.code === "EINVAL" || j.code === "UNKNOWN" ? e.symlink(L, k, x) : x(j) : (C.dereference && (G = r.resolve(process.cwd(), G)), i.isSrcSubdir(L, G) ? x(new Error(`Cannot copy '${L}' to a subdirectory of itself, '${G}'.`)) : O.isDirectory() && i.isSrcSubdir(G, L) ? x(new Error(`Cannot overwrite '${G}' with '${L}'.`)) : q(L, k, x)));
      else
        return e.symlink(L, k, x);
    });
  }
  function q(O, P, k) {
    e.unlink(P, (C) => C ? k(C) : e.symlink(O, P, k));
  }
  return xn = o, xn;
}
var Pn, ra;
function _h() {
  if (ra) return Pn;
  ra = 1;
  const e = Je(), r = ye, t = ht().mkdirsSync, n = qu().utimesMillisSync, s = /* @__PURE__ */ Qt();
  function i(A, S, y) {
    typeof y == "function" && (y = { filter: y }), y = y || {}, y.clobber = "clobber" in y ? !!y.clobber : !0, y.overwrite = "overwrite" in y ? !!y.overwrite : y.clobber, y.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
      `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
      "Warning",
      "fs-extra-WARN0002"
    );
    const { srcStat: q, destStat: O } = s.checkPathsSync(A, S, "copy", y);
    return s.checkParentPathsSync(A, q, S, "copy"), o(O, A, S, y);
  }
  function o(A, S, y, q) {
    if (q.filter && !q.filter(S, y)) return;
    const O = r.dirname(y);
    return e.existsSync(O) || t(O), a(A, S, y, q);
  }
  function c(A, S, y, q) {
    if (!(q.filter && !q.filter(S, y)))
      return a(A, S, y, q);
  }
  function a(A, S, y, q) {
    const P = (q.dereference ? e.statSync : e.lstatSync)(S);
    if (P.isDirectory()) return v(P, A, S, y, q);
    if (P.isFile() || P.isCharacterDevice() || P.isBlockDevice()) return u(P, A, S, y, q);
    if (P.isSymbolicLink()) return M(A, S, y, q);
    throw P.isSocket() ? new Error(`Cannot copy a socket file: ${S}`) : P.isFIFO() ? new Error(`Cannot copy a FIFO pipe: ${S}`) : new Error(`Unknown file: ${S}`);
  }
  function u(A, S, y, q, O) {
    return S ? l(A, y, q, O) : d(A, y, q, O);
  }
  function l(A, S, y, q) {
    if (q.overwrite)
      return e.unlinkSync(y), d(A, S, y, q);
    if (q.errorOnExist)
      throw new Error(`'${y}' already exists`);
  }
  function d(A, S, y, q) {
    return e.copyFileSync(S, y), q.preserveTimestamps && f(A.mode, S, y), g(y, A.mode);
  }
  function f(A, S, y) {
    return h(A) && E(y, A), m(S, y);
  }
  function h(A) {
    return (A & 128) === 0;
  }
  function E(A, S) {
    return g(A, S | 128);
  }
  function g(A, S) {
    return e.chmodSync(A, S);
  }
  function m(A, S) {
    const y = e.statSync(A);
    return n(S, y.atime, y.mtime);
  }
  function v(A, S, y, q, O) {
    return S ? b(y, q, O) : N(A.mode, y, q, O);
  }
  function N(A, S, y, q) {
    return e.mkdirSync(y), b(S, y, q), g(y, A);
  }
  function b(A, S, y) {
    e.readdirSync(A).forEach((q) => D(q, A, S, y));
  }
  function D(A, S, y, q) {
    const O = r.join(S, A), P = r.join(y, A), { destStat: k } = s.checkPathsSync(O, P, "copy", q);
    return c(k, O, P, q);
  }
  function M(A, S, y, q) {
    let O = e.readlinkSync(S);
    if (q.dereference && (O = r.resolve(process.cwd(), O)), A) {
      let P;
      try {
        P = e.readlinkSync(y);
      } catch (k) {
        if (k.code === "EINVAL" || k.code === "UNKNOWN") return e.symlinkSync(O, y);
        throw k;
      }
      if (q.dereference && (P = r.resolve(process.cwd(), P)), s.isSrcSubdir(O, P))
        throw new Error(`Cannot copy '${O}' to a subdirectory of itself, '${P}'.`);
      if (e.statSync(y).isDirectory() && s.isSrcSubdir(P, O))
        throw new Error(`Cannot overwrite '${P}' with '${O}'.`);
      return _(O, y);
    } else
      return e.symlinkSync(O, y);
  }
  function _(A, S) {
    return e.unlinkSync(S), e.symlinkSync(A, S);
  }
  return Pn = i, Pn;
}
var Un, na;
function ro() {
  if (na) return Un;
  na = 1;
  const e = Ze().fromCallback;
  return Un = {
    copy: e(/* @__PURE__ */ Nh()),
    copySync: /* @__PURE__ */ _h()
  }, Un;
}
var Fn, ia;
function wh() {
  if (ia) return Fn;
  ia = 1;
  const e = Je(), r = ye, t = Au, n = process.platform === "win32";
  function s(E) {
    [
      "unlink",
      "chmod",
      "stat",
      "lstat",
      "rmdir",
      "readdir"
    ].forEach((m) => {
      E[m] = E[m] || e[m], m = m + "Sync", E[m] = E[m] || e[m];
    }), E.maxBusyTries = E.maxBusyTries || 3;
  }
  function i(E, g, m) {
    let v = 0;
    typeof g == "function" && (m = g, g = {}), t(E, "rimraf: missing path"), t.strictEqual(typeof E, "string", "rimraf: path should be a string"), t.strictEqual(typeof m, "function", "rimraf: callback function required"), t(g, "rimraf: invalid options argument provided"), t.strictEqual(typeof g, "object", "rimraf: options should be object"), s(g), o(E, g, function N(b) {
      if (b) {
        if ((b.code === "EBUSY" || b.code === "ENOTEMPTY" || b.code === "EPERM") && v < g.maxBusyTries) {
          v++;
          const D = v * 100;
          return setTimeout(() => o(E, g, N), D);
        }
        b.code === "ENOENT" && (b = null);
      }
      m(b);
    });
  }
  function o(E, g, m) {
    t(E), t(g), t(typeof m == "function"), g.lstat(E, (v, N) => {
      if (v && v.code === "ENOENT")
        return m(null);
      if (v && v.code === "EPERM" && n)
        return c(E, g, v, m);
      if (N && N.isDirectory())
        return u(E, g, v, m);
      g.unlink(E, (b) => {
        if (b) {
          if (b.code === "ENOENT")
            return m(null);
          if (b.code === "EPERM")
            return n ? c(E, g, b, m) : u(E, g, b, m);
          if (b.code === "EISDIR")
            return u(E, g, b, m);
        }
        return m(b);
      });
    });
  }
  function c(E, g, m, v) {
    t(E), t(g), t(typeof v == "function"), g.chmod(E, 438, (N) => {
      N ? v(N.code === "ENOENT" ? null : m) : g.stat(E, (b, D) => {
        b ? v(b.code === "ENOENT" ? null : m) : D.isDirectory() ? u(E, g, m, v) : g.unlink(E, v);
      });
    });
  }
  function a(E, g, m) {
    let v;
    t(E), t(g);
    try {
      g.chmodSync(E, 438);
    } catch (N) {
      if (N.code === "ENOENT")
        return;
      throw m;
    }
    try {
      v = g.statSync(E);
    } catch (N) {
      if (N.code === "ENOENT")
        return;
      throw m;
    }
    v.isDirectory() ? f(E, g, m) : g.unlinkSync(E);
  }
  function u(E, g, m, v) {
    t(E), t(g), t(typeof v == "function"), g.rmdir(E, (N) => {
      N && (N.code === "ENOTEMPTY" || N.code === "EEXIST" || N.code === "EPERM") ? l(E, g, v) : N && N.code === "ENOTDIR" ? v(m) : v(N);
    });
  }
  function l(E, g, m) {
    t(E), t(g), t(typeof m == "function"), g.readdir(E, (v, N) => {
      if (v) return m(v);
      let b = N.length, D;
      if (b === 0) return g.rmdir(E, m);
      N.forEach((M) => {
        i(r.join(E, M), g, (_) => {
          if (!D) {
            if (_) return m(D = _);
            --b === 0 && g.rmdir(E, m);
          }
        });
      });
    });
  }
  function d(E, g) {
    let m;
    g = g || {}, s(g), t(E, "rimraf: missing path"), t.strictEqual(typeof E, "string", "rimraf: path should be a string"), t(g, "rimraf: missing options"), t.strictEqual(typeof g, "object", "rimraf: options should be object");
    try {
      m = g.lstatSync(E);
    } catch (v) {
      if (v.code === "ENOENT")
        return;
      v.code === "EPERM" && n && a(E, g, v);
    }
    try {
      m && m.isDirectory() ? f(E, g, null) : g.unlinkSync(E);
    } catch (v) {
      if (v.code === "ENOENT")
        return;
      if (v.code === "EPERM")
        return n ? a(E, g, v) : f(E, g, v);
      if (v.code !== "EISDIR")
        throw v;
      f(E, g, v);
    }
  }
  function f(E, g, m) {
    t(E), t(g);
    try {
      g.rmdirSync(E);
    } catch (v) {
      if (v.code === "ENOTDIR")
        throw m;
      if (v.code === "ENOTEMPTY" || v.code === "EEXIST" || v.code === "EPERM")
        h(E, g);
      else if (v.code !== "ENOENT")
        throw v;
    }
  }
  function h(E, g) {
    if (t(E), t(g), g.readdirSync(E).forEach((m) => d(r.join(E, m), g)), n) {
      const m = Date.now();
      do
        try {
          return g.rmdirSync(E, g);
        } catch {
        }
      while (Date.now() - m < 500);
    } else
      return g.rmdirSync(E, g);
  }
  return Fn = i, i.sync = d, Fn;
}
var kn, sa;
function sn() {
  if (sa) return kn;
  sa = 1;
  const e = Je(), r = Ze().fromCallback, t = /* @__PURE__ */ wh();
  function n(i, o) {
    if (e.rm) return e.rm(i, { recursive: !0, force: !0 }, o);
    t(i, o);
  }
  function s(i) {
    if (e.rmSync) return e.rmSync(i, { recursive: !0, force: !0 });
    t.sync(i);
  }
  return kn = {
    remove: r(n),
    removeSync: s
  }, kn;
}
var Mn, oa;
function Rh() {
  if (oa) return Mn;
  oa = 1;
  const e = Ze().fromPromise, r = /* @__PURE__ */ Kt(), t = ye, n = /* @__PURE__ */ ht(), s = /* @__PURE__ */ sn(), i = e(async function(a) {
    let u;
    try {
      u = await r.readdir(a);
    } catch {
      return n.mkdirs(a);
    }
    return Promise.all(u.map((l) => s.remove(t.join(a, l))));
  });
  function o(c) {
    let a;
    try {
      a = r.readdirSync(c);
    } catch {
      return n.mkdirsSync(c);
    }
    a.forEach((u) => {
      u = t.join(c, u), s.removeSync(u);
    });
  }
  return Mn = {
    emptyDirSync: o,
    emptydirSync: o,
    emptyDir: i,
    emptydir: i
  }, Mn;
}
var qn, aa;
function Oh() {
  if (aa) return qn;
  aa = 1;
  const e = Ze().fromCallback, r = ye, t = Je(), n = /* @__PURE__ */ ht();
  function s(o, c) {
    function a() {
      t.writeFile(o, "", (u) => {
        if (u) return c(u);
        c();
      });
    }
    t.stat(o, (u, l) => {
      if (!u && l.isFile()) return c();
      const d = r.dirname(o);
      t.stat(d, (f, h) => {
        if (f)
          return f.code === "ENOENT" ? n.mkdirs(d, (E) => {
            if (E) return c(E);
            a();
          }) : c(f);
        h.isDirectory() ? a() : t.readdir(d, (E) => {
          if (E) return c(E);
        });
      });
    });
  }
  function i(o) {
    let c;
    try {
      c = t.statSync(o);
    } catch {
    }
    if (c && c.isFile()) return;
    const a = r.dirname(o);
    try {
      t.statSync(a).isDirectory() || t.readdirSync(a);
    } catch (u) {
      if (u && u.code === "ENOENT") n.mkdirsSync(a);
      else throw u;
    }
    t.writeFileSync(o, "");
  }
  return qn = {
    createFile: e(s),
    createFileSync: i
  }, qn;
}
var $n, la;
function bh() {
  if (la) return $n;
  la = 1;
  const e = Ze().fromCallback, r = ye, t = Je(), n = /* @__PURE__ */ ht(), s = qt().pathExists, { areIdentical: i } = /* @__PURE__ */ Qt();
  function o(a, u, l) {
    function d(f, h) {
      t.link(f, h, (E) => {
        if (E) return l(E);
        l(null);
      });
    }
    t.lstat(u, (f, h) => {
      t.lstat(a, (E, g) => {
        if (E)
          return E.message = E.message.replace("lstat", "ensureLink"), l(E);
        if (h && i(g, h)) return l(null);
        const m = r.dirname(u);
        s(m, (v, N) => {
          if (v) return l(v);
          if (N) return d(a, u);
          n.mkdirs(m, (b) => {
            if (b) return l(b);
            d(a, u);
          });
        });
      });
    });
  }
  function c(a, u) {
    let l;
    try {
      l = t.lstatSync(u);
    } catch {
    }
    try {
      const h = t.lstatSync(a);
      if (l && i(h, l)) return;
    } catch (h) {
      throw h.message = h.message.replace("lstat", "ensureLink"), h;
    }
    const d = r.dirname(u);
    return t.existsSync(d) || n.mkdirsSync(d), t.linkSync(a, u);
  }
  return $n = {
    createLink: e(o),
    createLinkSync: c
  }, $n;
}
var Xn, ca;
function Lh() {
  if (ca) return Xn;
  ca = 1;
  const e = ye, r = Je(), t = qt().pathExists;
  function n(i, o, c) {
    if (e.isAbsolute(i))
      return r.lstat(i, (a) => a ? (a.message = a.message.replace("lstat", "ensureSymlink"), c(a)) : c(null, {
        toCwd: i,
        toDst: i
      }));
    {
      const a = e.dirname(o), u = e.join(a, i);
      return t(u, (l, d) => l ? c(l) : d ? c(null, {
        toCwd: u,
        toDst: i
      }) : r.lstat(i, (f) => f ? (f.message = f.message.replace("lstat", "ensureSymlink"), c(f)) : c(null, {
        toCwd: i,
        toDst: e.relative(a, i)
      })));
    }
  }
  function s(i, o) {
    let c;
    if (e.isAbsolute(i)) {
      if (c = r.existsSync(i), !c) throw new Error("absolute srcpath does not exist");
      return {
        toCwd: i,
        toDst: i
      };
    } else {
      const a = e.dirname(o), u = e.join(a, i);
      if (c = r.existsSync(u), c)
        return {
          toCwd: u,
          toDst: i
        };
      if (c = r.existsSync(i), !c) throw new Error("relative srcpath does not exist");
      return {
        toCwd: i,
        toDst: e.relative(a, i)
      };
    }
  }
  return Xn = {
    symlinkPaths: n,
    symlinkPathsSync: s
  }, Xn;
}
var Bn, ua;
function Ch() {
  if (ua) return Bn;
  ua = 1;
  const e = Je();
  function r(n, s, i) {
    if (i = typeof s == "function" ? s : i, s = typeof s == "function" ? !1 : s, s) return i(null, s);
    e.lstat(n, (o, c) => {
      if (o) return i(null, "file");
      s = c && c.isDirectory() ? "dir" : "file", i(null, s);
    });
  }
  function t(n, s) {
    let i;
    if (s) return s;
    try {
      i = e.lstatSync(n);
    } catch {
      return "file";
    }
    return i && i.isDirectory() ? "dir" : "file";
  }
  return Bn = {
    symlinkType: r,
    symlinkTypeSync: t
  }, Bn;
}
var Hn, da;
function Dh() {
  if (da) return Hn;
  da = 1;
  const e = Ze().fromCallback, r = ye, t = /* @__PURE__ */ Kt(), n = /* @__PURE__ */ ht(), s = n.mkdirs, i = n.mkdirsSync, o = /* @__PURE__ */ Lh(), c = o.symlinkPaths, a = o.symlinkPathsSync, u = /* @__PURE__ */ Ch(), l = u.symlinkType, d = u.symlinkTypeSync, f = qt().pathExists, { areIdentical: h } = /* @__PURE__ */ Qt();
  function E(v, N, b, D) {
    D = typeof b == "function" ? b : D, b = typeof b == "function" ? !1 : b, t.lstat(N, (M, _) => {
      !M && _.isSymbolicLink() ? Promise.all([
        t.stat(v),
        t.stat(N)
      ]).then(([A, S]) => {
        if (h(A, S)) return D(null);
        g(v, N, b, D);
      }) : g(v, N, b, D);
    });
  }
  function g(v, N, b, D) {
    c(v, N, (M, _) => {
      if (M) return D(M);
      v = _.toDst, l(_.toCwd, b, (A, S) => {
        if (A) return D(A);
        const y = r.dirname(N);
        f(y, (q, O) => {
          if (q) return D(q);
          if (O) return t.symlink(v, N, S, D);
          s(y, (P) => {
            if (P) return D(P);
            t.symlink(v, N, S, D);
          });
        });
      });
    });
  }
  function m(v, N, b) {
    let D;
    try {
      D = t.lstatSync(N);
    } catch {
    }
    if (D && D.isSymbolicLink()) {
      const S = t.statSync(v), y = t.statSync(N);
      if (h(S, y)) return;
    }
    const M = a(v, N);
    v = M.toDst, b = d(M.toCwd, b);
    const _ = r.dirname(N);
    return t.existsSync(_) || i(_), t.symlinkSync(v, N, b);
  }
  return Hn = {
    createSymlink: e(E),
    createSymlinkSync: m
  }, Hn;
}
var jn, fa;
function xh() {
  if (fa) return jn;
  fa = 1;
  const { createFile: e, createFileSync: r } = /* @__PURE__ */ Oh(), { createLink: t, createLinkSync: n } = /* @__PURE__ */ bh(), { createSymlink: s, createSymlinkSync: i } = /* @__PURE__ */ Dh();
  return jn = {
    // file
    createFile: e,
    createFileSync: r,
    ensureFile: e,
    ensureFileSync: r,
    // link
    createLink: t,
    createLinkSync: n,
    ensureLink: t,
    ensureLinkSync: n,
    // symlink
    createSymlink: s,
    createSymlinkSync: i,
    ensureSymlink: s,
    ensureSymlinkSync: i
  }, jn;
}
var Gn, pa;
function no() {
  if (pa) return Gn;
  pa = 1;
  function e(t, { EOL: n = `
`, finalEOL: s = !0, replacer: i = null, spaces: o } = {}) {
    const c = s ? n : "";
    return JSON.stringify(t, i, o).replace(/\n/g, n) + c;
  }
  function r(t) {
    return Buffer.isBuffer(t) && (t = t.toString("utf8")), t.replace(/^\uFEFF/, "");
  }
  return Gn = { stringify: e, stripBom: r }, Gn;
}
var Vn, ha;
function Ph() {
  if (ha) return Vn;
  ha = 1;
  let e;
  try {
    e = Je();
  } catch {
    e = be;
  }
  const r = Ze(), { stringify: t, stripBom: n } = no();
  async function s(l, d = {}) {
    typeof d == "string" && (d = { encoding: d });
    const f = d.fs || e, h = "throws" in d ? d.throws : !0;
    let E = await r.fromCallback(f.readFile)(l, d);
    E = n(E);
    let g;
    try {
      g = JSON.parse(E, d ? d.reviver : null);
    } catch (m) {
      if (h)
        throw m.message = `${l}: ${m.message}`, m;
      return null;
    }
    return g;
  }
  const i = r.fromPromise(s);
  function o(l, d = {}) {
    typeof d == "string" && (d = { encoding: d });
    const f = d.fs || e, h = "throws" in d ? d.throws : !0;
    try {
      let E = f.readFileSync(l, d);
      return E = n(E), JSON.parse(E, d.reviver);
    } catch (E) {
      if (h)
        throw E.message = `${l}: ${E.message}`, E;
      return null;
    }
  }
  async function c(l, d, f = {}) {
    const h = f.fs || e, E = t(d, f);
    await r.fromCallback(h.writeFile)(l, E, f);
  }
  const a = r.fromPromise(c);
  function u(l, d, f = {}) {
    const h = f.fs || e, E = t(d, f);
    return h.writeFileSync(l, E, f);
  }
  return Vn = {
    readFile: i,
    readFileSync: o,
    writeFile: a,
    writeFileSync: u
  }, Vn;
}
var Wn, ma;
function Uh() {
  if (ma) return Wn;
  ma = 1;
  const e = Ph();
  return Wn = {
    // jsonfile exports
    readJson: e.readFile,
    readJsonSync: e.readFileSync,
    writeJson: e.writeFile,
    writeJsonSync: e.writeFileSync
  }, Wn;
}
var Yn, Ea;
function io() {
  if (Ea) return Yn;
  Ea = 1;
  const e = Ze().fromCallback, r = Je(), t = ye, n = /* @__PURE__ */ ht(), s = qt().pathExists;
  function i(c, a, u, l) {
    typeof u == "function" && (l = u, u = "utf8");
    const d = t.dirname(c);
    s(d, (f, h) => {
      if (f) return l(f);
      if (h) return r.writeFile(c, a, u, l);
      n.mkdirs(d, (E) => {
        if (E) return l(E);
        r.writeFile(c, a, u, l);
      });
    });
  }
  function o(c, ...a) {
    const u = t.dirname(c);
    if (r.existsSync(u))
      return r.writeFileSync(c, ...a);
    n.mkdirsSync(u), r.writeFileSync(c, ...a);
  }
  return Yn = {
    outputFile: e(i),
    outputFileSync: o
  }, Yn;
}
var zn, ga;
function Fh() {
  if (ga) return zn;
  ga = 1;
  const { stringify: e } = no(), { outputFile: r } = /* @__PURE__ */ io();
  async function t(n, s, i = {}) {
    const o = e(s, i);
    await r(n, o, i);
  }
  return zn = t, zn;
}
var Jn, Ta;
function kh() {
  if (Ta) return Jn;
  Ta = 1;
  const { stringify: e } = no(), { outputFileSync: r } = /* @__PURE__ */ io();
  function t(n, s, i) {
    const o = e(s, i);
    r(n, o, i);
  }
  return Jn = t, Jn;
}
var Kn, ya;
function Mh() {
  if (ya) return Kn;
  ya = 1;
  const e = Ze().fromPromise, r = /* @__PURE__ */ Uh();
  return r.outputJson = e(/* @__PURE__ */ Fh()), r.outputJsonSync = /* @__PURE__ */ kh(), r.outputJSON = r.outputJson, r.outputJSONSync = r.outputJsonSync, r.writeJSON = r.writeJson, r.writeJSONSync = r.writeJsonSync, r.readJSON = r.readJson, r.readJSONSync = r.readJsonSync, Kn = r, Kn;
}
var Qn, va;
function qh() {
  if (va) return Qn;
  va = 1;
  const e = Je(), r = ye, t = ro().copy, n = sn().remove, s = ht().mkdirp, i = qt().pathExists, o = /* @__PURE__ */ Qt();
  function c(f, h, E, g) {
    typeof E == "function" && (g = E, E = {}), E = E || {};
    const m = E.overwrite || E.clobber || !1;
    o.checkPaths(f, h, "move", E, (v, N) => {
      if (v) return g(v);
      const { srcStat: b, isChangingCase: D = !1 } = N;
      o.checkParentPaths(f, b, h, "move", (M) => {
        if (M) return g(M);
        if (a(h)) return u(f, h, m, D, g);
        s(r.dirname(h), (_) => _ ? g(_) : u(f, h, m, D, g));
      });
    });
  }
  function a(f) {
    const h = r.dirname(f);
    return r.parse(h).root === h;
  }
  function u(f, h, E, g, m) {
    if (g) return l(f, h, E, m);
    if (E)
      return n(h, (v) => v ? m(v) : l(f, h, E, m));
    i(h, (v, N) => v ? m(v) : N ? m(new Error("dest already exists.")) : l(f, h, E, m));
  }
  function l(f, h, E, g) {
    e.rename(f, h, (m) => m ? m.code !== "EXDEV" ? g(m) : d(f, h, E, g) : g());
  }
  function d(f, h, E, g) {
    t(f, h, {
      overwrite: E,
      errorOnExist: !0
    }, (v) => v ? g(v) : n(f, g));
  }
  return Qn = c, Qn;
}
var Zn, Aa;
function $h() {
  if (Aa) return Zn;
  Aa = 1;
  const e = Je(), r = ye, t = ro().copySync, n = sn().removeSync, s = ht().mkdirpSync, i = /* @__PURE__ */ Qt();
  function o(d, f, h) {
    h = h || {};
    const E = h.overwrite || h.clobber || !1, { srcStat: g, isChangingCase: m = !1 } = i.checkPathsSync(d, f, "move", h);
    return i.checkParentPathsSync(d, g, f, "move"), c(f) || s(r.dirname(f)), a(d, f, E, m);
  }
  function c(d) {
    const f = r.dirname(d);
    return r.parse(f).root === f;
  }
  function a(d, f, h, E) {
    if (E) return u(d, f, h);
    if (h)
      return n(f), u(d, f, h);
    if (e.existsSync(f)) throw new Error("dest already exists.");
    return u(d, f, h);
  }
  function u(d, f, h) {
    try {
      e.renameSync(d, f);
    } catch (E) {
      if (E.code !== "EXDEV") throw E;
      return l(d, f, h);
    }
  }
  function l(d, f, h) {
    return t(d, f, {
      overwrite: h,
      errorOnExist: !0
    }), n(d);
  }
  return Zn = o, Zn;
}
var ei, Ia;
function Xh() {
  if (Ia) return ei;
  Ia = 1;
  const e = Ze().fromCallback;
  return ei = {
    move: e(/* @__PURE__ */ qh()),
    moveSync: /* @__PURE__ */ $h()
  }, ei;
}
var ti, Sa;
function Rt() {
  return Sa || (Sa = 1, ti = {
    // Export promiseified graceful-fs:
    .../* @__PURE__ */ Kt(),
    // Export extra methods:
    .../* @__PURE__ */ ro(),
    .../* @__PURE__ */ Rh(),
    .../* @__PURE__ */ xh(),
    .../* @__PURE__ */ Mh(),
    .../* @__PURE__ */ ht(),
    .../* @__PURE__ */ Xh(),
    .../* @__PURE__ */ io(),
    .../* @__PURE__ */ qt(),
    .../* @__PURE__ */ sn()
  }), ti;
}
var ir = {}, Pt = {}, ri = {}, Ut = {}, Na;
function so() {
  if (Na) return Ut;
  Na = 1, Object.defineProperty(Ut, "__esModule", { value: !0 }), Ut.CancellationError = Ut.CancellationToken = void 0;
  const e = nn;
  let r = class extends e.EventEmitter {
    get cancelled() {
      return this._cancelled || this._parent != null && this._parent.cancelled;
    }
    set parent(s) {
      this.removeParentCancelHandler(), this._parent = s, this.parentCancelHandler = () => this.cancel(), this._parent.onCancel(this.parentCancelHandler);
    }
    // babel cannot compile ... correctly for super calls
    constructor(s) {
      super(), this.parentCancelHandler = null, this._parent = null, this._cancelled = !1, s != null && (this.parent = s);
    }
    cancel() {
      this._cancelled = !0, this.emit("cancel");
    }
    onCancel(s) {
      this.cancelled ? s() : this.once("cancel", s);
    }
    createPromise(s) {
      if (this.cancelled)
        return Promise.reject(new t());
      const i = () => {
        if (o != null)
          try {
            this.removeListener("cancel", o), o = null;
          } catch {
          }
      };
      let o = null;
      return new Promise((c, a) => {
        let u = null;
        if (o = () => {
          try {
            u != null && (u(), u = null);
          } finally {
            a(new t());
          }
        }, this.cancelled) {
          o();
          return;
        }
        this.onCancel(o), s(c, a, (l) => {
          u = l;
        });
      }).then((c) => (i(), c)).catch((c) => {
        throw i(), c;
      });
    }
    removeParentCancelHandler() {
      const s = this._parent;
      s != null && this.parentCancelHandler != null && (s.removeListener("cancel", this.parentCancelHandler), this.parentCancelHandler = null);
    }
    dispose() {
      try {
        this.removeParentCancelHandler();
      } finally {
        this.removeAllListeners(), this._parent = null;
      }
    }
  };
  Ut.CancellationToken = r;
  class t extends Error {
    constructor() {
      super("cancelled");
    }
  }
  return Ut.CancellationError = t, Ut;
}
var Hr = {}, _a;
function on() {
  if (_a) return Hr;
  _a = 1, Object.defineProperty(Hr, "__esModule", { value: !0 }), Hr.newError = e;
  function e(r, t) {
    const n = new Error(r);
    return n.code = t, n;
  }
  return Hr;
}
var Be = {}, jr = { exports: {} }, Gr = { exports: {} }, ni, wa;
function Bh() {
  if (wa) return ni;
  wa = 1;
  var e = 1e3, r = e * 60, t = r * 60, n = t * 24, s = n * 7, i = n * 365.25;
  ni = function(l, d) {
    d = d || {};
    var f = typeof l;
    if (f === "string" && l.length > 0)
      return o(l);
    if (f === "number" && isFinite(l))
      return d.long ? a(l) : c(l);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(l)
    );
  };
  function o(l) {
    if (l = String(l), !(l.length > 100)) {
      var d = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        l
      );
      if (d) {
        var f = parseFloat(d[1]), h = (d[2] || "ms").toLowerCase();
        switch (h) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return f * i;
          case "weeks":
          case "week":
          case "w":
            return f * s;
          case "days":
          case "day":
          case "d":
            return f * n;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return f * t;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return f * r;
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
  function c(l) {
    var d = Math.abs(l);
    return d >= n ? Math.round(l / n) + "d" : d >= t ? Math.round(l / t) + "h" : d >= r ? Math.round(l / r) + "m" : d >= e ? Math.round(l / e) + "s" : l + "ms";
  }
  function a(l) {
    var d = Math.abs(l);
    return d >= n ? u(l, d, n, "day") : d >= t ? u(l, d, t, "hour") : d >= r ? u(l, d, r, "minute") : d >= e ? u(l, d, e, "second") : l + " ms";
  }
  function u(l, d, f, h) {
    var E = d >= f * 1.5;
    return Math.round(l / f) + " " + h + (E ? "s" : "");
  }
  return ni;
}
var ii, Ra;
function $u() {
  if (Ra) return ii;
  Ra = 1;
  function e(r) {
    n.debug = n, n.default = n, n.coerce = u, n.disable = c, n.enable = i, n.enabled = a, n.humanize = Bh(), n.destroy = l, Object.keys(r).forEach((d) => {
      n[d] = r[d];
    }), n.names = [], n.skips = [], n.formatters = {};
    function t(d) {
      let f = 0;
      for (let h = 0; h < d.length; h++)
        f = (f << 5) - f + d.charCodeAt(h), f |= 0;
      return n.colors[Math.abs(f) % n.colors.length];
    }
    n.selectColor = t;
    function n(d) {
      let f, h = null, E, g;
      function m(...v) {
        if (!m.enabled)
          return;
        const N = m, b = Number(/* @__PURE__ */ new Date()), D = b - (f || b);
        N.diff = D, N.prev = f, N.curr = b, f = b, v[0] = n.coerce(v[0]), typeof v[0] != "string" && v.unshift("%O");
        let M = 0;
        v[0] = v[0].replace(/%([a-zA-Z%])/g, (A, S) => {
          if (A === "%%")
            return "%";
          M++;
          const y = n.formatters[S];
          if (typeof y == "function") {
            const q = v[M];
            A = y.call(N, q), v.splice(M, 1), M--;
          }
          return A;
        }), n.formatArgs.call(N, v), (N.log || n.log).apply(N, v);
      }
      return m.namespace = d, m.useColors = n.useColors(), m.color = n.selectColor(d), m.extend = s, m.destroy = n.destroy, Object.defineProperty(m, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => h !== null ? h : (E !== n.namespaces && (E = n.namespaces, g = n.enabled(d)), g),
        set: (v) => {
          h = v;
        }
      }), typeof n.init == "function" && n.init(m), m;
    }
    function s(d, f) {
      const h = n(this.namespace + (typeof f > "u" ? ":" : f) + d);
      return h.log = this.log, h;
    }
    function i(d) {
      n.save(d), n.namespaces = d, n.names = [], n.skips = [];
      const f = (typeof d == "string" ? d : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const h of f)
        h[0] === "-" ? n.skips.push(h.slice(1)) : n.names.push(h);
    }
    function o(d, f) {
      let h = 0, E = 0, g = -1, m = 0;
      for (; h < d.length; )
        if (E < f.length && (f[E] === d[h] || f[E] === "*"))
          f[E] === "*" ? (g = E, m = h, E++) : (h++, E++);
        else if (g !== -1)
          E = g + 1, m++, h = m;
        else
          return !1;
      for (; E < f.length && f[E] === "*"; )
        E++;
      return E === f.length;
    }
    function c() {
      const d = [
        ...n.names,
        ...n.skips.map((f) => "-" + f)
      ].join(",");
      return n.enable(""), d;
    }
    function a(d) {
      for (const f of n.skips)
        if (o(d, f))
          return !1;
      for (const f of n.names)
        if (o(d, f))
          return !0;
      return !1;
    }
    function u(d) {
      return d instanceof Error ? d.stack || d.message : d;
    }
    function l() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return n.enable(n.load()), n;
  }
  return ii = e, ii;
}
var Oa;
function Hh() {
  return Oa || (Oa = 1, (function(e, r) {
    r.formatArgs = n, r.save = s, r.load = i, r.useColors = t, r.storage = o(), r.destroy = /* @__PURE__ */ (() => {
      let a = !1;
      return () => {
        a || (a = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      };
    })(), r.colors = [
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
    function t() {
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
    function n(a) {
      if (a[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + a[0] + (this.useColors ? "%c " : " ") + "+" + e.exports.humanize(this.diff), !this.useColors)
        return;
      const u = "color: " + this.color;
      a.splice(1, 0, u, "color: inherit");
      let l = 0, d = 0;
      a[0].replace(/%[a-zA-Z%]/g, (f) => {
        f !== "%%" && (l++, f === "%c" && (d = l));
      }), a.splice(d, 0, u);
    }
    r.log = console.debug || console.log || (() => {
    });
    function s(a) {
      try {
        a ? r.storage.setItem("debug", a) : r.storage.removeItem("debug");
      } catch {
      }
    }
    function i() {
      let a;
      try {
        a = r.storage.getItem("debug") || r.storage.getItem("DEBUG");
      } catch {
      }
      return !a && typeof process < "u" && "env" in process && (a = process.env.DEBUG), a;
    }
    function o() {
      try {
        return localStorage;
      } catch {
      }
    }
    e.exports = $u()(r);
    const { formatters: c } = e.exports;
    c.j = function(a) {
      try {
        return JSON.stringify(a);
      } catch (u) {
        return "[UnexpectedJSONParseError]: " + u.message;
      }
    };
  })(Gr, Gr.exports)), Gr.exports;
}
var Vr = { exports: {} }, si, ba;
function jh() {
  return ba || (ba = 1, si = (e, r = process.argv) => {
    const t = e.startsWith("-") ? "" : e.length === 1 ? "-" : "--", n = r.indexOf(t + e), s = r.indexOf("--");
    return n !== -1 && (s === -1 || n < s);
  }), si;
}
var oi, La;
function Gh() {
  if (La) return oi;
  La = 1;
  const e = yt, r = Iu, t = jh(), { env: n } = process;
  let s;
  t("no-color") || t("no-colors") || t("color=false") || t("color=never") ? s = 0 : (t("color") || t("colors") || t("color=true") || t("color=always")) && (s = 1);
  function i() {
    if ("FORCE_COLOR" in n)
      return n.FORCE_COLOR === "true" ? 1 : n.FORCE_COLOR === "false" ? 0 : n.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(n.FORCE_COLOR, 10), 3);
  }
  function o(u) {
    return u === 0 ? !1 : {
      level: u,
      hasBasic: !0,
      has256: u >= 2,
      has16m: u >= 3
    };
  }
  function c(u, { streamIsTTY: l, sniffFlags: d = !0 } = {}) {
    const f = i();
    f !== void 0 && (s = f);
    const h = d ? s : f;
    if (h === 0)
      return 0;
    if (d) {
      if (t("color=16m") || t("color=full") || t("color=truecolor"))
        return 3;
      if (t("color=256"))
        return 2;
    }
    if (u && !l && h === void 0)
      return 0;
    const E = h || 0;
    if (n.TERM === "dumb")
      return E;
    if (process.platform === "win32") {
      const g = e.release().split(".");
      return Number(g[0]) >= 10 && Number(g[2]) >= 10586 ? Number(g[2]) >= 14931 ? 3 : 2 : 1;
    }
    if ("CI" in n)
      return ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE", "DRONE"].some((g) => g in n) || n.CI_NAME === "codeship" ? 1 : E;
    if ("TEAMCITY_VERSION" in n)
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(n.TEAMCITY_VERSION) ? 1 : 0;
    if (n.COLORTERM === "truecolor")
      return 3;
    if ("TERM_PROGRAM" in n) {
      const g = Number.parseInt((n.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (n.TERM_PROGRAM) {
        case "iTerm.app":
          return g >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    return /-256(color)?$/i.test(n.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(n.TERM) || "COLORTERM" in n ? 1 : E;
  }
  function a(u, l = {}) {
    const d = c(u, {
      streamIsTTY: u && u.isTTY,
      ...l
    });
    return o(d);
  }
  return oi = {
    supportsColor: a,
    stdout: a({ isTTY: r.isatty(1) }),
    stderr: a({ isTTY: r.isatty(2) })
  }, oi;
}
var Ca;
function Vh() {
  return Ca || (Ca = 1, (function(e, r) {
    const t = Iu, n = rn;
    r.init = l, r.log = c, r.formatArgs = i, r.save = a, r.load = u, r.useColors = s, r.destroy = n.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), r.colors = [6, 2, 3, 4, 5, 1];
    try {
      const f = Gh();
      f && (f.stderr || f).level >= 2 && (r.colors = [
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
    r.inspectOpts = Object.keys(process.env).filter((f) => /^debug_/i.test(f)).reduce((f, h) => {
      const E = h.substring(6).toLowerCase().replace(/_([a-z])/g, (m, v) => v.toUpperCase());
      let g = process.env[h];
      return /^(yes|on|true|enabled)$/i.test(g) ? g = !0 : /^(no|off|false|disabled)$/i.test(g) ? g = !1 : g === "null" ? g = null : g = Number(g), f[E] = g, f;
    }, {});
    function s() {
      return "colors" in r.inspectOpts ? !!r.inspectOpts.colors : t.isatty(process.stderr.fd);
    }
    function i(f) {
      const { namespace: h, useColors: E } = this;
      if (E) {
        const g = this.color, m = "\x1B[3" + (g < 8 ? g : "8;5;" + g), v = `  ${m};1m${h} \x1B[0m`;
        f[0] = v + f[0].split(`
`).join(`
` + v), f.push(m + "m+" + e.exports.humanize(this.diff) + "\x1B[0m");
      } else
        f[0] = o() + h + " " + f[0];
    }
    function o() {
      return r.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function c(...f) {
      return process.stderr.write(n.formatWithOptions(r.inspectOpts, ...f) + `
`);
    }
    function a(f) {
      f ? process.env.DEBUG = f : delete process.env.DEBUG;
    }
    function u() {
      return process.env.DEBUG;
    }
    function l(f) {
      f.inspectOpts = {};
      const h = Object.keys(r.inspectOpts);
      for (let E = 0; E < h.length; E++)
        f.inspectOpts[h[E]] = r.inspectOpts[h[E]];
    }
    e.exports = $u()(r);
    const { formatters: d } = e.exports;
    d.o = function(f) {
      return this.inspectOpts.colors = this.useColors, n.inspect(f, this.inspectOpts).split(`
`).map((h) => h.trim()).join(" ");
    }, d.O = function(f) {
      return this.inspectOpts.colors = this.useColors, n.inspect(f, this.inspectOpts);
    };
  })(Vr, Vr.exports)), Vr.exports;
}
var Da;
function Wh() {
  return Da || (Da = 1, typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? jr.exports = Hh() : jr.exports = Vh()), jr.exports;
}
var sr = {}, xa;
function Xu() {
  if (xa) return sr;
  xa = 1, Object.defineProperty(sr, "__esModule", { value: !0 }), sr.ProgressCallbackTransform = void 0;
  const e = Or;
  let r = class extends e.Transform {
    constructor(n, s, i) {
      super(), this.total = n, this.cancellationToken = s, this.onProgress = i, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.nextUpdate = this.start + 1e3;
    }
    _transform(n, s, i) {
      if (this.cancellationToken.cancelled) {
        i(new Error("cancelled"), null);
        return;
      }
      this.transferred += n.length, this.delta += n.length;
      const o = Date.now();
      o >= this.nextUpdate && this.transferred !== this.total && (this.nextUpdate = o + 1e3, this.onProgress({
        total: this.total,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.total * 100,
        bytesPerSecond: Math.round(this.transferred / ((o - this.start) / 1e3))
      }), this.delta = 0), i(null, n);
    }
    _flush(n) {
      if (this.cancellationToken.cancelled) {
        n(new Error("cancelled"));
        return;
      }
      this.onProgress({
        total: this.total,
        delta: this.delta,
        transferred: this.total,
        percent: 100,
        bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
      }), this.delta = 0, n(null);
    }
  };
  return sr.ProgressCallbackTransform = r, sr;
}
var Pa;
function Yh() {
  if (Pa) return Be;
  Pa = 1, Object.defineProperty(Be, "__esModule", { value: !0 }), Be.DigestTransform = Be.HttpExecutor = Be.HttpError = void 0, Be.createHttpError = u, Be.parseJson = f, Be.configureRequestOptionsFromUrl = E, Be.configureRequestUrl = g, Be.safeGetHeader = N, Be.configureRequestOptions = D, Be.safeStringifyJson = M;
  const e = Me, r = Wh(), t = be, n = Or, s = Jt, i = so(), o = on(), c = Xu(), a = (0, r.default)("electron-builder");
  function u(_, A = null) {
    return new d(_.statusCode || -1, `${_.statusCode} ${_.statusMessage}` + (A == null ? "" : `
` + JSON.stringify(A, null, "  ")) + `
Headers: ` + M(_.headers), A);
  }
  const l = /* @__PURE__ */ new Map([
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
    constructor(A, S = `HTTP error: ${l.get(A) || A}`, y = null) {
      super(S), this.statusCode = A, this.description = y, this.name = "HttpError", this.code = `HTTP_ERROR_${A}`;
    }
    isServerError() {
      return this.statusCode >= 500 && this.statusCode <= 599;
    }
  }
  Be.HttpError = d;
  function f(_) {
    return _.then((A) => A == null || A.length === 0 ? null : JSON.parse(A));
  }
  class h {
    constructor() {
      this.maxRedirects = 10;
    }
    request(A, S = new i.CancellationToken(), y) {
      D(A);
      const q = y == null ? void 0 : JSON.stringify(y), O = q ? Buffer.from(q) : void 0;
      if (O != null) {
        a(q);
        const { headers: P, ...k } = A;
        A = {
          method: "post",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": O.length,
            ...P
          },
          ...k
        };
      }
      return this.doApiRequest(A, S, (P) => P.end(O));
    }
    doApiRequest(A, S, y, q = 0) {
      return a.enabled && a(`Request: ${M(A)}`), S.createPromise((O, P, k) => {
        const C = this.createRequest(A, (x) => {
          try {
            this.handleResponse(x, A, S, O, P, q, y);
          } catch ($) {
            P($);
          }
        });
        this.addErrorAndTimeoutHandlers(C, P, A.timeout), this.addRedirectHandlers(C, A, P, q, (x) => {
          this.doApiRequest(x, S, y, q).then(O).catch(P);
        }), y(C, P), k(() => C.abort());
      });
    }
    // noinspection JSUnusedLocalSymbols
    // eslint-disable-next-line
    addRedirectHandlers(A, S, y, q, O) {
    }
    addErrorAndTimeoutHandlers(A, S, y = 60 * 1e3) {
      this.addTimeOutHandler(A, S, y), A.on("error", S), A.on("aborted", () => {
        S(new Error("Request has been aborted by the server"));
      });
    }
    handleResponse(A, S, y, q, O, P, k) {
      var C;
      if (a.enabled && a(`Response: ${A.statusCode} ${A.statusMessage}, request options: ${M(S)}`), A.statusCode === 404) {
        O(u(A, `method: ${S.method || "GET"} url: ${S.protocol || "https:"}//${S.hostname}${S.port ? `:${S.port}` : ""}${S.path}

Please double check that your authentication token is correct. Due to security reasons, actual status maybe not reported, but 404.
`));
        return;
      } else if (A.statusCode === 204) {
        q();
        return;
      }
      const x = (C = A.statusCode) !== null && C !== void 0 ? C : 0, $ = x >= 300 && x < 400, L = N(A, "location");
      if ($ && L != null) {
        if (P > this.maxRedirects) {
          O(this.createMaxRedirectError());
          return;
        }
        this.doApiRequest(h.prepareRedirectUrlOptions(L, S), y, k, P).then(q).catch(O);
        return;
      }
      A.setEncoding("utf8");
      let j = "";
      A.on("error", O), A.on("data", (G) => j += G), A.on("end", () => {
        try {
          if (A.statusCode != null && A.statusCode >= 400) {
            const G = N(A, "content-type"), re = G != null && (Array.isArray(G) ? G.find((ae) => ae.includes("json")) != null : G.includes("json"));
            O(u(A, `method: ${S.method || "GET"} url: ${S.protocol || "https:"}//${S.hostname}${S.port ? `:${S.port}` : ""}${S.path}

          Data:
          ${re ? JSON.stringify(JSON.parse(j)) : j}
          `));
          } else
            q(j.length === 0 ? null : j);
        } catch (G) {
          O(G);
        }
      });
    }
    async downloadToBuffer(A, S) {
      return await S.cancellationToken.createPromise((y, q, O) => {
        const P = [], k = {
          headers: S.headers || void 0,
          // because PrivateGitHubProvider requires HttpExecutor.prepareRedirectUrlOptions logic, so, we need to redirect manually
          redirect: "manual"
        };
        g(A, k), D(k), this.doDownload(k, {
          destination: null,
          options: S,
          onCancel: O,
          callback: (C) => {
            C == null ? y(Buffer.concat(P)) : q(C);
          },
          responseHandler: (C, x) => {
            let $ = 0;
            C.on("data", (L) => {
              if ($ += L.length, $ > 524288e3) {
                x(new Error("Maximum allowed size is 500 MB"));
                return;
              }
              P.push(L);
            }), C.on("end", () => {
              x(null);
            });
          }
        }, 0);
      });
    }
    doDownload(A, S, y) {
      const q = this.createRequest(A, (O) => {
        if (O.statusCode >= 400) {
          S.callback(new Error(`Cannot download "${A.protocol || "https:"}//${A.hostname}${A.path}", status ${O.statusCode}: ${O.statusMessage}`));
          return;
        }
        O.on("error", S.callback);
        const P = N(O, "location");
        if (P != null) {
          y < this.maxRedirects ? this.doDownload(h.prepareRedirectUrlOptions(P, A), S, y++) : S.callback(this.createMaxRedirectError());
          return;
        }
        S.responseHandler == null ? b(S, O) : S.responseHandler(O, S.callback);
      });
      this.addErrorAndTimeoutHandlers(q, S.callback, A.timeout), this.addRedirectHandlers(q, A, S.callback, y, (O) => {
        this.doDownload(O, S, y++);
      }), q.end();
    }
    createMaxRedirectError() {
      return new Error(`Too many redirects (> ${this.maxRedirects})`);
    }
    addTimeOutHandler(A, S, y) {
      A.on("socket", (q) => {
        q.setTimeout(y, () => {
          A.abort(), S(new Error("Request timed out"));
        });
      });
    }
    static prepareRedirectUrlOptions(A, S) {
      const y = E(A, { ...S }), q = y.headers;
      if (q?.authorization) {
        const O = new s.URL(A);
        (O.hostname.endsWith(".amazonaws.com") || O.searchParams.has("X-Amz-Credential")) && delete q.authorization;
      }
      return y;
    }
    static retryOnServerError(A, S = 3) {
      for (let y = 0; ; y++)
        try {
          return A();
        } catch (q) {
          if (y < S && (q instanceof d && q.isServerError() || q.code === "EPIPE"))
            continue;
          throw q;
        }
    }
  }
  Be.HttpExecutor = h;
  function E(_, A) {
    const S = D(A);
    return g(new s.URL(_), S), S;
  }
  function g(_, A) {
    A.protocol = _.protocol, A.hostname = _.hostname, _.port ? A.port = _.port : A.port && delete A.port, A.path = _.pathname + _.search;
  }
  class m extends n.Transform {
    // noinspection JSUnusedGlobalSymbols
    get actual() {
      return this._actual;
    }
    constructor(A, S = "sha512", y = "base64") {
      super(), this.expected = A, this.algorithm = S, this.encoding = y, this._actual = null, this.isValidateOnEnd = !0, this.digester = (0, e.createHash)(S);
    }
    // noinspection JSUnusedGlobalSymbols
    _transform(A, S, y) {
      this.digester.update(A), y(null, A);
    }
    // noinspection JSUnusedGlobalSymbols
    _flush(A) {
      if (this._actual = this.digester.digest(this.encoding), this.isValidateOnEnd)
        try {
          this.validate();
        } catch (S) {
          A(S);
          return;
        }
      A(null);
    }
    validate() {
      if (this._actual == null)
        throw (0, o.newError)("Not finished yet", "ERR_STREAM_NOT_FINISHED");
      if (this._actual !== this.expected)
        throw (0, o.newError)(`${this.algorithm} checksum mismatch, expected ${this.expected}, got ${this._actual}`, "ERR_CHECKSUM_MISMATCH");
      return null;
    }
  }
  Be.DigestTransform = m;
  function v(_, A, S) {
    return _ != null && A != null && _ !== A ? (S(new Error(`checksum mismatch: expected ${A} but got ${_} (X-Checksum-Sha2 header)`)), !1) : !0;
  }
  function N(_, A) {
    const S = _.headers[A];
    return S == null ? null : Array.isArray(S) ? S.length === 0 ? null : S[S.length - 1] : S;
  }
  function b(_, A) {
    if (!v(N(A, "X-Checksum-Sha2"), _.options.sha2, _.callback))
      return;
    const S = [];
    if (_.options.onProgress != null) {
      const P = N(A, "content-length");
      P != null && S.push(new c.ProgressCallbackTransform(parseInt(P, 10), _.options.cancellationToken, _.options.onProgress));
    }
    const y = _.options.sha512;
    y != null ? S.push(new m(y, "sha512", y.length === 128 && !y.includes("+") && !y.includes("Z") && !y.includes("=") ? "hex" : "base64")) : _.options.sha2 != null && S.push(new m(_.options.sha2, "sha256", "hex"));
    const q = (0, t.createWriteStream)(_.destination);
    S.push(q);
    let O = A;
    for (const P of S)
      P.on("error", (k) => {
        q.close(), _.options.cancellationToken.cancelled || _.callback(k);
      }), O = O.pipe(P);
    q.on("finish", () => {
      q.close(_.callback);
    });
  }
  function D(_, A, S) {
    S != null && (_.method = S), _.headers = { ..._.headers };
    const y = _.headers;
    return A != null && (y.authorization = A.startsWith("Basic") || A.startsWith("Bearer") ? A : `token ${A}`), y["User-Agent"] == null && (y["User-Agent"] = "electron-builder"), (S == null || S === "GET" || y["Cache-Control"] == null) && (y["Cache-Control"] = "no-cache"), _.protocol == null && process.versions.electron != null && (_.protocol = "https:"), _;
  }
  function M(_, A) {
    return JSON.stringify(_, (S, y) => S.endsWith("Authorization") || S.endsWith("authorization") || S.endsWith("Password") || S.endsWith("PASSWORD") || S.endsWith("Token") || S.includes("password") || S.includes("token") || A != null && A.has(S) ? "<stripped sensitive data>" : y, 2);
  }
  return Be;
}
var or = {}, Ua;
function zh() {
  if (Ua) return or;
  Ua = 1, Object.defineProperty(or, "__esModule", { value: !0 }), or.MemoLazy = void 0;
  let e = class {
    constructor(n, s) {
      this.selector = n, this.creator = s, this.selected = void 0, this._value = void 0;
    }
    get hasValue() {
      return this._value !== void 0;
    }
    get value() {
      const n = this.selector();
      if (this._value !== void 0 && r(this.selected, n))
        return this._value;
      this.selected = n;
      const s = this.creator(n);
      return this.value = s, s;
    }
    set value(n) {
      this._value = n;
    }
  };
  or.MemoLazy = e;
  function r(t, n) {
    if (typeof t == "object" && t !== null && (typeof n == "object" && n !== null)) {
      const o = Object.keys(t), c = Object.keys(n);
      return o.length === c.length && o.every((a) => r(t[a], n[a]));
    }
    return t === n;
  }
  return or;
}
var ar = {}, Fa;
function Jh() {
  if (Fa) return ar;
  Fa = 1, Object.defineProperty(ar, "__esModule", { value: !0 }), ar.githubUrl = e, ar.getS3LikeProviderBaseUrl = r;
  function e(i, o = "github.com") {
    return `${i.protocol || "https"}://${i.host || o}`;
  }
  function r(i) {
    const o = i.provider;
    if (o === "s3")
      return t(i);
    if (o === "spaces")
      return s(i);
    throw new Error(`Not supported provider: ${o}`);
  }
  function t(i) {
    let o;
    if (i.accelerate == !0)
      o = `https://${i.bucket}.s3-accelerate.amazonaws.com`;
    else if (i.endpoint != null)
      o = `${i.endpoint}/${i.bucket}`;
    else if (i.bucket.includes(".")) {
      if (i.region == null)
        throw new Error(`Bucket name "${i.bucket}" includes a dot, but S3 region is missing`);
      i.region === "us-east-1" ? o = `https://s3.amazonaws.com/${i.bucket}` : o = `https://s3-${i.region}.amazonaws.com/${i.bucket}`;
    } else i.region === "cn-north-1" ? o = `https://${i.bucket}.s3.${i.region}.amazonaws.com.cn` : o = `https://${i.bucket}.s3.amazonaws.com`;
    return n(o, i.path);
  }
  function n(i, o) {
    return o != null && o.length > 0 && (o.startsWith("/") || (i += "/"), i += o), i;
  }
  function s(i) {
    if (i.name == null)
      throw new Error("name is missing");
    if (i.region == null)
      throw new Error("region is missing");
    return n(`https://${i.name}.${i.region}.digitaloceanspaces.com`, i.path);
  }
  return ar;
}
var Wr = {}, ka;
function Kh() {
  if (ka) return Wr;
  ka = 1, Object.defineProperty(Wr, "__esModule", { value: !0 }), Wr.retry = r;
  const e = so();
  async function r(t, n, s, i = 0, o = 0, c) {
    var a;
    const u = new e.CancellationToken();
    try {
      return await t();
    } catch (l) {
      if ((!((a = c?.(l)) !== null && a !== void 0) || a) && n > 0 && !u.cancelled)
        return await new Promise((d) => setTimeout(d, s + i * o)), await r(t, n - 1, s, i, o + 1, c);
      throw l;
    }
  }
  return Wr;
}
var Yr = {}, Ma;
function Qh() {
  if (Ma) return Yr;
  Ma = 1, Object.defineProperty(Yr, "__esModule", { value: !0 }), Yr.parseDn = e;
  function e(r) {
    let t = !1, n = null, s = "", i = 0;
    r = r.trim();
    const o = /* @__PURE__ */ new Map();
    for (let c = 0; c <= r.length; c++) {
      if (c === r.length) {
        n !== null && o.set(n, s);
        break;
      }
      const a = r[c];
      if (t) {
        if (a === '"') {
          t = !1;
          continue;
        }
      } else {
        if (a === '"') {
          t = !0;
          continue;
        }
        if (a === "\\") {
          c++;
          const u = parseInt(r.slice(c, c + 2), 16);
          Number.isNaN(u) ? s += r[c] : (c++, s += String.fromCharCode(u));
          continue;
        }
        if (n === null && a === "=") {
          n = s, s = "";
          continue;
        }
        if (a === "," || a === ";" || a === "+") {
          n !== null && o.set(n, s), n = null, s = "";
          continue;
        }
      }
      if (a === " " && !t) {
        if (s.length === 0)
          continue;
        if (c > i) {
          let u = c;
          for (; r[u] === " "; )
            u++;
          i = u;
        }
        if (i >= r.length || r[i] === "," || r[i] === ";" || n === null && r[i] === "=" || n !== null && r[i] === "+") {
          c = i - 1;
          continue;
        }
      }
      s += a;
    }
    return o;
  }
  return Yr;
}
var Ft = {}, qa;
function Zh() {
  if (qa) return Ft;
  qa = 1, Object.defineProperty(Ft, "__esModule", { value: !0 }), Ft.nil = Ft.UUID = void 0;
  const e = Me, r = on(), t = "options.name must be either a string or a Buffer", n = (0, e.randomBytes)(16);
  n[0] = n[0] | 1;
  const s = {}, i = [];
  for (let d = 0; d < 256; d++) {
    const f = (d + 256).toString(16).substr(1);
    s[f] = d, i[d] = f;
  }
  class o {
    constructor(f) {
      this.ascii = null, this.binary = null;
      const h = o.check(f);
      if (!h)
        throw new Error("not a UUID");
      this.version = h.version, h.format === "ascii" ? this.ascii = f : this.binary = f;
    }
    static v5(f, h) {
      return u(f, "sha1", 80, h);
    }
    toString() {
      return this.ascii == null && (this.ascii = l(this.binary)), this.ascii;
    }
    inspect() {
      return `UUID v${this.version} ${this.toString()}`;
    }
    static check(f, h = 0) {
      if (typeof f == "string")
        return f = f.toLowerCase(), /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-([a-f0-9]{12})$/.test(f) ? f === "00000000-0000-0000-0000-000000000000" ? { version: void 0, variant: "nil", format: "ascii" } : {
          version: (s[f[14] + f[15]] & 240) >> 4,
          variant: c((s[f[19] + f[20]] & 224) >> 5),
          format: "ascii"
        } : !1;
      if (Buffer.isBuffer(f)) {
        if (f.length < h + 16)
          return !1;
        let E = 0;
        for (; E < 16 && f[h + E] === 0; E++)
          ;
        return E === 16 ? { version: void 0, variant: "nil", format: "binary" } : {
          version: (f[h + 6] & 240) >> 4,
          variant: c((f[h + 8] & 224) >> 5),
          format: "binary"
        };
      }
      throw (0, r.newError)("Unknown type of uuid", "ERR_UNKNOWN_UUID_TYPE");
    }
    // read stringified uuid into a Buffer
    static parse(f) {
      const h = Buffer.allocUnsafe(16);
      let E = 0;
      for (let g = 0; g < 16; g++)
        h[g] = s[f[E++] + f[E++]], (g === 3 || g === 5 || g === 7 || g === 9) && (E += 1);
      return h;
    }
  }
  Ft.UUID = o, o.OID = o.parse("6ba7b812-9dad-11d1-80b4-00c04fd430c8");
  function c(d) {
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
  function u(d, f, h, E, g = a.ASCII) {
    const m = (0, e.createHash)(f);
    if (typeof d != "string" && !Buffer.isBuffer(d))
      throw (0, r.newError)(t, "ERR_INVALID_UUID_NAME");
    m.update(E), m.update(d);
    const N = m.digest();
    let b;
    switch (g) {
      case a.BINARY:
        N[6] = N[6] & 15 | h, N[8] = N[8] & 63 | 128, b = N;
        break;
      case a.OBJECT:
        N[6] = N[6] & 15 | h, N[8] = N[8] & 63 | 128, b = new o(N);
        break;
      default:
        b = i[N[0]] + i[N[1]] + i[N[2]] + i[N[3]] + "-" + i[N[4]] + i[N[5]] + "-" + i[N[6] & 15 | h] + i[N[7]] + "-" + i[N[8] & 63 | 128] + i[N[9]] + "-" + i[N[10]] + i[N[11]] + i[N[12]] + i[N[13]] + i[N[14]] + i[N[15]];
        break;
    }
    return b;
  }
  function l(d) {
    return i[d[0]] + i[d[1]] + i[d[2]] + i[d[3]] + "-" + i[d[4]] + i[d[5]] + "-" + i[d[6]] + i[d[7]] + "-" + i[d[8]] + i[d[9]] + "-" + i[d[10]] + i[d[11]] + i[d[12]] + i[d[13]] + i[d[14]] + i[d[15]];
  }
  return Ft.nil = new o("00000000-0000-0000-0000-000000000000"), Ft;
}
var Gt = {}, ai = {}, $a;
function em() {
  return $a || ($a = 1, (function(e) {
    (function(r) {
      r.parser = function(I, T) {
        return new n(I, T);
      }, r.SAXParser = n, r.SAXStream = l, r.createStream = u, r.MAX_BUFFER_LENGTH = 64 * 1024;
      var t = [
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
      r.EVENTS = [
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
      function n(I, T) {
        if (!(this instanceof n))
          return new n(I, T);
        var H = this;
        i(H), H.q = H.c = "", H.bufferCheckPosition = r.MAX_BUFFER_LENGTH, H.opt = T || {}, H.opt.lowercase = H.opt.lowercase || H.opt.lowercasetags, H.looseCase = H.opt.lowercase ? "toLowerCase" : "toUpperCase", H.tags = [], H.closed = H.closedRoot = H.sawRoot = !1, H.tag = H.error = null, H.strict = !!I, H.noscript = !!(I || H.opt.noscript), H.state = y.BEGIN, H.strictEntities = H.opt.strictEntities, H.ENTITIES = H.strictEntities ? Object.create(r.XML_ENTITIES) : Object.create(r.ENTITIES), H.attribList = [], H.opt.xmlns && (H.ns = Object.create(g)), H.opt.unquotedAttributeValues === void 0 && (H.opt.unquotedAttributeValues = !I), H.trackPosition = H.opt.position !== !1, H.trackPosition && (H.position = H.line = H.column = 0), O(H, "onready");
      }
      Object.create || (Object.create = function(I) {
        function T() {
        }
        T.prototype = I;
        var H = new T();
        return H;
      }), Object.keys || (Object.keys = function(I) {
        var T = [];
        for (var H in I) I.hasOwnProperty(H) && T.push(H);
        return T;
      });
      function s(I) {
        for (var T = Math.max(r.MAX_BUFFER_LENGTH, 10), H = 0, U = 0, de = t.length; U < de; U++) {
          var me = I[t[U]].length;
          if (me > T)
            switch (t[U]) {
              case "textNode":
                k(I);
                break;
              case "cdata":
                P(I, "oncdata", I.cdata), I.cdata = "";
                break;
              case "script":
                P(I, "onscript", I.script), I.script = "";
                break;
              default:
                x(I, "Max buffer length exceeded: " + t[U]);
            }
          H = Math.max(H, me);
        }
        var Ee = r.MAX_BUFFER_LENGTH - H;
        I.bufferCheckPosition = Ee + I.position;
      }
      function i(I) {
        for (var T = 0, H = t.length; T < H; T++)
          I[t[T]] = "";
      }
      function o(I) {
        k(I), I.cdata !== "" && (P(I, "oncdata", I.cdata), I.cdata = ""), I.script !== "" && (P(I, "onscript", I.script), I.script = "");
      }
      n.prototype = {
        end: function() {
          $(this);
        },
        write: ve,
        resume: function() {
          return this.error = null, this;
        },
        close: function() {
          return this.write(null);
        },
        flush: function() {
          o(this);
        }
      };
      var c;
      try {
        c = require("stream").Stream;
      } catch {
        c = function() {
        };
      }
      c || (c = function() {
      });
      var a = r.EVENTS.filter(function(I) {
        return I !== "error" && I !== "end";
      });
      function u(I, T) {
        return new l(I, T);
      }
      function l(I, T) {
        if (!(this instanceof l))
          return new l(I, T);
        c.apply(this), this._parser = new n(I, T), this.writable = !0, this.readable = !0;
        var H = this;
        this._parser.onend = function() {
          H.emit("end");
        }, this._parser.onerror = function(U) {
          H.emit("error", U), H._parser.error = null;
        }, this._decoder = null, a.forEach(function(U) {
          Object.defineProperty(H, "on" + U, {
            get: function() {
              return H._parser["on" + U];
            },
            set: function(de) {
              if (!de)
                return H.removeAllListeners(U), H._parser["on" + U] = de, de;
              H.on(U, de);
            },
            enumerable: !0,
            configurable: !1
          });
        });
      }
      l.prototype = Object.create(c.prototype, {
        constructor: {
          value: l
        }
      }), l.prototype.write = function(I) {
        if (typeof Buffer == "function" && typeof Buffer.isBuffer == "function" && Buffer.isBuffer(I)) {
          if (!this._decoder) {
            var T = wf.StringDecoder;
            this._decoder = new T("utf8");
          }
          I = this._decoder.write(I);
        }
        return this._parser.write(I.toString()), this.emit("data", I), !0;
      }, l.prototype.end = function(I) {
        return I && I.length && this.write(I), this._parser.end(), !0;
      }, l.prototype.on = function(I, T) {
        var H = this;
        return !H._parser["on" + I] && a.indexOf(I) !== -1 && (H._parser["on" + I] = function() {
          var U = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
          U.splice(0, 0, I), H.emit.apply(H, U);
        }), c.prototype.on.call(H, I, T);
      };
      var d = "[CDATA[", f = "DOCTYPE", h = "http://www.w3.org/XML/1998/namespace", E = "http://www.w3.org/2000/xmlns/", g = { xml: h, xmlns: E }, m = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, v = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/, N = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, b = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
      function D(I) {
        return I === " " || I === `
` || I === "\r" || I === "	";
      }
      function M(I) {
        return I === '"' || I === "'";
      }
      function _(I) {
        return I === ">" || D(I);
      }
      function A(I, T) {
        return I.test(T);
      }
      function S(I, T) {
        return !A(I, T);
      }
      var y = 0;
      r.STATE = {
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
      }, r.XML_ENTITIES = {
        amp: "&",
        gt: ">",
        lt: "<",
        quot: '"',
        apos: "'"
      }, r.ENTITIES = {
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
      }, Object.keys(r.ENTITIES).forEach(function(I) {
        var T = r.ENTITIES[I], H = typeof T == "number" ? String.fromCharCode(T) : T;
        r.ENTITIES[I] = H;
      });
      for (var q in r.STATE)
        r.STATE[r.STATE[q]] = q;
      y = r.STATE;
      function O(I, T, H) {
        I[T] && I[T](H);
      }
      function P(I, T, H) {
        I.textNode && k(I), O(I, T, H);
      }
      function k(I) {
        I.textNode = C(I.opt, I.textNode), I.textNode && O(I, "ontext", I.textNode), I.textNode = "";
      }
      function C(I, T) {
        return I.trim && (T = T.trim()), I.normalize && (T = T.replace(/\s+/g, " ")), T;
      }
      function x(I, T) {
        return k(I), I.trackPosition && (T += `
Line: ` + I.line + `
Column: ` + I.column + `
Char: ` + I.c), T = new Error(T), I.error = T, O(I, "onerror", T), I;
      }
      function $(I) {
        return I.sawRoot && !I.closedRoot && L(I, "Unclosed root tag"), I.state !== y.BEGIN && I.state !== y.BEGIN_WHITESPACE && I.state !== y.TEXT && x(I, "Unexpected end"), k(I), I.c = "", I.closed = !0, O(I, "onend"), n.call(I, I.strict, I.opt), I;
      }
      function L(I, T) {
        if (typeof I != "object" || !(I instanceof n))
          throw new Error("bad call to strictFail");
        I.strict && x(I, T);
      }
      function j(I) {
        I.strict || (I.tagName = I.tagName[I.looseCase]());
        var T = I.tags[I.tags.length - 1] || I, H = I.tag = { name: I.tagName, attributes: {} };
        I.opt.xmlns && (H.ns = T.ns), I.attribList.length = 0, P(I, "onopentagstart", H);
      }
      function G(I, T) {
        var H = I.indexOf(":"), U = H < 0 ? ["", I] : I.split(":"), de = U[0], me = U[1];
        return T && I === "xmlns" && (de = "xmlns", me = ""), { prefix: de, local: me };
      }
      function re(I) {
        if (I.strict || (I.attribName = I.attribName[I.looseCase]()), I.attribList.indexOf(I.attribName) !== -1 || I.tag.attributes.hasOwnProperty(I.attribName)) {
          I.attribName = I.attribValue = "";
          return;
        }
        if (I.opt.xmlns) {
          var T = G(I.attribName, !0), H = T.prefix, U = T.local;
          if (H === "xmlns")
            if (U === "xml" && I.attribValue !== h)
              L(
                I,
                "xml: prefix must be bound to " + h + `
Actual: ` + I.attribValue
              );
            else if (U === "xmlns" && I.attribValue !== E)
              L(
                I,
                "xmlns: prefix must be bound to " + E + `
Actual: ` + I.attribValue
              );
            else {
              var de = I.tag, me = I.tags[I.tags.length - 1] || I;
              de.ns === me.ns && (de.ns = Object.create(me.ns)), de.ns[U] = I.attribValue;
            }
          I.attribList.push([I.attribName, I.attribValue]);
        } else
          I.tag.attributes[I.attribName] = I.attribValue, P(I, "onattribute", {
            name: I.attribName,
            value: I.attribValue
          });
        I.attribName = I.attribValue = "";
      }
      function ae(I, T) {
        if (I.opt.xmlns) {
          var H = I.tag, U = G(I.tagName);
          H.prefix = U.prefix, H.local = U.local, H.uri = H.ns[U.prefix] || "", H.prefix && !H.uri && (L(
            I,
            "Unbound namespace prefix: " + JSON.stringify(I.tagName)
          ), H.uri = U.prefix);
          var de = I.tags[I.tags.length - 1] || I;
          H.ns && de.ns !== H.ns && Object.keys(H.ns).forEach(function(p) {
            P(I, "onopennamespace", {
              prefix: p,
              uri: H.ns[p]
            });
          });
          for (var me = 0, Ee = I.attribList.length; me < Ee; me++) {
            var Ne = I.attribList[me], Ae = Ne[0], ze = Ne[1], we = G(Ae, !0), Ge = we.prefix, vt = we.local, mt = Ge === "" ? "" : H.ns[Ge] || "", ut = {
              name: Ae,
              value: ze,
              prefix: Ge,
              local: vt,
              uri: mt
            };
            Ge && Ge !== "xmlns" && !mt && (L(
              I,
              "Unbound namespace prefix: " + JSON.stringify(Ge)
            ), ut.uri = Ge), I.tag.attributes[Ae] = ut, P(I, "onattribute", ut);
          }
          I.attribList.length = 0;
        }
        I.tag.isSelfClosing = !!T, I.sawRoot = !0, I.tags.push(I.tag), P(I, "onopentag", I.tag), T || (!I.noscript && I.tagName.toLowerCase() === "script" ? I.state = y.SCRIPT : I.state = y.TEXT, I.tag = null, I.tagName = ""), I.attribName = I.attribValue = "", I.attribList.length = 0;
      }
      function se(I) {
        if (!I.tagName) {
          L(I, "Weird empty close tag."), I.textNode += "</>", I.state = y.TEXT;
          return;
        }
        if (I.script) {
          if (I.tagName !== "script") {
            I.script += "</" + I.tagName + ">", I.tagName = "", I.state = y.SCRIPT;
            return;
          }
          P(I, "onscript", I.script), I.script = "";
        }
        var T = I.tags.length, H = I.tagName;
        I.strict || (H = H[I.looseCase]());
        for (var U = H; T--; ) {
          var de = I.tags[T];
          if (de.name !== U)
            L(I, "Unexpected close tag");
          else
            break;
        }
        if (T < 0) {
          L(I, "Unmatched closing tag: " + I.tagName), I.textNode += "</" + I.tagName + ">", I.state = y.TEXT;
          return;
        }
        I.tagName = H;
        for (var me = I.tags.length; me-- > T; ) {
          var Ee = I.tag = I.tags.pop();
          I.tagName = I.tag.name, P(I, "onclosetag", I.tagName);
          var Ne = {};
          for (var Ae in Ee.ns)
            Ne[Ae] = Ee.ns[Ae];
          var ze = I.tags[I.tags.length - 1] || I;
          I.opt.xmlns && Ee.ns !== ze.ns && Object.keys(Ee.ns).forEach(function(we) {
            var Ge = Ee.ns[we];
            P(I, "onclosenamespace", { prefix: we, uri: Ge });
          });
        }
        T === 0 && (I.closedRoot = !0), I.tagName = I.attribValue = I.attribName = "", I.attribList.length = 0, I.state = y.TEXT;
      }
      function pe(I) {
        var T = I.entity, H = T.toLowerCase(), U, de = "";
        return I.ENTITIES[T] ? I.ENTITIES[T] : I.ENTITIES[H] ? I.ENTITIES[H] : (T = H, T.charAt(0) === "#" && (T.charAt(1) === "x" ? (T = T.slice(2), U = parseInt(T, 16), de = U.toString(16)) : (T = T.slice(1), U = parseInt(T, 10), de = U.toString(10))), T = T.replace(/^0+/, ""), isNaN(U) || de.toLowerCase() !== T || U < 0 || U > 1114111 ? (L(I, "Invalid character entity"), "&" + I.entity + ";") : String.fromCodePoint(U));
      }
      function Te(I, T) {
        T === "<" ? (I.state = y.OPEN_WAKA, I.startTagPosition = I.position) : D(T) || (L(I, "Non-whitespace before first tag."), I.textNode = T, I.state = y.TEXT);
      }
      function Q(I, T) {
        var H = "";
        return T < I.length && (H = I.charAt(T)), H;
      }
      function ve(I) {
        var T = this;
        if (this.error)
          throw this.error;
        if (T.closed)
          return x(
            T,
            "Cannot write after close. Assign an onready handler."
          );
        if (I === null)
          return $(T);
        typeof I == "object" && (I = I.toString());
        for (var H = 0, U = ""; U = Q(I, H++), T.c = U, !!U; )
          switch (T.trackPosition && (T.position++, U === `
` ? (T.line++, T.column = 0) : T.column++), T.state) {
            case y.BEGIN:
              if (T.state = y.BEGIN_WHITESPACE, U === "\uFEFF")
                continue;
              Te(T, U);
              continue;
            case y.BEGIN_WHITESPACE:
              Te(T, U);
              continue;
            case y.TEXT:
              if (T.sawRoot && !T.closedRoot) {
                for (var me = H - 1; U && U !== "<" && U !== "&"; )
                  U = Q(I, H++), U && T.trackPosition && (T.position++, U === `
` ? (T.line++, T.column = 0) : T.column++);
                T.textNode += I.substring(me, H - 1);
              }
              U === "<" && !(T.sawRoot && T.closedRoot && !T.strict) ? (T.state = y.OPEN_WAKA, T.startTagPosition = T.position) : (!D(U) && (!T.sawRoot || T.closedRoot) && L(T, "Text data outside of root node."), U === "&" ? T.state = y.TEXT_ENTITY : T.textNode += U);
              continue;
            case y.SCRIPT:
              U === "<" ? T.state = y.SCRIPT_ENDING : T.script += U;
              continue;
            case y.SCRIPT_ENDING:
              U === "/" ? T.state = y.CLOSE_TAG : (T.script += "<" + U, T.state = y.SCRIPT);
              continue;
            case y.OPEN_WAKA:
              if (U === "!")
                T.state = y.SGML_DECL, T.sgmlDecl = "";
              else if (!D(U)) if (A(m, U))
                T.state = y.OPEN_TAG, T.tagName = U;
              else if (U === "/")
                T.state = y.CLOSE_TAG, T.tagName = "";
              else if (U === "?")
                T.state = y.PROC_INST, T.procInstName = T.procInstBody = "";
              else {
                if (L(T, "Unencoded <"), T.startTagPosition + 1 < T.position) {
                  var de = T.position - T.startTagPosition;
                  U = new Array(de).join(" ") + U;
                }
                T.textNode += "<" + U, T.state = y.TEXT;
              }
              continue;
            case y.SGML_DECL:
              if (T.sgmlDecl + U === "--") {
                T.state = y.COMMENT, T.comment = "", T.sgmlDecl = "";
                continue;
              }
              T.doctype && T.doctype !== !0 && T.sgmlDecl ? (T.state = y.DOCTYPE_DTD, T.doctype += "<!" + T.sgmlDecl + U, T.sgmlDecl = "") : (T.sgmlDecl + U).toUpperCase() === d ? (P(T, "onopencdata"), T.state = y.CDATA, T.sgmlDecl = "", T.cdata = "") : (T.sgmlDecl + U).toUpperCase() === f ? (T.state = y.DOCTYPE, (T.doctype || T.sawRoot) && L(
                T,
                "Inappropriately located doctype declaration"
              ), T.doctype = "", T.sgmlDecl = "") : U === ">" ? (P(T, "onsgmldeclaration", T.sgmlDecl), T.sgmlDecl = "", T.state = y.TEXT) : (M(U) && (T.state = y.SGML_DECL_QUOTED), T.sgmlDecl += U);
              continue;
            case y.SGML_DECL_QUOTED:
              U === T.q && (T.state = y.SGML_DECL, T.q = ""), T.sgmlDecl += U;
              continue;
            case y.DOCTYPE:
              U === ">" ? (T.state = y.TEXT, P(T, "ondoctype", T.doctype), T.doctype = !0) : (T.doctype += U, U === "[" ? T.state = y.DOCTYPE_DTD : M(U) && (T.state = y.DOCTYPE_QUOTED, T.q = U));
              continue;
            case y.DOCTYPE_QUOTED:
              T.doctype += U, U === T.q && (T.q = "", T.state = y.DOCTYPE);
              continue;
            case y.DOCTYPE_DTD:
              U === "]" ? (T.doctype += U, T.state = y.DOCTYPE) : U === "<" ? (T.state = y.OPEN_WAKA, T.startTagPosition = T.position) : M(U) ? (T.doctype += U, T.state = y.DOCTYPE_DTD_QUOTED, T.q = U) : T.doctype += U;
              continue;
            case y.DOCTYPE_DTD_QUOTED:
              T.doctype += U, U === T.q && (T.state = y.DOCTYPE_DTD, T.q = "");
              continue;
            case y.COMMENT:
              U === "-" ? T.state = y.COMMENT_ENDING : T.comment += U;
              continue;
            case y.COMMENT_ENDING:
              U === "-" ? (T.state = y.COMMENT_ENDED, T.comment = C(T.opt, T.comment), T.comment && P(T, "oncomment", T.comment), T.comment = "") : (T.comment += "-" + U, T.state = y.COMMENT);
              continue;
            case y.COMMENT_ENDED:
              U !== ">" ? (L(T, "Malformed comment"), T.comment += "--" + U, T.state = y.COMMENT) : T.doctype && T.doctype !== !0 ? T.state = y.DOCTYPE_DTD : T.state = y.TEXT;
              continue;
            case y.CDATA:
              for (var me = H - 1; U && U !== "]"; )
                U = Q(I, H++), U && T.trackPosition && (T.position++, U === `
` ? (T.line++, T.column = 0) : T.column++);
              T.cdata += I.substring(me, H - 1), U === "]" && (T.state = y.CDATA_ENDING);
              continue;
            case y.CDATA_ENDING:
              U === "]" ? T.state = y.CDATA_ENDING_2 : (T.cdata += "]" + U, T.state = y.CDATA);
              continue;
            case y.CDATA_ENDING_2:
              U === ">" ? (T.cdata && P(T, "oncdata", T.cdata), P(T, "onclosecdata"), T.cdata = "", T.state = y.TEXT) : U === "]" ? T.cdata += "]" : (T.cdata += "]]" + U, T.state = y.CDATA);
              continue;
            case y.PROC_INST:
              U === "?" ? T.state = y.PROC_INST_ENDING : D(U) ? T.state = y.PROC_INST_BODY : T.procInstName += U;
              continue;
            case y.PROC_INST_BODY:
              if (!T.procInstBody && D(U))
                continue;
              U === "?" ? T.state = y.PROC_INST_ENDING : T.procInstBody += U;
              continue;
            case y.PROC_INST_ENDING:
              U === ">" ? (P(T, "onprocessinginstruction", {
                name: T.procInstName,
                body: T.procInstBody
              }), T.procInstName = T.procInstBody = "", T.state = y.TEXT) : (T.procInstBody += "?" + U, T.state = y.PROC_INST_BODY);
              continue;
            case y.OPEN_TAG:
              A(v, U) ? T.tagName += U : (j(T), U === ">" ? ae(T) : U === "/" ? T.state = y.OPEN_TAG_SLASH : (D(U) || L(T, "Invalid character in tag name"), T.state = y.ATTRIB));
              continue;
            case y.OPEN_TAG_SLASH:
              U === ">" ? (ae(T, !0), se(T)) : (L(
                T,
                "Forward-slash in opening tag not followed by >"
              ), T.state = y.ATTRIB);
              continue;
            case y.ATTRIB:
              if (D(U))
                continue;
              U === ">" ? ae(T) : U === "/" ? T.state = y.OPEN_TAG_SLASH : A(m, U) ? (T.attribName = U, T.attribValue = "", T.state = y.ATTRIB_NAME) : L(T, "Invalid attribute name");
              continue;
            case y.ATTRIB_NAME:
              U === "=" ? T.state = y.ATTRIB_VALUE : U === ">" ? (L(T, "Attribute without value"), T.attribValue = T.attribName, re(T), ae(T)) : D(U) ? T.state = y.ATTRIB_NAME_SAW_WHITE : A(v, U) ? T.attribName += U : L(T, "Invalid attribute name");
              continue;
            case y.ATTRIB_NAME_SAW_WHITE:
              if (U === "=")
                T.state = y.ATTRIB_VALUE;
              else {
                if (D(U))
                  continue;
                L(T, "Attribute without value"), T.tag.attributes[T.attribName] = "", T.attribValue = "", P(T, "onattribute", {
                  name: T.attribName,
                  value: ""
                }), T.attribName = "", U === ">" ? ae(T) : A(m, U) ? (T.attribName = U, T.state = y.ATTRIB_NAME) : (L(T, "Invalid attribute name"), T.state = y.ATTRIB);
              }
              continue;
            case y.ATTRIB_VALUE:
              if (D(U))
                continue;
              M(U) ? (T.q = U, T.state = y.ATTRIB_VALUE_QUOTED) : (T.opt.unquotedAttributeValues || x(T, "Unquoted attribute value"), T.state = y.ATTRIB_VALUE_UNQUOTED, T.attribValue = U);
              continue;
            case y.ATTRIB_VALUE_QUOTED:
              if (U !== T.q) {
                U === "&" ? T.state = y.ATTRIB_VALUE_ENTITY_Q : T.attribValue += U;
                continue;
              }
              re(T), T.q = "", T.state = y.ATTRIB_VALUE_CLOSED;
              continue;
            case y.ATTRIB_VALUE_CLOSED:
              D(U) ? T.state = y.ATTRIB : U === ">" ? ae(T) : U === "/" ? T.state = y.OPEN_TAG_SLASH : A(m, U) ? (L(T, "No whitespace between attributes"), T.attribName = U, T.attribValue = "", T.state = y.ATTRIB_NAME) : L(T, "Invalid attribute name");
              continue;
            case y.ATTRIB_VALUE_UNQUOTED:
              if (!_(U)) {
                U === "&" ? T.state = y.ATTRIB_VALUE_ENTITY_U : T.attribValue += U;
                continue;
              }
              re(T), U === ">" ? ae(T) : T.state = y.ATTRIB;
              continue;
            case y.CLOSE_TAG:
              if (T.tagName)
                U === ">" ? se(T) : A(v, U) ? T.tagName += U : T.script ? (T.script += "</" + T.tagName, T.tagName = "", T.state = y.SCRIPT) : (D(U) || L(T, "Invalid tagname in closing tag"), T.state = y.CLOSE_TAG_SAW_WHITE);
              else {
                if (D(U))
                  continue;
                S(m, U) ? T.script ? (T.script += "</" + U, T.state = y.SCRIPT) : L(T, "Invalid tagname in closing tag.") : T.tagName = U;
              }
              continue;
            case y.CLOSE_TAG_SAW_WHITE:
              if (D(U))
                continue;
              U === ">" ? se(T) : L(T, "Invalid characters in closing tag");
              continue;
            case y.TEXT_ENTITY:
            case y.ATTRIB_VALUE_ENTITY_Q:
            case y.ATTRIB_VALUE_ENTITY_U:
              var Ee, Ne;
              switch (T.state) {
                case y.TEXT_ENTITY:
                  Ee = y.TEXT, Ne = "textNode";
                  break;
                case y.ATTRIB_VALUE_ENTITY_Q:
                  Ee = y.ATTRIB_VALUE_QUOTED, Ne = "attribValue";
                  break;
                case y.ATTRIB_VALUE_ENTITY_U:
                  Ee = y.ATTRIB_VALUE_UNQUOTED, Ne = "attribValue";
                  break;
              }
              if (U === ";") {
                var Ae = pe(T);
                T.opt.unparsedEntities && !Object.values(r.XML_ENTITIES).includes(Ae) ? (T.entity = "", T.state = Ee, T.write(Ae)) : (T[Ne] += Ae, T.entity = "", T.state = Ee);
              } else A(T.entity.length ? b : N, U) ? T.entity += U : (L(T, "Invalid character in entity name"), T[Ne] += "&" + T.entity + U, T.entity = "", T.state = Ee);
              continue;
            default:
              throw new Error(T, "Unknown state: " + T.state);
          }
        return T.position >= T.bufferCheckPosition && s(T), T;
      }
      String.fromCodePoint || (function() {
        var I = String.fromCharCode, T = Math.floor, H = function() {
          var U = 16384, de = [], me, Ee, Ne = -1, Ae = arguments.length;
          if (!Ae)
            return "";
          for (var ze = ""; ++Ne < Ae; ) {
            var we = Number(arguments[Ne]);
            if (!isFinite(we) || // `NaN`, `+Infinity`, or `-Infinity`
            we < 0 || // not a valid Unicode code point
            we > 1114111 || // not a valid Unicode code point
            T(we) !== we)
              throw RangeError("Invalid code point: " + we);
            we <= 65535 ? de.push(we) : (we -= 65536, me = (we >> 10) + 55296, Ee = we % 1024 + 56320, de.push(me, Ee)), (Ne + 1 === Ae || de.length > U) && (ze += I.apply(null, de), de.length = 0);
          }
          return ze;
        };
        Object.defineProperty ? Object.defineProperty(String, "fromCodePoint", {
          value: H,
          configurable: !0,
          writable: !0
        }) : String.fromCodePoint = H;
      })();
    })(e);
  })(ai)), ai;
}
var Xa;
function tm() {
  if (Xa) return Gt;
  Xa = 1, Object.defineProperty(Gt, "__esModule", { value: !0 }), Gt.XElement = void 0, Gt.parseXml = o;
  const e = em(), r = on();
  class t {
    constructor(a) {
      if (this.name = a, this.value = "", this.attributes = null, this.isCData = !1, this.elements = null, !a)
        throw (0, r.newError)("Element name cannot be empty", "ERR_XML_ELEMENT_NAME_EMPTY");
      if (!s(a))
        throw (0, r.newError)(`Invalid element name: ${a}`, "ERR_XML_ELEMENT_INVALID_NAME");
    }
    attribute(a) {
      const u = this.attributes === null ? null : this.attributes[a];
      if (u == null)
        throw (0, r.newError)(`No attribute "${a}"`, "ERR_XML_MISSED_ATTRIBUTE");
      return u;
    }
    removeAttribute(a) {
      this.attributes !== null && delete this.attributes[a];
    }
    element(a, u = !1, l = null) {
      const d = this.elementOrNull(a, u);
      if (d === null)
        throw (0, r.newError)(l || `No element "${a}"`, "ERR_XML_MISSED_ELEMENT");
      return d;
    }
    elementOrNull(a, u = !1) {
      if (this.elements === null)
        return null;
      for (const l of this.elements)
        if (i(l, a, u))
          return l;
      return null;
    }
    getElements(a, u = !1) {
      return this.elements === null ? [] : this.elements.filter((l) => i(l, a, u));
    }
    elementValueOrEmpty(a, u = !1) {
      const l = this.elementOrNull(a, u);
      return l === null ? "" : l.value;
    }
  }
  Gt.XElement = t;
  const n = new RegExp(/^[A-Za-z_][:A-Za-z0-9_-]*$/i);
  function s(c) {
    return n.test(c);
  }
  function i(c, a, u) {
    const l = c.name;
    return l === a || u === !0 && l.length === a.length && l.toLowerCase() === a.toLowerCase();
  }
  function o(c) {
    let a = null;
    const u = e.parser(!0, {}), l = [];
    return u.onopentag = (d) => {
      const f = new t(d.name);
      if (f.attributes = d.attributes, a === null)
        a = f;
      else {
        const h = l[l.length - 1];
        h.elements == null && (h.elements = []), h.elements.push(f);
      }
      l.push(f);
    }, u.onclosetag = () => {
      l.pop();
    }, u.ontext = (d) => {
      l.length > 0 && (l[l.length - 1].value = d);
    }, u.oncdata = (d) => {
      const f = l[l.length - 1];
      f.value = d, f.isCData = !0;
    }, u.onerror = (d) => {
      throw d;
    }, u.write(c), a;
  }
  return Gt;
}
var Ba;
function $e() {
  return Ba || (Ba = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.CURRENT_APP_PACKAGE_FILE_NAME = e.CURRENT_APP_INSTALLER_FILE_NAME = e.XElement = e.parseXml = e.UUID = e.parseDn = e.retry = e.githubUrl = e.getS3LikeProviderBaseUrl = e.ProgressCallbackTransform = e.MemoLazy = e.safeStringifyJson = e.safeGetHeader = e.parseJson = e.HttpExecutor = e.HttpError = e.DigestTransform = e.createHttpError = e.configureRequestUrl = e.configureRequestOptionsFromUrl = e.configureRequestOptions = e.newError = e.CancellationToken = e.CancellationError = void 0, e.asArray = d;
    var r = so();
    Object.defineProperty(e, "CancellationError", { enumerable: !0, get: function() {
      return r.CancellationError;
    } }), Object.defineProperty(e, "CancellationToken", { enumerable: !0, get: function() {
      return r.CancellationToken;
    } });
    var t = on();
    Object.defineProperty(e, "newError", { enumerable: !0, get: function() {
      return t.newError;
    } });
    var n = Yh();
    Object.defineProperty(e, "configureRequestOptions", { enumerable: !0, get: function() {
      return n.configureRequestOptions;
    } }), Object.defineProperty(e, "configureRequestOptionsFromUrl", { enumerable: !0, get: function() {
      return n.configureRequestOptionsFromUrl;
    } }), Object.defineProperty(e, "configureRequestUrl", { enumerable: !0, get: function() {
      return n.configureRequestUrl;
    } }), Object.defineProperty(e, "createHttpError", { enumerable: !0, get: function() {
      return n.createHttpError;
    } }), Object.defineProperty(e, "DigestTransform", { enumerable: !0, get: function() {
      return n.DigestTransform;
    } }), Object.defineProperty(e, "HttpError", { enumerable: !0, get: function() {
      return n.HttpError;
    } }), Object.defineProperty(e, "HttpExecutor", { enumerable: !0, get: function() {
      return n.HttpExecutor;
    } }), Object.defineProperty(e, "parseJson", { enumerable: !0, get: function() {
      return n.parseJson;
    } }), Object.defineProperty(e, "safeGetHeader", { enumerable: !0, get: function() {
      return n.safeGetHeader;
    } }), Object.defineProperty(e, "safeStringifyJson", { enumerable: !0, get: function() {
      return n.safeStringifyJson;
    } });
    var s = zh();
    Object.defineProperty(e, "MemoLazy", { enumerable: !0, get: function() {
      return s.MemoLazy;
    } });
    var i = Xu();
    Object.defineProperty(e, "ProgressCallbackTransform", { enumerable: !0, get: function() {
      return i.ProgressCallbackTransform;
    } });
    var o = Jh();
    Object.defineProperty(e, "getS3LikeProviderBaseUrl", { enumerable: !0, get: function() {
      return o.getS3LikeProviderBaseUrl;
    } }), Object.defineProperty(e, "githubUrl", { enumerable: !0, get: function() {
      return o.githubUrl;
    } });
    var c = Kh();
    Object.defineProperty(e, "retry", { enumerable: !0, get: function() {
      return c.retry;
    } });
    var a = Qh();
    Object.defineProperty(e, "parseDn", { enumerable: !0, get: function() {
      return a.parseDn;
    } });
    var u = Zh();
    Object.defineProperty(e, "UUID", { enumerable: !0, get: function() {
      return u.UUID;
    } });
    var l = tm();
    Object.defineProperty(e, "parseXml", { enumerable: !0, get: function() {
      return l.parseXml;
    } }), Object.defineProperty(e, "XElement", { enumerable: !0, get: function() {
      return l.XElement;
    } }), e.CURRENT_APP_INSTALLER_FILE_NAME = "installer.exe", e.CURRENT_APP_PACKAGE_FILE_NAME = "package.7z";
    function d(f) {
      return f == null ? [] : Array.isArray(f) ? f : [f];
    }
  })(ri)), ri;
}
var He = {}, zr = {}, Nt = {}, Ha;
function Lr() {
  if (Ha) return Nt;
  Ha = 1;
  function e(o) {
    return typeof o > "u" || o === null;
  }
  function r(o) {
    return typeof o == "object" && o !== null;
  }
  function t(o) {
    return Array.isArray(o) ? o : e(o) ? [] : [o];
  }
  function n(o, c) {
    var a, u, l, d;
    if (c)
      for (d = Object.keys(c), a = 0, u = d.length; a < u; a += 1)
        l = d[a], o[l] = c[l];
    return o;
  }
  function s(o, c) {
    var a = "", u;
    for (u = 0; u < c; u += 1)
      a += o;
    return a;
  }
  function i(o) {
    return o === 0 && Number.NEGATIVE_INFINITY === 1 / o;
  }
  return Nt.isNothing = e, Nt.isObject = r, Nt.toArray = t, Nt.repeat = s, Nt.isNegativeZero = i, Nt.extend = n, Nt;
}
var li, ja;
function Cr() {
  if (ja) return li;
  ja = 1;
  function e(t, n) {
    var s = "", i = t.reason || "(unknown reason)";
    return t.mark ? (t.mark.name && (s += 'in "' + t.mark.name + '" '), s += "(" + (t.mark.line + 1) + ":" + (t.mark.column + 1) + ")", !n && t.mark.snippet && (s += `

` + t.mark.snippet), i + " " + s) : i;
  }
  function r(t, n) {
    Error.call(this), this.name = "YAMLException", this.reason = t, this.mark = n, this.message = e(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack || "";
  }
  return r.prototype = Object.create(Error.prototype), r.prototype.constructor = r, r.prototype.toString = function(n) {
    return this.name + ": " + e(this, n);
  }, li = r, li;
}
var ci, Ga;
function rm() {
  if (Ga) return ci;
  Ga = 1;
  var e = Lr();
  function r(s, i, o, c, a) {
    var u = "", l = "", d = Math.floor(a / 2) - 1;
    return c - i > d && (u = " ... ", i = c - d + u.length), o - c > d && (l = " ...", o = c + d - l.length), {
      str: u + s.slice(i, o).replace(/\t/g, "→") + l,
      pos: c - i + u.length
      // relative position
    };
  }
  function t(s, i) {
    return e.repeat(" ", i - s.length) + s;
  }
  function n(s, i) {
    if (i = Object.create(i || null), !s.buffer) return null;
    i.maxLength || (i.maxLength = 79), typeof i.indent != "number" && (i.indent = 1), typeof i.linesBefore != "number" && (i.linesBefore = 3), typeof i.linesAfter != "number" && (i.linesAfter = 2);
    for (var o = /\r?\n|\r|\0/g, c = [0], a = [], u, l = -1; u = o.exec(s.buffer); )
      a.push(u.index), c.push(u.index + u[0].length), s.position <= u.index && l < 0 && (l = c.length - 2);
    l < 0 && (l = c.length - 1);
    var d = "", f, h, E = Math.min(s.line + i.linesAfter, a.length).toString().length, g = i.maxLength - (i.indent + E + 3);
    for (f = 1; f <= i.linesBefore && !(l - f < 0); f++)
      h = r(
        s.buffer,
        c[l - f],
        a[l - f],
        s.position - (c[l] - c[l - f]),
        g
      ), d = e.repeat(" ", i.indent) + t((s.line - f + 1).toString(), E) + " | " + h.str + `
` + d;
    for (h = r(s.buffer, c[l], a[l], s.position, g), d += e.repeat(" ", i.indent) + t((s.line + 1).toString(), E) + " | " + h.str + `
`, d += e.repeat("-", i.indent + E + 3 + h.pos) + `^
`, f = 1; f <= i.linesAfter && !(l + f >= a.length); f++)
      h = r(
        s.buffer,
        c[l + f],
        a[l + f],
        s.position - (c[l] - c[l + f]),
        g
      ), d += e.repeat(" ", i.indent) + t((s.line + f + 1).toString(), E) + " | " + h.str + `
`;
    return d.replace(/\n$/, "");
  }
  return ci = n, ci;
}
var ui, Va;
function We() {
  if (Va) return ui;
  Va = 1;
  var e = Cr(), r = [
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
  ], t = [
    "scalar",
    "sequence",
    "mapping"
  ];
  function n(i) {
    var o = {};
    return i !== null && Object.keys(i).forEach(function(c) {
      i[c].forEach(function(a) {
        o[String(a)] = c;
      });
    }), o;
  }
  function s(i, o) {
    if (o = o || {}, Object.keys(o).forEach(function(c) {
      if (r.indexOf(c) === -1)
        throw new e('Unknown option "' + c + '" is met in definition of "' + i + '" YAML type.');
    }), this.options = o, this.tag = i, this.kind = o.kind || null, this.resolve = o.resolve || function() {
      return !0;
    }, this.construct = o.construct || function(c) {
      return c;
    }, this.instanceOf = o.instanceOf || null, this.predicate = o.predicate || null, this.represent = o.represent || null, this.representName = o.representName || null, this.defaultStyle = o.defaultStyle || null, this.multi = o.multi || !1, this.styleAliases = n(o.styleAliases || null), t.indexOf(this.kind) === -1)
      throw new e('Unknown kind "' + this.kind + '" is specified for "' + i + '" YAML type.');
  }
  return ui = s, ui;
}
var di, Wa;
function Bu() {
  if (Wa) return di;
  Wa = 1;
  var e = Cr(), r = We();
  function t(i, o) {
    var c = [];
    return i[o].forEach(function(a) {
      var u = c.length;
      c.forEach(function(l, d) {
        l.tag === a.tag && l.kind === a.kind && l.multi === a.multi && (u = d);
      }), c[u] = a;
    }), c;
  }
  function n() {
    var i = {
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
    }, o, c;
    function a(u) {
      u.multi ? (i.multi[u.kind].push(u), i.multi.fallback.push(u)) : i[u.kind][u.tag] = i.fallback[u.tag] = u;
    }
    for (o = 0, c = arguments.length; o < c; o += 1)
      arguments[o].forEach(a);
    return i;
  }
  function s(i) {
    return this.extend(i);
  }
  return s.prototype.extend = function(o) {
    var c = [], a = [];
    if (o instanceof r)
      a.push(o);
    else if (Array.isArray(o))
      a = a.concat(o);
    else if (o && (Array.isArray(o.implicit) || Array.isArray(o.explicit)))
      o.implicit && (c = c.concat(o.implicit)), o.explicit && (a = a.concat(o.explicit));
    else
      throw new e("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
    c.forEach(function(l) {
      if (!(l instanceof r))
        throw new e("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      if (l.loadKind && l.loadKind !== "scalar")
        throw new e("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
      if (l.multi)
        throw new e("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
    }), a.forEach(function(l) {
      if (!(l instanceof r))
        throw new e("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    });
    var u = Object.create(s.prototype);
    return u.implicit = (this.implicit || []).concat(c), u.explicit = (this.explicit || []).concat(a), u.compiledImplicit = t(u, "implicit"), u.compiledExplicit = t(u, "explicit"), u.compiledTypeMap = n(u.compiledImplicit, u.compiledExplicit), u;
  }, di = s, di;
}
var fi, Ya;
function Hu() {
  if (Ya) return fi;
  Ya = 1;
  var e = We();
  return fi = new e("tag:yaml.org,2002:str", {
    kind: "scalar",
    construct: function(r) {
      return r !== null ? r : "";
    }
  }), fi;
}
var pi, za;
function ju() {
  if (za) return pi;
  za = 1;
  var e = We();
  return pi = new e("tag:yaml.org,2002:seq", {
    kind: "sequence",
    construct: function(r) {
      return r !== null ? r : [];
    }
  }), pi;
}
var hi, Ja;
function Gu() {
  if (Ja) return hi;
  Ja = 1;
  var e = We();
  return hi = new e("tag:yaml.org,2002:map", {
    kind: "mapping",
    construct: function(r) {
      return r !== null ? r : {};
    }
  }), hi;
}
var mi, Ka;
function Vu() {
  if (Ka) return mi;
  Ka = 1;
  var e = Bu();
  return mi = new e({
    explicit: [
      Hu(),
      ju(),
      Gu()
    ]
  }), mi;
}
var Ei, Qa;
function Wu() {
  if (Qa) return Ei;
  Qa = 1;
  var e = We();
  function r(s) {
    if (s === null) return !0;
    var i = s.length;
    return i === 1 && s === "~" || i === 4 && (s === "null" || s === "Null" || s === "NULL");
  }
  function t() {
    return null;
  }
  function n(s) {
    return s === null;
  }
  return Ei = new e("tag:yaml.org,2002:null", {
    kind: "scalar",
    resolve: r,
    construct: t,
    predicate: n,
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
  }), Ei;
}
var gi, Za;
function Yu() {
  if (Za) return gi;
  Za = 1;
  var e = We();
  function r(s) {
    if (s === null) return !1;
    var i = s.length;
    return i === 4 && (s === "true" || s === "True" || s === "TRUE") || i === 5 && (s === "false" || s === "False" || s === "FALSE");
  }
  function t(s) {
    return s === "true" || s === "True" || s === "TRUE";
  }
  function n(s) {
    return Object.prototype.toString.call(s) === "[object Boolean]";
  }
  return gi = new e("tag:yaml.org,2002:bool", {
    kind: "scalar",
    resolve: r,
    construct: t,
    predicate: n,
    represent: {
      lowercase: function(s) {
        return s ? "true" : "false";
      },
      uppercase: function(s) {
        return s ? "TRUE" : "FALSE";
      },
      camelcase: function(s) {
        return s ? "True" : "False";
      }
    },
    defaultStyle: "lowercase"
  }), gi;
}
var Ti, el;
function zu() {
  if (el) return Ti;
  el = 1;
  var e = Lr(), r = We();
  function t(a) {
    return 48 <= a && a <= 57 || 65 <= a && a <= 70 || 97 <= a && a <= 102;
  }
  function n(a) {
    return 48 <= a && a <= 55;
  }
  function s(a) {
    return 48 <= a && a <= 57;
  }
  function i(a) {
    if (a === null) return !1;
    var u = a.length, l = 0, d = !1, f;
    if (!u) return !1;
    if (f = a[l], (f === "-" || f === "+") && (f = a[++l]), f === "0") {
      if (l + 1 === u) return !0;
      if (f = a[++l], f === "b") {
        for (l++; l < u; l++)
          if (f = a[l], f !== "_") {
            if (f !== "0" && f !== "1") return !1;
            d = !0;
          }
        return d && f !== "_";
      }
      if (f === "x") {
        for (l++; l < u; l++)
          if (f = a[l], f !== "_") {
            if (!t(a.charCodeAt(l))) return !1;
            d = !0;
          }
        return d && f !== "_";
      }
      if (f === "o") {
        for (l++; l < u; l++)
          if (f = a[l], f !== "_") {
            if (!n(a.charCodeAt(l))) return !1;
            d = !0;
          }
        return d && f !== "_";
      }
    }
    if (f === "_") return !1;
    for (; l < u; l++)
      if (f = a[l], f !== "_") {
        if (!s(a.charCodeAt(l)))
          return !1;
        d = !0;
      }
    return !(!d || f === "_");
  }
  function o(a) {
    var u = a, l = 1, d;
    if (u.indexOf("_") !== -1 && (u = u.replace(/_/g, "")), d = u[0], (d === "-" || d === "+") && (d === "-" && (l = -1), u = u.slice(1), d = u[0]), u === "0") return 0;
    if (d === "0") {
      if (u[1] === "b") return l * parseInt(u.slice(2), 2);
      if (u[1] === "x") return l * parseInt(u.slice(2), 16);
      if (u[1] === "o") return l * parseInt(u.slice(2), 8);
    }
    return l * parseInt(u, 10);
  }
  function c(a) {
    return Object.prototype.toString.call(a) === "[object Number]" && a % 1 === 0 && !e.isNegativeZero(a);
  }
  return Ti = new r("tag:yaml.org,2002:int", {
    kind: "scalar",
    resolve: i,
    construct: o,
    predicate: c,
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
  }), Ti;
}
var yi, tl;
function Ju() {
  if (tl) return yi;
  tl = 1;
  var e = Lr(), r = We(), t = new RegExp(
    // 2.5e4, 2.5 and integers
    "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  );
  function n(a) {
    return !(a === null || !t.test(a) || // Quick hack to not allow integers end with `_`
    // Probably should update regexp & check speed
    a[a.length - 1] === "_");
  }
  function s(a) {
    var u, l;
    return u = a.replace(/_/g, "").toLowerCase(), l = u[0] === "-" ? -1 : 1, "+-".indexOf(u[0]) >= 0 && (u = u.slice(1)), u === ".inf" ? l === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : u === ".nan" ? NaN : l * parseFloat(u, 10);
  }
  var i = /^[-+]?[0-9]+e/;
  function o(a, u) {
    var l;
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
    return l = a.toString(10), i.test(l) ? l.replace("e", ".e") : l;
  }
  function c(a) {
    return Object.prototype.toString.call(a) === "[object Number]" && (a % 1 !== 0 || e.isNegativeZero(a));
  }
  return yi = new r("tag:yaml.org,2002:float", {
    kind: "scalar",
    resolve: n,
    construct: s,
    predicate: c,
    represent: o,
    defaultStyle: "lowercase"
  }), yi;
}
var vi, rl;
function Ku() {
  return rl || (rl = 1, vi = Vu().extend({
    implicit: [
      Wu(),
      Yu(),
      zu(),
      Ju()
    ]
  })), vi;
}
var Ai, nl;
function Qu() {
  return nl || (nl = 1, Ai = Ku()), Ai;
}
var Ii, il;
function Zu() {
  if (il) return Ii;
  il = 1;
  var e = We(), r = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
  ), t = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
  );
  function n(o) {
    return o === null ? !1 : r.exec(o) !== null || t.exec(o) !== null;
  }
  function s(o) {
    var c, a, u, l, d, f, h, E = 0, g = null, m, v, N;
    if (c = r.exec(o), c === null && (c = t.exec(o)), c === null) throw new Error("Date resolve error");
    if (a = +c[1], u = +c[2] - 1, l = +c[3], !c[4])
      return new Date(Date.UTC(a, u, l));
    if (d = +c[4], f = +c[5], h = +c[6], c[7]) {
      for (E = c[7].slice(0, 3); E.length < 3; )
        E += "0";
      E = +E;
    }
    return c[9] && (m = +c[10], v = +(c[11] || 0), g = (m * 60 + v) * 6e4, c[9] === "-" && (g = -g)), N = new Date(Date.UTC(a, u, l, d, f, h, E)), g && N.setTime(N.getTime() - g), N;
  }
  function i(o) {
    return o.toISOString();
  }
  return Ii = new e("tag:yaml.org,2002:timestamp", {
    kind: "scalar",
    resolve: n,
    construct: s,
    instanceOf: Date,
    represent: i
  }), Ii;
}
var Si, sl;
function ed() {
  if (sl) return Si;
  sl = 1;
  var e = We();
  function r(t) {
    return t === "<<" || t === null;
  }
  return Si = new e("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: r
  }), Si;
}
var Ni, ol;
function td() {
  if (ol) return Ni;
  ol = 1;
  var e = We(), r = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
  function t(o) {
    if (o === null) return !1;
    var c, a, u = 0, l = o.length, d = r;
    for (a = 0; a < l; a++)
      if (c = d.indexOf(o.charAt(a)), !(c > 64)) {
        if (c < 0) return !1;
        u += 6;
      }
    return u % 8 === 0;
  }
  function n(o) {
    var c, a, u = o.replace(/[\r\n=]/g, ""), l = u.length, d = r, f = 0, h = [];
    for (c = 0; c < l; c++)
      c % 4 === 0 && c && (h.push(f >> 16 & 255), h.push(f >> 8 & 255), h.push(f & 255)), f = f << 6 | d.indexOf(u.charAt(c));
    return a = l % 4 * 6, a === 0 ? (h.push(f >> 16 & 255), h.push(f >> 8 & 255), h.push(f & 255)) : a === 18 ? (h.push(f >> 10 & 255), h.push(f >> 2 & 255)) : a === 12 && h.push(f >> 4 & 255), new Uint8Array(h);
  }
  function s(o) {
    var c = "", a = 0, u, l, d = o.length, f = r;
    for (u = 0; u < d; u++)
      u % 3 === 0 && u && (c += f[a >> 18 & 63], c += f[a >> 12 & 63], c += f[a >> 6 & 63], c += f[a & 63]), a = (a << 8) + o[u];
    return l = d % 3, l === 0 ? (c += f[a >> 18 & 63], c += f[a >> 12 & 63], c += f[a >> 6 & 63], c += f[a & 63]) : l === 2 ? (c += f[a >> 10 & 63], c += f[a >> 4 & 63], c += f[a << 2 & 63], c += f[64]) : l === 1 && (c += f[a >> 2 & 63], c += f[a << 4 & 63], c += f[64], c += f[64]), c;
  }
  function i(o) {
    return Object.prototype.toString.call(o) === "[object Uint8Array]";
  }
  return Ni = new e("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: t,
    construct: n,
    predicate: i,
    represent: s
  }), Ni;
}
var _i, al;
function rd() {
  if (al) return _i;
  al = 1;
  var e = We(), r = Object.prototype.hasOwnProperty, t = Object.prototype.toString;
  function n(i) {
    if (i === null) return !0;
    var o = [], c, a, u, l, d, f = i;
    for (c = 0, a = f.length; c < a; c += 1) {
      if (u = f[c], d = !1, t.call(u) !== "[object Object]") return !1;
      for (l in u)
        if (r.call(u, l))
          if (!d) d = !0;
          else return !1;
      if (!d) return !1;
      if (o.indexOf(l) === -1) o.push(l);
      else return !1;
    }
    return !0;
  }
  function s(i) {
    return i !== null ? i : [];
  }
  return _i = new e("tag:yaml.org,2002:omap", {
    kind: "sequence",
    resolve: n,
    construct: s
  }), _i;
}
var wi, ll;
function nd() {
  if (ll) return wi;
  ll = 1;
  var e = We(), r = Object.prototype.toString;
  function t(s) {
    if (s === null) return !0;
    var i, o, c, a, u, l = s;
    for (u = new Array(l.length), i = 0, o = l.length; i < o; i += 1) {
      if (c = l[i], r.call(c) !== "[object Object]" || (a = Object.keys(c), a.length !== 1)) return !1;
      u[i] = [a[0], c[a[0]]];
    }
    return !0;
  }
  function n(s) {
    if (s === null) return [];
    var i, o, c, a, u, l = s;
    for (u = new Array(l.length), i = 0, o = l.length; i < o; i += 1)
      c = l[i], a = Object.keys(c), u[i] = [a[0], c[a[0]]];
    return u;
  }
  return wi = new e("tag:yaml.org,2002:pairs", {
    kind: "sequence",
    resolve: t,
    construct: n
  }), wi;
}
var Ri, cl;
function id() {
  if (cl) return Ri;
  cl = 1;
  var e = We(), r = Object.prototype.hasOwnProperty;
  function t(s) {
    if (s === null) return !0;
    var i, o = s;
    for (i in o)
      if (r.call(o, i) && o[i] !== null)
        return !1;
    return !0;
  }
  function n(s) {
    return s !== null ? s : {};
  }
  return Ri = new e("tag:yaml.org,2002:set", {
    kind: "mapping",
    resolve: t,
    construct: n
  }), Ri;
}
var Oi, ul;
function oo() {
  return ul || (ul = 1, Oi = Qu().extend({
    implicit: [
      Zu(),
      ed()
    ],
    explicit: [
      td(),
      rd(),
      nd(),
      id()
    ]
  })), Oi;
}
var dl;
function nm() {
  if (dl) return zr;
  dl = 1;
  var e = Lr(), r = Cr(), t = rm(), n = oo(), s = Object.prototype.hasOwnProperty, i = 1, o = 2, c = 3, a = 4, u = 1, l = 2, d = 3, f = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, h = /[\x85\u2028\u2029]/, E = /[,\[\]\{\}]/, g = /^(?:!|!!|![a-z\-]+!)$/i, m = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
  function v(p) {
    return Object.prototype.toString.call(p);
  }
  function N(p) {
    return p === 10 || p === 13;
  }
  function b(p) {
    return p === 9 || p === 32;
  }
  function D(p) {
    return p === 9 || p === 32 || p === 10 || p === 13;
  }
  function M(p) {
    return p === 44 || p === 91 || p === 93 || p === 123 || p === 125;
  }
  function _(p) {
    var B;
    return 48 <= p && p <= 57 ? p - 48 : (B = p | 32, 97 <= B && B <= 102 ? B - 97 + 10 : -1);
  }
  function A(p) {
    return p === 120 ? 2 : p === 117 ? 4 : p === 85 ? 8 : 0;
  }
  function S(p) {
    return 48 <= p && p <= 57 ? p - 48 : -1;
  }
  function y(p) {
    return p === 48 ? "\0" : p === 97 ? "\x07" : p === 98 ? "\b" : p === 116 || p === 9 ? "	" : p === 110 ? `
` : p === 118 ? "\v" : p === 102 ? "\f" : p === 114 ? "\r" : p === 101 ? "\x1B" : p === 32 ? " " : p === 34 ? '"' : p === 47 ? "/" : p === 92 ? "\\" : p === 78 ? "" : p === 95 ? " " : p === 76 ? "\u2028" : p === 80 ? "\u2029" : "";
  }
  function q(p) {
    return p <= 65535 ? String.fromCharCode(p) : String.fromCharCode(
      (p - 65536 >> 10) + 55296,
      (p - 65536 & 1023) + 56320
    );
  }
  function O(p, B, V) {
    B === "__proto__" ? Object.defineProperty(p, B, {
      configurable: !0,
      enumerable: !0,
      writable: !0,
      value: V
    }) : p[B] = V;
  }
  for (var P = new Array(256), k = new Array(256), C = 0; C < 256; C++)
    P[C] = y(C) ? 1 : 0, k[C] = y(C);
  function x(p, B) {
    this.input = p, this.filename = B.filename || null, this.schema = B.schema || n, this.onWarning = B.onWarning || null, this.legacy = B.legacy || !1, this.json = B.json || !1, this.listener = B.listener || null, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = p.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.firstTabInLine = -1, this.documents = [];
  }
  function $(p, B) {
    var V = {
      name: p.filename,
      buffer: p.input.slice(0, -1),
      // omit trailing \0
      position: p.position,
      line: p.line,
      column: p.position - p.lineStart
    };
    return V.snippet = t(V), new r(B, V);
  }
  function L(p, B) {
    throw $(p, B);
  }
  function j(p, B) {
    p.onWarning && p.onWarning.call(null, $(p, B));
  }
  var G = {
    YAML: function(B, V, ne) {
      var W, te, Z;
      B.version !== null && L(B, "duplication of %YAML directive"), ne.length !== 1 && L(B, "YAML directive accepts exactly one argument"), W = /^([0-9]+)\.([0-9]+)$/.exec(ne[0]), W === null && L(B, "ill-formed argument of the YAML directive"), te = parseInt(W[1], 10), Z = parseInt(W[2], 10), te !== 1 && L(B, "unacceptable YAML version of the document"), B.version = ne[0], B.checkLineBreaks = Z < 2, Z !== 1 && Z !== 2 && j(B, "unsupported YAML version of the document");
    },
    TAG: function(B, V, ne) {
      var W, te;
      ne.length !== 2 && L(B, "TAG directive accepts exactly two arguments"), W = ne[0], te = ne[1], g.test(W) || L(B, "ill-formed tag handle (first argument) of the TAG directive"), s.call(B.tagMap, W) && L(B, 'there is a previously declared suffix for "' + W + '" tag handle'), m.test(te) || L(B, "ill-formed tag prefix (second argument) of the TAG directive");
      try {
        te = decodeURIComponent(te);
      } catch {
        L(B, "tag prefix is malformed: " + te);
      }
      B.tagMap[W] = te;
    }
  };
  function re(p, B, V, ne) {
    var W, te, Z, oe;
    if (B < V) {
      if (oe = p.input.slice(B, V), ne)
        for (W = 0, te = oe.length; W < te; W += 1)
          Z = oe.charCodeAt(W), Z === 9 || 32 <= Z && Z <= 1114111 || L(p, "expected valid JSON character");
      else f.test(oe) && L(p, "the stream contains non-printable characters");
      p.result += oe;
    }
  }
  function ae(p, B, V, ne) {
    var W, te, Z, oe;
    for (e.isObject(V) || L(p, "cannot merge mappings; the provided source object is unacceptable"), W = Object.keys(V), Z = 0, oe = W.length; Z < oe; Z += 1)
      te = W[Z], s.call(B, te) || (O(B, te, V[te]), ne[te] = !0);
  }
  function se(p, B, V, ne, W, te, Z, oe, ue) {
    var Re, Oe;
    if (Array.isArray(W))
      for (W = Array.prototype.slice.call(W), Re = 0, Oe = W.length; Re < Oe; Re += 1)
        Array.isArray(W[Re]) && L(p, "nested arrays are not supported inside keys"), typeof W == "object" && v(W[Re]) === "[object Object]" && (W[Re] = "[object Object]");
    if (typeof W == "object" && v(W) === "[object Object]" && (W = "[object Object]"), W = String(W), B === null && (B = {}), ne === "tag:yaml.org,2002:merge")
      if (Array.isArray(te))
        for (Re = 0, Oe = te.length; Re < Oe; Re += 1)
          ae(p, B, te[Re], V);
      else
        ae(p, B, te, V);
    else
      !p.json && !s.call(V, W) && s.call(B, W) && (p.line = Z || p.line, p.lineStart = oe || p.lineStart, p.position = ue || p.position, L(p, "duplicated mapping key")), O(B, W, te), delete V[W];
    return B;
  }
  function pe(p) {
    var B;
    B = p.input.charCodeAt(p.position), B === 10 ? p.position++ : B === 13 ? (p.position++, p.input.charCodeAt(p.position) === 10 && p.position++) : L(p, "a line break is expected"), p.line += 1, p.lineStart = p.position, p.firstTabInLine = -1;
  }
  function Te(p, B, V) {
    for (var ne = 0, W = p.input.charCodeAt(p.position); W !== 0; ) {
      for (; b(W); )
        W === 9 && p.firstTabInLine === -1 && (p.firstTabInLine = p.position), W = p.input.charCodeAt(++p.position);
      if (B && W === 35)
        do
          W = p.input.charCodeAt(++p.position);
        while (W !== 10 && W !== 13 && W !== 0);
      if (N(W))
        for (pe(p), W = p.input.charCodeAt(p.position), ne++, p.lineIndent = 0; W === 32; )
          p.lineIndent++, W = p.input.charCodeAt(++p.position);
      else
        break;
    }
    return V !== -1 && ne !== 0 && p.lineIndent < V && j(p, "deficient indentation"), ne;
  }
  function Q(p) {
    var B = p.position, V;
    return V = p.input.charCodeAt(B), !!((V === 45 || V === 46) && V === p.input.charCodeAt(B + 1) && V === p.input.charCodeAt(B + 2) && (B += 3, V = p.input.charCodeAt(B), V === 0 || D(V)));
  }
  function ve(p, B) {
    B === 1 ? p.result += " " : B > 1 && (p.result += e.repeat(`
`, B - 1));
  }
  function I(p, B, V) {
    var ne, W, te, Z, oe, ue, Re, Oe, ge = p.kind, w = p.result, X;
    if (X = p.input.charCodeAt(p.position), D(X) || M(X) || X === 35 || X === 38 || X === 42 || X === 33 || X === 124 || X === 62 || X === 39 || X === 34 || X === 37 || X === 64 || X === 96 || (X === 63 || X === 45) && (W = p.input.charCodeAt(p.position + 1), D(W) || V && M(W)))
      return !1;
    for (p.kind = "scalar", p.result = "", te = Z = p.position, oe = !1; X !== 0; ) {
      if (X === 58) {
        if (W = p.input.charCodeAt(p.position + 1), D(W) || V && M(W))
          break;
      } else if (X === 35) {
        if (ne = p.input.charCodeAt(p.position - 1), D(ne))
          break;
      } else {
        if (p.position === p.lineStart && Q(p) || V && M(X))
          break;
        if (N(X))
          if (ue = p.line, Re = p.lineStart, Oe = p.lineIndent, Te(p, !1, -1), p.lineIndent >= B) {
            oe = !0, X = p.input.charCodeAt(p.position);
            continue;
          } else {
            p.position = Z, p.line = ue, p.lineStart = Re, p.lineIndent = Oe;
            break;
          }
      }
      oe && (re(p, te, Z, !1), ve(p, p.line - ue), te = Z = p.position, oe = !1), b(X) || (Z = p.position + 1), X = p.input.charCodeAt(++p.position);
    }
    return re(p, te, Z, !1), p.result ? !0 : (p.kind = ge, p.result = w, !1);
  }
  function T(p, B) {
    var V, ne, W;
    if (V = p.input.charCodeAt(p.position), V !== 39)
      return !1;
    for (p.kind = "scalar", p.result = "", p.position++, ne = W = p.position; (V = p.input.charCodeAt(p.position)) !== 0; )
      if (V === 39)
        if (re(p, ne, p.position, !0), V = p.input.charCodeAt(++p.position), V === 39)
          ne = p.position, p.position++, W = p.position;
        else
          return !0;
      else N(V) ? (re(p, ne, W, !0), ve(p, Te(p, !1, B)), ne = W = p.position) : p.position === p.lineStart && Q(p) ? L(p, "unexpected end of the document within a single quoted scalar") : (p.position++, W = p.position);
    L(p, "unexpected end of the stream within a single quoted scalar");
  }
  function H(p, B) {
    var V, ne, W, te, Z, oe;
    if (oe = p.input.charCodeAt(p.position), oe !== 34)
      return !1;
    for (p.kind = "scalar", p.result = "", p.position++, V = ne = p.position; (oe = p.input.charCodeAt(p.position)) !== 0; ) {
      if (oe === 34)
        return re(p, V, p.position, !0), p.position++, !0;
      if (oe === 92) {
        if (re(p, V, p.position, !0), oe = p.input.charCodeAt(++p.position), N(oe))
          Te(p, !1, B);
        else if (oe < 256 && P[oe])
          p.result += k[oe], p.position++;
        else if ((Z = A(oe)) > 0) {
          for (W = Z, te = 0; W > 0; W--)
            oe = p.input.charCodeAt(++p.position), (Z = _(oe)) >= 0 ? te = (te << 4) + Z : L(p, "expected hexadecimal character");
          p.result += q(te), p.position++;
        } else
          L(p, "unknown escape sequence");
        V = ne = p.position;
      } else N(oe) ? (re(p, V, ne, !0), ve(p, Te(p, !1, B)), V = ne = p.position) : p.position === p.lineStart && Q(p) ? L(p, "unexpected end of the document within a double quoted scalar") : (p.position++, ne = p.position);
    }
    L(p, "unexpected end of the stream within a double quoted scalar");
  }
  function U(p, B) {
    var V = !0, ne, W, te, Z = p.tag, oe, ue = p.anchor, Re, Oe, ge, w, X, Y = /* @__PURE__ */ Object.create(null), z, J, ie, ee;
    if (ee = p.input.charCodeAt(p.position), ee === 91)
      Oe = 93, X = !1, oe = [];
    else if (ee === 123)
      Oe = 125, X = !0, oe = {};
    else
      return !1;
    for (p.anchor !== null && (p.anchorMap[p.anchor] = oe), ee = p.input.charCodeAt(++p.position); ee !== 0; ) {
      if (Te(p, !0, B), ee = p.input.charCodeAt(p.position), ee === Oe)
        return p.position++, p.tag = Z, p.anchor = ue, p.kind = X ? "mapping" : "sequence", p.result = oe, !0;
      V ? ee === 44 && L(p, "expected the node content, but found ','") : L(p, "missed comma between flow collection entries"), J = z = ie = null, ge = w = !1, ee === 63 && (Re = p.input.charCodeAt(p.position + 1), D(Re) && (ge = w = !0, p.position++, Te(p, !0, B))), ne = p.line, W = p.lineStart, te = p.position, we(p, B, i, !1, !0), J = p.tag, z = p.result, Te(p, !0, B), ee = p.input.charCodeAt(p.position), (w || p.line === ne) && ee === 58 && (ge = !0, ee = p.input.charCodeAt(++p.position), Te(p, !0, B), we(p, B, i, !1, !0), ie = p.result), X ? se(p, oe, Y, J, z, ie, ne, W, te) : ge ? oe.push(se(p, null, Y, J, z, ie, ne, W, te)) : oe.push(z), Te(p, !0, B), ee = p.input.charCodeAt(p.position), ee === 44 ? (V = !0, ee = p.input.charCodeAt(++p.position)) : V = !1;
    }
    L(p, "unexpected end of the stream within a flow collection");
  }
  function de(p, B) {
    var V, ne, W = u, te = !1, Z = !1, oe = B, ue = 0, Re = !1, Oe, ge;
    if (ge = p.input.charCodeAt(p.position), ge === 124)
      ne = !1;
    else if (ge === 62)
      ne = !0;
    else
      return !1;
    for (p.kind = "scalar", p.result = ""; ge !== 0; )
      if (ge = p.input.charCodeAt(++p.position), ge === 43 || ge === 45)
        u === W ? W = ge === 43 ? d : l : L(p, "repeat of a chomping mode identifier");
      else if ((Oe = S(ge)) >= 0)
        Oe === 0 ? L(p, "bad explicit indentation width of a block scalar; it cannot be less than one") : Z ? L(p, "repeat of an indentation width identifier") : (oe = B + Oe - 1, Z = !0);
      else
        break;
    if (b(ge)) {
      do
        ge = p.input.charCodeAt(++p.position);
      while (b(ge));
      if (ge === 35)
        do
          ge = p.input.charCodeAt(++p.position);
        while (!N(ge) && ge !== 0);
    }
    for (; ge !== 0; ) {
      for (pe(p), p.lineIndent = 0, ge = p.input.charCodeAt(p.position); (!Z || p.lineIndent < oe) && ge === 32; )
        p.lineIndent++, ge = p.input.charCodeAt(++p.position);
      if (!Z && p.lineIndent > oe && (oe = p.lineIndent), N(ge)) {
        ue++;
        continue;
      }
      if (p.lineIndent < oe) {
        W === d ? p.result += e.repeat(`
`, te ? 1 + ue : ue) : W === u && te && (p.result += `
`);
        break;
      }
      for (ne ? b(ge) ? (Re = !0, p.result += e.repeat(`
`, te ? 1 + ue : ue)) : Re ? (Re = !1, p.result += e.repeat(`
`, ue + 1)) : ue === 0 ? te && (p.result += " ") : p.result += e.repeat(`
`, ue) : p.result += e.repeat(`
`, te ? 1 + ue : ue), te = !0, Z = !0, ue = 0, V = p.position; !N(ge) && ge !== 0; )
        ge = p.input.charCodeAt(++p.position);
      re(p, V, p.position, !1);
    }
    return !0;
  }
  function me(p, B) {
    var V, ne = p.tag, W = p.anchor, te = [], Z, oe = !1, ue;
    if (p.firstTabInLine !== -1) return !1;
    for (p.anchor !== null && (p.anchorMap[p.anchor] = te), ue = p.input.charCodeAt(p.position); ue !== 0 && (p.firstTabInLine !== -1 && (p.position = p.firstTabInLine, L(p, "tab characters must not be used in indentation")), !(ue !== 45 || (Z = p.input.charCodeAt(p.position + 1), !D(Z)))); ) {
      if (oe = !0, p.position++, Te(p, !0, -1) && p.lineIndent <= B) {
        te.push(null), ue = p.input.charCodeAt(p.position);
        continue;
      }
      if (V = p.line, we(p, B, c, !1, !0), te.push(p.result), Te(p, !0, -1), ue = p.input.charCodeAt(p.position), (p.line === V || p.lineIndent > B) && ue !== 0)
        L(p, "bad indentation of a sequence entry");
      else if (p.lineIndent < B)
        break;
    }
    return oe ? (p.tag = ne, p.anchor = W, p.kind = "sequence", p.result = te, !0) : !1;
  }
  function Ee(p, B, V) {
    var ne, W, te, Z, oe, ue, Re = p.tag, Oe = p.anchor, ge = {}, w = /* @__PURE__ */ Object.create(null), X = null, Y = null, z = null, J = !1, ie = !1, ee;
    if (p.firstTabInLine !== -1) return !1;
    for (p.anchor !== null && (p.anchorMap[p.anchor] = ge), ee = p.input.charCodeAt(p.position); ee !== 0; ) {
      if (!J && p.firstTabInLine !== -1 && (p.position = p.firstTabInLine, L(p, "tab characters must not be used in indentation")), ne = p.input.charCodeAt(p.position + 1), te = p.line, (ee === 63 || ee === 58) && D(ne))
        ee === 63 ? (J && (se(p, ge, w, X, Y, null, Z, oe, ue), X = Y = z = null), ie = !0, J = !0, W = !0) : J ? (J = !1, W = !0) : L(p, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), p.position += 1, ee = ne;
      else {
        if (Z = p.line, oe = p.lineStart, ue = p.position, !we(p, V, o, !1, !0))
          break;
        if (p.line === te) {
          for (ee = p.input.charCodeAt(p.position); b(ee); )
            ee = p.input.charCodeAt(++p.position);
          if (ee === 58)
            ee = p.input.charCodeAt(++p.position), D(ee) || L(p, "a whitespace character is expected after the key-value separator within a block mapping"), J && (se(p, ge, w, X, Y, null, Z, oe, ue), X = Y = z = null), ie = !0, J = !1, W = !1, X = p.tag, Y = p.result;
          else if (ie)
            L(p, "can not read an implicit mapping pair; a colon is missed");
          else
            return p.tag = Re, p.anchor = Oe, !0;
        } else if (ie)
          L(p, "can not read a block mapping entry; a multiline key may not be an implicit key");
        else
          return p.tag = Re, p.anchor = Oe, !0;
      }
      if ((p.line === te || p.lineIndent > B) && (J && (Z = p.line, oe = p.lineStart, ue = p.position), we(p, B, a, !0, W) && (J ? Y = p.result : z = p.result), J || (se(p, ge, w, X, Y, z, Z, oe, ue), X = Y = z = null), Te(p, !0, -1), ee = p.input.charCodeAt(p.position)), (p.line === te || p.lineIndent > B) && ee !== 0)
        L(p, "bad indentation of a mapping entry");
      else if (p.lineIndent < B)
        break;
    }
    return J && se(p, ge, w, X, Y, null, Z, oe, ue), ie && (p.tag = Re, p.anchor = Oe, p.kind = "mapping", p.result = ge), ie;
  }
  function Ne(p) {
    var B, V = !1, ne = !1, W, te, Z;
    if (Z = p.input.charCodeAt(p.position), Z !== 33) return !1;
    if (p.tag !== null && L(p, "duplication of a tag property"), Z = p.input.charCodeAt(++p.position), Z === 60 ? (V = !0, Z = p.input.charCodeAt(++p.position)) : Z === 33 ? (ne = !0, W = "!!", Z = p.input.charCodeAt(++p.position)) : W = "!", B = p.position, V) {
      do
        Z = p.input.charCodeAt(++p.position);
      while (Z !== 0 && Z !== 62);
      p.position < p.length ? (te = p.input.slice(B, p.position), Z = p.input.charCodeAt(++p.position)) : L(p, "unexpected end of the stream within a verbatim tag");
    } else {
      for (; Z !== 0 && !D(Z); )
        Z === 33 && (ne ? L(p, "tag suffix cannot contain exclamation marks") : (W = p.input.slice(B - 1, p.position + 1), g.test(W) || L(p, "named tag handle cannot contain such characters"), ne = !0, B = p.position + 1)), Z = p.input.charCodeAt(++p.position);
      te = p.input.slice(B, p.position), E.test(te) && L(p, "tag suffix cannot contain flow indicator characters");
    }
    te && !m.test(te) && L(p, "tag name cannot contain such characters: " + te);
    try {
      te = decodeURIComponent(te);
    } catch {
      L(p, "tag name is malformed: " + te);
    }
    return V ? p.tag = te : s.call(p.tagMap, W) ? p.tag = p.tagMap[W] + te : W === "!" ? p.tag = "!" + te : W === "!!" ? p.tag = "tag:yaml.org,2002:" + te : L(p, 'undeclared tag handle "' + W + '"'), !0;
  }
  function Ae(p) {
    var B, V;
    if (V = p.input.charCodeAt(p.position), V !== 38) return !1;
    for (p.anchor !== null && L(p, "duplication of an anchor property"), V = p.input.charCodeAt(++p.position), B = p.position; V !== 0 && !D(V) && !M(V); )
      V = p.input.charCodeAt(++p.position);
    return p.position === B && L(p, "name of an anchor node must contain at least one character"), p.anchor = p.input.slice(B, p.position), !0;
  }
  function ze(p) {
    var B, V, ne;
    if (ne = p.input.charCodeAt(p.position), ne !== 42) return !1;
    for (ne = p.input.charCodeAt(++p.position), B = p.position; ne !== 0 && !D(ne) && !M(ne); )
      ne = p.input.charCodeAt(++p.position);
    return p.position === B && L(p, "name of an alias node must contain at least one character"), V = p.input.slice(B, p.position), s.call(p.anchorMap, V) || L(p, 'unidentified alias "' + V + '"'), p.result = p.anchorMap[V], Te(p, !0, -1), !0;
  }
  function we(p, B, V, ne, W) {
    var te, Z, oe, ue = 1, Re = !1, Oe = !1, ge, w, X, Y, z, J;
    if (p.listener !== null && p.listener("open", p), p.tag = null, p.anchor = null, p.kind = null, p.result = null, te = Z = oe = a === V || c === V, ne && Te(p, !0, -1) && (Re = !0, p.lineIndent > B ? ue = 1 : p.lineIndent === B ? ue = 0 : p.lineIndent < B && (ue = -1)), ue === 1)
      for (; Ne(p) || Ae(p); )
        Te(p, !0, -1) ? (Re = !0, oe = te, p.lineIndent > B ? ue = 1 : p.lineIndent === B ? ue = 0 : p.lineIndent < B && (ue = -1)) : oe = !1;
    if (oe && (oe = Re || W), (ue === 1 || a === V) && (i === V || o === V ? z = B : z = B + 1, J = p.position - p.lineStart, ue === 1 ? oe && (me(p, J) || Ee(p, J, z)) || U(p, z) ? Oe = !0 : (Z && de(p, z) || T(p, z) || H(p, z) ? Oe = !0 : ze(p) ? (Oe = !0, (p.tag !== null || p.anchor !== null) && L(p, "alias node should not have any properties")) : I(p, z, i === V) && (Oe = !0, p.tag === null && (p.tag = "?")), p.anchor !== null && (p.anchorMap[p.anchor] = p.result)) : ue === 0 && (Oe = oe && me(p, J))), p.tag === null)
      p.anchor !== null && (p.anchorMap[p.anchor] = p.result);
    else if (p.tag === "?") {
      for (p.result !== null && p.kind !== "scalar" && L(p, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + p.kind + '"'), ge = 0, w = p.implicitTypes.length; ge < w; ge += 1)
        if (Y = p.implicitTypes[ge], Y.resolve(p.result)) {
          p.result = Y.construct(p.result), p.tag = Y.tag, p.anchor !== null && (p.anchorMap[p.anchor] = p.result);
          break;
        }
    } else if (p.tag !== "!") {
      if (s.call(p.typeMap[p.kind || "fallback"], p.tag))
        Y = p.typeMap[p.kind || "fallback"][p.tag];
      else
        for (Y = null, X = p.typeMap.multi[p.kind || "fallback"], ge = 0, w = X.length; ge < w; ge += 1)
          if (p.tag.slice(0, X[ge].tag.length) === X[ge].tag) {
            Y = X[ge];
            break;
          }
      Y || L(p, "unknown tag !<" + p.tag + ">"), p.result !== null && Y.kind !== p.kind && L(p, "unacceptable node kind for !<" + p.tag + '> tag; it should be "' + Y.kind + '", not "' + p.kind + '"'), Y.resolve(p.result, p.tag) ? (p.result = Y.construct(p.result, p.tag), p.anchor !== null && (p.anchorMap[p.anchor] = p.result)) : L(p, "cannot resolve a node with !<" + p.tag + "> explicit tag");
    }
    return p.listener !== null && p.listener("close", p), p.tag !== null || p.anchor !== null || Oe;
  }
  function Ge(p) {
    var B = p.position, V, ne, W, te = !1, Z;
    for (p.version = null, p.checkLineBreaks = p.legacy, p.tagMap = /* @__PURE__ */ Object.create(null), p.anchorMap = /* @__PURE__ */ Object.create(null); (Z = p.input.charCodeAt(p.position)) !== 0 && (Te(p, !0, -1), Z = p.input.charCodeAt(p.position), !(p.lineIndent > 0 || Z !== 37)); ) {
      for (te = !0, Z = p.input.charCodeAt(++p.position), V = p.position; Z !== 0 && !D(Z); )
        Z = p.input.charCodeAt(++p.position);
      for (ne = p.input.slice(V, p.position), W = [], ne.length < 1 && L(p, "directive name must not be less than one character in length"); Z !== 0; ) {
        for (; b(Z); )
          Z = p.input.charCodeAt(++p.position);
        if (Z === 35) {
          do
            Z = p.input.charCodeAt(++p.position);
          while (Z !== 0 && !N(Z));
          break;
        }
        if (N(Z)) break;
        for (V = p.position; Z !== 0 && !D(Z); )
          Z = p.input.charCodeAt(++p.position);
        W.push(p.input.slice(V, p.position));
      }
      Z !== 0 && pe(p), s.call(G, ne) ? G[ne](p, ne, W) : j(p, 'unknown document directive "' + ne + '"');
    }
    if (Te(p, !0, -1), p.lineIndent === 0 && p.input.charCodeAt(p.position) === 45 && p.input.charCodeAt(p.position + 1) === 45 && p.input.charCodeAt(p.position + 2) === 45 ? (p.position += 3, Te(p, !0, -1)) : te && L(p, "directives end mark is expected"), we(p, p.lineIndent - 1, a, !1, !0), Te(p, !0, -1), p.checkLineBreaks && h.test(p.input.slice(B, p.position)) && j(p, "non-ASCII line breaks are interpreted as content"), p.documents.push(p.result), p.position === p.lineStart && Q(p)) {
      p.input.charCodeAt(p.position) === 46 && (p.position += 3, Te(p, !0, -1));
      return;
    }
    if (p.position < p.length - 1)
      L(p, "end of the stream or a document separator is expected");
    else
      return;
  }
  function vt(p, B) {
    p = String(p), B = B || {}, p.length !== 0 && (p.charCodeAt(p.length - 1) !== 10 && p.charCodeAt(p.length - 1) !== 13 && (p += `
`), p.charCodeAt(0) === 65279 && (p = p.slice(1)));
    var V = new x(p, B), ne = p.indexOf("\0");
    for (ne !== -1 && (V.position = ne, L(V, "null byte is not allowed in input")), V.input += "\0"; V.input.charCodeAt(V.position) === 32; )
      V.lineIndent += 1, V.position += 1;
    for (; V.position < V.length - 1; )
      Ge(V);
    return V.documents;
  }
  function mt(p, B, V) {
    B !== null && typeof B == "object" && typeof V > "u" && (V = B, B = null);
    var ne = vt(p, V);
    if (typeof B != "function")
      return ne;
    for (var W = 0, te = ne.length; W < te; W += 1)
      B(ne[W]);
  }
  function ut(p, B) {
    var V = vt(p, B);
    if (V.length !== 0) {
      if (V.length === 1)
        return V[0];
      throw new r("expected a single document in the stream, but found more");
    }
  }
  return zr.loadAll = mt, zr.load = ut, zr;
}
var bi = {}, fl;
function im() {
  if (fl) return bi;
  fl = 1;
  var e = Lr(), r = Cr(), t = oo(), n = Object.prototype.toString, s = Object.prototype.hasOwnProperty, i = 65279, o = 9, c = 10, a = 13, u = 32, l = 33, d = 34, f = 35, h = 37, E = 38, g = 39, m = 42, v = 44, N = 45, b = 58, D = 61, M = 62, _ = 63, A = 64, S = 91, y = 93, q = 96, O = 123, P = 124, k = 125, C = {};
  C[0] = "\\0", C[7] = "\\a", C[8] = "\\b", C[9] = "\\t", C[10] = "\\n", C[11] = "\\v", C[12] = "\\f", C[13] = "\\r", C[27] = "\\e", C[34] = '\\"', C[92] = "\\\\", C[133] = "\\N", C[160] = "\\_", C[8232] = "\\L", C[8233] = "\\P";
  var x = [
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
  ], $ = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
  function L(w, X) {
    var Y, z, J, ie, ee, le, he;
    if (X === null) return {};
    for (Y = {}, z = Object.keys(X), J = 0, ie = z.length; J < ie; J += 1)
      ee = z[J], le = String(X[ee]), ee.slice(0, 2) === "!!" && (ee = "tag:yaml.org,2002:" + ee.slice(2)), he = w.compiledTypeMap.fallback[ee], he && s.call(he.styleAliases, le) && (le = he.styleAliases[le]), Y[ee] = le;
    return Y;
  }
  function j(w) {
    var X, Y, z;
    if (X = w.toString(16).toUpperCase(), w <= 255)
      Y = "x", z = 2;
    else if (w <= 65535)
      Y = "u", z = 4;
    else if (w <= 4294967295)
      Y = "U", z = 8;
    else
      throw new r("code point within a string may not be greater than 0xFFFFFFFF");
    return "\\" + Y + e.repeat("0", z - X.length) + X;
  }
  var G = 1, re = 2;
  function ae(w) {
    this.schema = w.schema || t, this.indent = Math.max(1, w.indent || 2), this.noArrayIndent = w.noArrayIndent || !1, this.skipInvalid = w.skipInvalid || !1, this.flowLevel = e.isNothing(w.flowLevel) ? -1 : w.flowLevel, this.styleMap = L(this.schema, w.styles || null), this.sortKeys = w.sortKeys || !1, this.lineWidth = w.lineWidth || 80, this.noRefs = w.noRefs || !1, this.noCompatMode = w.noCompatMode || !1, this.condenseFlow = w.condenseFlow || !1, this.quotingType = w.quotingType === '"' ? re : G, this.forceQuotes = w.forceQuotes || !1, this.replacer = typeof w.replacer == "function" ? w.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
  }
  function se(w, X) {
    for (var Y = e.repeat(" ", X), z = 0, J = -1, ie = "", ee, le = w.length; z < le; )
      J = w.indexOf(`
`, z), J === -1 ? (ee = w.slice(z), z = le) : (ee = w.slice(z, J + 1), z = J + 1), ee.length && ee !== `
` && (ie += Y), ie += ee;
    return ie;
  }
  function pe(w, X) {
    return `
` + e.repeat(" ", w.indent * X);
  }
  function Te(w, X) {
    var Y, z, J;
    for (Y = 0, z = w.implicitTypes.length; Y < z; Y += 1)
      if (J = w.implicitTypes[Y], J.resolve(X))
        return !0;
    return !1;
  }
  function Q(w) {
    return w === u || w === o;
  }
  function ve(w) {
    return 32 <= w && w <= 126 || 161 <= w && w <= 55295 && w !== 8232 && w !== 8233 || 57344 <= w && w <= 65533 && w !== i || 65536 <= w && w <= 1114111;
  }
  function I(w) {
    return ve(w) && w !== i && w !== a && w !== c;
  }
  function T(w, X, Y) {
    var z = I(w), J = z && !Q(w);
    return (
      // ns-plain-safe
      (Y ? (
        // c = flow-in
        z
      ) : z && w !== v && w !== S && w !== y && w !== O && w !== k) && w !== f && !(X === b && !J) || I(X) && !Q(X) && w === f || X === b && J
    );
  }
  function H(w) {
    return ve(w) && w !== i && !Q(w) && w !== N && w !== _ && w !== b && w !== v && w !== S && w !== y && w !== O && w !== k && w !== f && w !== E && w !== m && w !== l && w !== P && w !== D && w !== M && w !== g && w !== d && w !== h && w !== A && w !== q;
  }
  function U(w) {
    return !Q(w) && w !== b;
  }
  function de(w, X) {
    var Y = w.charCodeAt(X), z;
    return Y >= 55296 && Y <= 56319 && X + 1 < w.length && (z = w.charCodeAt(X + 1), z >= 56320 && z <= 57343) ? (Y - 55296) * 1024 + z - 56320 + 65536 : Y;
  }
  function me(w) {
    var X = /^\n* /;
    return X.test(w);
  }
  var Ee = 1, Ne = 2, Ae = 3, ze = 4, we = 5;
  function Ge(w, X, Y, z, J, ie, ee, le) {
    var he, Se = 0, De = null, Ue = !1, Le = !1, Ht = z !== -1, nt = -1, Ot = H(de(w, 0)) && U(de(w, w.length - 1));
    if (X || ee)
      for (he = 0; he < w.length; Se >= 65536 ? he += 2 : he++) {
        if (Se = de(w, he), !ve(Se))
          return we;
        Ot = Ot && T(Se, De, le), De = Se;
      }
    else {
      for (he = 0; he < w.length; Se >= 65536 ? he += 2 : he++) {
        if (Se = de(w, he), Se === c)
          Ue = !0, Ht && (Le = Le || // Foldable line = too long, and not more-indented.
          he - nt - 1 > z && w[nt + 1] !== " ", nt = he);
        else if (!ve(Se))
          return we;
        Ot = Ot && T(Se, De, le), De = Se;
      }
      Le = Le || Ht && he - nt - 1 > z && w[nt + 1] !== " ";
    }
    return !Ue && !Le ? Ot && !ee && !J(w) ? Ee : ie === re ? we : Ne : Y > 9 && me(w) ? we : ee ? ie === re ? we : Ne : Le ? ze : Ae;
  }
  function vt(w, X, Y, z, J) {
    w.dump = (function() {
      if (X.length === 0)
        return w.quotingType === re ? '""' : "''";
      if (!w.noCompatMode && (x.indexOf(X) !== -1 || $.test(X)))
        return w.quotingType === re ? '"' + X + '"' : "'" + X + "'";
      var ie = w.indent * Math.max(1, Y), ee = w.lineWidth === -1 ? -1 : Math.max(Math.min(w.lineWidth, 40), w.lineWidth - ie), le = z || w.flowLevel > -1 && Y >= w.flowLevel;
      function he(Se) {
        return Te(w, Se);
      }
      switch (Ge(
        X,
        le,
        w.indent,
        ee,
        he,
        w.quotingType,
        w.forceQuotes && !z,
        J
      )) {
        case Ee:
          return X;
        case Ne:
          return "'" + X.replace(/'/g, "''") + "'";
        case Ae:
          return "|" + mt(X, w.indent) + ut(se(X, ie));
        case ze:
          return ">" + mt(X, w.indent) + ut(se(p(X, ee), ie));
        case we:
          return '"' + V(X) + '"';
        default:
          throw new r("impossible error: invalid scalar style");
      }
    })();
  }
  function mt(w, X) {
    var Y = me(w) ? String(X) : "", z = w[w.length - 1] === `
`, J = z && (w[w.length - 2] === `
` || w === `
`), ie = J ? "+" : z ? "" : "-";
    return Y + ie + `
`;
  }
  function ut(w) {
    return w[w.length - 1] === `
` ? w.slice(0, -1) : w;
  }
  function p(w, X) {
    for (var Y = /(\n+)([^\n]*)/g, z = (function() {
      var Se = w.indexOf(`
`);
      return Se = Se !== -1 ? Se : w.length, Y.lastIndex = Se, B(w.slice(0, Se), X);
    })(), J = w[0] === `
` || w[0] === " ", ie, ee; ee = Y.exec(w); ) {
      var le = ee[1], he = ee[2];
      ie = he[0] === " ", z += le + (!J && !ie && he !== "" ? `
` : "") + B(he, X), J = ie;
    }
    return z;
  }
  function B(w, X) {
    if (w === "" || w[0] === " ") return w;
    for (var Y = / [^ ]/g, z, J = 0, ie, ee = 0, le = 0, he = ""; z = Y.exec(w); )
      le = z.index, le - J > X && (ie = ee > J ? ee : le, he += `
` + w.slice(J, ie), J = ie + 1), ee = le;
    return he += `
`, w.length - J > X && ee > J ? he += w.slice(J, ee) + `
` + w.slice(ee + 1) : he += w.slice(J), he.slice(1);
  }
  function V(w) {
    for (var X = "", Y = 0, z, J = 0; J < w.length; Y >= 65536 ? J += 2 : J++)
      Y = de(w, J), z = C[Y], !z && ve(Y) ? (X += w[J], Y >= 65536 && (X += w[J + 1])) : X += z || j(Y);
    return X;
  }
  function ne(w, X, Y) {
    var z = "", J = w.tag, ie, ee, le;
    for (ie = 0, ee = Y.length; ie < ee; ie += 1)
      le = Y[ie], w.replacer && (le = w.replacer.call(Y, String(ie), le)), (ue(w, X, le, !1, !1) || typeof le > "u" && ue(w, X, null, !1, !1)) && (z !== "" && (z += "," + (w.condenseFlow ? "" : " ")), z += w.dump);
    w.tag = J, w.dump = "[" + z + "]";
  }
  function W(w, X, Y, z) {
    var J = "", ie = w.tag, ee, le, he;
    for (ee = 0, le = Y.length; ee < le; ee += 1)
      he = Y[ee], w.replacer && (he = w.replacer.call(Y, String(ee), he)), (ue(w, X + 1, he, !0, !0, !1, !0) || typeof he > "u" && ue(w, X + 1, null, !0, !0, !1, !0)) && ((!z || J !== "") && (J += pe(w, X)), w.dump && c === w.dump.charCodeAt(0) ? J += "-" : J += "- ", J += w.dump);
    w.tag = ie, w.dump = J || "[]";
  }
  function te(w, X, Y) {
    var z = "", J = w.tag, ie = Object.keys(Y), ee, le, he, Se, De;
    for (ee = 0, le = ie.length; ee < le; ee += 1)
      De = "", z !== "" && (De += ", "), w.condenseFlow && (De += '"'), he = ie[ee], Se = Y[he], w.replacer && (Se = w.replacer.call(Y, he, Se)), ue(w, X, he, !1, !1) && (w.dump.length > 1024 && (De += "? "), De += w.dump + (w.condenseFlow ? '"' : "") + ":" + (w.condenseFlow ? "" : " "), ue(w, X, Se, !1, !1) && (De += w.dump, z += De));
    w.tag = J, w.dump = "{" + z + "}";
  }
  function Z(w, X, Y, z) {
    var J = "", ie = w.tag, ee = Object.keys(Y), le, he, Se, De, Ue, Le;
    if (w.sortKeys === !0)
      ee.sort();
    else if (typeof w.sortKeys == "function")
      ee.sort(w.sortKeys);
    else if (w.sortKeys)
      throw new r("sortKeys must be a boolean or a function");
    for (le = 0, he = ee.length; le < he; le += 1)
      Le = "", (!z || J !== "") && (Le += pe(w, X)), Se = ee[le], De = Y[Se], w.replacer && (De = w.replacer.call(Y, Se, De)), ue(w, X + 1, Se, !0, !0, !0) && (Ue = w.tag !== null && w.tag !== "?" || w.dump && w.dump.length > 1024, Ue && (w.dump && c === w.dump.charCodeAt(0) ? Le += "?" : Le += "? "), Le += w.dump, Ue && (Le += pe(w, X)), ue(w, X + 1, De, !0, Ue) && (w.dump && c === w.dump.charCodeAt(0) ? Le += ":" : Le += ": ", Le += w.dump, J += Le));
    w.tag = ie, w.dump = J || "{}";
  }
  function oe(w, X, Y) {
    var z, J, ie, ee, le, he;
    for (J = Y ? w.explicitTypes : w.implicitTypes, ie = 0, ee = J.length; ie < ee; ie += 1)
      if (le = J[ie], (le.instanceOf || le.predicate) && (!le.instanceOf || typeof X == "object" && X instanceof le.instanceOf) && (!le.predicate || le.predicate(X))) {
        if (Y ? le.multi && le.representName ? w.tag = le.representName(X) : w.tag = le.tag : w.tag = "?", le.represent) {
          if (he = w.styleMap[le.tag] || le.defaultStyle, n.call(le.represent) === "[object Function]")
            z = le.represent(X, he);
          else if (s.call(le.represent, he))
            z = le.represent[he](X, he);
          else
            throw new r("!<" + le.tag + '> tag resolver accepts not "' + he + '" style');
          w.dump = z;
        }
        return !0;
      }
    return !1;
  }
  function ue(w, X, Y, z, J, ie, ee) {
    w.tag = null, w.dump = Y, oe(w, Y, !1) || oe(w, Y, !0);
    var le = n.call(w.dump), he = z, Se;
    z && (z = w.flowLevel < 0 || w.flowLevel > X);
    var De = le === "[object Object]" || le === "[object Array]", Ue, Le;
    if (De && (Ue = w.duplicates.indexOf(Y), Le = Ue !== -1), (w.tag !== null && w.tag !== "?" || Le || w.indent !== 2 && X > 0) && (J = !1), Le && w.usedDuplicates[Ue])
      w.dump = "*ref_" + Ue;
    else {
      if (De && Le && !w.usedDuplicates[Ue] && (w.usedDuplicates[Ue] = !0), le === "[object Object]")
        z && Object.keys(w.dump).length !== 0 ? (Z(w, X, w.dump, J), Le && (w.dump = "&ref_" + Ue + w.dump)) : (te(w, X, w.dump), Le && (w.dump = "&ref_" + Ue + " " + w.dump));
      else if (le === "[object Array]")
        z && w.dump.length !== 0 ? (w.noArrayIndent && !ee && X > 0 ? W(w, X - 1, w.dump, J) : W(w, X, w.dump, J), Le && (w.dump = "&ref_" + Ue + w.dump)) : (ne(w, X, w.dump), Le && (w.dump = "&ref_" + Ue + " " + w.dump));
      else if (le === "[object String]")
        w.tag !== "?" && vt(w, w.dump, X, ie, he);
      else {
        if (le === "[object Undefined]")
          return !1;
        if (w.skipInvalid) return !1;
        throw new r("unacceptable kind of an object to dump " + le);
      }
      w.tag !== null && w.tag !== "?" && (Se = encodeURI(
        w.tag[0] === "!" ? w.tag.slice(1) : w.tag
      ).replace(/!/g, "%21"), w.tag[0] === "!" ? Se = "!" + Se : Se.slice(0, 18) === "tag:yaml.org,2002:" ? Se = "!!" + Se.slice(18) : Se = "!<" + Se + ">", w.dump = Se + " " + w.dump);
    }
    return !0;
  }
  function Re(w, X) {
    var Y = [], z = [], J, ie;
    for (Oe(w, Y, z), J = 0, ie = z.length; J < ie; J += 1)
      X.duplicates.push(Y[z[J]]);
    X.usedDuplicates = new Array(ie);
  }
  function Oe(w, X, Y) {
    var z, J, ie;
    if (w !== null && typeof w == "object")
      if (J = X.indexOf(w), J !== -1)
        Y.indexOf(J) === -1 && Y.push(J);
      else if (X.push(w), Array.isArray(w))
        for (J = 0, ie = w.length; J < ie; J += 1)
          Oe(w[J], X, Y);
      else
        for (z = Object.keys(w), J = 0, ie = z.length; J < ie; J += 1)
          Oe(w[z[J]], X, Y);
  }
  function ge(w, X) {
    X = X || {};
    var Y = new ae(X);
    Y.noRefs || Re(w, Y);
    var z = w;
    return Y.replacer && (z = Y.replacer.call({ "": z }, "", z)), ue(Y, 0, z, !0, !0) ? Y.dump + `
` : "";
  }
  return bi.dump = ge, bi;
}
var pl;
function ao() {
  if (pl) return He;
  pl = 1;
  var e = nm(), r = im();
  function t(n, s) {
    return function() {
      throw new Error("Function yaml." + n + " is removed in js-yaml 4. Use yaml." + s + " instead, which is now safe by default.");
    };
  }
  return He.Type = We(), He.Schema = Bu(), He.FAILSAFE_SCHEMA = Vu(), He.JSON_SCHEMA = Ku(), He.CORE_SCHEMA = Qu(), He.DEFAULT_SCHEMA = oo(), He.load = e.load, He.loadAll = e.loadAll, He.dump = r.dump, He.YAMLException = Cr(), He.types = {
    binary: td(),
    float: Ju(),
    map: Gu(),
    null: Wu(),
    pairs: nd(),
    set: id(),
    timestamp: Zu(),
    bool: Yu(),
    int: zu(),
    merge: ed(),
    omap: rd(),
    seq: ju(),
    str: Hu()
  }, He.safeLoad = t("safeLoad", "load"), He.safeLoadAll = t("safeLoadAll", "loadAll"), He.safeDump = t("safeDump", "dump"), He;
}
var lr = {}, hl;
function sm() {
  if (hl) return lr;
  hl = 1, Object.defineProperty(lr, "__esModule", { value: !0 }), lr.Lazy = void 0;
  class e {
    constructor(t) {
      this._value = null, this.creator = t;
    }
    get hasValue() {
      return this.creator == null;
    }
    get value() {
      if (this.creator == null)
        return this._value;
      const t = this.creator();
      return this.value = t, t;
    }
    set value(t) {
      this._value = t, this.creator = null;
    }
  }
  return lr.Lazy = e, lr;
}
var Jr = { exports: {} }, Li, ml;
function an() {
  if (ml) return Li;
  ml = 1;
  const e = "2.0.0", r = 256, t = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
  9007199254740991, n = 16, s = r - 6;
  return Li = {
    MAX_LENGTH: r,
    MAX_SAFE_COMPONENT_LENGTH: n,
    MAX_SAFE_BUILD_LENGTH: s,
    MAX_SAFE_INTEGER: t,
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
  }, Li;
}
var Ci, El;
function ln() {
  return El || (El = 1, Ci = typeof process == "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...r) => console.error("SEMVER", ...r) : () => {
  }), Ci;
}
var gl;
function Dr() {
  return gl || (gl = 1, (function(e, r) {
    const {
      MAX_SAFE_COMPONENT_LENGTH: t,
      MAX_SAFE_BUILD_LENGTH: n,
      MAX_LENGTH: s
    } = an(), i = ln();
    r = e.exports = {};
    const o = r.re = [], c = r.safeRe = [], a = r.src = [], u = r.safeSrc = [], l = r.t = {};
    let d = 0;
    const f = "[a-zA-Z0-9-]", h = [
      ["\\s", 1],
      ["\\d", s],
      [f, n]
    ], E = (m) => {
      for (const [v, N] of h)
        m = m.split(`${v}*`).join(`${v}{0,${N}}`).split(`${v}+`).join(`${v}{1,${N}}`);
      return m;
    }, g = (m, v, N) => {
      const b = E(v), D = d++;
      i(m, D, v), l[m] = D, a[D] = v, u[D] = b, o[D] = new RegExp(v, N ? "g" : void 0), c[D] = new RegExp(b, N ? "g" : void 0);
    };
    g("NUMERICIDENTIFIER", "0|[1-9]\\d*"), g("NUMERICIDENTIFIERLOOSE", "\\d+"), g("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${f}*`), g("MAINVERSION", `(${a[l.NUMERICIDENTIFIER]})\\.(${a[l.NUMERICIDENTIFIER]})\\.(${a[l.NUMERICIDENTIFIER]})`), g("MAINVERSIONLOOSE", `(${a[l.NUMERICIDENTIFIERLOOSE]})\\.(${a[l.NUMERICIDENTIFIERLOOSE]})\\.(${a[l.NUMERICIDENTIFIERLOOSE]})`), g("PRERELEASEIDENTIFIER", `(?:${a[l.NONNUMERICIDENTIFIER]}|${a[l.NUMERICIDENTIFIER]})`), g("PRERELEASEIDENTIFIERLOOSE", `(?:${a[l.NONNUMERICIDENTIFIER]}|${a[l.NUMERICIDENTIFIERLOOSE]})`), g("PRERELEASE", `(?:-(${a[l.PRERELEASEIDENTIFIER]}(?:\\.${a[l.PRERELEASEIDENTIFIER]})*))`), g("PRERELEASELOOSE", `(?:-?(${a[l.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${a[l.PRERELEASEIDENTIFIERLOOSE]})*))`), g("BUILDIDENTIFIER", `${f}+`), g("BUILD", `(?:\\+(${a[l.BUILDIDENTIFIER]}(?:\\.${a[l.BUILDIDENTIFIER]})*))`), g("FULLPLAIN", `v?${a[l.MAINVERSION]}${a[l.PRERELEASE]}?${a[l.BUILD]}?`), g("FULL", `^${a[l.FULLPLAIN]}$`), g("LOOSEPLAIN", `[v=\\s]*${a[l.MAINVERSIONLOOSE]}${a[l.PRERELEASELOOSE]}?${a[l.BUILD]}?`), g("LOOSE", `^${a[l.LOOSEPLAIN]}$`), g("GTLT", "((?:<|>)?=?)"), g("XRANGEIDENTIFIERLOOSE", `${a[l.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`), g("XRANGEIDENTIFIER", `${a[l.NUMERICIDENTIFIER]}|x|X|\\*`), g("XRANGEPLAIN", `[v=\\s]*(${a[l.XRANGEIDENTIFIER]})(?:\\.(${a[l.XRANGEIDENTIFIER]})(?:\\.(${a[l.XRANGEIDENTIFIER]})(?:${a[l.PRERELEASE]})?${a[l.BUILD]}?)?)?`), g("XRANGEPLAINLOOSE", `[v=\\s]*(${a[l.XRANGEIDENTIFIERLOOSE]})(?:\\.(${a[l.XRANGEIDENTIFIERLOOSE]})(?:\\.(${a[l.XRANGEIDENTIFIERLOOSE]})(?:${a[l.PRERELEASELOOSE]})?${a[l.BUILD]}?)?)?`), g("XRANGE", `^${a[l.GTLT]}\\s*${a[l.XRANGEPLAIN]}$`), g("XRANGELOOSE", `^${a[l.GTLT]}\\s*${a[l.XRANGEPLAINLOOSE]}$`), g("COERCEPLAIN", `(^|[^\\d])(\\d{1,${t}})(?:\\.(\\d{1,${t}}))?(?:\\.(\\d{1,${t}}))?`), g("COERCE", `${a[l.COERCEPLAIN]}(?:$|[^\\d])`), g("COERCEFULL", a[l.COERCEPLAIN] + `(?:${a[l.PRERELEASE]})?(?:${a[l.BUILD]})?(?:$|[^\\d])`), g("COERCERTL", a[l.COERCE], !0), g("COERCERTLFULL", a[l.COERCEFULL], !0), g("LONETILDE", "(?:~>?)"), g("TILDETRIM", `(\\s*)${a[l.LONETILDE]}\\s+`, !0), r.tildeTrimReplace = "$1~", g("TILDE", `^${a[l.LONETILDE]}${a[l.XRANGEPLAIN]}$`), g("TILDELOOSE", `^${a[l.LONETILDE]}${a[l.XRANGEPLAINLOOSE]}$`), g("LONECARET", "(?:\\^)"), g("CARETTRIM", `(\\s*)${a[l.LONECARET]}\\s+`, !0), r.caretTrimReplace = "$1^", g("CARET", `^${a[l.LONECARET]}${a[l.XRANGEPLAIN]}$`), g("CARETLOOSE", `^${a[l.LONECARET]}${a[l.XRANGEPLAINLOOSE]}$`), g("COMPARATORLOOSE", `^${a[l.GTLT]}\\s*(${a[l.LOOSEPLAIN]})$|^$`), g("COMPARATOR", `^${a[l.GTLT]}\\s*(${a[l.FULLPLAIN]})$|^$`), g("COMPARATORTRIM", `(\\s*)${a[l.GTLT]}\\s*(${a[l.LOOSEPLAIN]}|${a[l.XRANGEPLAIN]})`, !0), r.comparatorTrimReplace = "$1$2$3", g("HYPHENRANGE", `^\\s*(${a[l.XRANGEPLAIN]})\\s+-\\s+(${a[l.XRANGEPLAIN]})\\s*$`), g("HYPHENRANGELOOSE", `^\\s*(${a[l.XRANGEPLAINLOOSE]})\\s+-\\s+(${a[l.XRANGEPLAINLOOSE]})\\s*$`), g("STAR", "(<|>)?=?\\s*\\*"), g("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$"), g("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  })(Jr, Jr.exports)), Jr.exports;
}
var Di, Tl;
function lo() {
  if (Tl) return Di;
  Tl = 1;
  const e = Object.freeze({ loose: !0 }), r = Object.freeze({});
  return Di = (n) => n ? typeof n != "object" ? e : n : r, Di;
}
var xi, yl;
function sd() {
  if (yl) return xi;
  yl = 1;
  const e = /^[0-9]+$/, r = (n, s) => {
    if (typeof n == "number" && typeof s == "number")
      return n === s ? 0 : n < s ? -1 : 1;
    const i = e.test(n), o = e.test(s);
    return i && o && (n = +n, s = +s), n === s ? 0 : i && !o ? -1 : o && !i ? 1 : n < s ? -1 : 1;
  };
  return xi = {
    compareIdentifiers: r,
    rcompareIdentifiers: (n, s) => r(s, n)
  }, xi;
}
var Pi, vl;
function Ye() {
  if (vl) return Pi;
  vl = 1;
  const e = ln(), { MAX_LENGTH: r, MAX_SAFE_INTEGER: t } = an(), { safeRe: n, t: s } = Dr(), i = lo(), { compareIdentifiers: o } = sd();
  class c {
    constructor(u, l) {
      if (l = i(l), u instanceof c) {
        if (u.loose === !!l.loose && u.includePrerelease === !!l.includePrerelease)
          return u;
        u = u.version;
      } else if (typeof u != "string")
        throw new TypeError(`Invalid version. Must be a string. Got type "${typeof u}".`);
      if (u.length > r)
        throw new TypeError(
          `version is longer than ${r} characters`
        );
      e("SemVer", u, l), this.options = l, this.loose = !!l.loose, this.includePrerelease = !!l.includePrerelease;
      const d = u.trim().match(l.loose ? n[s.LOOSE] : n[s.FULL]);
      if (!d)
        throw new TypeError(`Invalid Version: ${u}`);
      if (this.raw = u, this.major = +d[1], this.minor = +d[2], this.patch = +d[3], this.major > t || this.major < 0)
        throw new TypeError("Invalid major version");
      if (this.minor > t || this.minor < 0)
        throw new TypeError("Invalid minor version");
      if (this.patch > t || this.patch < 0)
        throw new TypeError("Invalid patch version");
      d[4] ? this.prerelease = d[4].split(".").map((f) => {
        if (/^[0-9]+$/.test(f)) {
          const h = +f;
          if (h >= 0 && h < t)
            return h;
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
      if (e("SemVer.compare", this.version, this.options, u), !(u instanceof c)) {
        if (typeof u == "string" && u === this.version)
          return 0;
        u = new c(u, this.options);
      }
      return u.version === this.version ? 0 : this.compareMain(u) || this.comparePre(u);
    }
    compareMain(u) {
      return u instanceof c || (u = new c(u, this.options)), this.major < u.major ? -1 : this.major > u.major ? 1 : this.minor < u.minor ? -1 : this.minor > u.minor ? 1 : this.patch < u.patch ? -1 : this.patch > u.patch ? 1 : 0;
    }
    comparePre(u) {
      if (u instanceof c || (u = new c(u, this.options)), this.prerelease.length && !u.prerelease.length)
        return -1;
      if (!this.prerelease.length && u.prerelease.length)
        return 1;
      if (!this.prerelease.length && !u.prerelease.length)
        return 0;
      let l = 0;
      do {
        const d = this.prerelease[l], f = u.prerelease[l];
        if (e("prerelease compare", l, d, f), d === void 0 && f === void 0)
          return 0;
        if (f === void 0)
          return 1;
        if (d === void 0)
          return -1;
        if (d === f)
          continue;
        return o(d, f);
      } while (++l);
    }
    compareBuild(u) {
      u instanceof c || (u = new c(u, this.options));
      let l = 0;
      do {
        const d = this.build[l], f = u.build[l];
        if (e("build compare", l, d, f), d === void 0 && f === void 0)
          return 0;
        if (f === void 0)
          return 1;
        if (d === void 0)
          return -1;
        if (d === f)
          continue;
        return o(d, f);
      } while (++l);
    }
    // preminor will bump the version up to the next minor release, and immediately
    // down to pre-release. premajor and prepatch work the same way.
    inc(u, l, d) {
      if (u.startsWith("pre")) {
        if (!l && d === !1)
          throw new Error("invalid increment argument: identifier is empty");
        if (l) {
          const f = `-${l}`.match(this.options.loose ? n[s.PRERELEASELOOSE] : n[s.PRERELEASE]);
          if (!f || f[1] !== l)
            throw new Error(`invalid identifier: ${l}`);
        }
      }
      switch (u) {
        case "premajor":
          this.prerelease.length = 0, this.patch = 0, this.minor = 0, this.major++, this.inc("pre", l, d);
          break;
        case "preminor":
          this.prerelease.length = 0, this.patch = 0, this.minor++, this.inc("pre", l, d);
          break;
        case "prepatch":
          this.prerelease.length = 0, this.inc("patch", l, d), this.inc("pre", l, d);
          break;
        // If the input is a non-prerelease version, this acts the same as
        // prepatch.
        case "prerelease":
          this.prerelease.length === 0 && this.inc("patch", l, d), this.inc("pre", l, d);
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
            let h = this.prerelease.length;
            for (; --h >= 0; )
              typeof this.prerelease[h] == "number" && (this.prerelease[h]++, h = -2);
            if (h === -1) {
              if (l === this.prerelease.join(".") && d === !1)
                throw new Error("invalid increment argument: identifier already exists");
              this.prerelease.push(f);
            }
          }
          if (l) {
            let h = [l, f];
            d === !1 && (h = [l]), o(this.prerelease[0], l) === 0 ? isNaN(this.prerelease[1]) && (this.prerelease = h) : this.prerelease = h;
          }
          break;
        }
        default:
          throw new Error(`invalid increment argument: ${u}`);
      }
      return this.raw = this.format(), this.build.length && (this.raw += `+${this.build.join(".")}`), this;
    }
  }
  return Pi = c, Pi;
}
var Ui, Al;
function Zt() {
  if (Al) return Ui;
  Al = 1;
  const e = Ye();
  return Ui = (t, n, s = !1) => {
    if (t instanceof e)
      return t;
    try {
      return new e(t, n);
    } catch (i) {
      if (!s)
        return null;
      throw i;
    }
  }, Ui;
}
var Fi, Il;
function om() {
  if (Il) return Fi;
  Il = 1;
  const e = Zt();
  return Fi = (t, n) => {
    const s = e(t, n);
    return s ? s.version : null;
  }, Fi;
}
var ki, Sl;
function am() {
  if (Sl) return ki;
  Sl = 1;
  const e = Zt();
  return ki = (t, n) => {
    const s = e(t.trim().replace(/^[=v]+/, ""), n);
    return s ? s.version : null;
  }, ki;
}
var Mi, Nl;
function lm() {
  if (Nl) return Mi;
  Nl = 1;
  const e = Ye();
  return Mi = (t, n, s, i, o) => {
    typeof s == "string" && (o = i, i = s, s = void 0);
    try {
      return new e(
        t instanceof e ? t.version : t,
        s
      ).inc(n, i, o).version;
    } catch {
      return null;
    }
  }, Mi;
}
var qi, _l;
function cm() {
  if (_l) return qi;
  _l = 1;
  const e = Zt();
  return qi = (t, n) => {
    const s = e(t, null, !0), i = e(n, null, !0), o = s.compare(i);
    if (o === 0)
      return null;
    const c = o > 0, a = c ? s : i, u = c ? i : s, l = !!a.prerelease.length;
    if (!!u.prerelease.length && !l) {
      if (!u.patch && !u.minor)
        return "major";
      if (u.compareMain(a) === 0)
        return u.minor && !u.patch ? "minor" : "patch";
    }
    const f = l ? "pre" : "";
    return s.major !== i.major ? f + "major" : s.minor !== i.minor ? f + "minor" : s.patch !== i.patch ? f + "patch" : "prerelease";
  }, qi;
}
var $i, wl;
function um() {
  if (wl) return $i;
  wl = 1;
  const e = Ye();
  return $i = (t, n) => new e(t, n).major, $i;
}
var Xi, Rl;
function dm() {
  if (Rl) return Xi;
  Rl = 1;
  const e = Ye();
  return Xi = (t, n) => new e(t, n).minor, Xi;
}
var Bi, Ol;
function fm() {
  if (Ol) return Bi;
  Ol = 1;
  const e = Ye();
  return Bi = (t, n) => new e(t, n).patch, Bi;
}
var Hi, bl;
function pm() {
  if (bl) return Hi;
  bl = 1;
  const e = Zt();
  return Hi = (t, n) => {
    const s = e(t, n);
    return s && s.prerelease.length ? s.prerelease : null;
  }, Hi;
}
var ji, Ll;
function at() {
  if (Ll) return ji;
  Ll = 1;
  const e = Ye();
  return ji = (t, n, s) => new e(t, s).compare(new e(n, s)), ji;
}
var Gi, Cl;
function hm() {
  if (Cl) return Gi;
  Cl = 1;
  const e = at();
  return Gi = (t, n, s) => e(n, t, s), Gi;
}
var Vi, Dl;
function mm() {
  if (Dl) return Vi;
  Dl = 1;
  const e = at();
  return Vi = (t, n) => e(t, n, !0), Vi;
}
var Wi, xl;
function co() {
  if (xl) return Wi;
  xl = 1;
  const e = Ye();
  return Wi = (t, n, s) => {
    const i = new e(t, s), o = new e(n, s);
    return i.compare(o) || i.compareBuild(o);
  }, Wi;
}
var Yi, Pl;
function Em() {
  if (Pl) return Yi;
  Pl = 1;
  const e = co();
  return Yi = (t, n) => t.sort((s, i) => e(s, i, n)), Yi;
}
var zi, Ul;
function gm() {
  if (Ul) return zi;
  Ul = 1;
  const e = co();
  return zi = (t, n) => t.sort((s, i) => e(i, s, n)), zi;
}
var Ji, Fl;
function cn() {
  if (Fl) return Ji;
  Fl = 1;
  const e = at();
  return Ji = (t, n, s) => e(t, n, s) > 0, Ji;
}
var Ki, kl;
function uo() {
  if (kl) return Ki;
  kl = 1;
  const e = at();
  return Ki = (t, n, s) => e(t, n, s) < 0, Ki;
}
var Qi, Ml;
function od() {
  if (Ml) return Qi;
  Ml = 1;
  const e = at();
  return Qi = (t, n, s) => e(t, n, s) === 0, Qi;
}
var Zi, ql;
function ad() {
  if (ql) return Zi;
  ql = 1;
  const e = at();
  return Zi = (t, n, s) => e(t, n, s) !== 0, Zi;
}
var es, $l;
function fo() {
  if ($l) return es;
  $l = 1;
  const e = at();
  return es = (t, n, s) => e(t, n, s) >= 0, es;
}
var ts, Xl;
function po() {
  if (Xl) return ts;
  Xl = 1;
  const e = at();
  return ts = (t, n, s) => e(t, n, s) <= 0, ts;
}
var rs, Bl;
function ld() {
  if (Bl) return rs;
  Bl = 1;
  const e = od(), r = ad(), t = cn(), n = fo(), s = uo(), i = po();
  return rs = (c, a, u, l) => {
    switch (a) {
      case "===":
        return typeof c == "object" && (c = c.version), typeof u == "object" && (u = u.version), c === u;
      case "!==":
        return typeof c == "object" && (c = c.version), typeof u == "object" && (u = u.version), c !== u;
      case "":
      case "=":
      case "==":
        return e(c, u, l);
      case "!=":
        return r(c, u, l);
      case ">":
        return t(c, u, l);
      case ">=":
        return n(c, u, l);
      case "<":
        return s(c, u, l);
      case "<=":
        return i(c, u, l);
      default:
        throw new TypeError(`Invalid operator: ${a}`);
    }
  }, rs;
}
var ns, Hl;
function Tm() {
  if (Hl) return ns;
  Hl = 1;
  const e = Ye(), r = Zt(), { safeRe: t, t: n } = Dr();
  return ns = (i, o) => {
    if (i instanceof e)
      return i;
    if (typeof i == "number" && (i = String(i)), typeof i != "string")
      return null;
    o = o || {};
    let c = null;
    if (!o.rtl)
      c = i.match(o.includePrerelease ? t[n.COERCEFULL] : t[n.COERCE]);
    else {
      const h = o.includePrerelease ? t[n.COERCERTLFULL] : t[n.COERCERTL];
      let E;
      for (; (E = h.exec(i)) && (!c || c.index + c[0].length !== i.length); )
        (!c || E.index + E[0].length !== c.index + c[0].length) && (c = E), h.lastIndex = E.index + E[1].length + E[2].length;
      h.lastIndex = -1;
    }
    if (c === null)
      return null;
    const a = c[2], u = c[3] || "0", l = c[4] || "0", d = o.includePrerelease && c[5] ? `-${c[5]}` : "", f = o.includePrerelease && c[6] ? `+${c[6]}` : "";
    return r(`${a}.${u}.${l}${d}${f}`, o);
  }, ns;
}
var is, jl;
function ym() {
  if (jl) return is;
  jl = 1;
  class e {
    constructor() {
      this.max = 1e3, this.map = /* @__PURE__ */ new Map();
    }
    get(t) {
      const n = this.map.get(t);
      if (n !== void 0)
        return this.map.delete(t), this.map.set(t, n), n;
    }
    delete(t) {
      return this.map.delete(t);
    }
    set(t, n) {
      if (!this.delete(t) && n !== void 0) {
        if (this.map.size >= this.max) {
          const i = this.map.keys().next().value;
          this.delete(i);
        }
        this.map.set(t, n);
      }
      return this;
    }
  }
  return is = e, is;
}
var ss, Gl;
function lt() {
  if (Gl) return ss;
  Gl = 1;
  const e = /\s+/g;
  class r {
    constructor(x, $) {
      if ($ = s($), x instanceof r)
        return x.loose === !!$.loose && x.includePrerelease === !!$.includePrerelease ? x : new r(x.raw, $);
      if (x instanceof i)
        return this.raw = x.value, this.set = [[x]], this.formatted = void 0, this;
      if (this.options = $, this.loose = !!$.loose, this.includePrerelease = !!$.includePrerelease, this.raw = x.trim().replace(e, " "), this.set = this.raw.split("||").map((L) => this.parseRange(L.trim())).filter((L) => L.length), !this.set.length)
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      if (this.set.length > 1) {
        const L = this.set[0];
        if (this.set = this.set.filter((j) => !g(j[0])), this.set.length === 0)
          this.set = [L];
        else if (this.set.length > 1) {
          for (const j of this.set)
            if (j.length === 1 && m(j[0])) {
              this.set = [j];
              break;
            }
        }
      }
      this.formatted = void 0;
    }
    get range() {
      if (this.formatted === void 0) {
        this.formatted = "";
        for (let x = 0; x < this.set.length; x++) {
          x > 0 && (this.formatted += "||");
          const $ = this.set[x];
          for (let L = 0; L < $.length; L++)
            L > 0 && (this.formatted += " "), this.formatted += $[L].toString().trim();
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
    parseRange(x) {
      const L = ((this.options.includePrerelease && h) | (this.options.loose && E)) + ":" + x, j = n.get(L);
      if (j)
        return j;
      const G = this.options.loose, re = G ? a[u.HYPHENRANGELOOSE] : a[u.HYPHENRANGE];
      x = x.replace(re, P(this.options.includePrerelease)), o("hyphen replace", x), x = x.replace(a[u.COMPARATORTRIM], l), o("comparator trim", x), x = x.replace(a[u.TILDETRIM], d), o("tilde trim", x), x = x.replace(a[u.CARETTRIM], f), o("caret trim", x);
      let ae = x.split(" ").map((Q) => N(Q, this.options)).join(" ").split(/\s+/).map((Q) => O(Q, this.options));
      G && (ae = ae.filter((Q) => (o("loose invalid filter", Q, this.options), !!Q.match(a[u.COMPARATORLOOSE])))), o("range list", ae);
      const se = /* @__PURE__ */ new Map(), pe = ae.map((Q) => new i(Q, this.options));
      for (const Q of pe) {
        if (g(Q))
          return [Q];
        se.set(Q.value, Q);
      }
      se.size > 1 && se.has("") && se.delete("");
      const Te = [...se.values()];
      return n.set(L, Te), Te;
    }
    intersects(x, $) {
      if (!(x instanceof r))
        throw new TypeError("a Range is required");
      return this.set.some((L) => v(L, $) && x.set.some((j) => v(j, $) && L.every((G) => j.every((re) => G.intersects(re, $)))));
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test(x) {
      if (!x)
        return !1;
      if (typeof x == "string")
        try {
          x = new c(x, this.options);
        } catch {
          return !1;
        }
      for (let $ = 0; $ < this.set.length; $++)
        if (k(this.set[$], x, this.options))
          return !0;
      return !1;
    }
  }
  ss = r;
  const t = ym(), n = new t(), s = lo(), i = un(), o = ln(), c = Ye(), {
    safeRe: a,
    t: u,
    comparatorTrimReplace: l,
    tildeTrimReplace: d,
    caretTrimReplace: f
  } = Dr(), { FLAG_INCLUDE_PRERELEASE: h, FLAG_LOOSE: E } = an(), g = (C) => C.value === "<0.0.0-0", m = (C) => C.value === "", v = (C, x) => {
    let $ = !0;
    const L = C.slice();
    let j = L.pop();
    for (; $ && L.length; )
      $ = L.every((G) => j.intersects(G, x)), j = L.pop();
    return $;
  }, N = (C, x) => (C = C.replace(a[u.BUILD], ""), o("comp", C, x), C = _(C, x), o("caret", C), C = D(C, x), o("tildes", C), C = S(C, x), o("xrange", C), C = q(C, x), o("stars", C), C), b = (C) => !C || C.toLowerCase() === "x" || C === "*", D = (C, x) => C.trim().split(/\s+/).map(($) => M($, x)).join(" "), M = (C, x) => {
    const $ = x.loose ? a[u.TILDELOOSE] : a[u.TILDE];
    return C.replace($, (L, j, G, re, ae) => {
      o("tilde", C, L, j, G, re, ae);
      let se;
      return b(j) ? se = "" : b(G) ? se = `>=${j}.0.0 <${+j + 1}.0.0-0` : b(re) ? se = `>=${j}.${G}.0 <${j}.${+G + 1}.0-0` : ae ? (o("replaceTilde pr", ae), se = `>=${j}.${G}.${re}-${ae} <${j}.${+G + 1}.0-0`) : se = `>=${j}.${G}.${re} <${j}.${+G + 1}.0-0`, o("tilde return", se), se;
    });
  }, _ = (C, x) => C.trim().split(/\s+/).map(($) => A($, x)).join(" "), A = (C, x) => {
    o("caret", C, x);
    const $ = x.loose ? a[u.CARETLOOSE] : a[u.CARET], L = x.includePrerelease ? "-0" : "";
    return C.replace($, (j, G, re, ae, se) => {
      o("caret", C, j, G, re, ae, se);
      let pe;
      return b(G) ? pe = "" : b(re) ? pe = `>=${G}.0.0${L} <${+G + 1}.0.0-0` : b(ae) ? G === "0" ? pe = `>=${G}.${re}.0${L} <${G}.${+re + 1}.0-0` : pe = `>=${G}.${re}.0${L} <${+G + 1}.0.0-0` : se ? (o("replaceCaret pr", se), G === "0" ? re === "0" ? pe = `>=${G}.${re}.${ae}-${se} <${G}.${re}.${+ae + 1}-0` : pe = `>=${G}.${re}.${ae}-${se} <${G}.${+re + 1}.0-0` : pe = `>=${G}.${re}.${ae}-${se} <${+G + 1}.0.0-0`) : (o("no pr"), G === "0" ? re === "0" ? pe = `>=${G}.${re}.${ae}${L} <${G}.${re}.${+ae + 1}-0` : pe = `>=${G}.${re}.${ae}${L} <${G}.${+re + 1}.0-0` : pe = `>=${G}.${re}.${ae} <${+G + 1}.0.0-0`), o("caret return", pe), pe;
    });
  }, S = (C, x) => (o("replaceXRanges", C, x), C.split(/\s+/).map(($) => y($, x)).join(" ")), y = (C, x) => {
    C = C.trim();
    const $ = x.loose ? a[u.XRANGELOOSE] : a[u.XRANGE];
    return C.replace($, (L, j, G, re, ae, se) => {
      o("xRange", C, L, j, G, re, ae, se);
      const pe = b(G), Te = pe || b(re), Q = Te || b(ae), ve = Q;
      return j === "=" && ve && (j = ""), se = x.includePrerelease ? "-0" : "", pe ? j === ">" || j === "<" ? L = "<0.0.0-0" : L = "*" : j && ve ? (Te && (re = 0), ae = 0, j === ">" ? (j = ">=", Te ? (G = +G + 1, re = 0, ae = 0) : (re = +re + 1, ae = 0)) : j === "<=" && (j = "<", Te ? G = +G + 1 : re = +re + 1), j === "<" && (se = "-0"), L = `${j + G}.${re}.${ae}${se}`) : Te ? L = `>=${G}.0.0${se} <${+G + 1}.0.0-0` : Q && (L = `>=${G}.${re}.0${se} <${G}.${+re + 1}.0-0`), o("xRange return", L), L;
    });
  }, q = (C, x) => (o("replaceStars", C, x), C.trim().replace(a[u.STAR], "")), O = (C, x) => (o("replaceGTE0", C, x), C.trim().replace(a[x.includePrerelease ? u.GTE0PRE : u.GTE0], "")), P = (C) => (x, $, L, j, G, re, ae, se, pe, Te, Q, ve) => (b(L) ? $ = "" : b(j) ? $ = `>=${L}.0.0${C ? "-0" : ""}` : b(G) ? $ = `>=${L}.${j}.0${C ? "-0" : ""}` : re ? $ = `>=${$}` : $ = `>=${$}${C ? "-0" : ""}`, b(pe) ? se = "" : b(Te) ? se = `<${+pe + 1}.0.0-0` : b(Q) ? se = `<${pe}.${+Te + 1}.0-0` : ve ? se = `<=${pe}.${Te}.${Q}-${ve}` : C ? se = `<${pe}.${Te}.${+Q + 1}-0` : se = `<=${se}`, `${$} ${se}`.trim()), k = (C, x, $) => {
    for (let L = 0; L < C.length; L++)
      if (!C[L].test(x))
        return !1;
    if (x.prerelease.length && !$.includePrerelease) {
      for (let L = 0; L < C.length; L++)
        if (o(C[L].semver), C[L].semver !== i.ANY && C[L].semver.prerelease.length > 0) {
          const j = C[L].semver;
          if (j.major === x.major && j.minor === x.minor && j.patch === x.patch)
            return !0;
        }
      return !1;
    }
    return !0;
  };
  return ss;
}
var os, Vl;
function un() {
  if (Vl) return os;
  Vl = 1;
  const e = /* @__PURE__ */ Symbol("SemVer ANY");
  class r {
    static get ANY() {
      return e;
    }
    constructor(l, d) {
      if (d = t(d), l instanceof r) {
        if (l.loose === !!d.loose)
          return l;
        l = l.value;
      }
      l = l.trim().split(/\s+/).join(" "), o("comparator", l, d), this.options = d, this.loose = !!d.loose, this.parse(l), this.semver === e ? this.value = "" : this.value = this.operator + this.semver.version, o("comp", this);
    }
    parse(l) {
      const d = this.options.loose ? n[s.COMPARATORLOOSE] : n[s.COMPARATOR], f = l.match(d);
      if (!f)
        throw new TypeError(`Invalid comparator: ${l}`);
      this.operator = f[1] !== void 0 ? f[1] : "", this.operator === "=" && (this.operator = ""), f[2] ? this.semver = new c(f[2], this.options.loose) : this.semver = e;
    }
    toString() {
      return this.value;
    }
    test(l) {
      if (o("Comparator.test", l, this.options.loose), this.semver === e || l === e)
        return !0;
      if (typeof l == "string")
        try {
          l = new c(l, this.options);
        } catch {
          return !1;
        }
      return i(l, this.operator, this.semver, this.options);
    }
    intersects(l, d) {
      if (!(l instanceof r))
        throw new TypeError("a Comparator is required");
      return this.operator === "" ? this.value === "" ? !0 : new a(l.value, d).test(this.value) : l.operator === "" ? l.value === "" ? !0 : new a(this.value, d).test(l.semver) : (d = t(d), d.includePrerelease && (this.value === "<0.0.0-0" || l.value === "<0.0.0-0") || !d.includePrerelease && (this.value.startsWith("<0.0.0") || l.value.startsWith("<0.0.0")) ? !1 : !!(this.operator.startsWith(">") && l.operator.startsWith(">") || this.operator.startsWith("<") && l.operator.startsWith("<") || this.semver.version === l.semver.version && this.operator.includes("=") && l.operator.includes("=") || i(this.semver, "<", l.semver, d) && this.operator.startsWith(">") && l.operator.startsWith("<") || i(this.semver, ">", l.semver, d) && this.operator.startsWith("<") && l.operator.startsWith(">")));
    }
  }
  os = r;
  const t = lo(), { safeRe: n, t: s } = Dr(), i = ld(), o = ln(), c = Ye(), a = lt();
  return os;
}
var as, Wl;
function dn() {
  if (Wl) return as;
  Wl = 1;
  const e = lt();
  return as = (t, n, s) => {
    try {
      n = new e(n, s);
    } catch {
      return !1;
    }
    return n.test(t);
  }, as;
}
var ls, Yl;
function vm() {
  if (Yl) return ls;
  Yl = 1;
  const e = lt();
  return ls = (t, n) => new e(t, n).set.map((s) => s.map((i) => i.value).join(" ").trim().split(" ")), ls;
}
var cs, zl;
function Am() {
  if (zl) return cs;
  zl = 1;
  const e = Ye(), r = lt();
  return cs = (n, s, i) => {
    let o = null, c = null, a = null;
    try {
      a = new r(s, i);
    } catch {
      return null;
    }
    return n.forEach((u) => {
      a.test(u) && (!o || c.compare(u) === -1) && (o = u, c = new e(o, i));
    }), o;
  }, cs;
}
var us, Jl;
function Im() {
  if (Jl) return us;
  Jl = 1;
  const e = Ye(), r = lt();
  return us = (n, s, i) => {
    let o = null, c = null, a = null;
    try {
      a = new r(s, i);
    } catch {
      return null;
    }
    return n.forEach((u) => {
      a.test(u) && (!o || c.compare(u) === 1) && (o = u, c = new e(o, i));
    }), o;
  }, us;
}
var ds, Kl;
function Sm() {
  if (Kl) return ds;
  Kl = 1;
  const e = Ye(), r = lt(), t = cn();
  return ds = (s, i) => {
    s = new r(s, i);
    let o = new e("0.0.0");
    if (s.test(o) || (o = new e("0.0.0-0"), s.test(o)))
      return o;
    o = null;
    for (let c = 0; c < s.set.length; ++c) {
      const a = s.set[c];
      let u = null;
      a.forEach((l) => {
        const d = new e(l.semver.version);
        switch (l.operator) {
          case ">":
            d.prerelease.length === 0 ? d.patch++ : d.prerelease.push(0), d.raw = d.format();
          /* fallthrough */
          case "":
          case ">=":
            (!u || t(d, u)) && (u = d);
            break;
          case "<":
          case "<=":
            break;
          /* istanbul ignore next */
          default:
            throw new Error(`Unexpected operation: ${l.operator}`);
        }
      }), u && (!o || t(o, u)) && (o = u);
    }
    return o && s.test(o) ? o : null;
  }, ds;
}
var fs, Ql;
function Nm() {
  if (Ql) return fs;
  Ql = 1;
  const e = lt();
  return fs = (t, n) => {
    try {
      return new e(t, n).range || "*";
    } catch {
      return null;
    }
  }, fs;
}
var ps, Zl;
function ho() {
  if (Zl) return ps;
  Zl = 1;
  const e = Ye(), r = un(), { ANY: t } = r, n = lt(), s = dn(), i = cn(), o = uo(), c = po(), a = fo();
  return ps = (l, d, f, h) => {
    l = new e(l, h), d = new n(d, h);
    let E, g, m, v, N;
    switch (f) {
      case ">":
        E = i, g = c, m = o, v = ">", N = ">=";
        break;
      case "<":
        E = o, g = a, m = i, v = "<", N = "<=";
        break;
      default:
        throw new TypeError('Must provide a hilo val of "<" or ">"');
    }
    if (s(l, d, h))
      return !1;
    for (let b = 0; b < d.set.length; ++b) {
      const D = d.set[b];
      let M = null, _ = null;
      if (D.forEach((A) => {
        A.semver === t && (A = new r(">=0.0.0")), M = M || A, _ = _ || A, E(A.semver, M.semver, h) ? M = A : m(A.semver, _.semver, h) && (_ = A);
      }), M.operator === v || M.operator === N || (!_.operator || _.operator === v) && g(l, _.semver))
        return !1;
      if (_.operator === N && m(l, _.semver))
        return !1;
    }
    return !0;
  }, ps;
}
var hs, ec;
function _m() {
  if (ec) return hs;
  ec = 1;
  const e = ho();
  return hs = (t, n, s) => e(t, n, ">", s), hs;
}
var ms, tc;
function wm() {
  if (tc) return ms;
  tc = 1;
  const e = ho();
  return ms = (t, n, s) => e(t, n, "<", s), ms;
}
var Es, rc;
function Rm() {
  if (rc) return Es;
  rc = 1;
  const e = lt();
  return Es = (t, n, s) => (t = new e(t, s), n = new e(n, s), t.intersects(n, s)), Es;
}
var gs, nc;
function Om() {
  if (nc) return gs;
  nc = 1;
  const e = dn(), r = at();
  return gs = (t, n, s) => {
    const i = [];
    let o = null, c = null;
    const a = t.sort((f, h) => r(f, h, s));
    for (const f of a)
      e(f, n, s) ? (c = f, o || (o = f)) : (c && i.push([o, c]), c = null, o = null);
    o && i.push([o, null]);
    const u = [];
    for (const [f, h] of i)
      f === h ? u.push(f) : !h && f === a[0] ? u.push("*") : h ? f === a[0] ? u.push(`<=${h}`) : u.push(`${f} - ${h}`) : u.push(`>=${f}`);
    const l = u.join(" || "), d = typeof n.raw == "string" ? n.raw : String(n);
    return l.length < d.length ? l : n;
  }, gs;
}
var Ts, ic;
function bm() {
  if (ic) return Ts;
  ic = 1;
  const e = lt(), r = un(), { ANY: t } = r, n = dn(), s = at(), i = (d, f, h = {}) => {
    if (d === f)
      return !0;
    d = new e(d, h), f = new e(f, h);
    let E = !1;
    e: for (const g of d.set) {
      for (const m of f.set) {
        const v = a(g, m, h);
        if (E = E || v !== null, v)
          continue e;
      }
      if (E)
        return !1;
    }
    return !0;
  }, o = [new r(">=0.0.0-0")], c = [new r(">=0.0.0")], a = (d, f, h) => {
    if (d === f)
      return !0;
    if (d.length === 1 && d[0].semver === t) {
      if (f.length === 1 && f[0].semver === t)
        return !0;
      h.includePrerelease ? d = o : d = c;
    }
    if (f.length === 1 && f[0].semver === t) {
      if (h.includePrerelease)
        return !0;
      f = c;
    }
    const E = /* @__PURE__ */ new Set();
    let g, m;
    for (const S of d)
      S.operator === ">" || S.operator === ">=" ? g = u(g, S, h) : S.operator === "<" || S.operator === "<=" ? m = l(m, S, h) : E.add(S.semver);
    if (E.size > 1)
      return null;
    let v;
    if (g && m) {
      if (v = s(g.semver, m.semver, h), v > 0)
        return null;
      if (v === 0 && (g.operator !== ">=" || m.operator !== "<="))
        return null;
    }
    for (const S of E) {
      if (g && !n(S, String(g), h) || m && !n(S, String(m), h))
        return null;
      for (const y of f)
        if (!n(S, String(y), h))
          return !1;
      return !0;
    }
    let N, b, D, M, _ = m && !h.includePrerelease && m.semver.prerelease.length ? m.semver : !1, A = g && !h.includePrerelease && g.semver.prerelease.length ? g.semver : !1;
    _ && _.prerelease.length === 1 && m.operator === "<" && _.prerelease[0] === 0 && (_ = !1);
    for (const S of f) {
      if (M = M || S.operator === ">" || S.operator === ">=", D = D || S.operator === "<" || S.operator === "<=", g) {
        if (A && S.semver.prerelease && S.semver.prerelease.length && S.semver.major === A.major && S.semver.minor === A.minor && S.semver.patch === A.patch && (A = !1), S.operator === ">" || S.operator === ">=") {
          if (N = u(g, S, h), N === S && N !== g)
            return !1;
        } else if (g.operator === ">=" && !n(g.semver, String(S), h))
          return !1;
      }
      if (m) {
        if (_ && S.semver.prerelease && S.semver.prerelease.length && S.semver.major === _.major && S.semver.minor === _.minor && S.semver.patch === _.patch && (_ = !1), S.operator === "<" || S.operator === "<=") {
          if (b = l(m, S, h), b === S && b !== m)
            return !1;
        } else if (m.operator === "<=" && !n(m.semver, String(S), h))
          return !1;
      }
      if (!S.operator && (m || g) && v !== 0)
        return !1;
    }
    return !(g && D && !m && v !== 0 || m && M && !g && v !== 0 || A || _);
  }, u = (d, f, h) => {
    if (!d)
      return f;
    const E = s(d.semver, f.semver, h);
    return E > 0 ? d : E < 0 || f.operator === ">" && d.operator === ">=" ? f : d;
  }, l = (d, f, h) => {
    if (!d)
      return f;
    const E = s(d.semver, f.semver, h);
    return E < 0 ? d : E > 0 || f.operator === "<" && d.operator === "<=" ? f : d;
  };
  return Ts = i, Ts;
}
var ys, sc;
function cd() {
  if (sc) return ys;
  sc = 1;
  const e = Dr(), r = an(), t = Ye(), n = sd(), s = Zt(), i = om(), o = am(), c = lm(), a = cm(), u = um(), l = dm(), d = fm(), f = pm(), h = at(), E = hm(), g = mm(), m = co(), v = Em(), N = gm(), b = cn(), D = uo(), M = od(), _ = ad(), A = fo(), S = po(), y = ld(), q = Tm(), O = un(), P = lt(), k = dn(), C = vm(), x = Am(), $ = Im(), L = Sm(), j = Nm(), G = ho(), re = _m(), ae = wm(), se = Rm(), pe = Om(), Te = bm();
  return ys = {
    parse: s,
    valid: i,
    clean: o,
    inc: c,
    diff: a,
    major: u,
    minor: l,
    patch: d,
    prerelease: f,
    compare: h,
    rcompare: E,
    compareLoose: g,
    compareBuild: m,
    sort: v,
    rsort: N,
    gt: b,
    lt: D,
    eq: M,
    neq: _,
    gte: A,
    lte: S,
    cmp: y,
    coerce: q,
    Comparator: O,
    Range: P,
    satisfies: k,
    toComparators: C,
    maxSatisfying: x,
    minSatisfying: $,
    minVersion: L,
    validRange: j,
    outside: G,
    gtr: re,
    ltr: ae,
    intersects: se,
    simplifyRange: pe,
    subset: Te,
    SemVer: t,
    re: e.re,
    src: e.src,
    tokens: e.t,
    SEMVER_SPEC_VERSION: r.SEMVER_SPEC_VERSION,
    RELEASE_TYPES: r.RELEASE_TYPES,
    compareIdentifiers: n.compareIdentifiers,
    rcompareIdentifiers: n.rcompareIdentifiers
  }, ys;
}
var Vt = {}, Rr = { exports: {} };
Rr.exports;
var oc;
function Lm() {
  return oc || (oc = 1, (function(e, r) {
    var t = 200, n = "__lodash_hash_undefined__", s = 1, i = 2, o = 9007199254740991, c = "[object Arguments]", a = "[object Array]", u = "[object AsyncFunction]", l = "[object Boolean]", d = "[object Date]", f = "[object Error]", h = "[object Function]", E = "[object GeneratorFunction]", g = "[object Map]", m = "[object Number]", v = "[object Null]", N = "[object Object]", b = "[object Promise]", D = "[object Proxy]", M = "[object RegExp]", _ = "[object Set]", A = "[object String]", S = "[object Symbol]", y = "[object Undefined]", q = "[object WeakMap]", O = "[object ArrayBuffer]", P = "[object DataView]", k = "[object Float32Array]", C = "[object Float64Array]", x = "[object Int8Array]", $ = "[object Int16Array]", L = "[object Int32Array]", j = "[object Uint8Array]", G = "[object Uint8ClampedArray]", re = "[object Uint16Array]", ae = "[object Uint32Array]", se = /[\\^$.*+?()[\]{}|]/g, pe = /^\[object .+?Constructor\]$/, Te = /^(?:0|[1-9]\d*)$/, Q = {};
    Q[k] = Q[C] = Q[x] = Q[$] = Q[L] = Q[j] = Q[G] = Q[re] = Q[ae] = !0, Q[c] = Q[a] = Q[O] = Q[l] = Q[P] = Q[d] = Q[f] = Q[h] = Q[g] = Q[m] = Q[N] = Q[M] = Q[_] = Q[A] = Q[q] = !1;
    var ve = typeof ot == "object" && ot && ot.Object === Object && ot, I = typeof self == "object" && self && self.Object === Object && self, T = ve || I || Function("return this")(), H = r && !r.nodeType && r, U = H && !0 && e && !e.nodeType && e, de = U && U.exports === H, me = de && ve.process, Ee = (function() {
      try {
        return me && me.binding && me.binding("util");
      } catch {
      }
    })(), Ne = Ee && Ee.isTypedArray;
    function Ae(R, F) {
      for (var K = -1, ce = R == null ? 0 : R.length, xe = 0, _e = []; ++K < ce; ) {
        var Fe = R[K];
        F(Fe, K, R) && (_e[xe++] = Fe);
      }
      return _e;
    }
    function ze(R, F) {
      for (var K = -1, ce = F.length, xe = R.length; ++K < ce; )
        R[xe + K] = F[K];
      return R;
    }
    function we(R, F) {
      for (var K = -1, ce = R == null ? 0 : R.length; ++K < ce; )
        if (F(R[K], K, R))
          return !0;
      return !1;
    }
    function Ge(R, F) {
      for (var K = -1, ce = Array(R); ++K < R; )
        ce[K] = F(K);
      return ce;
    }
    function vt(R) {
      return function(F) {
        return R(F);
      };
    }
    function mt(R, F) {
      return R.has(F);
    }
    function ut(R, F) {
      return R?.[F];
    }
    function p(R) {
      var F = -1, K = Array(R.size);
      return R.forEach(function(ce, xe) {
        K[++F] = [xe, ce];
      }), K;
    }
    function B(R, F) {
      return function(K) {
        return R(F(K));
      };
    }
    function V(R) {
      var F = -1, K = Array(R.size);
      return R.forEach(function(ce) {
        K[++F] = ce;
      }), K;
    }
    var ne = Array.prototype, W = Function.prototype, te = Object.prototype, Z = T["__core-js_shared__"], oe = W.toString, ue = te.hasOwnProperty, Re = (function() {
      var R = /[^.]+$/.exec(Z && Z.keys && Z.keys.IE_PROTO || "");
      return R ? "Symbol(src)_1." + R : "";
    })(), Oe = te.toString, ge = RegExp(
      "^" + oe.call(ue).replace(se, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
    ), w = de ? T.Buffer : void 0, X = T.Symbol, Y = T.Uint8Array, z = te.propertyIsEnumerable, J = ne.splice, ie = X ? X.toStringTag : void 0, ee = Object.getOwnPropertySymbols, le = w ? w.isBuffer : void 0, he = B(Object.keys, Object), Se = jt(T, "DataView"), De = jt(T, "Map"), Ue = jt(T, "Promise"), Le = jt(T, "Set"), Ht = jt(T, "WeakMap"), nt = jt(Object, "create"), Ot = Ct(Se), wd = Ct(De), Rd = Ct(Ue), Od = Ct(Le), bd = Ct(Ht), To = X ? X.prototype : void 0, hn = To ? To.valueOf : void 0;
    function bt(R) {
      var F = -1, K = R == null ? 0 : R.length;
      for (this.clear(); ++F < K; ) {
        var ce = R[F];
        this.set(ce[0], ce[1]);
      }
    }
    function Ld() {
      this.__data__ = nt ? nt(null) : {}, this.size = 0;
    }
    function Cd(R) {
      var F = this.has(R) && delete this.__data__[R];
      return this.size -= F ? 1 : 0, F;
    }
    function Dd(R) {
      var F = this.__data__;
      if (nt) {
        var K = F[R];
        return K === n ? void 0 : K;
      }
      return ue.call(F, R) ? F[R] : void 0;
    }
    function xd(R) {
      var F = this.__data__;
      return nt ? F[R] !== void 0 : ue.call(F, R);
    }
    function Pd(R, F) {
      var K = this.__data__;
      return this.size += this.has(R) ? 0 : 1, K[R] = nt && F === void 0 ? n : F, this;
    }
    bt.prototype.clear = Ld, bt.prototype.delete = Cd, bt.prototype.get = Dd, bt.prototype.has = xd, bt.prototype.set = Pd;
    function Et(R) {
      var F = -1, K = R == null ? 0 : R.length;
      for (this.clear(); ++F < K; ) {
        var ce = R[F];
        this.set(ce[0], ce[1]);
      }
    }
    function Ud() {
      this.__data__ = [], this.size = 0;
    }
    function Fd(R) {
      var F = this.__data__, K = Ur(F, R);
      if (K < 0)
        return !1;
      var ce = F.length - 1;
      return K == ce ? F.pop() : J.call(F, K, 1), --this.size, !0;
    }
    function kd(R) {
      var F = this.__data__, K = Ur(F, R);
      return K < 0 ? void 0 : F[K][1];
    }
    function Md(R) {
      return Ur(this.__data__, R) > -1;
    }
    function qd(R, F) {
      var K = this.__data__, ce = Ur(K, R);
      return ce < 0 ? (++this.size, K.push([R, F])) : K[ce][1] = F, this;
    }
    Et.prototype.clear = Ud, Et.prototype.delete = Fd, Et.prototype.get = kd, Et.prototype.has = Md, Et.prototype.set = qd;
    function Lt(R) {
      var F = -1, K = R == null ? 0 : R.length;
      for (this.clear(); ++F < K; ) {
        var ce = R[F];
        this.set(ce[0], ce[1]);
      }
    }
    function $d() {
      this.size = 0, this.__data__ = {
        hash: new bt(),
        map: new (De || Et)(),
        string: new bt()
      };
    }
    function Xd(R) {
      var F = Fr(this, R).delete(R);
      return this.size -= F ? 1 : 0, F;
    }
    function Bd(R) {
      return Fr(this, R).get(R);
    }
    function Hd(R) {
      return Fr(this, R).has(R);
    }
    function jd(R, F) {
      var K = Fr(this, R), ce = K.size;
      return K.set(R, F), this.size += K.size == ce ? 0 : 1, this;
    }
    Lt.prototype.clear = $d, Lt.prototype.delete = Xd, Lt.prototype.get = Bd, Lt.prototype.has = Hd, Lt.prototype.set = jd;
    function Pr(R) {
      var F = -1, K = R == null ? 0 : R.length;
      for (this.__data__ = new Lt(); ++F < K; )
        this.add(R[F]);
    }
    function Gd(R) {
      return this.__data__.set(R, n), this;
    }
    function Vd(R) {
      return this.__data__.has(R);
    }
    Pr.prototype.add = Pr.prototype.push = Gd, Pr.prototype.has = Vd;
    function At(R) {
      var F = this.__data__ = new Et(R);
      this.size = F.size;
    }
    function Wd() {
      this.__data__ = new Et(), this.size = 0;
    }
    function Yd(R) {
      var F = this.__data__, K = F.delete(R);
      return this.size = F.size, K;
    }
    function zd(R) {
      return this.__data__.get(R);
    }
    function Jd(R) {
      return this.__data__.has(R);
    }
    function Kd(R, F) {
      var K = this.__data__;
      if (K instanceof Et) {
        var ce = K.__data__;
        if (!De || ce.length < t - 1)
          return ce.push([R, F]), this.size = ++K.size, this;
        K = this.__data__ = new Lt(ce);
      }
      return K.set(R, F), this.size = K.size, this;
    }
    At.prototype.clear = Wd, At.prototype.delete = Yd, At.prototype.get = zd, At.prototype.has = Jd, At.prototype.set = Kd;
    function Qd(R, F) {
      var K = kr(R), ce = !K && hf(R), xe = !K && !ce && mn(R), _e = !K && !ce && !xe && Ro(R), Fe = K || ce || xe || _e, ke = Fe ? Ge(R.length, String) : [], qe = ke.length;
      for (var Pe in R)
        ue.call(R, Pe) && !(Fe && // Safari 9 has enumerable `arguments.length` in strict mode.
        (Pe == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
        xe && (Pe == "offset" || Pe == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
        _e && (Pe == "buffer" || Pe == "byteLength" || Pe == "byteOffset") || // Skip index properties.
        cf(Pe, qe))) && ke.push(Pe);
      return ke;
    }
    function Ur(R, F) {
      for (var K = R.length; K--; )
        if (So(R[K][0], F))
          return K;
      return -1;
    }
    function Zd(R, F, K) {
      var ce = F(R);
      return kr(R) ? ce : ze(ce, K(R));
    }
    function tr(R) {
      return R == null ? R === void 0 ? y : v : ie && ie in Object(R) ? af(R) : pf(R);
    }
    function yo(R) {
      return rr(R) && tr(R) == c;
    }
    function vo(R, F, K, ce, xe) {
      return R === F ? !0 : R == null || F == null || !rr(R) && !rr(F) ? R !== R && F !== F : ef(R, F, K, ce, vo, xe);
    }
    function ef(R, F, K, ce, xe, _e) {
      var Fe = kr(R), ke = kr(F), qe = Fe ? a : It(R), Pe = ke ? a : It(F);
      qe = qe == c ? N : qe, Pe = Pe == c ? N : Pe;
      var Ke = qe == N, it = Pe == N, Xe = qe == Pe;
      if (Xe && mn(R)) {
        if (!mn(F))
          return !1;
        Fe = !0, Ke = !1;
      }
      if (Xe && !Ke)
        return _e || (_e = new At()), Fe || Ro(R) ? Ao(R, F, K, ce, xe, _e) : sf(R, F, qe, K, ce, xe, _e);
      if (!(K & s)) {
        var et = Ke && ue.call(R, "__wrapped__"), tt = it && ue.call(F, "__wrapped__");
        if (et || tt) {
          var St = et ? R.value() : R, gt = tt ? F.value() : F;
          return _e || (_e = new At()), xe(St, gt, K, ce, _e);
        }
      }
      return Xe ? (_e || (_e = new At()), of(R, F, K, ce, xe, _e)) : !1;
    }
    function tf(R) {
      if (!wo(R) || df(R))
        return !1;
      var F = No(R) ? ge : pe;
      return F.test(Ct(R));
    }
    function rf(R) {
      return rr(R) && _o(R.length) && !!Q[tr(R)];
    }
    function nf(R) {
      if (!ff(R))
        return he(R);
      var F = [];
      for (var K in Object(R))
        ue.call(R, K) && K != "constructor" && F.push(K);
      return F;
    }
    function Ao(R, F, K, ce, xe, _e) {
      var Fe = K & s, ke = R.length, qe = F.length;
      if (ke != qe && !(Fe && qe > ke))
        return !1;
      var Pe = _e.get(R);
      if (Pe && _e.get(F))
        return Pe == F;
      var Ke = -1, it = !0, Xe = K & i ? new Pr() : void 0;
      for (_e.set(R, F), _e.set(F, R); ++Ke < ke; ) {
        var et = R[Ke], tt = F[Ke];
        if (ce)
          var St = Fe ? ce(tt, et, Ke, F, R, _e) : ce(et, tt, Ke, R, F, _e);
        if (St !== void 0) {
          if (St)
            continue;
          it = !1;
          break;
        }
        if (Xe) {
          if (!we(F, function(gt, Dt) {
            if (!mt(Xe, Dt) && (et === gt || xe(et, gt, K, ce, _e)))
              return Xe.push(Dt);
          })) {
            it = !1;
            break;
          }
        } else if (!(et === tt || xe(et, tt, K, ce, _e))) {
          it = !1;
          break;
        }
      }
      return _e.delete(R), _e.delete(F), it;
    }
    function sf(R, F, K, ce, xe, _e, Fe) {
      switch (K) {
        case P:
          if (R.byteLength != F.byteLength || R.byteOffset != F.byteOffset)
            return !1;
          R = R.buffer, F = F.buffer;
        case O:
          return !(R.byteLength != F.byteLength || !_e(new Y(R), new Y(F)));
        case l:
        case d:
        case m:
          return So(+R, +F);
        case f:
          return R.name == F.name && R.message == F.message;
        case M:
        case A:
          return R == F + "";
        case g:
          var ke = p;
        case _:
          var qe = ce & s;
          if (ke || (ke = V), R.size != F.size && !qe)
            return !1;
          var Pe = Fe.get(R);
          if (Pe)
            return Pe == F;
          ce |= i, Fe.set(R, F);
          var Ke = Ao(ke(R), ke(F), ce, xe, _e, Fe);
          return Fe.delete(R), Ke;
        case S:
          if (hn)
            return hn.call(R) == hn.call(F);
      }
      return !1;
    }
    function of(R, F, K, ce, xe, _e) {
      var Fe = K & s, ke = Io(R), qe = ke.length, Pe = Io(F), Ke = Pe.length;
      if (qe != Ke && !Fe)
        return !1;
      for (var it = qe; it--; ) {
        var Xe = ke[it];
        if (!(Fe ? Xe in F : ue.call(F, Xe)))
          return !1;
      }
      var et = _e.get(R);
      if (et && _e.get(F))
        return et == F;
      var tt = !0;
      _e.set(R, F), _e.set(F, R);
      for (var St = Fe; ++it < qe; ) {
        Xe = ke[it];
        var gt = R[Xe], Dt = F[Xe];
        if (ce)
          var Oo = Fe ? ce(Dt, gt, Xe, F, R, _e) : ce(gt, Dt, Xe, R, F, _e);
        if (!(Oo === void 0 ? gt === Dt || xe(gt, Dt, K, ce, _e) : Oo)) {
          tt = !1;
          break;
        }
        St || (St = Xe == "constructor");
      }
      if (tt && !St) {
        var Mr = R.constructor, qr = F.constructor;
        Mr != qr && "constructor" in R && "constructor" in F && !(typeof Mr == "function" && Mr instanceof Mr && typeof qr == "function" && qr instanceof qr) && (tt = !1);
      }
      return _e.delete(R), _e.delete(F), tt;
    }
    function Io(R) {
      return Zd(R, gf, lf);
    }
    function Fr(R, F) {
      var K = R.__data__;
      return uf(F) ? K[typeof F == "string" ? "string" : "hash"] : K.map;
    }
    function jt(R, F) {
      var K = ut(R, F);
      return tf(K) ? K : void 0;
    }
    function af(R) {
      var F = ue.call(R, ie), K = R[ie];
      try {
        R[ie] = void 0;
        var ce = !0;
      } catch {
      }
      var xe = Oe.call(R);
      return ce && (F ? R[ie] = K : delete R[ie]), xe;
    }
    var lf = ee ? function(R) {
      return R == null ? [] : (R = Object(R), Ae(ee(R), function(F) {
        return z.call(R, F);
      }));
    } : Tf, It = tr;
    (Se && It(new Se(new ArrayBuffer(1))) != P || De && It(new De()) != g || Ue && It(Ue.resolve()) != b || Le && It(new Le()) != _ || Ht && It(new Ht()) != q) && (It = function(R) {
      var F = tr(R), K = F == N ? R.constructor : void 0, ce = K ? Ct(K) : "";
      if (ce)
        switch (ce) {
          case Ot:
            return P;
          case wd:
            return g;
          case Rd:
            return b;
          case Od:
            return _;
          case bd:
            return q;
        }
      return F;
    });
    function cf(R, F) {
      return F = F ?? o, !!F && (typeof R == "number" || Te.test(R)) && R > -1 && R % 1 == 0 && R < F;
    }
    function uf(R) {
      var F = typeof R;
      return F == "string" || F == "number" || F == "symbol" || F == "boolean" ? R !== "__proto__" : R === null;
    }
    function df(R) {
      return !!Re && Re in R;
    }
    function ff(R) {
      var F = R && R.constructor, K = typeof F == "function" && F.prototype || te;
      return R === K;
    }
    function pf(R) {
      return Oe.call(R);
    }
    function Ct(R) {
      if (R != null) {
        try {
          return oe.call(R);
        } catch {
        }
        try {
          return R + "";
        } catch {
        }
      }
      return "";
    }
    function So(R, F) {
      return R === F || R !== R && F !== F;
    }
    var hf = yo(/* @__PURE__ */ (function() {
      return arguments;
    })()) ? yo : function(R) {
      return rr(R) && ue.call(R, "callee") && !z.call(R, "callee");
    }, kr = Array.isArray;
    function mf(R) {
      return R != null && _o(R.length) && !No(R);
    }
    var mn = le || yf;
    function Ef(R, F) {
      return vo(R, F);
    }
    function No(R) {
      if (!wo(R))
        return !1;
      var F = tr(R);
      return F == h || F == E || F == u || F == D;
    }
    function _o(R) {
      return typeof R == "number" && R > -1 && R % 1 == 0 && R <= o;
    }
    function wo(R) {
      var F = typeof R;
      return R != null && (F == "object" || F == "function");
    }
    function rr(R) {
      return R != null && typeof R == "object";
    }
    var Ro = Ne ? vt(Ne) : rf;
    function gf(R) {
      return mf(R) ? Qd(R) : nf(R);
    }
    function Tf() {
      return [];
    }
    function yf() {
      return !1;
    }
    e.exports = Ef;
  })(Rr, Rr.exports)), Rr.exports;
}
var ac;
function Cm() {
  if (ac) return Vt;
  ac = 1, Object.defineProperty(Vt, "__esModule", { value: !0 }), Vt.DownloadedUpdateHelper = void 0, Vt.createTempUpdateFile = c;
  const e = Me, r = be, t = Lm(), n = /* @__PURE__ */ Rt(), s = ye;
  let i = class {
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
      return s.join(this.cacheDir, "pending");
    }
    async validateDownloadedPath(u, l, d, f) {
      if (this.versionInfo != null && this.file === u && this.fileInfo != null)
        return t(this.versionInfo, l) && t(this.fileInfo.info, d.info) && await (0, n.pathExists)(u) ? u : null;
      const h = await this.getValidCachedUpdateFile(d, f);
      return h === null ? null : (f.info(`Update has already been downloaded to ${u}).`), this._file = h, h);
    }
    async setDownloadedFile(u, l, d, f, h, E) {
      this._file = u, this._packageFile = l, this.versionInfo = d, this.fileInfo = f, this._downloadedFileInfo = {
        fileName: h,
        sha512: f.info.sha512,
        isAdminRightsRequired: f.info.isAdminRightsRequired === !0
      }, E && await (0, n.outputJson)(this.getUpdateInfoFile(), this._downloadedFileInfo);
    }
    async clear() {
      this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, await this.cleanCacheDirForPendingUpdate();
    }
    async cleanCacheDirForPendingUpdate() {
      try {
        await (0, n.emptyDir)(this.cacheDirForPendingUpdate);
      } catch {
      }
    }
    /**
     * Returns "update-info.json" which is created in the update cache directory's "pending" subfolder after the first update is downloaded.  If the update file does not exist then the cache is cleared and recreated.  If the update file exists then its properties are validated.
     * @param fileInfo
     * @param logger
     */
    async getValidCachedUpdateFile(u, l) {
      const d = this.getUpdateInfoFile();
      if (!await (0, n.pathExists)(d))
        return null;
      let h;
      try {
        h = await (0, n.readJson)(d);
      } catch (v) {
        let N = "No cached update info available";
        return v.code !== "ENOENT" && (await this.cleanCacheDirForPendingUpdate(), N += ` (error on read: ${v.message})`), l.info(N), null;
      }
      if (!(h?.fileName !== null))
        return l.warn("Cached update info is corrupted: no fileName, directory for cached update will be cleaned"), await this.cleanCacheDirForPendingUpdate(), null;
      if (u.info.sha512 !== h.sha512)
        return l.info(`Cached update sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${h.sha512}, expected: ${u.info.sha512}. Directory for cached update will be cleaned`), await this.cleanCacheDirForPendingUpdate(), null;
      const g = s.join(this.cacheDirForPendingUpdate, h.fileName);
      if (!await (0, n.pathExists)(g))
        return l.info("Cached update file doesn't exist"), null;
      const m = await o(g);
      return u.info.sha512 !== m ? (l.warn(`Sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${m}, expected: ${u.info.sha512}`), await this.cleanCacheDirForPendingUpdate(), null) : (this._downloadedFileInfo = h, g);
    }
    getUpdateInfoFile() {
      return s.join(this.cacheDirForPendingUpdate, "update-info.json");
    }
  };
  Vt.DownloadedUpdateHelper = i;
  function o(a, u = "sha512", l = "base64", d) {
    return new Promise((f, h) => {
      const E = (0, e.createHash)(u);
      E.on("error", h).setEncoding(l), (0, r.createReadStream)(a, {
        ...d,
        highWaterMark: 1024 * 1024
        /* better to use more memory but hash faster */
      }).on("error", h).on("end", () => {
        E.end(), f(E.read());
      }).pipe(E, { end: !1 });
    });
  }
  async function c(a, u, l) {
    let d = 0, f = s.join(u, a);
    for (let h = 0; h < 3; h++)
      try {
        return await (0, n.unlink)(f), f;
      } catch (E) {
        if (E.code === "ENOENT")
          return f;
        l.warn(`Error on remove temp update file: ${E}`), f = s.join(u, `${d++}-${a}`);
      }
    return f;
  }
  return Vt;
}
var cr = {}, Kr = {}, lc;
function Dm() {
  if (lc) return Kr;
  lc = 1, Object.defineProperty(Kr, "__esModule", { value: !0 }), Kr.getAppCacheDir = t;
  const e = ye, r = yt;
  function t() {
    const n = (0, r.homedir)();
    let s;
    return process.platform === "win32" ? s = process.env.LOCALAPPDATA || e.join(n, "AppData", "Local") : process.platform === "darwin" ? s = e.join(n, "Library", "Caches") : s = process.env.XDG_CACHE_HOME || e.join(n, ".cache"), s;
  }
  return Kr;
}
var cc;
function xm() {
  if (cc) return cr;
  cc = 1, Object.defineProperty(cr, "__esModule", { value: !0 }), cr.ElectronAppAdapter = void 0;
  const e = ye, r = Dm();
  let t = class {
    constructor(s = wt.app) {
      this.app = s;
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
      return (0, r.getAppCacheDir)();
    }
    quit() {
      this.app.quit();
    }
    relaunch() {
      this.app.relaunch();
    }
    onQuit(s) {
      this.app.once("quit", (i, o) => s(o));
    }
  };
  return cr.ElectronAppAdapter = t, cr;
}
var vs = {}, uc;
function Pm() {
  return uc || (uc = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.ElectronHttpExecutor = e.NET_SESSION_NAME = void 0, e.getNetSession = t;
    const r = $e();
    e.NET_SESSION_NAME = "electron-updater";
    function t() {
      return wt.session.fromPartition(e.NET_SESSION_NAME, {
        cache: !1
      });
    }
    class n extends r.HttpExecutor {
      constructor(i) {
        super(), this.proxyLoginCallback = i, this.cachedSession = null;
      }
      async download(i, o, c) {
        return await c.cancellationToken.createPromise((a, u, l) => {
          const d = {
            headers: c.headers || void 0,
            redirect: "manual"
          };
          (0, r.configureRequestUrl)(i, d), (0, r.configureRequestOptions)(d), this.doDownload(d, {
            destination: o,
            options: c,
            onCancel: l,
            callback: (f) => {
              f == null ? a(o) : u(f);
            },
            responseHandler: null
          }, 0);
        });
      }
      createRequest(i, o) {
        i.headers && i.headers.Host && (i.host = i.headers.Host, delete i.headers.Host), this.cachedSession == null && (this.cachedSession = t());
        const c = wt.net.request({
          ...i,
          session: this.cachedSession
        });
        return c.on("response", o), this.proxyLoginCallback != null && c.on("login", this.proxyLoginCallback), c;
      }
      addRedirectHandlers(i, o, c, a, u) {
        i.on("redirect", (l, d, f) => {
          i.abort(), a > this.maxRedirects ? c(this.createMaxRedirectError()) : u(r.HttpExecutor.prepareRedirectUrlOptions(f, o));
        });
      }
    }
    e.ElectronHttpExecutor = n;
  })(vs)), vs;
}
var ur = {}, kt = {}, As, dc;
function Um() {
  if (dc) return As;
  dc = 1;
  var e = "[object Symbol]", r = /[\\^$.*+?()[\]{}|]/g, t = RegExp(r.source), n = typeof ot == "object" && ot && ot.Object === Object && ot, s = typeof self == "object" && self && self.Object === Object && self, i = n || s || Function("return this")(), o = Object.prototype, c = o.toString, a = i.Symbol, u = a ? a.prototype : void 0, l = u ? u.toString : void 0;
  function d(m) {
    if (typeof m == "string")
      return m;
    if (h(m))
      return l ? l.call(m) : "";
    var v = m + "";
    return v == "0" && 1 / m == -1 / 0 ? "-0" : v;
  }
  function f(m) {
    return !!m && typeof m == "object";
  }
  function h(m) {
    return typeof m == "symbol" || f(m) && c.call(m) == e;
  }
  function E(m) {
    return m == null ? "" : d(m);
  }
  function g(m) {
    return m = E(m), m && t.test(m) ? m.replace(r, "\\$&") : m;
  }
  return As = g, As;
}
var fc;
function $t() {
  if (fc) return kt;
  fc = 1, Object.defineProperty(kt, "__esModule", { value: !0 }), kt.newBaseUrl = t, kt.newUrlFromBase = n, kt.getChannelFilename = s, kt.blockmapFiles = i;
  const e = Jt, r = Um();
  function t(o) {
    const c = new e.URL(o);
    return c.pathname.endsWith("/") || (c.pathname += "/"), c;
  }
  function n(o, c, a = !1) {
    const u = new e.URL(o, c), l = c.search;
    return l != null && l.length !== 0 ? u.search = l : a && (u.search = `noCache=${Date.now().toString(32)}`), u;
  }
  function s(o) {
    return `${o}.yml`;
  }
  function i(o, c, a) {
    const u = n(`${o.pathname}.blockmap`, o);
    return [n(`${o.pathname.replace(new RegExp(r(a), "g"), c)}.blockmap`, o), u];
  }
  return kt;
}
var Tt = {}, pc;
function rt() {
  if (pc) return Tt;
  pc = 1, Object.defineProperty(Tt, "__esModule", { value: !0 }), Tt.Provider = void 0, Tt.findFile = s, Tt.parseUpdateInfo = i, Tt.getFileList = o, Tt.resolveFiles = c;
  const e = $e(), r = ao(), t = $t();
  let n = class {
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
    httpRequest(u, l, d) {
      return this.executor.request(this.createRequestOptions(u, l), d);
    }
    createRequestOptions(u, l) {
      const d = {};
      return this.requestHeaders == null ? l != null && (d.headers = l) : d.headers = l == null ? this.requestHeaders : { ...this.requestHeaders, ...l }, (0, e.configureRequestUrl)(u, d), d;
    }
  };
  Tt.Provider = n;
  function s(a, u, l) {
    if (a.length === 0)
      throw (0, e.newError)("No files provided", "ERR_UPDATER_NO_FILES_PROVIDED");
    const d = a.find((f) => f.url.pathname.toLowerCase().endsWith(`.${u}`));
    return d ?? (l == null ? a[0] : a.find((f) => !l.some((h) => f.url.pathname.toLowerCase().endsWith(`.${h}`))));
  }
  function i(a, u, l) {
    if (a == null)
      throw (0, e.newError)(`Cannot parse update info from ${u} in the latest release artifacts (${l}): rawData: null`, "ERR_UPDATER_INVALID_UPDATE_INFO");
    let d;
    try {
      d = (0, r.load)(a);
    } catch (f) {
      throw (0, e.newError)(`Cannot parse update info from ${u} in the latest release artifacts (${l}): ${f.stack || f.message}, rawData: ${a}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
    }
    return d;
  }
  function o(a) {
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
  function c(a, u, l = (d) => d) {
    const f = o(a).map((g) => {
      if (g.sha2 == null && g.sha512 == null)
        throw (0, e.newError)(`Update info doesn't contain nor sha256 neither sha512 checksum: ${(0, e.safeStringifyJson)(g)}`, "ERR_UPDATER_NO_CHECKSUM");
      return {
        url: (0, t.newUrlFromBase)(l(g.url), u),
        info: g
      };
    }), h = a.packages, E = h == null ? null : h[process.arch] || h.ia32;
    return E != null && (f[0].packageInfo = {
      ...E,
      path: (0, t.newUrlFromBase)(l(E.path), u).href
    }), f;
  }
  return Tt;
}
var hc;
function ud() {
  if (hc) return ur;
  hc = 1, Object.defineProperty(ur, "__esModule", { value: !0 }), ur.GenericProvider = void 0;
  const e = $e(), r = $t(), t = rt();
  let n = class extends t.Provider {
    constructor(i, o, c) {
      super(c), this.configuration = i, this.updater = o, this.baseUrl = (0, r.newBaseUrl)(this.configuration.url);
    }
    get channel() {
      const i = this.updater.channel || this.configuration.channel;
      return i == null ? this.getDefaultChannelName() : this.getCustomChannelName(i);
    }
    async getLatestVersion() {
      const i = (0, r.getChannelFilename)(this.channel), o = (0, r.newUrlFromBase)(i, this.baseUrl, this.updater.isAddNoCacheQuery);
      for (let c = 0; ; c++)
        try {
          return (0, t.parseUpdateInfo)(await this.httpRequest(o), i, o);
        } catch (a) {
          if (a instanceof e.HttpError && a.statusCode === 404)
            throw (0, e.newError)(`Cannot find channel "${i}" update info: ${a.stack || a.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
          if (a.code === "ECONNREFUSED" && c < 3) {
            await new Promise((u, l) => {
              try {
                setTimeout(u, 1e3 * c);
              } catch (d) {
                l(d);
              }
            });
            continue;
          }
          throw a;
        }
    }
    resolveFiles(i) {
      return (0, t.resolveFiles)(i, this.baseUrl);
    }
  };
  return ur.GenericProvider = n, ur;
}
var dr = {}, fr = {}, mc;
function Fm() {
  if (mc) return fr;
  mc = 1, Object.defineProperty(fr, "__esModule", { value: !0 }), fr.BitbucketProvider = void 0;
  const e = $e(), r = $t(), t = rt();
  let n = class extends t.Provider {
    constructor(i, o, c) {
      super({
        ...c,
        isUseMultipleRangeRequest: !1
      }), this.configuration = i, this.updater = o;
      const { owner: a, slug: u } = i;
      this.baseUrl = (0, r.newBaseUrl)(`https://api.bitbucket.org/2.0/repositories/${a}/${u}/downloads`);
    }
    get channel() {
      return this.updater.channel || this.configuration.channel || "latest";
    }
    async getLatestVersion() {
      const i = new e.CancellationToken(), o = (0, r.getChannelFilename)(this.getCustomChannelName(this.channel)), c = (0, r.newUrlFromBase)(o, this.baseUrl, this.updater.isAddNoCacheQuery);
      try {
        const a = await this.httpRequest(c, void 0, i);
        return (0, t.parseUpdateInfo)(a, o, c);
      } catch (a) {
        throw (0, e.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${a.stack || a.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    resolveFiles(i) {
      return (0, t.resolveFiles)(i, this.baseUrl);
    }
    toString() {
      const { owner: i, slug: o } = this.configuration;
      return `Bitbucket (owner: ${i}, slug: ${o}, channel: ${this.channel})`;
    }
  };
  return fr.BitbucketProvider = n, fr;
}
var _t = {}, Ec;
function dd() {
  if (Ec) return _t;
  Ec = 1, Object.defineProperty(_t, "__esModule", { value: !0 }), _t.GitHubProvider = _t.BaseGitHubProvider = void 0, _t.computeReleaseNotes = u;
  const e = $e(), r = cd(), t = Jt, n = $t(), s = rt(), i = /\/tag\/([^/]+)$/;
  class o extends s.Provider {
    constructor(d, f, h) {
      super({
        ...h,
        /* because GitHib uses S3 */
        isUseMultipleRangeRequest: !1
      }), this.options = d, this.baseUrl = (0, n.newBaseUrl)((0, e.githubUrl)(d, f));
      const E = f === "github.com" ? "api.github.com" : f;
      this.baseApiUrl = (0, n.newBaseUrl)((0, e.githubUrl)(d, E));
    }
    computeGithubBasePath(d) {
      const f = this.options.host;
      return f && !["github.com", "api.github.com"].includes(f) ? `/api/v3${d}` : d;
    }
  }
  _t.BaseGitHubProvider = o;
  let c = class extends o {
    constructor(d, f, h) {
      super(d, "github.com", h), this.options = d, this.updater = f;
    }
    get channel() {
      const d = this.updater.channel || this.options.channel;
      return d == null ? this.getDefaultChannelName() : this.getCustomChannelName(d);
    }
    async getLatestVersion() {
      var d, f, h, E, g;
      const m = new e.CancellationToken(), v = await this.httpRequest((0, n.newUrlFromBase)(`${this.basePath}.atom`, this.baseUrl), {
        accept: "application/xml, application/atom+xml, text/xml, */*"
      }, m), N = (0, e.parseXml)(v);
      let b = N.element("entry", !1, "No published versions on GitHub"), D = null;
      try {
        if (this.updater.allowPrerelease) {
          const q = ((d = this.updater) === null || d === void 0 ? void 0 : d.channel) || ((f = r.prerelease(this.updater.currentVersion)) === null || f === void 0 ? void 0 : f[0]) || null;
          if (q === null)
            D = i.exec(b.element("link").attribute("href"))[1];
          else
            for (const O of N.getElements("entry")) {
              const P = i.exec(O.element("link").attribute("href"));
              if (P === null)
                continue;
              const k = P[1], C = ((h = r.prerelease(k)) === null || h === void 0 ? void 0 : h[0]) || null, x = !q || ["alpha", "beta"].includes(q), $ = C !== null && !["alpha", "beta"].includes(String(C));
              if (x && !$ && !(q === "beta" && C === "alpha")) {
                D = k;
                break;
              }
              if (C && C === q) {
                D = k;
                break;
              }
            }
        } else {
          D = await this.getLatestTagName(m);
          for (const q of N.getElements("entry"))
            if (i.exec(q.element("link").attribute("href"))[1] === D) {
              b = q;
              break;
            }
        }
      } catch (q) {
        throw (0, e.newError)(`Cannot parse releases feed: ${q.stack || q.message},
XML:
${v}`, "ERR_UPDATER_INVALID_RELEASE_FEED");
      }
      if (D == null)
        throw (0, e.newError)("No published versions on GitHub", "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
      let M, _ = "", A = "";
      const S = async (q) => {
        _ = (0, n.getChannelFilename)(q), A = (0, n.newUrlFromBase)(this.getBaseDownloadPath(String(D), _), this.baseUrl);
        const O = this.createRequestOptions(A);
        try {
          return await this.executor.request(O, m);
        } catch (P) {
          throw P instanceof e.HttpError && P.statusCode === 404 ? (0, e.newError)(`Cannot find ${_} in the latest release artifacts (${A}): ${P.stack || P.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : P;
        }
      };
      try {
        let q = this.channel;
        this.updater.allowPrerelease && (!((E = r.prerelease(D)) === null || E === void 0) && E[0]) && (q = this.getCustomChannelName(String((g = r.prerelease(D)) === null || g === void 0 ? void 0 : g[0]))), M = await S(q);
      } catch (q) {
        if (this.updater.allowPrerelease)
          M = await S(this.getDefaultChannelName());
        else
          throw q;
      }
      const y = (0, s.parseUpdateInfo)(M, _, A);
      return y.releaseName == null && (y.releaseName = b.elementValueOrEmpty("title")), y.releaseNotes == null && (y.releaseNotes = u(this.updater.currentVersion, this.updater.fullChangelog, N, b)), {
        tag: D,
        ...y
      };
    }
    async getLatestTagName(d) {
      const f = this.options, h = f.host == null || f.host === "github.com" ? (0, n.newUrlFromBase)(`${this.basePath}/latest`, this.baseUrl) : new t.URL(`${this.computeGithubBasePath(`/repos/${f.owner}/${f.repo}/releases`)}/latest`, this.baseApiUrl);
      try {
        const E = await this.httpRequest(h, { Accept: "application/json" }, d);
        return E == null ? null : JSON.parse(E).tag_name;
      } catch (E) {
        throw (0, e.newError)(`Unable to find latest version on GitHub (${h}), please ensure a production release exists: ${E.stack || E.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    get basePath() {
      return `/${this.options.owner}/${this.options.repo}/releases`;
    }
    resolveFiles(d) {
      return (0, s.resolveFiles)(d, this.baseUrl, (f) => this.getBaseDownloadPath(d.tag, f.replace(/ /g, "-")));
    }
    getBaseDownloadPath(d, f) {
      return `${this.basePath}/download/${d}/${f}`;
    }
  };
  _t.GitHubProvider = c;
  function a(l) {
    const d = l.elementValueOrEmpty("content");
    return d === "No content." ? "" : d;
  }
  function u(l, d, f, h) {
    if (!d)
      return a(h);
    const E = [];
    for (const g of f.getElements("entry")) {
      const m = /\/tag\/v?([^/]+)$/.exec(g.element("link").attribute("href"))[1];
      r.lt(l, m) && E.push({
        version: m,
        note: a(g)
      });
    }
    return E.sort((g, m) => r.rcompare(g.version, m.version));
  }
  return _t;
}
var pr = {}, gc;
function km() {
  if (gc) return pr;
  gc = 1, Object.defineProperty(pr, "__esModule", { value: !0 }), pr.KeygenProvider = void 0;
  const e = $e(), r = $t(), t = rt();
  let n = class extends t.Provider {
    constructor(i, o, c) {
      super({
        ...c,
        isUseMultipleRangeRequest: !1
      }), this.configuration = i, this.updater = o, this.defaultHostname = "api.keygen.sh";
      const a = this.configuration.host || this.defaultHostname;
      this.baseUrl = (0, r.newBaseUrl)(`https://${a}/v1/accounts/${this.configuration.account}/artifacts?product=${this.configuration.product}`);
    }
    get channel() {
      return this.updater.channel || this.configuration.channel || "stable";
    }
    async getLatestVersion() {
      const i = new e.CancellationToken(), o = (0, r.getChannelFilename)(this.getCustomChannelName(this.channel)), c = (0, r.newUrlFromBase)(o, this.baseUrl, this.updater.isAddNoCacheQuery);
      try {
        const a = await this.httpRequest(c, {
          Accept: "application/vnd.api+json",
          "Keygen-Version": "1.1"
        }, i);
        return (0, t.parseUpdateInfo)(a, o, c);
      } catch (a) {
        throw (0, e.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${a.stack || a.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    resolveFiles(i) {
      return (0, t.resolveFiles)(i, this.baseUrl);
    }
    toString() {
      const { account: i, product: o, platform: c } = this.configuration;
      return `Keygen (account: ${i}, product: ${o}, platform: ${c}, channel: ${this.channel})`;
    }
  };
  return pr.KeygenProvider = n, pr;
}
var hr = {}, Tc;
function Mm() {
  if (Tc) return hr;
  Tc = 1, Object.defineProperty(hr, "__esModule", { value: !0 }), hr.PrivateGitHubProvider = void 0;
  const e = $e(), r = ao(), t = ye, n = Jt, s = $t(), i = dd(), o = rt();
  let c = class extends i.BaseGitHubProvider {
    constructor(u, l, d, f) {
      super(u, "api.github.com", f), this.updater = l, this.token = d;
    }
    createRequestOptions(u, l) {
      const d = super.createRequestOptions(u, l);
      return d.redirect = "manual", d;
    }
    async getLatestVersion() {
      const u = new e.CancellationToken(), l = (0, s.getChannelFilename)(this.getDefaultChannelName()), d = await this.getLatestVersionInfo(u), f = d.assets.find((g) => g.name === l);
      if (f == null)
        throw (0, e.newError)(`Cannot find ${l} in the release ${d.html_url || d.name}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
      const h = new n.URL(f.url);
      let E;
      try {
        E = (0, r.load)(await this.httpRequest(h, this.configureHeaders("application/octet-stream"), u));
      } catch (g) {
        throw g instanceof e.HttpError && g.statusCode === 404 ? (0, e.newError)(`Cannot find ${l} in the latest release artifacts (${h}): ${g.stack || g.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : g;
      }
      return E.assets = d.assets, E;
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
      const l = this.updater.allowPrerelease;
      let d = this.basePath;
      l || (d = `${d}/latest`);
      const f = (0, s.newUrlFromBase)(d, this.baseUrl);
      try {
        const h = JSON.parse(await this.httpRequest(f, this.configureHeaders("application/vnd.github.v3+json"), u));
        return l ? h.find((E) => E.prerelease) || h[0] : h;
      } catch (h) {
        throw (0, e.newError)(`Unable to find latest version on GitHub (${f}), please ensure a production release exists: ${h.stack || h.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    get basePath() {
      return this.computeGithubBasePath(`/repos/${this.options.owner}/${this.options.repo}/releases`);
    }
    resolveFiles(u) {
      return (0, o.getFileList)(u).map((l) => {
        const d = t.posix.basename(l.url).replace(/ /g, "-"), f = u.assets.find((h) => h != null && h.name === d);
        if (f == null)
          throw (0, e.newError)(`Cannot find asset "${d}" in: ${JSON.stringify(u.assets, null, 2)}`, "ERR_UPDATER_ASSET_NOT_FOUND");
        return {
          url: new n.URL(f.url),
          info: l
        };
      });
    }
  };
  return hr.PrivateGitHubProvider = c, hr;
}
var yc;
function qm() {
  if (yc) return dr;
  yc = 1, Object.defineProperty(dr, "__esModule", { value: !0 }), dr.isUrlProbablySupportMultiRangeRequests = o, dr.createClient = c;
  const e = $e(), r = Fm(), t = ud(), n = dd(), s = km(), i = Mm();
  function o(a) {
    return !a.includes("s3.amazonaws.com");
  }
  function c(a, u, l) {
    if (typeof a == "string")
      throw (0, e.newError)("Please pass PublishConfiguration object", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
    const d = a.provider;
    switch (d) {
      case "github": {
        const f = a, h = (f.private ? process.env.GH_TOKEN || process.env.GITHUB_TOKEN : null) || f.token;
        return h == null ? new n.GitHubProvider(f, u, l) : new i.PrivateGitHubProvider(f, u, h, l);
      }
      case "bitbucket":
        return new r.BitbucketProvider(a, u, l);
      case "keygen":
        return new s.KeygenProvider(a, u, l);
      case "s3":
      case "spaces":
        return new t.GenericProvider({
          provider: "generic",
          url: (0, e.getS3LikeProviderBaseUrl)(a),
          channel: a.channel || null
        }, u, {
          ...l,
          // https://github.com/minio/minio/issues/5285#issuecomment-350428955
          isUseMultipleRangeRequest: !1
        });
      case "generic": {
        const f = a;
        return new t.GenericProvider(f, u, {
          ...l,
          isUseMultipleRangeRequest: f.useMultipleRangeRequest !== !1 && o(f.url)
        });
      }
      case "custom": {
        const f = a, h = f.updateProvider;
        if (!h)
          throw (0, e.newError)("Custom provider not specified", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
        return new h(f, u, l);
      }
      default:
        throw (0, e.newError)(`Unsupported provider: ${d}`, "ERR_UPDATER_UNSUPPORTED_PROVIDER");
    }
  }
  return dr;
}
var mr = {}, Er = {}, Wt = {}, Yt = {}, vc;
function mo() {
  if (vc) return Yt;
  vc = 1, Object.defineProperty(Yt, "__esModule", { value: !0 }), Yt.OperationKind = void 0, Yt.computeOperations = r;
  var e;
  (function(o) {
    o[o.COPY = 0] = "COPY", o[o.DOWNLOAD = 1] = "DOWNLOAD";
  })(e || (Yt.OperationKind = e = {}));
  function r(o, c, a) {
    const u = i(o.files), l = i(c.files);
    let d = null;
    const f = c.files[0], h = [], E = f.name, g = u.get(E);
    if (g == null)
      throw new Error(`no file ${E} in old blockmap`);
    const m = l.get(E);
    let v = 0;
    const { checksumToOffset: N, checksumToOldSize: b } = s(u.get(E), g.offset, a);
    let D = f.offset;
    for (let M = 0; M < m.checksums.length; D += m.sizes[M], M++) {
      const _ = m.sizes[M], A = m.checksums[M];
      let S = N.get(A);
      S != null && b.get(A) !== _ && (a.warn(`Checksum ("${A}") matches, but size differs (old: ${b.get(A)}, new: ${_})`), S = void 0), S === void 0 ? (v++, d != null && d.kind === e.DOWNLOAD && d.end === D ? d.end += _ : (d = {
        kind: e.DOWNLOAD,
        start: D,
        end: D + _
        // oldBlocks: null,
      }, n(d, h, A, M))) : d != null && d.kind === e.COPY && d.end === S ? d.end += _ : (d = {
        kind: e.COPY,
        start: S,
        end: S + _
        // oldBlocks: [checksum]
      }, n(d, h, A, M));
    }
    return v > 0 && a.info(`File${f.name === "file" ? "" : " " + f.name} has ${v} changed blocks`), h;
  }
  const t = process.env.DIFFERENTIAL_DOWNLOAD_PLAN_BUILDER_VALIDATE_RANGES === "true";
  function n(o, c, a, u) {
    if (t && c.length !== 0) {
      const l = c[c.length - 1];
      if (l.kind === o.kind && o.start < l.end && o.start > l.start) {
        const d = [l.start, l.end, o.start, o.end].reduce((f, h) => f < h ? f : h);
        throw new Error(`operation (block index: ${u}, checksum: ${a}, kind: ${e[o.kind]}) overlaps previous operation (checksum: ${a}):
abs: ${l.start} until ${l.end} and ${o.start} until ${o.end}
rel: ${l.start - d} until ${l.end - d} and ${o.start - d} until ${o.end - d}`);
      }
    }
    c.push(o);
  }
  function s(o, c, a) {
    const u = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Map();
    let d = c;
    for (let f = 0; f < o.checksums.length; f++) {
      const h = o.checksums[f], E = o.sizes[f], g = l.get(h);
      if (g === void 0)
        u.set(h, d), l.set(h, E);
      else if (a.debug != null) {
        const m = g === E ? "(same size)" : `(size: ${g}, this size: ${E})`;
        a.debug(`${h} duplicated in blockmap ${m}, it doesn't lead to broken differential downloader, just corresponding block will be skipped)`);
      }
      d += E;
    }
    return { checksumToOffset: u, checksumToOldSize: l };
  }
  function i(o) {
    const c = /* @__PURE__ */ new Map();
    for (const a of o)
      c.set(a.name, a);
    return c;
  }
  return Yt;
}
var Ac;
function fd() {
  if (Ac) return Wt;
  Ac = 1, Object.defineProperty(Wt, "__esModule", { value: !0 }), Wt.DataSplitter = void 0, Wt.copyData = o;
  const e = $e(), r = be, t = Or, n = mo(), s = Buffer.from(`\r
\r
`);
  var i;
  (function(a) {
    a[a.INIT = 0] = "INIT", a[a.HEADER = 1] = "HEADER", a[a.BODY = 2] = "BODY";
  })(i || (i = {}));
  function o(a, u, l, d, f) {
    const h = (0, r.createReadStream)("", {
      fd: l,
      autoClose: !1,
      start: a.start,
      // end is inclusive
      end: a.end - 1
    });
    h.on("error", d), h.once("end", f), h.pipe(u, {
      end: !1
    });
  }
  let c = class extends t.Writable {
    constructor(u, l, d, f, h, E) {
      super(), this.out = u, this.options = l, this.partIndexToTaskIndex = d, this.partIndexToLength = h, this.finishHandler = E, this.partIndex = -1, this.headerListBuffer = null, this.readState = i.INIT, this.ignoreByteCount = 0, this.remainingPartDataCount = 0, this.actualPartLength = 0, this.boundaryLength = f.length + 4, this.ignoreByteCount = this.boundaryLength - 2;
    }
    get isFinished() {
      return this.partIndex === this.partIndexToLength.length;
    }
    // noinspection JSUnusedGlobalSymbols
    _write(u, l, d) {
      if (this.isFinished) {
        console.error(`Trailing ignored data: ${u.length} bytes`);
        return;
      }
      this.handleData(u).then(d).catch(d);
    }
    async handleData(u) {
      let l = 0;
      if (this.ignoreByteCount !== 0 && this.remainingPartDataCount !== 0)
        throw (0, e.newError)("Internal error", "ERR_DATA_SPLITTER_BYTE_COUNT_MISMATCH");
      if (this.ignoreByteCount > 0) {
        const d = Math.min(this.ignoreByteCount, u.length);
        this.ignoreByteCount -= d, l = d;
      } else if (this.remainingPartDataCount > 0) {
        const d = Math.min(this.remainingPartDataCount, u.length);
        this.remainingPartDataCount -= d, await this.processPartData(u, 0, d), l = d;
      }
      if (l !== u.length) {
        if (this.readState === i.HEADER) {
          const d = this.searchHeaderListEnd(u, l);
          if (d === -1)
            return;
          l = d, this.readState = i.BODY, this.headerListBuffer = null;
        }
        for (; ; ) {
          if (this.readState === i.BODY)
            this.readState = i.INIT;
          else {
            this.partIndex++;
            let E = this.partIndexToTaskIndex.get(this.partIndex);
            if (E == null)
              if (this.isFinished)
                E = this.options.end;
              else
                throw (0, e.newError)("taskIndex is null", "ERR_DATA_SPLITTER_TASK_INDEX_IS_NULL");
            const g = this.partIndex === 0 ? this.options.start : this.partIndexToTaskIndex.get(this.partIndex - 1) + 1;
            if (g < E)
              await this.copyExistingData(g, E);
            else if (g > E)
              throw (0, e.newError)("prevTaskIndex must be < taskIndex", "ERR_DATA_SPLITTER_TASK_INDEX_ASSERT_FAILED");
            if (this.isFinished) {
              this.onPartEnd(), this.finishHandler();
              return;
            }
            if (l = this.searchHeaderListEnd(u, l), l === -1) {
              this.readState = i.HEADER;
              return;
            }
          }
          const d = this.partIndexToLength[this.partIndex], f = l + d, h = Math.min(f, u.length);
          if (await this.processPartStarted(u, l, h), this.remainingPartDataCount = d - (h - l), this.remainingPartDataCount > 0)
            return;
          if (l = f + this.boundaryLength, l >= u.length) {
            this.ignoreByteCount = this.boundaryLength - (u.length - f);
            return;
          }
        }
      }
    }
    copyExistingData(u, l) {
      return new Promise((d, f) => {
        const h = () => {
          if (u === l) {
            d();
            return;
          }
          const E = this.options.tasks[u];
          if (E.kind !== n.OperationKind.COPY) {
            f(new Error("Task kind must be COPY"));
            return;
          }
          o(E, this.out, this.options.oldFileFd, f, () => {
            u++, h();
          });
        };
        h();
      });
    }
    searchHeaderListEnd(u, l) {
      const d = u.indexOf(s, l);
      if (d !== -1)
        return d + s.length;
      const f = l === 0 ? u : u.slice(l);
      return this.headerListBuffer == null ? this.headerListBuffer = f : this.headerListBuffer = Buffer.concat([this.headerListBuffer, f]), -1;
    }
    onPartEnd() {
      const u = this.partIndexToLength[this.partIndex - 1];
      if (this.actualPartLength !== u)
        throw (0, e.newError)(`Expected length: ${u} differs from actual: ${this.actualPartLength}`, "ERR_DATA_SPLITTER_LENGTH_MISMATCH");
      this.actualPartLength = 0;
    }
    processPartStarted(u, l, d) {
      return this.partIndex !== 0 && this.onPartEnd(), this.processPartData(u, l, d);
    }
    processPartData(u, l, d) {
      this.actualPartLength += d - l;
      const f = this.out;
      return f.write(l === 0 && u.length === d ? u : u.slice(l, d)) ? Promise.resolve() : new Promise((h, E) => {
        f.on("error", E), f.once("drain", () => {
          f.removeListener("error", E), h();
        });
      });
    }
  };
  return Wt.DataSplitter = c, Wt;
}
var gr = {}, Ic;
function $m() {
  if (Ic) return gr;
  Ic = 1, Object.defineProperty(gr, "__esModule", { value: !0 }), gr.executeTasksUsingMultipleRangeRequests = n, gr.checkIsRangesSupported = i;
  const e = $e(), r = fd(), t = mo();
  function n(o, c, a, u, l) {
    const d = (f) => {
      if (f >= c.length) {
        o.fileMetadataBuffer != null && a.write(o.fileMetadataBuffer), a.end();
        return;
      }
      const h = f + 1e3;
      s(o, {
        tasks: c,
        start: f,
        end: Math.min(c.length, h),
        oldFileFd: u
      }, a, () => d(h), l);
    };
    return d;
  }
  function s(o, c, a, u, l) {
    let d = "bytes=", f = 0;
    const h = /* @__PURE__ */ new Map(), E = [];
    for (let v = c.start; v < c.end; v++) {
      const N = c.tasks[v];
      N.kind === t.OperationKind.DOWNLOAD && (d += `${N.start}-${N.end - 1}, `, h.set(f, v), f++, E.push(N.end - N.start));
    }
    if (f <= 1) {
      const v = (N) => {
        if (N >= c.end) {
          u();
          return;
        }
        const b = c.tasks[N++];
        if (b.kind === t.OperationKind.COPY)
          (0, r.copyData)(b, a, c.oldFileFd, l, () => v(N));
        else {
          const D = o.createRequestOptions();
          D.headers.Range = `bytes=${b.start}-${b.end - 1}`;
          const M = o.httpExecutor.createRequest(D, (_) => {
            i(_, l) && (_.pipe(a, {
              end: !1
            }), _.once("end", () => v(N)));
          });
          o.httpExecutor.addErrorAndTimeoutHandlers(M, l), M.end();
        }
      };
      v(c.start);
      return;
    }
    const g = o.createRequestOptions();
    g.headers.Range = d.substring(0, d.length - 2);
    const m = o.httpExecutor.createRequest(g, (v) => {
      if (!i(v, l))
        return;
      const N = (0, e.safeGetHeader)(v, "content-type"), b = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i.exec(N);
      if (b == null) {
        l(new Error(`Content-Type "multipart/byteranges" is expected, but got "${N}"`));
        return;
      }
      const D = new r.DataSplitter(a, c, h, b[1] || b[2], E, u);
      D.on("error", l), v.pipe(D), v.on("end", () => {
        setTimeout(() => {
          m.abort(), l(new Error("Response ends without calling any handlers"));
        }, 1e4);
      });
    });
    o.httpExecutor.addErrorAndTimeoutHandlers(m, l), m.end();
  }
  function i(o, c) {
    if (o.statusCode >= 400)
      return c((0, e.createHttpError)(o)), !1;
    if (o.statusCode !== 206) {
      const a = (0, e.safeGetHeader)(o, "accept-ranges");
      if (a == null || a === "none")
        return c(new Error(`Server doesn't support Accept-Ranges (response code ${o.statusCode})`)), !1;
    }
    return !0;
  }
  return gr;
}
var Tr = {}, Sc;
function Xm() {
  if (Sc) return Tr;
  Sc = 1, Object.defineProperty(Tr, "__esModule", { value: !0 }), Tr.ProgressDifferentialDownloadCallbackTransform = void 0;
  const e = Or;
  var r;
  (function(n) {
    n[n.COPY = 0] = "COPY", n[n.DOWNLOAD = 1] = "DOWNLOAD";
  })(r || (r = {}));
  let t = class extends e.Transform {
    constructor(s, i, o) {
      super(), this.progressDifferentialDownloadInfo = s, this.cancellationToken = i, this.onProgress = o, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.expectedBytes = 0, this.index = 0, this.operationType = r.COPY, this.nextUpdate = this.start + 1e3;
    }
    _transform(s, i, o) {
      if (this.cancellationToken.cancelled) {
        o(new Error("cancelled"), null);
        return;
      }
      if (this.operationType == r.COPY) {
        o(null, s);
        return;
      }
      this.transferred += s.length, this.delta += s.length;
      const c = Date.now();
      c >= this.nextUpdate && this.transferred !== this.expectedBytes && this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && (this.nextUpdate = c + 1e3, this.onProgress({
        total: this.progressDifferentialDownloadInfo.grandTotal,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
        bytesPerSecond: Math.round(this.transferred / ((c - this.start) / 1e3))
      }), this.delta = 0), o(null, s);
    }
    beginFileCopy() {
      this.operationType = r.COPY;
    }
    beginRangeDownload() {
      this.operationType = r.DOWNLOAD, this.expectedBytes += this.progressDifferentialDownloadInfo.expectedByteCounts[this.index++];
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
    _flush(s) {
      if (this.cancellationToken.cancelled) {
        s(new Error("cancelled"));
        return;
      }
      this.onProgress({
        total: this.progressDifferentialDownloadInfo.grandTotal,
        delta: this.delta,
        transferred: this.transferred,
        percent: 100,
        bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
      }), this.delta = 0, this.transferred = 0, s(null);
    }
  };
  return Tr.ProgressDifferentialDownloadCallbackTransform = t, Tr;
}
var Nc;
function pd() {
  if (Nc) return Er;
  Nc = 1, Object.defineProperty(Er, "__esModule", { value: !0 }), Er.DifferentialDownloader = void 0;
  const e = $e(), r = /* @__PURE__ */ Rt(), t = be, n = fd(), s = Jt, i = mo(), o = $m(), c = Xm();
  let a = class {
    // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
    constructor(f, h, E) {
      this.blockAwareFileInfo = f, this.httpExecutor = h, this.options = E, this.fileMetadataBuffer = null, this.logger = E.logger;
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
    doDownload(f, h) {
      if (f.version !== h.version)
        throw new Error(`version is different (${f.version} - ${h.version}), full download is required`);
      const E = this.logger, g = (0, i.computeOperations)(f, h, E);
      E.debug != null && E.debug(JSON.stringify(g, null, 2));
      let m = 0, v = 0;
      for (const b of g) {
        const D = b.end - b.start;
        b.kind === i.OperationKind.DOWNLOAD ? m += D : v += D;
      }
      const N = this.blockAwareFileInfo.size;
      if (m + v + (this.fileMetadataBuffer == null ? 0 : this.fileMetadataBuffer.length) !== N)
        throw new Error(`Internal error, size mismatch: downloadSize: ${m}, copySize: ${v}, newSize: ${N}`);
      return E.info(`Full: ${u(N)}, To download: ${u(m)} (${Math.round(m / (N / 100))}%)`), this.downloadFile(g);
    }
    downloadFile(f) {
      const h = [], E = () => Promise.all(h.map((g) => (0, r.close)(g.descriptor).catch((m) => {
        this.logger.error(`cannot close file "${g.path}": ${m}`);
      })));
      return this.doDownloadFile(f, h).then(E).catch((g) => E().catch((m) => {
        try {
          this.logger.error(`cannot close files: ${m}`);
        } catch (v) {
          try {
            console.error(v);
          } catch {
          }
        }
        throw g;
      }).then(() => {
        throw g;
      }));
    }
    async doDownloadFile(f, h) {
      const E = await (0, r.open)(this.options.oldFile, "r");
      h.push({ descriptor: E, path: this.options.oldFile });
      const g = await (0, r.open)(this.options.newFile, "w");
      h.push({ descriptor: g, path: this.options.newFile });
      const m = (0, t.createWriteStream)(this.options.newFile, { fd: g });
      await new Promise((v, N) => {
        const b = [];
        let D;
        if (!this.options.isUseMultipleRangeRequest && this.options.onProgress) {
          const P = [];
          let k = 0;
          for (const x of f)
            x.kind === i.OperationKind.DOWNLOAD && (P.push(x.end - x.start), k += x.end - x.start);
          const C = {
            expectedByteCounts: P,
            grandTotal: k
          };
          D = new c.ProgressDifferentialDownloadCallbackTransform(C, this.options.cancellationToken, this.options.onProgress), b.push(D);
        }
        const M = new e.DigestTransform(this.blockAwareFileInfo.sha512);
        M.isValidateOnEnd = !1, b.push(M), m.on("finish", () => {
          m.close(() => {
            h.splice(1, 1);
            try {
              M.validate();
            } catch (P) {
              N(P);
              return;
            }
            v(void 0);
          });
        }), b.push(m);
        let _ = null;
        for (const P of b)
          P.on("error", N), _ == null ? _ = P : _ = _.pipe(P);
        const A = b[0];
        let S;
        if (this.options.isUseMultipleRangeRequest) {
          S = (0, o.executeTasksUsingMultipleRangeRequests)(this, f, A, E, N), S(0);
          return;
        }
        let y = 0, q = null;
        this.logger.info(`Differential download: ${this.options.newUrl}`);
        const O = this.createRequestOptions();
        O.redirect = "manual", S = (P) => {
          var k, C;
          if (P >= f.length) {
            this.fileMetadataBuffer != null && A.write(this.fileMetadataBuffer), A.end();
            return;
          }
          const x = f[P++];
          if (x.kind === i.OperationKind.COPY) {
            D && D.beginFileCopy(), (0, n.copyData)(x, A, E, N, () => S(P));
            return;
          }
          const $ = `bytes=${x.start}-${x.end - 1}`;
          O.headers.range = $, (C = (k = this.logger) === null || k === void 0 ? void 0 : k.debug) === null || C === void 0 || C.call(k, `download range: ${$}`), D && D.beginRangeDownload();
          const L = this.httpExecutor.createRequest(O, (j) => {
            j.on("error", N), j.on("aborted", () => {
              N(new Error("response has been aborted by the server"));
            }), j.statusCode >= 400 && N((0, e.createHttpError)(j)), j.pipe(A, {
              end: !1
            }), j.once("end", () => {
              D && D.endRangeDownload(), ++y === 100 ? (y = 0, setTimeout(() => S(P), 1e3)) : S(P);
            });
          });
          L.on("redirect", (j, G, re) => {
            this.logger.info(`Redirect to ${l(re)}`), q = re, (0, e.configureRequestUrl)(new s.URL(q), O), L.followRedirect();
          }), this.httpExecutor.addErrorAndTimeoutHandlers(L, N), L.end();
        }, S(0);
      });
    }
    async readRemoteBytes(f, h) {
      const E = Buffer.allocUnsafe(h + 1 - f), g = this.createRequestOptions();
      g.headers.range = `bytes=${f}-${h}`;
      let m = 0;
      if (await this.request(g, (v) => {
        v.copy(E, m), m += v.length;
      }), m !== E.length)
        throw new Error(`Received data length ${m} is not equal to expected ${E.length}`);
      return E;
    }
    request(f, h) {
      return new Promise((E, g) => {
        const m = this.httpExecutor.createRequest(f, (v) => {
          (0, o.checkIsRangesSupported)(v, g) && (v.on("error", g), v.on("aborted", () => {
            g(new Error("response has been aborted by the server"));
          }), v.on("data", h), v.on("end", () => E()));
        });
        this.httpExecutor.addErrorAndTimeoutHandlers(m, g), m.end();
      });
    }
  };
  Er.DifferentialDownloader = a;
  function u(d, f = " KB") {
    return new Intl.NumberFormat("en").format((d / 1024).toFixed(2)) + f;
  }
  function l(d) {
    const f = d.indexOf("?");
    return f < 0 ? d : d.substring(0, f);
  }
  return Er;
}
var _c;
function Bm() {
  if (_c) return mr;
  _c = 1, Object.defineProperty(mr, "__esModule", { value: !0 }), mr.GenericDifferentialDownloader = void 0;
  const e = pd();
  let r = class extends e.DifferentialDownloader {
    download(n, s) {
      return this.doDownload(n, s);
    }
  };
  return mr.GenericDifferentialDownloader = r, mr;
}
var Is = {}, wc;
function Xt() {
  return wc || (wc = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.UpdaterSignal = e.UPDATE_DOWNLOADED = e.DOWNLOAD_PROGRESS = e.CancellationToken = void 0, e.addHandler = n;
    const r = $e();
    Object.defineProperty(e, "CancellationToken", { enumerable: !0, get: function() {
      return r.CancellationToken;
    } }), e.DOWNLOAD_PROGRESS = "download-progress", e.UPDATE_DOWNLOADED = "update-downloaded";
    class t {
      constructor(i) {
        this.emitter = i;
      }
      /**
       * Emitted when an authenticating proxy is [asking for user credentials](https://github.com/electron/electron/blob/master/docs/api/client-request.md#event-login).
       */
      login(i) {
        n(this.emitter, "login", i);
      }
      progress(i) {
        n(this.emitter, e.DOWNLOAD_PROGRESS, i);
      }
      updateDownloaded(i) {
        n(this.emitter, e.UPDATE_DOWNLOADED, i);
      }
      updateCancelled(i) {
        n(this.emitter, "update-cancelled", i);
      }
    }
    e.UpdaterSignal = t;
    function n(s, i, o) {
      s.on(i, o);
    }
  })(Is)), Is;
}
var Rc;
function Eo() {
  if (Rc) return Pt;
  Rc = 1, Object.defineProperty(Pt, "__esModule", { value: !0 }), Pt.NoOpLogger = Pt.AppUpdater = void 0;
  const e = $e(), r = Me, t = yt, n = nn, s = /* @__PURE__ */ Rt(), i = ao(), o = sm(), c = ye, a = cd(), u = Cm(), l = xm(), d = Pm(), f = ud(), h = qm(), E = Su, g = $t(), m = Bm(), v = Xt();
  let N = class hd extends n.EventEmitter {
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
    set channel(_) {
      if (this._channel != null) {
        if (typeof _ != "string")
          throw (0, e.newError)(`Channel must be a string, but got: ${_}`, "ERR_UPDATER_INVALID_CHANNEL");
        if (_.length === 0)
          throw (0, e.newError)("Channel must be not an empty string", "ERR_UPDATER_INVALID_CHANNEL");
      }
      this._channel = _, this.allowDowngrade = !0;
    }
    /**
     *  Shortcut for explicitly adding auth tokens to request headers
     */
    addAuthHeader(_) {
      this.requestHeaders = Object.assign({}, this.requestHeaders, {
        authorization: _
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
    set logger(_) {
      this._logger = _ ?? new D();
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * test only
     * @private
     */
    set updateConfigPath(_) {
      this.clientPromise = null, this._appUpdateConfigPath = _, this.configOnDisk = new o.Lazy(() => this.loadUpdateConfig());
    }
    /**
     * Allows developer to override default logic for determining if an update is supported.
     * The default logic compares the `UpdateInfo` minimum system version against the `os.release()` with `semver` package
     */
    get isUpdateSupported() {
      return this._isUpdateSupported;
    }
    set isUpdateSupported(_) {
      _ && (this._isUpdateSupported = _);
    }
    constructor(_, A) {
      super(), this.autoDownload = !0, this.autoInstallOnAppQuit = !0, this.autoRunAppAfterInstall = !0, this.allowPrerelease = !1, this.fullChangelog = !1, this.allowDowngrade = !1, this.disableWebInstaller = !1, this.disableDifferentialDownload = !1, this.forceDevUpdateConfig = !1, this._channel = null, this.downloadedUpdateHelper = null, this.requestHeaders = null, this._logger = console, this.signals = new v.UpdaterSignal(this), this._appUpdateConfigPath = null, this._isUpdateSupported = (q) => this.checkIfUpdateSupported(q), this.clientPromise = null, this.stagingUserIdPromise = new o.Lazy(() => this.getOrCreateStagingUserId()), this.configOnDisk = new o.Lazy(() => this.loadUpdateConfig()), this.checkForUpdatesPromise = null, this.downloadPromise = null, this.updateInfoAndProvider = null, this._testOnlyOptions = null, this.on("error", (q) => {
        this._logger.error(`Error: ${q.stack || q.message}`);
      }), A == null ? (this.app = new l.ElectronAppAdapter(), this.httpExecutor = new d.ElectronHttpExecutor((q, O) => this.emit("login", q, O))) : (this.app = A, this.httpExecutor = null);
      const S = this.app.version, y = (0, a.parse)(S);
      if (y == null)
        throw (0, e.newError)(`App version is not a valid semver version: "${S}"`, "ERR_UPDATER_INVALID_VERSION");
      this.currentVersion = y, this.allowPrerelease = b(y), _ != null && (this.setFeedURL(_), typeof _ != "string" && _.requestHeaders && (this.requestHeaders = _.requestHeaders));
    }
    //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    getFeedURL() {
      return "Deprecated. Do not use it.";
    }
    /**
     * Configure update provider. If value is `string`, [GenericServerOptions](./publish.md#genericserveroptions) will be set with value as `url`.
     * @param options If you want to override configuration in the `app-update.yml`.
     */
    setFeedURL(_) {
      const A = this.createProviderRuntimeOptions();
      let S;
      typeof _ == "string" ? S = new f.GenericProvider({ provider: "generic", url: _ }, this, {
        ...A,
        isUseMultipleRangeRequest: (0, h.isUrlProbablySupportMultiRangeRequests)(_)
      }) : S = (0, h.createClient)(_, this, A), this.clientPromise = Promise.resolve(S);
    }
    /**
     * Asks the server whether there is an update.
     * @returns null if the updater is disabled, otherwise info about the latest version
     */
    checkForUpdates() {
      if (!this.isUpdaterActive())
        return Promise.resolve(null);
      let _ = this.checkForUpdatesPromise;
      if (_ != null)
        return this._logger.info("Checking for update (already in progress)"), _;
      const A = () => this.checkForUpdatesPromise = null;
      return this._logger.info("Checking for update"), _ = this.doCheckForUpdates().then((S) => (A(), S)).catch((S) => {
        throw A(), this.emit("error", S, `Cannot check for updates: ${(S.stack || S).toString()}`), S;
      }), this.checkForUpdatesPromise = _, _;
    }
    isUpdaterActive() {
      return this.app.isPackaged || this.forceDevUpdateConfig ? !0 : (this._logger.info("Skip checkForUpdates because application is not packed and dev update config is not forced"), !1);
    }
    // noinspection JSUnusedGlobalSymbols
    checkForUpdatesAndNotify(_) {
      return this.checkForUpdates().then((A) => A?.downloadPromise ? (A.downloadPromise.then(() => {
        const S = hd.formatDownloadNotification(A.updateInfo.version, this.app.name, _);
        new wt.Notification(S).show();
      }), A) : (this._logger.debug != null && this._logger.debug("checkForUpdatesAndNotify called, downloadPromise is null"), A));
    }
    static formatDownloadNotification(_, A, S) {
      return S == null && (S = {
        title: "A new update is ready to install",
        body: "{appName} version {version} has been downloaded and will be automatically installed on exit"
      }), S = {
        title: S.title.replace("{appName}", A).replace("{version}", _),
        body: S.body.replace("{appName}", A).replace("{version}", _)
      }, S;
    }
    async isStagingMatch(_) {
      const A = _.stagingPercentage;
      let S = A;
      if (S == null)
        return !0;
      if (S = parseInt(S, 10), isNaN(S))
        return this._logger.warn(`Staging percentage is NaN: ${A}`), !0;
      S = S / 100;
      const y = await this.stagingUserIdPromise.value, O = e.UUID.parse(y).readUInt32BE(12) / 4294967295;
      return this._logger.info(`Staging percentage: ${S}, percentage: ${O}, user id: ${y}`), O < S;
    }
    computeFinalHeaders(_) {
      return this.requestHeaders != null && Object.assign(_, this.requestHeaders), _;
    }
    async isUpdateAvailable(_) {
      const A = (0, a.parse)(_.version);
      if (A == null)
        throw (0, e.newError)(`This file could not be downloaded, or the latest version (from update server) does not have a valid semver version: "${_.version}"`, "ERR_UPDATER_INVALID_VERSION");
      const S = this.currentVersion;
      if ((0, a.eq)(A, S) || !await Promise.resolve(this.isUpdateSupported(_)) || !await this.isStagingMatch(_))
        return !1;
      const q = (0, a.gt)(A, S), O = (0, a.lt)(A, S);
      return q ? !0 : this.allowDowngrade && O;
    }
    checkIfUpdateSupported(_) {
      const A = _?.minimumSystemVersion, S = (0, t.release)();
      if (A)
        try {
          if ((0, a.lt)(S, A))
            return this._logger.info(`Current OS version ${S} is less than the minimum OS version required ${A} for version ${S}`), !1;
        } catch (y) {
          this._logger.warn(`Failed to compare current OS version(${S}) with minimum OS version(${A}): ${(y.message || y).toString()}`);
        }
      return !0;
    }
    async getUpdateInfoAndProvider() {
      await this.app.whenReady(), this.clientPromise == null && (this.clientPromise = this.configOnDisk.value.then((S) => (0, h.createClient)(S, this, this.createProviderRuntimeOptions())));
      const _ = await this.clientPromise, A = await this.stagingUserIdPromise.value;
      return _.setRequestHeaders(this.computeFinalHeaders({ "x-user-staging-id": A })), {
        info: await _.getLatestVersion(),
        provider: _
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
      const _ = await this.getUpdateInfoAndProvider(), A = _.info;
      if (!await this.isUpdateAvailable(A))
        return this._logger.info(`Update for version ${this.currentVersion.format()} is not available (latest version: ${A.version}, downgrade is ${this.allowDowngrade ? "allowed" : "disallowed"}).`), this.emit("update-not-available", A), {
          isUpdateAvailable: !1,
          versionInfo: A,
          updateInfo: A
        };
      this.updateInfoAndProvider = _, this.onUpdateAvailable(A);
      const S = new e.CancellationToken();
      return {
        isUpdateAvailable: !0,
        versionInfo: A,
        updateInfo: A,
        cancellationToken: S,
        downloadPromise: this.autoDownload ? this.downloadUpdate(S) : null
      };
    }
    onUpdateAvailable(_) {
      this._logger.info(`Found version ${_.version} (url: ${(0, e.asArray)(_.files).map((A) => A.url).join(", ")})`), this.emit("update-available", _);
    }
    /**
     * Start downloading update manually. You can use this method if `autoDownload` option is set to `false`.
     * @returns {Promise<Array<string>>} Paths to downloaded files.
     */
    downloadUpdate(_ = new e.CancellationToken()) {
      const A = this.updateInfoAndProvider;
      if (A == null) {
        const y = new Error("Please check update first");
        return this.dispatchError(y), Promise.reject(y);
      }
      if (this.downloadPromise != null)
        return this._logger.info("Downloading update (already in progress)"), this.downloadPromise;
      this._logger.info(`Downloading update from ${(0, e.asArray)(A.info.files).map((y) => y.url).join(", ")}`);
      const S = (y) => {
        if (!(y instanceof e.CancellationError))
          try {
            this.dispatchError(y);
          } catch (q) {
            this._logger.warn(`Cannot dispatch error event: ${q.stack || q}`);
          }
        return y;
      };
      return this.downloadPromise = this.doDownloadUpdate({
        updateInfoAndProvider: A,
        requestHeaders: this.computeRequestHeaders(A.provider),
        cancellationToken: _,
        disableWebInstaller: this.disableWebInstaller,
        disableDifferentialDownload: this.disableDifferentialDownload
      }).catch((y) => {
        throw S(y);
      }).finally(() => {
        this.downloadPromise = null;
      }), this.downloadPromise;
    }
    dispatchError(_) {
      this.emit("error", _, (_.stack || _).toString());
    }
    dispatchUpdateDownloaded(_) {
      this.emit(v.UPDATE_DOWNLOADED, _);
    }
    async loadUpdateConfig() {
      return this._appUpdateConfigPath == null && (this._appUpdateConfigPath = this.app.appUpdateConfigPath), (0, i.load)(await (0, s.readFile)(this._appUpdateConfigPath, "utf-8"));
    }
    computeRequestHeaders(_) {
      const A = _.fileExtraDownloadHeaders;
      if (A != null) {
        const S = this.requestHeaders;
        return S == null ? A : {
          ...A,
          ...S
        };
      }
      return this.computeFinalHeaders({ accept: "*/*" });
    }
    async getOrCreateStagingUserId() {
      const _ = c.join(this.app.userDataPath, ".updaterId");
      try {
        const S = await (0, s.readFile)(_, "utf-8");
        if (e.UUID.check(S))
          return S;
        this._logger.warn(`Staging user id file exists, but content was invalid: ${S}`);
      } catch (S) {
        S.code !== "ENOENT" && this._logger.warn(`Couldn't read staging user ID, creating a blank one: ${S}`);
      }
      const A = e.UUID.v5((0, r.randomBytes)(4096), e.UUID.OID);
      this._logger.info(`Generated new staging user ID: ${A}`);
      try {
        await (0, s.outputFile)(_, A);
      } catch (S) {
        this._logger.warn(`Couldn't write out staging user ID: ${S}`);
      }
      return A;
    }
    /** @internal */
    get isAddNoCacheQuery() {
      const _ = this.requestHeaders;
      if (_ == null)
        return !0;
      for (const A of Object.keys(_)) {
        const S = A.toLowerCase();
        if (S === "authorization" || S === "private-token")
          return !1;
      }
      return !0;
    }
    async getOrCreateDownloadHelper() {
      let _ = this.downloadedUpdateHelper;
      if (_ == null) {
        const A = (await this.configOnDisk.value).updaterCacheDirName, S = this._logger;
        A == null && S.error("updaterCacheDirName is not specified in app-update.yml Was app build using at least electron-builder 20.34.0?");
        const y = c.join(this.app.baseCachePath, A || this.app.name);
        S.debug != null && S.debug(`updater cache dir: ${y}`), _ = new u.DownloadedUpdateHelper(y), this.downloadedUpdateHelper = _;
      }
      return _;
    }
    async executeDownload(_) {
      const A = _.fileInfo, S = {
        headers: _.downloadUpdateOptions.requestHeaders,
        cancellationToken: _.downloadUpdateOptions.cancellationToken,
        sha2: A.info.sha2,
        sha512: A.info.sha512
      };
      this.listenerCount(v.DOWNLOAD_PROGRESS) > 0 && (S.onProgress = (pe) => this.emit(v.DOWNLOAD_PROGRESS, pe));
      const y = _.downloadUpdateOptions.updateInfoAndProvider.info, q = y.version, O = A.packageInfo;
      function P() {
        const pe = decodeURIComponent(_.fileInfo.url.pathname);
        return pe.endsWith(`.${_.fileExtension}`) ? c.basename(pe) : _.fileInfo.info.url;
      }
      const k = await this.getOrCreateDownloadHelper(), C = k.cacheDirForPendingUpdate;
      await (0, s.mkdir)(C, { recursive: !0 });
      const x = P();
      let $ = c.join(C, x);
      const L = O == null ? null : c.join(C, `package-${q}${c.extname(O.path) || ".7z"}`), j = async (pe) => (await k.setDownloadedFile($, L, y, A, x, pe), await _.done({
        ...y,
        downloadedFile: $
      }), L == null ? [$] : [$, L]), G = this._logger, re = await k.validateDownloadedPath($, y, A, G);
      if (re != null)
        return $ = re, await j(!1);
      const ae = async () => (await k.clear().catch(() => {
      }), await (0, s.unlink)($).catch(() => {
      })), se = await (0, u.createTempUpdateFile)(`temp-${x}`, C, G);
      try {
        await _.task(se, S, L, ae), await (0, e.retry)(() => (0, s.rename)(se, $), 60, 500, 0, 0, (pe) => pe instanceof Error && /^EBUSY:/.test(pe.message));
      } catch (pe) {
        throw await ae(), pe instanceof e.CancellationError && (G.info("cancelled"), this.emit("update-cancelled", y)), pe;
      }
      return G.info(`New version ${q} has been downloaded to ${$}`), await j(!0);
    }
    async differentialDownloadInstaller(_, A, S, y, q) {
      try {
        if (this._testOnlyOptions != null && !this._testOnlyOptions.isUseDifferentialDownload)
          return !0;
        const O = (0, g.blockmapFiles)(_.url, this.app.version, A.updateInfoAndProvider.info.version);
        this._logger.info(`Download block maps (old: "${O[0]}", new: ${O[1]})`);
        const P = async (x) => {
          const $ = await this.httpExecutor.downloadToBuffer(x, {
            headers: A.requestHeaders,
            cancellationToken: A.cancellationToken
          });
          if ($ == null || $.length === 0)
            throw new Error(`Blockmap "${x.href}" is empty`);
          try {
            return JSON.parse((0, E.gunzipSync)($).toString());
          } catch (L) {
            throw new Error(`Cannot parse blockmap "${x.href}", error: ${L}`);
          }
        }, k = {
          newUrl: _.url,
          oldFile: c.join(this.downloadedUpdateHelper.cacheDir, q),
          logger: this._logger,
          newFile: S,
          isUseMultipleRangeRequest: y.isUseMultipleRangeRequest,
          requestHeaders: A.requestHeaders,
          cancellationToken: A.cancellationToken
        };
        this.listenerCount(v.DOWNLOAD_PROGRESS) > 0 && (k.onProgress = (x) => this.emit(v.DOWNLOAD_PROGRESS, x));
        const C = await Promise.all(O.map((x) => P(x)));
        return await new m.GenericDifferentialDownloader(_.info, this.httpExecutor, k).download(C[0], C[1]), !1;
      } catch (O) {
        if (this._logger.error(`Cannot download differentially, fallback to full download: ${O.stack || O}`), this._testOnlyOptions != null)
          throw O;
        return !0;
      }
    }
  };
  Pt.AppUpdater = N;
  function b(M) {
    const _ = (0, a.prerelease)(M);
    return _ != null && _.length > 0;
  }
  class D {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    info(_) {
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    warn(_) {
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    error(_) {
    }
  }
  return Pt.NoOpLogger = D, Pt;
}
var Oc;
function er() {
  if (Oc) return ir;
  Oc = 1, Object.defineProperty(ir, "__esModule", { value: !0 }), ir.BaseUpdater = void 0;
  const e = br, r = Eo();
  let t = class extends r.AppUpdater {
    constructor(s, i) {
      super(s, i), this.quitAndInstallCalled = !1, this.quitHandlerAdded = !1;
    }
    quitAndInstall(s = !1, i = !1) {
      this._logger.info("Install on explicit quitAndInstall"), this.install(s, s ? i : this.autoRunAppAfterInstall) ? setImmediate(() => {
        wt.autoUpdater.emit("before-quit-for-update"), this.app.quit();
      }) : this.quitAndInstallCalled = !1;
    }
    executeDownload(s) {
      return super.executeDownload({
        ...s,
        done: (i) => (this.dispatchUpdateDownloaded(i), this.addQuitHandler(), Promise.resolve())
      });
    }
    get installerPath() {
      return this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.file;
    }
    // must be sync (because quit even handler is not async)
    install(s = !1, i = !1) {
      if (this.quitAndInstallCalled)
        return this._logger.warn("install call ignored: quitAndInstallCalled is set to true"), !1;
      const o = this.downloadedUpdateHelper, c = this.installerPath, a = o == null ? null : o.downloadedFileInfo;
      if (c == null || a == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      this.quitAndInstallCalled = !0;
      try {
        return this._logger.info(`Install: isSilent: ${s}, isForceRunAfter: ${i}`), this.doInstall({
          isSilent: s,
          isForceRunAfter: i,
          isAdminRightsRequired: a.isAdminRightsRequired
        });
      } catch (u) {
        return this.dispatchError(u), !1;
      }
    }
    addQuitHandler() {
      this.quitHandlerAdded || !this.autoInstallOnAppQuit || (this.quitHandlerAdded = !0, this.app.onQuit((s) => {
        if (this.quitAndInstallCalled) {
          this._logger.info("Update installer has already been triggered. Quitting application.");
          return;
        }
        if (!this.autoInstallOnAppQuit) {
          this._logger.info("Update will not be installed on quit because autoInstallOnAppQuit is set to false.");
          return;
        }
        if (s !== 0) {
          this._logger.info(`Update will be not installed on quit because application is quitting with exit code ${s}`);
          return;
        }
        this._logger.info("Auto install update on quit"), this.install(!0, !1);
      }));
    }
    wrapSudo() {
      const { name: s } = this.app, i = `"${s} would like to update"`, o = this.spawnSyncLog("which gksudo || which kdesudo || which pkexec || which beesu"), c = [o];
      return /kdesudo/i.test(o) ? (c.push("--comment", i), c.push("-c")) : /gksudo/i.test(o) ? c.push("--message", i) : /pkexec/i.test(o) && c.push("--disable-internal-agent"), c.join(" ");
    }
    spawnSyncLog(s, i = [], o = {}) {
      this._logger.info(`Executing: ${s} with args: ${i}`);
      const c = (0, e.spawnSync)(s, i, {
        env: { ...process.env, ...o },
        encoding: "utf-8",
        shell: !0
      }), { error: a, status: u, stdout: l, stderr: d } = c;
      if (a != null)
        throw this._logger.error(d), a;
      if (u != null && u !== 0)
        throw this._logger.error(d), new Error(`Command ${s} exited with code ${u}`);
      return l.trim();
    }
    /**
     * This handles both node 8 and node 10 way of emitting error when spawning a process
     *   - node 8: Throws the error
     *   - node 10: Emit the error(Need to listen with on)
     */
    // https://github.com/electron-userland/electron-builder/issues/1129
    // Node 8 sends errors: https://nodejs.org/dist/latest-v8.x/docs/api/errors.html#errors_common_system_errors
    async spawnLog(s, i = [], o = void 0, c = "ignore") {
      return this._logger.info(`Executing: ${s} with args: ${i}`), new Promise((a, u) => {
        try {
          const l = { stdio: c, env: o, detached: !0 }, d = (0, e.spawn)(s, i, l);
          d.on("error", (f) => {
            u(f);
          }), d.unref(), d.pid !== void 0 && a(!0);
        } catch (l) {
          u(l);
        }
      });
    }
  };
  return ir.BaseUpdater = t, ir;
}
var yr = {}, vr = {}, bc;
function md() {
  if (bc) return vr;
  bc = 1, Object.defineProperty(vr, "__esModule", { value: !0 }), vr.FileWithEmbeddedBlockMapDifferentialDownloader = void 0;
  const e = /* @__PURE__ */ Rt(), r = pd(), t = Su;
  let n = class extends r.DifferentialDownloader {
    async download() {
      const c = this.blockAwareFileInfo, a = c.size, u = a - (c.blockMapSize + 4);
      this.fileMetadataBuffer = await this.readRemoteBytes(u, a - 1);
      const l = s(this.fileMetadataBuffer.slice(0, this.fileMetadataBuffer.length - 4));
      await this.doDownload(await i(this.options.oldFile), l);
    }
  };
  vr.FileWithEmbeddedBlockMapDifferentialDownloader = n;
  function s(o) {
    return JSON.parse((0, t.inflateRawSync)(o).toString());
  }
  async function i(o) {
    const c = await (0, e.open)(o, "r");
    try {
      const a = (await (0, e.fstat)(c)).size, u = Buffer.allocUnsafe(4);
      await (0, e.read)(c, u, 0, u.length, a - u.length);
      const l = Buffer.allocUnsafe(u.readUInt32BE(0));
      return await (0, e.read)(c, l, 0, l.length, a - u.length - l.length), await (0, e.close)(c), s(l);
    } catch (a) {
      throw await (0, e.close)(c), a;
    }
  }
  return vr;
}
var Lc;
function Cc() {
  if (Lc) return yr;
  Lc = 1, Object.defineProperty(yr, "__esModule", { value: !0 }), yr.AppImageUpdater = void 0;
  const e = $e(), r = br, t = /* @__PURE__ */ Rt(), n = be, s = ye, i = er(), o = md(), c = rt(), a = Xt();
  let u = class extends i.BaseUpdater {
    constructor(d, f) {
      super(d, f);
    }
    isUpdaterActive() {
      return process.env.APPIMAGE == null ? (process.env.SNAP == null ? this._logger.warn("APPIMAGE env is not defined, current application is not an AppImage") : this._logger.info("SNAP env is defined, updater is disabled"), !1) : super.isUpdaterActive();
    }
    /*** @private */
    doDownloadUpdate(d) {
      const f = d.updateInfoAndProvider.provider, h = (0, c.findFile)(f.resolveFiles(d.updateInfoAndProvider.info), "AppImage", ["rpm", "deb", "pacman"]);
      return this.executeDownload({
        fileExtension: "AppImage",
        fileInfo: h,
        downloadUpdateOptions: d,
        task: async (E, g) => {
          const m = process.env.APPIMAGE;
          if (m == null)
            throw (0, e.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
          (d.disableDifferentialDownload || await this.downloadDifferential(h, m, E, f, d)) && await this.httpExecutor.download(h.url, E, g), await (0, t.chmod)(E, 493);
        }
      });
    }
    async downloadDifferential(d, f, h, E, g) {
      try {
        const m = {
          newUrl: d.url,
          oldFile: f,
          logger: this._logger,
          newFile: h,
          isUseMultipleRangeRequest: E.isUseMultipleRangeRequest,
          requestHeaders: g.requestHeaders,
          cancellationToken: g.cancellationToken
        };
        return this.listenerCount(a.DOWNLOAD_PROGRESS) > 0 && (m.onProgress = (v) => this.emit(a.DOWNLOAD_PROGRESS, v)), await new o.FileWithEmbeddedBlockMapDifferentialDownloader(d.info, this.httpExecutor, m).download(), !1;
      } catch (m) {
        return this._logger.error(`Cannot download differentially, fallback to full download: ${m.stack || m}`), process.platform === "linux";
      }
    }
    doInstall(d) {
      const f = process.env.APPIMAGE;
      if (f == null)
        throw (0, e.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
      (0, n.unlinkSync)(f);
      let h;
      const E = s.basename(f), g = this.installerPath;
      if (g == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      s.basename(g) === E || !/\d+\.\d+\.\d+/.test(E) ? h = f : h = s.join(s.dirname(f), s.basename(g)), (0, r.execFileSync)("mv", ["-f", g, h]), h !== f && this.emit("appimage-filename-updated", h);
      const m = {
        ...process.env,
        APPIMAGE_SILENT_INSTALL: "true"
      };
      return d.isForceRunAfter ? this.spawnLog(h, [], m) : (m.APPIMAGE_EXIT_AFTER_INSTALL = "true", (0, r.execFileSync)(h, [], { env: m })), !0;
    }
  };
  return yr.AppImageUpdater = u, yr;
}
var Ar = {}, Dc;
function xc() {
  if (Dc) return Ar;
  Dc = 1, Object.defineProperty(Ar, "__esModule", { value: !0 }), Ar.DebUpdater = void 0;
  const e = er(), r = rt(), t = Xt();
  let n = class extends e.BaseUpdater {
    constructor(i, o) {
      super(i, o);
    }
    /*** @private */
    doDownloadUpdate(i) {
      const o = i.updateInfoAndProvider.provider, c = (0, r.findFile)(o.resolveFiles(i.updateInfoAndProvider.info), "deb", ["AppImage", "rpm", "pacman"]);
      return this.executeDownload({
        fileExtension: "deb",
        fileInfo: c,
        downloadUpdateOptions: i,
        task: async (a, u) => {
          this.listenerCount(t.DOWNLOAD_PROGRESS) > 0 && (u.onProgress = (l) => this.emit(t.DOWNLOAD_PROGRESS, l)), await this.httpExecutor.download(c.url, a, u);
        }
      });
    }
    get installerPath() {
      var i, o;
      return (o = (i = super.installerPath) === null || i === void 0 ? void 0 : i.replace(/ /g, "\\ ")) !== null && o !== void 0 ? o : null;
    }
    doInstall(i) {
      const o = this.wrapSudo(), c = /pkexec/i.test(o) ? "" : '"', a = this.installerPath;
      if (a == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      const u = ["dpkg", "-i", a, "||", "apt-get", "install", "-f", "-y"];
      return this.spawnSyncLog(o, [`${c}/bin/bash`, "-c", `'${u.join(" ")}'${c}`]), i.isForceRunAfter && this.app.relaunch(), !0;
    }
  };
  return Ar.DebUpdater = n, Ar;
}
var Ir = {}, Pc;
function Uc() {
  if (Pc) return Ir;
  Pc = 1, Object.defineProperty(Ir, "__esModule", { value: !0 }), Ir.PacmanUpdater = void 0;
  const e = er(), r = Xt(), t = rt();
  let n = class extends e.BaseUpdater {
    constructor(i, o) {
      super(i, o);
    }
    /*** @private */
    doDownloadUpdate(i) {
      const o = i.updateInfoAndProvider.provider, c = (0, t.findFile)(o.resolveFiles(i.updateInfoAndProvider.info), "pacman", ["AppImage", "deb", "rpm"]);
      return this.executeDownload({
        fileExtension: "pacman",
        fileInfo: c,
        downloadUpdateOptions: i,
        task: async (a, u) => {
          this.listenerCount(r.DOWNLOAD_PROGRESS) > 0 && (u.onProgress = (l) => this.emit(r.DOWNLOAD_PROGRESS, l)), await this.httpExecutor.download(c.url, a, u);
        }
      });
    }
    get installerPath() {
      var i, o;
      return (o = (i = super.installerPath) === null || i === void 0 ? void 0 : i.replace(/ /g, "\\ ")) !== null && o !== void 0 ? o : null;
    }
    doInstall(i) {
      const o = this.wrapSudo(), c = /pkexec/i.test(o) ? "" : '"', a = this.installerPath;
      if (a == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      const u = ["pacman", "-U", "--noconfirm", a];
      return this.spawnSyncLog(o, [`${c}/bin/bash`, "-c", `'${u.join(" ")}'${c}`]), i.isForceRunAfter && this.app.relaunch(), !0;
    }
  };
  return Ir.PacmanUpdater = n, Ir;
}
var Sr = {}, Fc;
function kc() {
  if (Fc) return Sr;
  Fc = 1, Object.defineProperty(Sr, "__esModule", { value: !0 }), Sr.RpmUpdater = void 0;
  const e = er(), r = Xt(), t = rt();
  let n = class extends e.BaseUpdater {
    constructor(i, o) {
      super(i, o);
    }
    /*** @private */
    doDownloadUpdate(i) {
      const o = i.updateInfoAndProvider.provider, c = (0, t.findFile)(o.resolveFiles(i.updateInfoAndProvider.info), "rpm", ["AppImage", "deb", "pacman"]);
      return this.executeDownload({
        fileExtension: "rpm",
        fileInfo: c,
        downloadUpdateOptions: i,
        task: async (a, u) => {
          this.listenerCount(r.DOWNLOAD_PROGRESS) > 0 && (u.onProgress = (l) => this.emit(r.DOWNLOAD_PROGRESS, l)), await this.httpExecutor.download(c.url, a, u);
        }
      });
    }
    get installerPath() {
      var i, o;
      return (o = (i = super.installerPath) === null || i === void 0 ? void 0 : i.replace(/ /g, "\\ ")) !== null && o !== void 0 ? o : null;
    }
    doInstall(i) {
      const o = this.wrapSudo(), c = /pkexec/i.test(o) ? "" : '"', a = this.spawnSyncLog("which zypper"), u = this.installerPath;
      if (u == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      let l;
      return a ? l = [a, "--no-refresh", "install", "--allow-unsigned-rpm", "-y", "-f", u] : l = [this.spawnSyncLog("which dnf || which yum"), "-y", "install", u], this.spawnSyncLog(o, [`${c}/bin/bash`, "-c", `'${l.join(" ")}'${c}`]), i.isForceRunAfter && this.app.relaunch(), !0;
    }
  };
  return Sr.RpmUpdater = n, Sr;
}
var Nr = {}, Mc;
function qc() {
  if (Mc) return Nr;
  Mc = 1, Object.defineProperty(Nr, "__esModule", { value: !0 }), Nr.MacUpdater = void 0;
  const e = $e(), r = /* @__PURE__ */ Rt(), t = be, n = ye, s = Nu, i = Eo(), o = rt(), c = br, a = Me;
  let u = class extends i.AppUpdater {
    constructor(d, f) {
      super(d, f), this.nativeUpdater = wt.autoUpdater, this.squirrelDownloadedUpdate = !1, this.nativeUpdater.on("error", (h) => {
        this._logger.warn(h), this.emit("error", h);
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
      const h = this._logger, E = "sysctl.proc_translated";
      let g = !1;
      try {
        this.debug("Checking for macOS Rosetta environment"), g = (0, c.execFileSync)("sysctl", [E], { encoding: "utf8" }).includes(`${E}: 1`), h.info(`Checked for macOS Rosetta environment (isRosetta=${g})`);
      } catch (M) {
        h.warn(`sysctl shell command to check for macOS Rosetta environment failed: ${M}`);
      }
      let m = !1;
      try {
        this.debug("Checking for arm64 in uname");
        const _ = (0, c.execFileSync)("uname", ["-a"], { encoding: "utf8" }).includes("ARM");
        h.info(`Checked 'uname -a': arm64=${_}`), m = m || _;
      } catch (M) {
        h.warn(`uname shell command to check for arm64 failed: ${M}`);
      }
      m = m || process.arch === "arm64" || g;
      const v = (M) => {
        var _;
        return M.url.pathname.includes("arm64") || ((_ = M.info.url) === null || _ === void 0 ? void 0 : _.includes("arm64"));
      };
      m && f.some(v) ? f = f.filter((M) => m === v(M)) : f = f.filter((M) => !v(M));
      const N = (0, o.findFile)(f, "zip", ["pkg", "dmg"]);
      if (N == null)
        throw (0, e.newError)(`ZIP file not provided: ${(0, e.safeStringifyJson)(f)}`, "ERR_UPDATER_ZIP_FILE_NOT_FOUND");
      const b = d.updateInfoAndProvider.provider, D = "update.zip";
      return this.executeDownload({
        fileExtension: "zip",
        fileInfo: N,
        downloadUpdateOptions: d,
        task: async (M, _) => {
          const A = n.join(this.downloadedUpdateHelper.cacheDir, D), S = () => (0, r.pathExistsSync)(A) ? !d.disableDifferentialDownload : (h.info("Unable to locate previous update.zip for differential download (is this first install?), falling back to full download"), !1);
          let y = !0;
          S() && (y = await this.differentialDownloadInstaller(N, d, M, b, D)), y && await this.httpExecutor.download(N.url, M, _);
        },
        done: async (M) => {
          if (!d.disableDifferentialDownload)
            try {
              const _ = n.join(this.downloadedUpdateHelper.cacheDir, D);
              await (0, r.copyFile)(M.downloadedFile, _);
            } catch (_) {
              this._logger.warn(`Unable to copy file for caching for future differential downloads: ${_.message}`);
            }
          return this.updateDownloaded(N, M);
        }
      });
    }
    async updateDownloaded(d, f) {
      var h;
      const E = f.downloadedFile, g = (h = d.info.size) !== null && h !== void 0 ? h : (await (0, r.stat)(E)).size, m = this._logger, v = `fileToProxy=${d.url.href}`;
      this.closeServerIfExists(), this.debug(`Creating proxy server for native Squirrel.Mac (${v})`), this.server = (0, s.createServer)(), this.debug(`Proxy server for native Squirrel.Mac is created (${v})`), this.server.on("close", () => {
        m.info(`Proxy server for native Squirrel.Mac is closed (${v})`);
      });
      const N = (b) => {
        const D = b.address();
        return typeof D == "string" ? D : `http://127.0.0.1:${D?.port}`;
      };
      return await new Promise((b, D) => {
        const M = (0, a.randomBytes)(64).toString("base64").replace(/\//g, "_").replace(/\+/g, "-"), _ = Buffer.from(`autoupdater:${M}`, "ascii"), A = `/${(0, a.randomBytes)(64).toString("hex")}.zip`;
        this.server.on("request", (S, y) => {
          const q = S.url;
          if (m.info(`${q} requested`), q === "/") {
            if (!S.headers.authorization || S.headers.authorization.indexOf("Basic ") === -1) {
              y.statusCode = 401, y.statusMessage = "Invalid Authentication Credentials", y.end(), m.warn("No authenthication info");
              return;
            }
            const k = S.headers.authorization.split(" ")[1], C = Buffer.from(k, "base64").toString("ascii"), [x, $] = C.split(":");
            if (x !== "autoupdater" || $ !== M) {
              y.statusCode = 401, y.statusMessage = "Invalid Authentication Credentials", y.end(), m.warn("Invalid authenthication credentials");
              return;
            }
            const L = Buffer.from(`{ "url": "${N(this.server)}${A}" }`);
            y.writeHead(200, { "Content-Type": "application/json", "Content-Length": L.length }), y.end(L);
            return;
          }
          if (!q.startsWith(A)) {
            m.warn(`${q} requested, but not supported`), y.writeHead(404), y.end();
            return;
          }
          m.info(`${A} requested by Squirrel.Mac, pipe ${E}`);
          let O = !1;
          y.on("finish", () => {
            O || (this.nativeUpdater.removeListener("error", D), b([]));
          });
          const P = (0, t.createReadStream)(E);
          P.on("error", (k) => {
            try {
              y.end();
            } catch (C) {
              m.warn(`cannot end response: ${C}`);
            }
            O = !0, this.nativeUpdater.removeListener("error", D), D(new Error(`Cannot pipe "${E}": ${k}`));
          }), y.writeHead(200, {
            "Content-Type": "application/zip",
            "Content-Length": g
          }), P.pipe(y);
        }), this.debug(`Proxy server for native Squirrel.Mac is starting to listen (${v})`), this.server.listen(0, "127.0.0.1", () => {
          this.debug(`Proxy server for native Squirrel.Mac is listening (address=${N(this.server)}, ${v})`), this.nativeUpdater.setFeedURL({
            url: N(this.server),
            headers: {
              "Cache-Control": "no-cache",
              Authorization: `Basic ${_.toString("base64")}`
            }
          }), this.dispatchUpdateDownloaded(f), this.autoInstallOnAppQuit ? (this.nativeUpdater.once("error", D), this.nativeUpdater.checkForUpdates()) : b([]);
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
  return Nr.MacUpdater = u, Nr;
}
var _r = {}, Qr = {}, $c;
function Hm() {
  if ($c) return Qr;
  $c = 1, Object.defineProperty(Qr, "__esModule", { value: !0 }), Qr.verifySignature = s;
  const e = $e(), r = br, t = yt, n = ye;
  function s(a, u, l) {
    return new Promise((d, f) => {
      const h = u.replace(/'/g, "''");
      l.info(`Verifying signature ${h}`), (0, r.execFile)('set "PSModulePath=" & chcp 65001 >NUL & powershell.exe', ["-NoProfile", "-NonInteractive", "-InputFormat", "None", "-Command", `"Get-AuthenticodeSignature -LiteralPath '${h}' | ConvertTo-Json -Compress"`], {
        shell: !0,
        timeout: 20 * 1e3
      }, (E, g, m) => {
        var v;
        try {
          if (E != null || m) {
            o(l, E, m, f), d(null);
            return;
          }
          const N = i(g);
          if (N.Status === 0) {
            try {
              const _ = n.normalize(N.Path), A = n.normalize(u);
              if (l.info(`LiteralPath: ${_}. Update Path: ${A}`), _ !== A) {
                o(l, new Error(`LiteralPath of ${_} is different than ${A}`), m, f), d(null);
                return;
              }
            } catch (_) {
              l.warn(`Unable to verify LiteralPath of update asset due to missing data.Path. Skipping this step of validation. Message: ${(v = _.message) !== null && v !== void 0 ? v : _.stack}`);
            }
            const D = (0, e.parseDn)(N.SignerCertificate.Subject);
            let M = !1;
            for (const _ of a) {
              const A = (0, e.parseDn)(_);
              if (A.size ? M = Array.from(A.keys()).every((y) => A.get(y) === D.get(y)) : _ === D.get("CN") && (l.warn(`Signature validated using only CN ${_}. Please add your full Distinguished Name (DN) to publisherNames configuration`), M = !0), M) {
                d(null);
                return;
              }
            }
          }
          const b = `publisherNames: ${a.join(" | ")}, raw info: ` + JSON.stringify(N, (D, M) => D === "RawData" ? void 0 : M, 2);
          l.warn(`Sign verification failed, installer signed with incorrect certificate: ${b}`), d(b);
        } catch (N) {
          o(l, N, null, f), d(null);
          return;
        }
      });
    });
  }
  function i(a) {
    const u = JSON.parse(a);
    delete u.PrivateKey, delete u.IsOSBinary, delete u.SignatureType;
    const l = u.SignerCertificate;
    return l != null && (delete l.Archived, delete l.Extensions, delete l.Handle, delete l.HasPrivateKey, delete l.SubjectName), u;
  }
  function o(a, u, l, d) {
    if (c()) {
      a.warn(`Cannot execute Get-AuthenticodeSignature: ${u || l}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
      return;
    }
    try {
      (0, r.execFileSync)("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "ConvertTo-Json test"], { timeout: 10 * 1e3 });
    } catch (f) {
      a.warn(`Cannot execute ConvertTo-Json: ${f.message}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
      return;
    }
    u != null && d(u), l && d(new Error(`Cannot execute Get-AuthenticodeSignature, stderr: ${l}. Failing signature validation due to unknown stderr.`));
  }
  function c() {
    const a = t.release();
    return a.startsWith("6.") && !a.startsWith("6.3");
  }
  return Qr;
}
var Xc;
function Bc() {
  if (Xc) return _r;
  Xc = 1, Object.defineProperty(_r, "__esModule", { value: !0 }), _r.NsisUpdater = void 0;
  const e = $e(), r = ye, t = er(), n = md(), s = Xt(), i = rt(), o = /* @__PURE__ */ Rt(), c = Hm(), a = Jt;
  let u = class extends t.BaseUpdater {
    constructor(d, f) {
      super(d, f), this._verifyUpdateCodeSignature = (h, E) => (0, c.verifySignature)(h, E, this._logger);
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
      const f = d.updateInfoAndProvider.provider, h = (0, i.findFile)(f.resolveFiles(d.updateInfoAndProvider.info), "exe");
      return this.executeDownload({
        fileExtension: "exe",
        downloadUpdateOptions: d,
        fileInfo: h,
        task: async (E, g, m, v) => {
          const N = h.packageInfo, b = N != null && m != null;
          if (b && d.disableWebInstaller)
            throw (0, e.newError)(`Unable to download new version ${d.updateInfoAndProvider.info.version}. Web Installers are disabled`, "ERR_UPDATER_WEB_INSTALLER_DISABLED");
          !b && !d.disableWebInstaller && this._logger.warn("disableWebInstaller is set to false, you should set it to true if you do not plan on using a web installer. This will default to true in a future version."), (b || d.disableDifferentialDownload || await this.differentialDownloadInstaller(h, d, E, f, e.CURRENT_APP_INSTALLER_FILE_NAME)) && await this.httpExecutor.download(h.url, E, g);
          const D = await this.verifySignature(E);
          if (D != null)
            throw await v(), (0, e.newError)(`New version ${d.updateInfoAndProvider.info.version} is not signed by the application owner: ${D}`, "ERR_UPDATER_INVALID_SIGNATURE");
          if (b && await this.differentialDownloadWebPackage(d, N, m, f))
            try {
              await this.httpExecutor.download(new a.URL(N.path), m, {
                headers: d.requestHeaders,
                cancellationToken: d.cancellationToken,
                sha512: N.sha512
              });
            } catch (M) {
              try {
                await (0, o.unlink)(m);
              } catch {
              }
              throw M;
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
      } catch (h) {
        if (h.code === "ENOENT")
          return null;
        throw h;
      }
      return await this._verifyUpdateCodeSignature(Array.isArray(f) ? f : [f], d);
    }
    doInstall(d) {
      const f = this.installerPath;
      if (f == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      const h = ["--updated"];
      d.isSilent && h.push("/S"), d.isForceRunAfter && h.push("--force-run"), this.installDirectory && h.push(`/D=${this.installDirectory}`);
      const E = this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.packageFile;
      E != null && h.push(`--package-file=${E}`);
      const g = () => {
        this.spawnLog(r.join(process.resourcesPath, "elevate.exe"), [f].concat(h)).catch((m) => this.dispatchError(m));
      };
      return d.isAdminRightsRequired ? (this._logger.info("isAdminRightsRequired is set to true, run installer using elevate.exe"), g(), !0) : (this.spawnLog(f, h).catch((m) => {
        const v = m.code;
        this._logger.info(`Cannot run installer: error code: ${v}, error message: "${m.message}", will be executed again using elevate if EACCES, and will try to use electron.shell.openItem if ENOENT`), v === "UNKNOWN" || v === "EACCES" ? g() : v === "ENOENT" ? wt.shell.openPath(f).catch((N) => this.dispatchError(N)) : this.dispatchError(m);
      }), !0);
    }
    async differentialDownloadWebPackage(d, f, h, E) {
      if (f.blockMapSize == null)
        return !0;
      try {
        const g = {
          newUrl: new a.URL(f.path),
          oldFile: r.join(this.downloadedUpdateHelper.cacheDir, e.CURRENT_APP_PACKAGE_FILE_NAME),
          logger: this._logger,
          newFile: h,
          requestHeaders: this.requestHeaders,
          isUseMultipleRangeRequest: E.isUseMultipleRangeRequest,
          cancellationToken: d.cancellationToken
        };
        this.listenerCount(s.DOWNLOAD_PROGRESS) > 0 && (g.onProgress = (m) => this.emit(s.DOWNLOAD_PROGRESS, m)), await new n.FileWithEmbeddedBlockMapDifferentialDownloader(f, this.httpExecutor, g).download();
      } catch (g) {
        return this._logger.error(`Cannot download differentially, fallback to full download: ${g.stack || g}`), process.platform === "win32";
      }
      return !1;
    }
  };
  return _r.NsisUpdater = u, _r;
}
var Hc;
function jm() {
  return Hc || (Hc = 1, (function(e) {
    var r = xt && xt.__createBinding || (Object.create ? (function(m, v, N, b) {
      b === void 0 && (b = N);
      var D = Object.getOwnPropertyDescriptor(v, N);
      (!D || ("get" in D ? !v.__esModule : D.writable || D.configurable)) && (D = { enumerable: !0, get: function() {
        return v[N];
      } }), Object.defineProperty(m, b, D);
    }) : (function(m, v, N, b) {
      b === void 0 && (b = N), m[b] = v[N];
    })), t = xt && xt.__exportStar || function(m, v) {
      for (var N in m) N !== "default" && !Object.prototype.hasOwnProperty.call(v, N) && r(v, m, N);
    };
    Object.defineProperty(e, "__esModule", { value: !0 }), e.NsisUpdater = e.MacUpdater = e.RpmUpdater = e.PacmanUpdater = e.DebUpdater = e.AppImageUpdater = e.Provider = e.NoOpLogger = e.AppUpdater = e.BaseUpdater = void 0;
    const n = /* @__PURE__ */ Rt(), s = ye;
    var i = er();
    Object.defineProperty(e, "BaseUpdater", { enumerable: !0, get: function() {
      return i.BaseUpdater;
    } });
    var o = Eo();
    Object.defineProperty(e, "AppUpdater", { enumerable: !0, get: function() {
      return o.AppUpdater;
    } }), Object.defineProperty(e, "NoOpLogger", { enumerable: !0, get: function() {
      return o.NoOpLogger;
    } });
    var c = rt();
    Object.defineProperty(e, "Provider", { enumerable: !0, get: function() {
      return c.Provider;
    } });
    var a = Cc();
    Object.defineProperty(e, "AppImageUpdater", { enumerable: !0, get: function() {
      return a.AppImageUpdater;
    } });
    var u = xc();
    Object.defineProperty(e, "DebUpdater", { enumerable: !0, get: function() {
      return u.DebUpdater;
    } });
    var l = Uc();
    Object.defineProperty(e, "PacmanUpdater", { enumerable: !0, get: function() {
      return l.PacmanUpdater;
    } });
    var d = kc();
    Object.defineProperty(e, "RpmUpdater", { enumerable: !0, get: function() {
      return d.RpmUpdater;
    } });
    var f = qc();
    Object.defineProperty(e, "MacUpdater", { enumerable: !0, get: function() {
      return f.MacUpdater;
    } });
    var h = Bc();
    Object.defineProperty(e, "NsisUpdater", { enumerable: !0, get: function() {
      return h.NsisUpdater;
    } }), t(Xt(), e);
    let E;
    function g() {
      if (process.platform === "win32")
        E = new (Bc()).NsisUpdater();
      else if (process.platform === "darwin")
        E = new (qc()).MacUpdater();
      else {
        E = new (Cc()).AppImageUpdater();
        try {
          const m = s.join(process.resourcesPath, "package-type");
          if (!(0, n.existsSync)(m))
            return E;
          console.info("Checking for beta autoupdate feature for deb/rpm distributions");
          const v = (0, n.readFileSync)(m).toString().trim();
          switch (console.info("Found package-type:", v), v) {
            case "deb":
              E = new (xc()).DebUpdater();
              break;
            case "rpm":
              E = new (kc()).RpmUpdater();
              break;
            case "pacman":
              E = new (Uc()).PacmanUpdater();
              break;
            default:
              break;
          }
        } catch (m) {
          console.warn("Unable to detect 'package-type' for autoUpdater (beta rpm/deb support). If you'd like to expand support, please consider contributing to electron-builder", m.message);
        }
      }
      return E;
    }
    Object.defineProperty(e, "autoUpdater", {
      enumerable: !0,
      get: () => E || g()
    });
  })(xt)), xt;
}
var ft = jm(), wr = { exports: {} }, Ss = { exports: {} }, jc;
function Ed() {
  return jc || (jc = 1, (function(e) {
    let r = {};
    try {
      r = require("electron");
    } catch {
    }
    r.ipcRenderer && t(r), e.exports = t;
    function t({ contextBridge: n, ipcRenderer: s }) {
      if (!s)
        return;
      s.on("__ELECTRON_LOG_IPC__", (o, c) => {
        window.postMessage({ cmd: "message", ...c });
      }), s.invoke("__ELECTRON_LOG__", { cmd: "getOptions" }).catch((o) => console.error(new Error(
        `electron-log isn't initialized in the main process. Please call log.initialize() before. ${o.message}`
      )));
      const i = {
        sendToMain(o) {
          try {
            s.send("__ELECTRON_LOG__", o);
          } catch (c) {
            console.error("electronLog.sendToMain ", c, "data:", o), s.send("__ELECTRON_LOG__", {
              cmd: "errorHandler",
              error: { message: c?.message, stack: c?.stack },
              errorName: "sendToMain"
            });
          }
        },
        log(...o) {
          i.sendToMain({ data: o, level: "info" });
        }
      };
      for (const o of ["error", "warn", "info", "verbose", "debug", "silly"])
        i[o] = (...c) => i.sendToMain({
          data: c,
          level: o
        });
      if (n && process.contextIsolated)
        try {
          n.exposeInMainWorld("__electronLog", i);
        } catch {
        }
      typeof window == "object" ? window.__electronLog = i : __electronLog = i;
    }
  })(Ss)), Ss.exports;
}
var Ns = { exports: {} }, _s, Gc;
function Gm() {
  if (Gc) return _s;
  Gc = 1, _s = e;
  function e(r) {
    return Object.defineProperties(t, {
      defaultLabel: { value: "", writable: !0 },
      labelPadding: { value: !0, writable: !0 },
      maxLabelLength: { value: 0, writable: !0 },
      labelLength: {
        get() {
          switch (typeof t.labelPadding) {
            case "boolean":
              return t.labelPadding ? t.maxLabelLength : 0;
            case "number":
              return t.labelPadding;
            default:
              return 0;
          }
        }
      }
    });
    function t(n) {
      t.maxLabelLength = Math.max(t.maxLabelLength, n.length);
      const s = {};
      for (const i of r.levels)
        s[i] = (...o) => r.logData(o, { level: i, scope: n });
      return s.log = s.info, s;
    }
  }
  return _s;
}
var ws, Vc;
function Vm() {
  if (Vc) return ws;
  Vc = 1;
  class e {
    constructor({ processMessage: t }) {
      this.processMessage = t, this.buffer = [], this.enabled = !1, this.begin = this.begin.bind(this), this.commit = this.commit.bind(this), this.reject = this.reject.bind(this);
    }
    addMessage(t) {
      this.buffer.push(t);
    }
    begin() {
      this.enabled = [];
    }
    commit() {
      this.enabled = !1, this.buffer.forEach((t) => this.processMessage(t)), this.buffer = [];
    }
    reject() {
      this.enabled = !1, this.buffer = [];
    }
  }
  return ws = e, ws;
}
var Rs, Wc;
function gd() {
  if (Wc) return Rs;
  Wc = 1;
  const e = Gm(), r = Vm();
  class t {
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
      allowUnknownLevel: s = !1,
      dependencies: i = {},
      errorHandler: o,
      eventLogger: c,
      initializeFn: a,
      isDev: u = !1,
      levels: l = ["error", "warn", "info", "verbose", "debug", "silly"],
      logId: d,
      transportFactories: f = {},
      variables: h
    } = {}) {
      this.addLevel = this.addLevel.bind(this), this.create = this.create.bind(this), this.initialize = this.initialize.bind(this), this.logData = this.logData.bind(this), this.processMessage = this.processMessage.bind(this), this.allowUnknownLevel = s, this.buffering = new r(this), this.dependencies = i, this.initializeFn = a, this.isDev = u, this.levels = l, this.logId = d, this.scope = e(this), this.transportFactories = f, this.variables = h || {};
      for (const E of this.levels)
        this.addLevel(E, !1);
      this.log = this.info, this.functions.log = this.log, this.errorHandler = o, o?.setOptions({ ...i, logFn: this.error }), this.eventLogger = c, c?.setOptions({ ...i, logger: this });
      for (const [E, g] of Object.entries(f))
        this.transports[E] = g(this, i);
      t.instances[d] = this;
    }
    static getInstance({ logId: s }) {
      return this.instances[s] || this.instances.default;
    }
    addLevel(s, i = this.levels.length) {
      i !== !1 && this.levels.splice(i, 0, s), this[s] = (...o) => this.logData(o, { level: s }), this.functions[s] = this[s];
    }
    catchErrors(s) {
      return this.processMessage(
        {
          data: ["log.catchErrors is deprecated. Use log.errorHandler instead"],
          level: "warn"
        },
        { transports: ["console"] }
      ), this.errorHandler.startCatching(s);
    }
    create(s) {
      return typeof s == "string" && (s = { logId: s }), new t({
        dependencies: this.dependencies,
        errorHandler: this.errorHandler,
        initializeFn: this.initializeFn,
        isDev: this.isDev,
        transportFactories: this.transportFactories,
        variables: { ...this.variables },
        ...s
      });
    }
    compareLevels(s, i, o = this.levels) {
      const c = o.indexOf(s), a = o.indexOf(i);
      return a === -1 || c === -1 ? !0 : a <= c;
    }
    initialize(s = {}) {
      this.initializeFn({ logger: this, ...this.dependencies, ...s });
    }
    logData(s, i = {}) {
      this.buffering.enabled ? this.buffering.addMessage({ data: s, date: /* @__PURE__ */ new Date(), ...i }) : this.processMessage({ data: s, ...i });
    }
    processMessage(s, { transports: i = this.transports } = {}) {
      if (s.cmd === "errorHandler") {
        this.errorHandler.handle(s.error, {
          errorName: s.errorName,
          processType: "renderer",
          showDialog: !!s.showDialog
        });
        return;
      }
      let o = s.level;
      this.allowUnknownLevel || (o = this.levels.includes(s.level) ? s.level : "info");
      const c = {
        date: /* @__PURE__ */ new Date(),
        logId: this.logId,
        ...s,
        level: o,
        variables: {
          ...this.variables,
          ...s.variables
        }
      };
      for (const [a, u] of this.transportEntries(i))
        if (!(typeof u != "function" || u.level === !1) && this.compareLevels(u.level, s.level))
          try {
            const l = this.hooks.reduce((d, f) => d && f(d, u, a), c);
            l && u({ ...l, data: [...l.data] });
          } catch (l) {
            this.processInternalErrorFn(l);
          }
    }
    processInternalErrorFn(s) {
    }
    transportEntries(s = this.transports) {
      return (Array.isArray(s) ? s : Object.entries(s)).map((o) => {
        switch (typeof o) {
          case "string":
            return this.transports[o] ? [o, this.transports[o]] : null;
          case "function":
            return [o.name, o];
          default:
            return Array.isArray(o) ? o : null;
        }
      }).filter(Boolean);
    }
  }
  return Rs = t, Rs;
}
var Os, Yc;
function Wm() {
  if (Yc) return Os;
  Yc = 1;
  const e = console.error;
  class r {
    logFn = null;
    onError = null;
    showDialog = !1;
    preventDefault = !0;
    constructor({ logFn: n = null } = {}) {
      this.handleError = this.handleError.bind(this), this.handleRejection = this.handleRejection.bind(this), this.startCatching = this.startCatching.bind(this), this.logFn = n;
    }
    handle(n, {
      logFn: s = this.logFn,
      errorName: i = "",
      onError: o = this.onError,
      showDialog: c = this.showDialog
    } = {}) {
      try {
        o?.({ error: n, errorName: i, processType: "renderer" }) !== !1 && s({ error: n, errorName: i, showDialog: c });
      } catch {
        e(n);
      }
    }
    setOptions({ logFn: n, onError: s, preventDefault: i, showDialog: o }) {
      typeof n == "function" && (this.logFn = n), typeof s == "function" && (this.onError = s), typeof i == "boolean" && (this.preventDefault = i), typeof o == "boolean" && (this.showDialog = o);
    }
    startCatching({ onError: n, showDialog: s } = {}) {
      this.isActive || (this.isActive = !0, this.setOptions({ onError: n, showDialog: s }), window.addEventListener("error", (i) => {
        this.preventDefault && i.preventDefault?.(), this.handleError(i.error || i);
      }), window.addEventListener("unhandledrejection", (i) => {
        this.preventDefault && i.preventDefault?.(), this.handleRejection(i.reason || i);
      }));
    }
    handleError(n) {
      this.handle(n, { errorName: "Unhandled" });
    }
    handleRejection(n) {
      const s = n instanceof Error ? n : new Error(JSON.stringify(n));
      this.handle(s, { errorName: "Unhandled rejection" });
    }
  }
  return Os = r, Os;
}
var bs, zc;
function Bt() {
  if (zc) return bs;
  zc = 1, bs = { transform: e };
  function e({
    logger: r,
    message: t,
    transport: n,
    initialData: s = t?.data || [],
    transforms: i = n?.transforms
  }) {
    return i.reduce((o, c) => typeof c == "function" ? c({ data: o, logger: r, message: t, transport: n }) : o, s);
  }
  return bs;
}
var Ls, Jc;
function Ym() {
  if (Jc) return Ls;
  Jc = 1;
  const { transform: e } = Bt();
  Ls = t;
  const r = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    verbose: console.info,
    debug: console.debug,
    silly: console.debug,
    log: console.log
  };
  function t(s) {
    return Object.assign(i, {
      format: "{h}:{i}:{s}.{ms}{scope} › {text}",
      transforms: [n],
      writeFn({ message: { level: o, data: c } }) {
        const a = r[o] || r.info;
        setTimeout(() => a(...c));
      }
    });
    function i(o) {
      i.writeFn({
        message: { ...o, data: e({ logger: s, message: o, transport: i }) }
      });
    }
  }
  function n({
    data: s = [],
    logger: i = {},
    message: o = {},
    transport: c = {}
  }) {
    if (typeof c.format == "function")
      return c.format({
        data: s,
        level: o?.level || "info",
        logger: i,
        message: o,
        transport: c
      });
    if (typeof c.format != "string")
      return s;
    s.unshift(c.format), typeof s[1] == "string" && s[1].match(/%[1cdfiOos]/) && (s = [`${s[0]}${s[1]}`, ...s.slice(2)]);
    const a = o.date || /* @__PURE__ */ new Date();
    return s[0] = s[0].replace(/\{(\w+)}/g, (u, l) => {
      switch (l) {
        case "level":
          return o.level;
        case "logId":
          return o.logId;
        case "scope": {
          const d = o.scope || i.scope?.defaultLabel;
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
          return o.variables?.[l] || u;
      }
    }).trim(), s;
  }
  return Ls;
}
var Cs, Kc;
function zm() {
  if (Kc) return Cs;
  Kc = 1;
  const { transform: e } = Bt();
  Cs = t;
  const r = /* @__PURE__ */ new Set([Promise, WeakMap, WeakSet]);
  function t(i) {
    return Object.assign(o, {
      depth: 5,
      transforms: [s]
    });
    function o(c) {
      if (!window.__electronLog) {
        i.processMessage(
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
          initialData: c,
          logger: i,
          message: c,
          transport: o
        });
        __electronLog.sendToMain(a);
      } catch (a) {
        i.transports.console({
          data: ["electronLog.transports.ipc", a, "data:", c.data],
          level: "error"
        });
      }
    }
  }
  function n(i) {
    return Object(i) !== i;
  }
  function s({
    data: i,
    depth: o,
    seen: c = /* @__PURE__ */ new WeakSet(),
    transport: a = {}
  } = {}) {
    const u = o || a.depth || 5;
    return c.has(i) ? "[Circular]" : u < 1 ? n(i) ? i : Array.isArray(i) ? "[Array]" : `[${typeof i}]` : ["function", "symbol"].includes(typeof i) ? i.toString() : n(i) ? i : r.has(i.constructor) ? `[${i.constructor.name}]` : Array.isArray(i) ? i.map((l) => s({
      data: l,
      depth: u - 1,
      seen: c
    })) : i instanceof Date ? i.toISOString() : i instanceof Error ? i.stack : i instanceof Map ? new Map(
      Array.from(i).map(([l, d]) => [
        s({ data: l, depth: u - 1, seen: c }),
        s({ data: d, depth: u - 1, seen: c })
      ])
    ) : i instanceof Set ? new Set(
      Array.from(i).map(
        (l) => s({ data: l, depth: u - 1, seen: c })
      )
    ) : (c.add(i), Object.fromEntries(
      Object.entries(i).map(
        ([l, d]) => [
          l,
          s({ data: d, depth: u - 1, seen: c })
        ]
      )
    ));
  }
  return Cs;
}
var Qc;
function Jm() {
  return Qc || (Qc = 1, (function(e) {
    const r = gd(), t = Wm(), n = Ym(), s = zm();
    typeof process == "object" && process.type === "browser" && console.warn(
      "electron-log/renderer is loaded in the main process. It could cause unexpected behaviour."
    ), e.exports = i(), e.exports.Logger = r, e.exports.default = e.exports;
    function i() {
      const o = new r({
        allowUnknownLevel: !0,
        errorHandler: new t(),
        initializeFn: () => {
        },
        logId: "default",
        transportFactories: {
          console: n,
          ipc: s
        },
        variables: {
          processType: "renderer"
        }
      });
      return o.errorHandler.setOptions({
        logFn({ error: c, errorName: a, showDialog: u }) {
          o.transports.console({
            data: [a, c].filter(Boolean),
            level: "error"
          }), o.transports.ipc({
            cmd: "errorHandler",
            error: {
              cause: c?.cause,
              code: c?.code,
              name: c?.name,
              message: c?.message,
              stack: c?.stack
            },
            errorName: a,
            logId: o.logId,
            showDialog: u
          });
        }
      }), typeof window == "object" && window.addEventListener("message", (c) => {
        const { cmd: a, logId: u, ...l } = c.data || {}, d = r.getInstance({ logId: u });
        a === "message" && d.processMessage(l, { transports: ["console"] });
      }), new Proxy(o, {
        get(c, a) {
          return typeof c[a] < "u" ? c[a] : (...u) => o.logData(u, { level: a });
        }
      });
    }
  })(Ns)), Ns.exports;
}
var Ds, Zc;
function Km() {
  if (Zc) return Ds;
  Zc = 1;
  const e = be, r = ye;
  Ds = {
    findAndReadPackageJson: t,
    tryReadJsonAt: n
  };
  function t() {
    return n(o()) || n(i()) || n(process.resourcesPath, "app.asar") || n(process.resourcesPath, "app") || n(process.cwd()) || { name: void 0, version: void 0 };
  }
  function n(...c) {
    if (c[0])
      try {
        const a = r.join(...c), u = s("package.json", a);
        if (!u)
          return;
        const l = JSON.parse(e.readFileSync(u, "utf8")), d = l?.productName || l?.name;
        return !d || d.toLowerCase() === "electron" ? void 0 : d ? { name: d, version: l?.version } : void 0;
      } catch {
        return;
      }
  }
  function s(c, a) {
    let u = a;
    for (; ; ) {
      const l = r.parse(u), d = l.root, f = l.dir;
      if (e.existsSync(r.join(u, c)))
        return r.resolve(r.join(u, c));
      if (u === d)
        return null;
      u = f;
    }
  }
  function i() {
    const c = process.argv.filter((u) => u.indexOf("--user-data-dir=") === 0);
    return c.length === 0 || typeof c[0] != "string" ? null : c[0].replace("--user-data-dir=", "");
  }
  function o() {
    try {
      return require.main?.filename;
    } catch {
      return;
    }
  }
  return Ds;
}
var xs, eu;
function Td() {
  if (eu) return xs;
  eu = 1;
  const e = br, r = yt, t = ye, n = Km();
  class s {
    appName = void 0;
    appPackageJson = void 0;
    platform = process.platform;
    getAppLogPath(o = this.getAppName()) {
      return this.platform === "darwin" ? t.join(this.getSystemPathHome(), "Library/Logs", o) : t.join(this.getAppUserDataPath(o), "logs");
    }
    getAppName() {
      const o = this.appName || this.getAppPackageJson()?.name;
      if (!o)
        throw new Error(
          "electron-log can't determine the app name. It tried these methods:\n1. Use `electron.app.name`\n2. Use productName or name from the nearest package.json`\nYou can also set it through log.transports.file.setAppName()"
        );
      return o;
    }
    /**
     * @private
     * @returns {undefined}
     */
    getAppPackageJson() {
      return typeof this.appPackageJson != "object" && (this.appPackageJson = n.findAndReadPackageJson()), this.appPackageJson;
    }
    getAppUserDataPath(o = this.getAppName()) {
      return o ? t.join(this.getSystemPathAppData(), o) : void 0;
    }
    getAppVersion() {
      return this.getAppPackageJson()?.version;
    }
    getElectronLogPath() {
      return this.getAppLogPath();
    }
    getMacOsVersion() {
      const o = Number(r.release().split(".")[0]);
      return o <= 19 ? `10.${o - 4}` : o - 9;
    }
    /**
     * @protected
     * @returns {string}
     */
    getOsVersion() {
      let o = r.type().replace("_", " "), c = r.release();
      return o === "Darwin" && (o = "macOS", c = this.getMacOsVersion()), `${o} ${c}`;
    }
    /**
     * @return {PathVariables}
     */
    getPathVariables() {
      const o = this.getAppName(), c = this.getAppVersion(), a = this;
      return {
        appData: this.getSystemPathAppData(),
        appName: o,
        appVersion: c,
        get electronDefaultDir() {
          return a.getElectronLogPath();
        },
        home: this.getSystemPathHome(),
        libraryDefaultDir: this.getAppLogPath(o),
        libraryTemplate: this.getAppLogPath("{appName}"),
        temp: this.getSystemPathTemp(),
        userData: this.getAppUserDataPath(o)
      };
    }
    getSystemPathAppData() {
      const o = this.getSystemPathHome();
      switch (this.platform) {
        case "darwin":
          return t.join(o, "Library/Application Support");
        case "win32":
          return process.env.APPDATA || t.join(o, "AppData/Roaming");
        default:
          return process.env.XDG_CONFIG_HOME || t.join(o, ".config");
      }
    }
    getSystemPathHome() {
      return r.homedir?.() || process.env.HOME;
    }
    getSystemPathTemp() {
      return r.tmpdir();
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
    onAppEvent(o, c) {
    }
    onAppReady(o) {
      o();
    }
    onEveryWebContentsEvent(o, c) {
    }
    /**
     * Listen to async messages sent from opposite process
     * @param {string} channel
     * @param {function} listener
     */
    onIpc(o, c) {
    }
    onIpcInvoke(o, c) {
    }
    /**
     * @param {string} url
     * @param {Function} [logFunction]
     */
    openUrl(o, c = console.error) {
      const u = { darwin: "open", win32: "start", linux: "xdg-open" }[process.platform] || "xdg-open";
      e.exec(`${u} ${o}`, {}, (l) => {
        l && c(l);
      });
    }
    setAppName(o) {
      this.appName = o;
    }
    setPlatform(o) {
      this.platform = o;
    }
    setPreloadFileForSessions({
      filePath: o,
      // eslint-disable-line no-unused-vars
      includeFutureSession: c = !0,
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
    sendIpc(o, c) {
    }
    showErrorBox(o, c) {
    }
  }
  return xs = s, xs;
}
var Ps, tu;
function Qm() {
  if (tu) return Ps;
  tu = 1;
  const e = ye, r = Td();
  class t extends r {
    /**
     * @type {typeof Electron}
     */
    electron = void 0;
    /**
     * @param {object} options
     * @param {typeof Electron} [options.electron]
     */
    constructor({ electron: s } = {}) {
      super(), this.electron = s;
    }
    getAppName() {
      let s;
      try {
        s = this.appName || this.electron.app?.name || this.electron.app?.getName();
      } catch {
      }
      return s || super.getAppName();
    }
    getAppUserDataPath(s) {
      return this.getPath("userData") || super.getAppUserDataPath(s);
    }
    getAppVersion() {
      let s;
      try {
        s = this.electron.app?.getVersion();
      } catch {
      }
      return s || super.getAppVersion();
    }
    getElectronLogPath() {
      return this.getPath("logs") || super.getElectronLogPath();
    }
    /**
     * @private
     * @param {any} name
     * @returns {string|undefined}
     */
    getPath(s) {
      try {
        return this.electron.app?.getPath(s);
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
    onAppEvent(s, i) {
      return this.electron.app?.on(s, i), () => {
        this.electron.app?.off(s, i);
      };
    }
    onAppReady(s) {
      this.electron.app?.isReady() ? s() : this.electron.app?.once ? this.electron.app?.once("ready", s) : s();
    }
    onEveryWebContentsEvent(s, i) {
      return this.electron.webContents?.getAllWebContents()?.forEach((c) => {
        c.on(s, i);
      }), this.electron.app?.on("web-contents-created", o), () => {
        this.electron.webContents?.getAllWebContents().forEach((c) => {
          c.off(s, i);
        }), this.electron.app?.off("web-contents-created", o);
      };
      function o(c, a) {
        a.on(s, i);
      }
    }
    /**
     * Listen to async messages sent from opposite process
     * @param {string} channel
     * @param {function} listener
     */
    onIpc(s, i) {
      this.electron.ipcMain?.on(s, i);
    }
    onIpcInvoke(s, i) {
      this.electron.ipcMain?.handle?.(s, i);
    }
    /**
     * @param {string} url
     * @param {Function} [logFunction]
     */
    openUrl(s, i = console.error) {
      this.electron.shell?.openExternal(s).catch(i);
    }
    setPreloadFileForSessions({
      filePath: s,
      includeFutureSession: i = !0,
      getSessions: o = () => [this.electron.session?.defaultSession]
    }) {
      for (const a of o().filter(Boolean))
        c(a);
      i && this.onAppEvent("session-created", (a) => {
        c(a);
      });
      function c(a) {
        typeof a.registerPreloadScript == "function" ? a.registerPreloadScript({
          filePath: s,
          id: "electron-log-preload",
          type: "frame"
        }) : a.setPreloads([...a.getPreloads(), s]);
      }
    }
    /**
     * Sent a message to opposite process
     * @param {string} channel
     * @param {any} message
     */
    sendIpc(s, i) {
      this.electron.BrowserWindow?.getAllWindows()?.forEach((o) => {
        o.webContents?.isDestroyed() === !1 && o.webContents?.isCrashed() === !1 && o.webContents.send(s, i);
      });
    }
    showErrorBox(s, i) {
      this.electron.dialog?.showErrorBox(s, i);
    }
  }
  return Ps = t, Ps;
}
var Us, ru;
function Zm() {
  if (ru) return Us;
  ru = 1;
  const e = be, r = yt, t = ye, n = Ed();
  let s = !1, i = !1;
  Us = {
    initialize({
      externalApi: a,
      getSessions: u,
      includeFutureSession: l,
      logger: d,
      preload: f = !0,
      spyRendererConsole: h = !1
    }) {
      a.onAppReady(() => {
        try {
          f && o({
            externalApi: a,
            getSessions: u,
            includeFutureSession: l,
            logger: d,
            preloadOption: f
          }), h && c({ externalApi: a, logger: d });
        } catch (E) {
          d.warn(E);
        }
      });
    }
  };
  function o({
    externalApi: a,
    getSessions: u,
    includeFutureSession: l,
    logger: d,
    preloadOption: f
  }) {
    let h = typeof f == "string" ? f : void 0;
    if (s) {
      d.warn(new Error("log.initialize({ preload }) already called").stack);
      return;
    }
    s = !0;
    try {
      h = t.resolve(
        __dirname,
        "../renderer/electron-log-preload.js"
      );
    } catch {
    }
    if (!h || !e.existsSync(h)) {
      h = t.join(
        a.getAppUserDataPath() || r.tmpdir(),
        "electron-log-preload.js"
      );
      const E = `
      try {
        (${n.toString()})(require('electron'));
      } catch(e) {
        console.error(e);
      }
    `;
      e.writeFileSync(h, E, "utf8");
    }
    a.setPreloadFileForSessions({
      filePath: h,
      includeFutureSession: l,
      getSessions: u
    });
  }
  function c({ externalApi: a, logger: u }) {
    if (i) {
      u.warn(
        new Error("log.initialize({ spyRendererConsole }) already called").stack
      );
      return;
    }
    i = !0;
    const l = ["debug", "info", "warn", "error"];
    a.onEveryWebContentsEvent(
      "console-message",
      (d, f, h) => {
        u.processMessage({
          data: [h],
          level: l[f],
          variables: { processType: "renderer" }
        });
      }
    );
  }
  return Us;
}
var Fs, nu;
function eE() {
  if (nu) return Fs;
  nu = 1;
  class e {
    externalApi = void 0;
    isActive = !1;
    logFn = void 0;
    onError = void 0;
    showDialog = !0;
    constructor({
      externalApi: n,
      logFn: s = void 0,
      onError: i = void 0,
      showDialog: o = void 0
    } = {}) {
      this.createIssue = this.createIssue.bind(this), this.handleError = this.handleError.bind(this), this.handleRejection = this.handleRejection.bind(this), this.setOptions({ externalApi: n, logFn: s, onError: i, showDialog: o }), this.startCatching = this.startCatching.bind(this), this.stopCatching = this.stopCatching.bind(this);
    }
    handle(n, {
      logFn: s = this.logFn,
      onError: i = this.onError,
      processType: o = "browser",
      showDialog: c = this.showDialog,
      errorName: a = ""
    } = {}) {
      n = r(n);
      try {
        if (typeof i == "function") {
          const u = this.externalApi?.getVersions() || {}, l = this.createIssue;
          if (i({
            createIssue: l,
            error: n,
            errorName: a,
            processType: o,
            versions: u
          }) === !1)
            return;
        }
        a ? s(a, n) : s(n), c && !a.includes("rejection") && this.externalApi && this.externalApi.showErrorBox(
          `A JavaScript error occurred in the ${o} process`,
          n.stack
        );
      } catch {
        console.error(n);
      }
    }
    setOptions({ externalApi: n, logFn: s, onError: i, showDialog: o }) {
      typeof n == "object" && (this.externalApi = n), typeof s == "function" && (this.logFn = s), typeof i == "function" && (this.onError = i), typeof o == "boolean" && (this.showDialog = o);
    }
    startCatching({ onError: n, showDialog: s } = {}) {
      this.isActive || (this.isActive = !0, this.setOptions({ onError: n, showDialog: s }), process.on("uncaughtException", this.handleError), process.on("unhandledRejection", this.handleRejection));
    }
    stopCatching() {
      this.isActive = !1, process.removeListener("uncaughtException", this.handleError), process.removeListener("unhandledRejection", this.handleRejection);
    }
    createIssue(n, s) {
      this.externalApi?.openUrl(
        `${n}?${new URLSearchParams(s).toString()}`
      );
    }
    handleError(n) {
      this.handle(n, { errorName: "Unhandled" });
    }
    handleRejection(n) {
      const s = n instanceof Error ? n : new Error(JSON.stringify(n));
      this.handle(s, { errorName: "Unhandled rejection" });
    }
  }
  function r(t) {
    if (t instanceof Error)
      return t;
    if (t && typeof t == "object") {
      if (t.message)
        return Object.assign(new Error(t.message), t);
      try {
        return new Error(JSON.stringify(t));
      } catch (n) {
        return new Error(`Couldn't normalize error ${String(t)}: ${n}`);
      }
    }
    return new Error(`Can't normalize error ${String(t)}`);
  }
  return Fs = e, Fs;
}
var ks, iu;
function tE() {
  if (iu) return ks;
  iu = 1;
  class e {
    disposers = [];
    format = "{eventSource}#{eventName}:";
    formatters = {
      app: {
        "certificate-error": ({ args: t }) => this.arrayToObject(t.slice(1, 4), [
          "url",
          "error",
          "certificate"
        ]),
        "child-process-gone": ({ args: t }) => t.length === 1 ? t[0] : t,
        "render-process-gone": ({ args: [t, n] }) => n && typeof n == "object" ? { ...n, ...this.getWebContentsDetails(t) } : []
      },
      webContents: {
        "console-message": ({ args: [t, n, s, i] }) => {
          if (!(t < 3))
            return { message: n, source: `${i}:${s}` };
        },
        "did-fail-load": ({ args: t }) => this.arrayToObject(t, [
          "errorCode",
          "errorDescription",
          "validatedURL",
          "isMainFrame",
          "frameProcessId",
          "frameRoutingId"
        ]),
        "did-fail-provisional-load": ({ args: t }) => this.arrayToObject(t, [
          "errorCode",
          "errorDescription",
          "validatedURL",
          "isMainFrame",
          "frameProcessId",
          "frameRoutingId"
        ]),
        "plugin-crashed": ({ args: t }) => this.arrayToObject(t, ["name", "version"]),
        "preload-error": ({ args: t }) => this.arrayToObject(t, ["preloadPath", "error"])
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
    constructor(t = {}) {
      this.setOptions(t);
    }
    setOptions({
      events: t,
      externalApi: n,
      level: s,
      logger: i,
      format: o,
      formatters: c,
      scope: a
    }) {
      typeof t == "object" && (this.events = t), typeof n == "object" && (this.externalApi = n), typeof s == "string" && (this.level = s), typeof i == "object" && (this.logger = i), (typeof o == "string" || typeof o == "function") && (this.format = o), typeof c == "object" && (this.formatters = c), typeof a == "string" && (this.scope = a);
    }
    startLogging(t = {}) {
      this.setOptions(t), this.disposeListeners();
      for (const n of this.getEventNames(this.events.app))
        this.disposers.push(
          this.externalApi.onAppEvent(n, (...s) => {
            this.handleEvent({ eventSource: "app", eventName: n, handlerArgs: s });
          })
        );
      for (const n of this.getEventNames(this.events.webContents))
        this.disposers.push(
          this.externalApi.onEveryWebContentsEvent(
            n,
            (...s) => {
              this.handleEvent(
                { eventSource: "webContents", eventName: n, handlerArgs: s }
              );
            }
          )
        );
    }
    stopLogging() {
      this.disposeListeners();
    }
    arrayToObject(t, n) {
      const s = {};
      return n.forEach((i, o) => {
        s[i] = t[o];
      }), t.length > n.length && (s.unknownArgs = t.slice(n.length)), s;
    }
    disposeListeners() {
      this.disposers.forEach((t) => t()), this.disposers = [];
    }
    formatEventLog({ eventName: t, eventSource: n, handlerArgs: s }) {
      const [i, ...o] = s;
      if (typeof this.format == "function")
        return this.format({ args: o, event: i, eventName: t, eventSource: n });
      const c = this.formatters[n]?.[t];
      let a = o;
      if (typeof c == "function" && (a = c({ args: o, event: i, eventName: t, eventSource: n })), !a)
        return;
      const u = {};
      return Array.isArray(a) ? u.args = a : typeof a == "object" && Object.assign(u, a), n === "webContents" && Object.assign(u, this.getWebContentsDetails(i?.sender)), [this.format.replace("{eventSource}", n === "app" ? "App" : "WebContents").replace("{eventName}", t), u];
    }
    getEventNames(t) {
      return !t || typeof t != "object" ? [] : Object.entries(t).filter(([n, s]) => s).map(([n]) => n);
    }
    getWebContentsDetails(t) {
      if (!t?.loadURL)
        return {};
      try {
        return {
          webContents: {
            id: t.id,
            url: t.getURL()
          }
        };
      } catch {
        return {};
      }
    }
    handleEvent({ eventName: t, eventSource: n, handlerArgs: s }) {
      const i = this.formatEventLog({ eventName: t, eventSource: n, handlerArgs: s });
      i && (this.scope ? this.logger.scope(this.scope) : this.logger)?.[this.level]?.(...i);
    }
  }
  return ks = e, ks;
}
var Ms, su;
function yd() {
  if (su) return Ms;
  su = 1;
  const { transform: e } = Bt();
  Ms = {
    concatFirstStringElements: r,
    formatScope: n,
    formatText: i,
    formatVariables: s,
    timeZoneFromOffset: t,
    format({ message: o, logger: c, transport: a, data: u = o?.data }) {
      switch (typeof a.format) {
        case "string":
          return e({
            message: o,
            logger: c,
            transforms: [s, n, i],
            transport: a,
            initialData: [a.format, ...u]
          });
        case "function":
          return a.format({
            data: u,
            level: o?.level || "info",
            logger: c,
            message: o,
            transport: a
          });
        default:
          return u;
      }
    }
  };
  function r({ data: o }) {
    return typeof o[0] != "string" || typeof o[1] != "string" || o[0].match(/%[1cdfiOos]/) ? o : [`${o[0]} ${o[1]}`, ...o.slice(2)];
  }
  function t(o) {
    const c = Math.abs(o), a = o > 0 ? "-" : "+", u = Math.floor(c / 60).toString().padStart(2, "0"), l = (c % 60).toString().padStart(2, "0");
    return `${a}${u}:${l}`;
  }
  function n({ data: o, logger: c, message: a }) {
    const { defaultLabel: u, labelLength: l } = c?.scope || {}, d = o[0];
    let f = a.scope;
    f || (f = u);
    let h;
    return f === "" ? h = l > 0 ? "".padEnd(l + 3) : "" : typeof f == "string" ? h = ` (${f})`.padEnd(l + 3) : h = "", o[0] = d.replace("{scope}", h), o;
  }
  function s({ data: o, message: c }) {
    let a = o[0];
    if (typeof a != "string")
      return o;
    a = a.replace("{level}]", `${c.level}]`.padEnd(6, " "));
    const u = c.date || /* @__PURE__ */ new Date();
    return o[0] = a.replace(/\{(\w+)}/g, (l, d) => {
      switch (d) {
        case "level":
          return c.level || "info";
        case "logId":
          return c.logId;
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
          return t(u.getTimezoneOffset());
        case "iso":
          return u.toISOString();
        default:
          return c.variables?.[d] || l;
      }
    }).trim(), o;
  }
  function i({ data: o }) {
    const c = o[0];
    if (typeof c != "string")
      return o;
    if (c.lastIndexOf("{text}") === c.length - 6)
      return o[0] = c.replace(/\s?{text}/, ""), o[0] === "" && o.shift(), o;
    const u = c.split("{text}");
    let l = [];
    return u[0] !== "" && l.push(u[0]), l = l.concat(o.slice(1)), u[1] !== "" && l.push(u[1]), l;
  }
  return Ms;
}
var qs = { exports: {} }, ou;
function fn() {
  return ou || (ou = 1, (function(e) {
    const r = rn;
    e.exports = {
      serialize: n,
      maxDepth({ data: s, transport: i, depth: o = i?.depth ?? 6 }) {
        if (!s)
          return s;
        if (o < 1)
          return Array.isArray(s) ? "[array]" : typeof s == "object" && s ? "[object]" : s;
        if (Array.isArray(s))
          return s.map((a) => e.exports.maxDepth({
            data: a,
            depth: o - 1
          }));
        if (typeof s != "object" || s && typeof s.toISOString == "function")
          return s;
        if (s === null)
          return null;
        if (s instanceof Error)
          return s;
        const c = {};
        for (const a in s)
          Object.prototype.hasOwnProperty.call(s, a) && (c[a] = e.exports.maxDepth({
            data: s[a],
            depth: o - 1
          }));
        return c;
      },
      toJSON({ data: s }) {
        return JSON.parse(JSON.stringify(s, t()));
      },
      toString({ data: s, transport: i }) {
        const o = i?.inspectOptions || {}, c = s.map((a) => {
          if (a !== void 0)
            try {
              const u = JSON.stringify(a, t(), "  ");
              return u === void 0 ? void 0 : JSON.parse(u);
            } catch {
              return a;
            }
        });
        return r.formatWithOptions(o, ...c);
      }
    };
    function t(s = {}) {
      const i = /* @__PURE__ */ new WeakSet();
      return function(o, c) {
        if (typeof c == "object" && c !== null) {
          if (i.has(c))
            return;
          i.add(c);
        }
        return n(o, c, s);
      };
    }
    function n(s, i, o = {}) {
      const c = o?.serializeMapAndSet !== !1;
      return i instanceof Error ? i.stack : i && (typeof i == "function" ? `[function] ${i.toString()}` : i instanceof Date ? i.toISOString() : c && i instanceof Map && Object.fromEntries ? Object.fromEntries(i) : c && i instanceof Set && Array.from ? Array.from(i) : i);
    }
  })(qs)), qs.exports;
}
var $s, au;
function go() {
  if (au) return $s;
  au = 1, $s = {
    transformStyles: n,
    applyAnsiStyles({ data: s }) {
      return n(s, r, t);
    },
    removeStyles({ data: s }) {
      return n(s, () => "");
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
  function r(s) {
    const i = s.replace(/color:\s*(\w+).*/, "$1").toLowerCase();
    return e[i] || "";
  }
  function t(s) {
    return s + e.unset;
  }
  function n(s, i, o) {
    const c = {};
    return s.reduce((a, u, l, d) => {
      if (c[l])
        return a;
      if (typeof u == "string") {
        let f = l, h = !1;
        u = u.replace(/%[1cdfiOos]/g, (E) => {
          if (f += 1, E !== "%c")
            return E;
          const g = d[f];
          return typeof g == "string" ? (c[f] = !0, h = !0, i(g, u)) : E;
        }), h && o && (u = o(u));
      }
      return a.push(u), a;
    }, []);
  }
  return $s;
}
var Xs, lu;
function rE() {
  if (lu) return Xs;
  lu = 1;
  const {
    concatFirstStringElements: e,
    format: r
  } = yd(), { maxDepth: t, toJSON: n } = fn(), {
    applyAnsiStyles: s,
    removeStyles: i
  } = go(), { transform: o } = Bt(), c = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    verbose: console.info,
    debug: console.debug,
    silly: console.debug,
    log: console.log
  };
  Xs = l;
  const u = `%c{h}:{i}:{s}.{ms}{scope}%c ${process.platform === "win32" ? ">" : "›"} {text}`;
  Object.assign(l, {
    DEFAULT_FORMAT: u
  });
  function l(g) {
    return Object.assign(m, {
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
        r,
        h,
        e,
        t,
        n
      ],
      useStyles: process.env.FORCE_STYLES,
      writeFn({ message: v }) {
        (c[v.level] || c.info)(...v.data);
      }
    });
    function m(v) {
      const N = o({ logger: g, message: v, transport: m });
      m.writeFn({
        message: { ...v, data: N }
      });
    }
  }
  function d({ data: g, message: m, transport: v }) {
    return typeof v.format != "string" || !v.format.includes("%c") ? g : [
      `color:${E(m.level, v)}`,
      "color:unset",
      ...g
    ];
  }
  function f(g, m) {
    if (typeof g == "boolean")
      return g;
    const N = m === "error" || m === "warn" ? process.stderr : process.stdout;
    return N && N.isTTY;
  }
  function h(g) {
    const { message: m, transport: v } = g;
    return (f(v.useStyles, m.level) ? s : i)(g);
  }
  function E(g, m) {
    return m.colorMap[g] || m.colorMap.default;
  }
  return Xs;
}
var Bs, cu;
function vd() {
  if (cu) return Bs;
  cu = 1;
  const e = nn, r = be, t = yt;
  class n extends e {
    asyncWriteQueue = [];
    bytesWritten = 0;
    hasActiveAsyncWriting = !1;
    path = null;
    initialSize = void 0;
    writeOptions = null;
    writeAsync = !1;
    constructor({
      path: o,
      writeOptions: c = { encoding: "utf8", flag: "a", mode: 438 },
      writeAsync: a = !1
    }) {
      super(), this.path = o, this.writeOptions = c, this.writeAsync = a;
    }
    get size() {
      return this.getSize();
    }
    clear() {
      try {
        return r.writeFileSync(this.path, "", {
          mode: this.writeOptions.mode,
          flag: "w"
        }), this.reset(), !0;
      } catch (o) {
        return o.code === "ENOENT" ? !0 : (this.emit("error", o, this), !1);
      }
    }
    crop(o) {
      try {
        const c = s(this.path, o || 4096);
        this.clear(), this.writeLine(`[log cropped]${t.EOL}${c}`);
      } catch (c) {
        this.emit(
          "error",
          new Error(`Couldn't crop file ${this.path}. ${c.message}`),
          this
        );
      }
    }
    getSize() {
      if (this.initialSize === void 0)
        try {
          const o = r.statSync(this.path);
          this.initialSize = o.size;
        } catch {
          this.initialSize = 0;
        }
      return this.initialSize + this.bytesWritten;
    }
    increaseBytesWrittenCounter(o) {
      this.bytesWritten += Buffer.byteLength(o, this.writeOptions.encoding);
    }
    isNull() {
      return !1;
    }
    nextAsyncWrite() {
      const o = this;
      if (this.hasActiveAsyncWriting || this.asyncWriteQueue.length === 0)
        return;
      const c = this.asyncWriteQueue.join("");
      this.asyncWriteQueue = [], this.hasActiveAsyncWriting = !0, r.writeFile(this.path, c, this.writeOptions, (a) => {
        o.hasActiveAsyncWriting = !1, a ? o.emit(
          "error",
          new Error(`Couldn't write to ${o.path}. ${a.message}`),
          this
        ) : o.increaseBytesWrittenCounter(c), o.nextAsyncWrite();
      });
    }
    reset() {
      this.initialSize = void 0, this.bytesWritten = 0;
    }
    toString() {
      return this.path;
    }
    writeLine(o) {
      if (o += t.EOL, this.writeAsync) {
        this.asyncWriteQueue.push(o), this.nextAsyncWrite();
        return;
      }
      try {
        r.writeFileSync(this.path, o, this.writeOptions), this.increaseBytesWrittenCounter(o);
      } catch (c) {
        this.emit(
          "error",
          new Error(`Couldn't write to ${this.path}. ${c.message}`),
          this
        );
      }
    }
  }
  Bs = n;
  function s(i, o) {
    const c = Buffer.alloc(o), a = r.statSync(i), u = Math.min(a.size, o), l = Math.max(0, a.size - o), d = r.openSync(i, "r"), f = r.readSync(d, c, 0, u, l);
    return r.closeSync(d), c.toString("utf8", 0, f);
  }
  return Bs;
}
var Hs, uu;
function nE() {
  if (uu) return Hs;
  uu = 1;
  const e = vd();
  class r extends e {
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
  return Hs = r, Hs;
}
var js, du;
function iE() {
  if (du) return js;
  du = 1;
  const e = nn, r = be, t = ye, n = vd(), s = nE();
  class i extends e {
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
    provide({ filePath: c, writeOptions: a = {}, writeAsync: u = !1 }) {
      let l;
      try {
        if (c = t.resolve(c), this.store[c])
          return this.store[c];
        l = this.createFile({ filePath: c, writeOptions: a, writeAsync: u });
      } catch (d) {
        l = new s({ path: c }), this.emitError(d, l);
      }
      return l.on("error", this.emitError), this.store[c] = l, l;
    }
    /**
     * @param {string} filePath
     * @param {WriteOptions} writeOptions
     * @param {boolean} async
     * @return {File}
     * @private
     */
    createFile({ filePath: c, writeOptions: a, writeAsync: u }) {
      return this.testFileWriting({ filePath: c, writeOptions: a }), new n({ path: c, writeOptions: a, writeAsync: u });
    }
    /**
     * @param {Error} error
     * @param {File} file
     * @private
     */
    emitError(c, a) {
      this.emit("error", c, a);
    }
    /**
     * @param {string} filePath
     * @param {WriteOptions} writeOptions
     * @private
     */
    testFileWriting({ filePath: c, writeOptions: a }) {
      r.mkdirSync(t.dirname(c), { recursive: !0 }), r.writeFileSync(c, "", { flag: "a", mode: a.mode });
    }
  }
  return js = i, js;
}
var Gs, fu;
function sE() {
  if (fu) return Gs;
  fu = 1;
  const e = be, r = yt, t = ye, n = iE(), { transform: s } = Bt(), { removeStyles: i } = go(), {
    format: o,
    concatFirstStringElements: c
  } = yd(), { toString: a } = fn();
  Gs = l;
  const u = new n();
  function l(f, { registry: h = u, externalApi: E } = {}) {
    let g;
    return h.listenerCount("error") < 1 && h.on("error", (M, _) => {
      N(`Can't write to ${_}`, M);
    }), Object.assign(m, {
      fileName: d(f.variables.processType),
      format: "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}",
      getFile: b,
      inspectOptions: { depth: 5 },
      level: "silly",
      maxSize: 1024 ** 2,
      readAllLogs: D,
      sync: !0,
      transforms: [i, o, c, a],
      writeOptions: { flag: "a", mode: 438, encoding: "utf8" },
      archiveLogFn(M) {
        const _ = M.toString(), A = t.parse(_);
        try {
          e.renameSync(_, t.join(A.dir, `${A.name}.old${A.ext}`));
        } catch (S) {
          N("Could not rotate log", S);
          const y = Math.round(m.maxSize / 4);
          M.crop(Math.min(y, 256 * 1024));
        }
      },
      resolvePathFn(M) {
        return t.join(M.libraryDefaultDir, M.fileName);
      },
      setAppName(M) {
        f.dependencies.externalApi.setAppName(M);
      }
    });
    function m(M) {
      const _ = b(M);
      m.maxSize > 0 && _.size > m.maxSize && (m.archiveLogFn(_), _.reset());
      const S = s({ logger: f, message: M, transport: m });
      _.writeLine(S);
    }
    function v() {
      g || (g = Object.create(
        Object.prototype,
        {
          ...Object.getOwnPropertyDescriptors(
            E.getPathVariables()
          ),
          fileName: {
            get() {
              return m.fileName;
            },
            enumerable: !0
          }
        }
      ), typeof m.archiveLog == "function" && (m.archiveLogFn = m.archiveLog, N("archiveLog is deprecated. Use archiveLogFn instead")), typeof m.resolvePath == "function" && (m.resolvePathFn = m.resolvePath, N("resolvePath is deprecated. Use resolvePathFn instead")));
    }
    function N(M, _ = null, A = "error") {
      const S = [`electron-log.transports.file: ${M}`];
      _ && S.push(_), f.transports.console({ data: S, date: /* @__PURE__ */ new Date(), level: A });
    }
    function b(M) {
      v();
      const _ = m.resolvePathFn(g, M);
      return h.provide({
        filePath: _,
        writeAsync: !m.sync,
        writeOptions: m.writeOptions
      });
    }
    function D({ fileFilter: M = (_) => _.endsWith(".log") } = {}) {
      v();
      const _ = t.dirname(m.resolvePathFn(g));
      return e.existsSync(_) ? e.readdirSync(_).map((A) => t.join(_, A)).filter(M).map((A) => {
        try {
          return {
            path: A,
            lines: e.readFileSync(A, "utf8").split(r.EOL)
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
  return Gs;
}
var Vs, pu;
function oE() {
  if (pu) return Vs;
  pu = 1;
  const { maxDepth: e, toJSON: r } = fn(), { transform: t } = Bt();
  Vs = n;
  function n(s, { externalApi: i }) {
    return Object.assign(o, {
      depth: 3,
      eventId: "__ELECTRON_LOG_IPC__",
      level: s.isDev ? "silly" : !1,
      transforms: [r, e]
    }), i?.isElectron() ? o : void 0;
    function o(c) {
      c?.variables?.processType !== "renderer" && i?.sendIpc(o.eventId, {
        ...c,
        data: t({ logger: s, message: c, transport: o })
      });
    }
  }
  return Vs;
}
var Ws, hu;
function aE() {
  if (hu) return Ws;
  hu = 1;
  const e = Nu, r = Rf, { transform: t } = Bt(), { removeStyles: n } = go(), { toJSON: s, maxDepth: i } = fn();
  Ws = o;
  function o(c) {
    return Object.assign(a, {
      client: { name: "electron-application" },
      depth: 6,
      level: !1,
      requestOptions: {},
      transforms: [n, s, i],
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
        c.processMessage(
          {
            data: [`electron-log: can't POST ${a.url}`, u],
            level: "warn"
          },
          { transports: ["console", "file"] }
        );
      },
      sendRequestFn({ serverUrl: u, requestOptions: l, body: d }) {
        const h = (u.startsWith("https:") ? r : e).request(u, {
          method: "POST",
          ...l,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": d.length,
            ...l.headers
          }
        });
        return h.write(d), h.end(), h;
      }
    });
    function a(u) {
      if (!a.url)
        return;
      const l = a.makeBodyFn({
        logger: c,
        message: { ...u, data: t({ logger: c, message: u, transport: a }) },
        transport: a
      }), d = a.sendRequestFn({
        serverUrl: a.url,
        requestOptions: a.requestOptions,
        body: Buffer.from(l, "utf8")
      });
      d.on("error", (f) => a.processErrorFn({
        error: f,
        logger: c,
        message: u,
        request: d,
        transport: a
      }));
    }
  }
  return Ws;
}
var Ys, mu;
function Ad() {
  if (mu) return Ys;
  mu = 1;
  const e = gd(), r = eE(), t = tE(), n = rE(), s = sE(), i = oE(), o = aE();
  Ys = c;
  function c({ dependencies: a, initializeFn: u }) {
    const l = new e({
      dependencies: a,
      errorHandler: new r(),
      eventLogger: new t(),
      initializeFn: u,
      isDev: a.externalApi?.isDev(),
      logId: "default",
      transportFactories: {
        console: n,
        file: s,
        ipc: i,
        remote: o
      },
      variables: {
        processType: "main"
      }
    });
    return l.default = l, l.Logger = e, l.processInternalErrorFn = (d) => {
      l.transports.console.writeFn({
        message: {
          data: ["Unhandled electron-log error", d],
          level: "error"
        }
      });
    }, l;
  }
  return Ys;
}
var zs, Eu;
function lE() {
  if (Eu) return zs;
  Eu = 1;
  const e = wt, r = Qm(), { initialize: t } = Zm(), n = Ad(), s = new r({ electron: e }), i = n({
    dependencies: { externalApi: s },
    initializeFn: t
  });
  zs = i, s.onIpc("__ELECTRON_LOG__", (c, a) => {
    a.scope && i.Logger.getInstance(a).scope(a.scope);
    const u = new Date(a.date);
    o({
      ...a,
      date: u.getTime() ? u : /* @__PURE__ */ new Date()
    });
  }), s.onIpcInvoke("__ELECTRON_LOG__", (c, { cmd: a = "", logId: u }) => a === "getOptions" ? {
    levels: i.Logger.getInstance({ logId: u }).levels,
    logId: u
  } : (o({ data: [`Unknown cmd '${a}'`], level: "error" }), {}));
  function o(c) {
    i.Logger.getInstance(c)?.processMessage(c);
  }
  return zs;
}
var Js, gu;
function cE() {
  if (gu) return Js;
  gu = 1;
  const e = Td(), r = Ad(), t = new e();
  return Js = r({
    dependencies: { externalApi: t }
  }), Js;
}
var Tu;
function uE() {
  if (Tu) return wr.exports;
  Tu = 1;
  const e = typeof process > "u" || process.type === "renderer" || process.type === "worker", r = typeof process == "object" && process.type === "browser";
  return e ? (Ed(), wr.exports = Jm()) : r ? wr.exports = lE() : wr.exports = cE(), wr.exports;
}
var dE = uE();
const Ks = /* @__PURE__ */ _u(dE);
class fE {
  constructor() {
    Ks.transports.file.level = "info", ft.autoUpdater.logger = Ks, this.initListeners();
  }
  formatUpdaterError(r) {
    const t = r instanceof Error ? r.message : String(r ?? ""), n = t.toLowerCase();
    return n.includes("not signed by the application owner") || n.includes("not digitally signed") || n.includes("signercertificate") || n.includes("publishernames") ? "Update skipped: this Windows build isn't code-signed. Please install updates by downloading the latest installer from the Releases page." : "Error in auto-updater. " + t;
  }
  initListeners() {
    ft.autoUpdater.on("checking-for-update", () => {
      this.sendStatusToWindow("Checking for update...");
    }), ft.autoUpdater.on("update-available", (r) => {
      this.sendStatusToWindow("Update available.");
      const t = st.getAllWindows()[0];
      t && t.webContents.send("updater:update-available", r);
    }), ft.autoUpdater.on("update-not-available", (r) => {
      this.sendStatusToWindow("Update not available.");
      const t = st.getAllWindows()[0];
      t && t.webContents.send("updater:update-not-available", r);
    }), ft.autoUpdater.on("error", (r) => {
      this.sendStatusToWindow(this.formatUpdaterError(r));
      const t = st.getAllWindows()[0];
      t && t.webContents.send("updater:error", r.toString());
    }), ft.autoUpdater.on("download-progress", (r) => {
      this.sendStatusToWindow("Downloading update...");
      const t = st.getAllWindows()[0];
      t && t.webContents.send("updater:download-progress", r);
    }), ft.autoUpdater.on("update-downloaded", (r) => {
      this.sendStatusToWindow("Update downloaded");
      const t = st.getAllWindows()[0];
      t && t.webContents.send("updater:update-downloaded", r);
    });
  }
  sendStatusToWindow(r) {
    Ks.info(r);
    const t = st.getAllWindows()[0];
    t && t.webContents.send("updater:status", r);
  }
  checkForUpdates() {
    ft.autoUpdater.checkForUpdates();
  }
  quitAndInstall() {
    ft.autoUpdater.quitAndInstall();
  }
  checkForUpdatesAndNotify() {
    ft.autoUpdater.checkForUpdatesAndNotify();
  }
}
const pE = [
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".gif",
  ".webp",
  ".woff",
  ".woff2",
  ".ttf"
], zt = ye.join(je.getPath("userData"), "assets");
be.existsSync(zt) || be.mkdirSync(zt, { recursive: !0 });
class hE {
  constructor(r) {
    this.pendingRequests = /* @__PURE__ */ new Map(), this.p2pService = r, this.initP2P(), this.initProtocol();
  }
  getHash(r) {
    return Me.createHash("md5").update(r).digest("hex");
  }
  getFilePath(r) {
    const t = this.getHash(r), n = ye.extname(new URL(r).pathname) || ".bin";
    return ye.join(zt, `${t}${n}`);
  }
  importLocalAsset(r) {
    const t = ye.extname(r), s = `${Me.createHash("md5").update(r + Date.now().toString()).digest("hex")}${t}`, i = ye.join(zt, s);
    return be.copyFileSync(r, i), `asset:///${s}`;
  }
  initP2P() {
    this.p2pService.onMessage((r) => {
      r.type === "REQUEST_ASSET" ? this.handleAssetRequest(r) : r.type === "RESPONSE_ASSET" && this.handleAssetResponse(r);
    });
  }
  async handleAssetRequest(r) {
    const { url: t, requestId: n } = r, s = this.getFilePath(t);
    if (be.existsSync(s))
      try {
        const i = be.readFileSync(s);
        this.p2pService.broadcast({
          type: "RESPONSE_ASSET",
          requestId: n,
          url: t,
          data: i.toString("base64")
        });
      } catch (i) {
        console.error("Error reading asset for P2P:", i);
      }
  }
  handleAssetResponse(r) {
    const { requestId: t, data: n, url: s } = r;
    if (this.pendingRequests.has(t)) {
      const i = this.pendingRequests.get(t);
      if (i) {
        const o = Buffer.from(n, "base64"), c = this.getFilePath(s);
        be.writeFileSync(c, o), i(o), this.pendingRequests.delete(t);
      }
    }
  }
  initProtocol() {
    Zs.handle("asset", async (r) => {
      try {
        const t = new URL(r.url);
        let n = t.pathname.replace(/^\//, "");
        !n && t.host && (n = t.host);
        const s = ye.join(zt, n);
        if (!s.startsWith(zt))
          return new Response("Forbidden", { status: 403 });
        const i = bo(s).toString();
        return pt.fetch(i);
      } catch (t) {
        return console.error("Asset protocol error:", t), new Response("Not Found", { status: 404 });
      }
    }), Zs.handle("https", async (r) => {
      const t = r.url, n = t.split("?")[0].toLowerCase();
      if (!pE.some((c) => n.endsWith(c)))
        return pt.fetch(r, { bypassCustomProtocolHandlers: !0 });
      const i = this.getFilePath(t);
      if (be.existsSync(i)) {
        console.log(`[AssetService] Serving from cache: ${t}`);
        const c = bo(i).toString();
        return pt.fetch(c);
      }
      try {
        const c = await pt.fetch(r, {
          bypassCustomProtocolHandlers: !0
        });
        if (c.ok) {
          const a = await c.arrayBuffer();
          if (a && a.byteLength > 0)
            return be.writeFileSync(i, Buffer.from(a)), new Response(a, {
              headers: c.headers,
              status: c.status,
              statusText: c.statusText
            });
        }
        return c;
      } catch {
        console.log(`[AssetService] Fetch failed, trying P2P: ${t}`);
      }
      const o = await this.requestFromPeers(t);
      return o ? new Response(o) : new Response("Not Found", { status: 404 });
    });
  }
  requestFromPeers(r) {
    return new Promise((t) => {
      const n = Me.randomUUID(), s = setTimeout(() => {
        this.pendingRequests.delete(n), t(null);
      }, 3e3);
      this.pendingRequests.set(n, (i) => {
        clearTimeout(s), t(i);
      }), this.p2pService.broadcast({
        type: "REQUEST_ASSET",
        requestId: n,
        url: r
      });
    });
  }
}
const Id = "https://seahorse-app-jb6pe.ondigitalocean.app/sync", yu = `${Id}/push`, mE = `${Id}/pull`, EE = 300 * 1e3;
class gE {
  constructor(r, t, n) {
    this.isSyncing = !1, this.isPulling = !1, this.isUploading = !1, this.lastPullAt = 0, this.db = r, this.network = t, this.p2p = n, this.init();
  }
  async triggerSync(r = !1) {
    if (console.log(
      `[SyncService] Triggering manual sync (bypassing leader check, forceFullPull=${r})...`
    ), r && (console.log("[SyncService] Forcing full pull by clearing timestamp..."), this.db.putCache("last_sync_timestamp", null)), !this.network.getStatus().online) {
      console.warn("[SyncService] Cannot trigger sync: Device is offline.");
      return;
    }
    if (!this.db.getSyncUserId()) {
      console.warn("[SyncService] Cannot trigger sync: No user ID found.");
      return;
    }
    await this.processOfflineImages(), await this.performPull(), this.lastPullAt = Date.now();
    const s = this.db.getPendingQueueItems();
    s.length > 0 && await this.attemptSync(s), console.log("[SyncService] Manual sync trigger complete.");
  }
  /**
   * Flushes all pending items in the sync queue and image upload queue immediately.
   * This is critical during user switching to ensure no data is lost.
   */
  async flushQueue() {
    if (console.log(
      "[SyncService] Flushing all pending queues before user switch..."
    ), !this.network.getStatus().online)
      return console.warn("[SyncService] Cannot flush queue: Device is offline."), !1;
    try {
      await this.processOfflineImages();
      const t = this.db.getPendingQueueItems();
      return t.length > 0 && await this.attemptSync(t), console.log("[SyncService] Queue flush complete."), !0;
    } catch (t) {
      return console.error("[SyncService] Failed to flush queue:", t), !1;
    }
  }
  init() {
    this.network.onStatusChange((r) => {
      r && this.checkLeaderAndSync();
    }), setInterval(() => this.checkLeaderAndSync(), 6e4), this.checkLeaderAndSync();
  }
  async checkLeaderAndSync() {
    if (!this.network.getStatus().online) return;
    const t = this.db.getSyncUserId();
    if (console.log(`[SyncService] checkLeaderAndSync for user: ${t}`), !t)
      return;
    await this.processOfflineImages(), this.p2p.getPeers();
    const n = this.p2p.getDeviceId(), s = this.p2p.getDevices(), o = [n, ...s].sort()[0];
    if (n !== o) {
      console.log(
        `[SyncService] I am not the leader. Leader is ${o}. Waiting for leader to sync (or sending to leader).`
      );
      return;
    }
    Date.now() - this.lastPullAt >= EE && (console.log("[SyncService] I am the leader. Initiating pull sync..."), await this.performPull(), this.lastPullAt = Date.now());
    const a = this.db.getPendingQueueItems();
    a.length !== 0 && (console.log(
      `[SyncService] Initiating push sync for ${a.length} pending items...`
    ), await this.attemptSync(a));
  }
  async performPull() {
    if (!this.isPulling) {
      this.isPulling = !0;
      try {
        const r = this.db.getSyncUserId();
        if (console.log(`[SyncService] Starting pull for userId: ${r}`), !r) {
          console.warn("[SyncService] Pull skipped: No userId found.");
          return;
        }
        const t = new URL(mE);
        t.searchParams.set("userId", String(r)), console.log(`[SyncService] Fetching from: ${t.toString()}`);
        const n = await pt.fetch(t.toString(), {
          method: "GET",
          headers: {
            "x-app-version": je.getVersion()
          }
        });
        if (!n.ok) {
          const i = await n.text();
          console.error(
            `[SyncService] Pull sync failed: HTTP ${n.status}: ${i}`
          );
          return;
        }
        const s = await n.json();
        if (console.log("[SyncService] Pulled data:", s), !s || !s.data || !s.currentTimestamp) {
          console.error(
            "[SyncService] Pull sync response missing data or currentTimestamp"
          );
          return;
        }
        this.db.applyPullData({
          currentTimestamp: s.currentTimestamp,
          data: s.data
        }), this.db.putCache("last_sync_timestamp", s.currentTimestamp), console.log(
          `[SyncService] Pull complete. New timestamp: ${s.currentTimestamp}`
        );
      } catch (r) {
        console.error("[SyncService] Pull sync error:", r);
      } finally {
        this.isPulling = !1;
      }
    }
  }
  async processOfflineImages() {
    if (!this.isUploading) {
      this.isUploading = !0;
      try {
        const r = this.db.getPendingImageUploads();
        if (r.length === 0) return;
        console.log(
          `[SyncService] Found ${r.length} offline images to upload...`
        );
        for (const t of r) {
          let n = t.localPath;
          n.startsWith("file://") && (n = n.replace("file://", ""));
          try {
            n = decodeURIComponent(n);
          } catch {
          }
          if (!be.existsSync(n)) {
            console.error(
              `[SyncService] Local image file not found: ${n}`
            ), this.db.failImageUpload(t.id, "File not found");
            continue;
          }
          const s = ye.basename(n), i = be.readFileSync(n), o = process.env.CLOUDINARY_CLOUD_NAME, c = process.env.CLOUDINARY_API_KEY, a = process.env.CLOUDINARY_API_KEY_SECRET;
          if (!o || !c || !a) {
            console.error(
              "[SyncService] Cloudinary credentials missing in environment"
            ), this.db.failImageUpload(t.id, "Cloudinary credentials missing");
            continue;
          }
          const u = Math.round((/* @__PURE__ */ new Date()).getTime() / 1e3).toString(), l = `timestamp=${u}${a}`, d = Me.createHash("sha1").update(l).digest("hex"), f = `https://api.cloudinary.com/v1_1/${o}/image/upload`, h = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`, E = [];
          E.push(Buffer.from(`--${h}\r
`)), E.push(
            Buffer.from(
              `Content-Disposition: form-data; name="file"; filename="${s}"\r
`
            )
          );
          const g = ye.extname(s).toLowerCase(), m = g === ".png" ? "image/png" : g === ".webp" ? "image/webp" : "image/jpeg";
          E.push(Buffer.from(`Content-Type: ${m}\r
\r
`)), E.push(i), E.push(Buffer.from(`\r
--${h}\r
`)), E.push(
            Buffer.from(
              `Content-Disposition: form-data; name="api_key"\r
\r
${c}\r
--${h}\r
`
            )
          ), E.push(
            Buffer.from(
              `Content-Disposition: form-data; name="timestamp"\r
\r
${u}\r
--${h}\r
`
            )
          ), E.push(
            Buffer.from(
              `Content-Disposition: form-data; name="signature"\r
\r
${d}\r
--${h}--\r
`
            )
          );
          const v = Buffer.concat(E);
          console.log(`[SyncService] Uploading ${s} to Cloudinary...`);
          const N = await pt.fetch(f, {
            method: "POST",
            headers: {
              "Content-Type": `multipart/form-data; boundary=${h}`
            },
            body: v
          });
          if (!N.ok) {
            const M = await N.text();
            console.error(
              `[SyncService] Upload failed for ${t.id}: ${N.status} ${M}`
            );
            continue;
          }
          const b = await N.json(), D = b.secure_url || b.url;
          if (D) {
            console.log(`[SyncService] Upload successful. URL: ${D}`), this.db.updateRecordColumn(
              t.tableName,
              t.recordId,
              t.columnName,
              D
            ), t.tableName === "business_outlet" && t.columnName === "logoUrl" && this.db.run(
              "UPDATE business_outlet SET isOfflineImage = 0, localLogoPath = NULL WHERE id = ?",
              [t.recordId]
            ), this.db.markImageAsUploaded(t.id);
            const M = this.db.query(
              `SELECT * FROM ${t.tableName} WHERE id = ?`,
              [t.recordId]
            );
            if (M && M.length > 0) {
              const _ = M[0], A = {
                table: t.tableName,
                action: Ce.UPDATE,
                data: _,
                id: t.recordId
              };
              this.db.addToQueue(A);
            }
          } else
            console.error("[SyncService] Upload response missing URL", b);
        }
      } catch (r) {
        console.error("[SyncService] processOfflineImages error:", r);
      } finally {
        this.isUploading = !1;
      }
    }
  }
  async attemptSync(r) {
    if (!this.isSyncing) {
      this.isSyncing = !0;
      try {
        const t = r || this.db.getPendingQueueItems();
        if (t.length === 0) {
          this.isSyncing = !1;
          return;
        }
        console.log(
          `[SyncService] Syncing ${t.length} items to ${yu}...`
        );
        const n = this.db.getDeviceId() || "unknown-device";
        console.log("Device ID used for sync:", n);
        const s = t.map((c) => {
          const a = JSON.parse(c.op), l = { ...a.data || a.payload || {} }, d = [
            "isMainLocation",
            "isActive",
            "whatsappChannel",
            "emailChannel",
            "isDeleted",
            "isOnboarded",
            "isOfflineImage",
            "isEmailVerified",
            "isPin",
            "showInPos",
            "limitTotalSelection",
            "limitQuantity"
          ];
          for (const g of d)
            typeof l[g] == "number" && (l[g] = l[g] === 1);
          const f = {
            business_outlet: [
              "operatingHours",
              "taxSettings",
              "serviceCharges",
              "paymentMethods",
              "priceTier",
              "receiptSettings",
              "labelSettings",
              "invoiceSettings",
              "bankDetails",
              "generalSettings"
            ],
            orders: ["timeline"],
            payment_terms: ["paymentInInstallment"],
            system_default: ["data"]
          }, h = a.tableName || a.table || a.type, E = f[h] || [];
          for (const g of E)
            if (typeof l[g] == "string")
              try {
                const m = JSON.parse(l[g]);
                m && typeof m == "object" && (l[g] = m);
              } catch {
              }
          return {
            id: c.id,
            tableName: h,
            recordId: a.recordId || a.id,
            payload: l,
            sourceDeviceId: n,
            action: a.action || a.op,
            timestamp: c.created_at,
            version: this.db.getNextSyncVersion(),
            syncedTo: [],
            createdAt: c.created_at,
            updatedAt: c.created_at
          };
        });
        console.log("Recordss stuff", s[0].payload);
        const i = { records: s };
        console.log(i);
        const o = await pt.fetch(yu, {
          method: "POST",
          body: JSON.stringify(i),
          headers: {
            "Content-Type": "application/json",
            "x-app-version": je.getVersion()
          }
        });
        if (console.log("This is the response", await o.json()), o.ok) {
          const c = t.map((a) => a.id);
          this.db.markAsSynced(c), console.log(`[SyncService] Successfully synced ${c.length} items.`);
        } else {
          const c = await o.text();
          console.error(`[SyncService] Sync failed: ${o.status} ${c}`);
        }
      } catch (t) {
        console.error("[SyncService] Sync process error:", t);
      } finally {
        this.isSyncing = !1;
      }
    }
  }
}
const ct = async (e, r) => e.get("SELECT * FROM business_outlet WHERE id = ?", [r]), TE = async (e) => e.query("SELECT * FROM business_outlet"), yE = async (e, r) => {
  const t = (/* @__PURE__ */ new Date()).toISOString();
  e.run(
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
        updatedAt = @updatedAt
      WHERE id = @outletId
    `,
    {
      outletId: r.outletId,
      country: r.data.country,
      address: r.data.address,
      businessType: r.data.businessType,
      currency: r.data.currency,
      revenueRange: r.data.revenueRange,
      logoUrl: r.data.logoUrl,
      isOfflineImage: r.data.isOfflineImage,
      localLogoPath: r.data.localLogoPath,
      updatedAt: t
    }
  );
  const n = await ct(e, r.outletId);
  n && (console.log(
    `[OutletFeature] Queuing sync for onboarded outlet: ${r.outletId}`
  ), e.addToQueue({
    table: "business_outlet",
    action: Ce.UPDATE,
    data: n,
    id: r.outletId
  }));
}, vE = async (e, r) => {
  const { businessId: t, outletId: n, business: s, location: i } = r, o = (/* @__PURE__ */ new Date()).toISOString(), c = [], a = { businessId: t, updatedAt: o };
  if (s.name !== void 0 && (c.push("name = @name"), a.name = s.name), s.email !== void 0 && (c.push("email = @email"), a.email = s.email), s.phoneNumber !== void 0 && (c.push("phoneNumber = @phoneNumber"), a.phoneNumber = s.phoneNumber), s.address !== void 0 && (c.push("address = @address"), a.address = s.address), s.description !== void 0 && (c.push("description = @description"), a.description = s.description), s.website !== void 0 && (c.push("website = @website"), a.website = s.website), c.length > 0) {
    const d = `
      UPDATE business
      SET ${c.join(", ")}, updatedAt = @updatedAt
      WHERE id = @businessId
    `;
    e.run(d, a);
    const f = e.get("SELECT * FROM business WHERE id = ?", [
      t
    ]);
    f && e.addToQueue({
      table: "business",
      action: Ce.UPDATE,
      data: f,
      id: t
    });
  }
  const u = [], l = { outletId: n, updatedAt: o };
  if (i.name !== void 0 && (u.push("name = @name"), l.name = i.name), i.address !== void 0 && (u.push("address = @address"), l.address = i.address), i.phoneNumber !== void 0 && (u.push("phoneNumber = @phoneNumber"), l.phoneNumber = i.phoneNumber), u.length > 0) {
    const d = `
      UPDATE business_outlet
      SET ${u.join(", ")}, updatedAt = @updatedAt
      WHERE id = @outletId
    `;
    e.run(d, l);
    const f = await ct(e, n);
    f && e.addToQueue({
      table: "business_outlet",
      action: Ce.UPDATE,
      data: f,
      id: n
    });
  }
  return { success: !0 };
}, pn = async (e, r) => {
  const t = await ct(e, r);
  if (!t || !t.priceTier) return [];
  try {
    return typeof t.priceTier == "string" ? JSON.parse(t.priceTier) : t.priceTier;
  } catch {
    return [];
  }
}, xr = async (e, r, t) => {
  const n = (/* @__PURE__ */ new Date()).toISOString(), s = JSON.stringify(t);
  e.run(
    `
    UPDATE business_outlet
    SET
      priceTier = @priceTier,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId: r,
      priceTier: s,
      updatedAt: n
    }
  );
  const i = await ct(e, r);
  i && e.addToQueue({
    table: "business_outlet",
    action: Ce.UPDATE,
    data: i,
    id: r
  });
}, AE = async (e, r) => {
  const { outletId: t, priceTier: n } = r;
  return await xr(e, t, n), { success: !0 };
}, IE = async (e, r) => {
  const { outletId: t, tiers: n } = r, s = await pn(e, t), i = n.map((o) => ({
    ...o,
    id: typeof o.id == "number" && o.id < 0 ? Ve.v4() : o.id || Ve.v4(),
    isNew: !1
  }));
  return s.push(...i), await xr(e, t, s), { success: !0, tiers: s };
}, SE = async (e, r) => {
  const { outletId: t, tier: n } = r, s = await pn(e, t), i = {
    ...n,
    id: typeof n.id == "number" && n.id < 0 ? Ve.v4() : n.id || Ve.v4(),
    isNew: !1
    // Ensure isNew is false when saving to DB
  };
  return s.push(i), await xr(e, t, s), { success: !0, tier: i, tiers: s };
}, NE = async (e, r) => {
  const { outletId: t, tierId: n } = r;
  let s = await pn(e, t);
  return s = s.filter((i) => i.id !== n), await xr(e, t, s), { success: !0, tiers: s };
}, _E = async (e, r) => {
  const { outletId: t, tier: n } = r, s = await pn(e, t), i = s.findIndex((o) => o.id === n.id);
  return i !== -1 ? (s[i] = { ...s[i], ...n, isNew: !1 }, await xr(e, t, s), { success: !0, tier: s[i], tiers: s }) : { success: !1, message: "Tier not found" };
}, wE = async (e, r) => {
  const { outletId: t, settings: n } = r, s = (/* @__PURE__ */ new Date()).toISOString();
  e.run(
    `
    UPDATE business_outlet
    SET
      receiptSettings = @receiptSettings,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId: t,
      receiptSettings: JSON.stringify(n),
      updatedAt: s
    }
  );
  const i = await ct(e, t);
  return i && e.addToQueue({
    table: "business_outlet",
    action: Ce.UPDATE,
    data: i,
    id: t
  }), { success: !0, settings: n };
}, RE = async (e, r) => {
  const { outletId: t, settings: n } = r, s = (/* @__PURE__ */ new Date()).toISOString();
  e.run(
    `
    UPDATE business_outlet
    SET
      labelSettings = @labelSettings,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId: t,
      labelSettings: JSON.stringify(n),
      updatedAt: s
    }
  );
  const i = await ct(e, t);
  return i && e.addToQueue({
    table: "business_outlet",
    action: Ce.UPDATE,
    data: i,
    id: t
  }), { success: !0, settings: n };
}, OE = async (e, r) => {
  const { outletId: t, settings: n } = r, s = (/* @__PURE__ */ new Date()).toISOString();
  e.run(
    `
    UPDATE business_outlet
    SET
      invoiceSettings = @invoiceSettings,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId: t,
      invoiceSettings: JSON.stringify(n),
      updatedAt: s
    }
  );
  const i = await ct(e, t);
  return i && e.addToQueue({
    table: "business_outlet",
    action: Ce.UPDATE,
    data: i,
    id: t
  }), { success: !0, settings: n };
}, bE = async (e, r) => {
  const { outletId: t, operatingHours: n } = r, s = (/* @__PURE__ */ new Date()).toISOString();
  e.run(
    `
    UPDATE business_outlet
    SET
      operatingHours = @operatingHours,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId: t,
      operatingHours: JSON.stringify(n),
      updatedAt: s
    }
  );
  const i = await ct(e, t);
  return i && e.addToQueue({
    table: "business_outlet",
    action: Ce.UPDATE,
    data: i,
    id: t
  }), { success: !0, operatingHours: n };
}, LE = async (e, r) => {
  const { outletId: t, methods: n } = r, s = (/* @__PURE__ */ new Date()).toISOString();
  e.run(
    `
    UPDATE business_outlet
    SET
      paymentMethods = @paymentMethods,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId: t,
      paymentMethods: JSON.stringify(n),
      updatedAt: s
    }
  );
  const i = await ct(e, t);
  return i && e.addToQueue({
    table: "business_outlet",
    action: Ce.UPDATE,
    data: i,
    id: t
  }), { success: !0, methods: n };
}, CE = async (e, r) => {
  const { outletId: t, settings: n } = r, s = (/* @__PURE__ */ new Date()).toISOString();
  e.run(
    `
    UPDATE business_outlet
    SET
      taxSettings = @taxSettings,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId: t,
      taxSettings: JSON.stringify(n),
      updatedAt: s
    }
  );
  const i = await ct(e, t);
  return i && e.addToQueue({
    table: "business_outlet",
    action: Ce.UPDATE,
    data: i,
    id: t
  }), { success: !0, settings: n };
}, DE = async (e, r) => {
  const { outletId: t, settings: n } = r, s = (/* @__PURE__ */ new Date()).toISOString();
  e.run(
    `
    UPDATE business_outlet
    SET
      serviceChargeSettings = @serviceChargeSettings,
      updatedAt = @updatedAt
    WHERE id = @outletId
  `,
    {
      outletId: t,
      serviceChargeSettings: JSON.stringify(n),
      updatedAt: s
    }
  );
  const i = await ct(e, t);
  return i && e.addToQueue({
    table: "business_outlet",
    action: Ce.UPDATE,
    data: i,
    id: t
  }), { success: !0, settings: n };
}, xE = async (e) => {
  const r = String(e?.html || "");
  if (!r.trim())
    return { success: !1, error: "Empty HTML" };
  const t = e?.options || {}, n = !!t.silent, s = new st({
    show: !n,
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0,
      sandbox: !0
    }
  });
  try {
    const i = `data:text/html;charset=utf-8,${encodeURIComponent(r)}`;
    if (await s.loadURL(i), await new Promise(
      (c) => s.webContents.once("did-finish-load", () => c())
    ), !n)
      try {
        s.show(), s.focus();
      } catch {
      }
    return await new Promise(
      (c) => {
        s.webContents.print(
          {
            silent: n,
            printBackground: t.printBackground !== !1,
            deviceName: t.deviceName
          },
          (a, u) => {
            c(a ? { success: !0 } : { success: !1, error: u });
          }
        );
      }
    );
  } catch (i) {
    return { success: !1, error: String(i?.message || i) };
  } finally {
    try {
      s.close();
    } catch {
    }
  }
}, PE = async (e, r) => {
  const { businessId: t, location: n } = r, s = If(), i = (/* @__PURE__ */ new Date()).toISOString(), o = {
    id: s,
    businessId: t,
    name: n.name,
    address: n.address,
    phoneNumber: n.phoneNumber,
    isMainLocation: n.isMainLocation ? 1 : 0,
    isActive: 1,
    isOnboarded: 0,
    // Assuming created via settings is onboarded
    isDeleted: 0,
    createdAt: i,
    updatedAt: i
    // Default values for other fields to match schema expectations or avoid nulls if strict
  }, c = Ou(o);
  return e.run(Ru, c), e.addToQueue({
    table: "business_outlet",
    action: Ce.UPDATE,
    // or UPDATE since we use Upsert logic, but CREATE is semantically correct for sync
    data: o,
    id: s
  }), { success: !0, outlet: o };
}, UE = async (e, r) => {
  const { outletId: t, location: n } = r, s = (/* @__PURE__ */ new Date()).toISOString(), i = [], o = { outletId: t, updatedAt: s };
  if (n.name !== void 0 && (i.push("name = @name"), o.name = n.name), n.address !== void 0 && (i.push("address = @address"), o.address = n.address), n.phoneNumber !== void 0 && (i.push("phoneNumber = @phoneNumber"), o.phoneNumber = n.phoneNumber), n.isMainLocation !== void 0 && (i.push("isMainLocation = @isMainLocation"), o.isMainLocation = n.isMainLocation ? 1 : 0), i.length === 0) return { success: !0 };
  const c = `
    UPDATE business_outlet
    SET ${i.join(", ")}, updatedAt = @updatedAt
    WHERE id = @outletId
  `;
  e.run(c, o);
  const a = e.get("SELECT * FROM business_outlet WHERE id = ?", [
    t
  ]);
  return a && e.addToQueue({
    table: "business_outlet",
    action: Ce.UPDATE,
    data: a,
    id: t
  }), { success: !0, outlet: a };
}, FE = async (e, r) => {
  const { outletId: t } = r, n = (/* @__PURE__ */ new Date()).toISOString();
  e.run(
    "UPDATE business_outlet SET isDeleted = 1, updatedAt = @updatedAt WHERE id = @outletId",
    { outletId: t, updatedAt: n }
  );
  const s = e.get("SELECT * FROM business_outlet WHERE id = ?", [
    t
  ]);
  return s && e.addToQueue({
    table: "business_outlet",
    action: Ce.DELETE,
    // Sync usually handles soft delete as an update to isDeleted flag
    data: s,
    id: t
  }), { success: !0 };
}, kE = async (e, r) => {
  const t = (/* @__PURE__ */ new Date()).toISOString(), n = e.getIdentity()?.businessId || "";
  return e.transaction(() => {
    const i = Ve.v4(), o = {
      id: i,
      name: r.itemName,
      itemCode: r.itemCode,
      businessId: n,
      category: r.itemCategory,
      itemType: r.itemType,
      unitOfPurchase: r.unitOfPurchase,
      unitOfTransfer: r.unitOfTransfer,
      unitOfConsumption: r.unitOfConsumption,
      displayedUnitOfMeasure: r.displayedUnitOfMeasure,
      transferPerPurchase: parseFloat(r.noOfTransferBasedOnPurchase),
      consumptionPerTransfer: parseFloat(r.noOfConsumptionUnitBasedOnPurchase) / parseFloat(r.noOfTransferBasedOnPurchase),
      isTraceable: r.makeItemTraceable ? 1 : 0,
      isTrackable: r.trackInventory ? 1 : 0,
      createdAt: t,
      updatedAt: t,
      recordId: null,
      version: 1
    };
    e.run(
      xu,
      e.sanitize(Pu(o))
    ), e.addToQueue({
      table: "item_master",
      action: Ce.CREATE,
      data: o,
      id: i
    });
    let c = e.query("SELECT * FROM inventory WHERE outletId = ? LIMIT 1", [
      r.outletId
    ])[0];
    if (!c) {
      const h = Ve.v4();
      c = {
        id: h,
        type: "central",
        allowProcurement: 1,
        outletId: r.outletId,
        businessId: n,
        createdAt: t,
        updatedAt: t,
        recordId: null,
        version: 1
      }, e.run(
        bu,
        e.sanitize(Lu(c))
      ), e.addToQueue({
        table: "inventory",
        action: Ce.CREATE,
        data: c,
        id: h
      });
    }
    const a = Ve.v4(), u = {
      id: a,
      costMethod: "weighted_average",
      costPrice: parseFloat(r.costPrice),
      currentStockLevel: parseFloat(r.quantityPurchased),
      minimumStockLevel: parseFloat(r.minimumStockLevel),
      reOrderLevel: parseFloat(r.reOrderLevel),
      isDeleted: 0,
      addedBy: e.getSyncUserId(),
      modifiedBy: e.getSyncUserId(),
      createdAt: t,
      updatedAt: t,
      itemMasterId: i,
      inventoryId: c.id,
      recordId: null,
      version: 1
    };
    e.run(
      Cu,
      e.sanitize(Du(u))
    ), e.addToQueue({
      table: "inventory_item",
      action: Ce.CREATE,
      data: u,
      id: a
    });
    const l = Ve.v4();
    let d = "";
    if (Array.isArray(r.suppliers)) {
      const h = r.suppliers.filter(Boolean);
      if (h.length > 0) {
        const E = h.map(() => "?").join(","), g = e.query(
          `SELECT id, name FROM customers WHERE id IN (${E})`,
          h
        );
        d = h.map((v) => g.find((b) => b.id === v)?.name || v).join(", ");
      }
    } else
      d = r.suppliers || "";
    const f = {
      id: l,
      lotNumber: r.lotNumber,
      quantityPurchased: parseFloat(r.quantityPurchased),
      supplierName: d,
      supplierSesrialNumber: r.supplierBarcode,
      supplierAddress: "",
      currentStockLevel: parseFloat(r.quantityPurchased),
      initialStockLevel: parseFloat(r.quantityPurchased),
      expiryDate: r.expiryDate,
      costPrice: parseFloat(r.costPrice),
      createdAt: t,
      updatedAt: t,
      itemId: a,
      recordId: null,
      version: 1
    };
    return e.run(Uu, e.sanitize(Fu(f))), e.addToQueue({
      table: "item_lot",
      action: Ce.CREATE,
      data: f,
      id: l
    }), { itemMasterId: i, inventoryItemId: a, itemLotId: l };
  })();
};
function Sd(e, r, t, n) {
  const s = `
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
    `, i = r.allergenList && r.allergenList.length > 0 ? r.allergenList : r.allergens && r.allergens.length > 0 ? r.allergens : [], o = {
    id: t,
    name: r.name,
    isActive: r.isActive ?? 1,
    description: r.description ?? null,
    category: r.category ?? null,
    price: r.price ?? null,
    preparationArea: r.preparationArea ?? null,
    weight: r.weight ?? null,
    productCode: r.productCode ?? null,
    weightScale: r.weightScale ?? null,
    productAvailableStock: r.productAvailableStock ?? null,
    packagingMethod: r.packagingMethod ? JSON.stringify(r.packagingMethod) : null,
    priceTierId: r.priceTierId ? JSON.stringify(r.priceTierId) : null,
    allergenList: i.length > 0 ? JSON.stringify(i) : null,
    logoUrl: r.logoUrl ?? null,
    logoHash: r.logoHash ?? null,
    leadTime: r.leadTime ?? null,
    availableAtStorefront: r.availableAtStorefront ?? 1,
    createdAtStorefront: r.createdAtStorefront ?? 1,
    isDeleted: r.isDeleted ?? 0,
    createdAt: r.createdAt ?? n,
    updatedAt: r.updatedAt ?? n,
    lastSyncedAt: r.lastSyncedAt ?? null,
    outletId: r.outletId ?? null
  };
  return e.run(s, o), o;
}
function Nd(e, r, t) {
  return {
    type: "product",
    op: "upsert",
    id: r,
    outletId: e.outletId,
    data: e,
    ts: t
  };
}
function ME(e, r) {
  const t = r.id || Ve.v4(), n = (/* @__PURE__ */ new Date()).toISOString(), s = Sd(e, r, t, n), i = Nd(s, t, n);
  return e.addToQueue(i), { id: t };
}
function qE(e, r) {
  const { outletId: t, data: n } = r, s = (/* @__PURE__ */ new Date()).toISOString(), i = [];
  return e.transaction(() => {
    for (const c of n) {
      const a = c.id || Ve.v4(), u = { ...c, outletId: t }, l = Sd(e, u, a, s), d = Nd(l, a, s);
      e.addToQueue(d), i.push(a);
    }
  })(), { ids: i, status: "success", count: i.length };
}
const $E = async (e, r) => {
  const { outletId: t, data: n } = r, s = (/* @__PURE__ */ new Date()).toISOString(), i = [];
  return e.transaction(() => {
    for (const c of n) {
      const a = c.id || Ve.v4(), u = {
        ...c,
        id: a,
        outletId: t,
        createdAt: c.createdAt || s,
        updatedAt: s,
        status: c.status || "active",
        customerType: c.customerType || "individual",
        emailVerified: c.emailVerified ? 1 : 0,
        phoneVerfied: c.phoneVerfied ? 1 : 0,
        version: c.version || 1
      }, l = to(u);
      e.run(eo, e.sanitize(l)), e.addToQueue({
        table: "customers",
        action: Ce.CREATE,
        data: u,
        id: a
      }), i.push(a);
    }
  })(), { ids: i, status: "success", count: i.length };
}, XE = async (e, r) => {
  const t = r.id || Ve.v4(), n = e.sanitize(to(r));
  return e.run(eo, n), e.addToQueue({
    table: "customers",
    action: r.createdAt === r.updatedAt ? Ce.CREATE : Ce.UPDATE,
    data: r,
    id: t
  }), { id: t };
}, BE = async (e) => e.query("SELECT * FROM customers"), HE = async (e, r) => e.query(
  "SELECT * FROM payment_terms WHERE outletId = ? AND deletedAt IS NULL",
  [r]
), jE = async (e, r) => {
  const t = r.id || Ve.v4(), n = (/* @__PURE__ */ new Date()).toISOString(), s = {
    id: t,
    name: r.name,
    paymentType: r.paymentType,
    instantPayment: r.instantPayment ? 1 : 0,
    paymentOnDelivery: r.paymentOnDelivery ? 1 : 0,
    paymentInInstallment: r.paymentInInstallment ? JSON.stringify(r.paymentInInstallment) : null,
    outletId: r.outletId,
    version: 1,
    createdAt: n,
    updatedAt: n,
    deletedAt: null
  };
  return e.run(
    `
    INSERT INTO payment_terms (
      id, name, paymentType, instantPayment, paymentOnDelivery, 
      paymentInInstallment, outletId, version, createdAt, updatedAt, deletedAt
    ) VALUES (
      @id, @name, @paymentType, @instantPayment, @paymentOnDelivery, 
      @paymentInInstallment, @outletId, @version, @createdAt, @updatedAt, @deletedAt
    ) ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      paymentType = excluded.paymentType,
      instantPayment = excluded.instantPayment,
      paymentOnDelivery = excluded.paymentOnDelivery,
      paymentInInstallment = excluded.paymentInInstallment,
      version = payment_terms.version + 1,
      updatedAt = excluded.updatedAt
  `,
    s
  ), e.addToQueue({
    table: "payment_terms",
    action: r.id ? Ce.UPDATE : Ce.CREATE,
    data: {
      ...s,
      paymentInInstallment: r.paymentInInstallment
      // Send original object to sync
    },
    id: t
  }), s;
}, GE = async (e, r) => {
  const t = (/* @__PURE__ */ new Date()).toISOString();
  e.run("UPDATE payment_terms SET deletedAt = ? WHERE id = ?", [t, r]);
  const n = e.query("SELECT * FROM payment_terms WHERE id = ?", [r])[0];
  n && e.addToQueue({
    table: "payment_terms",
    action: Ce.DELETE,
    data: n,
    id: r
  });
}, VE = async (e) => e.query("SELECT * FROM business");
Zs.registerSchemesAsPrivileged([
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
const WE = Sf(import.meta.url), Qs = ye.dirname(WE);
wu.config({ path: ye.join(process.cwd(), ".env.local") });
wu.config();
let Ie, Qe, Zr, Mt, en, vu, tn;
function YE() {
  return "dev-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function _d() {
  let e = ye.join(Qs, "../electron/assets/icon.png");
  be.existsSync(e) || (e = ye.join(process.cwd(), "electron/assets/icon.png")), !be.existsSync(e) && je.isPackaged && (e = ye.join(process.resourcesPath, "assets/icon.png"), be.existsSync(e) || (e = ye.join(
    process.resourcesPath,
    "app.asar/electron/assets/icon.png"
  )));
  const r = Af.createFromPath(e), t = new st({
    width: 1200,
    height: 800,
    show: !1,
    backgroundColor: "#ffffff",
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0,
      preload: ye.join(Qs, "preload.cjs")
    },
    icon: r
  });
  process.platform === "darwin" && je.dock.setIcon(r), t.webContents.on("render-process-gone", (n, s) => {
    console.error("Renderer process gone:", s), je.isPackaged && t.reload();
  }), t.webContents.on("did-fail-load", (n, s, i, o) => {
    console.error("FAILED LOAD:", s, i, o);
  }), process.env.VITE_DEV_SERVER_URL ? (t.loadURL(process.env.VITE_DEV_SERVER_URL), t.webContents.openDevTools()) : t.loadFile(ye.join(Qs, "../dist/index.html")), t.once("ready-to-show", () => t.show());
}
je.whenReady().then(() => {
  Ie = new uh(), Qe = new mh(Ie), Zr = new gh(), en = new fE();
  const e = Qe.getUser() || {}, r = e.deviceId || YE();
  e.deviceId || Qe.saveUser({ deviceId: r }), Mt = new Th(r), Mt.start(), vu = new hE(Mt), tn = new gE(Ie, Zr, Mt), fe.on("auth:storeTokens", (t, n) => {
    Qe.storeTokens(n);
  }), fe.on("auth:clearTokens", () => Qe.clearTokens()), fe.handle("auth:getTokens", () => Qe.getTokens()), fe.handle(
    "auth:saveLoginHash",
    (t, n, s) => Qe.saveLoginHash(n, s)
  ), fe.handle(
    "auth:verifyLoginHash",
    (t, n, s) => Qe.verifyLoginHash(n, s)
  ), fe.handle(
    "auth:savePinHash",
    (t, n) => Qe.savePinHash(n)
  ), fe.handle(
    "auth:verifyPinHash",
    (t, n) => Qe.verifyPinHash(n)
  ), fe.handle("db:getUser", () => Qe.getUser()), fe.handle("db:saveUser", (t, n) => {
    Qe.saveUser(n), tn.triggerSync();
  }), fe.handle("cache:get", (t, n) => Ie.getCache(n)), fe.handle(
    "cache:put",
    (t, n, s) => Ie.putCache(n, s)
  ), fe.handle(
    "db:saveOutletOnboarding",
    (t, n) => yE(Ie, n)
  ), fe.handle("db:getOutlets", () => TE(Ie)), fe.handle("db:getCustomers", () => BE(Ie)), fe.handle(
    "db:getPaymentTerms",
    (t, n) => HE(Ie, n)
  ), fe.handle(
    "db:savePaymentTerm",
    (t, n) => jE(Ie, n)
  ), fe.handle(
    "db:deletePaymentTerm",
    (t, n) => GE(Ie, n)
  ), fe.handle("db:getBusinesses", () => VE(Ie)), fe.handle("db:wipeData", () => Ie.wipeUserData()), fe.handle(
    "db:updateBusinessDetails",
    (t, n) => vE(Ie, n)
  ), fe.handle(
    "db:updatePaymentTier",
    (t, n) => AE(Ie, n)
  ), fe.handle(
    "db:addPaymentTier",
    (t, n) => SE(Ie, n)
  ), fe.handle(
    "db:deletePaymentTier",
    (t, n) => NE(Ie, n)
  ), fe.handle(
    "db:editPaymentTier",
    (t, n) => _E(Ie, n)
  ), fe.handle(
    "db:bulkAddPaymentTiers",
    (t, n) => IE(Ie, n)
  ), fe.handle(
    "db:updateReceiptSettings",
    (t, n) => wE(Ie, n)
  ), fe.handle(
    "db:updateLabelSettings",
    (t, n) => RE(Ie, n)
  ), fe.handle(
    "db:updateInvoiceSettings",
    (t, n) => OE(Ie, n)
  ), fe.handle(
    "db:updateOperatingHours",
    (t, n) => bE(Ie, n)
  ), fe.handle(
    "db:updatePaymentMethods",
    (t, n) => LE(Ie, n)
  ), fe.handle(
    "db:updateTaxSettings",
    (t, n) => CE(Ie, n)
  ), fe.handle(
    "db:updateServiceCharges",
    (t, n) => DE(Ie, n)
  ), fe.handle(
    "db:createOutlet",
    (t, n) => PE(Ie, n)
  ), fe.handle(
    "db:updateOutlet",
    (t, n) => UE(Ie, n)
  ), fe.handle(
    "db:deleteOutlet",
    (t, n) => FE(Ie, n)
  ), fe.handle(
    "db:createProduct",
    (t, n) => ME(Ie, n)
  ), fe.handle(
    "db:createInventoryItem",
    (t, n) => kE(Ie, n)
  ), fe.handle(
    "db:bulkCreateProducts",
    (t, n) => qE(Ie, n)
  ), fe.handle(
    "db:bulkCreateCustomers",
    (t, n) => $E(Ie, n)
  ), fe.handle(
    "db:upsertCustomer",
    (t, n) => XE(Ie, n)
  ), fe.handle(
    "db:query",
    (t, n, s) => Ie.query(n, s)
  ), fe.handle(
    "assets:import",
    (t, n) => vu.importLocalAsset(n)
  ), fe.handle("net:uploadImage", async (t, { buffer: n, name: s, type: i }) => {
    const o = process.env.CLOUDINARY_CLOUD_NAME, c = process.env.CLOUDINARY_API_KEY, a = process.env.CLOUDINARY_API_KEY_SECRET;
    if (!o || !c || !a)
      return console.error("[Main] Cloudinary credentials missing in environment"), {
        ok: !1,
        status: 500,
        error: "Cloudinary credentials not configured"
      };
    const u = Math.round((/* @__PURE__ */ new Date()).getTime() / 1e3).toString(), l = `timestamp=${u}${a}`, d = Me.createHash("sha1").update(l).digest("hex"), f = `https://api.cloudinary.com/v1_1/${o}/image/upload`, h = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`, E = [];
    E.push(Buffer.from(`--${h}\r
`)), E.push(
      Buffer.from(
        `Content-Disposition: form-data; name="file"; filename="${s}"\r
`
      )
    ), E.push(Buffer.from(`Content-Type: ${i}\r
\r
`)), E.push(Buffer.from(n)), E.push(Buffer.from(`\r
--${h}\r
`)), E.push(
      Buffer.from(
        `Content-Disposition: form-data; name="api_key"\r
\r
${c}\r
--${h}\r
`
      )
    ), E.push(
      Buffer.from(
        `Content-Disposition: form-data; name="timestamp"\r
\r
${u}\r
--${h}\r
`
      )
    ), E.push(
      Buffer.from(
        `Content-Disposition: form-data; name="signature"\r
\r
${d}\r
--${h}--\r
`
      )
    );
    const g = Buffer.concat(E);
    try {
      const m = await pt.fetch(f, {
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${h}`
        },
        body: g
      }), v = await m.json();
      return console.log("Cloudinary Upload Response:", v), {
        ok: m.ok,
        status: m.status,
        data: {
          data: {
            url: v.secure_url || v.url,
            ...v
          }
        }
      };
    } catch (m) {
      return console.error("[Main] Cloudinary upload error:", m), {
        ok: !1,
        status: 500,
        error: m.message
      };
    }
  }), fe.handle("sync:flush", () => tn.flushQueue()), fe.handle(
    "sync:trigger",
    (t, n) => tn.triggerSync(n)
  ), fe.handle("queue:add", (t, n) => Ie.addToQueue(n)), fe.handle("queue:list", () => Ie.getPendingQueue()), fe.handle("queue:clear", () => Ie.clearQueue()), fe.handle("queue:set", (t, n) => Ie.setQueue(n)), fe.handle(
    "db:getSystemDefaults",
    (t, n, s) => Ie.getSystemDefaults(n, s)
  ), fe.handle(
    "db:addSystemDefault",
    (t, n, s, i) => Ie.addSystemDefault(n, s, i)
  ), fe.handle(
    "db:deleteSystemDefault",
    (t, n) => Ie.deleteSystemDefault(n)
  ), fe.handle("network:getStatus", () => Zr.getStatus()), fe.on(
    "network:setOnline",
    (t, n) => Zr.setOnline(n)
  ), fe.handle("shell:openExternal", async (t, n) => {
    try {
      const s = String(n || "").trim();
      return !s || !s.startsWith("mailto:") && !s.startsWith("https://") && !s.startsWith("http://") ? !1 : (await vf.openExternal(s), !0);
    } catch (s) {
      return console.error("[Main] shell:openExternal failed:", s), !1;
    }
  }), fe.handle("p2p:getPeers", () => Mt.getPeers()), fe.on(
    "p2p:broadcast",
    (t, n) => Mt.broadcast(n)
  ), fe.on(
    "p2p:sendToPeer",
    (t, n, s) => Mt.sendToPeerById(n, s)
  ), fe.on("updater:check", () => en.checkForUpdates()), fe.on("updater:quitAndInstall", () => en.quitAndInstall()), fe.on("system:factoryReset", async () => {
    try {
      console.log("Factory reset requested..."), await Qe.clearTokens(), Ie.clearAllData(), console.log("Factory reset complete. Relaunching..."), je.relaunch(), je.exit(0);
    } catch (t) {
      console.error("Factory reset failed:", t);
    }
  }), fe.handle("print:html", async (t, n) => xE(n)), setTimeout(() => {
    je.isPackaged && en.checkForUpdatesAndNotify();
  }, 3e3), _d();
});
je.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (Ie)
      try {
        Ie.close();
      } catch (e) {
        console.error("[Main] Error closing database:", e);
      }
    je.quit();
  }
});
je.on("activate", () => {
  st.getAllWindows().length === 0 && _d();
});
