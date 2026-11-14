import React, { useState } from 'react';
import {
  PieChart,
  Star,
  Zap,
  HelpCircle,
  AlertOctagon,
  Calculator,
  TrendingUp,
  Percent,
  Sliders,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { MenuEngineeringItem } from '../types';
import { formatCurrency, formatPercent, roundMoney } from '../utils/format';
import { dbService } from '../db/database';

export const MenuEngineeringModule: React.FC = () => {
  const [items, setItems] = useState<MenuEngineeringItem[]>(() => dbService.getMenuEngineering());

  // Simulation Tool States
  // Example: Et dürüm from 320 TL to 350 TL with hypothetical sales drop
  const [selectedSimItem, setSelectedSimItem] = useState<MenuEngineeringItem | null>(() => {
    return items.find((i) => i.name.includes('Et Dürüm')) || items[0] || null;
  });

  const [newSimPrice, setNewSimPrice] = useState<number>(350);
  const [salesVolumeChangePercent, setSalesVolumeChangePercent] = useState<number>(-5); // -5% drop in volume

  // Simulation Calculations
  const currentPrice = selectedSimItem?.unitPrice || 400;
  const currentCost = selectedSimItem?.unitCost || 178;
  const currentSalesCount = selectedSimItem?.salesCount || 100;
  const currentUnitMargin = roundMoney(currentPrice - currentCost);
  const currentTotalProfit = roundMoney(currentSalesCount * currentUnitMargin);

  const simulatedUnitMargin = roundMoney(newSimPrice - currentCost);
  const marginDeltaPerUnit = roundMoney(simulatedUnitMargin - currentUnitMargin);
  const simulatedSalesCount = Math.max(0, Math.round(currentSalesCount * (1 + salesVolumeChangePercent / 100)));
  const simulatedTotalProfit = roundMoney(simulatedSalesCount * simulatedUnitMargin);
  const totalProfitDelta = roundMoney(simulatedTotalProfit - currentTotalProfit);

  // Group by 4 categories
  const stars = items.filter((i) => i.classification === 'Star');
  const plowhorses = items.filter((i) => i.classification === 'Plowhorse');
  const puzzles = items.filter((i) => i.classification === 'Puzzle');
  const dogs = items.filter((i) => i.classification === 'Dog');

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header */}
      <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
        <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <PieChart size={20} className="text-brand-500" />
          <span>Restoran Menü Mühendisliği ve Boston Danışmanlık Matrisi</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Gerçek satış adetleri ve porsiyon maliyetlerinden hesaplanan Yıldızlar, İş Atları, Bulmacalar ve Zayıf ürün analizi.
        </p>
      </div>

      {/* 4 Quadrants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. YILDIZLAR (STARS) */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-4 border-2 border-emerald-500/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-navy-800">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <Star size={16} className="fill-emerald-500 text-emerald-500" />
              <span>YILDIZLAR ({stars.length})</span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
              Yüksek Satış + Yüksek Kâr
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Restoranın lokomotif ürünleri. Kalite ve porsiyon gramajı titizlikle korunmalı.
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {stars.map((it) => (
              <div key={it.id} className="p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 text-xs">
                <div className="font-bold text-slate-900 dark:text-white truncate">{it.name}</div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>{it.salesCount} Adet ({it.salesSharePercent}%)</span>
                  <span className="font-bold text-emerald-600">+{formatCurrency(it.unitMargin)} / ad</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. İŞ ATLARI (PLOWHORSES) */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-4 border-2 border-blue-500/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-navy-800">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs">
              <Zap size={16} className="text-blue-500" />
              <span>İŞ ATLARI ({plowhorses.length})</span>
            </div>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
              Yüksek Satış + Düşük Kâr
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Çok satıyor ancak kâr marjı zayıf. Fiyat artışı veya porsiyon/reçete optimizasyonu yapılmalı.
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {plowhorses.map((it) => (
              <div key={it.id} className="p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 text-xs">
                <div className="font-bold text-slate-900 dark:text-white truncate">{it.name}</div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>{it.salesCount} Adet</span>
                  <span className="font-bold text-blue-600">{formatCurrency(it.unitMargin)} / ad</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. BULMACALAR (PUZZLES) */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-4 border-2 border-purple-500/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-navy-800">
            <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold text-xs">
              <HelpCircle size={16} className="text-purple-500" />
              <span>BULMACALAR ({puzzles.length})</span>
            </div>
            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded">
              Düşük Satış + Yüksek Kâr
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Kâr marjı mükemmel ancak az satılıyor. Garson önerisi veya menüde öne çıkarma yapılmalı.
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {puzzles.map((it) => (
              <div key={it.id} className="p-2 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 text-xs">
                <div className="font-bold text-slate-900 dark:text-white truncate">{it.name}</div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>{it.salesCount} Adet</span>
                  <span className="font-bold text-purple-600">+{formatCurrency(it.unitMargin)} / ad</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. ZAYIFLAR (DOGS) */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-4 border-2 border-slate-300 dark:border-navy-700 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-navy-800">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-bold text-xs">
              <AlertOctagon size={16} className="text-slate-400" />
              <span>ZAYIFLAR ({dogs.length})</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 dark:bg-navy-800 px-2 py-0.5 rounded">
              Düşük Satış + Düşük Kâr
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Hem az satılıyor hem kâr getirmiyor. Menüden kaldırılması veya revize edilmesi düşünülmeli.
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {dogs.map((it) => (
              <div key={it.id} className="p-2 rounded-lg bg-slate-100/60 dark:bg-navy-950 text-xs">
                <div className="font-bold text-slate-700 dark:text-slate-300 truncate">{it.name}</div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>{it.salesCount} Adet</span>
                  <span>{formatCurrency(it.unitMargin)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICE SIMULATION TOOL */}
      <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-navy-800">
          <Calculator size={18} className="text-brand-500" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            İnteraktif Fiyat Simülasyonu ve Elastikiyet Modeli
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SIMULATION CONTROLS (5 cols) */}
          <div className="lg:col-span-5 space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Simülasyon Yapılacak Ürün:
              </label>
              <select
                value={selectedSimItem?.id}
                onChange={(e) => {
                  const found = items.find((i) => i.id === parseInt(e.target.value));
                  if (found) {
                    setSelectedSimItem(found);
                    setNewSimPrice(found.unitPrice + 30);
                  }
                }}
                className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl font-bold"
              >
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} — Mevcut: {formatCurrency(i.unitPrice)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Yeni Hedef Satış Fiyatı (TL):
              </label>
              <input
                type="number"
                step="10"
                value={newSimPrice}
                onChange={(e) => setNewSimPrice(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl font-bold text-sm text-brand-600"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Mevcut Fiyat: {formatCurrency(currentPrice)} ({newSimPrice > currentPrice ? `+${formatCurrency(newSimPrice - currentPrice)} Zam` : 'Fiyat İndirimi'})
              </span>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Varsayımsal Satış Adedi Değişimi:</span>
                <span className={salesVolumeChangePercent < 0 ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                  {salesVolumeChangePercent > 0 ? `+${salesVolumeChangePercent}%` : `${salesVolumeChangePercent}%`}
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                step="1"
                value={salesVolumeChangePercent}
                onChange={(e) => setSalesVolumeChangePercent(parseInt(e.target.value))}
                className="w-full accent-brand-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Fiyat yükseldiğinde talep elastikiyeti sebebiyle beklenen satış adedi düşüşü.
              </p>
            </div>
          </div>

          {/* SIMULATION RESULTS (7 cols) */}
          <div className="lg:col-span-7 bg-slate-50 dark:bg-navy-950 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 space-y-4">
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Simülasyon Çıktısı ve Kâr Değişimi
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white dark:bg-navy-900 p-3.5 rounded-xl border border-slate-200 dark:border-navy-800">
                <span className="text-slate-400 text-[10px]">Ürün Başına Katkı Artışı:</span>
                <div className="text-lg font-black text-emerald-600 mt-0.5">
                  +{formatCurrency(marginDeltaPerUnit)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {formatCurrency(currentUnitMargin)} → {formatCurrency(simulatedUnitMargin)}
                </div>
              </div>

              <div className="bg-white dark:bg-navy-900 p-3.5 rounded-xl border border-slate-200 dark:border-navy-800">
                <span className="text-slate-400 text-[10px]">Net Toplam Kâr Değişimi:</span>
                <div className={`text-lg font-black mt-0.5 ${totalProfitDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {totalProfitDelta >= 0 ? `+${formatCurrency(totalProfitDelta)}` : formatCurrency(totalProfitDelta)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {formatCurrency(currentTotalProfit)} → {formatCurrency(simulatedTotalProfit)}
                </div>
              </div>
            </div>

            <div className="p-3 bg-brand-50 dark:bg-brand-950/40 rounded-xl border border-brand-200 dark:border-brand-800/60 text-xs text-slate-700 dark:text-slate-200 space-y-1">
              <div className="font-bold text-brand-800 dark:text-brand-300">
                Yönetici Karar Özeti:
              </div>
              <p className="leading-relaxed">
                {selectedSimItem?.name} fiyatı <strong>{formatCurrency(currentPrice)}</strong> seviyesinden <strong>{formatCurrency(newSimPrice)}</strong> seviyesine çıkarıldığında, satış adedinde <strong>%{Math.abs(salesVolumeChangePercent)}</strong> düşüş yaşansa dahi, işletmenin toplam kârı
                <strong className={`ml-1 ${totalProfitDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {totalProfitDelta >= 0 ? `${formatCurrency(totalProfitDelta)} artacaktır.` : `${formatCurrency(Math.abs(totalProfitDelta))} azalacaktır.`}
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
