import React from 'react';
import { Printer, X, Check } from 'lucide-react';
import { Order } from '../types';
import { formatCurrency, formatDateTime } from '../utils/format';

interface ThermalReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.printThermalReceipt) {
      (window as any).electronAPI.printThermalReceipt();
    } else {
      window.print();
    }
  };

  const channelNames: Record<string, string> = {
    dine_in: 'RESTORAN İÇİ',
    takeaway: 'GEL-AL',
    yemeksepeti: 'YEMEKSEPETİ',
    phone: 'TELEFON SİPARİŞİ',
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-navy-700 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-100 dark:bg-navy-800 flex items-center justify-between border-b border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-brand-500" />
            <span className="font-semibold text-sm text-slate-800 dark:text-white">
              80 mm Termal Adisyon / Fiş Önizleme
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* 80mm Receipt Content Paper */}
        <div className="p-6 bg-slate-50 dark:bg-navy-950 flex justify-center">
          <div
            id="thermal-receipt-area"
            className="w-[300px] bg-white text-black p-5 shadow-md border border-slate-200 font-mono text-xs leading-relaxed"
          >
            {/* Logo / Header */}
            <div className="text-center pb-3 border-b border-dashed border-gray-400">
              <h2 className="font-extrabold text-sm tracking-wider">GÜZELYALI DÖNERCİSİ</h2>
              <p className="text-[10px] text-gray-600">Özel Soslu Hatay & Yaprak Döner</p>
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
                <span>{order.table_or_customer || 'Misafir'}</span>
              </div>
              <div className="flex justify-between">
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
                    <div className="flex justify-between">
                      <span className="font-semibold">
                        {it.quantity}x {it.product_name}
                      </span>
                      <span>{formatCurrency(it.total_price)}</span>
                    </div>
                    {it.bread_type && (
                      <div className="text-[9px] text-gray-500 pl-3">
                        ↳ Ekmek: {it.bread_type}
                      </div>
                    )}
                    {it.notes && (
                      <div className="text-[9px] text-gray-500 pl-3">
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
                <div className="flex justify-between text-red-600">
                  <span>İndirim:</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[9px] text-gray-500">
                <span>KDV (%10 Dahil):</span>
                <span>{formatCurrency(order.tax_amount)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-300">
                <span>GENEL TOPLAM:</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[9px] text-gray-600 space-y-1">
              <p className="font-semibold">AFİYET OLSUN!</p>
              <p>Mali değeri yoktur, sipariş takip adisyonudur.</p>
              <p className="text-[8px] text-gray-400 font-mono">Güzelyalı ERP ile üretilmiştir</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white dark:bg-navy-900 border-t border-slate-200 dark:border-navy-700 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
          >
            Kapat
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/30 transition-all"
          >
            <Printer size={15} />
            <span>80 mm Yazdır</span>
          </button>
        </div>
      </div>
    </div>
  );
};
