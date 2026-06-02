// ============================================
// COMMON TYPES
// ============================================
export interface AuditFields {
  createdBy: string;
  createdAt: string;
  modifiedBy?: string;
  modifiedAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDesc?: boolean;
}

// ============================================
// AUTH TYPES
// ============================================
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiry: string;
  user: User;
}

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  roleName: string;
  permissions: string[];
}

// Enums
export enum PartyType {
  Customer = 'Customer',
  Vendor = 'Vendor',
  Jobwork = 'Jobwork',
}

export enum BeamStatus {
  Available = 'Available',
  InUse = 'InUse',
  SizingComplete = 'SizingComplete',
}

export enum TransactionType {
  In = 'IN',
  Out = 'OUT',
  Return = 'RETURN',
  Delivery = 'DELIVERY',
  Adjustment = 'ADJUSTMENT',
}

export enum ApprovalStatus {
  Draft = 'Draft',
  Prepared = 'Prepared',
  Checked = 'Checked',
  GMApproved = 'GMApproved',
  Authorized = 'Authorized',
  Rejected = 'Rejected',
}

export enum BeamType {
  WarpersBeam = 'Warping Beam',
  SizersBeam = 'Sizing Beam',
  LoomBeam = "Weaver's Beam",
}

export enum DocumentType {
  YarnReceipt = 'YarnReceipt',
  WarpingJobCard = 'WarpingJobCard',
  SizingJobCard = 'SizingJobCard',
  YarnReturnDC = 'YarnReturnDC',
  YarnDeliveryDC = 'YarnDeliveryDC',
  TaxInvoice = 'TaxInvoice',
}

// Master Entities
export interface Company extends AuditFields {
  id: number;
  companyName: string;
  shortName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  gstin: string;
  pan: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  isActive: boolean;
}

export interface Party extends AuditFields {
  id: number;
  partyCode: string;
  partyName: string;
  partyType: PartyType | string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  phone?: string;
  mobile?: string;
  email?: string;
  contactPerson?: string;
  gstin?: string;
  pan?: string;
  creditDays: number;
  creditLimit: number;
  isBillToBill: boolean;
  openingBalance?: number;
  openingBalanceType?: string;
  isActive: boolean;
}

export interface YarnCount extends AuditFields {
  id: number;
  countCode: string;
  countDescription?: string;
  ply: number;
  isActive: boolean;
}

export interface LoomType extends AuditFields {
  id: number;
  loomTypeCode: string;
  loomTypeName: string;
  widthInches?: number;
  isActive: boolean;
}

export interface Beam extends AuditFields {
  id: number;
  beamNo: string;
  beamType: BeamType | string;
  tareWeight: number;
  widthInches?: number;
  maxEnds?: number;
  status: BeamStatus | string;
  currentJobCardId?: number;
  currentJobCardType?: string;
  isActive: boolean;
}

export interface Vehicle extends AuditFields {
  id: number;
  vehicleNo: string;
  vehicleType?: string;
  driverName?: string;
  driverPhone?: string;
  ownerName?: string;
  isActive: boolean;
}

export interface FinancialYear extends AuditFields {
  id: number;
  yearCode: string;
  yearName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isClosed: boolean;
  closedAt?: string;
  closedByName?: string;
  documentCount?: number;
  isActive: boolean;
}

export interface DocumentNumberSeries {
  id: number;
  documentType: string;
  displayName?: string;
  financialYearId: number;
  financialYearName?: string;
  prefix: string;
  suffix?: string;
  currentNumber: number;
  padLength: number;
  resetOnFYChange: boolean;
  allowManualOverride: boolean;
  lockAfterPrint: boolean;
  lockAfterApproval: boolean;
  sampleNumber?: string;
}

// Sizing ERP Entities
export interface YarnReceipt extends AuditFields {
  id: number;
  receiptNumber: string;
  receiptDate: string;
  partyId: number;
  partyCode: string;
  partyName: string;
  vehicleId?: number;
  vehicleNo?: string;
  driverName?: string;
  remarks?: string;
  status: string;
  approvedBy?: string;
  approvedDate?: string;
  isLocked: boolean;
  totalNetWeight: number;
  totalBags: number;
  details: YarnReceiptDetail[];
}

export interface YarnReceiptDetail {
  id: number;
  yarnCountId: number;
  countCode: string;
  lotNo?: string;
  bagNo?: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  coneCount?: number;
  ratePerKg: number;
}

export interface BabyCone extends AuditFields {
  id: number;
  babyConeNo: string;
  babyConeDate: string;
  financialYearId: number;
  yarnReceiptId: number;
  yarnReceipt?: YarnReceipt;
  yarnCountId: number;
  yarnCount?: YarnCount;
  lotNo: string;
  bagNo: number;
  totalCones: number;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  windingLoss: number;
  leftoverWeight: number;
  isUsedInWarping: boolean;
  isActive: boolean;
}

export interface WarpingJobCard extends AuditFields {
  id: number;
  jobCardNumber: string;
  setNo: string;
  jobCardDate: string;
  partyId: number;
  partyCode: string;
  partyName: string;
  yarnCountId: number;
  countCode: string;
  lotNo?: string;
  totalEnds: number;
  endsPerBeam: number;
  setLength: number;
  actualLength?: number;
  numberOfBeams: number;
  warpingMachineNo?: string;
  status: string;
  warpingDate?: string;
  remarks?: string;
  beams: WarpingJobCardBeamDetail[];
}

export interface WarpingJobCardBeamDetail {
  id: number;
  beamId: number;
  beamNo: string;
  beamSequence: number;
  warpingDate?: string;
  endsOnBeam?: number;
  beamWeight?: number;
}


export interface SizingJobCard extends AuditFields {
  id: number;
  jobCardNumber: string;
  jobCardDate: string;
  partyId: number;
  partyCode: string;
  partyName: string;
  yarnCountId: number;
  countCode: string;
  lotNo?: string;
  setNo: string;
  loomTypeId?: number;
  loomTypeName?: string;
  totalEnds: number;
  setLength: number;
  actualLength?: number;
  beamWidth?: number;
  sizingMachineNo?: string;
  sizeRecipe?: string;
  outputSizingBeamId?: number;
  outputBeamNo?: string;
  outputWeight?: number;
  sizingDate?: string;
  status: string;
  invoiceId?: number;
  invoiceNumber?: string;
  preparedBy?: string;
  preparedDate?: string;
  checkedBy?: string;
  checkedDate?: string;
  approvedBy?: string;
  approvedDate?: string;
  authorizedBy?: string;
  authorizedDate?: string;
  remarks?: string;
  sourceBeams: SizingJobCardBeamDetail[];
}

export interface SizingJobCardBeamDetail {
  id: number;
  beamId: number;
  beamNo: string;
  beamSequence: number;
  endsOnBeam?: number;
}


export interface YarnStockLedger extends AuditFields {
  id: number;
  ledgerDate: string;
  financialYearId: number;
  yarnCountId: number;
  yarnCount?: YarnCount;
  lotNo: string;
  transactionType: TransactionType;
  referenceType: string;
  referenceId: number;
  referenceNo: string;
  inQty: number;
  outQty: number;
  balanceQty: number;
  inWeight: number;
  outWeight: number;
  balanceWeight: number;
  remarks?: string;
}

export interface YarnReturn extends AuditFields {
  id: number;
  dcNo: string;
  dcDate: string;
  financialYearId: number;
  partyId: number;
  party?: Party;
  returnType: 'Mill' | 'Jobwork';
  sizingJobCardId?: number;
  sizingJobCard?: SizingJobCard;
  vehicleId?: number;
  vehicle?: Vehicle;
  totalWeight: number;
  remarks?: string;
  isNotForSale: boolean;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  details: YarnReturnDetail[];
}

export interface YarnReturnDetail {
  id: number;
  yarnReturnId: number;
  yarnCountId: number;
  yarnCount?: YarnCount;
  lotNo: string;
  bags: number;
  cones: number;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
}

export interface YarnDelivery extends AuditFields {
  id: number;
  dcNo: string;
  dcDate: string;
  financialYearId: number;
  partyId: number;
  party?: Party;
  vehicleId?: number;
  vehicle?: Vehicle;
  driverName?: string;
  totalWeight: number;
  totalAmount: number;
  remarks?: string;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  details: YarnDeliveryDetail[];
}

export interface YarnDeliveryDetail {
  id: number;
  yarnDeliveryId: number;
  yarnCountId: number;
  yarnCount?: YarnCount;
  lotNo: string;
  bags: number;
  cones: number;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  ratePerKg: number;
  amount: number;
}

export interface SizingCharge extends AuditFields {
  id: number;
  partyId: number;
  party?: Party;
  chargeType: 'PerMeter' | 'PerBeam' | 'PerKg';
  yarnCountId?: number;
  yarnCount?: YarnCount;
  rateAmount: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
}

export interface GstInvoice extends AuditFields {
  id: number;
  invoiceNo: string;
  invoiceDate: string;
  financialYearId: number;
  partyId: number;
  party?: Party;
  placeOfSupply: string;
  stateCode: string;
  isInterState: boolean;
  hsnSac: string;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTaxAmount: number;
  roundOff: number;
  totalAmount: number;
  amountInWords: string;
  dueDate: string;
  isPaid: boolean;
  paidDate?: string;
  isPrinted: boolean;
  printedAt?: string;
  isLocked: boolean;
  remarks?: string;
  isActive: boolean;
  details: GstInvoiceDetail[];
}

export interface GstInvoiceDetail {
  id: number;
  gstInvoiceId: number;
  sizingJobCardId?: number;
  sizingJobCard?: SizingJobCard;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

// Form Types
export interface YarnReceiptFormData {
  receiptDate: string;
  partyId: number;
  vehicleId?: number;
  vehicleNo?: string;
  driverName?: string;
  remarks?: string;
  details: YarnReceiptDetailFormData[];
}

export interface YarnReceiptDetailFormData {
  yarnCountId: number;
  lotNo?: string;
  bagNo?: string;
  grossWeight: number;
  tareWeight: number;
  coneCount?: number;
  ratePerKg: number;
}

// Warping Job Card Create Request - matches backend CreateWarpingJobCardRequest
export interface WarpingJobCardFormData {
  setNo: string;
  jobCardDate: string;
  partyId: number;
  yarnCountId: number;
  lotNo?: string;
  totalEnds: number;
  endsPerBeam: number;
  setLength: number;
  numberOfBeams: number;
  warpingMachineNo?: string;
  remarks?: string;
  beamIds: number[];
}


// Report Types
export interface YarnStockReport {
  yarnCountId: number;
  yarnCountCode: string;
  yarnCountDescription: string;
  lotNo: string;
  openingQty: number;
  openingWeight: number;
  receiptQty: number;
  receiptWeight: number;
  issueQty: number;
  issueWeight: number;
  returnQty: number;
  returnWeight: number;
  closingQty: number;
  closingWeight: number;
}

export interface SetWiseProductionReport {
  setNo: string;
  setDate: string;
  partyName: string;
  yarnCountCode: string;
  loomType: string;
  totalEnds: number;
  warpingMeters: number;
  sizingMeters: number;
  pickupPercent: number;
  elongationPercent: number;
  beamCount: number;
  status: ApprovalStatus;
}

export interface BeamUtilizationReport {
  beamNo: string;
  beamType: string;
  currentStatus: BeamStatus;
  totalUsageCount: number;
  lastUsedDate: string;
  lastUsedInSet: string;
  averageDaysPerUse: number;
}

export interface PartyLedgerReport {
  partyId: number;
  partyCode: string;
  partyName: string;
  openingBalance: number;
  invoiceAmount: number;
  receivedAmount: number;
  closingBalance: number;
  overdueAmount: number;
}

export interface InvoiceRegisterReport {
  invoiceNo: string;
  invoiceDate: string;
  partyName: string;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  isPaid: boolean;
  dueDate: string;
  daysPending: number;
}

// Auth Types
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface AuditLog {
  id: number;
  tableName: string;
  recordId: number;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  changedBy: string;
  changedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalYarnStock: number;
  todayReceipts: number;
  activeSets: number;
  pendingInvoices: number;
  recentSizingSets: RecentSizingSet[];
  lowStockItems: LowStockItem[];
  beamSummary: BeamSummary;
}

export interface RecentSizingSet {
  setNo: string;
  date: string;
  party: string;
  count: string;
  meters: number;
  status: string;
}

export interface LowStockItem {
  count: string;
  lotNo: string;
  balance: number;
  minStock: number;
}

export interface BeamSummary {
  total: number;
  available: number;
  inUse: number;
  maintenance: number;
}

// Yarn Stock DTO - matches backend YarnStockDto
export interface YarnStockDto {
  partyCode: string;
  partyName: string;
  countCode: string;
  lotNo?: string;
  totalInward: number;
  totalOutward: number;
  balanceQtyKg: number;
}

// Baby Cone DTOs
export interface BabyConeDto {
  id: number;
  babyConeNo: string;
  babyConeDate: string;
  yarnReceiptId: number;
  yarnReceiptNo: string;
  partyId: number;
  partyName: string;
  yarnCountId: number;
  countCode: string;
  lotNo?: string;
  bagNo: number;
  totalCones: number;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  windingLoss: number;
  leftoverWeight: number;
  isUsedInWarping: boolean;
  remarks?: string;
}

export interface CreateBabyConeRequest {
  babyConeDate: string;
  yarnReceiptDetailId: number;
  lotNo?: string;
  bagNo: number;
  totalCones: number;
  grossWeight: number;
  tareWeight: number;
  windingLoss: number;
  leftoverWeight: number;
  remarks?: string;
}

// Yarn Return DTOs
export interface YarnReturnDto {
  id: number;
  dcNo: string;
  dcDate: string;
  partyId: number;
  partyCode: string;
  partyName: string;
  returnType: 'Mill' | 'Jobwork';
  sizingJobCardId?: number;
  sizingJobCardNo?: string;
  vehicleId?: number;
  vehicleNo?: string;
  driverName?: string;
  totalWeight: number;
  isNotForSale: boolean;
  status: 'Draft' | 'Approved' | 'Dispatched';
  approvedBy?: string;
  approvedDate?: string;
  remarks?: string;
  details: YarnReturnDetailDto[];
}

export interface YarnReturnDetailDto {
  id: number;
  yarnCountId: number;
  countCode: string;
  lotNo?: string;
  bags: number;
  cones: number;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
}

export interface CreateYarnReturnRequest {
  dcDate: string;
  partyId: number;
  returnType: 'Mill' | 'Jobwork';
  sizingJobCardId?: number;
  vehicleId?: number;
  driverName?: string;
  remarks?: string;
  details: CreateYarnReturnDetailRequest[];
}

export interface CreateYarnReturnDetailRequest {
  yarnCountId: number;
  lotNo?: string;
  bags: number;
  cones: number;
  grossWeight: number;
  tareWeight: number;
}

// Yarn Delivery DTOs
export interface YarnDeliveryDto {
  id: number;
  dcNo: string;
  dcDate: string;
  partyId: number;
  partyCode: string;
  partyName: string;
  vehicleId?: number;
  vehicleNo?: string;
  driverName?: string;
  driverPhone?: string;
  totalWeight: number;
  totalAmount: number;
  status: 'Draft' | 'Approved' | 'Dispatched';
  approvedBy?: string;
  approvedDate?: string;
  dispatchedBy?: string;
  dispatchedDate?: string;
  remarks?: string;
  details: YarnDeliveryDetailDto[];
}

export interface YarnDeliveryDetailDto {
  id: number;
  yarnCountId: number;
  countCode: string;
  lotNo?: string;
  bags: number;
  cones: number;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  ratePerKg: number;
  amount: number;
}

export interface CreateYarnDeliveryRequest {
  dcDate: string;
  partyId: number;
  vehicleId?: number;
  driverName?: string;
  driverPhone?: string;
  remarks?: string;
  details: CreateYarnDeliveryDetailRequest[];
}

export interface CreateYarnDeliveryDetailRequest {
  yarnCountId: number;
  lotNo?: string;
  bags: number;
  cones: number;
  grossWeight: number;
  tareWeight: number;
  ratePerKg: number;
}

// Report DTOs
export interface YarnStockRegisterDto {
  yarnCountId: number;
  countCode: string;
  countDescription: string;
  lotNo?: string;
  financialYear: string;
  totalInWeight: number;
  totalOutWeight: number;
  balanceWeight: number;
  totalInQty: number;
  totalOutQty: number;
  balanceQty: number;
}

export interface SizingJobCardReportDto {
  id: number;
  setNo: string;
  setDate: string;
  partyName: string;
  yarnCount: string;
  loomType: string;
  totalEnds: number;
  warpingMeters: number;
  sizingMeters: number;
  pickupPercent: number;
  elongationPercent: number;
  beamCount: number;
  approvalStatus: string;
}

export interface BeamUtilizationReportDto {
  beamId: number;
  beamNo: string;
  beamType: string;
  tareWeight: number;
  status: string;
  currentLocation?: string;
  totalSizingUsage: number;
  totalWarpingUsage: number;
  lastUsedDate?: string;
  lastUsedInSet?: string;
}

export interface InvoiceRegisterReportDto {
  id: number;
  invoiceNo: string;
  invoiceDate: string;
  partyName: string;
  partyGSTIN?: string;
  placeOfSupply: string;
  isInterState: boolean;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
  dueDate: string;
  isPaid: boolean;
  daysOverdue: number;
}

// Warping Job Card List DTO for display
export interface WarpingJobCardListDto {
  id: number;
  jobCardNo: string;
  jobCardDate: string;
  warpingDate: string;
  partyId: number;
  partyName: string;
  yarnCountId: number;
  countCode: string;
  yarnCount: string;
  loomType?: string;
  lotNo: string;
  totalEnds: number;
  totalMeters: number;
  beamCount: number;
  approvalStatus: ApprovalStatus;
  status?: ApprovalStatus;
  preparedBy?: string;
  preparedAt?: string;
  isKarlMayer: boolean;
}

// Yarn Receipt List DTO for display
export interface YarnReceiptListDto {
  id: number;
  receiptNo: string;
  receiptDate: string;
  partyId: number;
  partyName: string;
  pdcNo?: string;
  pdcDate?: string;
  millName?: string;
  vehicleNo?: string;
  lotNo?: string;
  yarnCount?: string;
  totalBags: number;
  totalCones: number;
  totalNetWeight: number;
  status: string;
  approvedBy?: string;
  approvedDate?: string;
  isUsedInJobCard: boolean;
  isLocked: boolean;
}

// Document Series type - matches backend DocumentNumberSettingDto
export interface DocumentSeries {
  id: number;
  documentType: string;
  displayName?: string;
  financialYearId: number;
  financialYearName?: string;
  prefix: string;
  suffix?: string;
  currentNumber: number;
  padLength: number;
  resetOnFYChange: boolean;
  allowManualOverride: boolean;
  lockAfterPrint: boolean;
  lockAfterApproval: boolean;
  sampleNumber?: string;
}