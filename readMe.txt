Mobilya Satış E-Ticaret Sitesi
Bu proje, mobilya satışı yapan bir e-ticaret sitesinin tam fonksiyonel bir prototipini içerir. Proje, kullanıcıların mobilya ürünlerini görüntüleyip satın alabileceği, yönetici paneli üzerinden ürünlerin yönetimini yapabileceği bir platform sunar.

Özellikler
Kullanıcı Kayıt ve Giriş: Kullanıcılar siteye kayıt olabilir ve giriş yapabilir.
Ürün Kataloğu: Tüm mobilya ürünlerini kategori bazında görüntüleme imkanı.
Sepet Yönetimi: Kullanıcılar, ürünleri sepete ekleyebilir, çıkarabilir ve satın alabilir.
Yönetici Paneli: Yöneticiler ürün ekleyebilir, güncelleyebilir ve silebilir.
Ödeme Entegrasyonu: Güvenli ödeme sistemi ile alışveriş tamamlama imkanı.
Sipariş Takibi: Kullanıcılar sipariş durumlarını takip edebilir.
Kurulum
Proje Dosyalarını İndirin: Proje dosyalarını GitHub üzerinden klonlayın veya indirin.
bash
Kodu kopyala
git clone https://github.com/kullaniciadi/mobilya-satisi.git
Gerekli Bağımlılıkları Yükleyin:
bash
Kodu kopyala
cd mobilya-satisi
npm install
Veritabanı Ayarları: config/database.js dosyasını açın ve kendi veritabanı ayarlarınızı girin.
Sunucuyu Başlatın:
bash
Kodu kopyala
npm start
Tarayıcıda Açın: Projeniz çalışır durumda, tarayıcınızda http://localhost:3000 adresine gidin.
Kullanım
Ana Sayfa: Kategori ve ürünleri görüntüleyin.
Ürün Detayları: Ürün hakkında detaylı bilgileri inceleyin.
Sepete Ekle: Beğendiğiniz ürünü sepete ekleyin ve satın alın.
Yönetici Girişi: Yönetici paneline giriş yaparak ürün yönetimi gerçekleştirin.
Ekran Görüntüleri

Ana Sayfa: Kategoriler ve ürün listesi


Ürün Detay Sayfası: Ürün bilgileri ve satın alma butonu

Kullanılan Teknolojiler
Frontend: HTML, CSS, JavaScript
Backend: Node.js, Express.js
Veritabanı: MongoDB
Diğer Araçlar: Bootstrap, JWT, Stripe API (ödeme işlemleri için)
Gelecek Geliştirmeler
Kullanıcı Yorumları: Kullanıcıların ürünlere yorum yapabilmesi.
Çoklu Dil Desteği: Farklı dillerde kullanım imkanı.
Gelişmiş Filtreleme: Ürünleri fiyat, kategori vb. kriterlere göre filtreleme.
Lisans
Bu proje MIT Lisansı ile lisanslanmıştır. Daha fazla bilgi için LICENSE dosyasına bakınız.

Teşekkür
Bu proje geliştirilirken kullanılan kaynaklar:

Bootstrap Belgeleri
MongoDB Resmi Sitesi
Stripe API Belgeleri
