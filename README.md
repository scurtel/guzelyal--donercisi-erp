# GÜZELYALI ERP — RESTORAN MÜHENDİSLİK VE MUHASEBE SİSTEMİ

**Güzelyalı Dönercisi** için özel olarak tasarlanmış, profesyonel, modern, güvenilir ve tamamen lokal (çevrimdışı) çalışan masaüstü restoran operasyon ve maliyet muhasebesi yönetim yazılımı.

---

## 🚀 Öne Çıkan Özellikler

### 1. %100 Çevrimdışı ve Yerel Veri Bütünlüğü
- **Teknoloji:** Electron + React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Recharts
- **Veritabanı:** Yerel SQLite (ACID atomik transaction, kayan nokta hassasiyet koruması)
- **Bağımsızlık:** İnternet bağlantısı gerektirmez; tüm hesaplamalar ve veriler lokalde saklanır.
- **Yedekleme:** Tek tıkla `.gzy` şifreli yerel yedek alma ve başlık doğrulamalı yedekten geri yükleme.

### 2. Yönetim Kontrol Merkezi (Dashboard)
- **Anlık KPI Kartları:** Bugünkü Ciro, İşletme Gideri, Satılan Mal Maliyeti (SMM / COGS), Brüt Kâr, Tahmini Net Faaliyet Kârı, Sipariş Sayısı, Ortalama Sepet, Kasa & Banka Bakiyesi, Yemeksepeti Bekleyen Alacak.
- **Canlı Grafikler:** Saatlik satış yoğunluğu, haftalık ciro ve maliyet trendi, satış kanalları pasta grafiği.
- **Stok Alarmları:** Minimum kritik eşiğin altına düşen hammaddelerin anlık uyarıları.
- **Günlük Başabaş Göstergesi:** Günlük başabaş ciro ve porsiyon eşiği karşılama çubuğu.

### 3. Üretim Mühendisliği ve Döner Verimlilik Analizi
- **Et ve Tavuk Ayrımı:** Çiğ şiş takımı ile piştikten sonraki net kesilebilir etin ayrı ayrı tartımı.
- **Fire & Verim Hesaplayıcı:** Pişirme firesi (%), verimlilik oranı (%), 110g / 100g standart porsiyon sayısı.
- **Porsiyon Başına Gerçek Et Maliyeti:** Çiğ hammadde alış fiyatı ve gerçek pişmiş verim üzerinden porsiyon başı reel et maliyeti.
- **Teorik vs. Gerçek Tüketim Farkı:** Fazla fireden kaynaklanan malzeme kayıp tutarı analizi.
- **Yarın İçin Akıllı Hazırlık Planlama:** Hedeflenen sipariş adedine göre gereken çiğ et, tavuk ve ekmek tahmini.

### 4. Akıllı Stok ve Depo Yönetimi
- **Hammadde Takibi:** Çiğ et, tavuk, lavaş, sütlü ekmek, pide, patates, sos, ambalaj, içecekler.
- **Ağırlıklı Ortalama Maliyet:** Her mal alımında birim maliyetin otomatik güncellenmesi.
- **Stok Hareket Ayrımı:** Mal alımı, reçete satış düşüşü, üretim çıkışı, fire/zayiat, iade ve sayım düzeltmesi.
- **Muhasebe İlkesi:** Stok alımı nakit çıkışı / varlık girişidir; doğrudan P&L gideri sayılmaz.

### 5. Dokunmatik Kasa ve Satış POS
- **5 Satış Kanalı:** Restoran İçi, Gel-Al, Yemeksepeti, Telefon Siparişi, Diğer.
- **Kanal Bazlı Fiyatlandırma:** Her kanal için ayrı liste fiyatı desteği.
- **Detaylı Adisyon:** Ekmek seçimi (Lavaş, Sütlü Ekmek, Pide), özel notlar, iskonto yönetimi.
- **80 mm Termal Yazıcı Desteği:** Tek tıkla adisyon fişi yazdırma modalı ve baskı şablonu.
- **Kontrollü İptal ve İade:** Sipariş iptal edildiğinde reçeteye bağlı hammadde stoka geri döner, kasa dengelenir.

### 6. Finansal Muhasebe ve Gün Sonu Kapanışı
- **Kasa & Banka Takibi:** Merkez Nakit Kasa, Banka POS Hesabı, Yemeksepeti Cari Alacak.
- **Gider Yönetimi:** 15 resmi gider kategorisi (Et, Tavuk, Ekmek, Kira, Personel, Enerji vb.).
- **Tedarikçi ve Personel Carileri:** Yevmiye ödemeleri, avanslar, toptancı borç bakiyeleri.
- **Z-Raporu Gün Sonu Kapanışı:** Sayılan fiziki nakit ile sistem kasasının karşılaştırılması ve kasa farkı tespiti.
- **Dönemsel Gelir Tablosu (P&L):** Satış Hasılatı - SMM = Brüt Kâr; Brüt Kâr - Faaliyet Giderleri = Net Kâr.

### 7. Yemeksepeti Kârlılık ve Mutabakat
- **Komisyon Oranı:** Varsayılan %15 (yapılandırılabilir).
- **Sipariş Katkı Kârı:** Brüt sipariş - Komisyon - SMM - Ambalaj = Net sipariş kârı.
- **CSV İçe Aktarma:** Yemeksepeti sipariş CSV dosyalarını yükleme, mükerrer siparişleri önleme ve mutabakat.

### 8. Menü Mühendisliği ve Fiyat Simülasyonu
- **4 Kategori Matrisi:** Yıldızlar (Stars), İş Atları (Plowhorses), Bulmacalar (Puzzles), Zayıflar (Dogs).
- **İnteraktif Fiyat Simülasyonu:** Fiyat artışında ürün katkı marjı değişimi ve elastikiyet kaynaklı satış düşüşünün toplam kâra etkisi.

### 9. Başabaş ve Kârlılık Analizi
- **Özel Hesaplayıcı:** *"Bugün zarar etmemek için kaç adet döner satmam gerekiyor?"*
- **Sabit ve Değişken Gider Ayrımı:** Günlük 5.550 TL sabit gider (Ahmet Usta 3.300 TL + Mehmet 1.350 TL + Kira 900 TL).
- **Hedef Kâr Hesaplayıcı:** Günlük hedeflenen kârı elde etmek için satılması gereken döner adedi.

### 10. Müşteri Kayıt & Rehber (CRM)
- **Hızlı Arama:** İsim, telefon numarası veya adres ile anında canlı arama.
- **POS Entegrasyonu:** Telefon siparişi geldiğinde rehberden müşteri seçildiğinde adresi, telefonu ve önceki sipariş tercihleri otomatik adisyona aktarılır.
- **Hızlı Kayıt:** POS ekranından ayrılmadan saniyeler içinde yeni müşteri kaydı.
- **Müşteri İstatistikleri:** Toplam sipariş adedi ve kümülatif ciro takibi.

### 11. Raporlama ve Dışa Aktar
- **Excel / CSV Dışa Aktarma:** Satışlar, stok değerleme, fire analizleri, kasa hareketleri.
- **PDF Rapor Çıktısı:** Tek tıkla A4 formatında kurumsal rapor oluşturma (`jsPDF` & `autoTable`).

---

## 🌐 Canlı Web Paneli

Tüm çalışanların telefon, tablet ve bilgisayarlarından erişebilmesi için web sürümü yayındadır:
- **Panel URL:** [https://panel.guzelyalidonercisi.com/](https://panel.guzelyalidonercisi.com/)
- **Merkezi Veritabanı:** Otomatik senkronizasyonlu lokal ve bulut SQLite altyapısı.

---

## 🛠️ Kurulum ve Çalıştırma

### Geliştirme Ortamı (Development)
```bash
# Proje dizinine geçin
cd guzelyali-erp

# Bağımlılıkları kurun (zaten kuruluysa atlayın)
npm install

# Testleri çalıştırın
npm test

# Arayüz geliştirme sunucusu
npm run dev

# Electron masaüstü uygulamasını geliştirme modunda başlatın
npm run dev:electron
```

### Windows Kurulum Paketi Hazırlama (Build & Package)
```bash
# Üretim derlemesi (React UI ve Electron Main)
npm run build

# Windows NSIS Kurulum Dosyası (.exe) ve Taşınabilir (Portable) Paket Oluşturma
npm run package:win
```
Oluşturulan kurulum dosyaları `release/` klasöründe yer alır:
- `release/Güzelyalı ERP Setup 1.0.0.exe` (Windows Kurulum Sihirbazı)
- `release/Güzelyalı ERP 1.0.0.exe` (Taşınabilir Tek Dosya)

---

## 🧪 Uçtan Uca Doğrulama ve Testler

Uygulamanın tüm finansal ve stok mantığı `vitest` ile yazılmış uçtan uca kabul senaryosuyla doğrulanmıştır:
```bash
npm test
```
**Test Kapsamı:**
1. 6 kg et stok girişi ve ağırlıklı ortalama maliyet (6.500 TL).
2. Pişirme tartımı: 4.2 kg pişmiş net verim (%70 verim, %30 fire), 38 adet 110g porsiyon, 171.05 TL porsiyon maliyeti.
3. 110g et içeren Et Dürüm reçetesi doğrudan maliyet ve brüt katkı hesabı.
4. Et Dürüm satışı ve reçeteye bağlı et ile lavaş stoğunun anlık düşüşü.
5. Nakit kasa gelirinin yansıması.
6. Yemeksepeti siparişi ve %15 komisyon kesintisinin uygulanması.
7. Brüt kâr, SMM ve gün sonu Z-Raporu kasa farkı hesabı.
8. SQLite veritabanının binary dışa aktarımı ve yeni oturuma geri yüklenmesi (veri kaybı sıfır).
