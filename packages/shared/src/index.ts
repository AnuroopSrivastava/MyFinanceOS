// Core Models for FinanceOS India

export type UserRole = 'Admin' | 'Member' | 'Viewer';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isNomineeProvided: boolean;
  relationship?: string; // 'Self', 'Spouse', 'Child', 'Parent', etc.
  pin?: string; // Optional passcode/PIN for the profile (4-6 digits)
}

export interface EncryptionKeys {
  salt: string;
  verifier: string; // Hashed password to verify PIN
}

// Personal Finance Models
export type AccountType = 'Savings' | 'Current' | 'CreditCard' | 'Cash' | 'Loan' | 'Wallet';

export interface BankAccount {
  id: string;
  profileId: string; // Links to UserProfile
  name: string;
  bankName: string;
  accountNumber: string; // Encrypted
  ifscCode: string;
  accountType: AccountType;
  balance: number; // Current balance
  limitAmount?: number; // Credit card limit or Loan principal
  interestRate?: number; // FD/Savings interest rate
  nomineeName?: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  profileId: string;
  date: string; // YYYY-MM-DD
  description: string; // Encrypted
  amount: number;
  type: 'Income' | 'Expense' | 'Transfer';
  category: string;
  gstRate?: number; // Optional GST parsed
  gstAmount?: number;
  tag?: string;
  refAccountId?: string; // For transfers
  isDuplicate?: boolean;
}

export interface Budget {
  id: string;
  profileId: string;
  category: string;
  limitAmount: number;
  spentAmount: number;
  period: 'Monthly' | 'Yearly';
}

// Investment Models
export interface FixedDeposit {
  id: string;
  profileId: string;
  bankName: string;
  principalAmount: number;
  interestRate: number; // percentage
  startDate: string; // YYYY-MM-DD
  maturityDate: string; // YYYY-MM-DD
  maturityAmount: number;
  nomineeName?: string;
  isMatured: boolean;
}

export interface StockHolding {
  id: string;
  profileId: string;
  symbol: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  nomineeName?: string;
}

export interface MutualFundHolding {
  id: string;
  profileId: string;
  schemeCode: string; // AMFI code
  schemeName: string;
  units: number;
  averageNav: number;
  currentNav: number;
  nomineeName?: string;
}

export interface GoldHolding {
  id: string;
  profileId: string;
  type: 'Physical' | 'SGB' | 'Digital';
  quantityGrams: number;
  purchasePrice: number;
  currentPrice: number;
  nomineeName?: string;
}

export interface NPSHolding {
  id: string;
  profileId: string;
  pranNumber: string; // Permanent Retirement Account Number
  balance: number;
  allocationTier1: { E: number; C: number; G: number; A: number }; // Percentages
  nomineeName?: string;
}

export interface ProvidentFundHolding {
  id: string;
  profileId: string;
  type: 'EPF' | 'PPF';
  accountNumber: string;
  balance: number;
  yearlyContribution: number;
  nomineeName?: string;
}

// Tax Models
export interface TaxDeductions {
  section80C: number; // Max 1.5 Lakhs (PPF, ELSS, EPF, LIC)
  section80D: number; // Medical insurance (Self/Family/Parents)
  section80CCD1B: number; // NPS additional (Max 50k)
  section24B: number; // Home Loan Interest (Max 2L)
  hraExemption: number;
  standardDeduction: number; // 50,000 / 75,000
  otherDeductions: number;
}

export interface TaxRegimeComparison {
  income: number;
  deductions: TaxDeductions;
  oldTax: number;
  newTax: number;
  optimalRegime: 'Old' | 'New';
  breakdownOld: TaxSlabBreakdown[];
  breakdownNew: TaxSlabBreakdown[];
}

export interface TaxSlabBreakdown {
  slab: string;
  rate: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface TDSSummary {
  id: string;
  tanOfDeductor: string;
  deductorName: string;
  amountPaid: number;
  taxDeducted: number;
  financialYear: string;
}

// Business Bookkeeping Models
export interface VendorCustomer {
  id: string;
  name: string;
  gstin?: string;
  phone?: string;
  email?: string;
  address?: string;
  type: 'Customer' | 'Vendor';
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  salesPrice: number;
  gstRate: number; // E.g. 5, 12, 18, 28
  reorderLevel: number;
}

export interface BusinessInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  customerGSTIN?: string;
  items: InvoiceItem[];
  subtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  notes?: string;
}

export interface InvoiceItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  gstRate: number; // Percentage
  amount: number;
}

export interface BusinessRegisterEntry {
  id: string;
  date: string;
  type: 'Sales' | 'Purchase';
  refNumber: string; // Invoice / Bill number
  partyName: string;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  gstRate: number;
}

// General audit logs & settings
export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  details: string;
  ipAddress?: string;
}

export interface SystemSettings {
  theme: 'dark' | 'light' | 'glass-cyan' | 'glass-emerald' | 'glass-gold';
  currency: 'INR';
  backupSchedule: 'none' | 'daily' | 'weekly' | 'monthly';
  lastBackupDate?: string;
  isCloudBackupEnabled: boolean;
  businessName?: string;
  businessGSTIN?: string;
}

export interface AIInsight {
  id: string;
  type: 'alert' | 'warning' | 'tip' | 'info';
  title: string;
  message: string;
  actionableLink?: string;
}

export interface RecurringTransaction {
  id: string;
  profileId: string;
  description: string;
  amount: number;
  type: 'Income' | 'Expense' | 'Transfer';
  category: string;
  accountId: string;
  refAccountId?: string;
  frequency: 'Monthly' | 'Quarterly' | 'Weekly';
  nextDueDate: string; // YYYY-MM-DD
  isActive: boolean;
  startDate?: string; // YYYY-MM-DD
  stepUpPct?: number; // e.g. 10 for 10% annual increase
  targetAssetId?: string; // MutualFundHolding or StockHolding ID
}

// Investment Planner Models
export type InvestmentMethod = 'SIP' | 'Lumpsum';

export interface SubInvestment {
  id: string;
  name: string;
  percentage: number;
  method: InvestmentMethod;
  stepUpPercentage?: number;
}

export interface PortfolioCategory {
  id: string;
  name: string;
  percentage: number;
  subInvestments: SubInvestment[];
}

export interface InvestmentPlan {
  id: string;
  profileId: string;
  salary: number;
  investmentPercentage: number;
  portfolio: PortfolioCategory[];
}

export * from './crypto.js';
