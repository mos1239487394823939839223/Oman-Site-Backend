const asyncHandler = require("express-async-handler");
const sharp = require("sharp");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const GiftModel = require("../models/giftModel");
const factory = require("./handlersFactory");
const { uploadMixOfImages } = require("../middlewares/uploadImageMiddleware");

const uploadGiftImages = uploadMixOfImages([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 5 },
]);

const ensureGiftUploadDir = () => {
  const dir = "uploads/gifts";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const resizeGiftImages = asyncHandler(async (req, res, next) => {
  if (!req.files) {
    return next();
  }

  ensureGiftUploadDir();

  // contain (no crop) + white padding so the whole image fits the card
  const WHITE_BG = { r: 255, g: 255, b: 255, alpha: 1 };

  if (req.files.imageCover) {
    const imageCoverFilename = `gift-${uuidv4()}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
      .resize(1200, 900, { fit: "contain", background: WHITE_BG })
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(`uploads/gifts/${imageCoverFilename}`);
    req.body.imageCover = imageCoverFilename;
  }

  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (file, index) => {
        const filename = `gift-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;
        await sharp(file.buffer)
          .resize(800, 800, { fit: "contain", background: WHITE_BG })
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toFile(`uploads/gifts/${filename}`);
        req.body.images.push(filename);
      })
    );
  }

  next();
});

const forceGiftPrice = (req, res, next) => {
  req.body.price = 0;
  if (req.body.priceAfterDiscount !== undefined) {
    req.body.priceAfterDiscount = 0;
  }
  next();
};

const createGift = factory.createOne(GiftModel);
const getGifts = factory.getAll(GiftModel);
const getGiftById = factory.getOne(GiftModel);
const updateGift = factory.updateOne(GiftModel);
const deleteGift = factory.deleteOne(GiftModel);

module.exports = {
  createGift,
  getGifts,
  getGiftById,
  updateGift,
  deleteGift,
  uploadGiftImages,
  resizeGiftImages,
  forceGiftPrice,
};
