import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Sun,
  Moon,
  User as UserIcon,
  Search,
  PlusCircle,
  ShieldCheck,
  Coins,
} from 'lucide-react';
import { User } from '../types';
import { formatDate, formatCurrency } from '../utils/format';

interface HeaderProps {
  currentUser: User;
  onOpenPinModal: () => void;
  onQuickPos: () => void;
  cashBalance: number;
  todayRevenue: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSearch: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenPinModal,
  onQuickPos,
  cashBalance,
  todayRevenue,
  darkMode,
  onToggleDarkMode,
  onSearch,
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-navy-800 px-6 flex items-center justify-between shadow-xs select-none">
      {/* Left: Search & Quick indicators */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-navy-400"
          />
          <input
            type="text"
            id="global_search"
            name="global_search"
            placeholder="Ürün, sipariş, reçete veya stok ara..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-navy-400"
          />
        </div>

        {/* Live Cash & Daily Turnover Indicator */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-xs">
            <Coins size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-slate-500 dark:text-slate-400">Nakit Kasa:</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(cashBalance)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 rounded-lg text-xs">
            <span className="text-slate-500 dark:text-slate-400">Bugünkü Ciro:</span>
            <span className="font-semibold text-brand-700 dark:text-brand-300">
              {formatCurrency(todayRevenue)}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Date, Time, POS Action, User & Theme */}
      <div className="flex items-center gap-3">
        {/* Date & Time */}
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-navy-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-navy-800">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-brand-500" />
            <span className="font-medium">{formatDate(new Date())}</span>
          </div>
          <div className="w-px h-3.5 bg-slate-300 dark:bg-navy-700"></div>
          <div className="flex items-center gap-1.5 font-mono font-medium text-slate-800 dark:text-white">
            <Clock size={14} className="text-brand-500" />
            <span>{time}</span>
          </div>
        </div>

        {/* Quick Sale Button */}
        <button
          onClick={onQuickPos}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm shadow-brand-500/30 transition-all hover:scale-[1.02] active:scale-95"
        >
          <PlusCircle size={15} />
          <span>Hızlı Satış (POS)</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          title={darkMode ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
          className="p-2 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-600 dark:text-slate-300 transition-colors"
        >
          {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
        </button>

        {/* User Profile / Switch Role */}
        <button
          onClick={onOpenPinModal}
          className="flex items-center gap-2.5 pl-2 pr-3 py-1 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-lg border border-slate-200 dark:border-navy-700 transition-colors"
          title="Kullanıcı Değiştir / PIN Girişi"
        >
          <div className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {currentUser.display_name.charAt(0)}
          </div>
          <div className="text-left text-xs leading-tight">
            <div className="font-semibold text-slate-800 dark:text-white flex items-center gap-1">
              <span>{currentUser.display_name}</span>
              {currentUser.role === 'admin' && (
                <ShieldCheck size={12} className="text-brand-500" />
              )}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-navy-300 capitalize">
              {currentUser.role === 'admin' ? 'Yönetici' : currentUser.role === 'usta' ? 'Döner Ustası' : 'Kasiyer'}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};
