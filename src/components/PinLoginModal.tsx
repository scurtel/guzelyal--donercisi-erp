import React, { useState } from 'react';
import { ShieldCheck, UserCheck, X, KeyRound, AlertCircle } from 'lucide-react';
import { User } from '../types';

interface PinLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
  currentUser: User;
}

export const PinLoginModal: React.FC<PinLoginModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
  currentUser,
}) => {
  const users: User[] = [
    { id: 1, username: 'admin', display_name: 'Yönetici (Admin)', role: 'admin', pin_code: '1234' },
    { id: 2, username: 'kasiyer', display_name: 'Kasa Personeli', role: 'kasiyer', pin_code: '0000' },
    { id: 3, username: 'usta', display_name: 'Döner Ustası', role: 'usta', pin_code: '1111' },
  ];

  const [selectedUser, setSelectedUser] = useState<User>(currentUser);
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const next = pin + num;
      setPin(next);
      setError('');
      if (next.length === 4) {
        verifyPin(next, selectedUser);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const verifyPin = (enteredPin: string, user: User) => {
    if (enteredPin === user.pin_code) {
      onSelectUser(user);
      onClose();
      setPin('');
      setError('');
    } else {
      setError('Hatalı PIN kodu! Lütfen tekrar deneyin.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 dark:border-navy-700 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-slate-100 dark:bg-navy-800 flex items-center justify-between border-b border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-brand-500" />
            <h3 className="font-semibold text-sm text-slate-800 dark:text-white">
              Kullanıcı Girişi / PIN Doğrulama
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* User selector cards */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {users.map((u) => {
              const isSelected = selectedUser.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => {
                    setSelectedUser(u);
                    setPin('');
                    setError('');
                  }}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1.5 border transition-all ${
                    isSelected
                      ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-navy-800 hover:bg-slate-50 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                      isSelected
                        ? 'bg-brand-500 text-white'
                        : 'bg-slate-200 dark:bg-navy-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {u.display_name.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold leading-tight text-center">
                    {u.role === 'admin' ? 'Yönetici' : u.role === 'usta' ? 'Usta' : 'Kasiyer'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    PIN: {u.pin_code}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected user name and PIN dots */}
          <div className="text-center mb-6">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Giriş yapılacak: <span className="font-semibold text-slate-800 dark:text-white">{selectedUser.display_name}</span>
            </p>
            <div className="flex justify-center gap-3 my-3">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-150 ${
                    pin.length > idx
                      ? 'bg-brand-500 scale-110 shadow-sm shadow-brand-500/40'
                      : 'bg-slate-200 dark:bg-navy-800 border border-slate-300 dark:border-navy-700'
                  }`}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-red-500 mt-2">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => {
              const isAction = key === 'C' || key === '⌫';
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (key === 'C') {
                      setPin('');
                      setError('');
                    } else if (key === '⌫') {
                      handleBackspace();
                    } else {
                      handleKeyPress(key);
                    }
                  }}
                  className={`h-12 rounded-xl font-bold text-base transition-all active:scale-95 flex items-center justify-center ${
                    isAction
                      ? 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
                      : 'bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-800 dark:text-white hover:bg-brand-50 dark:hover:bg-brand-950/20 hover:border-brand-500/40 shadow-xs'
                  }`}
                >
                  {key}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
