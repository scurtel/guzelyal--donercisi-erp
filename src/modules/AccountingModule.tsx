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
}

export const AccountingModule: React.FC<AccountingModuleProps> = ({
  currentUser,
  onFinancialChanged,
}) => {
  const [activeTab, setActiveTab] = useState<
    'registers' | 'expenses' | 'accounts' | 'closings' | 'pl_statement'
  >('registers');

  const registers = dbService.getCashRegisters();
  const expenses = dbService.getExpenses();
  const accounts = dbService.getAccounts();
  const closings = dbService.getCashClosings();
  const cashTransactions = dbService.getCashTransactions();

  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [showClosingModal, setShowClosingModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Form inputs
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Personel');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'credit'>('cash');
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

  // Save Expense
  const handleSaveExpense = () => {
    if (expenseAmount <= 0 || !expenseDescription.trim()) {
      alert('Lütfen geçerli tutar ve açıklama giriniz.');
      return;
    }

    try {
      dbService.saveExpense({
        category: expenseCategory,
        amount: expenseAmount,
        payment_method: paymentMethod,
        is_stock_purchase: isStockPurchase,
        description: expenseDescription.trim(),
        receipt_no: receiptNo.trim(),
        created_by: currentUser.display_name,
      });

      setShowExpenseModal(false);
      setExpenseAmount(0);
      setExpenseDescription('');
      setReceiptNo('');
      onFinancialChanged();
      alert('Gider işlemi kaydedildi ve kasa güncellendi.');
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    }
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

      {/* EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              İşletme Gider Kayıtları ve Fatura Listesi
            </h3>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold"
            >
              + Yeni Gider Ekle
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-200 dark:border-navy-800">
                <tr>
                  <th className="py-2.5 px-3">Tarih</th>
                  <th className="py-2.5 px-3">Gider Kategorisi</th>
                  <th className="py-2.5 px-3">Açıklama</th>
                  <th className="py-2.5 px-3">Ödeme Şekli</th>
                  <th className="py-2.5 px-3">Tür</th>
                  <th className="py-2.5 px-3">Fiş/Fatura No</th>
                  <th className="py-2.5 px-3">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/50">
                    <td className="py-2.5 px-3 text-slate-500">{formatDateTime(e.expense_date)}</td>
                    <td className="py-2.5 px-3 font-bold">{e.category}</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-xs truncate">{e.description}</td>
                    <td className="py-2.5 px-3 capitalize">{e.payment_method === 'cash' ? 'Nakit Kasa' : e.payment_method === 'bank' ? 'Banka Havale' : 'Cari Borç'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${e.is_stock_purchase === 1 ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'}`}>
                        {e.is_stock_purchase === 1 ? 'Stok Alımı' : 'Faaliyet Gideri'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{e.receipt_no || '-'}</td>
                    <td className="py-2.5 px-3 font-bold text-rose-600">{formatCurrency(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                <label className="block font-semibold mb-1">Gider Kategorisi:</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border rounded-lg"
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
                  step="1"
                  min="0"
                  value={expenseAmount || ''}
                  onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Tutar girin"
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Ödeme Şekli:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border rounded-lg"
                >
                  <option value="cash">Nakit Kasa</option>
                  <option value="bank">Banka / POS</option>
                  <option value="credit">Cari Borç (Veresiye)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Açıklama:</label>
                <input
                  type="text"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="Gider detayı..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border rounded-lg"
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
                  Bu harcama bir hammadde stok alımıdır (Doğrudan P&L gideri sayılmaz).
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowExpenseModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Vazgeç
              </button>
              <button
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
