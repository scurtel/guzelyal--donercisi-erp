import csv, re, json
from datetime import datetime

def parse_tr(s):
    if not s:
        return 0.0
    return float(s.replace('.', '').replace(',', '.').strip())

# 1. Process Customers and Orders from real_orders.csv
with open('/Users/yigitc/Documents/Projects/guzelyali-erp/real_orders.csv', mode='r', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

customers = {}
for r in rows:
    name = r['Müşteri'].strip()
    phone = r['Telefon'].strip()
    addr = r['Gelen adres'].strip() or r['Çözülen adres'].strip()
    source = r['Sipariş kaynağı'].strip()
    status = r['Durum'].strip()
    date_str = r['Tarih'].strip()
    courier = r['Kurye'].strip()
    
    nakit = float(r['Nakit'].replace('₺', '').replace('.', '').replace(',', '.').strip() or 0)
    kart = float(r['Kredi kartı'].replace('₺', '').replace('.', '').replace(',', '.').strip() or 0)
    online = float(r['Online'].replace('₺', '').replace('.', '').replace(',', '.').strip() or 0)
    total_amount = round(nakit + kart + online, 2)
    
    clean_digits = re.sub(r'\D', '', phone)
    if clean_digits.startswith('90') and len(clean_digits) == 12:
        clean_digits = '0' + clean_digits[2:]
        
    if len(clean_digits) == 11 and clean_digits.startswith('05'):
        phone_fmt = f'{clean_digits[:4]} {clean_digits[4:7]} {clean_digits[7:9]} {clean_digits[9:]}'
    elif phone and phone != '900000000000' and not phone.startswith('05*'):
        phone_fmt = phone
    else:
        phone_fmt = ''
        
    clean_name = name.replace('***', '').strip()
    if clean_name.endswith('-'):
        clean_name = clean_name[:-1].strip()
        
    if not clean_name or clean_name in ('belirtilmedi', 'Meal Che'):
        if addr and 'Beyazevler' in addr:
            clean_name = 'Beyazevler Müşterisi'
        elif addr and 'Pınar' in addr:
            clean_name = 'Pınar Mah. Müşterisi'
        elif addr:
            clean_name = addr.split(',')[0].strip() + ' Müşterisi'
        else:
            clean_name = 'Paket Müşterisi'
    else:
        clean_name = clean_name.title()
        
    if 'Trendyol' in source:
        src_label = 'Trendyol Yemek'
    elif 'Kokpit' in source:
        src_label = 'Telefon / Paket'
    else:
        src_label = 'Yemeksepeti'
        
    if addr and 'Test Line' not in addr:
        cust_key = phone_fmt if phone_fmt else f'{clean_name}_{addr[:15]}'
        if cust_key not in customers:
            customers[cust_key] = {
                'full_name': clean_name,
                'phone': phone_fmt or 'Belirtilmedi',
                'address': addr,
                'notes': f'Kanal: {src_label}' + (f' | Kurye: {courier}' if courier and courier != '-' else ''),
                'last_order_notes': f'{total_amount:.2f} ₺ ({src_label} - {date_str.split()[0]})',
                'orders_count': 0,
                'total_spent': 0.0
            }
        c = customers[cust_key]
        if status == 'TESLİM EDİLDİ':
            c['orders_count'] += 1
            c['total_spent'] = round(c['total_spent'] + total_amount, 2)

cust_lines = []
for i, (k, c) in enumerate(customers.items(), 1):
    fn = c['full_name'].replace("'", "''")
    ph = c['phone']
    ad = c['address'].replace("'", "''")
    nt = c['notes'].replace("'", "''")
    lon = c['last_order_notes'].replace("'", "''")
    oc = c['orders_count']
    ts = c['total_spent']
    cust_lines.append(f"INSERT OR IGNORE INTO customers (id, full_name, phone, address, notes, last_order_notes, total_orders_count, total_spent) VALUES ({i}, '{fn}', '{ph}', '{ad}', '{nt}', '{lon}', {oc}, {ts});")

order_lines = []

for idx, r in enumerate(rows, 1):
    raw_num = r['Sipariş numarası'].strip()
    status_raw = r['Durum'].strip()
    status = 'cancelled' if 'İPTAL' in status_raw else 'completed'
    date_raw = r['Tarih'].strip()
    try:
        dt = datetime.strptime(date_raw, '%d.%m.%Y %H:%M:%S')
        created_at = dt.strftime('%Y-%m-%d %H:%M:%S')
    except:
        created_at = '2026-11-14 12:00:00'
        
    cust_name = r['Müşteri'].strip().replace('***', '').strip()
    source_raw = r['Sipariş kaynağı'].strip()
    courier = r['Kurye'].strip()
    
    nakit = float(r['Nakit'].replace('₺', '').replace('.', '').replace(',', '.').strip() or 0)
    kart = float(r['Kredi kartı'].replace('₺', '').replace('.', '').replace(',', '.').strip() or 0)
    online = float(r['Online'].replace('₺', '').replace('.', '').replace(',', '.').strip() or 0)
    total_amount = round(nakit + kart + online, 2)
    
    if nakit > 0 and kart == 0 and online == 0:
        pay_method = 'cash'
    elif kart > 0 and nakit == 0 and online == 0:
        pay_method = 'credit_card'
    elif online > 0:
        pay_method = 'yemeksepeti_online'
    else:
        pay_method = 'credit_card'
        
    if 'Trendyol' in source_raw:
        channel = 'other'
    elif 'Kokpit' in source_raw:
        channel = 'phone'
    else:
        channel = 'yemeksepeti'
        
    comm_rate = 15.0 if channel == 'yemeksepeti' else 0.0
    comm_amt = round(total_amount * (comm_rate / 100.0), 2)
    net_earnings = round(total_amount - comm_amt, 2)
    cogs_total = round(total_amount * 0.35, 2) if status == 'completed' else 0.0
    gross_margin = round(total_amount - cogs_total, 2) if status == 'completed' else 0.0
    
    order_date_compact = dt.strftime('%Y%m%d')
    order_num = f"GZY-{order_date_compact}-{str(idx).zfill(3)}"
    cust_display = (cust_name.title() if cust_name and cust_name not in ('belirtilmedi', 'Meal Che') else 'Paket Müşterisi').replace("'", "''")
    notes = f"{source_raw} siparişi (Ref: {raw_num})" + (f" - Kurye: {courier}" if courier and courier != '-' else '')
    
    order_lines.append(
        f"INSERT OR IGNORE INTO orders (order_number, channel, table_or_customer, status, payment_method, payment_status, subtotal, discount_amount, tax_amount, total_amount, cogs_total, gross_margin, channel_commission_rate, channel_commission_amount, net_earnings, notes, created_at) VALUES ('{order_num}', '{channel}', '{cust_display}', '{status}', '{pay_method}', 'paid', {total_amount}, 0, 0, {total_amount}, {cogs_total}, {gross_margin}, {comm_rate}, {comm_amt}, {net_earnings}, '{notes}', '{created_at}');"
    )

# 2. Process orderDetails (5).csv for Yemeksepeti Partner detailed orders
ys_lines = []

with open('/Users/yigitc/Downloads/orderDetails (5).csv', mode='r', encoding='utf-8-sig') as f:
    ys_reader = list(csv.DictReader(f))

for idx, r in enumerate(ys_reader, 1):
    oid = r.get('Sipariş No', '').strip()
    if not oid:
        continue

    date_str = r.get('Siparişin Alındığı Zaman', '').strip()
    if len(date_str) == 16:
        date_str += ':00'

    gross = parse_tr(r.get('Ara Toplam', '0'))
    rest_disc = parse_tr(r.get('İndirim (İşletme tarafından karşılandı)', '0'))
    plat_disc = parse_tr(r.get('Yemeksepeti tarafından finanse edilen indirim', '0'))
    comm = parse_tr(r.get('Komisyon', '0'))
    comm_rate = round((comm / gross * 100), 2) if gross > 0 else 15.0
    plat_fees = parse_tr(r.get('Pazarlama ücretleri', '0')) + parse_tr(r.get('Vergi ücreti', '0')) + parse_tr(r.get('Çevrim içi ödeme ücreti', '0'))
    net = parse_tr(r.get('Tahmini Kazanç', '0'))
    if net == 0 and gross > 0:
        net = parse_tr(r.get('Ödeme tutarı', '0'))

    cogs = round(gross * 0.35, 2)
    pack = 5.0 if gross > 0 else 0.0
    delivery = parse_tr(r.get('Teslimat ücreti', '0'))
    contrib = round(net - cogs - pack, 2)

    status_raw = r.get('Sipariş Durumu', '').strip()
    status = 'completed' if status_raw == 'Alındı' else 'cancelled'

    pm_raw = r.get('Ödeme Türü', '').strip()
    pm_detail = r.get('Ödeme Yöntemi', '').strip()
    pm = 'yemeksepeti_online' if 'Online' in pm_raw or 'YEMEKPAY' in pm_detail or 'CREDITCARD' in pm_detail else 'cash'

    items = r.get('Sipariş ürünleri', '').strip()
    safe_items = items.replace("'", "''")

    raw_data = json.dumps({
        'items': items,
        'payment_type': pm_raw,
        'payment_method': pm_detail,
        'status_raw': status_raw,
        'marketing_fees': r.get('Pazarlama ücretleri', '0'),
        'reasons': r.get('Pazarlama ücretlerinin nedenleri', '')
    }, ensure_ascii=False).replace("'", "''")

    # Table: yemeksepeti_orders
    ys_lines.append(
        f"INSERT OR IGNORE INTO yemeksepeti_orders (platform_order_id, order_date, gross_amount, restaurant_discount, platform_discount, commission_rate, commission_amount, platform_fees, net_payout, calculated_cogs, packaging_cost, delivery_cost, contribution_profit, is_reconciled, raw_data_json, created_at) VALUES ('{oid}', '{date_str}', {gross}, {rest_disc}, {plat_disc}, {comm_rate}, {comm}, {plat_fees}, {net}, {cogs}, {pack}, {delivery}, {contrib}, 1, '{raw_data}', '{date_str}');"
    )

    # Table: orders (main ERP orders table)
    gross_margin = round(gross - cogs, 2)
    order_lines.append(
        f"INSERT OR IGNORE INTO orders (order_number, channel, table_or_customer, status, payment_method, payment_status, subtotal, discount_amount, tax_amount, total_amount, cogs_total, gross_margin, channel_commission_rate, channel_commission_amount, net_earnings, notes, created_at) VALUES ('{oid}', 'yemeksepeti', 'Yemeksepeti ({oid})', '{status}', '{pm}', 'paid', {gross}, {rest_disc}, 0, {gross}, {cogs}, {gross_margin}, {comm_rate}, {comm}, {net}, 'Ürünler: {safe_items}', '{date_str}');"
    )

ts_content = f"""// Real Customer and Orders Data from Restaurant Platform Exports
export const REAL_CUSTOMERS_SQL = `
{chr(10).join(cust_lines)}
`;

export const REAL_ORDERS_SQL = `
{chr(10).join(order_lines)}
`;

export const REAL_YEMEKSEPETI_ORDERS_SQL = `
{chr(10).join(ys_lines)}
`;
"""

with open('/Users/yigitc/Documents/Projects/guzelyali-erp/src/db/realData.ts', 'w', encoding='utf-8') as out_f:
    out_f.write(ts_content)

print(f"OK: Written {len(cust_lines)} customers, {len(order_lines)} orders, {len(ys_lines)} ys orders to src/db/realData.ts")
