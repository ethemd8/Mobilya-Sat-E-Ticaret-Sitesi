const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
const pool = require("./helpers/database/database");
app.set('view engine', 'ejs');

app.use("/assets", express.static('assets'));

app.listen(3001, () => {
  console.log("Server is running on port 3001");

});
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Bağlantı hatası:', err);
  }
  console.log('PostgreSQL veritabanına başarıyla bağlandı.');

});


const routes = require("./rautes");
app.use("/", routes);
