const express = require("express");
const router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
const pool = require("../helpers/database/database");
const session = require('express-session');
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
require("dotenv").config();
router.use(express.urlencoded({ extended: false }));
const initializePassport = require("../helpers/authorization/passportConfig");
initializePassport(passport);

router.use(express.json());

router.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
}));

router.use(passport.initialize());
router.use(passport.session());
router.use(flash());

router.get("/product_details/:product_id", async (req, res) => {
  try {
    const product_id = req.params.product_id;

    // Ürün bilgilerini çekme sorgusu
    const productQuery = "SELECT * FROM products WHERE product_id = $1";
    const productResult = await pool.query(productQuery, [product_id]);
    const product = productResult.rows[0];

    // Ürün resimlerini çekme sorgusu
    const imagesQuery = "SELECT * FROM product_images WHERE product_id = $1";
    const imagesResult = await pool.query(imagesQuery, [product_id]);
    const images = imagesResult.rows;

    // Ürün bilgilerini ve resimlerini kullanarak sayfayı render etme
    res.render("../views/public/pages/product_details", { product_id, product, images });
  } catch (err) {
    console.error("Error fetching product details:", err);
    res.status(500).send("An error occurred while fetching product details.");
  }
});

router.get("/cart", checkNotAuthenticated, (req, res) => {
  res.render("../views/public/pages/cart");
});

router.get("/", (req, res) => {
  pool.query(`
    SELECT 
      TO_CHAR(p.creation_date, 'YYYY-MM-DD HH24:MI:SS') AS formatted_date, 
      p.*, 
      c.category_name
    FROM 
      products p
    LEFT JOIN 
      categories c ON p.category_id = c.category_id
  `, (error, urunResults) => {
    if (error) {
      console.error('Ürünler sorgusu hatası:', error);
      return res.status(500).send('Ürünler alınırken bir hata oluştu');
    }

    const urunler = urunResults.rows;
    const urunIDs = urunler.map(urun => urun.product_id);

    pool.query(`
      SELECT 
        p.product_id,
        (
            SELECT pi.image_url
            FROM product_images pi
            WHERE p.product_id = pi.product_id
            LIMIT 1
        ) AS image_url
      FROM 
        products p
      WHERE 
        p.product_id = ANY($1::int[])
    `, [urunIDs], (error, resimResults) => {
      if (error) {
        console.error('Resimler sorgusu hatası:', error);
        return res.status(500).send('Resimler alınırken bir hata oluştu');
      }

      const resimler = resimResults.rows;
      res.render('../views/public/index', { urunler, resimler });
    });
  });
});

router.get("/login", checkAuthenticated, (req, res) => {
  res.render("../views/public/pages/login");
});

router.get("/sign_in", checkAuthenticated, (req, res) => {
  res.render("../views/public/pages/sign_in");
});

router.get("/dashboard", checkNotAuthenticated, (req, res) => {
  pool.query(`
    SELECT * 
    FROM users 
    WHERE user_id = $1
  `, [req.user.user_id], (error, userResults) => {
    if (error) {
      console.error('Kullanıcı bilgisi sorgusu hatası:', error);
      return res.status(500).send('Kullanıcı bilgisi alınırken bir hata oluştu');
    }

    const user = userResults.rows[0];
    pool.query(`
      SELECT 
        TO_CHAR(p.creation_date, 'YYYY-MM-DD HH24:MI:SS') AS formatted_date, 
        p.*, 
        c.category_name
      FROM 
        products p
      LEFT JOIN 
        categories c ON p.category_id = c.category_id
    `, (error, urunResults) => {
      if (error) {
        console.error('Ürünler sorgusu hatası:', error);
        return res.status(500).send('Ürünler alınırken bir hata oluştu');
      }

      const urunler = urunResults.rows;
      const urunIDs = urunler.map(urun => urun.product_id);

      pool.query(`
        SELECT 
          p.product_id,
          (
              SELECT pi.image_url
              FROM product_images pi
              WHERE p.product_id = pi.product_id
              LIMIT 1
          ) AS image_url
        FROM 
          products p
        WHERE 
          p.product_id = ANY($1::int[])
      `, [urunIDs], (error, resimResults) => {
        if (error) {
          console.error('Resimler sorgusu hatası:', error);
          return res.status(500).send('Resimler alınırken bir hata oluştu');
        }

        const resimler = resimResults.rows;
        res.render('../views/public/pages/dashboard', { user, urunler, resimler });
      });
    });
  });
});

router.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      console.error("Çıkış yapılırken hata oluştu:", err);
      return next(err);
    }
    res.redirect("/");
  });
});

router.post('/payment', async (req, res) => {
  const { items, cartTotal, shipping, orderTotal } = req.body;
  res.render("../views/public/pages/payment", {
    cartTotal,
    shipping,
    orderTotal,
    items
  });
});

router.post('/submit-payment', async (req, res) => {
  const { fullName, email, address, city, state, zip, cardName, cardNumber, expMonth, expYear, cvv, cartTotal, shipping, orderTotal, items } = req.body;

  const defaultExpiryDate = expMonth + '/' + expYear;

  try {
    const client = await pool.connect();

    let userResult = await client.query('SELECT user_id FROM users WHERE email = $1', [email]);
    let userId;
    if (userResult.rows.length === 0) {
      const insertUserResult = await client.query(
        `INSERT INTO users (email, password, first_name, last_name, phone, creation_date, last_login, role)
              VALUES ($1, '', $2, '', '', NOW(), NOW(), 'customer') RETURNING user_id`,
        [email, fullName]
      );
      userId = insertUserResult.rows[0].user_id;
    } else {
      userId = userResult.rows[0].user_id;
    }

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, full_name, address, city, state, zip, card_name, card_number, expiry_date, cvv, total_amount, cart_total, shipping, order_total)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
      [userId, fullName, address, city, state, zip, cardName, cardNumber, defaultExpiryDate, cvv, orderTotal, cartTotal, shipping, orderTotal]
    );
    const orderId = orderResult.rows[0].id;

    const itemsObject = JSON.parse(items); // JSON stringini objeye dönüştür
    for (let productId in itemsObject) {
      const quantity = itemsObject[productId];
      const price = 0; // Fiyatı hesaplayın veya items içinde bulmaya çalışın
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)`,
        [orderId, productId, quantity, price]
      );
    }

    await client.query(
      `INSERT INTO order_status (order_id, status) VALUES ($1, $2)`,
      [orderId, 'Sipariş Alındı']
    );

    client.release();

    res.redirect('/success');
  } catch (err) {
    console.error(err);
    res.send("Bir hata oluştu. Lütfen tekrar deneyiniz.");
  }
});

router.get('/success', (req, res) => {
  res.render('../views/public/pages/success');
});
router.get('/contact', (req, res) => {
  res.render('../views/public/pages/contact');
});

router.post("/sign_in", async (req, res) => {
  const { email, password, password_repeat, first_name, last_name, phone } = req.body;
  const errors = [];

  if (!first_name || !email || !password || !password_repeat || !email || !last_name || !phone) {
    errors.push({ message: "Please enter all fields" });
  }

  if (password.length < 6) {
    errors.push({ message: "Password must be a least 6 characters long" });
  }

  if (password !== password_repeat) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    res.render("../views/public/pages/sign_in", { errors, email, password, password_repeat, first_name, last_name, phone });
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          console.log(err);
        }
        if (results.rows.length > 0) {
          return res.render("register", { message: "Email already registered" });
        } else {
          pool.query(
            `INSERT INTO users (email, password, first_name, last_name, phone, creation_date)
            VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING user_id, password`,
            [email, hashedPassword, first_name, last_name, phone],
            (err, results) => {
              if (err) {
                console.log(err);
                throw err;
              }
              req.flash("success_msg", "You are now registered. Please log in");
              res.redirect("/login");
            }
          );
        }
      }
    );
  }
});

router.get('/siparisler', checkNotAuthenticated, (req, res) => {
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
      ARRAY_AGG(oi.product_id) AS product_ids,
      ARRAY_AGG(oi.quantity) AS quantities
    FROM 
      orders o
    JOIN 
      order_items oi ON o.id = oi.order_id
    JOIN 
      order_status os ON o.id = os.order_id
    WHERE 
      o.user_id = $1
    GROUP BY
      o.id, o.full_name, o.address, o.city, o.state, o.zip, o.order_total, o.created_at, os.status
    ORDER BY 
      o.created_at DESC
  `, [req.user.user_id], (error, siparisResults) => {
    if (error) {
      console.error('Siparişler sorgusu hatası:', error);
      return res.status(500).send('Siparişler alınırken bir hata oluştu');
    }

    const siparisler = siparisResults.rows;
    const urunIDs = [...new Set(siparisResults.rows.flatMap(siparis => siparis.product_ids))];

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

      const resimlerMap = new Map();
      resimResults.rows.forEach(row => {
        if (!resimlerMap.has(row.product_id)) {
          resimlerMap.set(row.product_id, row.image_url);
        }
      });

      const siparislerWithImages = siparisler.map(siparis => {
        const products = siparis.product_ids.map((productId, index) => ({
          productId,
          quantity: siparis.quantities[index],
          imageUrl: resimlerMap.get(productId) || 'default_image_url'
        }));

        return { ...siparis, products };
      });

      res.render('../views/public/pages/orders', { siparisler: siparislerWithImages });
    });
  });
});

router.post('/siparisler/iptal', checkNotAuthenticated, (req, res) => {
  const orderId = req.body.order_id;

  pool.query(`
    UPDATE orders
    SET status = 'iptal edildi'
    WHERE id = $1 AND (status = 'beklemede' OR status = 'hazırlanıyor')
  `, [orderId], (error, result) => {
    if (error) {
      console.error('Sipariş iptali hatası:', error);
      return res.status(500).send('Sipariş iptal edilirken bir hata oluştu');
    }

    if (result.rowCount > 0) {
      req.flash('success_msg', 'Sipariş başarıyla iptal edildi');
    } else {
      req.flash('error_msg', 'Sipariş iptali yapılamadı. Sipariş durumu beklemede veya hazırlanıyor olmalıdır.');
    }

    res.redirect('/siparisler');
  });
});

router.post('/siparisler/iade', checkNotAuthenticated, (req, res) => {
  const orderId = req.body.order_id;
  const reason = req.body.reason;

  pool.query(`
    INSERT INTO return_requests (order_id, reason, request_date)
    VALUES ($1, $2, NOW())
  `, [orderId, reason], (error, result) => {
    if (error) {
      console.error('İade talebi hatası:', error);
      return res.status(500).send('İade talebi gönderilirken bir hata oluştu');
    }

    req.flash('success_msg', 'İade talebiniz başarıyla gönderildi');
    res.redirect('/siparisler');
  });
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/dashboard",
  failureRedirect: "/login",
  failureFlash: true
}));

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/dashboard");
  }
  next();
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

module.exports = router;
