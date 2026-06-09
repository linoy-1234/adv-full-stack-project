const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Onco+Log API is running",
  });
});

module.exports = router;

//to check if the server is working