// Initial Seed Data for Güzelyalı ERP
import { REAL_CUSTOMERS_SQL, REAL_ORDERS_SQL, REAL_YEMEKSEPETI_ORDERS_SQL } from './realData';

export const SEED_DATA_SQL = `
-- Default Users
INSERT OR IGNORE INTO users (id, username, password_hash, display_name, role, pin_code) VALUES
(1, 'admin', 'admin123', 'Yönetici (Admin)', 'admin', '1234'),
(2, 'kasiyer', 'kasiyer123', 'Kasa Personeli', 'kasiyer', '0000'),
(3, 'usta', 'usta123', 'Döner Ustası', 'usta', '1111');

-- Default Settings
INSERT OR IGNORE INTO settings (key, value, description) VALUES
('restaurant_name', 'Güzelyalı Dönercisi', 'İşletme Adı'),
('restaurant_address', 'Güzelyalı Mah. Sahil Cad. No:12', 'İşletme Adresi'),
('restaurant_phone', '0555 123 45 67', 'İşletme Telefonu'),
('default_yemeksepeti_commission', '15', 'Yemeksepeti Varsayılan Komisyon Oranı (%)'),
('daily_fixed_expenses', '5550', 'Günlük Sabit Giderler (Usta 3300 + Personel 1350 + Kira 900)'),
('target_daily_profit', '12000', 'Hedef Günlük Net Kâr (TL)'),
('theme_mode', 'light', 'Arayüz Tema Seçimi (light/dark)');

-- Default Cash Registers
INSERT OR IGNORE INTO cash_registers (id, type, name, balance) VALUES
(1, 'cash', 'Merkez Nakit Kasa', 0.0),
(2, 'bank', 'Banka POS Hesabı', 0.0),
(3, 'yemeksepeti_receivable', 'Yemeksepeti Cari Alacak', 0.0);

-- Default Accounts (Tedarikçiler, Personel, Platform)
INSERT OR IGNORE INTO accounts (id, name, type, phone, tax_id, balance, notes) VALUES
(1, 'Topaloğlu Et Entegre (Kasap)', 'supplier', '0532 111 22 33', '1234567890', 0, 'Dana dönerlik tranç ve antrikot tedariği'),
(2, 'Akpiliç Toptan Tavuk', 'supplier', '0533 222 33 44', '2345678901', 0, 'Tavuk but ve göğüs tedariği'),
(3, 'Güzelyalı Taş Fırın', 'supplier', '0535 333 44 55', '3456789012', 0, 'Lavaş, sütlü ekmek, pide tedariği'),
(4, 'Hal Manavı (Sebze & Sos)', 'supplier', '0536 444 55 66', '4567890123', 0, 'Domates, turşu, patates, yeşillik'),
(5, 'Ahmet Usta (Döner Ustası)', 'staff', '0541 555 66 77', '', 0, 'Günlük 3.300 TL yevmiye'),
(6, 'Mehmet (İkinci Personel)', 'staff', '0542 666 77 88', '', 0, 'Günlük 1.350 TL yevmiye'),
(7, 'Yemeksepeti Elektronik İletişim', 'platform', '0850 555 00 00', '9876543210', 0, 'Haftalık mutabakatlı platform cari hesabı');

-- Initial Stock Items (Başlangıç parametreleri)
-- 6 kg et: 6.500 TL (1083.33 TL/kg)
-- 10 kg tavuk: 1.500 TL (150 TL/kg)
-- 50 ekmek: 700 TL (14 TL/adet)
INSERT OR IGNORE INTO inventory_items (id, code, name, category, unit, current_quantity, minimum_quantity, last_purchase_price, average_cost, supplier_id) VALUES
(1, 'STK-ET', 'Çiğ Dana/Kuzu Döner Eti', 'Et & Tavuk', 'kg', 0, 5, 1083.33, 1083.33, 1),
(2, 'STK-TVK', 'Çiğ Tavuk Döner Eti', 'Et & Tavuk', 'kg', 0, 10, 150.00, 150.00, 2),
(3, 'STK-LAV', 'Lavaş Ekmek', 'Ekmek', 'adet', 0, 30, 14.00, 14.00, 3),
(4, 'STK-SUT', 'Sütlü Ekmek (Dönerlik)', 'Ekmek', 'adet', 0, 20, 14.00, 14.00, 3),
(5, 'STK-PID', 'Pide Ekmek (Tırnaklı)', 'Ekmek', 'adet', 0, 15, 14.00, 14.00, 3),
(6, 'STK-PRC', 'Pirinç (Baldo/Pilavlık)', 'Kuru Gıda', 'kg', 0, 5, 60.00, 60.00, 4),
(7, 'STK-PAT', 'Patates (Kızartmalık)', 'Sebze', 'kg', 0, 10, 45.00, 45.00, 4),
(8, 'STK-AYR', 'Ayran 200ml', 'İçecek', 'adet', 0, 20, 18.00, 18.00, 1),
(9, 'STK-KUT', 'Kutu İçecek 330ml', 'İçecek', 'adet', 0, 24, 28.00, 28.00, 1),
(10, 'STK-SU', 'Doğal Kaynak Suyu 0.5L', 'İçecek', 'adet', 0, 36, 6.00, 6.00, 1),
(11, 'STK-DOM', 'Domates & Garnitür', 'Sebze', 'kg', 0, 5, 35.00, 35.00, 4),
(12, 'STK-SOS', 'Özel Döner Sosu', 'Sos', 'litre', 0, 3, 40.00, 40.00, 4),
(13, 'STK-AMB1', 'Dürüm Kağıdı & Kese', 'Ambalaj', 'adet', 0, 100, 3.50, 3.50, 4),
(14, 'STK-AMB2', 'Köpük Servis Kabı / Kutu', 'Ambalaj', 'adet', 0, 50, 6.00, 6.00, 4),
(15, 'STK-KZN', 'Eker Kazandibi 150g', 'Tatlı', 'adet', 0, 10, 25.00, 25.00, 4),
(16, 'STK-PUD', 'Eker Puding 150g', 'Tatlı', 'adet', 0, 10, 25.00, 25.00, 4);

-- Initial Products (Güncel Tabela Menü Fiyatları)
-- Tavuk döner servis: 230 TL
-- Tavuk dürüm (Lavaş): 180 TL
-- Tavuk sütlü ekmek: 180 TL
-- Tavuk pide dürüm: 180 TL
-- Et döner servis: 370 TL
-- Et dürüm (Lavaş): 320 TL
-- Et sütlü ekmek: 320 TL
-- Et pide dürüm: 320 TL
-- Pilav üstü tavuk: 320 TL
-- Pilav üstü et: 450 TL
-- Patates kızartması: 80 TL
-- Kutu içecek: 75 TL
-- Su: 20 TL
-- Ayran: 40 TL
-- Kazandibi (Eker): 50 TL
-- Puding (Eker): 50 TL
INSERT OR IGNORE INTO products (id, code, name, category, base_price, vat_rate, is_active, is_campaign) VALUES
(1, 'PRD-TVK-SER', 'Tavuk Döner Servis', 'Porsiyon', 230.0, 10, 1, 0),
(2, 'PRD-TVK-DUR', 'Tavuk Dürüm (Lavaş)', 'Döner', 180.0, 10, 1, 0),
(3, 'PRD-TVK-SUT', 'Tavuk Sütlü Ekmek', 'Döner', 180.0, 10, 1, 0),
(4, 'PRD-ET-SER', 'Et Döner Servis', 'Porsiyon', 370.0, 10, 1, 0),
(5, 'PRD-ET-DUR', 'Et Dürüm (Lavaş)', 'Döner', 320.0, 10, 1, 0),
(6, 'PRD-ET-SUT', 'Et Sütlü Ekmek', 'Döner', 320.0, 10, 1, 0),
(7, 'PRD-PIL-TVK', 'Pilav Üstü Tavuk', 'Pilav Üstü', 320.0, 10, 1, 0),
(8, 'PRD-PIL-ET', 'Pilav Üstü Et', 'Pilav Üstü', 450.0, 10, 1, 0),
(9, 'PRD-PAT', 'Patates Kızartması', 'Yan Ürün', 80.0, 10, 1, 0),
(10, 'PRD-AYR', 'Ayran', 'İçecek', 40.0, 10, 1, 0),
(11, 'PRD-KUT', 'Kutu İçecek', 'İçecek', 75.0, 10, 1, 0),
(12, 'PRD-SU', 'Su', 'İçecek', 20.0, 10, 1, 0),
(13, 'PRD-TVK-PID', 'Tavuk Pide Dürüm', 'Döner', 180.0, 10, 1, 0),
(14, 'PRD-ET-PID', 'Et Pide Dürüm', 'Döner', 320.0, 10, 1, 0),
(15, 'PRD-KZN', 'Kazandibi (Eker)', 'Tatlı', 50.0, 10, 1, 0),
(16, 'PRD-PUD', 'Puding (Eker)', 'Tatlı', 50.0, 10, 1, 0);

-- Product Channel Prices
INSERT OR IGNORE INTO product_channel_prices (product_id, channel, price) VALUES
(1, 'dine_in', 230.0), (1, 'takeaway', 230.0), (1, 'yemeksepeti', 265.0), (1, 'phone', 230.0),
(2, 'dine_in', 180.0), (2, 'takeaway', 180.0), (2, 'yemeksepeti', 210.0), (2, 'phone', 180.0),
(3, 'dine_in', 180.0), (3, 'takeaway', 180.0), (3, 'yemeksepeti', 210.0), (3, 'phone', 180.0),
(4, 'dine_in', 370.0), (4, 'takeaway', 370.0), (4, 'yemeksepeti', 425.0), (4, 'phone', 370.0),
(5, 'dine_in', 320.0), (5, 'takeaway', 320.0), (5, 'yemeksepeti', 370.0), (5, 'phone', 320.0),
(6, 'dine_in', 320.0), (6, 'takeaway', 320.0), (6, 'yemeksepeti', 370.0), (6, 'phone', 320.0),
(7, 'dine_in', 320.0), (7, 'takeaway', 320.0), (7, 'yemeksepeti', 370.0), (7, 'phone', 320.0),
(8, 'dine_in', 450.0), (8, 'takeaway', 450.0), (8, 'yemeksepeti', 520.0), (8, 'phone', 450.0),
(9, 'dine_in', 80.0),  (9, 'takeaway', 80.0),  (9, 'yemeksepeti', 95.0),  (9, 'phone', 80.0),
(10, 'dine_in', 40.0), (10, 'takeaway', 40.0), (10, 'yemeksepeti', 50.0),  (10, 'phone', 40.0),
(11, 'dine_in', 75.0), (11, 'takeaway', 75.0), (11, 'yemeksepeti', 90.0),  (11, 'phone', 75.0),
(12, 'dine_in', 20.0), (12, 'takeaway', 20.0), (12, 'yemeksepeti', 25.0),  (12, 'phone', 20.0),
(13, 'dine_in', 180.0), (13, 'takeaway', 180.0), (13, 'yemeksepeti', 210.0), (13, 'phone', 180.0),
(14, 'dine_in', 320.0), (14, 'takeaway', 320.0), (14, 'yemeksepeti', 370.0), (14, 'phone', 320.0),
(15, 'dine_in', 50.0),  (15, 'takeaway', 50.0),  (15, 'yemeksepeti', 60.0),  (15, 'phone', 50.0),
(16, 'dine_in', 50.0),  (16, 'takeaway', 50.0),  (16, 'yemeksepeti', 60.0),  (16, 'phone', 50.0);

-- Initial Recipes (Reçeteler)
INSERT OR IGNORE INTO recipes (id, product_id, version, is_active, notes) VALUES
(1, 1, 1, 1, 'Tavuk Döner Servis (120g tavuk, pide, domates, sos, servis kutusu)'),
(2, 2, 1, 1, 'Tavuk Dürüm (100g tavuk, lavaş, domates, sos, ambalaj)'),
(3, 3, 1, 1, 'Tavuk Sütlü Ekmek (100g tavuk, sütlü ekmek, domates, sos, ambalaj)'),
(4, 4, 1, 1, 'Et Döner Servis (130g et, pide, domates, sos, servis kutusu)'),
(5, 5, 1, 1, 'Et Dürüm (110g et, lavaş, domates, sos, ambalaj)'),
(6, 6, 1, 1, 'Et Sütlü Ekmek (110g et, sütlü ekmek, domates, sos, ambalaj)'),
(7, 7, 1, 1, 'Pilav Üstü Tavuk (100g tavuk, 150g pirinç, servis kutusu)'),
(8, 8, 1, 1, 'Pilav Üstü Et (110g et, 150g pirinç, servis kutusu)'),
(9, 9, 1, 1, 'Patates Kızartması (150g patates, kese kağıdı)'),
(10, 10, 1, 1, 'Ayran (1 adet hazır ayran)'),
(11, 11, 1, 1, 'Kutu İçecek (1 adet hazır içecek)'),
(12, 12, 1, 1, 'Su (1 adet pet şişe su)'),
(13, 13, 1, 1, 'Tavuk Pide Dürüm (100g tavuk, pide ekmek, domates, sos, ambalaj)'),
(14, 14, 1, 1, 'Et Pide Dürüm (110g et, pide ekmek, domates, sos, ambalaj)'),
(15, 15, 1, 1, 'Kazandibi (1 adet Eker Kazandibi)'),
(16, 16, 1, 1, 'Puding (1 adet Eker Puding)');

-- Recipe Items (Reçete Bileşenleri - miktarlar standart birim cinsinden: kg için 0.110 = 110g)
INSERT OR IGNORE INTO recipe_items (recipe_id, inventory_item_id, quantity, notes) VALUES
-- Tavuk Döner Servis (recipe 1)
(1, 2, 0.120, '120g Pişmiş Tavuk Döner'),
(1, 5, 1.0, '1 adet Pide Ekmek'),
(1, 11, 0.050, '50g Domates/Garnitür'),
(1, 12, 0.030, '30ml Sos'),
(1, 14, 1.0, '1 adet Köpük Servis Kabı'),

-- Tavuk Dürüm (recipe 2)
(2, 2, 0.100, '100g Tavuk Döner'),
(2, 3, 1.0, '1 adet Lavaş'),
(2, 11, 0.030, '30g Domates'),
(2, 12, 0.020, '20ml Sos'),
(2, 13, 1.0, '1 adet Dürüm Kağıdı'),

-- Tavuk Sütlü Ekmek (recipe 3)
(3, 2, 0.100, '100g Tavuk Döner'),
(3, 4, 1.0, '1 adet Sütlü Ekmek'),
(3, 11, 0.030, '30g Domates'),
(3, 12, 0.020, '20ml Sos'),
(3, 13, 1.0, '1 adet Kese Kağıdı'),

-- Et Döner Servis (recipe 4)
(4, 1, 0.130, '130g Pişmiş Et Döner'),
(4, 5, 1.0, '1 adet Pide Ekmek'),
(4, 11, 0.050, '50g Domates/Garnitür'),
(4, 12, 0.030, '30ml Sos'),
(4, 14, 1.0, '1 adet Köpük Servis Kabı'),

-- Et Dürüm (recipe 5)
(5, 1, 0.110, '110g Et Döner'),
(5, 3, 1.0, '1 adet Lavaş'),
(5, 11, 0.030, '30g Domates'),
(5, 12, 0.020, '20ml Sos'),
(5, 13, 1.0, '1 adet Dürüm Kağıdı'),

-- Et Sütlü Ekmek (recipe 6)
(6, 1, 0.110, '110g Et Döner'),
(6, 4, 1.0, '1 adet Sütlü Ekmek'),
(6, 11, 0.030, '30g Domates'),
(6, 12, 0.020, '20ml Sos'),
(6, 13, 1.0, '1 adet Kese Kağıdı'),

-- Pilav Üstü Tavuk (recipe 7)
(7, 2, 0.100, '100g Tavuk Döner'),
(7, 6, 0.150, '150g Pirinç (Pişmiş Pilav)'),
(7, 14, 1.0, '1 adet Servis Kabı'),

-- Pilav Üstü Et (recipe 8)
(8, 1, 0.110, '110g Et Döner'),
(8, 6, 0.150, '150g Pirinç (Pişmiş Pilav)'),
(8, 14, 1.0, '1 adet Servis Kabı'),

-- Patates (recipe 9)
(9, 7, 0.150, '150g Patates'),
(9, 13, 1.0, '1 adet Kese Kağıdı'),

-- İçecekler
(10, 8, 1.0, '1 adet Ayran'),
(11, 9, 1.0, '1 adet Kutu İçecek'),
(12, 10, 1.0, '1 adet Su'),

-- Tavuk Pide Dürüm (recipe 13)
(13, 2, 0.100, '100g Tavuk Döner'),
(13, 5, 1.0, '1 adet Pide Ekmek'),
(13, 11, 0.030, '30g Domates'),
(13, 12, 0.020, '20ml Sos'),
(13, 13, 1.0, '1 adet Dürüm Kağıdı'),

-- Et Pide Dürüm (recipe 14)
(14, 1, 0.110, '110g Et Döner'),
(14, 5, 1.0, '1 adet Pide Ekmek'),
(14, 11, 0.030, '30g Domates'),
(14, 12, 0.020, '20ml Sos'),
(14, 13, 1.0, '1 adet Dürüm Kağıdı'),

-- Tatlılar
(15, 15, 1.0, '1 adet Kazandibi'),
(16, 16, 1.0, '1 adet Puding');
` + REAL_CUSTOMERS_SQL + REAL_ORDERS_SQL + REAL_YEMEKSEPETI_ORDERS_SQL;
