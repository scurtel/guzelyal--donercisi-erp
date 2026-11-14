import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  History,
  FileCheck2,
  Trash2,
  Search,
  CheckCircle,
  Truck,
  TrendingDown,
  Layers,
} from 'lucide-react';
import {
  InventoryItem,
  InventoryTransaction,
  INVENTORY_TRANSACTION_LABELS,
  Account,
} from '../types';
import { formatCurrency, formatUnit, formatDateTime, formatDate, roundMoney } from '../utils/format';
import { dbService } from '../db/database';

interface InventoryModuleProps {
  inventoryItems: InventoryItem[];
  suppliers: Account[];
  onInventoryChanged: () => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  inventoryItems,
  suppliers,
  onInventoryChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'transactions'>('items');
  const [selectedCategory, setSelectedCategory] = useState<string>('Hepsi');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals
  const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);
  const [showWasteModal, setShowWasteModal] = useState<boolean>(false);
  const [showCountModal, setShowCountModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Form states
  const [purchaseQty, setPurchaseQty] = useState<number>(0);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'cash' | 'bank' | 'credit'>('cash');
  const [notes, setNotes] = useState<string>('');

  const categories = ['Hepsi', 'Et & Tavuk', 'Ekmek', 'Sebze', 'Sos', 'İçecek', 'Ambalaj', 'Kuru Gıda'];

  const transactions = dbService.getInventoryTransactions();

  const filteredItems = inventoryItems.filter((it) => {
    const matchesCat = selectedCategory === 'Hepsi' || it.category === selectedCategory;
    const matchesSearch = it.name.toLowerCase().includes(searchQuery.toLowerCase()) || it.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Calculate total inventory valuation
  const totalValuation = inventoryItems.reduce((acc, it) => acc + (it.current_quantity * it.average_cost), 0);
  const criticalCount = inventoryItems.filter((it) => it.current_quantity <= it.minimum_quantity).length;

  // Execute Purchase
  const handleConfirmPurchase = () => {
    if (!selectedItem || purchaseQty <= 0) {
      alert('Lütfen miktar giriniz.');
      return;
    }

    try {
      const totalAmount = roundMoney(purchaseQty * purchasePrice);
      // 1. Record stock transaction
      dbService.recordInventoryTransaction(
        selectedItem.id,
        'purchase',
        purchaseQty,
        purchasePrice,
        'purchase_invoice',
        '',
        notes || `${selectedItem.name} mal alımı`,
        'Yönetici'
      );

      // 2. Separate cash/accounting entry for purchasing stock (asset entry)
      dbService.saveExpense({
        category: selectedItem.category === 'Et & Tavuk' ? (selectedItem.name.includes('Tavuk') ? 'Tavuk alımı' : 'Et alımı') : selectedItem.category === 'Ekmek' ? 'Ekmek' : 'Sebze ve sos',
        amount: totalAmount,
        payment_method: paymentType,
        account_id: selectedItem.supplier_id || null,
        is_stock_purchase: true, // Marked as stock asset purchase!
        description: `${selectedItem.name} (${purchaseQty} ${selectedItem.unit}) hammadde alımı`,
      });

      setShowPurchaseModal(false);
      setSelectedItem(null);
      setPurchaseQty(0);
      setPurchasePrice(0);
      setNotes('');
      onInventoryChanged();
      alert('Mal alımı başarıyla stoka ve muhasebeye işlendi!');
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    }
  };

  // Execute Waste (Fire)
  const handleConfirmWaste = () => {
    if (!selectedItem || purchaseQty <= 0) return;
    try {
      dbService.recordInventoryTransaction(
        selectedItem.id,
        'waste_fire',
        purchaseQty,
        selectedItem.average_cost,
        'waste_report',
        '',
        notes || 'Bozulma / fire zayiatı',
        'Yönetici'
      );
      setShowWasteModal(false);
      setSelectedItem(null);
      setPurchaseQty(0);
      onInventoryChanged();
      alert('Fire ve zayiat kaydı stoka işlendi.');
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    }
  };

  // Execute Count Adjustment
  const handleConfirmCount = () => {
    if (!selectedItem) return;
    try {
      const diff = roundMoney(purchaseQty - selectedItem.current_quantity);
      dbService.recordInventoryTransaction(
        selectedItem.id,
        'count_adjustment',
        Math.abs(diff),
        selectedItem.average_cost,
        'stock_count',
        '',
        `Sayım düzeltmesi. Eski: ${selectedItem.current_quantity}, Yeni: ${purchaseQty}`,
        'Yönetici'
      );
      setShowCountModal(false);
      setSelectedItem(null);
      onInventoryChanged();
      alert('Stok sayım düzeltmesi başarıyla güncellendi.');
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Top Header & Valuation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Toplam Depo Stok Varlığı</span>
            <Boxes size={18} className="text-brand-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalValuation)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Ağırlıklı ortalama maliyetle değerlendirilmiş hammadde
          </div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Aktif Stok Kartları</span>
            <Layers size={18} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {inventoryItems.length} <span className="text-xs font-normal text-slate-400">Kalem</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Döner eti, ekmek, sebze, ambalaj ve sarf malzemeleri
          </div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Kritik Seviyedeki Stoklar</span>
            <AlertTriangle size={18} className={criticalCount > 0 ? 'text-red-500' : 'text-emerald-500'} />
          </div>
          <div className={`text-2xl font-black ${criticalCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {criticalCount} <span className="text-xs font-normal text-slate-400">Ürün</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {criticalCount > 0 ? 'Sipariş verilmesi gereken hammaddeler' : 'Tüm stoklar güvenli seviyede'}
          </div>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-navy-900 p-3 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'items'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <Boxes size={14} />
            <span>Stok Kartları Listesi</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'transactions'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <History size={14} />
            <span>Stok Hareketleri Denetim Kaydı</span>
          </button>
        </div>

        {activeTab === 'items' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Stok adı veya kod ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-lg text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {activeTab === 'items' ? (
        /* STOK KARTLARI TABLOSU */
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 overflow-hidden shadow-xs">
          <div className="p-3 bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-800 flex items-center gap-1.5 overflow-x-auto">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1 rounded-lg text-xs font-medium ${
                  selectedCategory === c
                    ? 'bg-brand-500 text-white font-semibold'
                    : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-navy-800">
                <tr>
                  <th className="py-3 px-4">Stok Kodu</th>
                  <th className="py-3 px-4">Malzeme Adı</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Mevcut Miktar</th>
                  <th className="py-3 px-4">Min. Stok</th>
                  <th className="py-3 px-4">Son Alış Fiyatı</th>
                  <th className="py-3 px-4">Ort. Maliyet</th>
                  <th className="py-3 px-4">Toplam Değer</th>
                  <th className="py-3 px-4">Tedarikçi</th>
                  <th className="py-3 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {filteredItems.map((item) => {
                  const isCritical = item.current_quantity <= item.minimum_quantity;
                  const itemValuation = roundMoney(item.current_quantity * item.average_cost);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-navy-800/40 transition-colors ${
                        isCritical ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-600 dark:text-navy-300">
                        {item.code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {isCritical && (
                            <span className="p-0.5 rounded bg-red-100 dark:bg-red-950 text-red-600 text-[9px] font-bold">
                              Kritik
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{item.category}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-black text-sm px-2 py-0.5 rounded ${
                            isCritical
                              ? 'text-red-600 bg-red-50 dark:bg-red-950/50'
                              : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                          }`}
                        >
                          {formatUnit(item.current_quantity, item.unit)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {formatUnit(item.minimum_quantity, item.unit)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(item.last_purchase_price)} / {item.unit}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {formatCurrency(item.average_cost)} / {item.unit}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(itemValuation)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 truncate max-w-[120px]">
                        {item.supplier_name || 'Genel Tedarikçi'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Mal Alımı */}
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setPurchasePrice(item.last_purchase_price || item.average_cost);
                            setShowPurchaseModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-semibold"
                        >
                          + Mal Alımı
                        </button>

                        {/* Fire */}
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowWasteModal(true);
                          }}
                          className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300"
                          title="Fire / Zayiat Düş"
                        >
                          Fire
                        </button>

                        {/* Sayım */}
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setPurchaseQty(item.current_quantity);
                            setShowCountModal(true);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300"
                          title="Sayım Düzeltmesi"
                        >
                          Sayım
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* STOK HAREKETLERİ DENETİM TABLOSU */
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              Stok Giriş ve Çıkış Hareketleri Tarihçesi
            </h3>
            <span className="text-xs text-slate-400">Son 200 İşlem</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-200 dark:border-navy-800">
                <tr>
                  <th className="py-2.5 px-3">Tarih</th>
                  <th className="py-2.5 px-3">Malzeme</th>
                  <th className="py-2.5 px-3">Hareket Türü</th>
                  <th className="py-2.5 px-3">Miktar</th>
                  <th className="py-2.5 px-3">Birim Maliyet</th>
                  <th className="py-2.5 px-3">Toplam Tutar</th>
                  <th className="py-2.5 px-3">Açıklama / Referans</th>
                  <th className="py-2.5 px-3">İşlemi Yapan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {transactions.map((t) => {
                  const isIncoming = ['purchase', 'production_in', 'return'].includes(t.transaction_type);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/50">
                      <td className="py-2.5 px-3 text-slate-500">{formatDateTime(t.created_at)}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-white">{t.item_name}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isIncoming
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          }`}
                        >
                          {INVENTORY_TRANSACTION_LABELS[t.transaction_type as any] || t.transaction_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-extrabold">
                        {isIncoming ? '+' : '-'}{formatUnit(t.quantity, t.unit)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {formatCurrency(t.unit_price)}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(t.total_cost)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">{t.notes || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-400">{t.created_by}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MAL ALIMI MODAL */}
      {showPurchaseModal && selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-navy-700 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
              <Plus size={18} className="text-emerald-500" />
              <span>Yeni Mal Alımı: {selectedItem.name}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Gelen Miktar ({selectedItem.unit}):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={purchaseQty || ''}
                  onChange={(e) => setPurchaseQty(parseFloat(e.target.value) || 0)}
                  placeholder={`Örn: 6 ${selectedItem.unit}`}
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Birim Alış Fiyatı (TL/{selectedItem.unit}):</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={purchasePrice || ''}
                  onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                  placeholder="Birim alış fiyatı"
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Ödeme Yöntemi / Cari:</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border rounded-lg"
                >
                  <option value="cash">Nakit Kasa (Nakit Çıkışı)</option>
                  <option value="bank">Banka / Havale (Banka Çıkışı)</option>
                  <option value="credit">Cari Borç (Veresiye Mal Alımı)</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg flex justify-between font-bold text-emerald-800 dark:text-emerald-300">
                <span>Toplam Fatura Tutarı:</span>
                <span>{formatCurrency(purchaseQty * purchasePrice)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                İptal
              </button>
              <button
                disabled={purchaseQty <= 0}
                onClick={handleConfirmPurchase}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30"
              >
                Stoka ve Kasaya Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIRE MODAL */}
      {showWasteModal && selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-navy-700 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-rose-600 flex items-center gap-2">
              <TrendingDown size={18} />
              <span>Fire ve Zayiat Düşüşü: {selectedItem.name}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Zayi Olan Miktar ({selectedItem.unit}):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={purchaseQty || ''}
                  onChange={(e) => setPurchaseQty(parseFloat(e.target.value) || 0)}
                  placeholder="Fire miktarı"
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Fire Sebebi:</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Bozulma, dökülme, kesim hatası..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowWasteModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Vazgeç
              </button>
              <button
                disabled={purchaseQty <= 0}
                onClick={handleConfirmWaste}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30"
              >
                Fireyi Düş
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAYIM MODAL */}
      {showCountModal && selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-navy-700 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
              <FileCheck2 size={18} className="text-brand-500" />
              <span>Depo Sayım Düzeltmesi: {selectedItem.name}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-100 dark:bg-navy-950 rounded-lg flex justify-between">
                <span>Sistemdeki Mevcut Miktar:</span>
                <span className="font-bold">{selectedItem.current_quantity} {selectedItem.unit}</span>
              </div>
              <div>
                <label className="block font-semibold mb-1">Fiziki Sayılan Gerçek Miktar ({selectedItem.unit}):</label>
                <input
                  type="number"
                  step="0.1"
                  value={purchaseQty}
                  onChange={(e) => setPurchaseQty(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border rounded-lg font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCountModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmCount}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/30"
              >
                Sayımı Kaydet ve Eşitle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
