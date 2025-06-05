// PDF Service Class
class PDFService {
  constructor() {
    this.companyName = "Holliday's Lawn & Garden";
    this.companyContact = "7holliday@gmail.com | (504) 717-1887";
    this.companyLogo = "Hollidays_Lawn_Garden_Logo.png";
    this.ownerName = "Karl Holliday";
  }

  // Initialize PDF document with common settings
  initDocument() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setProperties({
      title: `${this.companyName} Document`,
      author: this.ownerName,
      creator: this.companyName,
      subject: "Official Business Document"
    });
    return doc;
  }

  // Add company header to document
  async addCompanyHeader(doc, yPos = 20) {
    try {
      // Add logo with consistent size and position
      doc.addImage(this.companyLogo, "PNG", 10, yPos - 10, 40, 20);
      
      // Company details with consistent styling
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(this.companyName, 60, yPos);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(this.ownerName + " - Owner", 60, yPos + 7);
      doc.text(this.companyContact, 60, yPos + 14);
      
      // Add decorative line under header
      doc.setDrawColor(34, 139, 34); // Forest green
      doc.setLineWidth(0.5);
      doc.line(10, yPos + 18, doc.internal.pageSize.width - 10, yPos + 18);
      
      return yPos + 25; // Return new Y position
    } catch (error) {
      console.warn('Error adding logo, continuing without it:', error);
      // Fallback header without logo
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(this.companyName, 15, yPos);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(this.ownerName + " - Owner", 15, yPos + 7);
      doc.text(this.companyContact, 15, yPos + 14);
      
      doc.setDrawColor(34, 139, 34); // Forest green
      doc.setLineWidth(0.5);
      doc.line(10, yPos + 18, doc.internal.pageSize.width - 10, yPos + 18);
      
      return yPos + 25;
    }
  }

  // Add customer details section
  addCustomerDetails(doc, customer, yPos) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("Bill To:", 15, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.text(customer.name || "Valued Customer", 15, yPos + 7);
    doc.text(customer.email || "", 15, yPos + 14);
    if (customer.address) {
      doc.text(customer.address.street || "", 15, yPos + 21);
      doc.text(`${customer.address.city || ""}, ${customer.address.state || ""} ${customer.address.zip || ""}`, 15, yPos + 28);
    }
    
    return yPos + 35;
  }

  // Add table header
  addTableHeader(doc, headers, colWidths, yPos) {
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPos, doc.internal.pageSize.width - 30, 10, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    let xPos = 15;
    headers.forEach((header, i) => {
      doc.text(header, xPos + 2, yPos + 7);
      xPos += colWidths[i];
    });
    
    return yPos + 10;
  }

  // Add consistent footer to all documents
  addDocumentFooter(doc) {
    const pageHeight = doc.internal.pageSize.height;
    
    // Add decorative line above footer
    doc.setDrawColor(34, 139, 34); // Forest green
    doc.setLineWidth(0.5);
    doc.line(10, pageHeight - 20, doc.internal.pageSize.width - 10, pageHeight - 20);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(102, 102, 102); // Gray text
    doc.text(this.companyName, doc.internal.pageSize.width / 2, pageHeight - 15, { align: 'center' });
    doc.text(this.companyContact, doc.internal.pageSize.width / 2, pageHeight - 10, { align: 'center' });
  }

  // Generate invoice PDF
  async generateInvoicePDF(invoiceData) {
    const doc = this.initDocument();
    let yPos = await this.addCompanyHeader(doc);
    
    // Document title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("INVOICE", doc.internal.pageSize.width / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // Invoice details
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, doc.internal.pageSize.width - 15, yPos, { align: 'right' });
    doc.text(`Date: ${new Date(invoiceData.createdAt).toLocaleDateString()}`, doc.internal.pageSize.width - 15, yPos + 7, { align: 'right' });
    doc.text(`Due Date: ${new Date(invoiceData.dueDate).toLocaleDateString()}`, doc.internal.pageSize.width - 15, yPos + 14, { align: 'right' });
    
    // Customer details
    yPos = this.addCustomerDetails(doc, {
      name: invoiceData.customerName,
      email: invoiceData.customerEmail
    }, yPos + 20);
    
    // Items table
    const headers = ["Description", "Quantity", "Rate", "Amount"];
    const colWidths = [100, 25, 25, 25];
    yPos = this.addTableHeader(doc, headers, colWidths, yPos + 10);
    
    // Items
    doc.setFont('helvetica', 'normal');
    invoiceData.items.forEach(item => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
        yPos = this.addTableHeader(doc, headers, colWidths, yPos);
      }
      
      doc.text(item.description, 17, yPos + 7);
      doc.text(item.quantity.toString(), 117, yPos + 7);
      doc.text(`$${item.rate.toFixed(2)}`, 142, yPos + 7);
      doc.text(`$${(item.quantity * item.rate).toFixed(2)}`, 167, yPos + 7);
      yPos += 10;
    });
    
    // Totals
    yPos += 5;
    doc.line(15, yPos, doc.internal.pageSize.width - 15, yPos);
    yPos += 10;
    
    doc.text("Subtotal:", 140, yPos);
    doc.text(`$${invoiceData.subtotal.toFixed(2)}`, 167, yPos);
    yPos += 7;
    
    doc.text("Tax:", 140, yPos);
    doc.text(`$${invoiceData.tax.toFixed(2)}`, 167, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'bold');
    doc.text("Total:", 140, yPos);
    doc.text(`$${invoiceData.total.toFixed(2)}`, 167, yPos);
    
    // Terms and notes
    if (invoiceData.terms || invoiceData.notes) {
      yPos += 20;
      doc.setFont('helvetica', 'bold');
      doc.text("Terms & Notes:", 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(invoiceData.terms || "", 15, yPos + 7);
      doc.text(invoiceData.notes || "", 15, yPos + 14);
    }
    
    // Add themed footer instead of simple text
    this.addDocumentFooter(doc);
    return doc;
  }

  // Generate quote PDF
  async generateQuotePDF(quoteData) {
    const doc = this.initDocument();
    let yPos = await this.addCompanyHeader(doc);
    
    // Document title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("QUOTE", doc.internal.pageSize.width / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // Quote details
    doc.setFontSize(10);
    doc.text(`Quote #: ${quoteData.bidNumber}`, doc.internal.pageSize.width - 15, yPos, { align: 'right' });
    doc.text(`Date: ${new Date(quoteData.createdAt).toLocaleDateString()}`, doc.internal.pageSize.width - 15, yPos + 7, { align: 'right' });
    doc.text(`Valid Until: ${new Date(quoteData.validUntil).toLocaleDateString()}`, doc.internal.pageSize.width - 15, yPos + 14, { align: 'right' });
    
    // Customer details
    yPos = this.addCustomerDetails(doc, {
      name: quoteData.customerName,
      email: quoteData.customerEmail
    }, yPos + 20);
    
    // Services table
    const headers = ["Service", "Description", "Amount"];
    const colWidths = [60, 90, 25];
    yPos = this.addTableHeader(doc, headers, colWidths, yPos + 10);
    
    // Services
    doc.setFont('helvetica', 'normal');
    quoteData.services.forEach(service => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
        yPos = this.addTableHeader(doc, headers, colWidths, yPos);
      }
      
      doc.text(service.serviceType, 17, yPos + 7);
      const descLines = doc.splitTextToSize(service.notes || "", 85);
      doc.text(descLines, 77, yPos + 7);
      doc.text(`$${service.total.toFixed(2)}`, 167, yPos + 7);
      yPos += 10 + (descLines.length - 1) * 7;
    });
    
    // Totals
    yPos += 5;
    doc.line(15, yPos, doc.internal.pageSize.width - 15, yPos);
    yPos += 10;
    
    doc.text("Subtotal:", 140, yPos);
    doc.text(`$${quoteData.estimatedSubtotal.toFixed(2)}`, 167, yPos);
    yPos += 7;
    
    if (quoteData.packageDiscountAmount > 0) {
      doc.text(`Package Discount (${quoteData.packageDiscountPercentage}%):`, 140, yPos);
      doc.text(`-$${quoteData.packageDiscountAmount.toFixed(2)}`, 167, yPos);
      yPos += 7;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text("Total:", 140, yPos);
    doc.text(`$${quoteData.estimatedTotal.toFixed(2)}`, 167, yPos);
    
    // Terms and conditions
    yPos += 20;
    doc.setFont('helvetica', 'bold');
    doc.text("Terms & Conditions:", 15, yPos);
    doc.setFont('helvetica', 'normal');
    const terms = [
      "1. This quote is valid for 30 days from the date of issue.",
      "2. Final price may vary based on actual conditions and requirements.",
      "3. Payment terms: 50% deposit required to schedule work.",
      "4. Weather conditions may affect scheduling.",
      "5. Customer is responsible for marking underground utilities."
    ];
    terms.forEach(term => {
      yPos += 7;
      doc.text(term, 15, yPos);
    });
    
    // Add themed footer instead of simple text
    this.addDocumentFooter(doc);
    return doc;
  }

  // Generate receipt PDF
  async generateReceiptPDF(receiptData) {
    const doc = this.initDocument();
    let yPos = await this.addCompanyHeader(doc);
    
    // Document title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("RECEIPT", doc.internal.pageSize.width / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // Receipt details
    doc.setFontSize(10);
    doc.text(`Receipt #: ${receiptData.receiptNumber}`, doc.internal.pageSize.width - 15, yPos, { align: 'right' });
    doc.text(`Date: ${new Date(receiptData.date).toLocaleDateString()}`, doc.internal.pageSize.width - 15, yPos + 7, { align: 'right' });
    doc.text(`Invoice #: ${receiptData.invoiceNumber}`, doc.internal.pageSize.width - 15, yPos + 14, { align: 'right' });
    
    // Payment details
    yPos += 30;
    doc.setFont('helvetica', 'bold');
    doc.text("Payment Details", 15, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Amount Paid: $${receiptData.amount.toFixed(2)}`, 15, yPos);
    doc.text(`Payment Method: ${receiptData.paymentMethod}`, 15, yPos + 7);
    doc.text(`Transaction ID: ${receiptData.transactionId}`, 15, yPos + 14);
    
    // Add themed footer instead of simple text
    this.addDocumentFooter(doc);
    return doc;
  }
} 