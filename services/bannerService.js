const asyncHandler = require("express-async-handler");
const fs = require("fs");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

const BannerModel = require("../models/bannerModel");
const ApiError = require("../utils/apiError");
const { uploadMixOfImages } = require("../middlewares/uploadImageMiddleware");

const uploadBannerImages = uploadMixOfImages([
  { name: "images", maxCount: 8 },
  { name: "image", maxCount: 8 },
]);

const ensureBannerUploadDir = () => {
  const dir = "uploads/banners";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const resizeBannerImages = asyncHandler(async (req, res, next) => {
  const files = [];
  if (req.files && req.files.images) {
    files.push(...req.files.images);
  }
  if (req.files && req.files.image) {
    files.push(...req.files.image);
  }

  if (files.length === 0) {
    return next();
  }

  ensureBannerUploadDir();

  req.body.images = [];

  await Promise.all(
    files.map(async (file) => {
      const filename = `banner-${uuidv4()}-${Date.now()}.jpeg`;
      await sharp(file.buffer)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`uploads/banners/${filename}`);
      req.body.images.push(filename);
    })
  );

  next();
});

const normalizeBannerImages = (req) => {
  if (req.body.images) {
    req.body.images = Array.isArray(req.body.images)
      ? req.body.images
      : [req.body.images];
    return;
  }

  if (req.body.image) {
    req.body.images = Array.isArray(req.body.image)
      ? req.body.image
      : [req.body.image];
    delete req.body.image;
  }
};

// @desc    Get all banners
// @route   GET /api/v1/banners
// @access  Public
exports.getBanners = asyncHandler(async (req, res) => {
  const banners = await BannerModel.find({ isActive: true })
    .sort({ order: 1, createdAt: -1 })
    .select("_id name images link");
  
  res.status(200).json({
    status: "success",
    results: banners.length,
    data: banners
  });
});

// @desc    Get specific banner by id
// @route   GET /api/v1/banners/:id
// @access  Public
exports.getBanner = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const banner = await BannerModel.findById(id);
  if (!banner) {
    return next(new ApiError(`No banner found for this id: ${id}`, 404));
  }
  res.status(200).json({ status: "success", data: banner });
});

// @desc    Create banner
// @route   POST /api/v1/banners
// @access  Private/Admin
exports.createBanner = asyncHandler(async (req, res) => {
  normalizeBannerImages(req);
  const banner = await BannerModel.create(req.body);
  res.status(201).json({ status: "success", data: banner });
});

// @desc    Update specific banner
// @route   PUT /api/v1/banners/:id
// @access  Private/Admin
exports.updateBanner = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  normalizeBannerImages(req);

  const banner = await BannerModel.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!banner) {
    return next(new ApiError(`No banner found for this id: ${id}`, 404));
  }
  res.status(200).json({ status: "success", data: banner });
});

// @desc    Delete specific banner
// @route   DELETE /api/v1/banners/:id
// @access  Private/Admin
exports.deleteBanner = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const banner = await BannerModel.findByIdAndDelete(id);
  if (!banner) {
    return next(new ApiError(`No banner found for this id: ${id}`, 404));
  }
  res.status(200).json({ 
    status: "success", 
    message: "Banner deleted successfully" 
  });
});

// @desc    Upload banner image
// @route   POST /api/v1/banners/:id/image
// @access  Private/Admin
exports.setBannerImages = asyncHandler(async (req, res, next) => {
  normalizeBannerImages(req);

  if (!req.body.images || req.body.images.length === 0) {
    return next(new ApiError("No image file provided", 400));
  }

  const { id } = req.params;

  const banner = await BannerModel.findByIdAndUpdate(
    id,
    { images: req.body.images },
    { new: true }
  );

  if (!banner) {
    return next(new ApiError(`No banner found with id: ${id}`, 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      banner,
      images: banner.images,
    },
  });
});

exports.uploadBannerImages = uploadBannerImages;
exports.resizeBannerImages = resizeBannerImages;
