const express = require("express");
const { getFooter, createFooter, updateFooter } = require("../services/footerService");
const {
  createFooterValidator,
  updateFooterValidator,
} = require("../utils/validators/footerValidator");
const authService = require("../services/authService");

const router = express.Router();

// Public – anyone can read the footer
router.get("/", getFooter);

// Admin / Manager only – create footer (only if none exists yet)
router.post(
  "/",
  authService.protect,
  authService.allowedTo(["admin", "manager"]),
  createFooterValidator,
  createFooter
);

// Admin / Manager only – update the singleton footer document
router.put(
  "/",
  authService.protect,
  authService.allowedTo(["admin", "manager"]),
  updateFooterValidator,
  updateFooter
);

module.exports = router;
