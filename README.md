# **Mobilya Satış E-Ticaret Sitesi**

Bu proje, mobilya satışı yapan bir e-ticaret sitesinin tam fonksiyonel bir prototipini içerir. Proje, kullanıcıların mobilya ürünlerini görüntüleyip satın alabileceği, yönetici paneli üzerinden ürünlerin yönetimini yapabileceği bir platform sunar.

## **Özellikler**

- **Kullanıcı Kayıt ve Giriş**: Kullanıcılar siteye kayıt olabilir ve giriş yapabilir.
- **Ürün Kataloğu**: Tüm mobilya ürünlerini kategori bazında görüntüleme imkanı.
- **Sepet Yönetimi**: Kullanıcılar, ürünleri sepete ekleyebilir, çıkarabilir ve satın alabilir.
- **Yönetici Paneli**: Yöneticiler ürün ekleyebilir, güncelleyebilir ve silebilir.
- **Ödeme Entegrasyonu**: Güvenli ödeme sistemi ile alışveriş tamamlama imkanı.
- **Sipariş Takibi**: Kullanıcılar sipariş durumlarını takip edebilir.

## **Kurulum**

1. **Proje Dosyalarını İndirin**: Proje dosyalarını GitHub üzerinden klonlayın veya indirin.
   ```bash
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

![image](https://github.com/user-attachments/assets/b2237c1d-68fc-47a0-bb6c-5ee9ab0b8585)
![image](https://github.com/user-attachments/assets/6c36c38d-dcb8-42cf-9cb5-1008bf804ba1)
![image](https://github.com/user-attachments/assets/8b299dc5-fb5f-4a4b-b3d8-2bafd315cda0)
![image](https://github.com/user-attachments/assets/0efb41ae-bdcf-4188-a70f-b0ad5acf9dda)


Ürün Detay Sayfası: Ürün bilgileri ve satın alma butonu

![image](https://github.com/user-attachments/assets/ed00e8a5-0a93-47bc-b1c3-0efcdf3ad919)
![image](https://github.com/user-attachments/assets/27bc6973-2bcc-49b9-90c6-c1dda74d7ee1)

Kullanılan Teknolojiler
Frontend: HTML, CSS, JavaScript
Backend: Node.js, Express.js
Veritabanı: MongoDB
Diğer Araçlar: Bootstrap, JWT, Stripe API (ödeme işlemleri için)
Gelecek Geliştirmeler
Kullanıcı Yorumları: Kullanıcıların ürünlere yorum yapabilmesi.
Çoklu Dil Desteği: Farklı dillerde kullanım imkanı.
Gelişmiş Filtreleme: Ürünleri fiyat, kategori vb. kriterlere göre filtreleme.
