import React, { useState, useEffect } from 'react';
import { Printer, X, Check, Utensils, FileText, ExternalLink, Settings2 } from 'lucide-react';
import { Order } from '../types';
import { formatCurrency, formatDateTime } from '../utils/format';
import {
  generateCustomerReceiptHtml,
  generateKitchenReceiptHtml,
  printReceiptViaIframe,
  openPrintWindow,
  getCustomerDetailsForOrder,
} from '../utils/printer';

interface ThermalReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({ order, onClose }) => {
  const [activeTab, setActiveTab] = useState<'customer' | 'kitchen'>('customer');
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(() => {
    return localStorage.getItem('gzy_auto_print_receipt') === 'true';
  });
  const [printedStatus, setPrintedStatus] = useState<string | null>(null);

  useEffect(() => {
    // If auto-print is enabled, trigger print immediately when modal opens
    if (order && autoPrintEnabled) {
      handlePrintCustomer();
    }
  }, [order?.id]);

  if (!order) return null;

  const { customerName, phone, address } = getCustomerDetailsForOrder(order);

  const handleToggleAutoPrint = (checked: boolean) => {
    setAutoPrintEnabled(checked);
    localStorage.setItem('gzy_auto_print_receipt', checked ? 'true' : 'false');
  };

  const handlePrintCustomer = () => {
    const html = generateCustomerReceiptHtml(order);
    printReceiptViaIframe(html, `Adisyon - ${order.order_number}`);
    showPrintedNotification('Müşteri fişi yazıcıya gönderildi');
  };

  const handlePrintKitchen = () => {
    const html = generateKitchenReceiptHtml(order);
    printReceiptViaIframe(html, `Mutfak Fişi - ${order.order_number}`);
    showPrintedNotification('Mutfak fişi yazıcıya gönderildi');
  };

  const handlePrintBoth = () => {
    handlePrintCustomer();
    setTimeout(() => {
      handlePrintKitchen();
    }, 800);
    showPrintedNotification('Müşteri ve mutfak fişi yazıcıya gönderildi');
  };

  const handleOpenWindow = () => {
    const html = activeTab === 'customer'
      ? generateCustomerReceiptHtml(order)
      : generateKitchenReceiptHtml(order);
    openPrintWindow(html, `Adisyon - ${order.order_number}`);
  };

  const showPrintedNotification = (msg: string) => {
    setPrintedStatus(msg);
    setTimeout(() => {
      setPrintedStatus(null);
    }, 3000);
  };

  const channelNames: Record<string, string> = {
    dine_in: 'RESTORAN İÇİ',
    takeaway: 'GEL-AL',
    yemeksepeti: 'YEMEKSEPETİ',
    phone: 'TELEFON SİPARİŞİ / PAKET',
    other: 'DİĞER',
  };

  const paymentNames: Record<string, string> = {
    cash: 'NAKİT',
    credit_card: 'KREDİ KARTI / POS',
    meal_card: 'YEMEK KARTI (TICKET)',
    yemeksepeti_online: 'YEMEKSEPETİ ONLİNE',
    veresiye: 'VERESİYE',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-navy-700 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-100 dark:bg-navy-800 flex items-center justify-between border-b border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Printer size={18} />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-800 dark:text-white block leading-tight">
                80 mm Termal Fiş & Adisyon
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Sipariş No: {order.order_number}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-5 pt-3 bg-slate-50 dark:bg-navy-950 flex items-center justify-between border-b border-slate-200 dark:border-navy-800">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('customer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-bold border-b-2 transition-all ${
                activeTab === 'customer'
                  ? 'border-brand-600 text-brand-600 bg-white dark:bg-navy-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText size={14} />
              <span>Müşteri Adisyonu</span>
            </button>
            <button
              onClick={() => setActiveTab('kitchen')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-bold border-b-2 transition-all ${
                activeTab === 'kitchen'
                  ? 'border-brand-600 text-brand-600 bg-white dark:bg-navy-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Utensils size={14} />
              <span>Mutfak / Usta Fişi</span>
            </button>
          </div>

          <button
            onClick={handleOpenWindow}
            className="text-[11px] text-slate-500 hover:text-brand-600 flex items-center gap-1 font-semibold pb-1.5"
            title="Ayrı yazdırma penceresinde aç"
          >
            <ExternalLink size={12} />
            <span>Pencerede Aç</span>
          </button>
        </div>

        {/* Notification Toast */}
        {printedStatus && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 text-center flex items-center justify-center gap-2 animate-in fade-in">
            <Check size={14} />
            <span>{printedStatus}</span>
          </div>
        )}

        {/* Receipt Paper Area */}
        <div className="p-4 bg-slate-100 dark:bg-navy-950 flex justify-center max-h-[50vh] overflow-y-auto">
          {activeTab === 'customer' ? (
            /* CUSTOMER RECEIPT PREVIEW */
            <div
              id="thermal-receipt-area"
              className="w-[300px] bg-white text-black p-5 shadow-lg border border-slate-300 font-mono text-xs leading-relaxed rounded-sm select-text"
            >
              {/* Header */}
              <div className="text-center pb-3 border-b border-dashed border-gray-400">
                <h2 className="font-black text-sm tracking-wider">GÜZELYALI DÖNERCİSİ</h2>
                <p className="text-[10px] text-gray-700">Özel Soslu Hatay & Yaprak Döner</p>
                <p className="text-[9px] text-gray-500">Güzelyalı Mah. Sahil Cad. No:12</p>
                <p className="text-[9px] text-gray-500">Tel: 0555 123 45 67</p>
              </div>

              {/* Info */}
              <div className="py-2.5 border-b border-dashed border-gray-400 text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>Fiş No:</span>
                  <span className="font-bold">{order.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tarih:</span>
                  <span>{formatDateTime(order.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kanal:</span>
                  <span className="font-bold">{channelNames[order.channel] || order.channel}</span>
                </div>
                <div className="flex justify-between">
                  <span>Müşteri/Masa:</span>
                  <span className="font-bold">{customerName}</span>
                </div>
                {phone && (
                  <div className="flex justify-between">
                    <span>Telefon:</span>
                    <span className="font-semibold">{phone}</span>
                  </div>
                )}
                {address && (
                  <div className="mt-1 pt-1 border-t border-dotted border-gray-300">
                    <span className="font-bold text-[9px] block">Teslimat Adresi:</span>
                    <span className="font-semibold text-[10px] block leading-tight">{address}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <span>Ödeme Şekli:</span>
                  <span className="font-semibold">{paymentNames[order.payment_method] || order.payment_method}</span>
                </div>
              </div>

              {/* Items */}
              <div className="py-2 border-b border-dashed border-gray-400">
                <div className="flex justify-between text-[10px] font-bold pb-1 text-gray-600">
                  <span>ÜRÜN</span>
                  <span>TUTAR</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {order.items?.map((it, idx) => (
                    <div key={idx} className="text-[11px]">
                      <div className="flex justify-between font-semibold">
                        <span>
                          {it.quantity}x {it.product_name}
                        </span>
                        <span>{formatCurrency(it.total_price)}</span>
                      </div>
                      {it.bread_type && (
                        <div className="text-[9px] text-gray-600 pl-3">
                          ↳ Ekmek: {it.bread_type}
                        </div>
                      )}
                      {it.notes && (
                        <div className="text-[9px] text-gray-600 pl-3 italic">
                          ↳ Not: {it.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="py-2 border-b border-dashed border-gray-400 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span>Ara Toplam:</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-red-600 font-semibold">
                    <span>İndirim:</span>
                    <span>-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[9px] text-gray-500">
                  <span>KDV (%10 Dahil):</span>
                  <span>{formatCurrency(order.tax_amount)}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-gray-300">
                  <span>GENEL TOPLAM:</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-3 text-[9px] text-gray-600 space-y-1">
                <p className="font-bold">AFİYET OLSUN!</p>
                <p>Mali değeri yoktur, sipariş takip adisyonudur.</p>
                <p className="text-[8px] text-gray-400 font-mono">Güzelyalı ERP ile üretilmiştir</p>
              </div>
            </div>
          ) : (
            /* KITCHEN TICKET PREVIEW */
            <div
              id="thermal-receipt-area"
              className="w-[300px] bg-white text-black p-5 shadow-lg border border-slate-300 font-mono text-xs leading-relaxed rounded-sm select-text"
            >
              <div className="text-center pb-2 border-b-2 border-black">
                <h2 className="font-black text-base tracking-wider">*** MUTFAK & TEZGAH ***</h2>
                <p className="text-[10px] font-bold">GÜZELYALI DÖNERCİSİ</p>
              </div>

              <div className="py-2 border-b-2 border-black text-xs space-y-1">
                <div className="flex justify-between items-center text-sm font-black">
                  <span>{customerName}</span>
                  <span className="border border-black px-1.5 py-0.5 rounded text-[10px]">
                    {channelNames[order.channel] || order.channel}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Fiş: <b>{order.order_number}</b></span>
                  <span>Saat: <b>{formatDateTime(order.created_at).slice(-5)}</b></span>
                </div>
                {phone && <div className="text-[10px]">Tel: <b>{phone}</b></div>}
                {address && <div className="text-[10px] font-bold leading-tight">Adres: {address}</div>}
                {order.notes && (
                  <div className="p-1.5 bg-gray-100 rounded text-[11px] font-bold text-red-700">
                    NOT: {order.notes}
                  </div>
                )}
              </div>

              <div className="py-2 space-y-2 border-b-2 border-black">
                {order.items?.map((it, idx) => (
                  <div key={idx} className="pb-1.5 border-b border-dashed border-gray-300 last:border-b-0">
                    <div className="flex justify-between items-center text-sm font-black">
                      <span>[ {it.quantity} ADET ]</span>
                      <span className="text-right">{it.product_name}</span>
                    </div>
                    {it.bread_type && (
                      <div className="text-xs font-black bg-black text-white px-1.5 py-0.5 rounded inline-block mt-0.5">
                        EKMEK: {it.bread_type}
                      </div>
                    )}
                    {it.notes && (
                      <div className="text-xs font-bold text-red-600 mt-0.5">
                        DİKKAT: {it.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-center pt-2 text-[10px] font-black">
                KONTROL EDİP TESLİM EDİNİZ
              </div>
            </div>
          )}
        </div>

        {/* Footer Settings & Actions */}
        <div className="p-4 bg-white dark:bg-navy-900 border-t border-slate-200 dark:border-navy-700 space-y-3">
          {/* Auto Print Setting Toggle */}
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoPrintEnabled}
                onChange={(e) => handleToggleAutoPrint(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-navy-600 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Sipariş tamamlandığında fişi otomatik yazdır
              </span>
            </label>
            <span className="text-[10px] text-slate-400 font-mono">80mm ESC/POS</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            >
              Kapat
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintKitchen}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-all border border-amber-500/20"
                title="Sadece mutfak hazırlama fişini yazdır"
              >
                <Utensils size={14} />
                <span>Mutfak Fişi</span>
              </button>

              <button
                onClick={handlePrintCustomer}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/30 transition-all"
                title="80 mm Müşteri adisyon fişini yazdır"
              >
                <Printer size={15} />
                <span>80 mm Yazdır</span>
              </button>

              <button
                onClick={handlePrintBoth}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
                title="Hem müşteri hem mutfak fişini arka arkaya yazdır"
              >
                <Printer size={14} />
                <span>İkisini Yazdır</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
