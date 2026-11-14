import { Order } from '../types';
import { formatCurrency, formatDateTime } from './format';
import { dbService } from '../db/database';

export interface PrintOptions {
  autoPrint?: boolean;
  type?: 'customer' | 'kitchen';
}

const CHANNEL_LABELS: Record<string, string> = {
  dine_in: 'RESTORAN İÇİ',
  takeaway: 'GEL-AL',
  yemeksepeti: 'YEMEKSEPETİ',
  phone: 'TELEFON SİPARİŞİ / PAKET',
  other: 'DİĞER',
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'NAKİT',
  credit_card: 'KREDİ KARTI / POS',
  meal_card: 'YEMEK KARTI (TICKET)',
  yemeksepeti_online: 'YEMEKSEPETİ ONLİNE',
  veresiye: 'VERESİYE',
};

// Helper: Try to extract customer details (phone, address) from order data or db
export const getCustomerDetailsForOrder = (order: Order) => {
  let customerName = order.table_or_customer || 'Misafir';
  let phone = '';
  let address = '';

  try {
    // If table_or_customer has format "Name (Phone)"
    const match = customerName.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      customerName = match[1].trim();
      phone = match[2].trim();
    }

    if (phone) {
      const cust = dbService.getCustomerByPhone(phone);
      if (cust?.address) address = cust.address;
    } else if (customerName && customerName !== 'Misafir') {
      const candidates = dbService.getCustomers(customerName);
      if (candidates.length > 0 && candidates[0].address) {
        address = candidates[0].address;
        if (!phone && candidates[0].phone) phone = candidates[0].phone;
      }
    }
  } catch (e) {
    console.warn('Could not fetch extra customer details for receipt:', e);
  }

  return { customerName, phone, address };
};

// 1. Generate HTML for 80mm Customer Receipt (Müşteri Adisyonu)
export const generateCustomerReceiptHtml = (order: Order): string => {
  const { customerName, phone, address } = getCustomerDetailsForOrder(order);
  const channelText = CHANNEL_LABELS[order.channel] || order.channel;
  const paymentText = PAYMENT_LABELS[order.payment_method] || order.payment_method;

  const itemsHtml = (order.items || [])
    .map((it) => `
      <div style="margin-bottom: 5px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; font-weight: 600; font-size: 13px;">
          <span>${it.quantity}x ${it.product_name}</span>
          <span style="font-weight: 700;">${formatCurrency(it.total_price)}</span>
        </div>
        ${it.bread_type ? `<div style="font-size: 11px; color: #333; padding-left: 12px;">↳ Ekmek: <b>${it.bread_type}</b></div>` : ''}
        ${it.notes ? `<div style="font-size: 11px; color: #444; padding-left: 12px; font-style: italic;">↳ Not: ${it.notes}</div>` : ''}
      </div>
    `)
    .join('');

  return `
    <div class="receipt-container">
      <!-- HEADER -->
      <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
        <div style="font-size: 18px; font-weight: 900; letter-spacing: 1px;">GÜZELYALI DÖNERCİSİ</div>
        <div style="font-size: 11px; margin-top: 2px;">Özel Soslu Hatay & Yaprak Döner</div>
        <div style="font-size: 10px; color: #444; margin-top: 2px;">Güzelyalı Mah. Sahil Cad. No:12</div>
        <div style="font-size: 10px; color: #444;">Tel: 0555 123 45 67</div>
      </div>

      <!-- ORDER META -->
      <div style="border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 8px; font-size: 11px; line-height: 1.4;">
        <div style="display: flex; justify-content: space-between;">
          <span>Fiş No:</span>
          <span style="font-weight: 800; font-size: 13px;">${order.order_number}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Tarih:</span>
          <span>${formatDateTime(order.created_at)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Kanal:</span>
          <span style="font-weight: 700; background: #eee; padding: 1px 4px; border-radius: 3px;">${channelText}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Müşteri/Masa:</span>
          <span style="font-weight: 700;">${customerName}</span>
        </div>
        ${phone ? `
          <div style="display: flex; justify-content: space-between;">
            <span>Telefon:</span>
            <span style="font-weight: 600;">${phone}</span>
          </div>
        ` : ''}
        ${address ? `
          <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dotted #ccc;">
            <div style="font-weight: bold; font-size: 10px;">Teslimat Adresi:</div>
            <div style="font-size: 11px; font-weight: 600; line-height: 1.25;">${address}</div>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; margin-top: 3px;">
          <span>Ödeme Şekli:</span>
          <span style="font-weight: 700;">${paymentText}</span>
        </div>
        ${order.notes ? `
          <div style="margin-top: 4px; font-size: 10px; background: #f4f4f4; padding: 3px 5px; border-radius: 3px;">
            <b>Sipariş Notu:</b> ${order.notes}
          </div>
        ` : ''}
      </div>

      <!-- ITEMS HEADER -->
      <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 11px; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 6px;">
        <span>ÜRÜN</span>
        <span>TUTAR</span>
      </div>

      <!-- ITEMS LIST -->
      <div style="border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 8px;">
        ${itemsHtml}
      </div>

      <!-- TOTALS -->
      <div style="font-size: 12px; line-height: 1.4; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between;">
          <span>Ara Toplam:</span>
          <span>${formatCurrency(order.subtotal)}</span>
        </div>
        ${order.discount_amount > 0 ? `
          <div style="display: flex; justify-content: space-between; color: #c00; font-weight: 600;">
            <span>İndirim ${order.discount_reason ? `(${order.discount_reason})` : ''}:</span>
            <span>-${formatCurrency(order.discount_amount)}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #666;">
          <span>KDV (%10 Dahil):</span>
          <span>${formatCurrency(order.tax_amount)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 17px; font-weight: 900; border-top: 2px solid #000; margin-top: 6px; padding-top: 4px;">
          <span>GENEL TOPLAM:</span>
          <span>${formatCurrency(order.total_amount)}</span>
        </div>
      </div>

      <!-- FOOTER -->
      <div style="text-align: center; font-size: 10px; line-height: 1.4; color: #444;">
        <div style="font-weight: 800; font-size: 12px; margin-bottom: 2px;">AFİYET OLSUN!</div>
        <div>Bizi tercih ettiğiniz için teşekkür ederiz.</div>
        <div style="font-size: 8px; color: #777; margin-top: 3px;">Mali değeri yoktur, sipariş takip adisyonudur.</div>
        <div style="font-size: 8px; color: #aaa; margin-top: 1px;">Güzelyalı ERP Restoran Sistemi</div>
      </div>
    </div>
  `;
};

// 2. Generate HTML for Kitchen / Chef Preparation Ticket (Mutfak Fişi)
export const generateKitchenReceiptHtml = (order: Order): string => {
  const { customerName, phone, address } = getCustomerDetailsForOrder(order);
  const channelText = CHANNEL_LABELS[order.channel] || order.channel;

  const itemsHtml = (order.items || [])
    .map((it) => `
      <div style="border-bottom: 1px dashed #666; padding: 6px 0; margin-bottom: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 17px; font-weight: 900;">
          <span>[ ${it.quantity} ADET ]</span>
          <span style="text-align: right;">${it.product_name}</span>
        </div>
        ${it.bread_type ? `
          <div style="font-size: 14px; font-weight: 800; background: #000; color: #fff; display: inline-block; padding: 1px 6px; border-radius: 3px; margin-top: 3px;">
            EKMEK: ${it.bread_type}
          </div>
        ` : ''}
        ${it.notes ? `
          <div style="font-size: 13px; font-weight: 700; color: #b00; margin-top: 2px;">
            DİKKAT: ${it.notes}
          </div>
        ` : ''}
      </div>
    `)
    .join('');

  return `
    <div class="receipt-container">
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px;">
        <div style="font-size: 20px; font-weight: 900; letter-spacing: 1px;">*** MUTFAK & TEZGAH ***</div>
        <div style="font-size: 12px; font-weight: 700; margin-top: 2px;">GÜZELYALI DÖNERCİSİ</div>
      </div>

      <div style="border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; font-size: 12px; line-height: 1.3;">
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 16px; font-weight: 900;">
          <span>${customerName}</span>
          <span style="border: 1px solid #000; padding: 1px 5px; border-radius: 3px;">${channelText}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 3px;">
          <span>Fiş: <b>${order.order_number}</b></span>
          <span>Saat: <b>${formatDateTime(order.created_at).slice(-5)}</b></span>
        </div>
        ${phone ? `<div>Tel: <b>${phone}</b></div>` : ''}
        ${address ? `<div style="font-size: 11px; font-weight: 700; margin-top: 3px;">Adres: ${address}</div>` : ''}
        ${order.notes ? `
          <div style="background: #eee; padding: 4px; border-radius: 3px; font-size: 12px; font-weight: 800; margin-top: 4px; color: #900;">
            NOT: ${order.notes}
          </div>
        ` : ''}
      </div>

      <!-- KITCHEN ITEMS (LARGE FONT) -->
      <div>
        ${itemsHtml}
      </div>

      <div style="text-align: center; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; font-size: 12px; font-weight: 700;">
        KONTROL EDİP TESLİM EDİNİZ
      </div>
    </div>
  `;
};

// 3. Print HTML directly using an isolated hidden iframe (Compatible with all 80mm/58mm thermal printers)
export const printReceiptViaIframe = (receiptHtml: string, title = 'Adisyon'): void => {
  if (typeof window === 'undefined') return;

  // Use Electron silent/native print if available
  if ((window as any).electronAPI?.printThermalReceipt) {
    (window as any).electronAPI.printThermalReceipt();
    return;
  }

  let iframe = document.getElementById('thermal-print-iframe') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'thermal-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
  }

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    // Fallback: open in new window if iframe is inaccessible
    openPrintWindow(receiptHtml, title);
    return;
  }

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="tr">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0mm !important;
          }
          @media print {
            html, body {
              width: 80mm;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
            }
            .receipt-container {
              width: 72mm !important;
              margin: 0 auto !important;
            }
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace;
            width: 72mm;
            margin: 0 auto;
            padding: 6mm 2mm 12mm 2mm;
            color: #000;
            background: #fff;
            font-size: 12px;
            line-height: 1.35;
          }
          .receipt-container {
            width: 100%;
          }
        </style>
      </head>
      <body>
        ${receiptHtml}
        <script>
          window.onload = function() {
            try {
              window.focus();
              window.print();
            } catch (err) {
              console.warn('Iframe auto print trigger error:', err);
            }
          };
        </script>
      </body>
    </html>
  `);
  iframeDoc.close();

  // Supplementary timeout trigger for browsers where onload might already have fired
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Triggering iframe print failed:', e);
    }
  }, 250);
};

// 4. Fallback: Open in clean popup window and trigger print
export const openPrintWindow = (receiptHtml: string, title = 'Adisyon'): void => {
  if (typeof window === 'undefined') return;

  const win = window.open('', '_blank', 'width=380,height=600,top=100,left=100,scrollbars=yes');
  if (!win) {
    alert('Yazdırma penceresi tarayıcı tarafından engellendi. Lütfen açılır pencerelere (pop-up) izin verin.');
    return;
  }

  win.document.open();
  win.document.write(`
    <!DOCTYPE html>
    <html lang="tr">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0mm !important;
          }
          @media print {
            html, body {
              width: 80mm;
              margin: 0 !important;
              padding: 0 !important;
            }
            .no-print {
              display: none !important;
            }
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace;
            width: 72mm;
            margin: 0 auto;
            padding: 8mm 3mm;
            color: #000;
            background: #fff;
            font-size: 12px;
            line-height: 1.35;
          }
          .no-print {
            text-align: center;
            margin-bottom: 12px;
            padding: 6px;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 6px;
          }
          .btn-print {
            background: #0284c7;
            color: #fff;
            border: none;
            padding: 6px 14px;
            border-radius: 4px;
            font-weight: bold;
            cursor: pointer;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="btn-print" onclick="window.print()">Yazdır</button>
        </div>
        ${receiptHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 200);
          };
        </script>
      </body>
    </html>
  `);
  win.document.close();
};
