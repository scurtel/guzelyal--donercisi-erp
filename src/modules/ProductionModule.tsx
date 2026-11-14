import React, { useState } from 'react';
import {
  Flame,
  Scale,
  Calculator,
  Calendar,
  AlertCircle,
  PlusCircle,
  History,
  TrendingDown,
  TrendingUp,
  Percent,
  CheckCircle,
  PackageCheck,
  Sparkles,
} from 'lucide-react';
import { ProductionBatch, InventoryItem, Product } from '../types';
import { formatCurrency, formatNumber, formatPercent, formatDate, formatDateTime, roundMoney } from '../utils/format';
import { dbService } from '../db/database';

interface ProductionModuleProps {
  inventoryItems: InventoryItem[];
  products: Product[];
  onBatchCreated: () => void;
}

export const ProductionModule: React.FC<ProductionModuleProps> = ({
  inventoryItems,
  products,
  onBatchCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'et' | 'tavuk' | 'planning' | 'history'>('et');
  const [batches, setBatches] = useState<ProductionBatch[]>(() => dbService.getProductionBatches());

  // Input states for batch creation
  // Default values matching prompt: 6 kg et = 6.500 TL (110g portion), 10 kg tavuk = 1.500 TL (100g portion)
  const [rawWeight, setRawWeight] = useState<number>(6.0);
  const [cookedWeight, setCookedWeight] = useState<number>(4.2); // ~30% fire
  const [portionSizeG, setPortionSizeG] = useState<number>(110);
  const [batchCost, setBatchCost] = useState<number>(6500);
  const [notes, setNotes] = useState<string>('');

  // Production planning forecast inputs
  const [targetOrdersTomorrow, setTargetOrdersTomorrow] = useState<number>(120);

  // Switch to chicken presets
  const handleSelectTab = (tab: 'et' | 'tavuk' | 'planning' | 'history') => {
    setActiveTab(tab);
    if (tab === 'tavuk') {
      setRawWeight(10.0);
      setCookedWeight(7.5);
      setPortionSizeG(100);
      setBatchCost(1500);
    } else if (tab === 'et') {
      setRawWeight(6.0);
      setCookedWeight(4.2);
      setPortionSizeG(110);
      setBatchCost(6500);
    }
  };

  // Real-time calculations
  const rawKg = Math.max(0, Number(rawWeight) || 0);
  const cookedKg = Math.max(0, Number(cookedWeight) || 0);
  const portionG = Math.max(1, Number(portionSizeG) || 110);
  const costTotal = Math.max(0, Number(batchCost) || 0);

  const wasteKg = Math.max(0, roundMoney(rawKg - cookedKg));
  const wastePercent = rawKg > 0 ? roundMoney((wasteKg / rawKg) * 100) : 0;
  const yieldPercent = rawKg > 0 ? roundMoney((cookedKg / rawKg) * 100) : 0;

  const portionKg = portionG / 1000;
  const usablePortions = portionKg > 0 ? Math.floor(cookedKg / portionKg) : 0;
  const costPerPortion = usablePortions > 0 ? roundMoney(costTotal / usablePortions) : 0;

  // Theoretical vs actual comparison
  // If theoretical yield is 70%:
  const theoreticalCooked = roundMoney(rawKg * 0.70);
  const varianceKg = roundMoney(cookedKg - theoreticalCooked);
  const varianceLossTl = varianceKg < 0 ? roundMoney(Math.abs(varianceKg) * (costTotal / (rawKg || 1))) : 0;

  // Save production batch
  const handleSaveBatch = () => {
    if (rawKg <= 0 || cookedKg <= 0) {
      alert('Lütfen geçerli çiğ ve pişmiş ağırlık girin.');
      return;
    }
    if (cookedKg > rawKg) {
      alert('Pişmiş ağırlık, çiğ ağırlıktan büyük olamaz!');
      return;
    }

    try {
      dbService.recordProductionBatch({
        batch_type: activeTab === 'tavuk' ? 'tavuk' : 'et',
        raw_weight_kg: rawKg,
        cooked_weight_kg: cookedKg,
        portion_size_g: portionG,
        batch_cost_tl: costTotal,
        notes: notes || `${activeTab === 'et' ? 'Et' : 'Tavuk'} Döner Tartım Kaydı`,
      });

      alert('Döner üretim ve verimlilik kaydı başarıyla oluşturuldu! Çiğ et stoğu güncellendi.');
      setBatches(dbService.getProductionBatches());
      onBatchCreated();
    } catch (err: any) {
      alert(`Üretim kaydı hatası: ${err.message}`);
    }
  };

  // Production planning forecast calculations based on target orders
  // Assuming 40% Et, 60% Tavuk ratio:
  const etOrderCount = Math.round(targetOrdersTomorrow * 0.40);
  const tavukOrderCount = Math.round(targetOrdersTomorrow * 0.60);

  // Et: 110g cooked portion, 70% yield -> raw kg needed
  const etCookedNeededKg = roundMoney((etOrderCount * 0.110));
  const etRawNeededKg = roundMoney(etCookedNeededKg / 0.70);

  // Tavuk: 100g cooked portion, 75% yield -> raw kg needed
  const tavukCookedNeededKg = roundMoney((tavukOrderCount * 0.100));
  const tavukRawNeededKg = roundMoney(tavukCookedNeededKg / 0.75);

  // Bread needed (1 per durum + 10% safety buffer)
  const totalBreadsNeeded = Math.ceil(targetOrdersTomorrow * 1.10);

  return (
    <div className="space-y-6 pb-8">
      {/* Module Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-navy-900 p-2.5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleSelectTab('et')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'et'
                ? 'bg-rose-700 text-white shadow-md shadow-rose-700/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <Flame size={15} />
            <span>Et Döner Verimlilik Analizi</span>
          </button>

          <button
            onClick={() => handleSelectTab('tavuk')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'tavuk'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <Flame size={15} />
            <span>Tavuk Döner Verimlilik Analizi</span>
          </button>

          <button
            onClick={() => handleSelectTab('planning')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'planning'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <Calculator size={15} />
            <span>Üretim Planlama & Yarın Tahmini</span>
          </button>

          <button
            onClick={() => handleSelectTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-navy-800 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <History size={15} />
            <span>Tartım Geçmişi ({batches.length})</span>
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono pr-2">
          {activeTab === 'et' ? 'Dana/Kuzu Yaprak Döner' : activeTab === 'tavuk' ? 'Özel Soslu Tavuk Döner' : 'Kapasite Modeli'}
        </span>
      </div>

      {(activeTab === 'et' || activeTab === 'tavuk') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: INPUTS FORM (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
              <div className="flex items-center gap-2">
                <Scale size={20} className={activeTab === 'et' ? 'text-rose-600' : 'text-amber-500'} />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {activeTab === 'et' ? 'Et Döner Parti Girişi' : 'Tavuk Döner Parti Girişi'}
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300">
                {formatDate(new Date())}
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  1. Başlangıç Çiğ Ağırlığı (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={rawWeight}
                    onChange={(e) => setRawWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    kg
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Örnek: Şişe takılan marine edilmiş çiğ et miktarı.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  2. Pişirme Sonrası Kullanılabilir Ağırlık (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={cookedWeight}
                    onChange={(e) => setCookedWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    kg
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Kesime ve servise hazır net pişmiş döner miktarı.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  3. Standart Porsiyon Gramajı (gram)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="5"
                    min="50"
                    value={portionSizeG}
                    onChange={(e) => setPortionSizeG(parseFloat(e.target.value) || 100)}
                    className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    gram
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Dürüm veya porsiyon başına konulacak et miktarı (Et: 110g, Tavuk: 100g).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  4. Üretim Parti Maliyeti (TL)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="10"
                    min="0"
                    value={batchCost}
                    onChange={(e) => setBatchCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ₺
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {rawKg} kg çiğ et için ödenen toplam hammadde maliyeti.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Not / Parti Açıklaması:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Örn: Topaloğlu 1. parti, orta yağlı dana döner..."
                  className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <button
                onClick={handleSaveBatch}
                className="w-full mt-2 py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <PlusCircle size={16} />
                <span>Üretim ve Fire Kaydını İşle</span>
              </button>
            </div>
          </div>

          {/* RIGHT: REAL-TIME ENGINEERING RESULTS (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Primary KPI Result Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {/* Yield % */}
              <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Verimlilik (Yield)</span>
                  <Percent size={14} className="text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatPercent(yieldPercent)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Pişmiş / Çiğ Oranı ({cookedKg} / {rawKg} kg)
                </div>
              </div>

              {/* Waste % */}
              <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Toplam Fire Kaybı</span>
                  <TrendingDown size={14} className="text-rose-500" />
                </div>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {formatPercent(wastePercent)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Kayıp: {wasteKg} kg pişirme firesi
                </div>
              </div>

              {/* Usable Portions */}
              <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Çıkacak Porsiyon</span>
                  <PackageCheck size={14} className="text-brand-500" />
                </div>
                <div className="text-2xl font-black text-brand-600 dark:text-brand-400">
                  {usablePortions} <span className="text-xs font-normal text-slate-400">Adet</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Her biri tam {portionG}g
                </div>
              </div>
            </div>

            {/* Cost Breakdown & Portion Unit Cost */}
            <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                  <Calculator size={16} className="text-brand-500" />
                  <span>Porsiyon Başına Gerçek Et Maliyeti Hesabı</span>
                </h4>
                <span className="text-xs font-extrabold text-brand-600 bg-brand-50 dark:bg-brand-950/60 px-3 py-1 rounded-lg">
                  1 Porsiyon = {formatCurrency(costPerPortion)}
                </span>
              </div>

              {/* Formula Step-by-step card */}
              <div className="bg-slate-50 dark:bg-navy-950 p-4 rounded-xl border border-slate-200 dark:border-navy-800 text-xs space-y-2.5 font-mono">
                <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-navy-800">
                  <span className="text-slate-500">1. Toplam Çiğ Maliyet:</span>
                  <span className="font-bold">{formatCurrency(costTotal)} ({rawKg} kg @ {formatCurrency(rawKg > 0 ? costTotal / rawKg : 0)}/kg)</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-navy-800">
                  <span className="text-slate-500">2. Pişmiş Kullanılabilir Net Et:</span>
                  <span className="font-bold text-emerald-600">{cookedKg} kg (Net Pişmiş)</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-navy-800">
                  <span className="text-slate-500">3. 1 kg Pişmiş Etin Gerçek Maliyeti:</span>
                  <span className="font-bold text-brand-600">
                    {formatCurrency(cookedKg > 0 ? costTotal / cookedKg : 0)} / kg
                  </span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1">
                  <span>4. {portionG}g Porsiyonun Gerçek Et Maliyeti:</span>
                  <span className="text-sm text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(costPerPortion)}
                  </span>
                </div>
              </div>

              {/* Fire ve Kayıp Değerlendirmesi */}
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                  <AlertCircle size={16} />
                  <span>Teorik Verim vs. Gerçek Tüketim Farkı</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  Standart hedef pişirme verimi <strong>%70</strong> kabul edildiğinde, {rawKg} kg çiğ etten en az <strong>{theoreticalCooked} kg</strong> pişmiş et çıkmalıdır.
                  Şu anki gerçek tartımınız <strong>{cookedKg} kg</strong> olup, fark:
                  <span className={`font-bold ml-1 ${varianceKg >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {varianceKg >= 0 ? `+${varianceKg} kg (Başarılı Verim)` : `${varianceKg} kg (Aşırı Fire/Kayıp)`}
                  </span>.
                </p>
                {varianceLossTl > 0 && (
                  <div className="text-rose-600 font-bold">
                    Aşırı fire sebebiyle tahmini hammadde kayıp tutarı: {formatCurrency(varianceLossTl)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTION PLANNING TAB */}
      {activeTab === 'planning' && (
        <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-800">
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
                <Sparkles size={18} className="text-brand-500" />
                <span>Yarın İçin Akıllı Üretim & Hazırlık Planlama</span>
              </h3>
              <p className="text-xs text-slate-400">
                Hedeflenen sipariş sayısına ve geçmiş satış karmasına göre gereken çiğ et, tavuk ve ekmek ihtiyacı
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Hedeflenen Günlük Sipariş:
              </label>
              <input
                type="number"
                min="10"
                step="10"
                value={targetOrdersTomorrow}
                onChange={(e) => setTargetOrdersTomorrow(parseInt(e.target.value) || 0)}
                className="w-24 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-lg px-3 py-1.5 text-xs font-bold text-center text-brand-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* ET HAZIRLIK İHTİYACI */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-rose-600">DANA / KUZU ET DÖNER</span>
                <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 px-2 py-0.5 rounded font-semibold">
                  %40 Satış Payı
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {etRawNeededKg} <span className="text-xs font-normal text-slate-400">kg Çiğ Et</span>
              </div>
              <div className="text-xs text-slate-500 space-y-1 pt-1 border-t border-slate-200 dark:border-navy-800">
                <div className="flex justify-between">
                  <span>Beklenen Sipariş:</span>
                  <span className="font-semibold">{etOrderCount} Porsiyon</span>
                </div>
                <div className="flex justify-between">
                  <span>Gerekli Pişmiş Et:</span>
                  <span className="font-semibold">{etCookedNeededKg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Beklenen Pişirme Firesi:</span>
                  <span className="font-semibold text-rose-500">%{30}</span>
                </div>
              </div>
            </div>

            {/* TAVUK HAZIRLIK İHTİYACI */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-amber-600">TAVUK DÖNER</span>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 px-2 py-0.5 rounded font-semibold">
                  %60 Satış Payı
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {tavukRawNeededKg} <span className="text-xs font-normal text-slate-400">kg Çiğ Tavuk</span>
              </div>
              <div className="text-xs text-slate-500 space-y-1 pt-1 border-t border-slate-200 dark:border-navy-800">
                <div className="flex justify-between">
                  <span>Beklenen Sipariş:</span>
                  <span className="font-semibold">{tavukOrderCount} Porsiyon</span>
                </div>
                <div className="flex justify-between">
                  <span>Gerekli Pişmiş Tavuk:</span>
                  <span className="font-semibold">{tavukCookedNeededKg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Beklenen Pişirme Firesi:</span>
                  <span className="font-semibold text-amber-500">%{25}</span>
                </div>
              </div>
            </div>

            {/* EKMEK & AMBALAJ İHTİYACI */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-blue-600">EKMEK & AMBALAJ</span>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 px-2 py-0.5 rounded font-semibold">
                  %10 Emniyet Payı
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {totalBreadsNeeded} <span className="text-xs font-normal text-slate-400">Adet Ekmek</span>
              </div>
              <div className="text-xs text-slate-500 space-y-1 pt-1 border-t border-slate-200 dark:border-navy-800">
                <div className="flex justify-between">
                  <span>Lavaş Tahmini:</span>
                  <span className="font-semibold">{Math.round(totalBreadsNeeded * 0.70)} Adet</span>
                </div>
                <div className="flex justify-between">
                  <span>Sütlü Ekmek:</span>
                  <span className="font-semibold">{Math.round(totalBreadsNeeded * 0.20)} Adet</span>
                </div>
                <div className="flex justify-between">
                  <span>Pide Ekmek:</span>
                  <span className="font-semibold">{Math.round(totalBreadsNeeded * 0.10)} Adet</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TARTIM GEÇMİŞİ */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              Döner Üretim ve Verimlilik Tartım Tarihçesi
            </h3>
            <button
              onClick={() => setBatches(dbService.getProductionBatches())}
              className="px-3 py-1.5 bg-slate-100 dark:bg-navy-800 rounded-lg text-xs font-semibold"
            >
              Yenile
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-200 dark:border-navy-800">
                <tr>
                  <th className="py-2.5 px-3">Tarih</th>
                  <th className="py-2.5 px-3">Tür</th>
                  <th className="py-2.5 px-3">Çiğ (kg)</th>
                  <th className="py-2.5 px-3">Pişmiş (kg)</th>
                  <th className="py-2.5 px-3">Fire (%)</th>
                  <th className="py-2.5 px-3">Verim (%)</th>
                  <th className="py-2.5 px-3">Porsiyon</th>
                  <th className="py-2.5 px-3">Parti Maliyeti</th>
                  <th className="py-2.5 px-3">Porsiyon Maliyeti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/50">
                    <td className="py-3 px-3 text-slate-500">{formatDateTime(b.created_at)}</td>
                    <td className="py-3 px-3 font-bold uppercase">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${b.batch_type === 'et' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {b.batch_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold">{b.raw_weight_kg} kg</td>
                    <td className="py-3 px-3 font-semibold text-emerald-600">{b.cooked_weight_kg} kg</td>
                    <td className="py-3 px-3 text-rose-600">%{b.waste_percentage}</td>
                    <td className="py-3 px-3 text-emerald-600 font-bold">%{b.yield_percentage}</td>
                    <td className="py-3 px-3 font-bold">{b.usable_portions_count} Adet ({b.portion_size_g}g)</td>
                    <td className="py-3 px-3">{formatCurrency(b.batch_cost_tl)}</td>
                    <td className="py-3 px-3 font-bold text-brand-600">{formatCurrency(b.cost_per_portion_tl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
