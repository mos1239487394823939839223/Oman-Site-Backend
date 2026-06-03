const express = require("express");
const router = express.Router();

const {
  createGift,
  getGifts,
  getGiftById,
  updateGift,
  deleteGift,
  uploadGiftImages,
  resizeGiftImages,
  forceGiftPrice,
} = require("../services/giftService");

const {
  createGiftValidator,
  updateGiftValidator,
  getGiftByIdValidator,
  deleteGiftValidator,
  getGiftsValidator,
} = require("../utils/validators/giftValidator");

const authService = require("../services/authService");

router
  .route("/")
  .post(
    authService.protect,
    authService.allowedTo(["admin", "manager"]),
    uploadGiftImages,
    resizeGiftImages,
    createGiftValidator,
    forceGiftPrice,
    createGift
  )
  .get(getGiftsValidator, getGifts);

router
  .route("/:id")
  .get(getGiftByIdValidator, getGiftById)
  .put(
    authService.protect,
    authService.allowedTo(["admin", "manager"]),
    uploadGiftImages,
    resizeGiftImages,
    updateGiftValidator,
    forceGiftPrice,
    updateGift
  )
  .delete(
    authService.protect,
    authService.allowedTo(["admin"]),
    deleteGiftValidator,
    deleteGift
  );

module.exports = router;
