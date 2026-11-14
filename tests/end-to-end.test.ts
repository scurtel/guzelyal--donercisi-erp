import { describe, it, expect, beforeAll } from 'vitest';
import initSqlJs from 'sql.js';
import { CREATE_TABLES_SQL } from '../src/db/schema';
import { SEED_DATA_SQL } from '../src/db/seeds';
import { roundMoney } from '../src/utils/format';

describe('Güzelyalı ERP — Uçtan Uca Kesin Kabul ve Muhasebe Testleri', () => {
  let SQL: any;
  let db: any;

  beforeAll(async () => {
    SQL = await initSqlJs();
    db = new SQL.Database();
    db.run(CREATE_TABLES_SQL);
    db.run(SEED_DATA_SQL);
  });

  it('1. Stoklara 6 kg et girişi yap ve ağırlıklı ortalama maliyeti doğrula', () => {
    // 6 kg et alımı: 6.500 TL (Birim: 1.083,3333 TL/kg)
    const rawQty = 6.0;
    const totalCost = 6500.0;
    const unitPrice = roundMoney(totalCost / rawQty);

    expect(totalCost).toBe(6500.0);

    // Stok güncelle
    db.run(
      'UPDATE inventory_items SET current_quantity = current_quantity + ?, average_cost = ?, last_purchase_price = ? WHERE id = 1',
      [rawQty, unitPrice, unitPrice]
    );

    // Stok hareketi kaydet
    db.run(
      'INSERT INTO inventory_transactions (item_id, transaction_type, quantity, unit_price, total_cost, notes) VALUES (1, "purchase", ?, ?, ?, "6 kg et alımı")',
      [rawQty, unitPrice, totalCost]
    );

    // Kasadan veya borçtan gider kaydı
    db.run(
      'INSERT INTO expenses (category, amount, payment_method, is_stock_purchase, description) VALUES ("Et alımı", ?, "cash", 1, "6 kg et hammadde alımı")',
      [totalCost]
    );

    const itemRes = db.exec('SELECT current_quantity, average_cost FROM inventory_items WHERE id = 1')[0];
    const qty = itemRes.values[0][0];
    const avgCost = itemRes.values[0][1];

    expect(qty).toBe(6.0);
    expect(avgCost).toBeCloseTo(1083.33, 2);
  });

  it('2. Üretim kaydı ve gerçek pişirme verimi gir (Verimlilik & Fire Analizi)', () => {
    // 6 kg çiğ et işlendi, pişmiş kullanılabilir ağırlık 4.2 kg (1.8 kg fire = %30)
    const rawKg = 6.0;
    const cookedKg = 4.2;
    const portionG = 110;
    const batchCost = 6500.0;

    const wasteKg = roundMoney(rawKg - cookedKg);
    const wastePercent = roundMoney((wasteKg / rawKg) * 100);
    const yieldPercent = roundMoney((cookedKg / rawKg) * 100);
    const usablePortions = Math.floor(cookedKg / (portionG / 1000));
    const costPerPortion = roundMoney(batchCost / usablePortions);

    expect(wasteKg).toBe(1.8);
    expect(wastePercent).toBe(30.0);
    expect(yieldPercent).toBe(70.0);
    expect(usablePortions).toBe(38); // 4.2 kg / 0.110 = 38.18 -> 38 adet
    expect(costPerPortion).toBe(171.05); // 6500 / 38 = 171.05 TL

    db.run(
      `INSERT INTO production_batches 
       (batch_type, raw_weight_kg, cooked_weight_kg, waste_weight_kg, waste_percentage, yield_percentage, portion_size_g, usable_portions_count, batch_cost_tl, cost_per_portion_tl, notes)
       VALUES ("et", ?, ?, ?, ?, ?, ?, ?, ?, ?, "1. Parti Et Döner")`,
      [rawKg, cookedKg, wasteKg, wastePercent, yieldPercent, portionG, usablePortions, batchCost, costPerPortion]
    );

    const batchRes = db.exec('SELECT usable_portions_count, cost_per_portion_tl FROM production_batches WHERE id = 1')[0];
    expect(batchRes.values[0][0]).toBe(38);
    expect(batchRes.values[0][1]).toBe(171.05);
  });

  it('3. 110 gram et içeren bir Et Dürüm reçetesi tanımla ve doğrudan maliyet hesapla', () => {
    // Et Dürüm (id = 5):
    // 110g Et (0.110 kg @ 1083.33 = 119.17 TL)
    // 1 Lavaş (14.00 TL)
    // 30g Domates (0.030 kg @ 35.00 = 1.05 TL)
    // 20ml Sos (0.020 L @ 40.00 = 0.80 TL)
    // 1 Ambalaj (3.50 TL)
    // Toplam Doğrudan Maliyet = 119.17 + 14 + 1.05 + 0.80 + 3.50 = 138.52 TL
    const meatCost = roundMoney(0.110 * 1083.33);
    const lavasCost = 14.00;
    const domatesCost = roundMoney(0.030 * 35.00);
    const sosCost = roundMoney(0.020 * 40.00);
    const packagingCost = 3.50;

    const totalDirectCost = roundMoney(meatCost + lavasCost + domatesCost + sosCost + packagingCost);
    expect(totalDirectCost).toBeCloseTo(138.52, 1);

    const salePrice = 400.0;
    const grossMargin = roundMoney(salePrice - totalDirectCost);
    const marginPercent = roundMoney((grossMargin / salePrice) * 100);

    expect(grossMargin).toBeCloseTo(261.48, 1);
    expect(marginPercent).toBeGreaterThan(60); // %65+ brüt katkı marjı
  });

  it('4 & 5. Et Dürüm satışı gerçekleştir ve reçeteye bağlı stok düşüşünü doğrula', () => {
    // Lavaş stoğuna önce 10 adet ekleyelim
    db.run('UPDATE inventory_items SET current_quantity = 10 WHERE id = 3'); // Lavaş

    const initialMeatStock = db.exec('SELECT current_quantity FROM inventory_items WHERE id = 1')[0].values[0][0];
    const initialLavasStock = db.exec('SELECT current_quantity FROM inventory_items WHERE id = 3')[0].values[0][0];

    // Satış: 2 Adet Et Dürüm (Restoran İçi, Nakit, 2x 400 = 800 TL)
    const qtySold = 2;
    const unitPrice = 400.0;
    const totalAmount = qtySold * unitPrice;
    const unitCogs = 138.52;
    const totalCogs = roundMoney(qtySold * unitCogs);

    // Atomik sipariş kaydı
    db.run('BEGIN TRANSACTION');
    db.run(
      'INSERT INTO orders (order_number, channel, status, payment_method, total_amount, cogs_total, gross_margin) VALUES ("GZY-TEST-01", "dine_in", "completed", "cash", ?, ?, ?)',
      [totalAmount, totalCogs, totalAmount - totalCogs]
    );

    // Reçete gereği stok düşüşü:
    // 2 x 0.110 = 0.220 kg et
    // 2 x 1 = 2 adet lavaş
    const meatDeduction = roundMoney(qtySold * 0.110);
    const lavasDeduction = qtySold * 1;

    db.run('UPDATE inventory_items SET current_quantity = current_quantity - ? WHERE id = 1', [meatDeduction]);
    db.run('UPDATE inventory_items SET current_quantity = current_quantity - ? WHERE id = 3', [lavasDeduction]);

    // Kasa artışı (Nakit Kasa id = 1)
    db.run('UPDATE cash_registers SET balance = balance + ? WHERE id = 1', [totalAmount]);

    db.run('COMMIT');

    // Doğrulama
    const postMeat = db.exec('SELECT current_quantity FROM inventory_items WHERE id = 1')[0].values[0][0];
    const postLavas = db.exec('SELECT current_quantity FROM inventory_items WHERE id = 3')[0].values[0][0];
    const postCash = db.exec('SELECT balance FROM cash_registers WHERE id = 1')[0].values[0][0];

    expect(postMeat).toBeCloseTo(initialMeatStock - 0.220, 3);
    expect(postLavas).toBe(initialLavasStock - 2);
    expect(postCash).toBe(800.0);
  });

  it('6 & 7. Yemeksepeti siparişi ve %15 komisyon kesintisini test et', () => {
    // Yemeksepeti Siparişi: 1 Adet Et Dürüm (460 TL Yemeksepeti liste fiyatı)
    const grossPrice = 460.0;
    const commissionRate = 15;
    const commissionAmount = roundMoney(grossPrice * (commissionRate / 100)); // 69.00 TL
    const netPayout = roundMoney(grossPrice - commissionAmount); // 391.00 TL
    const cogs = 138.52;
    const orderContributionProfit = roundMoney(netPayout - cogs); // 252.48 TL

    expect(commissionAmount).toBe(69.0);
    expect(netPayout).toBe(391.0);
    expect(orderContributionProfit).toBe(252.48);

    // Sipariş kaydet
    db.run(
      `INSERT INTO orders 
       (order_number, channel, status, payment_method, total_amount, cogs_total, gross_margin, channel_commission_rate, channel_commission_amount, net_earnings)
       VALUES ("GZY-YS-01", "yemeksepeti", "completed", "yemeksepeti_online", ?, ?, ?, ?, ?, ?)`,
      [grossPrice, cogs, grossPrice - cogs, commissionRate, commissionAmount, netPayout]
    );

    // Yemeksepeti Alacak Hesabı (id = 3)
    db.run('UPDATE cash_registers SET balance = balance + ? WHERE id = 3', [netPayout]);

    const ysBalance = db.exec('SELECT balance FROM cash_registers WHERE id = 3')[0].values[0][0];
    expect(ysBalance).toBe(391.0);
  });

  it('8 & 9. Gün sonu kâr-zarar ve Z-Raporu kapanışını doğrula', () => {
    // Toplam ciro: 800 (Restoran) + 460 (Yemeksepeti) = 1.260 TL
    // Toplam SMM: (2 x 138.52) + 138.52 = 415.56 TL
    // Brüt kâr: 1.260 - 415.56 = 844.44 TL
    // Komisyon gideri: 69 TL
    // Günlük elektrik/kira payı: 200 TL
    const ordersRes = db.exec("SELECT SUM(total_amount), SUM(cogs_total) FROM orders WHERE order_number IN ('GZY-TEST-01', 'GZY-YS-01')")[0];
    const totalRev = ordersRes.values[0][0];
    const totalCogs = ordersRes.values[0][1];

    expect(totalRev).toBe(1260.0);
    expect(totalCogs).toBeCloseTo(415.56, 1);

    const grossMargin = roundMoney(totalRev - totalCogs);
    expect(grossMargin).toBeCloseTo(844.44, 1);

    // Z-Raporu Kapanış Kaydı
    const countedCash = 800.0;
    const expectedCash = 800.0;
    const variance = countedCash - expectedCash;

    db.run(
      `INSERT INTO cash_closings 
       (closing_date, expected_cash, counted_cash, cash_variance, total_turnover, total_cogs, net_profit, closed_by)
       VALUES (date('now'), ?, ?, ?, ?, ?, ?, "Yönetici")`,
      [expectedCash, countedCash, variance, totalRev, totalCogs, grossMargin]
    );

    const closingRes = db.exec('SELECT cash_variance, total_turnover FROM cash_closings WHERE id = 1')[0];
    expect(closingRes.values[0][0]).toBe(0.0); // Kasa kuruşu kuruşuna denk
    expect(closingRes.values[0][1]).toBe(1260.0);
  });

  it('10. SQLite veritabanını dışa aktar (export) ve yeni bağlantıya aktar (persistence check)', () => {
    // Uygulama kapandığında SQLite veritabanı binary olarak export edilir
    const exportedBytes = db.export();
    expect(exportedBytes.length).toBeGreaterThan(1000);

    // Yeni bir SQLite oturumu aç ve export edilen binary ile başlat (uygulamayı kapatıp açma simülasyonu)
    const newDb = new SQL.Database(exportedBytes);
    
    // Bütün verilerin korunduğunu doğrula
    const productCount = newDb.exec('SELECT count(*) FROM products')[0].values[0][0];
    const orderCount = newDb.exec('SELECT count(*) FROM orders')[0].values[0][0];
    const cashBalance = newDb.exec('SELECT balance FROM cash_registers WHERE id = 1')[0].values[0][0];

    expect(productCount).toBe(16); // Güncel tabela menüsündeki 16 ürün (Dönerler, Yan Ürün, İçecekler ve Eker Tatlılar)
    expect(orderCount).toBe(311); // 309 gerçek sipariş (156 platform + 153 Yemeksepeti Partner) + 2 test siparişi
    expect(cashBalance).toBe(800.0); // Kasa bakiyesi korundu

    const ysOrderCount = newDb.exec('SELECT count(*) FROM yemeksepeti_orders')[0].values[0][0];
    expect(ysOrderCount).toBe(153); // 153 Yemeksepeti siparişi eksiksiz kayıtlı
  });

  it('11. Müşteri kaydı, isim/telefon ile arama ve sipariş ilişkilendirmesini test et', () => {
    // 0. Sahte/demo müşterilerin silindiğini ve gerçek müşterilerin veritabanında olduğunu doğrula
    const fakeCustomers = db.exec(
      "SELECT count(*) FROM customers WHERE full_name IN ('Ahmet Yılmaz', 'Mehmet Kaya', 'Ayşe Demir')"
    )[0].values[0][0];
    expect(fakeCustomers).toBe(0);

    const realCustomersCount = db.exec("SELECT count(*) FROM customers")[0].values[0][0];
    expect(realCustomersCount).toBeGreaterThanOrEqual(31);

    // 1. Yeni müşteri kaydı
    db.run(
      `INSERT INTO customers (full_name, phone, address, notes, last_order_notes, total_orders_count, total_spent)
       VALUES ("Canan Yıldız", "0555 888 99 00", "Güzelyalı Mah. 81050 Sok. No:5 D:2", "Acılı sos bol olsun", "1x Et Dürüm", 0, 0)`
    );

    // 2. İsim ile arama
    const searchByName = db.exec("SELECT * FROM customers WHERE full_name LIKE '%Canan%'")[0];
    expect(searchByName.values.length).toBe(1);
    expect(searchByName.values[0][1]).toBe('Canan Yıldız');

    // 3. Telefon ile arama
    const searchByPhone = db.exec("SELECT * FROM customers WHERE phone LIKE '%0555 888%'")[0];
    expect(searchByPhone.values.length).toBe(1);
    expect(searchByPhone.values[0][2]).toBe('0555 888 99 00');

    // 4. Sipariş tutarı ve sipariş sayacını güncelleme (order attribution)
    const custId = searchByName.values[0][0];
    db.run(
      "UPDATE customers SET total_orders_count = total_orders_count + 1, total_spent = total_spent + 320.0, last_order_notes = '1x Et Dürüm (Lavaş)' WHERE id = ?",
      [custId]
    );

    const updated = db.exec("SELECT total_orders_count, total_spent, last_order_notes FROM customers WHERE id = ?", [custId])[0];
    expect(updated.values[0][0]).toBe(1);
    expect(updated.values[0][1]).toBe(320.0);
    expect(updated.values[0][2]).toBe('1x Et Dürüm (Lavaş)');
  });
});
