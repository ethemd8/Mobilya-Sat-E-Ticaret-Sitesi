const express = require("express");
const router = express.Router();
const admin = require("./admin");
const public = require("./public");

router.use("/admin",admin); 

router.use("/",public); 


module.exports = router;