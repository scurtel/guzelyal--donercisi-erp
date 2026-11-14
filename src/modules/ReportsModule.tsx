import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  FileText,
  Printer,
  TrendingUp,
  Boxes,
  Users,
  CheckCircle,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrency, formatDateTime, formatDate } from '../utils/format';
import { dbService } from '../db/database';

export const ReportsModule: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string>('daily_sales');

  const reportList = [
    { id: 'daily_sales', name: 'Günlük ve Haftalık Satış Raporu', icon: TrendingUp },
    { id: 'product_costs', name: 'Ürün Gerçek Maliyet ve Katkı Kârlılığı', icon: FileSpreadsheet },
    { id: 'inventory_valuation', name: 'Depo Stok Varlığı ve Sayım Farkları', icon: Boxes },
    { id: 'production_waste', name: 'Döner Verimlilik ve Fire Analizi', icon: FileText },
    { id: 'supplier_debts', name: 'Tedarikçi Borç ve Cari Mutabakat Raporu', icon: Users },
    { id: 'cash_flow', name: 'Kasa, Banka ve Nakit Akış Tablosu', icon: Calendar },
  ];

  // Export to Excel / CSV
  const handleExportExcel = () => {
    let data: any[] = [];
    let filename = `guzelyali_rapor_${selectedReport}_${new Date().toISOString().split('T')[0]}`;

    if (selectedReport === 'daily_sales') {
      const orders = dbService.getOrders(500);
      data = orders.map((o) => ({
        'Fiş No': o.order_number,
        Tarih: formatDateTime(o.created_at),
        Kanal: o.channel,
        'Müşteri/Masa': o.table_or_customer,
        Tutar: o.total_amount,
        Maliyet: o.cogs_total,
        'Brüt Kâr': o.gross_margin,
        'Ödeme Yöntemi': o.payment_method,
        Durum: o.status,
      }));
    } else if (selectedReport === 'product_costs') {
      const products = dbService.getProducts();
      data = products.map((p) => ({
        'Ürün Adı': p.name,
        Kategori: p.category,
        'Satış Fiyatı': p.base_price,
        'Doğrudan Maliyet': p.recipe?.total_direct_cost || 0,
        'Brüt Katkı Tutarı': p.recipe?.gross_margin_amount || 0,
        'Katkı Marjı (%)': p.recipe?.gross_margin_percent || 0,
      }));
    } else if (selectedReport === 'inventory_valuation') {
      const items = dbService.getInventoryItems();
      data = items.map((i) => ({
        Kod: i.code,
        Malzeme: i.name,
        Kategori: i.category,
        'Mevcut Miktar': i.current_quantity,
        Birim: i.unit,
        'Ortalama Maliyet': i.average_cost,
        'Toplam Stok Değeri': i.current_quantity * i.average_cost,
        Tedarikçi: i.supplier_name || '-',
      }));
    } else if (selectedReport === 'production_waste') {
      const batches = dbService.getProductionBatches();
      data = batches.map((b) => ({
        Tarih: formatDateTime(b.created_at),
        Tür: b.batch_type.toUpperCase(),
        'Çiğ Ağırlık (kg)': b.raw_weight_kg,
        'Pişmiş Ağırlık (kg)': b.cooked_weight_kg,
        'Fire (%)': `%${b.waste_percentage}`,
        'Verim (%)': `%${b.yield_percentage}`,
        'Porsiyon Sayısı': b.usable_portions_count,
        'Parti Maliyeti (TL)': b.batch_cost_tl,
        'Porsiyon Maliyeti (TL)': b.cost_per_portion_tl,
      }));
    } else {
      const expenses = dbService.getExpenses();
      data = expenses.map((e) => ({
        Tarih: formatDateTime(e.expense_date),
        Kategori: e.category,
        Açıklama: e.description,
        Ödeme: e.payment_method,
        Tutar: e.amount,
      }));
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rapor');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const title = reportList.find((r) => r.id === selectedReport)?.name || 'Güzelyalı ERP Raporu';

    doc.setFontSize(16);
    doc.text('GÜZELYALI DÖNERCİSİ', 14, 18);
    doc.setFontSize(11);
    doc.text(title, 14, 26);
    doc.setFontSize(9);
    doc.text(`Tarih: ${formatDate(new Date())} | Sistem: Güzelyalı ERP`, 14, 32);

    let head: string[][] = [];
    let body: any[][] = [];

    if (selectedReport === 'daily_sales') {
      head = [['Fiş No', 'Tarih', 'Kanal', 'Tutar', 'Maliyet', 'Brüt Kâr', 'Ödeme']];
      const orders = dbService.getOrders(100);
      body = orders.map((o) => [
        o.order_number,
        formatDateTime(o.created_at),
        o.channel,
        formatCurrency(o.total_amount),
        formatCurrency(o.cogs_total),
        formatCurrency(o.gross_margin),
        o.payment_method,
      ]);
    } else if (selectedReport === 'product_costs') {
      head = [['Ürün', 'Kategori', 'Fiyat', 'Maliyet', 'Brüt Katkı', 'Marj (%)']];
      const products = dbService.getProducts();
      body = products.map((p) => [
        p.name,
        p.category,
        formatCurrency(p.base_price),
        formatCurrency(p.recipe?.total_direct_cost || 0),
        formatCurrency(p.recipe?.gross_margin_amount || 0),
        `%${p.recipe?.gross_margin_percent || 0}`,
      ]);
    } else if (selectedReport === 'inventory_valuation') {
      head = [['Malzeme', 'Kategori', 'Miktar', 'Ort. Maliyet', 'Toplam Değer']];
      const items = dbService.getInventoryItems();
      body = items.map((i) => [
        i.name,
        i.category,
        `${i.current_quantity} ${i.unit}`,
        formatCurrency(i.average_cost),
        formatCurrency(i.current_quantity * i.average_cost),
      ]);
    } else {
      head = [['Tarih', 'Kategori', 'Açıklama', 'Ödeme', 'Tutar']];
      const exp = dbService.getExpenses();
      body = exp.slice(0, 50).map((e) => [
        formatDateTime(e.expense_date),
        e.category,
        e.description,
        e.payment_method,
        formatCurrency(e.amount),
      ]);
    }

    autoTable(doc, {
      startY: 38,
      head: head,
      body: body,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [234, 88, 12] }, // Brand orange
    });

    doc.save(`guzelyali_erp_${selectedReport}.pdf`);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Top Banner */}
      <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-brand-500" />
            <span>Resmi ve Operasyonel Raporlama Merkezi</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            PDF ve Excel formatında anlık dışa aktarma, fire, satış ve maliyet dökümleri.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all active:scale-95"
          >
            <Download size={15} />
            <span>Excel / CSV İndir</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/30 transition-all active:scale-95"
          >
            <FileText size={15} />
            <span>PDF Olarak Kaydet</span>
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportList.map((rep) => {
          const Icon = rep.icon;
          const isSelected = selectedReport === rep.id;

          return (
            <button
              key={rep.id}
              onClick={() => setSelectedReport(rep.id)}
              className={`p-5 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'bg-brand-50/60 dark:bg-brand-950/40 border-brand-500 ring-2 ring-brand-500/30 shadow-md'
                  : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-800 hover:border-brand-500/40 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`p-2.5 rounded-xl ${
                    isSelected
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                  {rep.name}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                PDF ve Excel olarak dışa aktarılabilir gerçek veritabanı dökümü.
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Report Preview Banner */}
      <div className="bg-slate-50 dark:bg-navy-950 p-4 rounded-xl border border-slate-200 dark:border-navy-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-emerald-500" />
          <span>
            Seçili Rapor: <strong>{reportList.find((r) => r.id === selectedReport)?.name}</strong>
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Yukarıdaki butonlarla Excel veya PDF olarak tek tıkla cihazınıza kaydedebilirsiniz.
        </span>
      </div>
    </div>
  );
};
