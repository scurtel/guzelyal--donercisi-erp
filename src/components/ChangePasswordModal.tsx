import React, { useState } from 'react';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { User } from '../types';
import { dbService } from '../db/database';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onPasswordChanged?: (updatedUser: User) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPasswordChanged,
}) => {
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Fetch latest user data from DB to ensure freshest password check
    const latestUser = dbService.getUserById(currentUser.id) || currentUser;

    const trimmedCurrent = currentPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    // Validate current password
    if (trimmedCurrent !== latestUser.pin_code && trimmedCurrent !== (latestUser as any).password_hash) {
      setError('Mevcut şifreniz hatalı! Lütfen mevcut şifrenizi kontrol edin.');
      return;
    }

    if (trimmedNew.length < 4) {
      setError('Yeni şifre en az 4 haneli (veya karakter) olmalıdır.');
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      setError('Yeni şifreler birbiriyle uyuşmuyor! Lütfen her iki alana da aynı şifreyi yazın.');
      return;
    }

    if (trimmedNew === trimmedCurrent) {
      setError('Yeni şifreniz mevcut şifrenizle aynı olamaz.');
      return;
    }

    try {
      dbService.updateUserPassword(currentUser.id, trimmedNew);

      const updatedUser: User = {
        ...currentUser,
        pin_code: trimmedNew,
      };

      // Persist to session storage
      sessionStorage.setItem('gzy_user', JSON.stringify(updatedUser));

      if (onPasswordChanged) {
        onPasswordChanged(updatedUser);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
        alert(`Tebrikler ${currentUser.display_name}! Şifreniz başarıyla değiştirildi. Yeni şifreniz (${trimmedNew}) hemen aktif edildi.`);
      }, 600);
    } catch (err: any) {
      setError(`Şifre değiştirilemedi: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-navy-700 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-brand-600 to-brand-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Şifre & PIN Kodu Değiştir</h3>
              <p className="text-[11px] text-white/80">Kişisel güvenlik ve giriş şifrenizi güncelleyin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-navy-950 rounded-2xl border border-slate-200/80 dark:border-navy-800">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-black text-lg shadow-sm">
              {currentUser.display_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-sm">
                <span>{currentUser.display_name}</span>
                {currentUser.role === 'admin' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 flex items-center gap-1">
                    <ShieldCheck size={11} />
                    Yönetici
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kullanıcı adı: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{currentUser.username}</span>
              </p>
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>Şifreniz başarıyla kaydedildi!</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mevcut Şifreniz / PIN Kodunuz:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Mevcut şifrenizi girin"
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Yeni Şifre / PIN Kodu:
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Örn: 6 haneli yeni PIN veya şifre"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Örnek: 123456 gibi 6 haneli sayı veya güvenli bir parola belirleyebilirsiniz.
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Yeni Şifre (Tekrar):
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Yeni şifrenizi tekrar girin"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-navy-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl font-semibold transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={!currentPassword || !newPassword || !confirmPassword}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-brand-500/25 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 size={16} />
                <span>Şifreyi Kaydet</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
