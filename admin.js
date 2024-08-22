
const express = require("express");
const router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
const pool = require("../helpers/database/database");
const multer = require('multer');
const fs = require('fs');
const session = require('express-session');



router.get("/", async (req, res) => {
  try {
     // Kullanıcının ID'sini session'dan alın

    const ordersCount = await pool.query('SELECT COUNT(*) FROM orders');
    const userRegistrations = await pool.query('SELECT COUNT(*) FROM users');
    const topProducts = await pool.query('SELECT product_name, SUM(quantity) AS total_sold FROM order_items JOIN products ON order_items.product_id = products.product_id GROUP BY product_name ORDER BY total_sold DESC LIMIT 3');
    const userId = req.session.user_id;
    console.log(userId)
    // Kullanıcı için ürün önerileri
    const recommendedProducts = await pool.query(`
      SELECT 
        products.product_id, 
        products.product_name, 
        COUNT(order_items.product_id) AS purchase_count 
      FROM 
        orders 
      JOIN 
        order_items ON orders.id = order_items.order_id 
      JOIN 
        products ON order_items.product_id = products.product_id 
      WHERE 
        orders.user_id = 6
      GROUP BY 
        products.product_id 
      ORDER BY 
        purchase_count DESC 
      LIMIT 5;
    `);

    const stats = {
      ordersCount: ordersCount.rows[0].count,
      userRegistrations: userRegistrations.rows[0].count,
      topProducts: topProducts.rows,
      recommendedProducts: recommendedProducts.rows
    };

    res.render("admin/index", { stats });
  } catch (error) {
    console.error('İstatistikler alınırken bir hata oluştu:', error);
    res.status(500).send('İstatistikler alınırken bir hata oluştu');
  }
});



router.get("/urunekle", (req, res) => {
  // Kategorileri veritabanından al
  pool.query('SELECT * FROM categories', (error, results) => {
    if (error) {
      console.error('Kategorileri alma hatası:', error);
      return res.status(500).send('Kategoriler alınırken bir hata oluştu');
    }
    // Kategorileri aldıktan sonra urunEkle sayfasına gönder
    const categories = results.rows;
    res.render("../views/admin/pages/urunEkle", { categories });
  });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './assets/product_img'); // Dosyanın kaydedileceği klasör
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split('.').pop(); // Dosya uzantısını al
    const randomString = Math.random().toString(36).substring(7); // Rastgele dize oluştur
    const fileName = `${Date.now()}-${randomString}.${ext}`; // Dosya adını oluştur
    cb(null, fileName); // Dosya adını geri döndür
  }
});

const upload = multer({ storage: storage });

router.post('/urun', upload.array('urunResimler', 10), (req, res) => {
  // console.log(req.files); // Yüklenen dosyaların bilgileri

  const { urunAdi, urunKategori, urunFiyati, urunStok, urunAciklama } = req.body;
  const yeniKategoriAdi = req.body.yeniKategori;
  // Kategoriyi categories tablosuna ekle
  if (yeniKategoriAdi) {
    // Kategoriyi categories tablosuna ekle
    pool.query('INSERT INTO categories (category_name) VALUES ($1)', [yeniKategoriAdi], (error, results) => {
      if (error) {
        console.error('Kategori eklenirken hata oluştu:', error);
      } else {
        console.log('Yeni kategori başarıyla eklendi');
      }
    });
  }
  // Ürünü veritabanına ekle
  pool.query('INSERT INTO products (product_name, category_id, price, stock_quantity, description) VALUES ($1, $2, $3, $4, $5) RETURNING product_id',
   [urunAdi, urunKategori, urunFiyati, urunStok, urunAciklama], (error, results) => {
    if (error) {
      console.error('Ürün eklenirken hata oluştu:', error);
      return res.status(500).send('Ürün eklenemedi');
    }
    const productId = results.rows[0].product_id; // Eklenen ürünün ID'sini al
    // Her resim için veritabanına kayıt ekle
    req.files.forEach((file) => {
      const imageUrl = file.filename; // Dosya adını al
      // Resimleri veritabanına kaydet
      pool.query('INSERT INTO product_images (product_id, image_url) VALUES ($1, $2)', [productId, imageUrl], (error) => {
        if (error) {
          console.error('Resim eklenirken hata oluştu:', error);
        }
      });
      console.log('resimler başarıyla kaydedildi');
    });
    res.status(200).redirect('/admin/urunekle'); // /urunekle sayfasına yönlendir
  });
});

router.get("/urunler", (req, res) => {
  // Ürünleri getir
  pool.query(`
    SELECT 
      TO_CHAR(p.creation_date, 'YYYY-MM-DD HH24:MI:SS') AS formatted_date, 
      p.*, 
      c.category_name
    FROM 
      products p
    JOIN 
      categories c ON p.category_id = c.category_id
  `, (error, urunResults) => {
    if (error) {
      console.error('Ürünler sorgusu hatası:', error);
      return res.status(500).send('Ürünler alınırken bir hata oluştu');
    }

    const urunler = urunResults.rows;

    // Ürünlerin ID'lerini al
    const urunIDs = urunler.map(urun => urun.product_id);

    // Resimleri getir
    pool.query(`
      SELECT 
        p.product_id,
        pi.image_url
      FROM 
        products p
      LEFT JOIN 
        product_images pi ON p.product_id = pi.product_id
      WHERE 
        p.product_id = ANY($1::int[])
    `, [urunIDs], (error, resimResults) => {
      if (error) {
        console.error('Resimler sorgusu hatası:', error);
        return res.status(500).send('Resimler alınırken bir hata oluştu');
      }
      //console.log('Resimler:', resimResults);
      const resimler = resimResults.rows;

      // EJS şablonunu kullanarak HTML sayfasını oluşturup gönder
      res.render('../views/admin/pages/urunler', { urunler, resimler });
    });
  });
});

// Siparişlerin listelenmesi
router.get("/siparisler", (req, res) => {
  pool.query(`
    SELECT 
      o.id AS order_id,
      o.full_name,
      o.address,
      o.city,
      o.state,
      o.zip,
      o.order_total,
      TO_CHAR(o.created_at, 'YYYY-MM-DD HH24:MI:SS') AS formatted_date,
      os.status,
      os.updated_at,
      ARRAY_AGG(oi.product_id) AS product_ids
    FROM 
      orders o
    JOIN 
      order_items oi ON o.id = oi.order_id
    JOIN 
      order_status os ON o.id = os.order_id
    GROUP BY
      o.id, o.full_name, o.address, o.city, o.state, o.zip, o.order_total, o.created_at, os.status, os.updated_at
    ORDER BY 
      o.created_at DESC
  `, (error, siparisResults) => {
    if (error) {
      console.error('Siparişler sorgusu hatası:', error);
      return res.status(500).send('Siparişler alınırken bir hata oluştu');
    }

    const siparisler = siparisResults.rows;

    res.render('../views/admin/pages/siparisler', { siparisler });
  });
});
router.get('/siparisDetay/:order_id', async (req, res) => {
  try {
    // Sipariş ID'sini al
    const orderId = req.params.order_id;

    // Sipariş detaylarını veritabanından al
    const orderDetails = await pool.query(
      `SELECT 
              orders.*,
              order_items.product_id,
              order_items.quantity,
              products.product_name,
              products.price
          FROM 
              orders
          JOIN 
              order_items ON orders.id = order_items.order_id
          JOIN 
              products ON order_items.product_id = products.product_id
          WHERE 
              orders.id = $1`,
      [orderId]
    );

    // Siparişin iade bilgilerini al
    const returnDetails = await pool.query(
      `SELECT * FROM return_requests WHERE order_id = $1`,
      [orderId]
    );

    // Sipariş detaylarını ve iade bilgilerini gösteren bir HTML sayfasına yönlendirme yap
    res.render('../views/admin/pages/siparisDetay', {
      siparisDetaylari: orderDetails.rows,
      iadeBilgileri: returnDetails.rows
    });
  } catch (error) {
    console.error('Sipariş detayları alınırken bir hata oluştu:', error);
    res.status(500).send('Sipariş detayları alınırken bir hata oluştu');
  }
});

router.get('/kullanicilar', (req, res) => {
  pool.query('SELECT * FROM users', (error, results) => {
    if (error) {
      console.error('Kullanıcılar alınırken hata oluştu:', error);
      return res.status(500).send('Kullanıcılar alınırken bir hata oluştu');
    }
    const kullanicilar = results.rows;
    res.render('../views/admin/pages/kullanicilar', { kullanicilar });
  });
});


router.get('/kullaniciDetayDuzenle/:user_id', (req, res) => {
  const userId = req.params.user_id;
  pool.query('SELECT * FROM users WHERE user_id = $1', [userId], (error, results) => {
    if (error) {
      console.error('Kullanıcı bilgileri alınırken hata oluştu:', error);
      return res.status(500).send('Kullanıcı bilgileri alınırken bir hata oluştu');
    }
    const kullanici = results.rows[0];
    res.render('../views/admin/pages/kullaniciDetayDuzenle', { kullanici });
  });
});

// Kullanıcıyı güncelle
router.post('/kullaniciDetayDuzenle/:user_id', (req, res) => {
  const userId = req.params.user_id;
  const { email, first_name, last_name, phone } = req.body;
  pool.query('UPDATE users SET email = $1, first_name = $2, last_name = $3, phone = $4 WHERE user_id = $5', [email, first_name, last_name, phone, userId], (error, results) => {
    if (error) {
      console.error('Kullanıcı güncellenirken hata oluştu:', error);
      return res.status(500).send('Kullanıcı güncellenirken bir hata oluştu');
    }
    res.redirect('/admin/kullaniciDetayDuzenle/' + userId);
  });
});

router.post('/kullaniciSil', (req, res) => {
  const userId = req.body.user_id;
  // Kullanıcıyı veritabanından sil
  pool.query('DELETE FROM users WHERE user_id = $1', [userId], (error, results) => {
    if (error) {
      console.error('Kullanıcı silinirken hata oluştu:', error);
      return res.status(500).send('Kullanıcı silinirken bir hata oluştu');
    }
    res.redirect('/admin/kullanicilar');
  });
});
// Sipariş durumunu güncellemek
router.post("/siparisDurumuGuncelle", (req, res) => {
  const { order_id, status } = req.body;

  pool.query(`
    UPDATE order_status
    SET status = $1, updated_at = NOW()
    WHERE order_id = $2
  `, [status, order_id], (error, results) => {
    if (error) {
      console.error('Sipariş durumu güncelleme hatası:', error);
      return res.status(500).send('Sipariş durumu güncellenirken bir hata oluştu');
    }

    res.redirect("/admin/siparisler");
  });
});

// Sipariş silmek
router.post("/siparisSil", (req, res) => {
  const { order_id } = req.body;

  pool.query(`
    DELETE FROM order_items
    WHERE order_id = $1
  `, [order_id], (error, results) => {
    if (error) {
      console.error('Order items silme hatası:', error);
      return res.status(500).send('Order items silinirken bir hata oluştu');
    }

    pool.query(`
      DELETE FROM orders
      WHERE id = $1
    `, [order_id], (error, results) => {
      if (error) {
        console.error('Sipariş silme hatası:', error);
        return res.status(500).send('Sipariş silinirken bir hata oluştu');
      }

      res.redirect("/admin/siparisler");
    });
  });
});






router.get('/urunSil/:id', (req, res) => {
  const productId = req.params.id;
  console.log(req.url);
  // Resimleri klasörden silme işlemi
  pool.query('SELECT image_url FROM product_images WHERE product_id = $1', [productId], (error, results) => {
    if (error) {
      console.error('Resimler bulunurken hata oluştu:', error);
      return res.status(500).send('Resimler bulunamadı');
    }

    // Resimleri klasörden sil
    results.rows.forEach((row) => {
      const imagePath = './assets/product_img/' + row.image_url;
      fs.unlink(imagePath, (error) => {
        if (error) {
          console.error('Resim silinirken hata oluştu:', error);
        }
      });
    });

    // Ürünü ve ilişkili resimleri silme işlemi
    pool.query('DELETE FROM product_images WHERE product_id = $1', [productId], (error, results) => {
      if (error) {
        console.error('Resimler silinirken hata oluştu:', error);
        return res.status(500).send('Resimler silinemedi');
      }

      // Ürünü silme işlemi
      pool.query('DELETE FROM products WHERE product_id = $1', [productId], (error, results) => {
        if (error) {
          console.error('Ürün silinirken hata oluştu:', error);
          return res.status(500).send('Ürün silinemedi');
        }

        console.log('Ürün ve ilişkili resimler başarıyla silindi');
        res.redirect('/admin/urunler');
      });
    });
  });
});

router.get('/urunDuzenle/:id', (req, res) => {
  const productId = req.params.id;
  // Ürünleri getir
  pool.query('SELECT * FROM categories', (error, results) => {
    if (error) {
      console.error('Kategorileri alma hatası:', error);
      return res.status(500).send('Kategoriler alınırken bir hata oluştu');
    }
    // Kategorileri aldıktan sonra urunDuzenle sayfasına gönder
    const categories = results.rows;
    pool.query(`
      SELECT 
        TO_CHAR(p.creation_date, 'YYYY-MM-DD HH24:MI:SS') AS formatted_date, 
        p.*, 
        c.category_name
      FROM 
        products p
      JOIN 
        categories c ON p.category_id = c.category_id
      WHERE 
        p.product_id = $1
    `, [productId], (error, urunResults) => {
      if (error) {
        console.error('Ürünler sorgusu hatası:', error);
        return res.status(500).send('Ürünler alınırken bir hata oluştu');
      }

      const urunler = urunResults.rows;

      // Resimleri getir
      pool.query(`
        SELECT 
          pi.image_url
        FROM 
          product_images pi
        WHERE 
          pi.product_id = $1
      `, [productId], (error, resimResults) => {
        if (error) {
          console.error('Resimler sorgusu hatası:', error);
          return res.status(500).send('Resimler alınırken bir hata oluştu');
        }

        const resimler = resimResults.rows;

        // EJS şablonunu kullanarak HTML sayfasını oluşturup gönder
        res.render("../views/admin/pages/urunduzenle", { urunler, resimler, categories });
      });
    });
  });
});

router.post('/urunDuzenle/:id', (req, res) => {
  const productId = req.params.id;
  console.log("Gelen form verileri:", req.body);
  const { urunAdi, urunFiyati, urunStok, urunAciklama, urunKategori } = req.body;
  const yeniKategoriId = req.body.yeniKategori; // Formdan gelen yeni category_id değeri

  console.log("Gelen id :", productId);
  console.log("Gelen kategory :", urunAdi);
  console.log("Gelen kategory :", urunKategori);

  // Kategoriyi categories tablosuna ekle

  // Ürünü güncelle
  pool.query(`
    UPDATE products 
    SET 
      product_name = $1,
      price = $2,
      stock_quantity = $3,
      description = $4,
      category_id=$5
    WHERE 
      product_id = $6
  `, [urunAdi, urunFiyati, urunStok, urunAciklama, urunKategori, productId], (error, results) => {
    if (error) {
      console.error('Ürün güncelleme hatası:', error);
      return res.status(500).send('Ürün güncellenirken bir hata oluştu');
    }

    console.log('Ürün başarıyla güncellendi');
    res.redirect('/admin/urunDuzenle/' + productId);
  });





});



router.post('/urunKategoriDuzenle/:id', (req, res) => {

  const { yeniKategori } = req.body;
  const productId = req.params.id;
  console.log("Gelen form verileri:", req.body);
  pool.query('INSERT INTO categories (category_name) VALUES ($1)', [yeniKategori], (error, results) => {
    if (error) {
      console.error('Kategori eklenirken hata oluştu:', error);
    } else {
      console.log('Yeni kategori başarıyla eklendi');
    }
  });

  res.redirect('/admin/urunDuzenle/' + productId);

});


router.post('/urunResimDuzenle/:id', upload.array('urunResimler', 10), (req, res) => {
  const productId = req.params.id;
  console.log("Gelen form verileri:", req.body);
  pool.query('SELECT image_url FROM product_images WHERE product_id = $1', [productId], (error, results) => {
    if (error) {
      console.error('Resimler bulunurken hata oluştu:', error);
      return res.status(500).send('Resimler bulunamadı');
    }

    // Resimleri klasörden sil
    results.rows.forEach((row) => {
      const imagePath = './assets/product_img/' + row.image_url;
      fs.unlink(imagePath, (error) => {
        if (error) {
          console.error('Resim silinirken hata oluştu:', error);
        }
      });
    });
  });
  // Yeni resimlerin dosya adlarını al
  const newImageUrls = req.files.map(file => file.filename);

  // Mevcut ürünün resimlerini sil
  pool.query('DELETE FROM product_images WHERE product_id = $1', [productId], (deleteError) => {
    if (deleteError) {
      console.error('Mevcut resimler silinirken hata oluştu:', deleteError);
      return res.status(500).send('Resimler güncellenirken bir hata oluştu');
    }


    // Yeni resimleri veritabanına ekle
    newImageUrls.forEach((imageUrl) => {
      pool.query('INSERT INTO product_images (product_id, image_url) VALUES ($1, $2)', [productId, imageUrl], (insertError) => {
        if (insertError) {
          console.error('Yeni resim eklenirken hata oluştu:', insertError);
        }
      });
    });

    console.log('Resimler başarıyla güncellendi');
    res.redirect('/admin/urunDuzenle/' + productId);
  });
});



module.exports = router;
