/**
 * 58mm (2") thermal receipt layouts for browser printing (USB/BT printers via OS driver).
 * Tune shop details via VITE_* env vars.
 */
import type { Order } from '../types/api';
import { receiptEnv } from '../config/receipt-env';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** INR with paise for receipts */
function money(value: number | string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function moneyPlain(value: number | string): string {
  return Number(value).toFixed(2);
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function thermalBaseStyles(): string {
  return `
    <style>
      @page { size: 58mm auto; margin: 2mm; }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        width: 58mm;
        max-width: 58mm;
        background: #fff;
        color: #000;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .rx {
        font-family: ui-monospace, 'Cascadia Code', 'Courier New', Courier, monospace;
        font-size: 11px;
        line-height: 1.35;
        padding: 2mm 3mm 4mm;
        word-wrap: break-word;
        overflow-wrap: anywhere;
      }
      .c { text-align: center; }
      .b { font-weight: 700; }
      .mt { margin-top: 6px; }
      .mb { margin-bottom: 6px; }
      .sm { font-size: 9px; line-height: 1.3; }
      .sep {
        border: none;
        border-top: 1px dashed #000;
        margin: 6px 0;
      }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 4px;
        margin: 2px 0;
      }
      .item-name { flex: 1; min-width: 0; }
      .item-qty { flex-shrink: 0; font-weight: 600; }
      table.bill {
        width: 100%;
        border-collapse: collapse;
        font-size: 9px;
        margin: 4px 0;
      }
      table.bill th, table.bill td {
        padding: 2px 0;
        vertical-align: top;
        text-align: left;
      }
      table.bill th { border-bottom: 1px solid #000; font-weight: 700; }
      table.bill .r { text-align: right; white-space: nowrap; }
      table.bill .c2 { text-align: center; width: 22px; }
      .qr-wrap { text-align: center; margin-top: 8px; }
      .qr-wrap img { width: 96px; height: 96px; image-rendering: pixelated; }
      @media print {
        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      }
    </style>
  `;
}

export function buildKitchenOrderTicketHtml(order: Order): string {
  const shop = receiptEnv.shopName;
  const lines = order.items.map((line) => {
    const name = escapeHtml(line.menuItem.name);
    return `<div class="row"><span class="item-name">${line.quantity}× ${name}</span></div>`;
  });

  const notes = order.specialInstructions?.trim();
  const notesBlock = notes
    ? `<div class="mt"><span class="b">SPECIAL INSTRUCTIONS</span><br/>${escapeHtml(notes)}</div>`
    : '';

  const addr = escapeHtml(order.deliveryAddress);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>${thermalBaseStyles()}</head>
<body><div class="rx">
  <div class="c b">${escapeHtml(shop)}</div>
  <div class="c sm mt">KITCHEN ORDER (KOT)</div>
  <hr class="sep" />
  <div class="row"><span>Order</span><span class="b">${escapeHtml(order.orderNumber)}</span></div>
  ${order.tableNumber ? `<div class="row"><span>Table</span><span class="b">${escapeHtml(order.tableNumber)}</span></div>` : ''}
  <div class="row"><span>Time</span><span>${escapeHtml(formatDateTime(order.createdAt))}</span></div>
  <div class="row"><span>Channel</span><span class="b">DELIVERY</span></div>
  <div class="row"><span>Kitchen status</span><span>${escapeHtml(order.status)}</span></div>
  <hr class="sep" />
  <div class="b mb">PREPARE</div>
  ${lines.join('')}
  <hr class="sep" />
  <div class="sm"><span class="b">Deliver to</span><br/>${addr}</div>
  <div class="mt sm"><span class="b">Phone</span> ${escapeHtml(order.customerPhone)}</div>
  ${notesBlock}
  <hr class="sep" />
  <div class="row sm"><span>Est. delivery</span><span>${order.estimatedDeliveryMinutes} min</span></div>
  <div class="c sm mt">*** END KOT ***</div>
</div></body></html>`;
}

export function buildCustomerSaleBillHtml(order: Order): string {
  const e = receiptEnv;
  const shop = escapeHtml(e.shopName);
  const addrLines = e.shopAddress
    .split('\n')
    .map((l) => escapeHtml(l.trim()))
    .filter(Boolean)
    .join('<br/>');
  const phone = e.shopPhone ? escapeHtml(e.shopPhone) : '';
  const gst = e.gstin ? escapeHtml(e.gstin) : null;

  const rows = order.items
    .map(
      (line) => `
    <tr>
      <td>${escapeHtml(line.menuItem.name)}</td>
      <td class="c2">${line.quantity}</td>
      <td class="r">${moneyPlain(line.unitPrice)}</td>
      <td class="r">${moneyPlain(line.lineTotal)}</td>
    </tr>`,
    )
    .join('');

  const payLabel =
    order.paymentStatus === 'PAID' ? 'PAID' : 'CASH ON DELIVERY (COD)';

  const qrUrl = (e.reviewQrUrl ?? '').trim();
  const qrBlock =
    qrUrl.length > 0
      ? `<div class="qr-wrap">
           <div class="sm b mb">Scan to leave a review</div>
           <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&amp;margin=2&amp;data=${encodeURIComponent(qrUrl)}" alt="" crossorigin="anonymous" />
         </div>`
      : e.reviewPlaceholderNote
        ? `<div class="c sm mt">${escapeHtml(e.reviewPlaceholderNote)}</div>`
        : '';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>${thermalBaseStyles()}</head>
<body><div class="rx">
  <div class="c b" style="font-size:13px;letter-spacing:0.5px;">${shop}</div>
  ${addrLines ? `<div class="c sm mt">${addrLines}</div>` : ''}
  ${phone ? `<div class="c sm">Ph: ${phone}</div>` : ''}
  ${gst ? `<div class="c sm">GSTIN: ${gst}</div>` : ''}
  ${e.fssai ? `<div class="c sm">FSSAI: ${escapeHtml(e.fssai)}</div>` : ''}
  ${e.socials ? `<div class="c sm">@${escapeHtml(e.socials)}</div>` : ''}
  <div class="c sm mt b">ORDER TYPE: ${order.tableNumber ? 'OFFLINE / DINE-IN' : 'ONLINE / DELIVERY'}</div>
  <div class="c sm">RETAIL TAX INVOICE / BILL OF SUPPLY</div>
  <hr class="sep" />
  <div class="row sm"><span>Bill No.</span><span class="b">${escapeHtml(order.orderNumber)}</span></div>
  ${order.tableNumber ? `<div class="row sm"><span>Table</span><span class="b">${escapeHtml(order.tableNumber)}</span></div>` : ''}
  <div class="row sm"><span>Date</span><span>${escapeHtml(formatDateTime(order.createdAt))}</span></div>
  <hr class="sep" />
  <div class="sm"><span class="b">Customer</span><br/>${escapeHtml(order.customerName ?? 'Guest')}</div>
  <div class="sm mt"><span class="b">Mobile</span> ${escapeHtml(order.customerPhone)}</div>
  <div class="sm mt"><span class="b">Delivery address</span><br/>${escapeHtml(order.deliveryAddress)}</div>
  <hr class="sep" />
  <table class="bill">
    <thead>
      <tr>
        <th>Item</th>
        <th class="c2">Qty</th>
        <th class="r">Rate</th>
        <th class="r">Amt</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <hr class="sep" />
  <div class="row"><span>Subtotal</span><span>${money(order.subtotal)}</span></div>
  <div class="row"><span>Delivery charges</span><span>${money(order.deliveryFee)}</span></div>
  <div class="row b" style="font-size:12px;margin-top:4px;"><span>TOTAL PAYABLE</span><span>${money(order.totalAmount)}</span></div>
  <div class="row sm mt"><span>Payment</span><span>${payLabel}</span></div>
  <div class="row sm"><span>Order status</span><span>${escapeHtml(order.status)}</span></div>
  <hr class="sep" />
  <div class="c sm">${escapeHtml(e.footerThanks)}</div>
  ${qrBlock}
  <div class="c sm mt" style="margin-top:10px;">Powered by Kappio · 58mm thermal</div>
</div></body></html>`;
}

/** Merged KOT + Bill for a single-print flow */
export function buildMergedBillHtml(order: Order): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>${thermalBaseStyles()}</head>
<body>
  ${buildKitchenOrderTicketHtml(order).replace(/<\/?(html|head|body|meta)[^>]*>/gi, '')}
  <div style="border-top:2px dashed #000;margin:15px 0 10px;position:relative;">
    <span style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:#fff;padding:0 8px;font-size:9px;font-weight:bold;">CUT HERE</span>
  </div>
  ${buildCustomerSaleBillHtml(order).replace(/<\/?(html|head|body|meta)[^>]*>/gi, '')}
</body></html>`;
}

export function openThermalPrint(html: string): void {
  // Create a hidden iframe
  const frameId = 'kappio-print-frame';
  let frame = document.getElementById(frameId) as HTMLIFrameElement;
  
  if (!frame) {
    frame = document.createElement('iframe');
    frame.id = frameId;
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    document.body.appendChild(frame);
  }

  const doc = frame.contentWindow?.document;
  if (!doc) {
    window.alert('Printing error: Iframe document not accessible.');
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Wait for images (like QR code) to load before printing
  const delayMs = html.includes('qrserver.com') ? 1000 : 300;
  
  setTimeout(() => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } catch (e) {
      console.error('Print failed', e);
      // Fallback for some browsers
      const w = window.open('', '_blank');
      if (w) {
        w.document.open();
        w.document.write(html);
        w.document.close();
        w.print();
      }
    }
  }, delayMs);
}

export function printKitchenOrderTicket(order: Order): void {
  openThermalPrint(buildKitchenOrderTicketHtml(order));
}

export function printCustomerSaleBill(order: Order): void {
  openThermalPrint(buildCustomerSaleBillHtml(order));
}
