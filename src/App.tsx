import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavItem } from './components/Sidebar';
import { Header } from './components/Header';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { PinLoginModal } from './components/PinLoginModal';
import { LoginScreen } from './components/LoginScreen';
import { DownloadModal } from './components/DownloadModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';

// Modules
import { DashboardModule } from './modules/DashboardModule';
import { PosModule } from './modules/PosModule';
import { ProductionModule } from './modules/ProductionModule';
import { InventoryModule } from './modules/InventoryModule';
import { RecipeModule } from './modules/RecipeModule';
import { AccountingModule } from './modules/AccountingModule';
import { YemeksepetiModule } from './modules/YemeksepetiModule';
import { MenuEngineeringModule } from './modules/MenuEngineeringModule';
import { BreakEvenModule } from './modules/BreakEvenModule';
import { ReportsModule } from './modules/ReportsModule';
import { SettingsModule } from './modules/SettingsModule';
import { CustomerModule } from './modules/CustomerModule';

import { dbService } from './db/database';
import { User, Product, InventoryItem, Account, DashboardMetrics, Order, Customer } from './types';

export const App: React.FC = () => {
  const [isDbReady, setIsDbReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Authentication & Security Lock State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('gzy_auth') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = sessionStorage.getItem('gzy_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      id: 1,
      username: 'yigitcilli',
      display_name: 'Yigit Cilli',
      role: 'admin',
      pin_code: '123456',
    };
  });

  // App Navigation & Modals
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [selectedCustomerForPos, setSelectedCustomerForPos] = useState<Customer | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('gzy_theme') === 'dark';
  });

  // Core Data States
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Account[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Login and Logout
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    sessionStorage.setItem('gzy_auth', 'true');
    sessionStorage.setItem('gzy_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('gzy_auth');
    sessionStorage.removeItem('gzy_user');
  };

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('gzy_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('gzy_theme', 'light');
    }
  }, [darkMode]);

  // Refresh all state from database
  const refreshData = useCallback(() => {
    try {
      const p = dbService.getProducts();
      const inv = dbService.getInventoryItems();
      const m = dbService.getDashboardMetrics();
      const sup = dbService.getAccounts('supplier');

      setProducts(p);
      setInventoryItems(inv);
      setMetrics(m);
      setSuppliers(sup);
    } catch (e: any) {
      console.error('Refresh error:', e);
    }
  }, []);

  // Initialize SQLite database
  useEffect(() => {
    dbService
      .init()
      .then(() => {
        setIsDbReady(true);
        refreshData();
      })
      .catch((err) => {
        console.error('DB Init failed:', err);
        setInitError(err.message || 'Veritabanı başlatılamadı.');
      });
  }, [refreshData]);

  if (initError) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
        <div className="bg-rose-950/80 border border-rose-600 p-6 rounded-2xl max-w-md text-center space-y-3">
          <h2 className="text-lg font-bold text-rose-400">Veritabanı Başlatma Hatası</h2>
          <p className="text-xs text-slate-300">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-bold"
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  if (!isDbReady || !metrics) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-navy-950 text-white space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center p-2 shadow-2xl animate-pulse">
          <img src="./logo.png" alt="Güzelyalı" className="w-full h-full object-contain" />
        </div>
        <div className="text-center">
          <h1 className="font-bold text-lg tracking-wide text-white">GÜZELYALI ERP</h1>
          <p className="text-xs text-brand-400 font-medium">Lokal SQLite Veritabanı Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Security: If not authenticated, require password/PIN login
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const stockAlertCount = inventoryItems.filter(
    (it) => it.current_quantity <= it.minimum_quantity
  ).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-light dark:bg-navy-950 text-slate-800 dark:text-slate-100 font-sans">
      {/* 1. LEFT SIDEBAR */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        stockAlertCount={stockAlertCount}
        onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          currentUser={currentUser}
          onOpenPinModal={() => setIsPinModalOpen(true)}
          onQuickPos={() => setCurrentTab('pos')}
          onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
          onGoToYemeksepeti={() => setCurrentTab('yemeksepeti')}
          onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
          onLogout={handleLogout}
          cashBalance={metrics.cashBalance}
          todayRevenue={metrics.todayRevenue}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onSearch={setSearchQuery}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-navy-950">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardModule
                metrics={metrics}
                onNavigateTab={setCurrentTab}
                onRefresh={refreshData}
              />
            )}

            {currentTab === 'pos' && (
              <PosModule
                products={products}
                currentUser={currentUser}
                initialCustomer={selectedCustomerForPos}
                onClearInitialCustomer={() => setSelectedCustomerForPos(null)}
                onOrderCompleted={(order) => {
                  refreshData();
                }}
                onPrintOrder={(order) => setPrintOrder(order)}
              />
            )}

            {currentTab === 'customers' && (
              <CustomerModule
                onNavigateToPos={(customer) => {
                  setSelectedCustomerForPos(customer);
                  setCurrentTab('pos');
                }}
                onCustomerUpdated={refreshData}
              />
            )}

            {currentTab === 'yemeksepeti' && (
              <YemeksepetiModule onDataChanged={refreshData} />
            )}

            {currentTab === 'production' && (
              <ProductionModule
                inventoryItems={inventoryItems}
                products={products}
                onBatchCreated={refreshData}
              />
            )}

            {currentTab === 'inventory' && (
              <InventoryModule
                inventoryItems={inventoryItems}
                suppliers={suppliers}
                onInventoryChanged={refreshData}
              />
            )}

            {currentTab === 'recipes' && (
              <RecipeModule
                products={products}
                inventoryItems={inventoryItems}
                onRecipesChanged={refreshData}
              />
            )}

            {currentTab === 'accounting' && (
              <AccountingModule
                currentUser={currentUser}
                onFinancialChanged={refreshData}
              />
            )}

            {currentTab === 'menu-engineering' && <MenuEngineeringModule />}

            {currentTab === 'breakeven' && <BreakEvenModule />}

            {currentTab === 'reports' && <ReportsModule />}

            {currentTab === 'settings' && (
              <SettingsModule
                currentUser={currentUser}
                onSettingsChanged={refreshData}
              />
            )}
          </div>
        </main>
      </div>

      {/* 3. THERMAL RECEIPT MODAL */}
      <ThermalReceiptModal order={printOrder} onClose={() => setPrintOrder(null)} />

      {/* 4. PIN SWITCH USER MODAL */}
      <PinLoginModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        currentUser={currentUser}
        onSelectUser={(u) => {
          setCurrentUser(u);
          sessionStorage.setItem('gzy_user', JSON.stringify(u));
          setIsPinModalOpen(false);
        }}
      />

      {/* 5. DOWNLOAD DESKTOP APP MODAL */}
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      {/* 6. CHANGE PASSWORD MODAL */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        currentUser={currentUser}
        onPasswordChanged={(updatedUser) => {
          setCurrentUser(updatedUser);
          sessionStorage.setItem('gzy_user', JSON.stringify(updatedUser));
        }}
      />
    </div>
  );
};
export default App;
