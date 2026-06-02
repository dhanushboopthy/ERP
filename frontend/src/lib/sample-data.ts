/**
 * ═══════════════════════════════════════════════════════════════════
 * GLOBAL SAMPLE DATA ENGINE - SUDHAN TEXTILE ERP
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Enterprise-grade sample data system for QA, UAT, Demo, and Testing
 * 
 * Features:
 * - Environment-controlled (ENABLE_SAMPLE_DATA)
 * - Role-based access (SuperAdmin/Admin only)
 * - Stock-impact aware
 * - Calculation-trigger ready
 * - Audit-logged with SAMPLE mode
 * 
 * Architecture:
 * - Config-driven, centralized
 * - Reusable across all modules
 * - Production-safe
 * 
 * ═══════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if sample data is enabled via environment
 */
export function isSampleDataEnabled(): boolean {
  // Check environment variable (if available)
  if (typeof process !== 'undefined' && process.env) {
    const enableSample = process.env.NEXT_PUBLIC_ENABLE_SAMPLE_DATA || 
                        process.env.ENABLE_SAMPLE_DATA;
    if (enableSample === 'false') return false;
  }
  
  // Always enabled in development
  if (process.env.NODE_ENV === 'development') return true;
  
  // Disabled by default in production
  return process.env.NODE_ENV !== 'production';
}

// ═══════════════════════════════════════════════════════════════════
// FORM TYPES
// ═══════════════════════════════════════════════════════════════════

export type FormType =
  // Masters
  | 'company'
  | 'party'
  | 'yarn-count'
  | 'loom-type'
  | 'beam'
  | 'vehicle'
  | 'financial-year'
  | 'document-series'
  // Sizing ERP Transactions
  | 'yarn-receipt'
  | 'baby-cone'
  | 'warping-job-card'
  | 'sizing-job-card'
  | 'sizing-set'
  | 'beam-management'
  | 'yarn-stock'
  | 'yarn-return'
  | 'yarn-delivery'
  | 'gst-invoice'
  // Settings
  | 'user'
  | 'approval-matrix'
  | 'security-policy'
  | 'system-settings';

/**
 * Get today's date in YYYY-MM-DD format
 */
const getToday = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get financial year start (April 1st of current year if before April, else next year)
 */
const getFYStart = (): string => {
  const now = new Date();
  const year = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
  return `${year}-04-01`;
};

/**
 * Get financial year end (March 31st)
 */
const getFYEnd = (): string => {
  const now = new Date();
  const year = now.getMonth() < 3 ? now.getFullYear() : now.getFullYear() + 1;
  return `${year}-03-31`;
};

/**
 * Get current financial year label
 */
const getFYLabel = (): string => {
  const now = new Date();
  const startYear = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
  const endYear = startYear + 1;
  return `FY ${startYear}-${endYear.toString().slice(2)}`;
};

/**
 * Sample data repository for all forms
 */
const sampleDataMap: Record<FormType, any> = {
  // =====================
  // COMPANY MASTER
  // =====================
  'company': {
    companyName: 'Sudhan Textile Mills Pvt Ltd',
    shortName: 'Sudhan Textiles',
    legalName: 'Sudhan Textile Mills Pvt Ltd',
    gstin: '33ABCDE1234F1Z5',
    pan: 'ABCDE1234F',
    state: 'Tamil Nadu',
    stateCode: '33',
    addressLine1: 'SF No 123, SIPCOT Industrial Estate',
    addressLine2: 'Perundurai Road',
    city: 'Erode',
    pincode: '638052',
    country: 'India',
    phone: '04242223344',
    email: 'accounts@sudhan.com',
    website: 'www.sudhantextiles.com',
    bankName: 'State Bank of India',
    bankBranch: 'Erode Main Branch',
    bankAccountNo: '12345678901234',
    bankIfsc: 'SBIN0001234',
    financialYearStart: getFYStart(),
    financialYearEnd: getFYEnd(),
  },

  // =====================
  // PARTY / VENDOR
  // =====================
  'party': {
    partyName: 'Lakshmi Weaving Mills',
    partyType: 'Vendor',
    contactPerson: 'Ramesh Kumar',
    mobile: '9876543210',
    phone: '04242334455',
    email: 'lakshmi@weaving.com',
    gstin: '33AAAPL1234C1Z2',
    pan: 'AAAPL1234C',
    addressLine1: 'Chennimalai Road',
    addressLine2: 'Near Bus Stand',
    city: 'Erode',
    state: 'Tamil Nadu',
    stateCode: '33',
    pincode: '638051',
    country: 'India',
    creditDays: 30,
    creditLimit: 500000,
    openingBalance: 0,
    status: 'Active',
  },

  // =====================
  // YARN COUNT
  // =====================
  'yarn-count': {
    countCode: '40s 2/100',
    countDescription: 'Combed Cotton Yarn - 40s Count, 2 Ply, 100% Cotton',
    ply: 2,
    isActive: true,
  },

  // =====================
  // LOOM TYPE
  // =====================
  'loom-type': {
    loomTypeName: 'Rapier Loom',
    loomTypeCode: 'RAP-001',
    manufacturer: 'Tsudakoma',
    model: 'ZAX-N',
    maxRPM: 450,
    maxWidth: 190,
    shedType: 'Cam',
    numberOfBeams: 2,
    description: 'High-speed rapier loom for fine fabrics',
    status: 'Active',
  },

  // =====================
  // BEAM MASTER
  // =====================
  'beam': {
    beamNo: 'BM-001',
    beamType: 'Sizing',
    yarnCount: '40s 2/100',
    lengthMeters: 12000,
    widthInches: 72,
    diameter: 24,
    weight: 450,
    numberOfEnds: 3600,
    status: 'Available',
    location: 'Sizing Section A',
  },

  // =====================
  // VEHICLE MASTER
  // =====================
  'vehicle': {
    vehicleNo: 'TN38AB1234',
    vehicleType: 'Lorry',
    vehicleModel: 'Tata LPT 1613',
    capacity: 10,
    ownerName: 'Sudhan Textiles',
    driverName: 'Suresh Kumar',
    driverMobile: '9876501234',
    licenseNo: 'TN123456789',
    insuranceNo: 'INS-2024-001',
    insuranceExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    fitnessExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    status: 'Active',
  },

  // =====================
  // FINANCIAL YEAR
  // =====================
  'financial-year': {
    yearLabel: getFYLabel(),
    startDate: getFYStart(),
    endDate: getFYEnd(),
    isDefault: true,
    isClosed: false,
    closedDate: null,
    remarks: 'Current financial year',
  },

  // =====================
  // DOCUMENT SERIES
  // =====================
  'document-series': {
    module: 'Invoice',
    seriesName: 'Invoice Series 2025',
    prefix: 'INV-25',
    suffix: '',
    startNumber: 1,
    currentNumber: 1,
    padding: 4,
    separator: '-',
    isDefault: true,
    isActive: true,
    financialYear: getFYLabel(),
  },

  // ═══════════════════════════════════════════════════════════════════
  // 1️⃣ YARN RECEIPT - Complete Inward Transaction
  // ═══════════════════════════════════════════════════════════════════
  // NOTE: Yarn receipt sample data is generated dynamically from backend
  // via POST /api/yarnreceipts/sample to ensure valid foreign keys
  'yarn-receipt': async () => {
    // This will be handled by the component calling the API directly
    // Returning placeholder for type safety
    return {
      receiptDate: getToday(),
      partyId: '',
      vehicleId: '',
      vehicleNo: '',
      driverName: '',
      driverPhone: '',
      pdcNo: '',
      pdcDate: '',
      millName: '',
      remarks: 'Loading sample data from server...',
      details: [],
    };
  },

  // ═══════════════════════════════════════════════════════════════════
  // 2️⃣ BABY CONE / WINDING - Production Entry
  // ═══════════════════════════════════════════════════════════════════
  'baby-cone': {
    babyConeDate: getToday(),
    jobCardNo: 'AUTO',
    yarnCount: '40s 2/100',
    lotNo: `LOT-${new Date().getFullYear()}-001`,
    bagNo: 1,
    totalCones: 24,
    grossWeight: 52.500,
    tareWeight: 2.500,
    windingLoss: 1.200,
    leftoverWeight: 0.500,
    remarks: 'Sample baby cone - QA/Demo/UAT - 96% yield (50kg net - 1.2kg loss - 0.5kg leftover = 48.3kg)',
    // Net Weight: 50kg, Actual Yield: 48.3kg = 96.6% yield
  },

  // ═══════════════════════════════════════════════════════════════════
  // 3️⃣ WARPING JOB CARD - Complete Warping Operation
  // ═══════════════════════════════════════════════════════════════════
  'warping-job-card': {
    // Header fields
    partyId: '2', // Rajesh Textiles
    yarnCountId: '1', // 40s 2/100
    lotNo: `LOT-${new Date().getFullYear()}-001`,
    totalEnds: 560,
    totalMeters: 12500,
    setNo: `SET-${new Date().getFullYear()}-001`,
    // Warping specific fields
    rpmSpeed: 450,
    startTime: '06:00',
    endTime: '14:30',
    breakCount: 3,
    machineNo: 'WRP-01',
    operatorName: 'Murugan',
    remnantCones: 2,
    wasteWeight: 1.5,
    isKarlMayer: false,
    remarks: 'Sample warping - QA/Demo/UAT - 560 ends × 12,500m = 8 beams (70 ends/beam)',
    // Beam details - 8 beams with 70 ends each
    beamDetails: [
      { beamId: 1, ends: 70, meters: 12500 },
    ],
    // Yarn consumption - sample baby cone
    yarnConsumption: [
      { babyConeId: 1, conesUsed: 22, weightUsed: 45.8 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 4️⃣ SIZING JOB CARD - Chemical Processing
  // ═══════════════════════════════════════════════════════════════════
  'sizing-job-card': {
    sizingDate: getToday(),
    setNo: `SET-${new Date().getFullYear()}-001`,
    loomTypeId: '1',
    partyId: '2',
    yarnCountId: '1',
    totalEnds: 560,
    warpingMeters: 12500,
    sizingMeters: 12350,
    chemicalType: 'PVA',
    chemicalPercentage: 8.00,
    temperature: 85,
    speedMpm: 50,
    startTime: '08:00',
    endTime: '16:00',
    machineNo: 'SIZ-01',
    operatorName: 'Sakthivel',
    pickUpPercentage: 98.77,
    elongationPercent: 1,
    moisturePercentage: 8.5,
    pressureBar: 2.5,
    steamPressure: 5.0,
    remarks: 'Sample sizing - QA/Demo/UAT - PVA 8% at 85°C, 50 m/min speed',
    // Beam details
    beamDetails: [
      { beamId: 1, ends: 70, meters: 12350, grossWeight: 185 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 5️⃣ BEAM MANAGEMENT - Beam Tracking
  // ═══════════════════════════════════════════════════════════════════
  'beam-management': {
    beamNo: 'BM-001',
    beamType: 'Sizing',
    yarnCount: '40s 2/100',
    yarnCountId: null,
    lengthMeters: 12050,
    widthInches: 72,
    diameter: 24,
    weight: 450,
    numberOfEnds: 140,
    status: 'Available',
    location: 'Sizing Section A',
    partyName: 'Rajesh Textiles',
    setNo: `SET-${new Date().getFullYear()}-001`,
    remarks: 'Sample beam - Ready for delivery',
  },

  // ═══════════════════════════════════════════════════════════════════
  // SIZING SET - Set Management
  // ═══════════════════════════════════════════════════════════════════
  'sizing-set': {
    setNo: `SET-${new Date().getFullYear()}-001`,
    yarnCount: '40s 2/100',
    yarnCountId: null,
    partyName: 'Rajesh Textiles',
    partyId: null,
    totalBeams: 12,
    totalEnds: 1680,
    lengthMeters: 12500,
    status: 'In Progress',
    startDate: getToday(),
    remarks: 'Sample sizing set - 12 beams × 140 ends each',
  },

  // ═══════════════════════════════════════════════════════════════════
  // YARN STOCK - Stock Ledger Entry
  // ═══════════════════════════════════════════════════════════════════
  'yarn-stock': {
    yarnCount: '40s 2/100',
    yarnCountId: null,
    lotNo: `LOT-${new Date().getFullYear()}-001`,
    openingStock: 1000,
    receipt: 500,
    issue: 480,
    return: 5,
    closingStock: 1025,
    rate: 345,
    value: 353625,
    location: 'Raw Material Warehouse',
    remarks: 'Sample stock ledger - Opening: 1000kg, Receipt: +500kg, Issue: -480kg, Return: +5kg',
  },

  // ═══════════════════════════════════════════════════════════════════
  // 6️⃣ YARN RETURN - Return to Vendor
  // ═══════════════════════════════════════════════════════════════════
  'yarn-return': {
    returnDate: getToday(),
    returnNo: 'AUTO',
    dcNo: `RDC-${new Date().getFullYear()}-001`,
    party: 'Krishna Yarn Mills',
    partyId: null,
    yarnCount: '40s 2/100',
    yarnCountId: null,
    lotNo: `LOT-${new Date().getFullYear()}-001`,
    reason: 'Excess Material',
    bags: 1,
    returnedWeight: 5.000,
    rate: 320,
    amount: 1600,
    vehicleNo: 'TN-33-AB-1234',
    driverName: 'Suresh Kumar',
    driverMobile: '9876501234',
    remarks: 'Sample return - Excess from lot',
    status: 'Returned',
    // Stock Impact: +5 kg (returned to vendor)
  },

  // ═══════════════════════════════════════════════════════════════════
  // 7️⃣ YARN DELIVERY - Delivery to Customer
  // ═══════════════════════════════════════════════════════════════════
  'yarn-delivery': {
    deliveryDate: getToday(),
    deliveryNo: 'AUTO',
    dcNo: `DC-${new Date().getFullYear()}-001`,
    party: 'Lakshmi Weaving Mills',
    partyId: null,
    beamNo: 'BM-001',
    setNo: `SET-${new Date().getFullYear()}-001`,
    vehicleNo: 'TN-33-AB-1234',
    driverName: 'Suresh Kumar',
    driverMobile: '9876501234',
    numberOfBeams: 4,
    totalMeters: 12050,
    totalWeight: 480.000,
    remarks: 'Sample delivery - Complete set',
    status: 'Delivered',
    // Stock Impact: -480 kg (delivered to customer)
  },

  // ═══════════════════════════════════════════════════════════════════
  // 8️⃣ GST TAX INVOICE - Billing
  // ═══════════════════════════════════════════════════════════════════
  'gst-invoice': {
    invoiceNo: 'AUTO',
    invoiceDate: getToday(),
    party: 'Lakshmi Weaving Mills',
    partyId: null,
    partyGstin: '33AAACL1234M1Z5',
    billTo: 'Lakshmi Weaving Mills\nChennimalai Road\nErode - 638051\nTamil Nadu',
    shipTo: 'Same as billing address',
    placeOfSupply: 'Tamil Nadu',
    paymentTerms: 'Net 30 Days',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    taxableAmount: 120000,
    cgst: 2.5,
    cgstAmount: 3000,
    sgst: 2.5,
    sgstAmount: 3000,
    igst: 0,
    igstAmount: 0,
    totalAmount: 126000,
    roundOff: 0,
    grandTotal: 126000,
    transportMode: 'Road',
    vehicleNo: 'TN-33-AB-1234',
    remarks: 'Sample invoice - Sizing services',
    status: 'Generated',
  },

  // =====================
  // USER MANAGEMENT
  // =====================
  'user': {
    username: 'operator1',
    fullName: 'Machine Operator 1',
    email: 'operator1@sudhan.com',
    mobile: '9876543211',
    role: 'Operator',
    department: 'Production',
    designation: 'Machine Operator',
    dateOfJoining: getToday(),
    status: 'Active',
    password: 'Operator@123', // Only for sample, will be hashed
    confirmPassword: 'Operator@123',
  },

  // =====================
  // APPROVAL MATRIX
  // =====================
  'approval-matrix': {
    module: 'Invoice',
    moduleName: 'GST Invoice',
    minAmount: 0,
    maxAmount: 100000,
    level1Role: 'Manager',
    level1Required: true,
    level2Role: 'Admin',
    level2Required: true,
    level3Role: 'SuperAdmin',
    level3Required: false,
    autoApproveBelow: 10000,
    notifyOnSubmit: true,
    notifyOnApproval: true,
    isActive: true,
  },

  // =====================
  // SECURITY POLICIES
  // =====================
  'security-policy': {
    policyName: 'Default Security Policy',
    minPasswordLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true,
    passwordExpiryDays: 90,
    passwordHistoryCount: 5,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    sessionTimeoutMinutes: 60,
    enableTwoFactor: false,
    enableIpWhitelist: false,
    allowedIPs: '',
    isActive: true,
  },

  // =====================
  // SYSTEM SETTINGS
  // =====================
  'system-settings': {
    allowNegativeStock: false,
    autoApprovalEnabled: false,
    auditLogsEnabled: true,
    notificationsEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    backupEnabled: true,
    backupSchedule: 'Daily',
    backupTime: '23:00',
    backupRetentionDays: 30,
    maxFileUploadMB: 10,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    currency: 'INR',
    currencySymbol: '₹',
    decimalPlaces: 2,
    taxEnabled: true,
    defaultCGST: 2.5,
    defaultSGST: 2.5,
    defaultIGST: 5.0,
  },
};

/**
 * Get sample data for a specific form type
 */
export function getSampleData(formType: FormType): any {
  const data = sampleDataMap[formType];
  if (!data) {
    console.warn(`No sample data defined for form type: ${formType}`);
    return {};
  }
  // Return a copy to avoid mutations
  return JSON.parse(JSON.stringify(data));
}

/**
 * Check if sample data fill is allowed for current user
 */
export function isSampleDataAllowed(userRole?: string): boolean {
  // First check if sample data is globally enabled
  if (!isSampleDataEnabled()) {
    return false;
  }
  
  // Allow for SuperAdmin in any environment
  if (userRole === 'SuperAdmin') {
    return true;
  }
  
  // Allow for Admin in non-production
  if (userRole === 'Admin' && process.env.NODE_ENV !== 'production') {
    return true;
  }
  
  // Allow in development for all users
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  return false;
}

/**
 * Log sample data usage for audit trail
 */
export function logSampleDataUsage(formType: FormType, userName?: string): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    module: formType,
    action: 'SAMPLE_DATA_FILL',
    mode: 'SAMPLE',
    user: userName || 'Unknown',
    environment: process.env.NODE_ENV || 'unknown',
    ipAddress: 'client', // Will be captured by backend
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Sample Data Usage:', logEntry);
  }
  
  // TODO: Send to backend audit service
  // await apiClient.post('/audit/sample-data', logEntry);
}

/**
 * Get all available form types
 */
export function getAvailableFormTypes(): FormType[] {
  return Object.keys(sampleDataMap) as FormType[];
}

/**
 * Check if a form type has sample data
 */
export function hasSampleData(formType: FormType): boolean {
  return formType in sampleDataMap;
}
