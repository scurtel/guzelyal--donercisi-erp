import React, { useState } from 'react';
import {
  ChefHat,
  Plus,
  Trash2,
  Save,
  History,
  Layers,
  Percent,
  Coins,
  Scale,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Product, Recipe, InventoryItem } from '../types';
import { formatCurrency, formatPercent, formatUnit, formatDateTime, roundMoney } from '../utils/format';
import { dbService } from '../db/database';

interface RecipeModuleProps {
  products: Product[];
  inventoryItems: InventoryItem[];
  onRecipesChanged: () => void;
}

export const RecipeModule: React.FC<RecipeModuleProps> = ({
  products,
  inventoryItems,
  onRecipesChanged,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<number>(products[0]?.id || 5);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const recipe = selectedProduct?.recipe;

  // Recipe items editor state
  const [items, setItems] = useState<
    { inventory_item_id: number; quantity: number; notes: string }[]
  >(() => {
    return recipe?.items.map((it) => ({
      inventory_item_id: it.inventory_item_id,
      quantity: it.quantity,
      notes: it.notes || '',
    })) || [];
  });

  const [notes, setNotes] = useState<string>(recipe?.notes || '');

  // When selected product changes, reset items
  const handleSelectProduct = (productId: number) => {
    setSelectedProductId(productId);
    const p = products.find((pr) => pr.id === productId);
    if (p?.recipe) {
      setItems(
        p.recipe.items.map((it) => ({
          inventory_item_id: it.inventory_item_id,
          quantity: it.quantity,
          notes: it.notes || '',
        }))
      );
      setNotes(p.recipe.notes || '');
    } else {
      setItems([]);
      setNotes('');
    }
  };

  const handleAddItem = () => {
    const defaultItem = inventoryItems[0];
    if (!defaultItem) return;
    setItems([
      ...items,
      {
        inventory_item_id: defaultItem.id,
        quantity: defaultItem.unit === 'kg' ? 0.100 : 1,
        notes: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
  };

  const handleUpdateItem = (index: number, field: string, val: any) => {
    const next = [...items];
    (next[index] as any)[field] = val;
    setItems(next);
  };

  // Real-time calculated costs
  let calculatedMaterialCost = 0;
  let calculatedPackagingCost = 0;

  items.forEach((it) => {
    const inv = inventoryItems.find((ii) => ii.id === it.inventory_item_id);
    if (inv) {
      const lineCost = roundMoney(it.quantity * inv.average_cost);
      if (inv.category === 'Ambalaj') {
        calculatedPackagingCost += lineCost;
      } else {
        calculatedMaterialCost += lineCost;
      }
    }
  });

  const calculatedDirectCost = roundMoney(calculatedMaterialCost + calculatedPackagingCost);
  const salePrice = selectedProduct?.base_price || 0;
  const grossContribution = roundMoney(salePrice - calculatedDirectCost);
  const marginPercent = salePrice > 0 ? roundMoney((grossContribution / salePrice) * 100) : 0;
  const commissionImpact = roundMoney(salePrice * 0.15); // Yemeksepeti 15%
  const afterCommissionContribution = roundMoney(grossContribution - commissionImpact);

  // Save Recipe
  const handleSaveRecipe = () => {
    if (!selectedProduct) return;
    try {
      dbService.saveRecipe(selectedProduct.id, items, notes, 'Yönetici');
      alert(`"${selectedProduct.name}" reçetesi ve porsiyon maliyetleri başarıyla kaydedildi!`);
      onRecipesChanged();
    } catch (err: any) {
      alert(`Kayıt hatası: ${err.message}`);
    }
  };

  const recipeHistory = dbService.getRecipeHistory(selectedProductId);

  return (
    <div className="space-y-6 pb-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ChefHat size={20} className="text-brand-500" />
            <span>Reçete, Porsiyon ve Katkı Marjı Mühendisliği</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Her ürünün gramajını, hammadde maliyetini, ambalaj giderini ve platform komisyonu sonrası net kârlılığını yönetin.
          </p>
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
        >
          <History size={14} />
          <span>{showHistory ? 'Düzenleme Moduna Dön' : 'Reçete Tarihçesi'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: PRODUCTS LIST (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs space-y-2 max-h-[750px] overflow-y-auto">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">
            Menüdeki Ürünler ({products.length})
          </div>

          {products.map((p) => {
            const isSelected = p.id === selectedProductId;
            const r = p.recipe;

            return (
              <button
                key={p.id}
                onClick={() => handleSelectProduct(p.id)}
                className={`w-full p-3 rounded-xl text-left transition-all border ${
                  isSelected
                    ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-500 text-slate-900 dark:text-white ring-1 ring-brand-500 shadow-xs'
                    : 'border-slate-100 dark:border-navy-800/80 hover:bg-slate-50 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs truncate max-w-[170px]">{p.name}</span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(p.base_price)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Maliyet: {r ? formatCurrency(r.total_direct_cost) : 'Tanımlanmamış'}</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {r ? `Brüt: ${formatCurrency(r.gross_margin_amount)}` : ''}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* RIGHT: RECIPE EDITOR & ENGINEERING CALCULATOR (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {!showHistory ? (
            <>
              {/* Engineering Metrics Dashboard for Selected Product */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-navy-900 p-3.5 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs">
                  <div className="text-[10px] text-slate-400 font-medium">Hammadde Maliyeti</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    {formatCurrency(calculatedMaterialCost)}
                  </div>
                  <div className="text-[9px] text-slate-400">Et, ekmek, sos, sebze</div>
                </div>

                <div className="bg-white dark:bg-navy-900 p-3.5 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs">
                  <div className="text-[10px] text-slate-400 font-medium">Ambalaj Maliyeti</div>
                  <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                    {formatCurrency(calculatedPackagingCost)}
                  </div>
                  <div className="text-[9px] text-slate-400">Kağıt, kutu, poşet</div>
                </div>

                <div className="bg-white dark:bg-navy-900 p-3.5 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs">
                  <div className="text-[10px] text-slate-400 font-medium">Brüt Katkı Tutarı</div>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatCurrency(grossContribution)}
                  </div>
                  <div className="text-[9px] text-emerald-600 font-semibold">
                    Marj: {formatPercent(marginPercent)}
                  </div>
                </div>

                <div className="bg-white dark:bg-navy-900 p-3.5 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs">
                  <div className="text-[10px] text-slate-400 font-medium">Kanal Komisyonu Sonrası</div>
                  <div className="text-lg font-black text-brand-600 dark:text-brand-400 mt-0.5">
                    {formatCurrency(afterCommissionContribution)}
                  </div>
                  <div className="text-[9px] text-slate-400">Yemeksepeti %15 sonrası</div>
                </div>
              </div>

              {/* Recipe Items Form Table */}
              <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                      "{selectedProduct?.name}" Reçete Bileşenleri
                    </h3>
                    <p className="text-xs text-slate-400">
                      Reçetedeki her bir gramaj stoktan düşüşü ve doğrudan ürün maliyetini belirler.
                    </p>
                  </div>

                  <button
                    onClick={handleAddItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 hover:bg-brand-100 border border-brand-200 dark:border-brand-800/60"
                  >
                    <Plus size={14} />
                    <span>Malzeme Ekle</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {items.map((it, idx) => {
                    const inv = inventoryItems.find((ii) => ii.id === it.inventory_item_id);
                    const lineCost = inv ? roundMoney(it.quantity * inv.average_cost) : 0;

                    return (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200 dark:border-navy-800/80 flex flex-col sm:flex-row sm:items-center gap-3 text-xs"
                      >
                        {/* Item Select */}
                        <div className="flex-1">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                            Hammadde / Malzeme:
                          </label>
                          <select
                            value={it.inventory_item_id}
                            onChange={(e) => handleUpdateItem(idx, 'inventory_item_id', parseInt(e.target.value))}
                            className="w-full bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-lg p-1.5 font-medium"
                          >
                            {inventoryItems.map((ii) => (
                              <option key={ii.id} value={ii.id}>
                                {ii.name} ({ii.unit}) — {formatCurrency(ii.average_cost)}/{ii.unit}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="w-28">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                            Miktar ({inv?.unit || ''}):
                          </label>
                          <input
                            type="number"
                            step="0.005"
                            min="0.001"
                            value={it.quantity}
                            onChange={(e) => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-lg p-1.5 font-bold text-center"
                          />
                        </div>

                        {/* Notes */}
                        <div className="w-40">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                            Açıklama / Porsiyon Notu:
                          </label>
                          <input
                            type="text"
                            placeholder="Örn: 110g Et, 1 Lavaş..."
                            value={it.notes}
                            onChange={(e) => handleUpdateItem(idx, 'notes', e.target.value)}
                            className="w-full bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-lg p-1.5"
                          />
                        </div>

                        {/* Cost */}
                        <div className="w-24 text-right">
                          <div className="text-[10px] text-slate-400">Bileşen Maliyeti</div>
                          <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                            {formatCurrency(lineCost)}
                          </div>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500">
                    Toplam {items.length} bileşen tanımlandı. Reçete kaydedildiğinde versiyon numarası otomatik artar.
                  </div>

                  <button
                    onClick={handleSaveRecipe}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                  >
                    <Save size={15} />
                    <span>Reçeteyi ve Maliyetleri Kaydet</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* RECIPE HISTORY */
            <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                "{selectedProduct?.name}" Reçete Değişiklik Geçmişi
              </h3>

              <div className="space-y-3">
                {recipeHistory.map((h) => (
                  <div
                    key={h.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs space-y-2"
                  >
                    <div className="flex justify-between font-bold">
                      <span>{h.change_summary}</span>
                      <span className="text-slate-400 font-normal">{formatDateTime(h.created_at)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Değişikliği Yapan: <strong className="text-slate-700 dark:text-slate-300">{h.changed_by}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
