import React, { useState } from 'react';
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

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<any[]>([]);

  // Calculate totals
  const totalGross = orders.reduce((sum, o) => sum + o.gross_amount, 0);
  const totalCommission = orders.reduce((sum, o) => sum + o.commission_amount, 0);
  const totalNetPayout = orders.reduce((sum, o) => sum + o.net_payout, 0);
  const totalCogs = orders.reduce((sum, o) => sum + o.calculated_cogs, 0);
  const totalContribProfit = orders.reduce((sum, o) => sum + o.contribution_profit, 0);

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

      // Parse lines
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      const parsed: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(/[,;]/);
        if (parts.length >= 2) {
          const orderId = parts[0]?.trim() || `YS-${Date.now()}-${i}`;
          const gross = parseFloat(parts[1]?.replace(/[^\d.-]/g, '')) || 0;
          const comm = parseFloat(parts[2]?.replace(/[^\d.-]/g, '')) || roundMoney(gross * (commissionRate / 100));
          const net = parseFloat(parts[3]?.replace(/[^\d.-]/g, '')) || roundMoney(gross - comm);

          parsed.push({
            platform_order_id: orderId,
            order_date: new Date().toISOString(),
            gross_amount: gross,
            commission_rate: commissionRate,
            commission_amount: comm,
            net_payout: net,
            calculated_cogs: roundMoney(gross * 0.38),
            packaging_cost: 6.0,
            delivery_cost: 0,
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

  return (
    <div className="space-y-6 pb-8">
      {/* Top Banner & Commission Settings Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Smartphone size={20} className="text-brand-500" />
            <span>Yemeksepeti Kârlılık, Komisyon ve Mutabakat Modülü</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Platform kesintileri, net tahsilat, sipariş katkı kârı ve haftalık CSV mutabakatı.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-navy-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-navy-800">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Komisyon Oranı:</span>
            <input
              type="number"
              min="0"
              max="50"
              value={commissionRate}
              onChange={(e) => handleUpdateCommission(parseFloat(e.target.value) || 15)}
              className="w-14 bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded px-1.5 py-0.5 text-xs font-bold text-center text-brand-600"
            />
            <span className="text-xs font-bold text-slate-500">%</span>
          </div>

          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/30 transition-all">
            <UploadCloud size={16} />
            <span>CSV İçe Aktar</span>
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
        <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium">Toplam Brüt Sipariş</div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalGross)}
          </div>
          <div className="text-[10px] text-slate-400">{orders.length} sipariş</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium">Toplam Kesilen Komisyon</div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(totalCommission)}
          </div>
          <div className="text-[10px] text-slate-400">Ortalama %{commissionRate} kesinti</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium">Tahsil Edilecek Net Tutar</div>
          <div className="text-xl font-black text-brand-600 dark:text-brand-400 mt-1">
            {formatCurrency(totalNetPayout)}
          </div>
          <div className="text-[10px] text-slate-400">Yemeksepeti net alacak</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium">Hammadde & Ambalaj</div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(totalCogs)}
          </div>
          <div className="text-[10px] text-slate-400">Doğrudan ürün maliyeti</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium">Net Katkı Kârı</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(totalContribProfit)}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold">
            {totalNetPayout > 0 ? formatPercent((totalContribProfit / totalNetPayout) * 100) : '%0'} net katkı marjı
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white">
            Yemeksepeti Sipariş ve Kârlılık Detayları
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {orders.length} Kayıtlı Sipariş
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-200 dark:border-navy-800">
              <tr>
                <th className="py-2.5 px-3">Sipariş ID</th>
                <th className="py-2.5 px-3">Tarih</th>
                <th className="py-2.5 px-3">Brüt Tutar</th>
                <th className="py-2.5 px-3">Komisyon (%)</th>
                <th className="py-2.5 px-3">Komisyon Tutarı</th>
                <th className="py-2.5 px-3">Net Tahsilat</th>
                <th className="py-2.5 px-3">Ürün Maliyeti</th>
                <th className="py-2.5 px-3">Ambalaj</th>
                <th className="py-2.5 px-3">Katkı Kârı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/50">
                  <td className="py-3 px-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                    {o.platform_order_id}
                  </td>
                  <td className="py-3 px-3 text-slate-500">{formatDateTime(o.order_date)}</td>
                  <td className="py-3 px-3 font-semibold">{formatCurrency(o.gross_amount)}</td>
                  <td className="py-3 px-3">%{o.commission_rate}</td>
                  <td className="py-3 px-3 text-rose-600 font-medium">-{formatCurrency(o.commission_amount)}</td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{formatCurrency(o.net_payout)}</td>
                  <td className="py-3 px-3 text-slate-500">{formatCurrency(o.calculated_cogs)}</td>
                  <td className="py-3 px-3 text-slate-500">{formatCurrency(o.packaging_cost)}</td>
                  <td className="py-3 px-3 font-black text-emerald-600">
                    {formatCurrency(o.contribution_profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV PREVIEW MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 max-w-2xl w-full border border-slate-200 dark:border-navy-700 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-brand-500" />
              <span>Yemeksepeti CSV İçe Aktarım Önizlemesi ({previewRows.length} Sipariş)</span>
            </h3>

            <p className="text-xs text-slate-500">
              CSV dosyası analiz edildi. Mükerrer siparişler Sipariş ID kontrolü ile otomatik olarak engellenecektir.
            </p>

            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-navy-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Sipariş ID</th>
                    <th className="py-2 px-3">Brüt Tutar</th>
                    <th className="py-2 px-3">Komisyon</th>
                    <th className="py-2 px-3">Net Tutar</th>
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
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/30"
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
