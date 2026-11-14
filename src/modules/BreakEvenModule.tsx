import React, { useState } from 'react';
import {
  Target,
  DollarSign,
  TrendingUp,
  Percent,
  Calculator,
  Flame,
  CheckCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatPercent, roundMoney } from '../utils/format';
import { dbService } from '../db/database';

export const BreakEvenModule: React.FC = () => {
  const analysis = dbService.getBreakEvenAnalysis();

  const [dailyFixed, setDailyFixed] = useState<number>(analysis.fixedExpensesDaily);
  const [targetProfit, setTargetProfit] = useState<number>(analysis.targetProfitDaily);
  const [singleDonerType, setSingleDonerType] = useState<'mixed' | 'et' | 'tavuk'>('mixed');

  // Products
  const etDurum = dbService.getProduct(5); // Et dürüm (320 TL)
  const tvkDurum = dbService.getProduct(2); // Tavuk dürüm (180 TL)

  const etMargin = etDurum?.recipe ? etDurum.recipe.gross_margin_amount : 210;
  const tvkMargin = tvkDurum?.recipe ? tvkDurum.recipe.gross_margin_amount : 120;
  const mixedMargin = roundMoney((etMargin + tvkMargin) / 2);

  const activeMargin =
    singleDonerType === 'et' ? etMargin : singleDonerType === 'tavuk' ? tvkMargin : mixedMargin;

  // Recalculate
  const donerCountNeeded = activeMargin > 0 ? Math.ceil(dailyFixed / activeMargin) : 0;
  const donerCountForTarget = activeMargin > 0 ? Math.ceil((dailyFixed + targetProfit) / activeMargin) : 0;

  const currentDonersSold = analysis.currentTodayDonersSold;
  const progressPercent = donerCountNeeded > 0 ? Math.min(150, roundMoney((currentDonersSold / donerCountNeeded) * 100)) : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Top Highlighted Question Card */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 p-8 rounded-3xl border border-navy-800 shadow-2xl text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-400 border border-brand-500/30 mb-3">
            <Sparkles size={14} />
            <span>Kritik İşletme Sorusu</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            "Bugün zarar etmemek için kaç adet döner satmam gerekiyor?"
          </h2>

          <div className="mt-6 flex flex-wrap items-baseline gap-4">
            <div className="text-5xl sm:text-6xl font-black text-brand-400">
              {donerCountNeeded} <span className="text-xl sm:text-2xl font-bold text-white">Adet</span>
            </div>
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-emerald-400">Şu ana kadar satılan: {currentDonersSold} Adet</span>
              <p className="text-slate-400 mt-0.5">
                Kalan gereken satış: <strong className="text-white">{Math.max(0, donerCountNeeded - currentDonersSold)} Adet</strong>
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 space-y-1.5 max-w-lg">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Başabaş Eşiği Karşılama:</span>
              <span className={progressPercent >= 100 ? 'text-emerald-400' : 'text-amber-400'}>
                %{progressPercent}
              </span>
            </div>
            <div className="w-full h-3 bg-navy-800 rounded-full overflow-hidden p-0.5 border border-navy-700">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progressPercent >= 100
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-amber-500 to-brand-500'
                }`}
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Target & Calculation Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Fixed Costs & Target Parameters */}
        <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
            <Calculator size={16} className="text-brand-500" />
            <span>Sabit Gider ve Hedef Parametreleri</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Günlük Sabit İşletme Gideri (TL):
              </label>
              <input
                type="number"
                step="50"
                value={dailyFixed}
                onChange={(e) => setDailyFixed(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl font-bold"
              />
              <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
                <div>• Ahmet Usta: 3.300 TL</div>
                <div>• Mehmet (Personel): 1.350 TL</div>
                <div>• Günlük Dükkan Kirası: 900 TL</div>
                <div>• Toplam Standart: 5.550 TL / gün</div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hedeflenen Günlük Net Kâr (TL):
              </label>
              <input
                type="number"
                step="500"
                value={targetProfit}
                onChange={(e) => setTargetProfit(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl font-bold text-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hesaplama Bazı:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setSingleDonerType('mixed')}
                  className={`py-1.5 rounded-lg text-xs font-bold ${
                    singleDonerType === 'mixed'
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Satış Karması
                </button>
                <button
                  onClick={() => setSingleDonerType('et')}
                  className={`py-1.5 rounded-lg text-xs font-bold ${
                    singleDonerType === 'et'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Sadece Et
                </button>
                <button
                  onClick={() => setSingleDonerType('tavuk')}
                  className={`py-1.5 rounded-lg text-xs font-bold ${
                    singleDonerType === 'tavuk'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Sadece Tavuk
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown of Results */}
        <div className="lg:col-span-2 bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white">
            Detaylı Başabaş Eşik Cetveli
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-1">
              <span className="text-slate-400">Porsiyon Başına Katkı Marjı:</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {formatCurrency(activeMargin)}
              </div>
              <p className="text-[10px] text-slate-400">
                {singleDonerType === 'mixed'
                  ? 'Et (%50) ve Tavuk (%50) ortalama katkı tutarı'
                  : singleDonerType === 'et'
                  ? '110g Et Dürüm birim katkısı'
                  : '100g Tavuk Dürüm birim katkısı'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-1">
              <span className="text-slate-400">Zarar Etmemek İçin Asgari Günlük Ciro:</span>
              <div className="text-2xl font-black text-brand-600 dark:text-brand-400">
                {formatCurrency(analysis.dailyBreakEvenRevenue)}
              </div>
              <p className="text-[10px] text-slate-400">
                Sabit giderleri karşılamak için yapılması gereken taban ciro
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-1">
              <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                Hedef Kâr İçin Gereken Satış:
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {donerCountForTarget} <span className="text-xs font-normal">Adet Döner</span>
              </div>
              <p className="text-[10px] text-slate-500">
                {formatCurrency(targetProfit)} net kâr elde etmek için günlük satış hedefi
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-1">
              <span className="text-slate-400">Aylık Asgari Satış Adedi:</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {donerCountNeeded * 30} <span className="text-xs font-normal">Adet / Ay</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Aylık sabit giderleri ({formatCurrency(dailyFixed * 30)}) karşılamak için
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
