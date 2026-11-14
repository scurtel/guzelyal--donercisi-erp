import React from 'react';
import {
  X,
  Download,
  Laptop,
  CheckCircle2,
  HardDrive,
  Printer,
  ShieldCheck,
  Zap,
  ExternalLink,
} from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const SETUP_URL = 'https://github.com/scurtel/guzelyal--donercisi-erp/releases/download/v1.0.0/Guzelyali-ERP-Setup-1.0.0.exe';
  const PORTABLE_URL = 'https://github.com/scurtel/guzelyal--donercisi-erp/releases/download/v1.0.0/Guzelyali-ERP-Portable-1.0.0.exe';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 dark:border-navy-700 animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-brand-600 via-brand-700 to-navy-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center p-2 shadow-inner border border-white/20">
              <Laptop size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Güzelyalı ERP — Masaüstü Uygulaması</h2>
              <p className="text-xs text-brand-100 font-medium">
                Windows 10 / 11 (64-Bit) • v1.0.0 Resmi Sürüm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Key Advantages */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700 flex flex-col items-center text-center gap-1.5">
              <Zap className="text-amber-500" size={20} />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">%100 Çevrimdışı</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">İnternet kesilse bile satış devam eder</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700 flex flex-col items-center text-center gap-1.5">
              <Printer className="text-emerald-500" size={20} />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">80mm Yazıcı Desteği</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Termal fiş ve mutfak yazıcısına tam uyumlu</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700 flex flex-col items-center text-center gap-1.5">
              <HardDrive className="text-blue-500" size={20} />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Lokal SQLite Hızı</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Milisaniyelik arama ve yüksek performans</span>
            </div>
          </div>

          {/* Download Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Installer Package */}
            <div className="p-5 rounded-2xl border-2 border-brand-500/40 bg-brand-50/40 dark:bg-brand-950/20 flex flex-col justify-between space-y-4 hover:border-brand-500 transition-all group">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-500 text-white mb-2">
                  <CheckCircle2 size={12} /> Önerilen
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Kurulum Paketi (.exe)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Masaüstü kısayolu oluşturur, otomatik güncelleme ve tam Windows entegrasyonu sağlar.
                </p>
                <div className="text-[11px] text-slate-500 mt-2">
                  Boyut: <strong>~139 MB</strong> • x64 Mimari
                </div>
              </div>

              <a
                href={SETUP_URL}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 transition-all transform active:scale-95 text-center"
              >
                <Download size={18} />
                Kurulum Programını İndir
              </a>
            </div>

            {/* 2. Portable Package */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/40 flex flex-col justify-between space-y-4 hover:border-slate-400 dark:hover:border-navy-500 transition-all group">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 dark:bg-navy-700 text-slate-700 dark:text-slate-300 mb-2">
                  Kurulumsuz / Taşınabilir
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Portable Sürüm (.exe)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Kurulum gerektirmez. USB bellekten veya masaüstünden doğrudan çift tıklamayla çalışır.
                </p>
                <div className="text-[11px] text-slate-500 mt-2">
                  Boyut: <strong>~118 MB</strong> • Bağımsız Tek Dosya
                </div>
              </div>

              <a
                href={PORTABLE_URL}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-navy-700 dark:hover:bg-navy-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all transform active:scale-95 text-center"
              >
                <Download size={18} />
                Portable Sürümü İndir
              </a>
            </div>

          </div>

          {/* Windows SmartScreen Note */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
            <ShieldCheck size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Windows İpucu:</strong> İndirilen program ilk açıldığında Windows Koruması (SmartScreen) uyarısı verirse, <strong>"Ek Bilgi"</strong> bağlantısına tıklayıp <strong>"Yine de Çalıştır"</strong> butonuna basmanız yeterlidir. Program %100 güvenli ve yerel çalışmaktadır.
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-100 dark:bg-navy-800/80 border-t border-slate-200 dark:border-navy-700 flex items-center justify-between">
          <a
            href="https://github.com/scurtel/guzelyal--donercisi-erp/releases/tag/v1.0.0"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1.5"
          >
            GitHub Sürüm Notlarını Görüntüle <ExternalLink size={12} />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
