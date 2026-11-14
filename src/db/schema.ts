// SQLite Schema Definition for Güzelyalı ERP

export const CREATE_TABLES_SQL = `
-- 1. Users & Roles
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'kasiyer',
  pin_code TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Settings & System Parameters
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Inventory Items (Stok Kartları)
CREATE TABLE IF NOT EXISTS inventory_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL, -- 'kg', 'gram', 'adet', 'litre'
  current_quantity REAL NOT NULL DEFAULT 0,
  minimum_quantity REAL NOT NULL DEFAULT 0,
  last_purchase_price REAL NOT NULL DEFAULT 0,
  average_cost REAL NOT NULL DEFAULT 0,
  supplier_id INTEGER,
  last_purchase_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Inventory Transactions (Stok Hareketleri)
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'purchase', 'sale_consumption', 'production_in', 'production_out', 'waste_fire', 'return', 'count_adjustment'
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL DEFAULT 0,
  total_cost REAL NOT NULL DEFAULT 0,
  reference_type TEXT, -- 'order', 'production_batch', 'purchase_invoice', 'manual'
  reference_id TEXT,
  notes TEXT,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id)
);

-- 5. Products (Satış Menüsü / Ürünler)
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Döner', 'Porsiyon', 'Pilav Üstü', 'Yan Ürün', 'İçecek'
  base_price REAL NOT NULL DEFAULT 0,
  vat_rate REAL NOT NULL DEFAULT 10,
  image_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_campaign INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Product Channel Prices (Kanal Bazlı Fiyatlar)
CREATE TABLE IF NOT EXISTS product_channel_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  channel TEXT NOT NULL, -- 'dine_in', 'takeaway', 'yemeksepeti', 'phone', 'other'
  price REAL NOT NULL,
  UNIQUE(product_id, channel),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 7. Recipes (Reçeteler)
CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER UNIQUE NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 8. Recipe Items (Reçete Bileşenleri)
CREATE TABLE IF NOT EXISTS recipe_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  inventory_item_id INTEGER NOT NULL,
  quantity REAL NOT NULL, -- e.g. 0.110 for 110g et in kg, 1 for ekmek
  notes TEXT,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
);

-- 9. Recipe History (Reçete Değişiklik Tarihçesi)
CREATE TABLE IF NOT EXISTS recipe_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  changed_by TEXT NOT NULL,
  change_summary TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Production Batches (Döner Verimlilik ve Pişirme Analizi)
CREATE TABLE IF NOT EXISTS production_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_type TEXT NOT NULL, -- 'et', 'tavuk'
  batch_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  raw_weight_kg REAL NOT NULL,
  cooked_weight_kg REAL NOT NULL,
  waste_weight_kg REAL NOT NULL,
  waste_percentage REAL NOT NULL,
  yield_percentage REAL NOT NULL,
  portion_size_g REAL NOT NULL,
  usable_portions_count REAL NOT NULL,
  batch_cost_tl REAL NOT NULL,
  cost_per_portion_tl REAL NOT NULL,
  theoretical_consumption_g REAL DEFAULT 0,
  actual_consumption_g REAL DEFAULT 0,
  variance_g REAL DEFAULT 0,
  variance_loss_tl REAL DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. Orders (Siparişler)
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE NOT NULL,
  channel TEXT NOT NULL, -- 'dine_in', 'takeaway', 'yemeksepeti', 'phone', 'other'
  table_or_customer TEXT,
  status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'cancelled', 'returned'
  payment_method TEXT NOT NULL, -- 'cash', 'credit_card', 'meal_card', 'yemeksepeti_online', 'veresiye'
  payment_status TEXT NOT NULL DEFAULT 'paid',
  subtotal REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  discount_reason TEXT,
  tax_amount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  cogs_total REAL NOT NULL DEFAULT 0,
  gross_margin REAL NOT NULL DEFAULT 0,
  channel_commission_rate REAL NOT NULL DEFAULT 0,
  channel_commission_amount REAL NOT NULL DEFAULT 0,
  net_earnings REAL NOT NULL DEFAULT 0,
  cancellation_reason TEXT,
  notes TEXT,
  cashier_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. Order Items (Sipariş Kalemleri)
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  bread_type TEXT,
  unit_price REAL NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  total_price REAL NOT NULL,
  unit_cogs REAL NOT NULL DEFAULT 0,
  total_cogs REAL NOT NULL DEFAULT 0,
  notes TEXT,
  extras_json TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 13. Cash Registers & Accounts (Kasa ve Banka Hesapları)
CREATE TABLE IF NOT EXISTS cash_registers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL, -- 'cash', 'bank', 'yemeksepeti_receivable'
  name TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 14. Cash Transactions (Kasa / Banka Hareketleri)
CREATE TABLE IF NOT EXISTS cash_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  register_id INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'income', 'expense', 'transfer'
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  description TEXT NOT NULL,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (register_id) REFERENCES cash_registers(id)
);

-- 15. Cash Closings (Gün Sonu Kapanışı / Z-Raporu)
CREATE TABLE IF NOT EXISTS cash_closings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  closing_date TEXT NOT NULL,
  expected_cash REAL NOT NULL DEFAULT 0,
  counted_cash REAL NOT NULL DEFAULT 0,
  cash_variance REAL NOT NULL DEFAULT 0,
  expected_card REAL NOT NULL DEFAULT 0,
  counted_card REAL NOT NULL DEFAULT 0,
  total_turnover REAL NOT NULL DEFAULT 0,
  total_expenses REAL NOT NULL DEFAULT 0,
  total_cogs REAL NOT NULL DEFAULT 0,
  net_profit REAL NOT NULL DEFAULT 0,
  notes TEXT,
  closed_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 16. Accounts (Cari Hesaplar - Tedarikçiler, Personel, Platformlar)
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'supplier', 'customer', 'staff', 'platform'
  phone TEXT,
  tax_id TEXT,
  balance REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 17. Account Transactions (Cari Hareketler)
CREATE TABLE IF NOT EXISTS account_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'debit', 'credit'
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  reference_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- 18. Expenses (Gider Kayıtları)
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL, -- 'cash', 'bank', 'credit'
  account_id INTEGER,
  is_stock_purchase INTEGER NOT NULL DEFAULT 0, -- 1 if stock asset acquisition, 0 if operational expense
  expense_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT NOT NULL,
  receipt_no TEXT,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- 19. Yemeksepeti Orders (Yemeksepeti Mutabakat ve Analiz)
CREATE TABLE IF NOT EXISTS yemeksepeti_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform_order_id TEXT UNIQUE NOT NULL,
  order_date DATETIME NOT NULL,
  gross_amount REAL NOT NULL DEFAULT 0,
  restaurant_discount REAL NOT NULL DEFAULT 0,
  platform_discount REAL NOT NULL DEFAULT 0,
  commission_rate REAL NOT NULL DEFAULT 15,
  commission_amount REAL NOT NULL DEFAULT 0,
  platform_fees REAL NOT NULL DEFAULT 0,
  net_payout REAL NOT NULL DEFAULT 0,
  calculated_cogs REAL NOT NULL DEFAULT 0,
  packaging_cost REAL NOT NULL DEFAULT 0,
  delivery_cost REAL NOT NULL DEFAULT 0,
  contribution_profit REAL NOT NULL DEFAULT 0,
  is_reconciled INTEGER NOT NULL DEFAULT 0,
  reconciled_date DATETIME,
  raw_data_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 20. Audit Logs (Denetim Kayıtları)
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_value TEXT,
  new_value TEXT,
  details TEXT,
  ip_or_device TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 21. Customers (Müşteri Kayıt & Rehber / Paket Servis & Telefon Siparişi)
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  last_order_notes TEXT,
  total_orders_count INTEGER NOT NULL DEFAULT 0,
  total_spent REAL NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(full_name);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_inv_tx_item ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_created ON inventory_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_cash_tx_date ON cash_transactions(created_at);
`;
