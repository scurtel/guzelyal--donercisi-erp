import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  MapPin,
  FileText,
  ShoppingBag,
  Edit2,
  Trash2,
  ExternalLink,
  Check,
  Copy,
  Clock,
  Coins,
  ChevronRight,
  UtensilsCrossed,
} from 'lucide-react';
import { Customer } from '../types';
import { formatCurrency, formatDateTime } from '../utils/format';
import { dbService } from '../db/database';

interface CustomerModuleProps {
  onNavigateToPos?: (customer: Customer) => void;
  onCustomerUpdated?: () => void;
}

export const CustomerModule: React.FC<CustomerModuleProps> = ({
  onNavigateToPos,
  onCustomerUpdated,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [lastOrderNotes, setLastOrderNotes] = useState('');
  const [formError, setFormError] = useState('');

  const loadCustomers = () => {
    try {
      const list = dbService.getCustomers(searchQuery);
      setCustomers(list);
    } catch (e) {
      console.error('Failed to load customers:', e);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [searchQuery]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFullName('');
    setPhone('');
    setAddress('');
    setNotes('');
    setLastOrderNotes('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFullName(c.full_name);
    setPhone(c.phone);
    setAddress(c.address);
    setNotes(c.notes || '');
    setLastOrderNotes(c.last_order_notes || '');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError('Lütfen müşteri isim ve soyismini giriniz.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Lütfen telefon numarasını giriniz.');
      return;
    }
    if (!address.trim()) {
      setFormError('Lütfen teslimat adresini giriniz.');
      return;
    }

    try {
      if (editingCustomer) {
        dbService.updateCustomer(editingCustomer.id, {
          full_name: fullName,
          phone,
          address,
          notes,
          last_order_notes: lastOrderNotes,
        });
      } else {
        dbService.addCustomer({
          full_name: fullName,
          phone,
          address,
          notes,
          last_order_notes: lastOrderNotes,
        });
      }

      setIsAddModalOpen(false);
      loadCustomers();
      if (onCustomerUpdated) onCustomerUpdated();
    } catch (err: any) {
      setFormError(err.message || 'Müşteri kaydedilirken bir hata oluştu.');
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`"${name}" isimli müşteriyi silmek istediğinizden emin misiniz?`)) {
      dbService.deleteCustomer(id);
      loadCustomers();
      if (onCustomerUpdated) onCustomerUpdated();
    }
  };

  const handleCopyAddress = (id: number, addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics
  const totalCustomers = customers.length;
  const totalOrders = customers.reduce((acc, c) => acc + (c.total_orders_count || 0), 0);
  const totalSpent = customers.reduce((acc, c) => acc + (c.total_spent || 0), 0);
  const averageSpent = totalOrders > 0 ? totalSpent / totalOrders : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-500 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span>Müşteri Kayıt & Sipariş Rehberi</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-semibold border border-brand-200 dark:border-brand-800">
                {totalCustomers} Kayıt
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Paket servis, telefon siparişleri ve gel-al müşterilerinizi isim ve telefonla anında bulun ve siparişe aktarın.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/20 transition-all cursor-pointer shrink-0"
        >
          <UserPlus size={16} />
          <span>Yeni Müşteri Kaydet</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Kayıtlı Müşteri</span>
            <Users size={16} className="text-brand-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-white">
            {totalCustomers}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Rehberde aktif</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Toplam Sipariş</span>
            <ShoppingBag size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-white">
            {totalOrders} Adet
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Telefon / Paket teslimat</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Müşteri Cirosu</span>
            <Coins size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalSpent)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Kayıtlı müşterilerden</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Ort. Sipariş Tutarı</span>
            <UtensilsCrossed size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {formatCurrency(averageSpent)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Müşteri sepet ortalaması</div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="İsim soyisim, telefon numarası veya adres yazarak arayın... (Örn: Ahmet veya 0532)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500 shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            Temizle
          </button>
        )}
      </div>

      {/* Customer List / Table */}
      {customers.length === 0 ? (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-400 flex items-center justify-center mx-auto">
            <Users size={28} />
          </div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {searchQuery ? 'Aramanıza Uygun Müşteri Bulunamadı' : 'Henüz Kayıtlı Müşteri Yok'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `"${searchQuery}" ile eşleşen bir isim, telefon veya adres kaydı bulunamadı.`
              : 'Telefon siparişi veren veya paket servis müşterilerinizi ekleyerek hızlı sipariş alabilirsiniz.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-400 border border-brand-200 dark:border-brand-800"
          >
            <UserPlus size={14} />
            <span>Yeni Müşteri Ekle</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customers.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-5 shadow-xs hover:border-brand-400/50 dark:hover:border-brand-500/50 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header row: Name, Badge, Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-amber-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                      {c.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 dark:text-white leading-tight">
                        {c.full_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 mt-0.5">
                        <Phone size={12} />
                        <a href={`tel:${c.phone}`} className="hover:underline">
                          {c.phone}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      title="Düzenle"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.full_name)}
                      title="Sil"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Address Box */}
                <div className="bg-slate-50 dark:bg-navy-950 p-2.5 rounded-xl border border-slate-100 dark:border-navy-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-rose-500" />
                      Teslimat Adresi
                    </span>
                    <button
                      onClick={() => handleCopyAddress(c.id, c.address)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
                    >
                      {copiedId === c.id ? (
                        <>
                          <Check size={11} className="text-emerald-500" />
                          <span className="text-[10px] text-emerald-500">Kopyalandı</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span className="text-[10px]">Kopyala</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 text-xs leading-relaxed font-normal">
                    {c.address}
                  </p>
                </div>

                {/* Order Notes / Preferences */}
                {(c.last_order_notes || c.notes) && (
                  <div className="p-2.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                    {c.last_order_notes && (
                      <div className="flex items-start gap-1.5 text-amber-700 dark:text-amber-300">
                        <ShoppingBag size={12} className="shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold">Son / Tercih Edilen Sipariş:</span>{' '}
                          <span>{c.last_order_notes}</span>
                        </div>
                      </div>
                    )}
                    {c.notes && (
                      <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                        <FileText size={12} className="shrink-0 mt-0.5 text-slate-400" />
                        <div>
                          <span className="font-medium text-slate-400">Müşteri Notu:</span>{' '}
                          <span>{c.notes}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Footer: Stats & Order Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white">{c.total_orders_count || 0}</span>{' '}
                    Sipariş
                  </div>
                  <div>•</div>
                  <div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(c.total_spent || 0)}
                    </span>
                  </div>
                </div>

                {onNavigateToPos && (
                  <button
                    onClick={() => onNavigateToPos(c)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Siparişe Aktar</span>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-white">
                <Users size={18} className="text-brand-500" />
                <span>{editingCustomer ? 'Müşteri Bilgilerini Düzenle' : 'Yeni Müşteri Kaydı'}</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-semibold"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Müşteri İsim Soyisim <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ahmet Yılmaz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telefon Numarası <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 0532 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Teslimat Adresi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Mahalle, Cadde, Sokak, Apartman No, Kat, Daire ve Tarif..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Order / Preferences Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sipariş / Tercih Notu (İsteğe bağlı)
                </label>
                <input
                  type="text"
                  placeholder="Örn: 2x Tavuk Dürüm (Lavaş), Bol soslu, acısız"
                  value={lastOrderNotes}
                  onChange={(e) => setLastOrderNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Special Customer Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Genel Not / Kurye Açıklaması (İsteğe bağlı)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Zili çalmayın, kapıya bırakın veya kapıda nakit"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-navy-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/20 transition-all"
                >
                  {editingCustomer ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
