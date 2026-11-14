import React, { useState, useEffect } from 'react';
import {
  Lock,
  UserCheck,
  ShieldAlert,
  Sparkles,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle,
} from 'lucide-react';
import { User } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const users: User[] = [
    { id: 1, username: 'admin', display_name: 'Yönetici (Admin)', role: 'admin', pin_code: '1234' },
    { id: 2, username: 'kasiyer', display_name: 'Kasa Personeli', role: 'kasiyer', pin_code: '0000' },
    { id: 3, username: 'usta', display_name: 'Döner Ustası', role: 'usta', pin_code: '1111' },
  ];

  const [selectedUser, setSelectedUser] = useState<User>(users[0]);
  const [pin, setPin] = useState<string>('');
  const [passwordMode, setPasswordMode] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (passwordMode) return;

      if (/^[0-9]$/.test(e.key)) {
        if (pin.length < 4) {
          const next = pin + e.key;
          setPin(next);
          setError('');
          if (next.length === 4) {
            checkPin(next, selectedUser);
          }
        }
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
        setError('');
      } else if (e.key === 'Escape') {
        setPin('');
        setError('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, selectedUser, passwordMode]);

  const handleKeypadPress = (num: string) => {
    setPin((prev) => {
      if (prev.length < 4) {
        const next = prev + num;
        if (next.length === 4) {
          setTimeout(() => checkPin(next, selectedUser), 50);
        }
        return next;
      }
      return prev;
    });
    setError('');
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const checkPin = (enteredPin: string, user: User) => {
    if (enteredPin === user.pin_code) {
      onLoginSuccess(user);
    } else {
      setError('Hatalı PIN kodu! Lütfen tekrar deneyin.');
      setPin('');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid =
      (selectedUser.username === 'admin' && (passwordInput === 'admin123' || passwordInput === '1234')) ||
      (selectedUser.username === 'kasiyer' && (passwordInput === 'kasiyer123' || passwordInput === '0000')) ||
      (selectedUser.username === 'usta' && (passwordInput === 'usta123' || passwordInput === '1111'));

    if (valid) {
      onLoginSuccess(selectedUser);
    } else {
      setError('Hatalı şifre! Lütfen tekrar deneyin.');
      setPasswordInput('');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 flex flex-col items-center justify-center p-4 select-none relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Lock Card */}
      <div className="relative w-full max-w-md bg-white/95 dark:bg-navy-900/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200 dark:border-navy-700/80 p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Logo & Name */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center p-2 shadow-xl shadow-brand-500/25 ring-4 ring-brand-500/20">
            <img src="./logo.png" alt="Güzelyalı" className="w-full h-full object-contain filter drop-shadow" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wider text-slate-900 dark:text-white uppercase">
              Güzelyalı Dönercisi
            </h1>
            <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 tracking-widest uppercase">
              Restoran Mühendisliği & ERP Sistemi
            </p>
          </div>
        </div>

        {/* User Selection */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block text-center">
            Kullanıcı Seçin
          </label>
          <div className="grid grid-cols-3 gap-2">
            {users.map((u) => {
              const isSelected = selectedUser.id === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setSelectedUser(u);
                    setPin('');
                    setPasswordInput('');
                    setError('');
                  }}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 border transition-all text-center ${
                    isSelected
                      ? 'bg-brand-50 dark:bg-brand-950/50 border-brand-500 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/20 shadow-sm'
                      : 'border-slate-200 dark:border-navy-800 hover:bg-slate-50 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-xs ${
                      isSelected
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-200 dark:bg-navy-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {u.display_name.charAt(0)}
                  </div>
                  <div className="leading-tight">
                    <div className="text-xs font-bold truncate max-w-[85px]">{u.display_name.split(' ')[0]}</div>
                    <div className="text-[10px] text-slate-400">PIN: {u.pin_code}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold text-center flex items-center justify-center gap-1.5 animate-shake">
            <ShieldAlert size={14} /> {error}
          </div>
        )}

        {/* PIN Entry Mode */}
        {!passwordMode ? (
          <div className="space-y-4">
            
            {/* PIN Indicator Dots */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                4 Haneli PIN Kodunu Tuşlayın
              </span>
              <div className="flex gap-3 py-1">
                {[0, 1, 2, 3].map((idx) => {
                  const filled = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full transition-all duration-150 ${
                        filled
                          ? 'bg-brand-600 dark:bg-brand-500 scale-125 shadow-md shadow-brand-500/40'
                          : 'bg-slate-200 dark:bg-navy-700'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Numeric Keypad for POS Touchscreens */}
            <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  className="h-12 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 font-bold text-lg text-slate-800 dark:text-white transition-all active:scale-90 border border-slate-200/60 dark:border-navy-700/60 shadow-xs"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-12 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 transition-all active:scale-90 border border-slate-200/60 dark:border-navy-700/60"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-12 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 font-bold text-lg text-slate-800 dark:text-white transition-all active:scale-90 border border-slate-200/60 dark:border-navy-700/60 shadow-xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-12 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 font-bold text-xs text-slate-600 dark:text-slate-300 transition-all active:scale-90 border border-slate-200/60 dark:border-navy-700/60"
              >
                ⌫
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setPasswordMode(true);
                  setError('');
                }}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
              >
                Şifre ile giriş yapmak için tıklayın
              </button>
            </div>
          </div>
        ) : (
          /* Password Input Mode */
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {selectedUser.display_name} Şifresi:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Şifrenizi yazın..."
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-navy-800 border border-slate-300 dark:border-navy-700 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 transition-all transform active:scale-95"
            >
              <KeyRound size={16} />
              Giriş Yap
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setPasswordMode(false);
                  setError('');
                }}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
              >
                PIN Kodu ile giriş ekranına dön
              </button>
            </div>
          </form>
        )}

      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
        Güzelyalı Dönercisi ERP • Güvenli Terminal Oturumu v1.0.0
      </div>
    </div>
  );
};
