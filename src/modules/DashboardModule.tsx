import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  ShoppingBag,
  CreditCard,
  Target,
  Clock,
  ChevronRight,
  Percent,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { DashboardMetrics } from '../types';
import { formatCurrency, formatNumber, formatPercent } from '../utils/format';

interface DashboardModuleProps {
  metrics: DashboardMetrics;
  onNavigateTab: (tab: any) => void;
  onRefresh: () => void;
}

const COLORS = ['#ea580c', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  metrics,
  onNavigateTab,
  onRefresh,
}) => {
  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 p-6 rounded-2xl border border-navy-800 shadow-xl text-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-500/20 text-brand-400 border border-brand-500/30">
              Operasyon & Muhasebe Paneli
            </span>
            <span className="text-xs text-slate-400">• Gerçek Zamanlı SQLite</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Güzelyalı Dönercisi Yönetim Kontrol Merkezi
          </h2>
          <p className="text-sm text-slate-300 mt-0.5">
            Üretim verimliliği, reçete porsiyonlama, anlık maliyet muhasebesi ve başabaş analizi.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateTab('pos')}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <ShoppingBag size={16} />
            <span>Yeni Sipariş / Kasa</span>
          </button>
          <button
            onClick={() => onNavigateTab('production')}
            className="flex items-center gap-2 bg-navy-800 hover:bg-navy-700 text-slate-200 font-medium text-xs px-4 py-2.5 rounded-xl border border-navy-700 transition-all"
          >
            <span>Döner Üretim Tartımı</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 8 CRITICAL KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 1. Bugünkü Toplam Ciro */}
        <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs hover:border-brand-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-navy-400 mb-2">
            <span className="text-xs font-medium">Bugünkü Toplam Ciro</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(metrics.todayRevenue)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <ArrowUpRight size={13} />
            <span>{metrics.todayOrderCount} tamamlanan sipariş</span>
          </div>
        </div>

        {/* 2. Bugünkü Toplam Gider */}
        <div
          onClick={() => onNavigateTab?.('accounting')}
          className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs hover:border-brand-500/40 hover:shadow-md transition-all cursor-pointer group"
          title="Harcamaları Gör & Günlük Gider Ekle"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-navy-400 mb-2">
            <span className="text-xs font-medium group-hover:text-rose-600 transition-colors">Bugünkü İşletme Gideri</span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <TrendingUp size={16} className="rotate-180" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(metrics.todayExpenses)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>Faaliyet giderleri (Stok alımı hariç)</span>
            <span className="text-rose-600 font-semibold group-hover:underline">Gider Ekle &rarr;</span>
          </div>
        </div>

        {/* 3. Satılan Ürünlerin Maliyeti (COGS / SMM) */}
        <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs hover:border-brand-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-navy-400 mb-2">
            <span className="text-xs font-medium">Satılan Mal Maliyeti (SMM)</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Package size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(metrics.todayCogs)}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
            Reçete & fire bazlı doğrudan maliyet
          </div>
        </div>

        {/* 4. Bugünkü Brüt Kâr */}
        <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs hover:border-brand-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-navy-400 mb-2">
            <span className="text-xs font-medium">Bugünkü Brüt Kâr</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Layers size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(metrics.todayGrossProfit)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Ciro - SMM (Brüt Marj: {metrics.todayRevenue > 0 ? formatPercent((metrics.todayGrossProfit / metrics.todayRevenue) * 100) : '%0'})
          </div>
        </div>

        {/* 5. Bugünkü Tahmini Net Faaliyet Kârı */}
        <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs hover:border-brand-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-navy-400 mb-2">
            <span className="text-xs font-medium">Tahmini Net Faaliyet Kârı</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Percent size={16} />
            </div>
          </div>
          <div className={`text-2xl font-bold ${metrics.todayNetOperatingProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
            {formatCurrency(metrics.todayNetOperatingProfit)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Brüt Kâr - Günlük Faaliyet Gideri
          </div>
        </div>

        {/* 6. Toplam Sipariş */}
        <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs hover:border-brand-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-navy-400 mb-2">
            <span className="text-xs font-medium">Toplam Sipariş</span>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.todayOrderCount} <span className="text-sm font-normal text-slate-400">Adet</span>
          </div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-medium">
            Ort. Sepet: {formatCurrency(metrics.averageOrderValue)}
          </div>
        </div>

        {/* 7. Kasa ve Banka Bakiyesi */}
        <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs hover:border-brand-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-navy-400 mb-2">
            <span className="text-xs font-medium">Nakit Kasa & POS Banka</span>
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(metrics.cashBalance + metrics.bankBalance)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between mt-1">
            <span>Nakit: {formatCurrency(metrics.cashBalance)}</span>
            <span>POS: {formatCurrency(metrics.bankBalance)}</span>
          </div>
        </div>

        {/* 8. Yemeksepeti Cari Alacak */}
        <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs hover:border-brand-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-navy-400 mb-2">
            <span className="text-xs font-medium">Yemeksepeti Bekleyen Alacak</span>
            <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-brand-600 dark:text-brand-400">
              <Target size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
            {formatCurrency(metrics.yemeksepetiBalance)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Komisyon sonrası tahsil edilecek net tutar
          </div>
        </div>
      </div>

      {/* CRITICAL STOCK ALERTS (If any) */}
      {metrics.criticalStockAlerts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs">
              <AlertTriangle size={16} />
              <span>Kritik Stok Uyarısı ({metrics.criticalStockAlerts.length} Ürün Minimumun Altında)</span>
            </div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs text-amber-900 dark:text-amber-200 underline font-medium hover:text-amber-700"
            >
              Stok Yönetimine Git
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {metrics.criticalStockAlerts.slice(0, 4).map((it) => (
              <div
                key={it.id}
                className="bg-white dark:bg-navy-900 p-2.5 rounded-lg border border-amber-200 dark:border-navy-800 flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-slate-800 dark:text-white truncate max-w-[140px]">{it.name}</div>
                  <div className="text-[10px] text-slate-400">Min: {it.minimum_quantity} {it.unit}</div>
                </div>
                <span className="font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded">
                  {it.current_quantity} {it.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Sales Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <Clock size={16} className="text-brand-500" />
                <span>Saatlik Satış Dağılımı (Bugün)</span>
              </h3>
              <p className="text-xs text-slate-400">Restoran yoğunluk ve ciro akışı</p>
            </div>
            <span className="text-xs font-semibold text-brand-600 bg-brand-50 dark:bg-brand-950/50 px-2.5 py-1 rounded-lg">
              Toplam: {formatCurrency(metrics.todayRevenue)}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.hourlySales}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v}₺`} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Ciro']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#ea580c"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Break-even gauge card */}
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <Target size={16} className="text-brand-500" />
                <span>Günlük Başabaş Durumu</span>
              </h3>
              <button
                onClick={() => onNavigateTab('breakeven')}
                className="text-xs text-brand-600 hover:underline font-medium"
              >
                Ayrıntılar
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Bugün zarar etmemek için hedeflenen asgari ciro ve porsiyon eşiği
            </p>

            <div className="bg-slate-50 dark:bg-navy-950 p-4 rounded-xl border border-slate-200 dark:border-navy-800 text-center mb-4">
              <div className="text-xs text-slate-500 dark:text-navy-400 font-medium mb-1">
                Gereken Günlük Asgari Ciro
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-white">
                {formatCurrency(metrics.dailyBreakEven.breakEvenRevenue)}
              </div>
              <div className="text-xs text-brand-600 dark:text-brand-400 font-medium mt-1">
                Bugün Gerçekleşen: {formatCurrency(metrics.dailyBreakEven.currentRevenue)}
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-400">Başabaş Karşılama:</span>
                <span className={metrics.dailyBreakEven.breakEvenPercentage >= 100 ? 'text-emerald-500' : 'text-amber-500'}>
                  {formatPercent(metrics.dailyBreakEven.breakEvenPercentage)}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-200 dark:bg-navy-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    metrics.dailyBreakEven.breakEvenPercentage >= 100
                      ? 'bg-emerald-500'
                      : 'bg-gradient-to-r from-amber-500 to-brand-500'
                  }`}
                  style={{ width: `${Math.min(100, metrics.dailyBreakEven.breakEvenPercentage)}%` }}
                />
              </div>
            </div>

            {/* Highlighted Question & Answer */}
            <div className="p-3 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 rounded-xl text-xs">
              <div className="font-semibold text-brand-800 dark:text-brand-300 mb-1">
                "Zarar etmemek için kaç döner satmalıyım?"
              </div>
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-200">
                <span>Hedef: <strong className="text-brand-600">{metrics.dailyBreakEven.donerCountNeeded} Adet</strong></span>
                <span>Satılan: <strong className="text-emerald-600">{metrics.dailyBreakEven.donerCountSold} Adet</strong></span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center pt-3 border-t border-slate-100 dark:border-navy-800">
            Sabit günlük işletme gideri: {formatCurrency(metrics.dailyBreakEven.fixedExpenses)}
          </div>
        </div>
      </div>

      {/* LOWER SECTION: TOP PRODUCTS & RECENT TRANSACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling & Profitable Products */}
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              En Çok Satan Ürünler
            </h3>
            <button
              onClick={() => onNavigateTab('menu-engineering')}
              className="text-xs text-brand-600 hover:underline font-medium"
            >
              Menü Mühendisliği
            </button>
          </div>

          <div className="space-y-3">
            {metrics.topSellingProducts.length > 0 ? (
              metrics.topSellingProducts.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800/80 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{p.quantity} Adet Satıldı</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 dark:text-white">{formatCurrency(p.revenue)}</div>
                    <div className="text-[10px] text-emerald-600 font-medium">
                      +{formatCurrency(p.margin)} Kâr
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                Henüz sipariş kaydı bulunmuyor. Satış ekranından ilk satışı yapın.
              </div>
            )}
          </div>
        </div>

        {/* Sales Channels Comparison */}
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              Satış Kanalları Dağılımı
            </h3>
            <span className="text-xs text-slate-400">5 Kanal</span>
          </div>

          <div className="space-y-3">
            {metrics.channelBreakdown.map((ch, idx) => (
              <div key={ch.channel} className="text-xs space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-700 dark:text-slate-300">{ch.label}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(ch.total)} ({ch.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-navy-950 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${ch.percentage}%`,
                      backgroundColor: COLORS[idx % COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-navy-800 flex justify-between items-center text-xs">
            <span className="text-slate-500">Yemeksepeti Komisyon Takibi:</span>
            <button
              onClick={() => onNavigateTab('yemeksepeti')}
              className="text-brand-600 font-semibold hover:underline"
            >
              Komisyon Analizi & Mutabakat
            </button>
          </div>
        </div>

        {/* Recent Financial Transactions */}
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              Son Finansal İşlemler
            </h3>
            <button
              onClick={() => onNavigateTab('accounting')}
              className="text-xs text-brand-600 hover:underline font-medium"
            >
              Tüm Kasa
            </button>
          </div>

          <div className="space-y-2.5">
            {metrics.recentTransactions.length > 0 ? (
              metrics.recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800 text-xs"
                >
                  <div className="truncate max-w-[160px]">
                    <div className="font-semibold text-slate-800 dark:text-white truncate">
                      {tx.description}
                    </div>
                    <div className="text-[10px] text-slate-400">{tx.type}</div>
                  </div>
                  <div className={`font-bold ${tx.isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                Henüz kasa işlemi bulunmuyor.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
