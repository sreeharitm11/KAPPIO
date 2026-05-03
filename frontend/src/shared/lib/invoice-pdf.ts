/**
 * Customer Invoice PDF Generator
 * Generates a clean, professional A4-crop PDF invoice for the customer.
 * Uses the browser's print API with a hidden iframe so it never disrupts the main page.
 * Filename: {OrderNumber}_KappioCafe.pdf
 */

import type { Order } from '../types/api';

const RESTAURANT = {
  name: 'Kappio Cafe®',
  tagline: 'Artisanal Coffee & Fresh Bites',
  address: 'near BGS Medical College, BEL Layout, Nagarur Colony, Bengaluru',
  phone: '+91 70122 06714',
  email: 'cafekappio@gmail.com',
  instagram: '@cafekappio',
  whatsapp: 'wa.me/917012206714',
  gstin: 'Applied For',
  fssai: '21226008001309',
};

function formatCurrency(amount: string | number): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₹${n.toFixed(2)}`;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function buildInvoiceHtml(order: Order): string {
  const subtotal = parseFloat(order.subtotal);
  const deliveryFee = parseFloat(order.deliveryFee);
  const total = parseFloat(order.totalAmount);

  // GST calculation (5% GST split as 2.5% CGST + 2.5% SGST on food)
  const taxableValue = subtotal / 1.05;
  const cgst = taxableValue * 0.025;
  const sgst = taxableValue * 0.025;

  const itemRows = order.items
    .map(
      (item, i) => `
      <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
        <td class="sl">${i + 1}</td>
        <td class="desc">
          ${item.menuItem?.isVeg !== false
            ? '<span class="dot veg"></span>'
            : '<span class="dot nonveg"></span>'
          }
          ${item.menuItem?.name ?? 'Item'}
        </td>
        <td class="qty">${item.quantity}</td>
        <td class="price">${formatCurrency(item.unitPrice)}</td>
        <td class="total">${formatCurrency(item.lineTotal)}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Invoice – ${order.orderNumber} – Kappio Café</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @page {
    size: A4;
    margin: 0;
  }

  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 11px;
    color: #1a1a1a;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .invoice-wrap {
    width: 210mm;
    padding: 14mm 14mm 12mm 14mm;
    background: #fff;
  }

  /* ── HEADER ── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #2C1810;
    padding-bottom: 10px;
    margin-bottom: 12px;
  }
  .brand-block {}
  .brand-name {
    font-size: 22px;
    font-weight: 800;
    color: #2C1810;
    letter-spacing: -0.5px;
  }
  .brand-tag {
    font-size: 10px;
    color: #B85C3E;
    font-style: italic;
    margin-top: 1px;
  }
  .brand-addr {
    font-size: 9.5px;
    color: #555;
    margin-top: 6px;
    line-height: 1.5;
  }
  .invoice-meta {
    text-align: right;
  }
  .invoice-title {
    font-size: 18px;
    font-weight: 700;
    color: #B85C3E;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .inv-number {
    font-size: 13px;
    font-weight: 700;
    color: #2C1810;
    margin-top: 4px;
  }
  .inv-date {
    font-size: 9.5px;
    color: #666;
    margin-top: 3px;
  }

  /* ── BILL TO ── */
  .bill-row {
    display: flex;
    gap: 16px;
    margin-bottom: 14px;
    background: #FBF8F3;
    border-radius: 6px;
    padding: 10px 12px;
    border: 1px solid #E8DCC8;
  }
  .bill-col {
    flex: 1;
  }
  .bill-label {
    font-size: 8.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #B85C3E;
    margin-bottom: 4px;
  }
  .bill-value {
    font-size: 11px;
    color: #1a1a1a;
    line-height: 1.5;
  }
  .bill-value strong {
    font-weight: 700;
  }

  /* ── ITEMS TABLE ── */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
  }
  thead tr {
    background: #2C1810;
    color: #FBF8F3;
  }
  thead th {
    padding: 7px 8px;
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  thead th.sl  { width: 5%;  text-align: center; }
  thead th.desc{ width: 47%; text-align: left;   }
  thead th.qty { width: 10%; text-align: center; }
  thead th.price{ width: 17%; text-align: right; }
  thead th.total{ width: 21%; text-align: right; }

  tbody tr.even { background: #fff;     }
  tbody tr.odd  { background: #FBF8F3;  }
  tbody td {
    padding: 6px 8px;
    border-bottom: 1px solid #E8DCC8;
    font-size: 10.5px;
    vertical-align: middle;
  }
  td.sl   { text-align: center; color: #888; }
  td.qty  { text-align: center; font-weight: 600; }
  td.price{ text-align: right;  }
  td.total{ text-align: right; font-weight: 600; }
  td.desc { display: flex; align-items: center; gap: 5px; }

  .dot {
    display: inline-block;
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .veg    { background: #16a34a; }
  .nonveg { background: #dc2626; }

  /* ── TOTALS ── */
  .totals-wrap {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
  }
  .totals-box {
    width: 240px;
  }
  .totals-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 10.5px;
    border-bottom: 1px dashed #E8DCC8;
  }
  .totals-row:last-child {
    border-bottom: none;
  }
  .totals-row.grand {
    background: #2C1810;
    color: #FBF8F3;
    font-weight: 800;
    font-size: 12px;
    padding: 6px 8px;
    border-radius: 4px;
    margin-top: 4px;
  }
  .totals-label { color: #555; }
  .totals-label.grand { color: #FBF8F3; }
  .totals-value { font-weight: 600; }

  /* ── COMPLIANCE ROW ── */
  .compliance {
    background: #FBF8F3;
    border: 1px solid #E8DCC8;
    border-radius: 6px;
    padding: 8px 12px;
    display: flex;
    gap: 32px;
    margin-bottom: 14px;
    font-size: 9px;
    color: #666;
  }
  .compliance strong { color: #2C1810; }

  /* ── FOOTER ── */
  .footer {
    text-align: center;
    border-top: 1.5px solid #E8DCC8;
    padding-top: 10px;
    font-size: 9px;
    color: #888;
    line-height: 1.7;
  }
  .footer strong { color: #2C1810; font-size: 10px; }
  .thank-you {
    font-size: 13px;
    font-weight: 800;
    color: #B85C3E;
    margin-bottom: 4px;
    letter-spacing: 1px;
  }
</style>
</head>
<body>
<div class="invoice-wrap">

  <!-- HEADER -->
  <div class="header">
    <div class="brand-block">
      <div class="brand-name">Kappio Café</div>
      <div class="brand-tag">Artisanal Coffee &amp; Fresh Bites</div>
      <div class="brand-addr">
        ${RESTAURANT.address}<br/>
        📞 ${RESTAURANT.phone} &nbsp;|&nbsp; ✉️ ${RESTAURANT.email}<br/>
        📸 ${RESTAURANT.instagram}
      </div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">Tax Invoice</div>
      <div class="inv-number">${order.orderNumber}</div>
      <div class="inv-date">Date: ${formatDate(order.createdAt)}</div>
    </div>
  </div>

  <!-- BILL TO -->
  <div class="bill-row">
    <div class="bill-col">
      <div class="bill-label">Bill To</div>
      <div class="bill-value">
        <strong>${order.customerName ?? 'Valued Customer'}</strong><br/>
        📞 ${order.customerPhone}
      </div>
    </div>
    <div class="bill-col">
      <div class="bill-label">Delivery Address</div>
      <div class="bill-value">${order.deliveryAddress}</div>
    </div>
    <div class="bill-col">
      <div class="bill-label">Order Status</div>
      <div class="bill-value">
        <strong>${order.status}</strong><br/>
        Payment: ${order.paymentStatus}
      </div>
    </div>
  </div>

  <!-- ITEMS -->
  <table>
    <thead>
      <tr>
        <th class="sl">#</th>
        <th class="desc">Item Description</th>
        <th class="qty">Qty</th>
        <th class="price">Rate</th>
        <th class="total">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <!-- TOTALS -->
  <div class="totals-wrap">
    <div class="totals-box">
      <div class="totals-row">
        <span class="totals-label">Subtotal</span>
        <span class="totals-value">${formatCurrency(order.subtotal)}</span>
      </div>
      <div class="totals-row">
        <span class="totals-label">CGST (2.5%)</span>
        <span class="totals-value">${formatCurrency(cgst)}</span>
      </div>
      <div class="totals-row">
        <span class="totals-label">SGST (2.5%)</span>
        <span class="totals-value">${formatCurrency(sgst)}</span>
      </div>
      ${deliveryFee > 0 ? `
      <div class="totals-row">
        <span class="totals-label">Delivery Charge</span>
        <span class="totals-value">${formatCurrency(deliveryFee)}</span>
      </div>` : ''}
      <div class="totals-row grand">
        <span class="totals-label grand">TOTAL</span>
        <span class="totals-value">${formatCurrency(total)}</span>
      </div>
    </div>
  </div>

  <!-- COMPLIANCE -->
  <div class="compliance">
    <span><strong>GSTIN:</strong> ${RESTAURANT.gstin}</span>
    <span><strong>FSSAI:</strong> ${RESTAURANT.fssai}</span>
    <span><strong>HSN:</strong> 9963 (Restaurant Services)</span>
    <span><strong>Place of Supply:</strong> Karnataka</span>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="thank-you">Thank You for Choosing Kappio Café! ☕</div>
    <strong>This is a computer-generated invoice and requires no signature.</strong><br/>
    For support: WhatsApp ${RESTAURANT.phone} &nbsp;|&nbsp; ${RESTAURANT.instagram}<br/>
    <em>All prices inclusive of applicable taxes. E&amp;OE.</em>
  </div>

</div>
</body>
</html>`;
}

/**
 * Opens a hidden print dialog that outputs a clean, cropped A4 PDF.
 * The PDF filename is set to: {OrderNumber}_KappioCafe.pdf
 */
export async function downloadInvoicePdf(order: Order): Promise<void> {
  const html = buildInvoiceHtml(order);
  const filename = `${order.orderNumber}_KappioCafe`;

  // Create a hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0;';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error('Could not create print frame');
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for images/fonts to load
  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve();
    setTimeout(resolve, 800); // fallback
  });

  // Set the document title so browser uses it as default filename
  const originalTitle = document.title;
  document.title = filename;
  if (iframe.contentWindow) {
    iframe.contentWindow.document.title = filename;
  }

  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();

  // Restore title and cleanup
  setTimeout(() => {
    document.title = originalTitle;
    document.body.removeChild(iframe);
  }, 1500);
}
