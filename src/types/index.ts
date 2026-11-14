// Core TypeScript definitions for Güzelyalı ERP

export type Role = 'admin' | 'kasiyer' | 'usta' | 'yonetici';

export interface User {
  id: number;
  username: string;
  display_name: string;
  role: Role;
  pin_code?: string;
  created_at?: string;
}

export type SalesChannel = 'dine_in' | 'takeaway' | 'yemeksepeti' | 'phone' | 'other';

export const SALES_CHANNEL_LABELS: Record<SalesChannel, string> = {
  dine_in: 'Restoran İçi',
  takeaway: 'Gel-Al',
  yemeksepeti: 'Yemeksepeti',
  phone: 'Telefon Siparişi',
  other: 'Diğer Kanal',
};

export type PaymentMethod = 'cash' | 'credit_card' | 'meal_card' | 'yemeksepeti_online' | 'veresiye';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Nakit Kasa',
  credit_card: 'Kredi Kartı / POS',
  meal_card: 'Yemek Kartı / Ticket',
  yemeksepeti_online: 'Yemeksepeti Cari / Online',
  veresiye: 'Açık Hesap / Veresiye',
};

export type OrderStatus = 'completed' | 'cancelled' | 'returned';

export interface Product {
  id: number;
  code: string;
  name: string;
  category: string;
  base_price: number;
  vat_rate: number;
  is_active: number;
  is_campaign: number;
  channel_prices?: Record<SalesChannel, number>;
  recipe?: Recipe;
  created_at?: string;
}

export interface ProductChannelPrice {
  id: number;
  product_id: number;
  channel: SalesChannel;
  price: number;
}

export interface InventoryItem {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: 'kg' | 'gram' | 'adet' | 'litre';
  current_quantity: number;
  minimum_quantity: number;
  last_purchase_price: number;
  average_cost: number;
  supplier_id?: number | null;
  supplier_name?: string | null;
  last_purchase_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type InventoryTransactionType = 
  | 'purchase' 
  | 'sale_consumption' 
  | 'production_in' 
  | 'production_out' 
  | 'waste_fire' 
  | 'return' 
  | 'count_adjustment';

export const INVENTORY_TRANSACTION_LABELS: Record<InventoryTransactionType, string> = {
  purchase: 'Mal Alımı (Giriş)',
  sale_consumption: 'Satış Tüketimi (Reçete Düşüşü)',
  production_in: 'Üretim Girişi (Pişmiş Ürün)',
  production_out: 'Üretim Çıkışı (Çiğ Malzeme)',
  waste_fire: 'Fire ve Zayiat',
  return: 'İade (Stoka Giriş)',
  count_adjustment: 'Sayım Düzeltmesi',
};

export interface InventoryTransaction {
  id: number;
  item_id: number;
  item_name?: string;
  transaction_type: InventoryTransactionType;
  quantity: number;
  unit_price: number;
  total_cost: number;
  reference_type?: string;
  reference_id?: number | string | null;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface RecipeItem {
  id?: number;
  recipe_id?: number;
  inventory_item_id: number;
  item_name?: string;
  unit?: string;
  quantity: number; // e.g. 0.110 for 110 grams in kg
  unit_cost?: number;
  total_cost?: number;
  notes?: string;
}

export interface Recipe {
  id: number;
  product_id: number;
  product_name?: string;
  version: number;
  is_active: number;
  items: RecipeItem[];
  material_cost: number;
  packaging_cost: number;
  total_direct_cost: number;
  sale_price: number;
  gross_margin_amount: number;
  gross_margin_percent: number;
  net_margin_after_commission?: number;
  notes?: string;
  updated_at?: string;
}

export interface RecipeHistory {
  id: number;
  recipe_id: number;
  product_id: number;
  product_name?: string;
  changed_by: string;
  change_summary: string;
  snapshot_json: string;
  created_at: string;
}

export interface ProductionBatch {
  id: number;
  batch_type: 'et' | 'tavuk';
  batch_date: string;
  raw_weight_kg: number;
  cooked_weight_kg: number;
  waste_weight_kg: number;
  waste_percentage: number;
  yield_percentage: number;
  portion_size_g: number;
  usable_portions_count: number;
  batch_cost_tl: number;
  cost_per_portion_tl: number;
  theoretical_consumption_g?: number;
  actual_consumption_g?: number;
  variance_g?: number;
  variance_loss_tl?: number;
  notes?: string;
  created_at: string;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id: number;
  product_name: string;
  bread_type?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  unit_cogs: number;
  total_cogs: number;
  notes?: string;
  extras_json?: string;
}

export interface Order {
  id: number;
  order_number: string;
  channel: SalesChannel;
  table_or_customer?: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: 'paid' | 'pending' | 'cancelled';
  subtotal: number;
  discount_amount: number;
  discount_reason?: string;
  tax_amount: number;
  total_amount: number;
  cogs_total: number;
  gross_margin: number;
  channel_commission_rate: number;
  channel_commission_amount: number;
  net_earnings: number;
  cancellation_reason?: string;
  notes?: string;
  cashier_id?: number;
  cashier_name?: string;
  items: OrderItem[];
  created_at: string;
  updated_at?: string;
}

export type ExpenseCategory =
  | 'Et alımı'
  | 'Tavuk alımı'
  | 'Ekmek'
  | 'Sebze ve sos'
  | 'Personel'
  | 'Kira'
  | 'Elektrik'
  | 'Su'
  | 'Doğalgaz'
  | 'İnternet ve telefon'
  | 'Ambalaj'
  | 'Yemeksepeti komisyonu'
  | 'Reklam'
  | 'Kurye ve lojistik'
  | 'Vergi ve diğer giderler';

export interface Expense {
  id: number;
  category: ExpenseCategory;
  amount: number;
  payment_method: 'cash' | 'bank' | 'credit';
  account_id?: number | null;
  account_name?: string | null;
  is_stock_purchase: number; // 1 = stock purchase (asset), 0 = operational expense (P&L)
  expense_date: string;
  description: string;
  receipt_no?: string;
  created_by?: string;
  created_at: string;
}

export interface CashRegister {
  id: number;
  type: 'cash' | 'bank' | 'yemeksepeti_receivable';
  name: string;
  balance: number;
}

export interface CashTransaction {
  id: number;
  register_id: number;
  register_name?: string;
  transaction_type: 'income' | 'expense' | 'transfer';
  amount: number;
  category: string;
  reference_type?: string;
  reference_id?: number | string;
  description: string;
  created_by?: string;
  created_at: string;
}

export interface CashClosing {
  id: number;
  closing_date: string;
  expected_cash: number;
  counted_cash: number;
  cash_variance: number;
  expected_card: number;
  counted_card: number;
  total_turnover: number;
  total_expenses: number;
  total_cogs: number;
  net_profit: number;
  notes?: string;
  closed_by: string;
  created_at: string;
}

export interface Customer {
  id: number;
  full_name: string;
  phone: string;
  address: string;
  notes?: string;
  last_order_notes?: string;
  total_orders_count: number;
  total_spent: number;
  created_at?: string;
  updated_at?: string;
}

export interface Account {
  id: number;
  name: string;
  type: 'supplier' | 'customer' | 'staff' | 'platform';
  phone?: string;
  tax_id?: string;
  balance: number; // positive = we owe them, negative = they owe us
  notes?: string;
  created_at?: string;
}

export interface YemeksepetiOrder {
  id: number;
  platform_order_id: string;
  order_date: string;
  gross_amount: number;
  restaurant_discount: number;
  platform_discount: number;
  commission_rate: number;
  commission_amount: number;
  platform_fees: number;
  net_payout: number;
  calculated_cogs: number;
  packaging_cost: number;
  delivery_cost: number;
  contribution_profit: number;
  is_reconciled: number;
  reconciled_date?: string | null;
  raw_data_json?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id?: string | number;
  old_value?: string;
  new_value?: string;
  details?: string;
  ip_or_device?: string;
  created_at: string;
}

export interface DashboardMetrics {
  todayRevenue: number;
  todayExpenses: number;
  todayCogs: number;
  todayGrossProfit: number;
  todayNetOperatingProfit: number;
  todayOrderCount: number;
  averageOrderValue: number;
  cashBalance: number;
  bankBalance: number;
  yemeksepetiBalance: number;
  hourlySales: { hour: string; amount: number; count: number }[];
  weeklyRevenue: { date: string; label: string; amount: number; cogs: number }[];
  monthlyRevenue: { month: string; amount: number; profit: number }[];
  topSellingProducts: { id: number; name: string; quantity: number; revenue: number; margin: number }[];
  mostProfitableProducts: { id: number; name: string; profit: number; marginPercent: number }[];
  criticalStockAlerts: InventoryItem[];
  dailyBreakEven: {
    fixedExpenses: number;
    currentRevenue: number;
    breakEvenRevenue: number;
    breakEvenPercentage: number;
    donerCountNeeded: number;
    donerCountSold: number;
  };
  channelBreakdown: { channel: SalesChannel; label: string; count: number; total: number; percentage: number }[];
  recentTransactions: { id: number; type: string; description: string; amount: number; date: string; isIncome: boolean }[];
}

export interface MenuEngineeringItem {
  id: number;
  name: string;
  category: string;
  salesCount: number;
  salesSharePercent: number; // Popularity
  unitPrice: number;
  unitCost: number;
  unitMargin: number;
  totalMargin: number;
  classification: 'Star' | 'Plowhorse' | 'Puzzle' | 'Dog';
  classificationTr: 'Yıldız' | 'İş Atı' | 'Bulmaca' | 'Zayıf';
}
