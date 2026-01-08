import jsPDF from 'jspdf';
import { formatCurrency } from './uk-payroll-calculator';

interface PayslipData {
  companyName: string;
  companyAddress?: string;
  payeReference?: string;
  employeeName: string;
  employeeNumber: string;
  niNumber?: string;
  taxCode?: string;
  payDate: string;
  payPeriod: string;
  grossPay: number;
  taxablePay: number;
  incomeTax: number;
  niEmployee: number;
  pensionEmployee: number;
  studentLoan: number;
  otherDeductions: number;
  netPay: number;
  ytdGross: number;
  ytdTax: number;
  ytdNi: number;
  ytdPension: number;
}

interface P60Data {
  companyName: string;
  companyAddress?: string;
  payeReference?: string;
  employeeName: string;
  employeeNumber: string;
  niNumber?: string;
  taxCode?: string;
  taxYear: string;
  totalPay: number;
  totalTax: number;
  totalNi: number;
  totalPension: number;
  employeeAddress?: string;
  dateOfBirth?: string;
}

export function generatePayslipPDF(data: PayslipData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYSLIP', pageWidth / 2, 20, { align: 'center' });
  
  // Company info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(data.companyName, 14, 35);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  if (data.companyAddress) {
    doc.text(data.companyAddress, 14, 41);
  }
  if (data.payeReference) {
    doc.text(`PAYE Reference: ${data.payeReference}`, 14, 47);
  }
  
  // Employee info box
  doc.setDrawColor(200);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(14, 55, 85, 40, 2, 2, 'FD');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Details', 18, 63);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.employeeName}`, 18, 71);
  doc.text(`Employee No: ${data.employeeNumber}`, 18, 78);
  doc.text(`NI Number: ${data.niNumber || 'N/A'}`, 18, 85);
  doc.text(`Tax Code: ${data.taxCode || 'N/A'}`, 18, 92);
  
  // Pay period box
  doc.roundedRect(105, 55, 85, 40, 2, 2, 'FD');
  
  doc.setFont('helvetica', 'bold');
  doc.text('Pay Period', 109, 63);
  doc.setFont('helvetica', 'normal');
  doc.text(`Pay Date: ${data.payDate}`, 109, 71);
  doc.text(`Period: ${data.payPeriod}`, 109, 78);
  
  // Earnings section
  let yPos = 110;
  doc.setFont('helvetica', 'bold');
  doc.text('EARNINGS', 14, yPos);
  doc.text('This Period', 120, yPos);
  doc.text('YTD', 165, yPos);
  
  yPos += 8;
  doc.setDrawColor(100);
  doc.line(14, yPos, 196, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('Gross Pay', 14, yPos);
  doc.text(formatCurrency(data.grossPay), 120, yPos);
  doc.text(formatCurrency(data.ytdGross), 165, yPos);
  
  yPos += 8;
  doc.text('Taxable Pay', 14, yPos);
  doc.text(formatCurrency(data.taxablePay), 120, yPos);
  
  // Deductions section
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('DEDUCTIONS', 14, yPos);
  doc.text('This Period', 120, yPos);
  doc.text('YTD', 165, yPos);
  
  yPos += 8;
  doc.line(14, yPos, 196, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('Income Tax (PAYE)', 14, yPos);
  doc.text(formatCurrency(data.incomeTax), 120, yPos);
  doc.text(formatCurrency(data.ytdTax), 165, yPos);
  
  yPos += 8;
  doc.text('National Insurance', 14, yPos);
  doc.text(formatCurrency(data.niEmployee), 120, yPos);
  doc.text(formatCurrency(data.ytdNi), 165, yPos);
  
  yPos += 8;
  doc.text('Pension', 14, yPos);
  doc.text(formatCurrency(data.pensionEmployee), 120, yPos);
  doc.text(formatCurrency(data.ytdPension), 165, yPos);
  
  if (data.studentLoan > 0) {
    yPos += 8;
    doc.text('Student Loan', 14, yPos);
    doc.text(formatCurrency(data.studentLoan), 120, yPos);
  }
  
  if (data.otherDeductions > 0) {
    yPos += 8;
    doc.text('Other Deductions', 14, yPos);
    doc.text(formatCurrency(data.otherDeductions), 120, yPos);
  }
  
  // Net pay box
  yPos += 15;
  doc.setFillColor(0, 100, 80);
  doc.roundedRect(14, yPos, 182, 20, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('NET PAY', 20, yPos + 13);
  doc.setFontSize(16);
  doc.text(formatCurrency(data.netPay), 170, yPos + 13, { align: 'right' });
  
  // Footer
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a computer-generated payslip. Please retain for your records.', pageWidth / 2, 280, { align: 'center' });
  
  // Save
  doc.save(`payslip-${data.employeeNumber}-${data.payDate.replace(/\//g, '-')}.pdf`);
}

export function generateP60PDF(data: P60Data): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header with official styling
  doc.setFillColor(0, 50, 100);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('P60', pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text('End of Year Certificate', pageWidth / 2, 30, { align: 'center' });
  
  // Tax year
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text(`Tax Year: ${data.taxYear}`, pageWidth / 2, 55, { align: 'center' });
  
  // Employer section
  doc.setDrawColor(200);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(14, 65, 85, 45, 2, 2, 'FD');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Employer', 18, 73);
  doc.setFont('helvetica', 'normal');
  doc.text(data.companyName, 18, 82);
  if (data.companyAddress) {
    const addressLines = data.companyAddress.split('\n');
    let addrY = 89;
    addressLines.forEach(line => {
      doc.text(line, 18, addrY);
      addrY += 6;
    });
  }
  if (data.payeReference) {
    doc.text(`PAYE Ref: ${data.payeReference}`, 18, 105);
  }
  
  // Employee section
  doc.roundedRect(105, 65, 85, 45, 2, 2, 'FD');
  
  doc.setFont('helvetica', 'bold');
  doc.text('Employee', 109, 73);
  doc.setFont('helvetica', 'normal');
  doc.text(data.employeeName, 109, 82);
  doc.text(`Employee No: ${data.employeeNumber}`, 109, 89);
  doc.text(`NI Number: ${data.niNumber || 'N/A'}`, 109, 96);
  if (data.dateOfBirth) {
    doc.text(`DOB: ${data.dateOfBirth}`, 109, 103);
  }
  
  // Pay and tax details
  let yPos = 125;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Pay and Tax Details', 14, yPos);
  
  yPos += 10;
  doc.setDrawColor(0, 50, 100);
  doc.setLineWidth(0.5);
  doc.line(14, yPos, 196, yPos);
  
  // Details table
  const details = [
    ['Total Pay in this Employment', formatCurrency(data.totalPay)],
    ['Total Tax Deducted', formatCurrency(data.totalTax)],
    ['National Insurance Contributions', formatCurrency(data.totalNi)],
    ['Pension Contributions', formatCurrency(data.totalPension)],
    ['Final Tax Code', data.taxCode || 'N/A'],
  ];
  
  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  details.forEach(([label, value]) => {
    doc.text(label, 18, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(value, 180, yPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    yPos += 12;
  });
  
  // Important notice
  yPos += 10;
  doc.setFillColor(255, 245, 230);
  doc.roundedRect(14, yPos, 182, 30, 2, 2, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('IMPORTANT', 18, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.text('This form shows your total pay for income tax purposes in this employment for the year.', 18, yPos + 16);
  doc.text('Please keep this certificate safe. You may need it for tax purposes.', 18, yPos + 23);
  
  // Footer
  doc.setFontSize(8);
  doc.text('Certificate issued by employer', pageWidth / 2, 280, { align: 'center' });
  
  // Save
  doc.save(`P60-${data.employeeNumber}-${data.taxYear.replace('/', '-')}.pdf`);
}

export function generateBulkP60PDFs(employees: P60Data[]): void {
  employees.forEach(emp => generateP60PDF(emp));
}
