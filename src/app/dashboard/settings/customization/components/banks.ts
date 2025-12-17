// Banks database organized by country code (ISO 3166-1 alpha-2)
export const BANKS_BY_COUNTRY: Record<string, string[]> = {
  // Nigeria
  Nigeria: [
    "Access Bank",
    "Guaranty Trust Bank (GTBank)",
    "United Bank for Africa (UBA)",
    "First Bank of Nigeria",
    "Zenith Bank",
    "Fidelity Bank",
    "Union Bank",
    "Sterling Bank",
    "Stanbic IBTC Bank",
    "Wema Bank",
    "Ecobank Nigeria",
    "Polaris Bank",
    "Keystone Bank",
    "First City Monument Bank (FCMB)",
    "Heritage Bank",
    "Providus Bank",
    "Kuda Bank",
    "Opay",
    "PalmPay",
    "Moniepoint",
    "VFD Microfinance Bank",
    "Rubies Bank",
    "Parallex Bank",
    "Premium Trust Bank",
    "Titan Trust Bank",
    "Globus Bank",
    "SunTrust Bank",
  ],

  // United States
  US: [
    "Bank of America",
    "JPMorgan Chase",
    "Wells Fargo",
    "Citibank",
    "U.S. Bank",
    "PNC Bank",
    "Capital One",
    "TD Bank",
    "Truist Bank",
    "Goldman Sachs",
    "Morgan Stanley",
    "American Express",
    "Ally Bank",
    "Charles Schwab Bank",
    "HSBC USA",
    "Fifth Third Bank",
    "KeyBank",
    "Regions Bank",
    "M&T Bank",
    "Citizens Bank",
    "BMO Harris Bank",
    "Discover Bank",
    "Navy Federal Credit Union",
    "USAA",
  ],

  // United Kingdom
  GB: [
    "Barclays",
    "HSBC UK",
    "Lloyds Bank",
    "NatWest",
    "Santander UK",
    "Royal Bank of Scotland",
    "TSB Bank",
    "Metro Bank",
    "Nationwide Building Society",
    "Halifax",
    "First Direct",
    "Monzo",
    "Revolut",
    "Starling Bank",
    "Virgin Money",
    "Co-operative Bank",
    "Yorkshire Bank",
    "Clydesdale Bank",
    "Atom Bank",
    "Tide",
  ],

  // Canada
  CA: [
    "Royal Bank of Canada (RBC)",
    "Toronto-Dominion Bank (TD)",
    "Bank of Nova Scotia (Scotiabank)",
    "Bank of Montreal (BMO)",
    "Canadian Imperial Bank of Commerce (CIBC)",
    "National Bank of Canada",
    "Desjardins Group",
    "HSBC Canada",
    "Laurentian Bank",
    "Canadian Western Bank",
    "ATB Financial",
    "Tangerine",
    "Simplii Financial",
    "EQ Bank",
  ],

  // Ghana
  GH: [
    "GCB Bank",
    "Ecobank Ghana",
    "Stanbic Bank Ghana",
    "Standard Chartered Bank Ghana",
    "Absa Bank Ghana",
    "Fidelity Bank Ghana",
    "Zenith Bank Ghana",
    "Access Bank Ghana",
    "CalBank",
    "Agricultural Development Bank",
    "United Bank for Africa Ghana",
    "Guaranty Trust Bank Ghana",
    "Republic Bank Ghana",
    "Prudential Bank",
    "First National Bank Ghana",
    "Consolidated Bank Ghana",
  ],

  // South Africa
  ZA: [
    "Standard Bank",
    "FirstRand Bank (FNB)",
    "Absa Bank",
    "Nedbank",
    "Capitec Bank",
    "Investec",
    "Discovery Bank",
    "TymeBank",
    "Bank Zero",
    "African Bank",
    "Bidvest Bank",
    "Sasfin Bank",
    "Mercantile Bank",
  ],

  // Kenya
  KE: [
    "Kenya Commercial Bank (KCB)",
    "Equity Bank",
    "Co-operative Bank of Kenya",
    "Absa Bank Kenya",
    "Standard Chartered Kenya",
    "Stanbic Bank Kenya",
    "NCBA Bank",
    "Diamond Trust Bank Kenya",
    "I&M Bank",
    "Family Bank",
    "Prime Bank",
    "Gulf African Bank",
    "Sidian Bank",
    "National Bank of Kenya",
    "Bank of Africa Kenya",
  ],

  // India
  IN: [
    "State Bank of India (SBI)",
    "HDFC Bank",
    "ICICI Bank",
    "Punjab National Bank",
    "Bank of Baroda",
    "Canara Bank",
    "Union Bank of India",
    "Axis Bank",
    "Kotak Mahindra Bank",
    "IndusInd Bank",
    "Yes Bank",
    "IDFC First Bank",
    "Bandhan Bank",
    "Federal Bank",
    "South Indian Bank",
    "Karnataka Bank",
    "RBL Bank",
    "Bank of India",
    "Central Bank of India",
    "Indian Bank",
    "UCO Bank",
    "Bank of Maharashtra",
  ],

  // Australia
  AU: [
    "Commonwealth Bank (CBA)",
    "Westpac",
    "ANZ (Australia and New Zealand Banking Group)",
    "National Australia Bank (NAB)",
    "Macquarie Bank",
    "Bendigo Bank",
    "Bank of Queensland",
    "Suncorp Bank",
    "ING Australia",
    "AMP Bank",
    "HSBC Australia",
    "Citibank Australia",
    "Bank of Melbourne",
    "St.George Bank",
    "BankSA",
  ],

  // Germany
  DE: [
    "Deutsche Bank",
    "Commerzbank",
    "DZ Bank",
    "KfW",
    "Landesbank Baden-Württemberg",
    "Bayerische Landesbank",
    "Norddeutsche Landesbank",
    "Sparkasse",
    "Volksbank",
    "Postbank",
    "ING Germany",
    "Santander Germany",
    "HSBC Germany",
    "N26",
    "Comdirect",
    "Consorsbank",
  ],

  // France
  FR: [
    "BNP Paribas",
    "Crédit Agricole",
    "Société Générale",
    "Groupe BPCE",
    "Crédit Mutuel",
    "La Banque Postale",
    "Caisse d'Épargne",
    "LCL",
    "Banque Populaire",
    "HSBC France",
    "AXA Banque",
    "Boursorama Banque",
    "ING France",
    "BNP Paribas Personal Finance",
  ],

  // United Arab Emirates
  AE: [
    "Emirates NBD",
    "First Abu Dhabi Bank (FAB)",
    "Dubai Islamic Bank",
    "Abu Dhabi Commercial Bank (ADCB)",
    "Mashreq Bank",
    "Commercial Bank of Dubai",
    "RAKBANK",
    "Abu Dhabi Islamic Bank (ADIB)",
    "Sharjah Islamic Bank",
    "National Bank of Fujairah",
    "Ajman Bank",
    "Emirates Islamic Bank",
    "National Bank of Ras Al-Khaimah",
    "Union National Bank",
    "HSBC UAE",
    "Standard Chartered UAE",
    "Citibank UAE",
  ],

  // Saudi Arabia
  SA: [
    "National Commercial Bank (NCB)",
    "Al Rajhi Bank",
    "Riyad Bank",
    "Saudi National Bank (SNB)",
    "Banque Saudi Fransi",
    "Arab National Bank",
    "Saudi British Bank (SABB)",
    "Alinma Bank",
    "Bank AlJazira",
    "Saudi Investment Bank",
    "Bank Albilad",
    "HSBC Saudi Arabia",
    "Deutsche Gulf Finance",
  ],

  // China
  CN: [
    "Industrial and Commercial Bank of China (ICBC)",
    "China Construction Bank",
    "Agricultural Bank of China",
    "Bank of China",
    "Bank of Communications",
    "China Merchants Bank",
    "Postal Savings Bank of China",
    "Industrial Bank",
    "Shanghai Pudong Development Bank",
    "China Minsheng Bank",
    "China CITIC Bank",
    "China Everbright Bank",
    "Ping An Bank",
    "Huaxia Bank",
    "China Guangfa Bank",
  ],

  // Japan
  JP: [
    "Mitsubishi UFJ Financial Group",
    "Sumitomo Mitsui Financial Group",
    "Mizuho Financial Group",
    "Japan Post Bank",
    "Resona Holdings",
    "Norinchukin Bank",
    "Shinsei Bank",
    "Aozora Bank",
    "Seven Bank",
    "Sony Bank",
    "Rakuten Bank",
    "SBI Sumishin Net Bank",
  ],

  // Brazil
  BR: [
    "Banco do Brasil",
    "Itaú Unibanco",
    "Bradesco",
    "Caixa Econômica Federal",
    "Santander Brasil",
    "Banco BTG Pactual",
    "Banco Safra",
    "Banrisul",
    "Banco Inter",
    "Nubank",
    "C6 Bank",
    "Original Bank",
    "PagBank",
  ],

  // Mexico
  MX: [
    "BBVA México",
    "Banamex (Citibanamex)",
    "Santander México",
    "Banorte",
    "HSBC México",
    "Scotiabank México",
    "Inbursa",
    "Banco Azteca",
    "BanBajío",
    "Afirme",
    "Banregio",
    "Banco del Bajío",
  ],

  // Singapore
  SG: [
    "DBS Bank",
    "Oversea-Chinese Banking Corporation (OCBC)",
    "United Overseas Bank (UOB)",
    "Standard Chartered Singapore",
    "Citibank Singapore",
    "HSBC Singapore",
    "Maybank Singapore",
    "ANZ Singapore",
    "Bank of China Singapore",
    "ICBC Singapore",
  ],

  // Malaysia
  MY: [
    "Malayan Banking (Maybank)",
    "CIMB Bank",
    "Public Bank",
    "RHB Bank",
    "Hong Leong Bank",
    "AmBank",
    "Bank Islam Malaysia",
    "Bank Rakyat",
    "HSBC Malaysia",
    "Standard Chartered Malaysia",
    "Citibank Malaysia",
    "OCBC Bank Malaysia",
    "UOB Malaysia",
  ],

  // Egypt
  EG: [
    "National Bank of Egypt",
    "Banque Misr",
    "Commercial International Bank (CIB)",
    "QNB Alahli",
    "Bank of Alexandria",
    "Banque du Caire",
    "Arab African International Bank",
    "HSBC Egypt",
    "Crédit Agricole Egypt",
    "Faisal Islamic Bank of Egypt",
  ],
};

// Get list of all supported countries
export const SUPPORTED_COUNTRIES = Object.keys(BANKS_BY_COUNTRY).sort();

// Helper function to get banks by country code
export const getBanksByCountry = (countryCode: string): string[] => {
  return BANKS_BY_COUNTRY[countryCode] || [];
};

// Country names mapping (for display)
export const COUNTRY_NAMES: Record<string, string> = {
  NG: "Nigeria",
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  GH: "Ghana",
  ZA: "South Africa",
  KE: "Kenya",
  IN: "India",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  CN: "China",
  JP: "Japan",
  BR: "Brazil",
  MX: "Mexico",
  SG: "Singapore",
  MY: "Malaysia",
  EG: "Egypt",
};

// Get country name from code
export const getCountryName = (countryCode: string): string => {
  return COUNTRY_NAMES[countryCode] || countryCode;
};

// Search banks across all countries
export const searchBanks = (query: string): Array<{ country: string; bank: string }> => {
  const results: Array<{ country: string; bank: string }> = [];
  const lowerQuery = query.toLowerCase();

  Object.entries(BANKS_BY_COUNTRY).forEach(([countryCode, banks]) => {
    banks.forEach(bank => {
      if (bank.toLowerCase().includes(lowerQuery)) {
        results.push({
          country: getCountryName(countryCode),
          bank,
        });
      }
    });
  });

  return results;
};