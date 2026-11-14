import React, { useState } from 'react';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Building,
  Users,
  Calendar,
  Plus,
  Coins,
  Receipt,
  FileCheck2,
  DollarSign,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle,
  Trash2,
  Download,
  Sparkles,
  Clock,
  Filter,
} from 'lucide-react';
import {
  CashRegister,
  Expense,
  Account,
  CashClosing,
  ExpenseCategory,
  User,
} from '../types';
import { formatCurrency, formatDateTime, formatDate, roundMoney } from '../utils/format';
import { dbService } from '../db/database';

interface AccountingModuleProps {
  currentUser: User;
  onFinancialChanged: () => void;
  initialTab?: 'registers' | 'expenses' | 'accounts' | 'closings' | 'pl_statement';
}

export const AccountingModule: React.FC<AccountingModuleProps> = ({
  currentUser,
  onFinancialChanged,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<
    'registers' | 'expenses' | 'accounts' | 'closings' | 'pl_statement'
  >(initialTab || 'expenses');

  const registers = dbService.getCashRegisters();
  const expenses = dbService.getExpenses();
  const accounts = dbService.getAccounts();
  const closings = dbService.getCashClosings();
  const cashTransactions = dbService.getCashTransactions();

  // Date helper functions
  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getYesterdayDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalDateString(d);
  };

  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [showClosingModal, setShowClosingModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Expense Date Filter Mode
  const [dateFilterMode, setDateFilterMode] = useState<'today' | 'yesterday' | 'custom' | 'all'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());

  // Inline Daily Expense Entry Form State
  const [entryDate, setEntryDate] = useState<string>(getLocalDateString());
  const [entryCategory, setEntryCategory] = useState<ExpenseCategory>('Sebze ve sos');
  const [entryAmount, setEntryAmount] = useState<string>('');
  const [entryPaymentMethod, setEntryPaymentMethod] = useState<'cash' | 'bank' | 'credit'>('cash');
  const [entryAccountId, setEntryAccountId] = useState<number | null>(null);
  const [entryDescription, setEntryDescription] = useState<string>('');
  const [entryReceiptNo, setEntryReceiptNo] = useState<string>('');
  const [entryIsStockPurchase, setEntryIsStockPurchase] = useState<boolean>(false);

  // Modal Expense Form Inputs
  const [expenseDate, setExpenseDate] = useState<string>(getLocalDateString());
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Personel');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'credit'>('cash');
  const [expenseAccountId, setExpenseAccountId] = useState<number | null>(null);
  const [expenseDescription, setExpenseDescription] = useState<string>('');
  const [isStockPurchase, setIsStockPurchase] = useState<boolean>(false);
  const [receiptNo, setReceiptNo] = useState<string>('');

  // Closing inputs
  const [countedCash, setCountedCash] = useState<number>(0);
  const [countedCard, setCountedCard] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState<string>('');

  // Payment input
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentRegisterType, setPaymentRegisterType] = useState<'cash' | 'bank'>('cash');
  const [paymentDesc, setPaymentDesc] = useState<string>('');

  const expenseCategories: ExpenseCategory[] = [
    'Et alımı',
    'Tavuk alımı',
    'Ekmek',
    'Sebze ve sos',
    'Personel',
    'Kira',
    'Elektrik',
    'Su',
    'Doğalgaz',
    'İnternet ve telefon',
    'Ambalaj',
    'Yemeksepeti komisyonu',
    'Reklam',
    'Kurye ve lojistik',
    'Vergi ve diğer giderler',
  ];

  const quickExpensePresets: {
    label: string;
    category: ExpenseCategory;
    desc: string;
    isStock: boolean;
  }[] = [
    { label: '🥖 Lavaş / Ekmek', category: 'Ekmek', desc: 'Taş fırından taze lavaş & ekmek alımı', isStock: false },
    { label: '🥬 Sebze & Hal', category: 'Sebze ve sos', desc: 'Domates, soğan, marul, limon ve yeşillik', isStock: false },
    { label: '🥩 Dana / Kuzu Eti', category: 'Et alımı', desc: 'Dönerlik taze parça et', isStock: true },
    { label: '🍗 Tavuk Döner Eti', category: 'Tavuk alımı', desc: 'Dönerlik tavuk but ve göğüs', isStock: true },
    { label: '👨‍🍳 Usta / Personel', category: 'Personel', desc: 'Günlük usta / personel yevmiyesi', isStock: false },
    { label: '🛵 Kurye Yakıtı', category: 'Kurye ve lojistik', desc: 'Paket servis motosiklet yakıtı', isStock: false },
    { label: '📦 Ambalaj & Poşet', category: 'Ambalaj', desc: 'Döner kutusu, kese kağıdı, peçete', isStock: false },
    { label: '🔥 Tüp / Doğalgaz', category: 'Doğalgaz', desc: 'Döner ocağı tüp dolumu', isStock: false },
    { label: '🧼 Temizlik & Sarf', category: 'Vergi ve diğer giderler', desc: 'Deterjan, peçete, mutfak sarf malzemesi', isStock: false },
  ];

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Et alımı':
        return 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-900/60';
      case 'Tavuk alımı':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-900/60';
      case 'Ekmek':
        return 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200 dark:border-orange-900/60';
      case 'Sebze ve sos':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60';
      case 'Personel':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-900/60';
      case 'Kira':
      case 'Elektrik':
      case 'Su':
      case 'Doğalgaz':
      case 'İnternet ve telefon':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-900/60';
      case 'Ambalaj':
        return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900/60';
      case 'Kurye ve lojistik':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-navy-800 dark:text-slate-300 border-slate-200 dark:border-navy-700';
    }
  };

  // Filtered expenses based on selected date
  const filteredExpenses = expenses.filter((e) => {
    if (dateFilterMode === 'all') return true;
    const expDateOnly = (e.expense_date || '').split('T')[0];
    return expDateOnly === selectedDate;
  });

  const dailyTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const dailyCash = filteredExpenses.filter((e) => e.payment_method === 'cash').reduce((sum, e) => sum + e.amount, 0);
  const dailyBank = filteredExpenses.filter((e) => e.payment_method === 'bank').reduce((sum, e) => sum + e.amount, 0);
  const dailyCredit = filteredExpenses.filter((e) => e.payment_method === 'credit').reduce((sum, e) => sum + e.amount, 0);
  const dailyStockPurchases = filteredExpenses.filter((e) => e.is_stock_purchase === 1).reduce((sum, e) => sum + e.amount, 0);
  const dailyOpExpenses = filteredExpenses.filter((e) => e.is_stock_purchase === 0).reduce((sum, e) => sum + e.amount, 0);

  const getSelectedDateDisplay = () => {
    if (dateFilterMode === 'all') return 'Tüm Zamanlar Harcama Özeti';
    if (selectedDate === getLocalDateString()) return `Bugün (${formatDate(selectedDate)})`;
    if (selectedDate === getYesterdayDateString()) return `Dün (${formatDate(selectedDate)})`;
    return formatDate(selectedDate);
  };

  // Save Expense from Inline Daily Form
  const handleSaveInlineExpense = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const amt = parseFloat(entryAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Lütfen geçerli bir harcama tutarı giriniz.');
      return;
    }
    if (!entryDescription.trim()) {
      alert('Lütfen harcama açıklaması giriniz (Örn: Taş fırın lavaş, Ahmet usta yevmiye vb.).');
      return;
    }

    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const fullDateTime = `${entryDate}T${timeStr}`;

      dbService.saveExpense({
        category: entryCategory,
        amount: amt,
        payment_method: entryPaymentMethod,
        account_id: entryPaymentMethod === 'credit' ? entryAccountId : null,
        is_stock_purchase: entryIsStockPurchase,
        expense_date: fullDateTime,
        description: entryDescription.trim(),
        receipt_no: entryReceiptNo.trim(),
        created_by: currentUser.display_name,
      });

      setEntryAmount('');
      setEntryDescription('');
      setEntryReceiptNo('');
      setEntryIsStockPurchase(false);
      onFinancialChanged();
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    }
  };

  // Save Expense from Modal
  const handleSaveExpense = () => {
    if (expenseAmount <= 0 || !expenseDescription.trim()) {
      alert('Lütfen geçerli tutar ve açıklama giriniz.');
      return;
    }

    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const fullDateTime = `${expenseDate}T${timeStr}`;

      dbService.saveExpense({
        category: expenseCategory,
        amount: expenseAmount,
        payment_method: paymentMethod,
        account_id: paymentMethod === 'credit' ? expenseAccountId : null,
        is_stock_purchase: isStockPurchase,
        expense_date: fullDateTime,
        description: expenseDescription.trim(),
        receipt_no: receiptNo.trim(),
        created_by: currentUser.display_name,
      });

      setShowExpenseModal(false);
      setExpenseAmount(0);
      setExpenseDescription('');
      setReceiptNo('');
      setIsStockPurchase(false);
      onFinancialChanged();
      alert('Gider işlemi kaydedildi ve kasa güncellendi.');
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    }
  };

  // Delete Expense & Revert Cash/Bank
  const handleDeleteExpense = (exp: Expense) => {
    const confirmMsg = `"${exp.description}" tutarındaki (${formatCurrency(exp.amount)}) harcamayı silmek istediğinize emin misiniz?\n\nÖdeme şekli "${exp.payment_method === 'cash' ? 'Nakit Kasa' : exp.payment_method === 'bank' ? 'Banka POS' : 'Cari Borç'}" olup, tutar kasaya/hesaba otomatik iade edilecektir.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      dbService.deleteExpense(exp.id);
      onFinancialChanged();
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    }
  };

  // Export Daily Expenses to CSV
  const handleExportExpensesCSV = () => {
    if (filteredExpenses.length === 0) {
      alert('Dışa aktarılacak harcama kaydı bulunamadı.');
      return;
    }

    const headers = ['Tarih / Saat', 'Gider Kategorisi', 'Açıklama', 'Ödeme Şekli', 'Tür', 'Fiş/Fatura No', 'Ekleyen', 'Tutar (TL)'];
    const rows = filteredExpenses.map((e) => [
      `"${formatDateTime(e.expense_date)}"`,
      `"${e.category}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${e.payment_method === 'cash' ? 'Nakit Kasa' : e.payment_method === 'bank' ? 'Banka POS' : 'Cari Borç'}"`,
      `"${e.is_stock_purchase === 1 ? 'Stok Alımı' : 'İşletme Gideri'}"`,
      `"${e.receipt_no || ''}"`,
      `"${e.created_by || ''}"`,
      e.amount.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `guzelyali-donercisi-harcamalar-${dateFilterMode === 'all' ? 'tum-zamanlar' : selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Perform End-of-Day Closing (Z-Raporu)
  const handleSaveClosing = () => {
    try {
      const closing = dbService.recordCashClosing({
        closing_date: new Date().toISOString().split('T')[0],
        counted_cash: countedCash,
        counted_card: countedCard,
        notes: closingNotes,
        closed_by: currentUser.display_name,
      });

      setShowClosingModal(false);
      onFinancialChanged();
      alert(`Gün sonu kasa kapanışı tamamlandı! Kasa farkı: ${formatCurrency(closing.cash_variance)}`);
    } catch (err: any) {
      alert(`Kapanış hatası: ${err.message}`);
    }
  };

  // Supplier / Staff payment
  const handleSavePayment = () => {
    if (!selectedAccount || paymentAmount <= 0) return;
    try {
      dbService.recordAccountPayment(
        selectedAccount.id,
        paymentAmount,
        paymentRegisterType,
        paymentDesc || `${selectedAccount.name} cari ödemesi`,
        currentUser.display_name
      );
      setShowPaymentModal(false);
      setSelectedAccount(null);
      setPaymentAmount(0);
      setPaymentDesc('');
      onFinancialChanged();
      alert('Cari ödeme başarıyla işlendi ve kasa güncellendi.');
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    }
  };

  // P&L Metrics calculation
  const totalRevenue = dbService.query<{ total: number }>('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = "completed"')[0]?.total || 0;
  const totalCogs = dbService.query<{ total: number }>('SELECT COALESCE(SUM(cogs_total), 0) as total FROM orders WHERE status = "completed"')[0]?.total || 0;
  const grossProfit = roundMoney(totalRevenue - totalCogs);
  const operatingExpenses = expenses.filter((e) => e.is_stock_purchase === 0).reduce((sum, e) => sum + e.amount, 0);
  const netOperatingProfit = roundMoney(grossProfit - operatingExpenses);

  return (
    <div className="space-y-6 pb-8">
      {/* Top Navigation & Fast Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-navy-900 p-3 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('registers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'registers'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <Coins size={14} />
            <span>Kasa & Banka Hareketleri</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'expenses'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <TrendingDown size={14} />
            <span>Giderler ({expenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'accounts'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <Users size={14} />
            <span>Tedarikçi & Personel Carileri</span>
          </button>

          <button
            onClick={() => setActiveTab('closings')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'closings'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <FileCheck2 size={14} />
            <span>Gün Sonu Kapanışı (Z-Raporu)</span>
          </button>

          <button
            onClick={() => setActiveTab('pl_statement')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'pl_statement'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <Receipt size={14} />
            <span>Aylık Kâr-Zarar Tablosu (P&L)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            <Plus size={14} />
            <span>Gider Ekle</span>
          </button>

          <button
            onClick={() => {
              setCountedCash(registers.find((r) => r.type === 'cash')?.balance || 0);
              setCountedCard(registers.find((r) => r.type === 'bank')?.balance || 0);
              setShowClosingModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            <FileCheck2 size={14} />
            <span>Gün Sonu Yap</span>
          </button>
        </div>
      </div>

      {/* ACCOUNTING NOTICE BADGE */}
      <div className="bg-slate-50 dark:bg-navy-950 p-3 rounded-xl border border-slate-200 dark:border-navy-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="text-brand-500 shrink-0" />
          <span>
            <strong>Muhasebe Prensibi:</strong> Hammadde alımları depoya stok varlığı olarak işlenir; P&L tablosunda doğrudan ürün maliyeti (SMM) yalnızca satış anında reçete düşüşüyle hesaplanır.
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          KDV Oranları: %1, %10, %20
        </span>
      </div>

      {activeTab === 'registers' && (
        <div className="space-y-6">
          {/* Registers cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {registers.map((reg) => (
              <div
                key={reg.id}
                className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>{reg.name}</span>
                  {reg.type === 'cash' ? <Coins size={16} className="text-emerald-500" /> : <CreditCard size={16} className="text-blue-500" />}
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(reg.balance)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 capitalize">
                  Hesap Türü: {reg.type === 'cash' ? 'Nakit Kasa' : reg.type === 'bank' ? 'Banka POS' : 'Yemeksepeti Alacak'}
                </div>
              </div>
            ))}
          </div>

          {/* Cash Transactions Table */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              Kasa ve Banka Hesap Hareketleri
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-200 dark:border-navy-800">
                  <tr>
                    <th className="py-2.5 px-3">Tarih</th>
                    <th className="py-2.5 px-3">Hesap</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Açıklama</th>
                    <th className="py-2.5 px-3">Tutar</th>
                    <th className="py-2.5 px-3">İşlemi Yapan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                  {cashTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/50">
                      <td className="py-2.5 px-3 text-slate-500">{formatDateTime(tx.created_at)}</td>
                      <td className="py-2.5 px-3 font-semibold">{tx.register_name}</td>
                      <td className="py-2.5 px-3">{tx.category}</td>
                      <td className="py-2.5 px-3 max-w-xs truncate text-slate-700 dark:text-slate-300">{tx.description}</td>
                      <td className={`py-2.5 px-3 font-bold ${tx.transaction_type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.transaction_type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{tx.created_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EXPENSES TAB (GÜNLÜK HARCAMALAR & GİDERLER) */}
      {activeTab === 'expenses' && (
        <div className="space-y-5">
          {/* 1. Header & Controls */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingDown className="text-rose-600" size={20} />
                  <span>Günlük İşletme Harcamaları & Gider Kayıt Merkezi</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Günlük taze ekmek, et, sebze, personel yevmiyesi ve sarf harcamalarını günü gününe kaydedin; nakit ve banka kasasını anlık yönetin.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportExpensesCSV}
                  className="px-3 py-2 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download size={14} />
                  <span>Excel / CSV İndir</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowExpenseModal(true)}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-rose-600/30 transition-colors"
                >
                  <Plus size={14} />
                  <span>Detaylı Masraf Ekle</span>
                </button>
              </div>
            </div>

            {/* Date Quick Filter Row */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Calendar size={13} />
                  Tarih Filtresi:
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setDateFilterMode('today');
                    setSelectedDate(getLocalDateString());
                    setEntryDate(getLocalDateString());
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    dateFilterMode === 'today'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  🌟 Bugün ({formatDate(getLocalDateString())})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDateFilterMode('yesterday');
                    setSelectedDate(getYesterdayDateString());
                    setEntryDate(getYesterdayDateString());
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    dateFilterMode === 'yesterday'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Dün ({formatDate(getYesterdayDateString())})
                </button>

                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-navy-950 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-navy-800">
                  <span className="text-[11px] text-slate-500 font-medium">Özel Tarih:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setDateFilterMode('custom');
                      setEntryDate(e.target.value);
                    }}
                    className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setDateFilterMode('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    dateFilterMode === 'all'
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Tüm Tarihler ({expenses.length})
                </button>
              </div>

              <div className="text-xs text-slate-500">
                Seçili gün: <span className="font-bold text-slate-800 dark:text-slate-200">{getSelectedDateDisplay()}</span>
              </div>
            </div>
          </div>

          {/* 2. Daily Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white dark:bg-navy-900 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-950/60 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500">Günlük Toplam Harcama</span>
              <div className="text-lg font-bold text-rose-600 mt-1">
                {formatCurrency(dailyTotal)}
              </div>
              <span className="text-[10px] text-slate-400">{filteredExpenses.length} adet işlem</span>
            </div>

            <div className="bg-white dark:bg-navy-900 p-3.5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500">Kasadan Nakit Çıkan</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(dailyCash)}
              </div>
              <span className="text-[10px] text-emerald-600">Nakit kasasından düştü</span>
            </div>

            <div className="bg-white dark:bg-navy-900 p-3.5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500">Banka / POS / Havale</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(dailyBank)}
              </div>
              <span className="text-[10px] text-blue-600">Banka hesabından ödendi</span>
            </div>

            <div className="bg-white dark:bg-navy-900 p-3.5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500">Cari Borç (Veresiye)</span>
              <div className="text-lg font-bold text-amber-600 mt-1">
                {formatCurrency(dailyCredit)}
              </div>
              <span className="text-[10px] text-slate-400">Tedarikçiye borç yazıldı</span>
            </div>

            <div className="bg-white dark:bg-navy-900 p-3.5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500">Hammadde Stok Alımı</span>
              <div className="text-lg font-bold text-indigo-600 mt-1">
                {formatCurrency(dailyStockPurchases)}
              </div>
              <span className="text-[10px] text-slate-400">Et, tavuk, hammadde</span>
            </div>

            <div className="bg-white dark:bg-navy-900 p-3.5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500">İşletme Faaliyet Gideri</span>
              <div className="text-lg font-bold text-purple-600 mt-1">
                {formatCurrency(dailyOpExpenses)}
              </div>
              <span className="text-[10px] text-slate-400">P&L gideri (Sebze, yevmiye vs.)</span>
            </div>
          </div>

          {/* 3. Inline Fast Daily Expense Entry Form */}
          <div className="bg-linear-to-r from-rose-50/70 via-white to-amber-50/50 dark:from-navy-900 dark:via-navy-900 dark:to-navy-900 rounded-2xl border border-rose-200/80 dark:border-navy-700 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-600 text-white">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Hızlı Günlük Harcama Yaz
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Kasa fişi, fırın lavaş, hal sebze veya personel yevmiyesini hemen ekleyin.
                  </p>
                </div>
              </div>

              <div className="text-xs bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 font-semibold">
                Kayıt Tarihi: <span className="text-rose-600 font-bold">{formatDate(entryDate)}</span>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3">
              <span className="text-[11px] font-bold text-slate-500 shrink-0">Hızlı Seçim:</span>
              {quickExpensePresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setEntryCategory(preset.category);
                    setEntryDescription(preset.desc);
                    setEntryIsStockPurchase(preset.isStock);
                  }}
                  className="px-2.5 py-1 bg-white dark:bg-navy-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-navy-700 hover:border-rose-400 rounded-lg text-[11px] font-medium transition-colors shrink-0 flex items-center gap-1"
                >
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSaveInlineExpense} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Tarih:
                  </label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl font-semibold text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Gider Kategorisi:
                  </label>
                  <select
                    value={entryCategory}
                    onChange={(e) => setEntryCategory(e.target.value as any)}
                    className="w-full p-2 bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl font-medium text-slate-800 dark:text-slate-200"
                  >
                    {expenseCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Açıklama:
                  </label>
                  <input
                    type="text"
                    value={entryDescription}
                    onChange={(e) => setEntryDescription(e.target.value)}
                    placeholder="Örn: Taş fırından 80 lavaş, Ahmet usta yevmiye..."
                    className="w-full p-2 bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Tutar (₺):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={entryAmount}
                    onChange={(e) => setEntryAmount(e.target.value)}
                    placeholder="0.00 ₺"
                    className="w-full p-2 bg-white dark:bg-navy-950 border border-rose-300 dark:border-rose-900 rounded-xl font-bold text-rose-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Ödeme Şekli:
                  </label>
                  <select
                    value={entryPaymentMethod}
                    onChange={(e) => setEntryPaymentMethod(e.target.value as any)}
                    className="w-full p-2 bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl font-medium text-slate-800 dark:text-slate-200"
                  >
                    <option value="cash">💵 Nakit Kasa</option>
                    <option value="bank">💳 Banka / POS</option>
                    <option value="credit">🏢 Cari Borç</option>
                  </select>
                </div>
              </div>

              {/* Second row: conditional Cari dropdown, Fiş No, Stock checkbox, and Save button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-200/60 dark:border-navy-800">
                <div className="flex items-center gap-3 flex-wrap text-xs">
                  {entryPaymentMethod === 'credit' && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">Tedarikçi Cari:</span>
                      <select
                        value={entryAccountId || ''}
                        onChange={(e) => setEntryAccountId(Number(e.target.value) || null)}
                        className="p-1.5 bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg text-xs"
                      >
                        <option value="">Cari Hesap Seçiniz...</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} ({acc.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Fiş / Fatura No:</span>
                    <input
                      type="text"
                      value={entryReceiptNo}
                      onChange={(e) => setEntryReceiptNo(e.target.value)}
                      placeholder="Opsiyonel..."
                      className="p-1.5 bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg text-xs w-28"
                    />
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={entryIsStockPurchase}
                      onChange={(e) => setEntryIsStockPurchase(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-0"
                    />
                    <span>Hammadde / Stok alımı (SMM maliyetine dahil)</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!entryAmount || parseFloat(entryAmount) <= 0}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={15} />
                  <span>Harcamayı Kaydet</span>
                </button>
              </div>
            </form>
          </div>

          {/* 4. Table of Filtered Expenses */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                  {getSelectedDateDisplay()} Tarihli Harcamalar ({filteredExpenses.length})
                </h4>
              </div>

              <div className="text-xs text-slate-500">
                Toplam: <span className="font-bold text-rose-600">{formatCurrency(dailyTotal)}</span>
              </div>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Receipt size={36} className="mx-auto mb-2 opacity-40 text-rose-500" />
                <p className="font-semibold text-sm text-slate-600 dark:text-slate-300">
                  {dateFilterMode === 'all'
                    ? 'Henüz hiçbir harcama kaydı bulunmuyor.'
                    : `${getSelectedDateDisplay()} tarihine ait kayıtlı harcama bulunamadı.`}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Yukarıdaki hızlı formdan veya "+ Detaylı Masraf Ekle" butonundan yeni harcama yazabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-200 dark:border-navy-800">
                    <tr>
                      <th className="py-2.5 px-3">Tarih / Saat</th>
                      <th className="py-2.5 px-3">Gider Kategorisi</th>
                      <th className="py-2.5 px-3">Açıklama</th>
                      <th className="py-2.5 px-3">Ödeme Şekli</th>
                      <th className="py-2.5 px-3">Tür</th>
                      <th className="py-2.5 px-3">Fiş/Fatura No</th>
                      <th className="py-2.5 px-3">Ekleyen</th>
                      <th className="py-2.5 px-3">Tutar</th>
                      <th className="py-2.5 px-3 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                    {filteredExpenses.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/50 group">
                        <td className="py-2.5 px-3 text-slate-500 font-medium">
                          {formatDateTime(e.expense_date)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${getCategoryBadgeClass(
                              e.category
                            )}`}
                          >
                            {e.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-semibold max-w-xs truncate">
                          {e.description}
                          {e.account_name && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              Cari: {e.account_name}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              e.payment_method === 'cash'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : e.payment_method === 'bank'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            }`}
                          >
                            {e.payment_method === 'cash'
                              ? '💵 Nakit Kasa'
                              : e.payment_method === 'bank'
                              ? '💳 Banka POS'
                              : '🏢 Cari Borç'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              e.is_stock_purchase === 1
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-300'
                            }`}
                          >
                            {e.is_stock_purchase === 1 ? 'Stok Alımı' : 'Faaliyet Gideri'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono">
                          {e.receipt_no || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {e.created_by || 'Yönetici'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-rose-600 text-sm whitespace-nowrap">
                          -{formatCurrency(e.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(e)}
                            title="Harcamayı Sil (Tutarı Kasaya İade Et)"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACCOUNTS (SUPPLIERS & STAFF) TAB */}
      {activeTab === 'accounts' && (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              Cari Hesaplar (Tedarikçiler, Personel ve Platformlar)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-200 dark:border-navy-800">
                <tr>
                  <th className="py-2.5 px-3">Cari Ünvanı / İsim</th>
                  <th className="py-2.5 px-3">Hesap Türü</th>
                  <th className="py-2.5 px-3">Telefon</th>
                  <th className="py-2.5 px-3">Notlar</th>
                  <th className="py-2.5 px-3">Bakiye</th>
                  <th className="py-2.5 px-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/50">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{acc.name}</td>
                    <td className="py-3 px-3 capitalize">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                        {acc.type === 'supplier' ? 'Tedarikçi' : acc.type === 'staff' ? 'Personel' : 'Platform'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{acc.phone || '-'}</td>
                    <td className="py-3 px-3 text-slate-400 max-w-xs truncate">{acc.notes || '-'}</td>
                    <td className={`py-3 px-3 font-bold text-sm ${acc.balance > 0 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                      {formatCurrency(acc.balance)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedAccount(acc);
                          setPaymentAmount(Math.abs(acc.balance) || 1000);
                          setShowPaymentModal(true);
                        }}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold rounded-lg"
                      >
                        Ödeme Yap
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CASH CLOSINGS TAB (Z-RAPORU) */}
      {activeTab === 'closings' && (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              Gün Sonu Kasa Kapanışları ve Z-Raporu Arşivi
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-200 dark:border-navy-800">
                <tr>
                  <th className="py-2.5 px-3">Kapanış Tarihi</th>
                  <th className="py-2.5 px-3">Beklenen Nakit</th>
                  <th className="py-2.5 px-3">Sayılan Nakit</th>
                  <th className="py-2.5 px-3">Kasa Farkı</th>
                  <th className="py-2.5 px-3">Günlük Ciro</th>
                  <th className="py-2.5 px-3">Ürün Maliyeti (SMM)</th>
                  <th className="py-2.5 px-3">Net Kâr</th>
                  <th className="py-2.5 px-3">Kapatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {closings.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/50">
                    <td className="py-3 px-3 font-semibold">{formatDate(c.closing_date)}</td>
                    <td className="py-3 px-3">{formatCurrency(c.expected_cash)}</td>
                    <td className="py-3 px-3 font-bold">{formatCurrency(c.counted_cash)}</td>
                    <td className={`py-3 px-3 font-bold ${c.cash_variance === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(c.cash_variance)}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{formatCurrency(c.total_turnover)}</td>
                    <td className="py-3 px-3 text-amber-600">{formatCurrency(c.total_cogs)}</td>
                    <td className="py-3 px-3 font-black text-emerald-600">{formatCurrency(c.net_profit)}</td>
                    <td className="py-3 px-3 text-slate-500">{c.closed_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* P&L STATEMENT TAB */}
      {activeTab === 'pl_statement' && (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 p-6 shadow-xs space-y-6 max-w-3xl mx-auto">
          <div className="text-center pb-4 border-b border-slate-200 dark:border-navy-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Güzelyalı Dönercisi Gelir Tablosu (P&L)
            </h3>
            <p className="text-xs text-slate-400">Dönemsel Kâr-Zarar ve Faaliyet Sonucu</p>
          </div>

          <div className="space-y-3 text-sm">
            {/* 1. Revenue */}
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-navy-800 font-semibold text-slate-800 dark:text-white">
              <span>(+) Toplam Satış Hasılatı (Ciro)</span>
              <span className="text-emerald-600">{formatCurrency(totalRevenue)}</span>
            </div>

            {/* 2. COGS */}
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-navy-800 text-slate-600 dark:text-slate-300">
              <span>(-) Satılan Mal Maliyeti (Et, Tavuk, Ekmek, Ambalaj)</span>
              <span className="text-amber-600">-{formatCurrency(totalCogs)}</span>
            </div>

            {/* 3. Gross Profit */}
            <div className="flex justify-between py-2.5 bg-slate-50 dark:bg-navy-950 px-3 rounded-lg font-bold text-slate-900 dark:text-white">
              <span>(=) BRÜT FAALİYET KÂRI</span>
              <span className="text-blue-600 dark:text-blue-400">{formatCurrency(grossProfit)}</span>
            </div>

            {/* 4. Operating Expenses */}
            <div className="pt-2">
              <div className="font-semibold text-xs text-slate-500 mb-1">Faaliyet Giderleri:</div>
              <div className="space-y-1.5 pl-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Personel Ücretleri & Yevmiyeler</span>
                  <span>{formatCurrency(expenses.filter(e => e.category === 'Personel').reduce((s, e) => s + e.amount, 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kira Gideri</span>
                  <span>{formatCurrency(expenses.filter(e => e.category === 'Kira').reduce((s, e) => s + e.amount, 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Enerji & Faturalar (Elektrik, Gaz, Su)</span>
                  <span>{formatCurrency(expenses.filter(e => ['Elektrik', 'Su', 'Doğalgaz'].includes(e.category)).reduce((s, e) => s + e.amount, 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Diğer Faaliyet Giderleri</span>
                  <span>{formatCurrency(expenses.filter(e => ['Ambalaj', 'Reklam', 'Kurye ve lojistik', 'Vergi ve diğer giderler'].includes(e.category)).reduce((s, e) => s + e.amount, 0))}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-navy-800 text-slate-600 dark:text-slate-300">
              <span>(-) Toplam Faaliyet Giderleri</span>
              <span className="text-rose-600">-{formatCurrency(operatingExpenses)}</span>
            </div>

            {/* 5. Net Profit */}
            <div className="flex justify-between py-3 bg-emerald-50 dark:bg-emerald-950/40 px-4 rounded-xl font-extrabold text-base border border-emerald-200 dark:border-emerald-800">
              <span className="text-emerald-900 dark:text-emerald-300">(=) NET FAALİYET KÂRI / ZARARI</span>
              <span className={netOperatingProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}>
                {formatCurrency(netOperatingProfit)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* GİDER MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-navy-700 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingDown size={18} className="text-rose-600" />
              <span>Yeni Gider / Masraf Kaydı</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Gider Tarihi:</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg font-semibold text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Gider Kategorisi:</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg"
                >
                  {expenseCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Gider Tutarı (TL):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={expenseAmount || ''}
                  onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Tutar girin"
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Ödeme Şekli:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg"
                >
                  <option value="cash">💵 Nakit Kasa (Kasadan Düşer)</option>
                  <option value="bank">💳 Banka / POS / Havale</option>
                  <option value="credit">🏢 Cari Borç (Veresiye)</option>
                </select>
              </div>

              {paymentMethod === 'credit' && (
                <div>
                  <label className="block font-semibold mb-1">Tedarikçi Cari Hesabı:</label>
                  <select
                    value={expenseAccountId || ''}
                    onChange={(e) => setExpenseAccountId(Number(e.target.value) || null)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg"
                  >
                    <option value="">Cari Hesap Seçiniz...</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Açıklama:</label>
                <input
                  type="text"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="Gider detayı..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Fiş / Fatura No (Opsiyonel):</label>
                <input
                  type="text"
                  value={receiptNo}
                  onChange={(e) => setReceiptNo(e.target.value)}
                  placeholder="Fiş / Fatura no..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="stockCheck"
                  checked={isStockPurchase}
                  onChange={(e) => setIsStockPurchase(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-0"
                />
                <label htmlFor="stockCheck" className="text-slate-600 dark:text-slate-300">
                  Bu harcama bir hammadde stok alımıdır (Doğrudan P&L faaliyet gideri sayılmaz).
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={expenseAmount <= 0}
                onClick={handleSaveExpense}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30"
              >
                Gideri Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KASA KAPANIŞ MODAL */}
      {showClosingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-navy-700 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
              <FileCheck2 size={18} className="text-brand-500" />
              <span>Gün Sonu Kasa Kapanışı (Z-Raporu)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-100 dark:bg-navy-950 rounded-lg flex justify-between">
                <span>Sistemdeki Nakit Kasa:</span>
                <span className="font-bold">{formatCurrency(registers.find(r => r.type === 'cash')?.balance || 0)}</span>
              </div>

              <div>
                <label className="block font-semibold mb-1">Sayılan Fiziki Nakit (Kasadaki Gerçek Para):</label>
                <input
                  type="number"
                  step="1"
                  value={countedCash}
                  onChange={(e) => setCountedCash(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Kapanış Notu / Vardiya Açıklaması:</label>
                <input
                  type="text"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Kasa tam, devir teslim..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClosingModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Vazgeç
              </button>
              <button
                onClick={handleSaveClosing}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/30"
              >
                Günü Kapat ve Z-Raporunu Kilitle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CARİ ÖDEME MODAL */}
      {showPaymentModal && selectedAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-navy-700 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-800 dark:text-white">
              Cari Ödeme: {selectedAccount.name}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-100 dark:bg-navy-950 rounded-lg flex justify-between">
                <span>Mevcut Cari Bakiye:</span>
                <span className="font-bold">{formatCurrency(selectedAccount.balance)}</span>
              </div>

              <div>
                <label className="block font-semibold mb-1">Ödenecek Tutar (TL):</label>
                <input
                  type="number"
                  step="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Ödeme Yapılacak Kasa/Banka:</label>
                <select
                  value={paymentRegisterType}
                  onChange={(e) => setPaymentRegisterType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border rounded-lg"
                >
                  <option value="cash">Nakit Kasa</option>
                  <option value="bank">Banka POS Hesabı</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Vazgeç
              </button>
              <button
                onClick={handleSavePayment}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30"
              >
                Ödemeyi Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
