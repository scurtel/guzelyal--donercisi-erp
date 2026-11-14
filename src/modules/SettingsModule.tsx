import React, { useState } from 'react';
import {
  Settings,
  HardDriveDownload,
  HardDriveUpload,
  Shield,
  KeyRound,
  FileCheck2,
  AlertTriangle,
  RotateCcw,
  Save,
  CheckCircle,
  Database,
  Building,
} from 'lucide-react';
import { User, AuditLog } from '../types';
import { formatCurrency, formatDateTime } from '../utils/format';
import { dbService } from '../db/database';

interface SettingsModuleProps {
  currentUser: User;
  onSettingsChanged: () => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  currentUser,
  onSettingsChanged,
}) => {
  const currentSettings = dbService.getSettings();

  const [restaurantName, setRestaurantName] = useState(currentSettings.restaurant_name || 'Güzelyalı Dönercisi');
  const [restaurantAddress, setRestaurantAddress] = useState(currentSettings.restaurant_address || 'Güzelyalı Mah. Sahil Cad. No:12');
  const [restaurantPhone, setRestaurantPhone] = useState(currentSettings.restaurant_phone || '0555 123 45 67');
  const [dailyFixed, setDailyFixed] = useState(currentSettings.daily_fixed_expenses || '5550');
  const [targetProfit, setTargetProfit] = useState(currentSettings.target_daily_profit || '12000');
  const [defaultCommission, setDefaultCommission] = useState(currentSettings.default_yemeksepeti_commission || '15');

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    return dbService.query<AuditLog>('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50');
  });

  // Save Settings
  const handleSaveGeneral = () => {
    try {
      dbService.updateSetting('restaurant_name', restaurantName);
      dbService.updateSetting('restaurant_address', restaurantAddress);
      dbService.updateSetting('restaurant_phone', restaurantPhone);
      dbService.updateSetting('daily_fixed_expenses', dailyFixed);
      dbService.updateSetting('target_daily_profit', targetProfit);
      dbService.updateSetting('default_yemeksepeti_commission', defaultCommission);

      alert('İşletme ayarları ve parametreleri kaydedildi.');
      onSettingsChanged();
    } catch (e: any) {
      alert(`Hata: ${e.message}`);
    }
  };

  // Export Backup File
  const handleCreateBackup = async () => {
    try {
      const base64Data = dbService.exportBackup();
      if (typeof window !== 'undefined' && (window as any).electronAPI?.exportBackupFile) {
        const res = await (window as any).electronAPI.exportBackupFile(base64Data);
        if (res.success) {
          alert(`Yedek başarıyla kaydedildi: ${res.filePath}`);
        }
      } else {
        // Fallback for browser download
        const blob = new Blob([Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))], {
          type: 'application/x-sqlite3',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `guzelyali_erp_yedek_${new Date().toISOString().split('T')[0]}.gzy`;
        a.click();
        URL.revokeObjectURL(url);
        alert('Yerel SQLite yedek dosyası (.gzy) başarıyla indirildi!');
      }
    } catch (err: any) {
      alert(`Yedekleme hatası: ${err.message}`);
    }
  };

  // Restore Backup File
  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('DİKKAT: Yedekten geri yükleme yaptığınızda mevcut tüm veriler yedek dosyasındaki verilerle değiştirilecektir. Devam etmek istiyor musunuz?')) {
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const arrayBuffer = evt.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        dbService.restoreBackup(base64);
        alert('Yedekten geri yükleme başarıyla tamamlandı! Uygulama güncel verilerle yenilenecektir.');
        onSettingsChanged();
        window.location.reload();
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      alert(`Geri yükleme hatası: ${err.message}`);
    }
  };

  // Reset transactions only (test cleanup)
  const handleResetTransactions = () => {
    const confirmed = prompt('Tüm sipariş, kasa ve stok hareketlerini sıfırlamak için "ONAYLIYORUM" yazın (Ürünler ve menü silinmez):');
    if (confirmed === 'ONAYLIYORUM') {
      dbService.resetTransactions(currentUser.display_name);
      alert('Tüm finansal hareketler ve siparişler sıfırlandı.');
      onSettingsChanged();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Top Banner */}
      <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
        <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Settings size={20} className="text-brand-500" />
          <span>Sistem Ayarları, Güvenlik ve Yerel Yedekleme</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Yerel SQLite yedekleme, geri yükleme doğrulama, başlangıç parametreleri ve denetim kayıtları.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BACKUP & RESTORE SECTION */}
        <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Database size={18} className="text-brand-500" />
            <span>Otomatik Yerel SQLite Yedekleme & Geri Yükleme</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Verileriniz tamamen bilgisayarınızda yerel SQLite veritabanında saklanır. Düzenli olarak .gzy uzantılı şifrelenmiş yedek dosyanızı alabilir ve başka bir bilgisayara aktarabilirsiniz.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleCreateBackup}
              className="p-4 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/80 border border-brand-200 dark:border-brand-800/80 text-brand-700 dark:text-brand-300 font-bold text-xs flex flex-col items-center gap-2 transition-all active:scale-95 shadow-xs"
            >
              <HardDriveDownload size={24} className="text-brand-600 dark:text-brand-400" />
              <span>Yerel Yedek Al (.gzy)</span>
            </button>

            <label className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-navy-950 dark:hover:bg-navy-800 border border-slate-200 dark:border-navy-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex flex-col items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs">
              <HardDriveUpload size={24} className="text-slate-500" />
              <span>Yedekten Geri Yükle</span>
              <input
                type="file"
                accept=".gzy,.sqlite,.db"
                className="hidden"
                onChange={handleRestoreBackup}
              />
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-navy-800 flex justify-between items-center text-xs">
            <span className="text-slate-500">Test İşlemleri Sıfırlama:</span>
            <button
              onClick={handleResetTransactions}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline"
            >
              Hareketleri Sıfırla (Kasa & Sipariş)
            </button>
          </div>
        </div>

        {/* RESTAURANT INFO & PARAMETERS */}
        <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Building size={18} className="text-brand-500" />
            <span>Restoran Bilgileri ve İşletme Parametreleri</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Restoran / İşletme Adı:</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border rounded-lg font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Telefon:</label>
                <input
                  type="text"
                  value={restaurantPhone}
                  onChange={(e) => setRestaurantPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Günlük Sabit Gider (TL):</label>
                <input
                  type="number"
                  value={dailyFixed}
                  onChange={(e) => setDailyFixed(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border rounded-lg font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Adres (Fişte Çıkacak Metin):</label>
              <input
                type="text"
                value={restaurantAddress}
                onChange={(e) => setRestaurantAddress(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border rounded-lg"
              />
            </div>

            <button
              onClick={handleSaveGeneral}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <Save size={15} />
              <span>Parametreleri Kaydet</span>
            </button>
          </div>
        </div>
      </div>

      {/* AUDIT LOGS TABLE */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
            <Shield size={18} className="text-brand-500" />
            <span>Güvenlik ve İşlem Denetim Kaydı (Audit Log)</span>
          </h3>
          <span className="text-xs text-slate-400">Son 50 Sistem Olayı</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-200 dark:border-navy-800">
              <tr>
                <th className="py-2.5 px-3">Tarih</th>
                <th className="py-2.5 px-3">Kullanıcı</th>
                <th className="py-2.5 px-3">İşlem Türü</th>
                <th className="py-2.5 px-3">Modül / Varlık</th>
                <th className="py-2.5 px-3">Detaylar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/50">
                  <td className="py-2.5 px-3 text-slate-500">{formatDateTime(log.created_at)}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{log.user_name}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-[10px] font-mono">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{log.entity_type}</td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-md truncate">{log.details || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
