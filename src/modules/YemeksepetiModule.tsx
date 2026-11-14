import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  TrendingUp,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Percent,
  Calculator,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Download,
  Eye,
  X,
  CreditCard,
  Banknote,
  Bike,
  Package,
} from 'lucide-react';
import { YemeksepetiOrder } from '../types';
import { formatCurrency, formatDateTime, formatPercent, roundMoney } from '../utils/format';
import { dbService } from '../db/database';

interface YemeksepetiModuleProps {
  onDataChanged: () => void;
}

export const YemeksepetiModule: React.FC<YemeksepetiModuleProps> = ({ onDataChanged }) => {
  const [orders, setOrders] = useState<YemeksepetiOrder[]>(() => dbService.getYemeksepetiOrders());
  const [commissionRate, setCommissionRate] = useState<number>(() => {
    const s = dbService.getSettings();
    return s.default_yemeksepeti_commission ? parseFloat(s.default_yemeksepeti_commission) : 15;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<'all' | 'online' | 'cash' | 'cancelled'>('all');
  const [selectedOrder, setSelectedOrder] = useState<YemeksepetiOrder | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<any[]>([]);

  // Parse raw JSON helper
  const parseRaw = (jsonStr?: string) => {
    if (!jsonStr) return { items: '', payment_type: '', payment_method: '', status_raw: '' };
    try {
      return JSON.parse(jsonStr);
    } catch {
      return { items: jsonStr, payment_type: '', payment_method: '', status_raw: '' };
    }
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const raw = parseRaw(o.raw_data_json);
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        o.platform_order_id.toLowerCase().includes(q) ||
        (raw.items && raw.items.toLowerCase().includes(q)) ||
        (raw.payment_type && raw.payment_type.toLowerCase().includes(q)) ||
        (raw.payment_method && raw.payment_method.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (selectedPaymentFilter === 'online') {
        return (
          raw.payment_type?.toLowerCase().includes('online') ||
          raw.payment_method?.toLowerCase().includes('creditcard') ||
          raw.payment_method?.toLowerCase().includes('yemekpay')
        );
      }
      if (selectedPaymentFilter === 'cash') {
        return (
          raw.payment_type?.toLowerCase().includes('kapı') ||
          raw.payment_method?.toLowerCase().includes('cash') ||
          raw.payment_method?.toLowerCase().includes('cardpayment')
        );
      }
      if (selectedPaymentFilter === 'cancelled') {
        return raw.status_raw?.toLowerCase().includes('iptal') || o.gross_amount === 0;
      }

      return true;
    });
  }, [orders, searchQuery, selectedPaymentFilter]);

  // Calculate totals
  const totalGross = filteredOrders.reduce((sum, o) => sum + o.gross_amount, 0);
  const totalCommission = filteredOrders.reduce((sum, o) => sum + o.commission_amount, 0);
  const totalNetPayout = filteredOrders.reduce((sum, o) => sum + o.net_payout, 0);
  const totalCogs = filteredOrders.reduce((sum, o) => sum + o.calculated_cogs, 0);
  const totalContribProfit = filteredOrders.reduce((sum, o) => sum + o.contribution_profit, 0);

  // Update commission setting
  const handleUpdateCommission = (newRate: number) => {
    setCommissionRate(newRate);
    dbService.updateSetting('default_yemeksepeti_commission', String(newRate));
  };

  // Parse CSV file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvContent(text);

      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      const parsed: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        // Handle comma or semicolon separated CSV with quotes
        const line = lines[i];
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (parts.length >= 2) {
          const orderId = parts[1]?.replace(/"/g, '').trim() || parts[0]?.replace(/"/g, '').trim();
          if (!orderId || orderId === 'Sipariş No') continue;

          const dateStr = parts[8]?.replace(/"/g, '').trim() || new Date().toISOString();
          const grossStr = parts[21]?.replace(/"/g, '').replace('.', '').replace(',', '.') || '0';
          const gross = parseFloat(grossStr) || 0;

          const commStr = parts[33]?.replace(/"/g, '').replace('.', '').replace(',', '.') || '0';
          const comm = parseFloat(commStr) || roundMoney(gross * (commissionRate / 100));

          const netStr = parts[42]?.replace(/"/g, '').replace('.', '').replace(',', '.') || '0';
          const net = parseFloat(netStr) || roundMoney(gross - comm);

          const items = parts[51]?.replace(/"/g, '').trim() || '';

          parsed.push({
            platform_order_id: orderId,
            order_date: dateStr,
            gross_amount: gross,
            commission_rate: gross > 0 ? roundMoney((comm / gross) * 100) : commissionRate,
            commission_amount: comm,
            net_payout: net,
            calculated_cogs: roundMoney(gross * 0.35),
            packaging_cost: 5.0,
            delivery_cost: 0,
            raw_data_json: JSON.stringify({
              items,
              payment_type: parts[4]?.replace(/"/g, '').trim() || '',
              payment_method: parts[5]?.replace(/"/g, '').trim() || '',
              status_raw: parts[7]?.replace(/"/g, '').trim() || '',
            }),
          });
        }
      }

      setPreviewRows(parsed);
      setIsImportModalOpen(true);
    };
    reader.readAsText(file);
  };

  // Confirm import
  const handleConfirmImport = () => {
    if (previewRows.length === 0) return;
    const { imported, duplicates } = dbService.importYemeksepetiOrders(previewRows);
    alert(`İçe Aktarma Tamamlandı!\nEklenen Sipariş: ${imported}\nMükerrer (Atlanan) Sipariş: ${duplicates}`);
    setIsImportModalOpen(false);
    setOrders(dbService.getYemeksepetiOrders());
    onDataChanged();
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) return;
    const headers = [
      'Sipariş No',
      'Tarih',
      'Brüt Tutar (TL)',
      'Komisyon Oranı (%)',
      'Komisyon Tutarı (TL)',
      'Net Tahsilat (TL)',
      'Tahmini Maliyet (TL)',
      'Katkı Kârı (TL)',
      'Ürünler',
    ];

    const rows = filteredOrders.map((o) => {
      const raw = parseRaw(o.raw_data_json);
      return [
        o.platform_order_id,
        o.order_date,
        o.gross_amount.toFixed(2),
        o.commission_rate.toFixed(2),
        o.commission_amount.toFixed(2),
        o.net_payout.toFixed(2),
        o.calculated_cogs.toFixed(2),
        o.contribution_profit.toFixed(2),
        `"${(raw.items || '').replace(/"/g, '""')}"`,
      ].join(';');
    });

    const csvData = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Yemeksepeti_Satis_Raporu_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-8 select-none">
      
      {/* Top Banner & Commission Settings Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Bike size={20} />
            </div>
            <span>Yemeksepeti Satışları & Mutabakat Merkezi</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-300/60 dark:border-rose-800/60">
              {orders.length} Sipariş
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Yemeksepeti Partner resmi satış dökümü, komisyon kesintileri, net banka hakedişi ve katkı marjı.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-navy-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-navy-800">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Komisyon:</span>
            <input
              type="number"
              min="0"
              max="50"
              value={commissionRate}
              onChange={(e) => handleUpdateCommission(parseFloat(e.target.value) || 15)}
              className="w-12 bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded px-1.5 py-0.5 text-xs font-bold text-center text-rose-600"
            />
            <span className="text-xs font-bold text-slate-500">%</span>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-navy-700 transition-all active:scale-95"
            title="Excel / CSV Formatında İndir"
          >
            <Download size={15} />
            <span>Dışa Aktar</span>
          </button>

          <label className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition-all active:scale-95">
            <UploadCloud size={16} />
            <span>Yeni CSV Yükle</span>
            <input
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Toplam Yemeksepeti Cirosu</div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalGross)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{filteredOrders.length} sipariş</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Kesilen Komisyon</div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(totalCommission)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Ort. %{totalGross > 0 ? ((totalCommission / totalGross) * 100).toFixed(1) : 0} platform kesintisi
          </div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Tahsil Edilecek Net Tutar</div>
          <div className="text-xl font-black text-brand-600 dark:text-brand-400 mt-1">
            {formatCurrency(totalNetPayout)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Bankaya geçecek hakediş</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Hammadde (SMM) & Ambalaj</div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(totalCogs)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tahmini porsiyon maliyeti</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Net Katkı Kârı</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(totalContribProfit)}
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
            {totalNetPayout > 0 ? formatPercent((totalContribProfit / totalNetPayout) * 100) : '%0'} net kâr marjı
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sipariş no (qcmn-...), ürün veya ödeme ara..."
            className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedPaymentFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedPaymentFilter === 'all'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-navy-950 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Tümü ({orders.length})
          </button>
          <button
            onClick={() => setSelectedPaymentFilter('online')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedPaymentFilter === 'online'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-navy-950 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <CreditCard size={13} /> Online Kart
          </button>
          <button
            onClick={() => setSelectedPaymentFilter('cash')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedPaymentFilter === 'cash'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-navy-950 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Banknote size={13} /> Kapıda Ödeme
          </button>
          <button
            onClick={() => setSelectedPaymentFilter('cancelled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedPaymentFilter === 'cancelled'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-navy-950 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            İptaller
          </button>
        </div>

      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
            <span>Sipariş Listesi ve Ürün Dağılımı</span>
            <span className="text-xs text-slate-400 font-normal">({filteredOrders.length} gösteriliyor)</span>
          </h3>
          <span className="text-xs text-slate-400">
            Satıra tıklayarak sipariş detayını görebilirsiniz.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-200 dark:border-navy-800">
              <tr>
                <th className="py-3 px-3">Sipariş No</th>
                <th className="py-3 px-3">Tarih & Saat</th>
                <th className="py-3 px-3">Sipariş Ürünleri</th>
                <th className="py-3 px-3">Ödeme Türü</th>
                <th className="py-3 px-3">Brüt Tutar</th>
                <th className="py-3 px-3">Komisyon</th>
                <th className="py-3 px-3">Net Kazanç</th>
                <th className="py-3 px-3">Katkı Kârı</th>
                <th className="py-3 px-3 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Arama kriterlerinize uygun sipariş bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const raw = parseRaw(o.raw_data_json);
                  const isOnline = raw.payment_type?.toLowerCase().includes('online');
                  const isCancelled = raw.status_raw?.toLowerCase().includes('iptal') || o.gross_amount === 0;

                  return (
                    <tr
                      key={o.id}
                      onClick={() => setSelectedOrder(o)}
                      className="hover:bg-slate-50 dark:hover:bg-navy-800/60 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                        {o.platform_order_id}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {formatDateTime(o.order_date)}
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate" title={raw.items}>
                          {raw.items || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isOnline
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                          }`}
                        >
                          {isOnline ? <CreditCard size={10} /> : <Banknote size={10} />}
                          {raw.payment_type || 'Belirtilmedi'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(o.gross_amount)}
                      </td>
                      <td className="py-3 px-3 text-rose-600 dark:text-rose-400 font-medium">
                        -{formatCurrency(o.commission_amount)}
                        <span className="text-[10px] text-slate-400 ml-1">
                          (%{o.commission_rate.toFixed(0)})
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-brand-600 dark:text-brand-400">
                        {formatCurrency(o.net_payout)}
                      </td>
                      <td className="py-3 px-3 font-black text-emerald-600">
                        {formatCurrency(o.contribution_profit)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(o);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Detay Görüntüle"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-navy-700 animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-rose-600 to-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bike size={20} />
                <div>
                  <h3 className="font-bold text-sm">Yemeksepeti Sipariş Detayı</h3>
                  <p className="text-[11px] text-rose-100 font-mono">
                    Ref: {selectedOrder.platform_order_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              
              {/* Items Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200 dark:border-navy-700 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Sipariş Edilen Menü & Ürünler
                </div>
                <div className="text-sm font-semibold text-slate-800 dark:text-white leading-relaxed">
                  {parseRaw(selectedOrder.raw_data_json).items || 'Ürün bilgisi bulunamadı.'}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Finansal Mutabakat ve Kesinti Özeti
                </div>
                <div className="divide-y divide-slate-100 dark:divide-navy-800 text-xs">
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Müşteri Ödediği Brüt Tutar:</span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {formatCurrency(selectedOrder.gross_amount)}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between text-rose-600">
                    <span>Yemeksepeti Komisyonu (%{selectedOrder.commission_rate}):</span>
                    <span className="font-bold">-{formatCurrency(selectedOrder.commission_amount)}</span>
                  </div>
                  {selectedOrder.platform_fees > 0 && (
                    <div className="py-2 flex justify-between text-rose-600">
                      <span>Pazarlama & Operasyonel Ücretler:</span>
                      <span className="font-bold">-{formatCurrency(selectedOrder.platform_fees)}</span>
                    </div>
                  )}
                  <div className="py-2 flex justify-between text-brand-600 font-bold bg-brand-50/50 dark:bg-brand-950/20 px-2 rounded-lg">
                    <span>Banka Hesabına Geçecek Net Tahsilat:</span>
                    <span>{formatCurrency(selectedOrder.net_payout)}</span>
                  </div>
                  <div className="py-2 flex justify-between text-amber-600">
                    <span>Tahmini Hammadde & Döner Eti Maliyeti:</span>
                    <span>-{formatCurrency(selectedOrder.calculated_cogs)}</span>
                  </div>
                  <div className="py-2 flex justify-between text-amber-600">
                    <span>Ambalaj & Kese Kağıdı Maliyeti:</span>
                    <span>-{formatCurrency(selectedOrder.packaging_cost)}</span>
                  </div>
                  <div className="py-2.5 flex justify-between text-emerald-600 font-black text-sm bg-emerald-50 dark:bg-emerald-950/30 px-2 rounded-lg">
                    <span>İşletmeye Kalan Net Katkı Kârı:</span>
                    <span>{formatCurrency(selectedOrder.contribution_profit)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-navy-800/40 border border-slate-200 dark:border-navy-700">
                  <div className="text-[10px] text-slate-400">Ödeme Yöntemi</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {parseRaw(selectedOrder.raw_data_json).payment_method || 'YEMEKPAY'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-navy-800/40 border border-slate-200 dark:border-navy-700">
                  <div className="text-[10px] text-slate-400">Sipariş Zamanı</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {formatDateTime(selectedOrder.order_date)}
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-navy-800/60 border-t border-slate-200 dark:border-navy-700 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-navy-700 hover:bg-slate-300 dark:hover:bg-navy-600 text-slate-800 dark:text-white transition-colors"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CSV IMPORT PREVIEW MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-navy-700 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-rose-500" />
              <span>Yemeksepeti CSV İçe Aktarım Önizlemesi ({previewRows.length} Sipariş)</span>
            </h3>

            <p className="text-xs text-slate-500">
              CSV dosyası başarıyla çözümlendi. Mükerrer siparişler Sipariş ID kontrolü ile otomatik olarak engellenecektir.
            </p>

            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-navy-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Sipariş No</th>
                    <th className="py-2 px-3">Brüt Tutar</th>
                    <th className="py-2 px-3">Komisyon</th>
                    <th className="py-2 px-3">Net Kazanç</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                  {previewRows.slice(0, 50).map((r, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-mono">{r.platform_order_id}</td>
                      <td className="py-2 px-3">{formatCurrency(r.gross_amount)}</td>
                      <td className="py-2 px-3 text-rose-500">-{formatCurrency(r.commission_amount)}</td>
                      <td className="py-2 px-3 font-bold">{formatCurrency(r.net_payout)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30"
              >
                İçe Aktarımı Onayla ({previewRows.length} Kayıt)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
