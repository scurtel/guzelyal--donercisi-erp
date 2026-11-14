// Unified SQLite Database Layer for Güzelyalı ERP
// Supports Electron Native / IPC + WebAssembly (sql.js) for 100% offline & zero-dependency execution

import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { CREATE_TABLES_SQL } from './schema';
import { SEED_DATA_SQL } from './seeds';
import { REAL_CUSTOMERS_SQL, REAL_ORDERS_SQL, REAL_YEMEKSEPETI_ORDERS_SQL } from './realData';
import {
  Product,
  InventoryItem,
  Recipe,
  Order,
  ProductionBatch,
  Expense,
  CashRegister,
  CashClosing,
  Account,
  Customer,
  YemeksepetiOrder,
  AuditLog,
  DashboardMetrics,
  MenuEngineeringItem,
  SalesChannel,
  SALES_CHANNEL_LABELS
} from '../types';
import { roundMoney } from '../utils/format';

const STORAGE_KEY = 'guzelyali_erp_sqlite_db';

function isValidSqliteHeader(data: Uint8Array): boolean {
  if (data.length < 16) return false;
  // SQLite format 3\0 (0x53 0x51 0x4c 0x69 0x74 0x65 0x20 0x66 0x6f 0x72 0x6d 0x61 0x74 0x20 0x33 0x00)
  const header = String.fromCharCode(...data.slice(0, 15));
  return header === 'SQLite format 3';
}

class DatabaseService {
  private db: SqlJsDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.isInitialized && this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const SQL = await initSqlJs({
          // 100% offline local WebAssembly binary
          locateFile: () => './sql-wasm.wasm',
        });

        // Check if there is an existing database saved in server API, Electron storage, or localStorage
        let savedData: Uint8Array | null = null;
        
        const isLocalhost = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

        // 1. Try cloud server synchronization if deployed on live web server (skip on Vite localhost dev server)
        if (!isLocalhost && typeof window !== 'undefined' && window.location.protocol.startsWith('http') && !(window as any).electronAPI) {
          try {
            const res = await fetch('./api/sync.php?action=load');
            const contentType = res.headers.get('content-type') || '';
            if (res.ok && res.status === 200 && !contentType.includes('text/html')) {
              const buffer = await res.arrayBuffer();
              const candidate = new Uint8Array(buffer);
              if (candidate.byteLength > 100 && isValidSqliteHeader(candidate)) {
                savedData = candidate;
                console.log('Central cloud database loaded successfully from server.');
              }
            }
          } catch (e) {
            console.log('Server sync not available, falling back to local storage.');
          }
        }

        // 2. If in Electron environment with file persistence
        if (!savedData && typeof window !== 'undefined' && (window as any).electronAPI?.loadDatabase) {
          const buffer = await (window as any).electronAPI.loadDatabase();
          if (buffer) {
            const candidate = new Uint8Array(buffer);
            if (isValidSqliteHeader(candidate)) {
              savedData = candidate;
            }
          }
        } else if (!savedData && typeof window !== 'undefined' && window.localStorage) {
          try {
            const savedBase64 = localStorage.getItem(STORAGE_KEY);
            if (savedBase64) {
              const binaryString = atob(savedBase64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              if (isValidSqliteHeader(bytes)) {
                savedData = bytes;
              } else {
                console.warn('Corrupt or invalid SQLite database in localStorage, clearing.');
                localStorage.removeItem(STORAGE_KEY);
              }
            }
          } catch (e) {
            console.warn('Failed reading localStorage database:', e);
            localStorage.removeItem(STORAGE_KEY);
          }
        }

        if (savedData && savedData.length > 0) {
          try {
            this.db = new SQL.Database(savedData);
            this.applyMigrations();
            this.persist();
          } catch (loadErr) {
            console.warn('Failed to open saved database, falling back to clean seed database:', loadErr);
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.removeItem(STORAGE_KEY);
            }
            this.db = new SQL.Database();
            this.db.run(CREATE_TABLES_SQL);
            this.db.run(SEED_DATA_SQL);
            this.persist();
          }
        } else {
          this.db = new SQL.Database();
          this.db.run(CREATE_TABLES_SQL);
          this.db.run(SEED_DATA_SQL);
          this.persist();
        }

        this.isInitialized = true;
      } catch (err) {
        console.error('Database initialization error:', err);
        throw err;
      }
    })();

    return this.initPromise;
  }

  // Automatic schema migration, cleanup of demo records, and menu price alignment
  private applyMigrations(): void {
    if (!this.db) return;
    try {
      // 1. Ensure any newly added tables exist
      this.db.run(CREATE_TABLES_SQL);

      // 2. Remove fake/demo test customers
      this.db.run(`
        DELETE FROM customers 
        WHERE full_name IN ('Ahmet Yılmaz', 'Mehmet Kaya', 'Ayşe Demir', 'Canan Yıldız')
           OR phone IN ('0532 123 45 67', '0533 987 65 43', '0544 555 12 34', '0555 888 99 00');
      `);

      // 3. Ensure seed rows exist (INSERT OR IGNORE)
      this.db.run(SEED_DATA_SQL);

      // 4. Ensure real customers are inserted
      this.db.run(REAL_CUSTOMERS_SQL);

      // 5. Ensure real orders and Yemeksepeti orders are inserted
      this.db.run(REAL_ORDERS_SQL);
      this.db.run(REAL_YEMEKSEPETI_ORDERS_SQL);

      // 3. Update existing products to match the real physical menu board
      const priceUpdates = [
        { code: 'PRD-TVK-SER', name: 'Tavuk Döner Servis', price: 230.0, ysPrice: 265.0 },
        { code: 'PRD-TVK-DUR', name: 'Tavuk Dürüm (Lavaş)', price: 180.0, ysPrice: 210.0 },
        { code: 'PRD-TVK-SUT', name: 'Tavuk Sütlü Ekmek', price: 180.0, ysPrice: 210.0 },
        { code: 'PRD-TVK-PID', name: 'Tavuk Pide Dürüm', price: 180.0, ysPrice: 210.0 },
        { code: 'PRD-ET-SER', name: 'Et Döner Servis', price: 370.0, ysPrice: 425.0 },
        { code: 'PRD-ET-DUR', name: 'Et Dürüm (Lavaş)', price: 320.0, ysPrice: 370.0 },
        { code: 'PRD-ET-SUT', name: 'Et Sütlü Ekmek', price: 320.0, ysPrice: 370.0 },
        { code: 'PRD-ET-PID', name: 'Et Pide Dürüm', price: 320.0, ysPrice: 370.0 },
        { code: 'PRD-PIL-TVK', name: 'Pilav Üstü Tavuk', price: 320.0, ysPrice: 370.0 },
        { code: 'PRD-PIL-ET', name: 'Pilav Üstü Et', price: 450.0, ysPrice: 520.0 },
        { code: 'PRD-PAT', name: 'Patates Kızartması', price: 80.0, ysPrice: 95.0 },
        { code: 'PRD-AYR', name: 'Ayran', price: 40.0, ysPrice: 50.0 },
        { code: 'PRD-KUT', name: 'Kutu İçecek', price: 75.0, ysPrice: 90.0 },
        { code: 'PRD-SU', name: 'Su', price: 20.0, ysPrice: 25.0 },
        { code: 'PRD-KZN', name: 'Kazandibi (Eker)', price: 50.0, ysPrice: 60.0 },
        { code: 'PRD-PUD', name: 'Puding (Eker)', price: 50.0, ysPrice: 60.0 },
      ];

      for (const item of priceUpdates) {
        this.db.run(
          `UPDATE products SET base_price = ?, name = ? WHERE code = ?`,
          [item.price, item.name, item.code]
        );
        this.db.run(
          `UPDATE product_channel_prices SET price = ? WHERE product_id = (SELECT id FROM products WHERE code = ?) AND channel IN ('dine_in', 'takeaway', 'phone')`,
          [item.price, item.code]
        );
        this.db.run(
          `UPDATE product_channel_prices SET price = ? WHERE product_id = (SELECT id FROM products WHERE code = ?) AND channel = 'yemeksepeti'`,
          [item.ysPrice, item.code]
        );
      }
    } catch (e) {
      console.warn('Migration warning:', e);
    }
  }

  // Persist current state to localStorage and Electron file storage
  private persist(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      
      // Save via Electron if available
      if (typeof window !== 'undefined' && (window as any).electronAPI?.saveDatabase) {
        (window as any).electronAPI.saveDatabase(data);
      }
      
      // Also save to localStorage in browser/fallback
      if (typeof window !== 'undefined' && window.localStorage) {
        let binary = '';
        const len = data.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(data[i]);
        }
        localStorage.setItem(STORAGE_KEY, btoa(binary));
      }

      // Sync with cloud server if running in production web browser (skip on localhost)
      const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      if (!isLocalhost && typeof window !== 'undefined' && window.location.protocol.startsWith('http') && !(window as any).electronAPI) {
        fetch('./api/sync.php?action=save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: data,
        }).catch((err) => {
          console.warn('Background cloud sync failed:', err);
        });
      }
    } catch (e) {
      console.warn('Failed to persist database:', e);
    }
  }

  private ensureDb(): SqlJsDatabase {
    if (!this.db) {
      throw new Error('Database is not initialized. Call await dbService.init() first.');
    }
    return this.db;
  }

  // Execute raw query returning array of objects
  query<T = any>(sql: string, params: any[] = []): T[] {
    const db = this.ensureDb();
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
  }

  // Run an execute statement (INSERT, UPDATE, DELETE)
  run(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number } {
    const db = this.ensureDb();
    db.run(sql, params);
    const res = db.exec('SELECT changes() as chg, last_insert_rowid() as lid');
    const changes = res[0]?.values[0]?.[0] as number ?? 0;
    const lastInsertRowid = res[0]?.values[0]?.[1] as number ?? 0;
    this.persist();
    return { changes, lastInsertRowid };
  }

  // Database transaction runner
  transaction<T>(callback: () => T): T {
    const db = this.ensureDb();
    db.run('BEGIN TRANSACTION');
    try {
      const result = callback();
      db.run('COMMIT');
      this.persist();
      return result;
    } catch (error) {
      db.run('ROLLBACK');
      console.error('Transaction rolled back due to error:', error);
      throw error;
    }
  }

  // --- SETTINGS ---
  getSettings(): Record<string, string> {
    const rows = this.query<{ key: string; value: string }>('SELECT key, value FROM settings');
    const settings: Record<string, string> = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    return settings;
  }

  updateSetting(key: string, value: string): void {
    this.run(
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP',
      [key, value]
    );
  }

  // --- PRODUCTS & MENU ---
  getProducts(): Product[] {
    const products = this.query<Product>(
      'SELECT * FROM products WHERE is_active = 1 ORDER BY category, name'
    );
    for (const p of products) {
      const channelPrices = this.query<{ channel: SalesChannel; price: number }>(
        'SELECT channel, price FROM product_channel_prices WHERE product_id = ?',
        [p.id]
      );
      p.channel_prices = {
        dine_in: p.base_price,
        takeaway: p.base_price,
        yemeksepeti: p.base_price,
        phone: p.base_price,
        other: p.base_price,
      };
      for (const cp of channelPrices) {
        p.channel_prices[cp.channel] = cp.price;
      }

      // Load recipe calculation
      p.recipe = this.getRecipe(p.id) || undefined;
    }
    return products;
  }

  getProduct(id: number): Product | null {
    const rows = this.query<Product>('SELECT * FROM products WHERE id = ?', [id]);
    if (!rows.length) return null;
    const p = rows[0];
    const channelPrices = this.query<{ channel: SalesChannel; price: number }>(
      'SELECT channel, price FROM product_channel_prices WHERE product_id = ?',
      [p.id]
    );
    p.channel_prices = {
      dine_in: p.base_price,
      takeaway: p.base_price,
      yemeksepeti: p.base_price,
      phone: p.base_price,
      other: p.base_price,
    };
    for (const cp of channelPrices) {
      p.channel_prices[cp.channel] = cp.price;
    }
    p.recipe = this.getRecipe(p.id) || undefined;
    return p;
  }

  saveProduct(product: Partial<Product>, channelPrices?: Record<SalesChannel, number>): number {
    return this.transaction(() => {
      let productId = product.id;
      if (productId) {
        this.run(
          'UPDATE products SET name = ?, category = ?, base_price = ?, vat_rate = ?, is_active = ?, is_campaign = ? WHERE id = ?',
          [product.name, product.category, product.base_price, product.vat_rate ?? 10, product.is_active ?? 1, product.is_campaign ?? 0, productId]
        );
      } else {
        const res = this.run(
          'INSERT INTO products (code, name, category, base_price, vat_rate, is_active, is_campaign) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [product.code || `PRD-${Date.now()}`, product.name, product.category, product.base_price, product.vat_rate ?? 10, product.is_active ?? 1, product.is_campaign ?? 0]
        );
        productId = res.lastInsertRowid;
      }

      if (channelPrices && productId) {
        for (const [channel, price] of Object.entries(channelPrices)) {
          this.run(
            'INSERT INTO product_channel_prices (product_id, channel, price) VALUES (?, ?, ?) ON CONFLICT(product_id, channel) DO UPDATE SET price = excluded.price',
            [productId, channel, price]
          );
        }
      }

      return productId as number;
    });
  }

  // --- INVENTORY MANAGEMENT ---
  getInventoryItems(): InventoryItem[] {
    return this.query<InventoryItem>(`
      SELECT i.*, a.name as supplier_name 
      FROM inventory_items i
      LEFT JOIN accounts a ON i.supplier_id = a.id
      ORDER BY i.category, i.name
    `);
  }

  getInventoryItem(id: number): InventoryItem | null {
    const rows = this.query<InventoryItem>(
      'SELECT i.*, a.name as supplier_name FROM inventory_items i LEFT JOIN accounts a ON i.supplier_id = a.id WHERE i.id = ?',
      [id]
    );
    return rows[0] || null;
  }

  saveInventoryItem(item: Partial<InventoryItem>): number {
    if (item.id) {
      this.run(
        `UPDATE inventory_items 
         SET name = ?, category = ?, unit = ?, minimum_quantity = ?, last_purchase_price = ?, average_cost = ?, supplier_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [item.name, item.category, item.unit, item.minimum_quantity ?? 0, item.last_purchase_price ?? 0, item.average_cost ?? item.last_purchase_price ?? 0, item.supplier_id || null, item.id]
      );
      return item.id;
    } else {
      const code = item.code || `STK-${Date.now()}`;
      const res = this.run(
        `INSERT INTO inventory_items (code, name, category, unit, current_quantity, minimum_quantity, last_purchase_price, average_cost, supplier_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [code, item.name, item.category, item.unit, item.current_quantity ?? 0, item.minimum_quantity ?? 0, item.last_purchase_price ?? 0, item.average_cost ?? item.last_purchase_price ?? 0, item.supplier_id || null]
      );
      return res.lastInsertRowid;
    }
  }

  // Record inventory transactions (with weighted average cost calculation!)
  recordInventoryTransaction(
    itemId: number,
    transactionType: string,
    quantity: number,
    unitPrice: number,
    refType = 'manual',
    refId = '',
    notes = '',
    createdBy = 'Sistem'
  ): void {
    this.transaction(() => {
      const item = this.getInventoryItem(itemId);
      if (!item) throw new Error(`Inventory item ${itemId} not found`);

      const totalCost = roundMoney(quantity * unitPrice);
      let newQuantity = item.current_quantity;
      let newAverageCost = item.average_cost;

      // Handle stock balance changes
      if (['purchase', 'production_in', 'return'].includes(transactionType)) {
        // Inflows increase stock
        const totalOldValue = item.current_quantity * item.average_cost;
        const incomingValue = quantity * unitPrice;
        newQuantity = item.current_quantity + quantity;
        newAverageCost = newQuantity > 0 ? (totalOldValue + incomingValue) / newQuantity : unitPrice;

        this.run(
          `UPDATE inventory_items 
           SET current_quantity = ?, average_cost = ?, last_purchase_price = ?, last_purchase_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [newQuantity, newAverageCost, unitPrice > 0 ? unitPrice : item.last_purchase_price, itemId]
        );
      } else {
        // Outflows decrease stock (sale_consumption, production_out, waste_fire, count_adjustment)
        newQuantity = item.current_quantity - quantity;
        this.run(
          'UPDATE inventory_items SET current_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [newQuantity, itemId]
        );
      }

      this.run(
        `INSERT INTO inventory_transactions 
         (item_id, transaction_type, quantity, unit_price, total_cost, reference_type, reference_id, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [itemId, transactionType, quantity, unitPrice, totalCost, refType, refId, notes, createdBy]
      );
    });
  }

  getInventoryTransactions(itemId?: number): any[] {
    let sql = `
      SELECT t.*, i.name as item_name, i.unit
      FROM inventory_transactions t
      JOIN inventory_items i ON t.item_id = i.id
    `;
    const params: any[] = [];
    if (itemId) {
      sql += ' WHERE t.item_id = ?';
      params.push(itemId);
    }
    sql += ' ORDER BY t.created_at DESC LIMIT 200';
    return this.query(sql, params);
  }

  // --- RECIPES & PORTION ENGINEERING ---
  getRecipes(): Recipe[] {
    const recipes = this.query<{ id: number; product_id: number; version: number; is_active: number; notes: string }>(
      'SELECT * FROM recipes WHERE is_active = 1'
    );
    return recipes.map((r) => this.getRecipe(r.product_id)!);
  }

  getRecipe(productId: number): Recipe | null {
    const rRows = this.query<{ id: number; product_id: number; version: number; is_active: number; notes: string; updated_at: string }>(
      'SELECT * FROM recipes WHERE product_id = ?',
      [productId]
    );
    if (!rRows.length) return null;
    const r = rRows[0];
    const product = this.query<Product>('SELECT * FROM products WHERE id = ?', [productId])[0];

    const items = this.query<{
      id: number;
      recipe_id: number;
      inventory_item_id: number;
      quantity: number;
      notes: string;
      name: string;
      unit: string;
      average_cost: number;
      category: string;
    }>(
      `SELECT ri.*, ii.name, ii.unit, ii.average_cost, ii.category
       FROM recipe_items ri
       JOIN inventory_items ii ON ri.inventory_item_id = ii.id
       WHERE ri.recipe_id = ?`,
      [r.id]
    );

    let materialCost = 0;
    let packagingCost = 0;

    const formattedItems = items.map((it) => {
      const unitCost = it.average_cost;
      const totalCost = roundMoney(it.quantity * unitCost);
      if (it.category === 'Ambalaj') {
        packagingCost += totalCost;
      } else {
        materialCost += totalCost;
      }
      return {
        id: it.id,
        recipe_id: it.recipe_id,
        inventory_item_id: it.inventory_item_id,
        item_name: it.name,
        unit: it.unit,
        quantity: it.quantity,
        unit_cost: unitCost,
        total_cost: totalCost,
        notes: it.notes,
      };
    });

    const totalDirectCost = roundMoney(materialCost + packagingCost);
    const salePrice = product?.base_price ?? 0;
    const grossMarginAmount = roundMoney(salePrice - totalDirectCost);
    const grossMarginPercent = salePrice > 0 ? roundMoney((grossMarginAmount / salePrice) * 100) : 0;
    
    // Yemeksepeti default 15% commission impact
    const commissionCost = roundMoney(salePrice * 0.15);
    const netMarginAfterCommission = roundMoney(grossMarginAmount - commissionCost);

    return {
      id: r.id,
      product_id: r.product_id,
      product_name: product?.name || 'Bilinmeyen Ürün',
      version: r.version,
      is_active: r.is_active,
      items: formattedItems,
      material_cost: materialCost,
      packaging_cost: packagingCost,
      total_direct_cost: totalDirectCost,
      sale_price: salePrice,
      gross_margin_amount: grossMarginAmount,
      gross_margin_percent: grossMarginPercent,
      net_margin_after_commission: netMarginAfterCommission,
      notes: r.notes,
      updated_at: r.updated_at,
    };
  }

  saveRecipe(
    productId: number,
    items: { inventory_item_id: number; quantity: number; notes?: string }[],
    notes = '',
    changedBy = 'Yönetici'
  ): number {
    return this.transaction(() => {
      let rRows = this.query<{ id: number; version: number }>('SELECT id, version FROM recipes WHERE product_id = ?', [productId]);
      let recipeId: number;
      let nextVersion = 1;

      if (rRows.length > 0) {
        recipeId = rRows[0].id;
        nextVersion = rRows[0].version + 1;
        this.run('UPDATE recipes SET version = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [nextVersion, notes, recipeId]);
        this.run('DELETE FROM recipe_items WHERE recipe_id = ?', [recipeId]);
      } else {
        const res = this.run('INSERT INTO recipes (product_id, version, notes) VALUES (?, 1, ?)', [productId, notes]);
        recipeId = res.lastInsertRowid;
      }

      for (const it of items) {
        this.run(
          'INSERT INTO recipe_items (recipe_id, inventory_item_id, quantity, notes) VALUES (?, ?, ?, ?)',
          [recipeId, it.inventory_item_id, it.quantity, it.notes || '']
        );
      }

      // Save audit history
      const snapshot = JSON.stringify({ items, notes, version: nextVersion });
      this.run(
        'INSERT INTO recipe_history (recipe_id, product_id, changed_by, change_summary, snapshot_json) VALUES (?, ?, ?, ?, ?)',
        [recipeId, productId, changedBy, `Reçete güncellendi (Versiyon ${nextVersion})`, snapshot]
      );

      return recipeId;
    });
  }

  getRecipeHistory(productId?: number): any[] {
    let sql = `
      SELECT rh.*, p.name as product_name
      FROM recipe_history rh
      JOIN products p ON rh.product_id = p.id
    `;
    const params: any[] = [];
    if (productId) {
      sql += ' WHERE rh.product_id = ?';
      params.push(productId);
    }
    sql += ' ORDER BY rh.created_at DESC LIMIT 50';
    return this.query(sql, params);
  }

  // --- DONER PRODUCTION & EFFICIENCY ANALYSIS ---
  recordProductionBatch(batch: {
    batch_type: 'et' | 'tavuk';
    raw_weight_kg: number;
    cooked_weight_kg: number;
    portion_size_g: number;
    batch_cost_tl: number;
    notes?: string;
  }): number {
    return this.transaction(() => {
      const rawKg = batch.raw_weight_kg;
      const cookedKg = batch.cooked_weight_kg;
      const wasteKg = roundMoney(rawKg - cookedKg);
      const wastePercent = rawKg > 0 ? roundMoney((wasteKg / rawKg) * 100) : 0;
      const yieldPercent = rawKg > 0 ? roundMoney((cookedKg / rawKg) * 100) : 0;
      
      const portionG = batch.portion_size_g; // e.g. 110g for et, 100g for tavuk
      const portionKg = portionG / 1000;
      const usablePortions = portionKg > 0 ? Math.floor(cookedKg / portionKg) : 0;
      const costPerPortion = usablePortions > 0 ? roundMoney(batch.batch_cost_tl / usablePortions) : 0;

      const res = this.run(
        `INSERT INTO production_batches 
         (batch_type, raw_weight_kg, cooked_weight_kg, waste_weight_kg, waste_percentage, yield_percentage, portion_size_g, usable_portions_count, batch_cost_tl, cost_per_portion_tl, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          batch.batch_type,
          rawKg,
          cookedKg,
          wasteKg,
          wastePercent,
          yieldPercent,
          portionG,
          usablePortions,
          batch.batch_cost_tl,
          costPerPortion,
          batch.notes || ''
        ]
      );
      const batchId = res.lastInsertRowid;

      // Update raw stock item (Deduct raw meat consumed)
      const stockItemId = batch.batch_type === 'et' ? 1 : 2; // 1 = STK-ET, 2 = STK-TVK
      const rawItem = this.getInventoryItem(stockItemId);
      if (rawItem) {
        this.recordInventoryTransaction(
          stockItemId,
          'production_out',
          rawKg,
          rawItem.average_cost,
          'production_batch',
          String(batchId),
          `${batch.batch_type.toUpperCase()} Döner Üretimi için ${rawKg} kg çiğ et kullanıldı.`,
          'Usta'
        );
      }

      return batchId;
    });
  }

  getProductionBatches(type?: 'et' | 'tavuk'): ProductionBatch[] {
    let sql = 'SELECT * FROM production_batches';
    const params: any[] = [];
    if (type) {
      sql += ' WHERE batch_type = ?';
      params.push(type);
    }
    sql += ' ORDER BY created_at DESC LIMIT 100';
    return this.query<ProductionBatch>(sql, params);
  }

  // --- ORDERS, POS & SALES EXECUTION ---
  createOrder(orderData: {
    channel: SalesChannel;
    table_or_customer?: string;
    payment_method: any;
    items: {
      product_id: number;
      product_name: string;
      bread_type?: string;
      unit_price: number;
      quantity: number;
      extras_json?: string;
      notes?: string;
    }[];
    discount_amount?: number;
    discount_reason?: string;
    notes?: string;
    cashier_id?: number;
    cashier_name?: string;
  }): Order {
    return this.transaction(() => {
      const orderNumber = `GZY-${Date.now().toString().slice(-6)}`;
      const discount = orderData.discount_amount || 0;
      let subtotal = 0;
      let totalCogs = 0;

      // Calculate totals and COGS per item based on recipes
      const preparedItems = orderData.items.map((it) => {
        const lineTotal = roundMoney(it.unit_price * it.quantity);
        subtotal += lineTotal;

        // Calculate item COGS from active recipe
        const recipe = this.getRecipe(it.product_id);
        const unitCogs = recipe ? recipe.total_direct_cost : 0;
        const lineCogs = roundMoney(unitCogs * it.quantity);
        totalCogs += lineCogs;

        return {
          ...it,
          total_price: lineTotal,
          unit_cogs: unitCogs,
          total_cogs: lineCogs,
        };
      });

      const totalAmount = Math.max(0, roundMoney(subtotal - discount));
      const taxAmount = roundMoney(totalAmount * (10 / 110)); // 10% VAT standard
      const grossMargin = roundMoney(totalAmount - totalCogs);

      // Channel commission (Yemeksepeti default 15%)
      let channelCommissionRate = 0;
      let channelCommissionAmount = 0;
      if (orderData.channel === 'yemeksepeti') {
        const commSetting = this.query<{ value: string }>('SELECT value FROM settings WHERE key = "default_yemeksepeti_commission"');
        channelCommissionRate = commSetting.length ? parseFloat(commSetting[0].value) : 15;
        channelCommissionAmount = roundMoney(totalAmount * (channelCommissionRate / 100));
      }
      const netEarnings = roundMoney(totalAmount - channelCommissionAmount);

      // 1. Insert Order
      const resOrder = this.run(
        `INSERT INTO orders 
         (order_number, channel, table_or_customer, status, payment_method, payment_status, subtotal, discount_amount, discount_reason, tax_amount, total_amount, cogs_total, gross_margin, channel_commission_rate, channel_commission_amount, net_earnings, notes, cashier_id)
         VALUES (?, ?, ?, 'completed', ?, 'paid', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber,
          orderData.channel,
          orderData.table_or_customer || 'Misafir',
          orderData.payment_method,
          subtotal,
          discount,
          orderData.discount_reason || '',
          taxAmount,
          totalAmount,
          totalCogs,
          grossMargin,
          channelCommissionRate,
          channelCommissionAmount,
          netEarnings,
          orderData.notes || '',
          orderData.cashier_id || 1,
        ]
      );
      const orderId = resOrder.lastInsertRowid;

      // 2. Insert Order Items and Deduct Recipe Stock!
      for (const it of preparedItems) {
        this.run(
          `INSERT INTO order_items 
           (order_id, product_id, product_name, bread_type, unit_price, quantity, total_price, unit_cogs, total_cogs, notes, extras_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderId, it.product_id, it.product_name, it.bread_type || '', it.unit_price, it.quantity, it.total_price, it.unit_cogs, it.total_cogs, it.notes || '', it.extras_json || '']
        );

        // Recipe stock deduction
        const recipe = this.getRecipe(it.product_id);
        if (recipe && recipe.items.length > 0) {
          for (const rItem of recipe.items) {
            const deductionQty = rItem.quantity * it.quantity;
            this.recordInventoryTransaction(
              rItem.inventory_item_id,
              'sale_consumption',
              deductionQty,
              rItem.unit_cost || 0,
              'order',
              String(orderId),
              `Sipariş ${orderNumber}: ${it.quantity}x ${it.product_name} satışı reçete düşüşü`,
              orderData.cashier_name || 'Kasiyer'
            );
          }
        }
      }

      // 3. Reflect payment in Cash Register or Platform Accounts
      if (orderData.payment_method === 'cash') {
        this.run('UPDATE cash_registers SET balance = balance + ? WHERE id = 1', [totalAmount]);
        this.run(
          'INSERT INTO cash_transactions (register_id, transaction_type, amount, category, reference_type, reference_id, description, created_by) VALUES (1, "income", ?, "Satış Geliri", "order", ?, ?, ?)',
          [totalAmount, orderId, `Sipariş ${orderNumber} Nakit Satış`, orderData.cashier_name || 'Kasiyer']
        );
      } else if (orderData.payment_method === 'credit_card' || orderData.payment_method === 'meal_card') {
        this.run('UPDATE cash_registers SET balance = balance + ? WHERE id = 2', [totalAmount]);
        this.run(
          'INSERT INTO cash_transactions (register_id, transaction_type, amount, category, reference_type, reference_id, description, created_by) VALUES (2, "income", ?, "POS Satış Geliri", "order", ?, ?, ?)',
          [totalAmount, orderId, `Sipariş ${orderNumber} Kredi Kartı/POS Satış`, orderData.cashier_name || 'Kasiyer']
        );
      } else if (orderData.channel === 'yemeksepeti' || orderData.payment_method === 'yemeksepeti_online') {
        // Yemeksepeti net payout increases receivable
        this.run('UPDATE cash_registers SET balance = balance + ? WHERE id = 3', [netEarnings]);
        this.run('UPDATE accounts SET balance = balance + ? WHERE id = 7', [netEarnings]); // Yemeksepeti cari hesabı
        this.run(
          'INSERT INTO cash_transactions (register_id, transaction_type, amount, category, reference_type, reference_id, description, created_by) VALUES (3, "income", ?, "Yemeksepeti Net Alacak", "order", ?, ?, ?)',
          [netEarnings, orderId, `Sipariş ${orderNumber} Yemeksepeti Online Satış (Komisyon kesildi)`, orderData.cashier_name || 'Kasiyer']
        );
      }

      // 4. Return created order
      return this.getOrder(orderId)!;
    });
  }

  getOrder(id: number): Order | null {
    const orders = this.query<Order>('SELECT * FROM orders WHERE id = ?', [id]);
    if (!orders.length) return null;
    const order = orders[0];
    order.items = this.query<any>('SELECT * FROM order_items WHERE order_id = ?', [id]);
    return order;
  }

  getOrders(limit = 100, status?: string): Order[] {
    let sql = 'SELECT * FROM orders';
    const params: any[] = [];
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const orders = this.query<Order>(sql, params);
    for (const o of orders) {
      o.items = this.query<any>('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
    }
    return orders;
  }

  // Order cancellation & return with inventory and cash reversal
  cancelOrder(orderId: number, reason: string, cancelledBy = 'Yönetici'): void {
    this.transaction(() => {
      const order = this.getOrder(orderId);
      if (!order) throw new Error('Order not found');
      if (order.status !== 'completed') throw new Error('Bu sipariş zaten iptal veya iade edilmiş');

      // 1. Update order status
      this.run(
        'UPDATE orders SET status = "cancelled", cancellation_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [reason, orderId]
      );

      // 2. Reverse inventory consumption (return items back to stock)
      for (const item of order.items) {
        const recipe = this.getRecipe(item.product_id);
        if (recipe) {
          for (const rItem of recipe.items) {
            const returnQty = rItem.quantity * item.quantity;
            this.recordInventoryTransaction(
              rItem.inventory_item_id,
              'return',
              returnQty,
              rItem.unit_cost || 0,
              'order_cancel',
              String(orderId),
              `İptal Sipariş ${order.order_number}: ${item.product_name} iadesi`,
              cancelledBy
            );
          }
        }
      }

      // 3. Reverse cash balance
      if (order.payment_method === 'cash') {
        this.run('UPDATE cash_registers SET balance = balance - ? WHERE id = 1', [order.total_amount]);
        this.run(
          'INSERT INTO cash_transactions (register_id, transaction_type, amount, category, reference_type, reference_id, description, created_by) VALUES (1, "expense", ?, "Sipariş İptal İadesi", "order_cancel", ?, ?, ?)',
          [order.total_amount, orderId, `İptal Sipariş ${order.order_number} Nakit Çıkışı`, cancelledBy]
        );
      } else if (order.payment_method === 'credit_card' || order.payment_method === 'meal_card') {
        this.run('UPDATE cash_registers SET balance = balance - ? WHERE id = 2', [order.total_amount]);
      } else if (order.channel === 'yemeksepeti') {
        this.run('UPDATE cash_registers SET balance = balance - ? WHERE id = 3', [order.net_earnings]);
        this.run('UPDATE accounts SET balance = balance - ? WHERE id = 7', [order.net_earnings]);
      }

      // 4. Audit log
      this.run(
        'INSERT INTO audit_logs (user_name, action, entity_type, entity_id, details) VALUES (?, "order_cancel", "orders", ?, ?)',
        [cancelledBy, orderId, `Sipariş ${order.order_number} iptal edildi. Sebep: ${reason}`]
      );
    });
  }

  // --- EXPENSES & FINANCIAL ACCOUNTING ---
  getExpenses(): Expense[] {
    return this.query<Expense>(`
      SELECT e.*, a.name as account_name
      FROM expenses e
      LEFT JOIN accounts a ON e.account_id = a.id
      ORDER BY e.expense_date DESC
    `);
  }

  saveExpense(expense: {
    category: string;
    amount: number;
    payment_method: 'cash' | 'bank' | 'credit';
    account_id?: number | null;
    is_stock_purchase?: boolean;
    expense_date?: string;
    description: string;
    receipt_no?: string;
    created_by?: string;
  }): number {
    return this.transaction(() => {
      const isStock = expense.is_stock_purchase ? 1 : 0;
      const res = this.run(
        `INSERT INTO expenses (category, amount, payment_method, account_id, is_stock_purchase, expense_date, description, receipt_no, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          expense.category,
          expense.amount,
          expense.payment_method,
          expense.account_id || null,
          isStock,
          expense.expense_date || new Date().toISOString(),
          expense.description,
          expense.receipt_no || '',
          expense.created_by || 'Yönetici'
        ]
      );
      const expenseId = res.lastInsertRowid;

      // Update cash register if paid by cash or bank
      if (expense.payment_method === 'cash') {
        this.run('UPDATE cash_registers SET balance = balance - ? WHERE id = 1', [expense.amount]);
        this.run(
          'INSERT INTO cash_transactions (register_id, transaction_type, amount, category, reference_type, reference_id, description, created_by) VALUES (1, "expense", ?, ?, "expense", ?, ?, ?)',
          [expense.amount, expense.category, expenseId, expense.description, expense.created_by || 'Yönetici']
        );
      } else if (expense.payment_method === 'bank') {
        this.run('UPDATE cash_registers SET balance = balance - ? WHERE id = 2', [expense.amount]);
        this.run(
          'INSERT INTO cash_transactions (register_id, transaction_type, amount, category, reference_type, reference_id, description, created_by) VALUES (2, "expense", ?, ?, "expense", ?, ?, ?)',
          [expense.amount, expense.category, expenseId, expense.description, expense.created_by || 'Yönetici']
        );
      } else if (expense.payment_method === 'credit' && expense.account_id) {
        // Borç kaydedildi
        this.run('UPDATE accounts SET balance = balance + ? WHERE id = ?', [expense.amount, expense.account_id]);
        this.run(
          'INSERT INTO account_transactions (account_id, type, amount, description, reference_id) VALUES (?, "credit", ?, ?, ?)',
          [expense.account_id, expense.amount, expense.description, expenseId]
        );
      }

      return expenseId;
    });
  }

  // --- CASH REGISTERS, TRANSFERS & Z-REPORT CLOSINGS ---
  getCashRegisters(): CashRegister[] {
    return this.query<CashRegister>('SELECT * FROM cash_registers ORDER BY id');
  }

  getCashTransactions(registerId?: number): any[] {
    let sql = `
      SELECT ct.*, cr.name as register_name
      FROM cash_transactions ct
      JOIN cash_registers cr ON ct.register_id = cr.id
    `;
    const params: any[] = [];
    if (registerId) {
      sql += ' WHERE ct.register_id = ?';
      params.push(registerId);
    }
    sql += ' ORDER BY ct.created_at DESC LIMIT 100';
    return this.query(sql, params);
  }

  recordCashClosing(closing: {
    closing_date: string;
    counted_cash: number;
    counted_card: number;
    notes?: string;
    closed_by: string;
  }): CashClosing {
    return this.transaction(() => {
      const regCash = this.query<{ balance: number }>('SELECT balance FROM cash_registers WHERE id = 1')[0]?.balance ?? 0;
      const regBank = this.query<{ balance: number }>('SELECT balance FROM cash_registers WHERE id = 2')[0]?.balance ?? 0;

      const expectedCash = regCash;
      const cashVariance = roundMoney(closing.counted_cash - expectedCash);
      const expectedCard = regBank;

      // Turnover & costs for the day
      const today = closing.closing_date;
      const orders = this.query<{ total: number; cogs: number }>(
        'SELECT COALESCE(SUM(total_amount), 0) as total, COALESCE(SUM(cogs_total), 0) as cogs FROM orders WHERE status = "completed" AND date(created_at) = date(?)',
        [today]
      );
      const totalTurnover = orders[0]?.total ?? 0;
      const totalCogs = orders[0]?.cogs ?? 0;

      const exp = this.query<{ total: number }>(
        'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE is_stock_purchase = 0 AND date(expense_date) = date(?)',
        [today]
      );
      const totalExpenses = exp[0]?.total ?? 0;
      const netProfit = roundMoney(totalTurnover - totalCogs - totalExpenses);

      const res = this.run(
        `INSERT INTO cash_closings 
         (closing_date, expected_cash, counted_cash, cash_variance, expected_card, counted_card, total_turnover, total_expenses, total_cogs, net_profit, notes, closed_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          today,
          expectedCash,
          closing.counted_cash,
          cashVariance,
          expectedCard,
          closing.counted_card,
          totalTurnover,
          totalExpenses,
          totalCogs,
          netProfit,
          closing.notes || '',
          closing.closed_by
        ]
      );

      return {
        id: res.lastInsertRowid,
        closing_date: today,
        expected_cash: expectedCash,
        counted_cash: closing.counted_cash,
        cash_variance: cashVariance,
        expected_card: expectedCard,
        counted_card: closing.counted_card,
        total_turnover: totalTurnover,
        total_expenses: totalExpenses,
        total_cogs: totalCogs,
        net_profit: netProfit,
        notes: closing.notes,
        closed_by: closing.closed_by,
        created_at: new Date().toISOString(),
      };
    });
  }

  getCashClosings(): CashClosing[] {
    return this.query<CashClosing>('SELECT * FROM cash_closings ORDER BY closing_date DESC LIMIT 30');
  }

  // --- ACCOUNTS (SUPPLIERS & STAFF) ---
  getAccounts(type?: string): Account[] {
    let sql = 'SELECT * FROM accounts';
    const params: any[] = [];
    if (type) {
      sql += ' WHERE type = ?';
      params.push(type);
    }
    sql += ' ORDER BY name';
    return this.query<Account>(sql, params);
  }

  saveAccount(acc: Partial<Account>): number {
    if (acc.id) {
      this.run('UPDATE accounts SET name = ?, type = ?, phone = ?, tax_id = ?, notes = ? WHERE id = ?', [
        acc.name,
        acc.type,
        acc.phone || '',
        acc.tax_id || '',
        acc.notes || '',
        acc.id,
      ]);
      return acc.id;
    } else {
      const res = this.run(
        'INSERT INTO accounts (name, type, phone, tax_id, balance, notes) VALUES (?, ?, ?, ?, 0, ?)',
        [acc.name, acc.type, acc.phone || '', acc.tax_id || '', acc.notes || '']
      );
      return res.lastInsertRowid;
    }
  }

  recordAccountPayment(accountId: number, amount: number, paymentType: 'cash' | 'bank', description: string, user = 'Yönetici'): void {
    this.transaction(() => {
      // Payment to a supplier decreases our debt (balance - amount)
      this.run('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, accountId]);
      this.run(
        'INSERT INTO account_transactions (account_id, type, amount, description) VALUES (?, "debit", ?, ?)',
        [accountId, amount, description]
      );

      // Decreases cash register
      const regId = paymentType === 'cash' ? 1 : 2;
      this.run('UPDATE cash_registers SET balance = balance - ? WHERE id = ?', [amount, regId]);
      this.run(
        'INSERT INTO cash_transactions (register_id, transaction_type, amount, category, reference_type, reference_id, description, created_by) VALUES (?, "expense", ?, "Cari Ödeme", "account", ?, ?, ?)',
        [regId, amount, accountId, description, user]
      );
    });
  }

  // --- YEMEKSEPETI RECONCILIATION & IMPORT ---
  getYemeksepetiOrders(): YemeksepetiOrder[] {
    return this.query<YemeksepetiOrder>('SELECT * FROM yemeksepeti_orders ORDER BY order_date DESC');
  }

  importYemeksepetiOrders(records: {
    platform_order_id: string;
    order_date: string;
    gross_amount: number;
    restaurant_discount?: number;
    platform_discount?: number;
    commission_rate?: number;
    commission_amount?: number;
    platform_fees?: number;
    net_payout?: number;
    calculated_cogs?: number;
    packaging_cost?: number;
    delivery_cost?: number;
    raw_data_json?: string;
  }[]): { imported: number; duplicates: number } {
    return this.transaction(() => {
      let imported = 0;
      let duplicates = 0;

      for (const rec of records) {
        const exists = this.query<{ id: number }>(
          'SELECT id FROM yemeksepeti_orders WHERE platform_order_id = ?',
          [rec.platform_order_id]
        );
        if (exists.length > 0) {
          duplicates++;
          continue;
        }

        const commRate = rec.commission_rate ?? 15;
        const commAmount = rec.commission_amount ?? roundMoney(rec.gross_amount * (commRate / 100));
        const restDiscount = rec.restaurant_discount ?? 0;
        const platDiscount = rec.platform_discount ?? 0;
        const platFees = rec.platform_fees ?? 0;
        const netPayout = rec.net_payout ?? roundMoney(rec.gross_amount - restDiscount - commAmount - platFees);
        const cogs = rec.calculated_cogs ?? roundMoney(rec.gross_amount * 0.38); // default estimate if not mapped
        const pack = rec.packaging_cost ?? 5.0;
        const del = rec.delivery_cost ?? 0;
        const contribProfit = roundMoney(netPayout - cogs - pack - del);

        this.run(
          `INSERT INTO yemeksepeti_orders 
           (platform_order_id, order_date, gross_amount, restaurant_discount, platform_discount, commission_rate, commission_amount, platform_fees, net_payout, calculated_cogs, packaging_cost, delivery_cost, contribution_profit, raw_data_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            rec.platform_order_id,
            rec.order_date,
            rec.gross_amount,
            restDiscount,
            platDiscount,
            commRate,
            commAmount,
            platFees,
            netPayout,
            cogs,
            pack,
            del,
            contribProfit,
            rec.raw_data_json || ''
          ]
        );
        imported++;
      }

      return { imported, duplicates };
    });
  }

  // --- MENU ENGINEERING (BCG Matrix for Restaurant Menu) ---
  getMenuEngineering(): MenuEngineeringItem[] {
    const products = this.getProducts();
    const orderItems = this.query<{ product_id: number; total_qty: number; total_rev: number; total_cogs: number }>(`
      SELECT product_id, SUM(quantity) as total_qty, SUM(total_price) as total_rev, SUM(total_cogs) as total_cogs
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = "completed"
      GROUP BY product_id
    `);

    const statsMap: Record<number, { qty: number; rev: number; cogs: number }> = {};
    let totalMenuQty = 0;
    for (const oi of orderItems) {
      statsMap[oi.product_id] = { qty: oi.total_qty, rev: oi.total_rev, cogs: oi.total_cogs };
      totalMenuQty += oi.total_qty;
    }

    const items: MenuEngineeringItem[] = [];
    let sumUnitMargin = 0;

    for (const p of products) {
      const stats = statsMap[p.id] || { qty: 0, rev: 0, cogs: 0 };
      const recipe = p.recipe;
      const unitCost = recipe ? recipe.total_direct_cost : (p.base_price * 0.4);
      const unitMargin = roundMoney(p.base_price - unitCost);
      const totalMargin = roundMoney(stats.qty * unitMargin);
      const salesShare = totalMenuQty > 0 ? (stats.qty / totalMenuQty) * 100 : 0;

      sumUnitMargin += unitMargin;

      items.push({
        id: p.id,
        name: p.name,
        category: p.category,
        salesCount: stats.qty,
        salesSharePercent: roundMoney(salesShare),
        unitPrice: p.base_price,
        unitCost: unitCost,
        unitMargin: unitMargin,
        totalMargin: totalMargin,
        classification: 'Dog',
        classificationTr: 'Zayıf',
      });
    }

    // Calculate benchmark averages
    const avgShare = items.length > 0 ? (100 / items.length) * 0.7 : 0; // 70% rule
    const avgMargin = items.length > 0 ? sumUnitMargin / items.length : 0;

    for (const item of items) {
      const highPop = item.salesSharePercent >= avgShare || (item.salesCount > 5);
      const highProf = item.unitMargin >= avgMargin;

      if (highPop && highProf) {
        item.classification = 'Star';
        item.classificationTr = 'Yıldız';
      } else if (highPop && !highProf) {
        item.classification = 'Plowhorse';
        item.classificationTr = 'İş Atı';
      } else if (!highPop && highProf) {
        item.classification = 'Puzzle';
        item.classificationTr = 'Bulmaca';
      } else {
        item.classification = 'Dog';
        item.classificationTr = 'Zayıf';
      }
    }

    return items.sort((a, b) => b.totalMargin - a.totalMargin);
  }

  // --- BREAK-EVEN & PROFITABILITY ANALYSIS ---
  getBreakEvenAnalysis(): {
    fixedExpensesMonthly: number;
    fixedExpensesDaily: number;
    averageContributionMarginPercent: number;
    averageDonerMarginTl: number;
    dailyBreakEvenRevenue: number;
    donerCountNeededDaily: number;
    donerCountNeededMonthly: number;
    currentTodayRevenue: number;
    currentTodayDonersSold: number;
    targetProfitDaily: number;
    revenueNeededForTargetProfit: number;
  } {
    const fixedExpensesDaily = parseFloat(this.query<{ value: string }>('SELECT value FROM settings WHERE key = "daily_fixed_expenses"')[0]?.value || '5550');
    const targetProfitDaily = parseFloat(this.query<{ value: string }>('SELECT value FROM settings WHERE key = "target_daily_profit"')[0]?.value || '12000');
    const fixedExpensesMonthly = fixedExpensesDaily * 30;

    // Et dürüm & Tavuk dürüm average contribution margin
    const etDurum = this.getProduct(5); // Et dürüm (400 TL)
    const tvkDurum = this.getProduct(2); // Tavuk dürüm (220 TL)

    const etMargin = etDurum?.recipe ? etDurum.recipe.gross_margin_amount : 210;
    const tvkMargin = tvkDurum?.recipe ? tvkDurum.recipe.gross_margin_amount : 120;
    const avgDonerMargin = (etMargin + tvkMargin) / 2 || 165;

    // Average contribution margin %
    const avgPrice = ((etDurum?.base_price || 400) + (tvkDurum?.base_price || 220)) / 2;
    const avgMarginPercent = avgPrice > 0 ? (avgDonerMargin / avgPrice) * 100 : 50;

    // Daily break-even revenue = Fixed Expenses / Contribution Margin Ratio
    const dailyBreakEvenRevenue = avgMarginPercent > 0 ? roundMoney(fixedExpensesDaily / (avgMarginPercent / 100)) : fixedExpensesDaily * 2;
    const donerCountNeededDaily = avgDonerMargin > 0 ? Math.ceil(fixedExpensesDaily / avgDonerMargin) : 35;
    const donerCountNeededMonthly = donerCountNeededDaily * 30;

    // Target profit revenue = (Fixed + Target Profit) / Contribution Margin Ratio
    const revenueNeededForTargetProfit = avgMarginPercent > 0 ? roundMoney((fixedExpensesDaily + targetProfitDaily) / (avgMarginPercent / 100)) : 0;

    // Today's current sales
    const todayOrders = this.query<{ rev: number }>(
      'SELECT COALESCE(SUM(total_amount), 0) as rev FROM orders WHERE status = "completed" AND date(created_at) = date("now", "localtime")'
    );
    const todayDoners = this.query<{ qty: number }>(`
      SELECT COALESCE(SUM(oi.quantity), 0) as qty
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = "completed" AND date(o.created_at) = date("now", "localtime")
      AND (oi.product_name LIKE "%Dürüm%" OR oi.product_name LIKE "%Döner%")
    `);

    return {
      fixedExpensesMonthly,
      fixedExpensesDaily,
      averageContributionMarginPercent: roundMoney(avgMarginPercent),
      averageDonerMarginTl: roundMoney(avgDonerMargin),
      dailyBreakEvenRevenue,
      donerCountNeededDaily,
      donerCountNeededMonthly,
      currentTodayRevenue: todayOrders[0]?.rev || 0,
      currentTodayDonersSold: todayDoners[0]?.qty || 0,
      targetProfitDaily,
      revenueNeededForTargetProfit,
    };
  }

  // --- DASHBOARD REAL METRICS AGGREGATION ---
  getDashboardMetrics(): DashboardMetrics {
    // 1. Today's Revenue, COGS, Orders
    const todayOrders = this.query<{ rev: number; cogs: number; count: number; avg: number }>(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as rev,
        COALESCE(SUM(cogs_total), 0) as cogs,
        COUNT(id) as count,
        COALESCE(AVG(total_amount), 0) as avg
      FROM orders 
      WHERE status = "completed" AND date(created_at) = date("now", "localtime")
    `);

    const todayRev = todayOrders[0]?.rev ?? 0;
    const todayCogs = todayOrders[0]?.cogs ?? 0;
    const todayCount = todayOrders[0]?.count ?? 0;
    const avgOrderVal = todayOrders[0]?.avg ?? 0;

    // 2. Today's Operating Expenses (Non-stock expenses)
    const todayExp = this.query<{ total: number }>(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE is_stock_purchase = 0 AND date(expense_date) = date("now", "localtime")
    `);
    const todayExpenses = todayExp[0]?.total ?? 0;

    const todayGrossProfit = roundMoney(todayRev - todayCogs);
    const todayNetOperatingProfit = roundMoney(todayGrossProfit - todayExpenses);

    // 3. Registers Balances
    const registers = this.getCashRegisters();
    const cashBalance = registers.find((r) => r.type === 'cash')?.balance ?? 0;
    const bankBalance = registers.find((r) => r.type === 'bank')?.balance ?? 0;
    const yemeksepetiBalance = registers.find((r) => r.type === 'yemeksepeti_receivable')?.balance ?? 0;

    // 4. Hourly Sales for Today
    const hours = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
    const hourlyData = hours.map((h) => ({ hour: h, amount: 0, count: 0 }));

    const hourlyQuery = this.query<{ hour: string; total: number; count: number }>(`
      SELECT strftime('%H:00', created_at) as hour, SUM(total_amount) as total, COUNT(id) as count
      FROM orders
      WHERE status = "completed" AND date(created_at) = date("now", "localtime")
      GROUP BY strftime('%H:00', created_at)
    `);

    for (const hq of hourlyQuery) {
      const match = hourlyData.find((h) => h.hour === hq.hour);
      if (match) {
        match.amount = hq.total;
        match.count = hq.count;
      }
    }

    // 5. Weekly Revenue (Last 7 Days)
    const weeklyRevenue: { date: string; label: string; amount: number; cogs: number }[] = [];
    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = `${d.getDate()} ${dayNames[d.getDay()]}`;

      const res = this.query<{ rev: number; cogs: number }>(
        'SELECT COALESCE(SUM(total_amount), 0) as rev, COALESCE(SUM(cogs_total), 0) as cogs FROM orders WHERE status = "completed" AND date(created_at) = date(?)',
        [dateStr]
      );
      weeklyRevenue.push({
        date: dateStr,
        label,
        amount: res[0]?.rev ?? 0,
        cogs: res[0]?.cogs ?? 0,
      });
    }

    // 6. Monthly Revenue (Last 6 Months)
    const monthlyRevenue = [
      { month: 'Haziran', amount: 0, profit: 0 },
      { month: 'Temmuz', amount: 0, profit: 0 },
      { month: 'Ağustos', amount: 0, profit: 0 },
      { month: 'Eylül', amount: 0, profit: 0 },
      { month: 'Ekim', amount: 0, profit: 0 },
      { month: 'Kasım', amount: todayRev, profit: todayNetOperatingProfit },
    ];

    // 7. Top Selling Products
    const topSelling = this.query<{ id: number; name: string; quantity: number; revenue: number; margin: number }>(`
      SELECT 
        p.id, p.name, 
        SUM(oi.quantity) as quantity, 
        SUM(oi.total_price) as revenue,
        SUM(oi.total_price - oi.total_cogs) as margin
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.status = "completed"
      GROUP BY p.id
      ORDER BY quantity DESC
      LIMIT 5
    `);

    // 8. Most Profitable Products
    const mostProfitable = this.query<{ id: number; name: string; profit: number; marginPercent: number }>(`
      SELECT 
        p.id, p.name,
        SUM(oi.total_price - oi.total_cogs) as profit,
        AVG(CASE WHEN oi.total_price > 0 THEN ((oi.total_price - oi.total_cogs) / oi.total_price) * 100 ELSE 0 END) as marginPercent
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.status = "completed"
      GROUP BY p.id
      ORDER BY profit DESC
      LIMIT 5
    `);

    // 9. Stock Critical Alerts
    const criticalStockAlerts = this.query<InventoryItem>(
      'SELECT * FROM inventory_items WHERE current_quantity <= minimum_quantity ORDER BY current_quantity ASC'
    );

    // 10. Channel Breakdown
    const channels: SalesChannel[] = ['dine_in', 'takeaway', 'yemeksepeti', 'phone', 'other'];
    const channelRows = this.query<{ channel: SalesChannel; total: number; count: number }>(`
      SELECT channel, COALESCE(SUM(total_amount), 0) as total, COUNT(id) as count
      FROM orders
      WHERE status = "completed"
      GROUP BY channel
    `);

    const totalAllTurnover = channelRows.reduce((acc, c) => acc + c.total, 0);
    const channelBreakdown = channels.map((ch) => {
      const found = channelRows.find((r) => r.channel === ch);
      const total = found ? found.total : 0;
      const count = found ? found.count : 0;
      const percentage = totalAllTurnover > 0 ? roundMoney((total / totalAllTurnover) * 100) : 0;
      return {
        channel: ch,
        label: SALES_CHANNEL_LABELS[ch],
        count,
        total,
        percentage,
      };
    });

    // 11. Break Even
    const be = this.getBreakEvenAnalysis();
    const breakEvenPercentage = be.dailyBreakEvenRevenue > 0 ? Math.min(150, roundMoney((todayRev / be.dailyBreakEvenRevenue) * 100)) : 0;

    // 12. Recent Financial Transactions
    const recentTx = this.query<{ id: number; category: string; description: string; amount: number; created_at: string; transaction_type: string }>(`
      SELECT id, category, description, amount, created_at, transaction_type
      FROM cash_transactions
      ORDER BY created_at DESC
      LIMIT 6
    `).map((tx) => ({
      id: tx.id,
      type: tx.category,
      description: tx.description,
      amount: tx.amount,
      date: tx.created_at,
      isIncome: tx.transaction_type === 'income',
    }));

    return {
      todayRevenue: todayRev,
      todayExpenses,
      todayCogs,
      todayGrossProfit,
      todayNetOperatingProfit,
      todayOrderCount: todayCount,
      averageOrderValue: roundMoney(avgOrderVal),
      cashBalance,
      bankBalance,
      yemeksepetiBalance,
      hourlySales: hourlyData,
      weeklyRevenue,
      monthlyRevenue,
      topSellingProducts: topSelling,
      mostProfitableProducts: mostProfitable,
      criticalStockAlerts,
      dailyBreakEven: {
        fixedExpenses: be.fixedExpensesDaily,
        currentRevenue: todayRev,
        breakEvenRevenue: be.dailyBreakEvenRevenue,
        breakEvenPercentage,
        donerCountNeeded: be.donerCountNeededDaily,
        donerCountSold: be.currentTodayDonersSold,
      },
      channelBreakdown,
      recentTransactions: recentTx,
    };
  }

  // --- CUSTOMERS (MÜŞTERİ YÖNETİMİ & REHBER) ---
  getCustomers(searchQuery?: string): Customer[] {
    let sql = 'SELECT * FROM customers';
    const params: any[] = [];
    if (searchQuery && searchQuery.trim()) {
      const q = `%${searchQuery.trim()}%`;
      sql += ' WHERE full_name LIKE ? OR phone LIKE ? OR address LIKE ? OR notes LIKE ? OR last_order_notes LIKE ?';
      params.push(q, q, q, q, q);
    }
    sql += ' ORDER BY id DESC';
    return this.query<Customer>(sql, params);
  }

  getCustomer(id: number): Customer | null {
    const list = this.query<Customer>('SELECT * FROM customers WHERE id = ?', [id]);
    return list.length > 0 ? list[0] : null;
  }

  getCustomerByPhone(phone: string): Customer | null {
    const cleanPhone = phone.replace(/[\s()-]/g, '');
    if (!cleanPhone) return null;
    const list = this.query<Customer>(
      "SELECT * FROM customers WHERE REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '') LIKE ?",
      [`%${cleanPhone}%`]
    );
    return list.length > 0 ? list[0] : null;
  }

  addCustomer(data: {
    full_name: string;
    phone: string;
    address: string;
    notes?: string;
    last_order_notes?: string;
  }): Customer {
    this.run(
      `INSERT INTO customers (full_name, phone, address, notes, last_order_notes, total_orders_count, total_spent)
       VALUES (?, ?, ?, ?, ?, 0, 0)`,
      [
        data.full_name.trim(),
        data.phone.trim(),
        data.address.trim(),
        data.notes?.trim() || '',
        data.last_order_notes?.trim() || '',
      ]
    );
    const newId = this.query<{ id: number }>('SELECT max(id) as id FROM customers')[0]?.id;
    this.persist();
    return this.getCustomer(newId)!;
  }

  updateCustomer(
    id: number,
    data: {
      full_name?: string;
      phone?: string;
      address?: string;
      notes?: string;
      last_order_notes?: string;
      total_orders_count?: number;
      total_spent?: number;
    }
  ): void {
    const existing = this.getCustomer(id);
    if (!existing) return;

    this.run(
      `UPDATE customers
       SET full_name = ?, phone = ?, address = ?, notes = ?, last_order_notes = ?,
           total_orders_count = ?, total_spent = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        data.full_name !== undefined ? data.full_name.trim() : existing.full_name,
        data.phone !== undefined ? data.phone.trim() : existing.phone,
        data.address !== undefined ? data.address.trim() : existing.address,
        data.notes !== undefined ? data.notes : existing.notes,
        data.last_order_notes !== undefined ? data.last_order_notes : existing.last_order_notes,
        data.total_orders_count !== undefined ? data.total_orders_count : existing.total_orders_count,
        data.total_spent !== undefined ? data.total_spent : existing.total_spent,
        id,
      ]
    );
    this.persist();
  }

  deleteCustomer(id: number): void {
    this.run('DELETE FROM customers WHERE id = ?', [id]);
    this.persist();
  }

  recordCustomerOrder(customerId: number, orderTotal: number, orderSummary?: string): void {
    this.run(
      `UPDATE customers
       SET total_orders_count = total_orders_count + 1,
           total_spent = total_spent + ?,
           last_order_notes = COALESCE(?, last_order_notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [orderTotal, orderSummary || null, customerId]
    );
    this.persist();
  }

  // --- BACKUP & RESTORE ---
  exportBackup(): string {
    const db = this.ensureDb();
    const data = db.export();
    let binary = '';
    const len = data.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
  }

  restoreBackup(base64Data: string): boolean {
    try {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Validate SQLite header: "SQLite format 3\0"
      const header = String.fromCharCode(...bytes.slice(0, 15));
      if (!header.startsWith('SQLite format 3')) {
        throw new Error('Geçersiz SQLite yedek dosyası! Başlık formatı uyuşmuyor.');
      }

      const SQL = (this.db as any).constructor;
      this.db = new SQL(bytes);
      this.persist();

      this.run('INSERT INTO audit_logs (user_name, action, entity_type, details) VALUES ("Admin", "backup_restore", "system", "Yedekten geri yükleme başarılı")');
      return true;
    } catch (e: any) {
      console.error('Restore failed:', e);
      throw new Error(`Yedek geri yüklenemedi: ${e.message}`);
    }
  }

  // Clear demo transactions (keeps products, recipes, settings)
  resetTransactions(confirmedBy: string): void {
    this.transaction(() => {
      this.run('DELETE FROM orders');
      this.run('DELETE FROM order_items');
      this.run('DELETE FROM inventory_transactions');
      this.run('DELETE FROM production_batches');
      this.run('DELETE FROM expenses');
      this.run('DELETE FROM cash_transactions');
      this.run('DELETE FROM cash_closings');
      this.run('DELETE FROM yemeksepeti_orders');
      this.run('UPDATE inventory_items SET current_quantity = 0');
      this.run('UPDATE cash_registers SET balance = 0');
      this.run('UPDATE accounts SET balance = 0');
      this.run('INSERT INTO audit_logs (user_name, action, entity_type, details) VALUES (?, "reset_transactions", "system", "Tüm hareketler sıfırlandı")', [confirmedBy]);
    });
  }
}

export const dbService = new DatabaseService();
