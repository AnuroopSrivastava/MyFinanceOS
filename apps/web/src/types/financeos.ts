export interface ChartData {
  name: string;
  value: number;
  color: string;
}

export interface RegisterEntry {
  id: string;
  date: string;
  type: 'Sales' | 'Purchase';
  refNumber: string;
  partyName: string;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
}

export interface AmortizationRow {
  month: number;
  openingBalance: number;
  emi: number;
  principal: number;
  interest: number;
  closingBalance: number;
}

export interface FixedDeposit {
  principalAmount: number;
  interestRate: number;
  startDate: string;
  maturityDate: string;
  maturityAmount: number;
  profileId: string;
}

export interface Account {
  id: string;
  accountType: string;
  balance: number;
  profileId: string;
}

// Add more types as needed
