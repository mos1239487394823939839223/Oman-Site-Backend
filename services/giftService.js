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

  // Preserve each image's own aspect ratio (no crop, no padding): bound the
  // longest side, never upscale. The cards use object-contain so any ratio fits.
  const MAX_SIDE = 2400;
  const FIT_OPTS = { fit: "inside", withoutEnlargement: true };
  // Highest-fidelity JPEG: max quality, full chroma, mozjpeg encoder.
  const JPEG_OPTS = { quality: 100, chromaSubsampling: "4:4:4", mozjpeg: true };

  if (req.files.imageCover) {
    const imageCoverFilename = `gift-${uuidv4()}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
      .rotate() // apply EXIF orientation so phone portraits don't come out sideways/wide
      .resize(MAX_SIDE, MAX_SIDE, FIT_OPTS)
      .toFormat("jpeg")
      .jpeg(JPEG_OPTS)
      .toFile(`uploads/gifts/${imageCoverFilename}`);
    req.body.imageCover = imageCoverFilename;
  }

  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (file, index) => {
        const filename = `gift-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;
        await sharp(file.buffer)
          .rotate() // apply EXIF orientation so phone portraits don't come out sideways/wide
          .resize(MAX_SIDE, MAX_SIDE, FIT_OPTS)
          .toFormat("jpeg")
          .jpeg(JPEG_OPTS)
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
