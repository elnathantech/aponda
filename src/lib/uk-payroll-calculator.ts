// UK PAYE Payroll Calculator 2024/25 Tax Year
// All thresholds and rates based on HMRC guidance

export interface PayrollCalculation {
  grossPay: number;
  taxablePay: number;
  incomeTax: number;
  niEmployee: number;
  niEmployer: number;
  pensionEmployee: number;
  pensionEmployer: number;
  studentLoan: number;
  netPay: number;
}

export interface TaxBand {
  name: string;
  min: number;
  max: number;
  rate: number;
}

// 2024/25 Tax Year Constants
export const TAX_YEAR = '2024/25';

// Personal Allowance
export const PERSONAL_ALLOWANCE = 12570;
export const PERSONAL_ALLOWANCE_TAPER_THRESHOLD = 100000;

// Income Tax Bands (England/Wales/NI)
export const TAX_BANDS: TaxBand[] = [
  { name: 'Personal Allowance', min: 0, max: PERSONAL_ALLOWANCE, rate: 0 },
  { name: 'Basic Rate', min: PERSONAL_ALLOWANCE, max: 50270, rate: 0.20 },
  { name: 'Higher Rate', min: 50270, max: 125140, rate: 0.40 },
  { name: 'Additional Rate', min: 125140, max: Infinity, rate: 0.45 },
];

// National Insurance 2024/25 (from 6 April 2024)
export const NI_THRESHOLDS = {
  lowerEarningsLimit: 6396, // Annual LEL
  primaryThreshold: 12570, // Annual PT (aligned with PA from Jan 2024)
  upperEarningsLimit: 50270, // Annual UEL
  secondaryThreshold: 9100, // Employer threshold
};

export const NI_RATES = {
  employeeMain: 0.08, // 8% between PT and UEL (reduced from 12% in Jan 2024)
  employeeUpper: 0.02, // 2% above UEL
  employer: 0.138, // 13.8% above ST
};

// Student Loan Thresholds 2024/25 (Annual)
export const STUDENT_LOAN_THRESHOLDS = {
  plan1: 24990,
  plan2: 27295,
  plan4: 31395, // Scotland
  plan5: 25000, // New plan from 2023
  postgrad: 21000,
};

export const STUDENT_LOAN_RATES = {
  plan1: 0.09,
  plan2: 0.09,
  plan4: 0.09,
  plan5: 0.09,
  postgrad: 0.06,
};

// Auto-Enrolment Pension Thresholds
export const PENSION_THRESHOLDS = {
  lowerQualifyingEarnings: 6240,
  upperQualifyingEarnings: 50270,
  triggerThreshold: 10000, // For auto-enrolment
};

// Parse tax code to get allowance
export function parseTaxCode(taxCode: string): { allowance: number; isScottish: boolean; isWelsh: boolean } {
  const code = taxCode.toUpperCase().trim();
  let isScottish = code.startsWith('S');
  let isWelsh = code.startsWith('C');
  
  const cleanCode = code.replace(/^[SC]/, '');
  
  // Special codes
  if (cleanCode === 'BR') {
    return { allowance: 0, isScottish, isWelsh }; // All at basic rate
  }
  if (cleanCode === 'D0') {
    return { allowance: 0, isScottish, isWelsh }; // All at higher rate
  }
  if (cleanCode === 'D1') {
    return { allowance: 0, isScottish, isWelsh }; // All at additional rate
  }
  if (cleanCode === 'NT') {
    return { allowance: Infinity, isScottish, isWelsh }; // No tax
  }
  
  // Extract number from code (e.g., 1257L -> 1257)
  const match = cleanCode.match(/(\d+)/);
  if (match) {
    return { allowance: parseInt(match[1]) * 10, isScottish, isWelsh };
  }
  
  return { allowance: PERSONAL_ALLOWANCE, isScottish, isWelsh };
}

// Calculate annual income tax
export function calculateIncomeTax(annualGross: number, taxCode: string): number {
  const { allowance } = parseTaxCode(taxCode);
  
  // Taper personal allowance for high earners
  let adjustedAllowance = allowance;
  if (annualGross > PERSONAL_ALLOWANCE_TAPER_THRESHOLD) {
    const reduction = Math.floor((annualGross - PERSONAL_ALLOWANCE_TAPER_THRESHOLD) / 2);
    adjustedAllowance = Math.max(0, allowance - reduction);
  }
  
  const taxable = Math.max(0, annualGross - adjustedAllowance);
  let tax = 0;
  let remainingIncome = taxable;
  
  // Apply tax bands (skip personal allowance band as we've already deducted it)
  const applicableBands = TAX_BANDS.slice(1);
  
  for (const band of applicableBands) {
    const bandStart = band.min - adjustedAllowance;
    const bandEnd = band.max === Infinity ? Infinity : band.max - adjustedAllowance;
    
    if (remainingIncome <= 0) break;
    
    const taxableInBand = Math.min(remainingIncome, Math.max(0, bandEnd - Math.max(0, bandStart)));
    tax += taxableInBand * band.rate;
    remainingIncome -= taxableInBand;
  }
  
  return Math.max(0, tax);
}

// Calculate employee National Insurance
export function calculateNIEmployee(annualGross: number): number {
  if (annualGross <= NI_THRESHOLDS.primaryThreshold) {
    return 0;
  }
  
  let ni = 0;
  
  // Main rate between PT and UEL
  const mainBandEarnings = Math.min(annualGross, NI_THRESHOLDS.upperEarningsLimit) - NI_THRESHOLDS.primaryThreshold;
  if (mainBandEarnings > 0) {
    ni += mainBandEarnings * NI_RATES.employeeMain;
  }
  
  // Upper rate above UEL
  if (annualGross > NI_THRESHOLDS.upperEarningsLimit) {
    ni += (annualGross - NI_THRESHOLDS.upperEarningsLimit) * NI_RATES.employeeUpper;
  }
  
  return Math.max(0, ni);
}

// Calculate employer National Insurance
export function calculateNIEmployer(annualGross: number): number {
  if (annualGross <= NI_THRESHOLDS.secondaryThreshold) {
    return 0;
  }
  
  return (annualGross - NI_THRESHOLDS.secondaryThreshold) * NI_RATES.employer;
}

// Calculate student loan repayment
export function calculateStudentLoan(annualGross: number, plan: string | null): number {
  if (!plan) return 0;
  
  const planKey = plan.toLowerCase().replace(/\s/g, '') as keyof typeof STUDENT_LOAN_THRESHOLDS;
  const threshold = STUDENT_LOAN_THRESHOLDS[planKey];
  const rate = STUDENT_LOAN_RATES[planKey];
  
  if (!threshold || !rate) return 0;
  
  if (annualGross <= threshold) return 0;
  
  return (annualGross - threshold) * rate;
}

// Calculate qualifying earnings for pension
export function calculatePensionContributions(
  annualGross: number,
  employeeRate: number,
  employerRate: number
): { employee: number; employer: number } {
  const qualifyingEarnings = Math.min(
    Math.max(0, annualGross - PENSION_THRESHOLDS.lowerQualifyingEarnings),
    PENSION_THRESHOLDS.upperQualifyingEarnings - PENSION_THRESHOLDS.lowerQualifyingEarnings
  );
  
  return {
    employee: qualifyingEarnings * (employeeRate / 100),
    employer: qualifyingEarnings * (employerRate / 100),
  };
}

// Main payroll calculation function
export function calculatePayroll(
  annualSalary: number,
  payFrequency: 'weekly' | 'fortnightly' | 'monthly',
  taxCode: string = '1257L',
  studentLoanPlan: string | null = null,
  pensionEmployeeRate: number = 5,
  pensionEmployerRate: number = 3,
  isPensionEnrolled: boolean = true
): PayrollCalculation {
  // Periods per year
  const periods = payFrequency === 'weekly' ? 52 : payFrequency === 'fortnightly' ? 26 : 12;
  
  // Calculate period gross
  const periodGross = annualSalary / periods;
  
  // Calculate annual deductions
  const annualTax = calculateIncomeTax(annualSalary, taxCode);
  const annualNIEmployee = calculateNIEmployee(annualSalary);
  const annualNIEmployer = calculateNIEmployer(annualSalary);
  const annualStudentLoan = calculateStudentLoan(annualSalary, studentLoanPlan);
  
  const pension = isPensionEnrolled 
    ? calculatePensionContributions(annualSalary, pensionEmployeeRate, pensionEmployerRate)
    : { employee: 0, employer: 0 };
  
  // Convert to period amounts
  const periodTax = annualTax / periods;
  const periodNIEmployee = annualNIEmployee / periods;
  const periodNIEmployer = annualNIEmployer / periods;
  const periodStudentLoan = annualStudentLoan / periods;
  const periodPensionEmployee = pension.employee / periods;
  const periodPensionEmployer = pension.employer / periods;
  
  // Calculate net pay
  const totalDeductions = periodTax + periodNIEmployee + periodPensionEmployee + periodStudentLoan;
  const periodNet = periodGross - totalDeductions;
  
  // For pension relief at source, reduce taxable pay
  const taxablePay = periodGross - periodPensionEmployee;
  
  return {
    grossPay: Math.round(periodGross * 100) / 100,
    taxablePay: Math.round(taxablePay * 100) / 100,
    incomeTax: Math.round(periodTax * 100) / 100,
    niEmployee: Math.round(periodNIEmployee * 100) / 100,
    niEmployer: Math.round(periodNIEmployer * 100) / 100,
    pensionEmployee: Math.round(periodPensionEmployee * 100) / 100,
    pensionEmployer: Math.round(periodPensionEmployer * 100) / 100,
    studentLoan: Math.round(periodStudentLoan * 100) / 100,
    netPay: Math.round(periodNet * 100) / 100,
  };
}

// Get tax month from date
export function getTaxMonth(date: Date): number {
  const month = date.getMonth() + 1; // 1-12
  // Tax year starts April (month 4)
  return month >= 4 ? month - 3 : month + 9;
}

// Get tax year from date
export function getTaxYear(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  if (month >= 4) {
    return `${year}/${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}/${year.toString().slice(-2)}`;
  }
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
}

// Calculate cumulative YTD values
export function calculateYTD(
  currentPeriod: PayrollCalculation,
  previousYTD: { gross: number; tax: number; ni: number; pension: number }
): { gross: number; tax: number; ni: number; pension: number } {
  return {
    gross: previousYTD.gross + currentPeriod.grossPay,
    tax: previousYTD.tax + currentPeriod.incomeTax,
    ni: previousYTD.ni + currentPeriod.niEmployee,
    pension: previousYTD.pension + currentPeriod.pensionEmployee,
  };
}
