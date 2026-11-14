import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Flame,
  Boxes,
  ChefHat,
  Wallet,
  TrendingUp,
  PieChart,
  Target,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  Users,
} from 'lucide-react';

export type NavItem =
  | 'dashboard'
  | 'pos'
  | 'customers'
  | 'production'
  | 'inventory'
  | 'recipes'
  | 'accounting'
  | 'yemeksepeti'
  | 'menu-engineering'
  | 'breakeven'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  stockAlertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  stockAlertCount,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'pos', label: 'Satış & Kasa POS', icon: ShoppingCart, badge: 'Canlı' },
    { id: 'customers', label: 'Müşteri Kayıt & Rehber', icon: Users, badge: null },
    { id: 'production', label: 'Üretim Mühendisliği', icon: Flame, badge: null },
    { id: 'inventory', label: 'Akıllı Stok', icon: Boxes, badge: stockAlertCount > 0 ? stockAlertCount : null },
    { id: 'recipes', label: 'Reçeteler & Menü', icon: ChefHat, badge: null },
    { id: 'accounting', label: 'Finansal Muhasebe', icon: Wallet, badge: null },
    { id: 'yemeksepeti', label: 'Yemeksepeti Kârlılık', icon: TrendingUp, badge: null },
    { id: 'menu-engineering', label: 'Menü Mühendisliği', icon: PieChart, badge: null },
    { id: 'breakeven', label: 'Başabaş Analizi', icon: Target, badge: null },
    { id: 'reports', label: 'Raporlama & Dışa Aktar', icon: FileSpreadsheet, badge: null },
    { id: 'settings', label: 'Ayarlar & Yedek', icon: Settings, badge: null },
  ];

  return (
    <aside className="w-64 bg-navy-950 text-slate-300 flex flex-col h-screen select-none border-r border-navy-800 shrink-0">
      {/* Brand Logo & Name */}
      <div className="p-4 border-b border-navy-800/80 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20 overflow-hidden p-1 shrink-0">
          <img
            src="./logo.png"
            alt="Güzelyalı Dönercisi"
            className="w-full h-full object-contain filter drop-shadow"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-white text-base tracking-wide leading-tight truncate">
            GÜZELYALI ERP
          </h1>
          <p className="text-[11px] text-brand-400 font-medium tracking-wider uppercase">
            Restoran Mühendisliği
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-navy-400 uppercase">
          Operasyon & Yönetim
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as NavItem)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-300 hover:bg-navy-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  size={19}
                  className={`shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== null && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-navy-950 text-white'
                      : typeof item.badge === 'number'
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-navy-800 text-brand-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-navy-800/80 bg-navy-950/60">
        <div className="bg-navy-900/90 rounded-lg p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-ping"></div>
            <span className="text-xs font-medium text-emerald-400">Lokal SQLite Aktif</span>
          </div>
          <span className="text-[10px] text-slate-400 bg-navy-950 px-1.5 py-0.5 rounded border border-navy-800">
            v1.0.0
          </span>
        </div>
      </div>
    </aside>
  );
};
