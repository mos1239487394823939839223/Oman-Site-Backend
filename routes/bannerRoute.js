const express = require("express");
const {
  getBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  uploadBannerImages,
  resizeBannerImages,
  setBannerImages,
} = require("../services/bannerService");
const {
  getBannerValidator,
  createBannerValidator,
  updateBannerValidator,
  deleteBannerValidator,
} = require("../utils/validators/bannerValidator");

const authService = require('../services/authService');

const router = express.Router();

// Public route - get all banners
router.route("/").get(getBanners);

// Admin routes - create banner (can include image upload)
router.post(
  "/",
  authService.protect,
  authService.allowedTo(['admin','manager']),
  uploadBannerImages,
  resizeBannerImages,
  createBannerValidator,
  createBanner
);

// Upload image to existing banner
router.post(
  "/:id/image",
  getBannerValidator,
  uploadBannerImages,
  resizeBannerImages,
  setBannerImages
);

// Admin routes - get, update, delete specific banner
router
  .route("/:id")
  .get(getBannerValidator, getBanner)
  .put(authService.protect, authService.allowedTo(['admin','manager']), uploadBannerImages, resizeBannerImages, updateBannerValidator, updateBanner)
  .delete(authService.protect, authService.allowedTo(['admin']), deleteBannerValidator, deleteBanner);

module.exports = router;
