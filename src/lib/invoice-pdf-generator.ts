import jsPDF from 'jspdf';

interface InvoicePDFData {
  invoiceNumber: string;
  companyName: string;
  companyAddress?: string;
  vatNumber?: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: Record<string, string>;
  issueDate: string;
  dueDate: string;
  items: { description: string; quantity: number; unit_price: number; total: number }[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  notes?: string;
  paymentTerms?: string;
  status: string;
}

export function generateInvoicePDF(data: InvoicePDFData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // — Header accent bar —
  doc.setFillColor(15, 82, 186);
  doc.rect(0, 0, pageWidth, 8, 'F');

  // — INVOICE title —
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 82, 186);
  doc.text('INVOICE', margin, 28);

  // — Invoice number & status —
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(data.invoiceNumber, margin, 36);

  if (data.status === 'paid') {
    doc.setFillColor(34, 197, 94);
    doc.roundedRect(pageWidth - margin - 30, 20, 30, 12, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PAID', pageWidth - margin - 15, 28, { align: 'center' });
  } else if (data.status === 'overdue') {
    doc.setFillColor(239, 68, 68);
    doc.roundedRect(pageWidth - margin - 38, 20, 38, 12, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('OVERDUE', pageWidth - margin - 19, 28, { align: 'center' });
  }

  // — From / To sections —
  let yPos = 52;
  doc.setTextColor(15, 82, 186);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM', margin, yPos);
  doc.text('BILL TO', pageWidth / 2 + 10, yPos);

  yPos += 8;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(data.companyName, margin, yPos);
  doc.text(data.clientName, pageWidth / 2 + 10, yPos);

  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  if (data.companyAddress) {
    const lines = data.companyAddress.split('\n');
    lines.forEach(line => {
      doc.text(line, margin, yPos);
      yPos += 5;
    });
  }
  if (data.vatNumber) {
    doc.text(`VAT: ${data.vatNumber}`, margin, yPos);
  }

  // Client details on right
  let clientY = 67;
  if (data.clientEmail) {
    doc.text(data.clientEmail, pageWidth / 2 + 10, clientY);
    clientY += 5;
  }
  if (data.clientAddress) {
    Object.values(data.clientAddress).forEach(line => {
      if (line) {
        doc.text(String(line), pageWidth / 2 + 10, clientY);
        clientY += 5;
      }
    });
  }

  // — Dates section —
  yPos = Math.max(yPos, clientY) + 10;
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, yPos, contentWidth, 20, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'bold');
  doc.text('ISSUE DATE', margin + 8, yPos + 8);
  doc.text('DUE DATE', margin + 60, yPos + 8);
  doc.text('PAYMENT TERMS', margin + 112, yPos + 8);

  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'normal');
  doc.text(data.issueDate, margin + 8, yPos + 15);
  doc.text(data.dueDate, margin + 60, yPos + 15);
  doc.text(data.paymentTerms || 'N/A', margin + 112, yPos + 15);

  // — Line items table —
  yPos += 30;

  // Table header
  doc.setFillColor(15, 82, 186);
  doc.rect(margin, yPos, contentWidth, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIPTION', margin + 4, yPos + 7);
  doc.text('QTY', margin + 105, yPos + 7, { align: 'center' });
  doc.text('UNIT PRICE', margin + 130, yPos + 7, { align: 'center' });
  doc.text('TOTAL', margin + contentWidth - 4, yPos + 7, { align: 'right' });

  yPos += 10;

  // Table rows
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  data.items.forEach((item, i) => {
    const rowY = yPos + i * 12;
    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 252);
      doc.rect(margin, rowY, contentWidth, 12, 'F');
    }
    doc.text(item.description || '', margin + 4, rowY + 8);
    doc.text(String(item.quantity), margin + 105, rowY + 8, { align: 'center' });
    doc.text(`£${item.unit_price.toFixed(2)}`, margin + 130, rowY + 8, { align: 'center' });
    doc.text(`£${item.total.toFixed(2)}`, margin + contentWidth - 4, rowY + 8, { align: 'right' });
  });

  yPos += data.items.length * 12 + 5;

  // — Totals —
  doc.setDrawColor(220, 220, 220);
  doc.line(margin + 100, yPos, margin + contentWidth, yPos);

  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Subtotal', margin + 105, yPos);
  doc.text(`£${data.subtotal.toFixed(2)}`, margin + contentWidth - 4, yPos, { align: 'right' });

  yPos += 7;
  doc.text(`VAT (${data.taxRate}%)`, margin + 105, yPos);
  doc.text(`£${data.taxAmount.toFixed(2)}`, margin + contentWidth - 4, yPos, { align: 'right' });

  if (data.amountPaid > 0) {
    yPos += 7;
    doc.text('Amount Paid', margin + 105, yPos);
    doc.setTextColor(34, 197, 94);
    doc.text(`-£${data.amountPaid.toFixed(2)}`, margin + contentWidth - 4, yPos, { align: 'right' });
    doc.setTextColor(80, 80, 80);
  }

  yPos += 3;
  doc.setDrawColor(15, 82, 186);
  doc.setLineWidth(0.5);
  doc.line(margin + 100, yPos, margin + contentWidth, yPos);

  yPos += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 82, 186);
  const balanceDue = data.total - data.amountPaid;
  doc.text('Balance Due', margin + 105, yPos);
  doc.text(`£${balanceDue.toFixed(2)}`, margin + contentWidth - 4, yPos, { align: 'right' });

  // — Notes —
  if (data.notes) {
    yPos += 20;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 82, 186);
    doc.text('NOTES', margin, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const noteLines = doc.splitTextToSize(data.notes, contentWidth);
    doc.text(noteLines, margin, yPos);
  }

  // — Footer —
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your business.', pageWidth / 2, 280, { align: 'center' });

  // Bottom accent bar
  doc.setFillColor(15, 82, 186);
  doc.rect(0, 289, pageWidth, 3, 'F');

  doc.save(`${data.invoiceNumber}.pdf`);
}
