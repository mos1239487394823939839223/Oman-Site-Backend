const asynchandler = require('express-async-handler');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

const ProductModel = require('../models/productModel');
const factory = require('./handlersFactory');
const {uploadMixOfImages} = require('../middlewares/uploadImageMiddleware');
const { SUPPORTED, BASE_CURRENCY } = require('../utils/currencies');

    const uploadProductImages = uploadMixOfImages([
        { name: 'imageCover', maxCount: 1 },
        { name: 'images', maxCount: 5 }
    ]);

// Fit the whole image inside the target box (no cropping) and pad any gap with
// white — JPEG has no transparency, so the padding flattens to a clean white.
const WHITE_BG = { r: 255, g: 255, b: 255, alpha: 1 };
const COVER_FIT = { fit: 'contain', background: WHITE_BG }; // 4:3 to match the product cards
const SQUARE_FIT = { fit: 'contain', background: WHITE_BG };

const resizeProductImages = asynchandler(async (req, res, next) => {
    if (!req.files) {
        return next();
    }

    if (req.files.imageCover) {
        const imageCoverFilename = `product-${uuidv4()}-${Date.now()}-cover.jpeg`;
        await sharp(req.files.imageCover[0].buffer)
            .resize(2000, 1500, COVER_FIT)
            .toFormat('jpeg')
            .jpeg({ quality: 95 })
            .toFile(`uploads/products/${imageCoverFilename}`);
        req.body.imageCover = imageCoverFilename;
    }

    if (req.files.images) {
        req.body.images = [];
        await Promise.all(
            req.files.images.map(async (file, index) => {
                const filename = `product-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;
                await sharp(file.buffer)
                    .resize(1400, 1400, SQUARE_FIT)
                    .toFormat('jpeg')
                    .jpeg({ quality: 95 })
                    .toFile(`uploads/products/${filename}`);
                req.body.images.push(filename);
            })
        );
    }

    next();
});



// Parse the multi-currency `prices` field (sent as a JSON string in the
// multipart form) into an array, and derive the base OMR `price` /
// `priceAfterDiscount` from the OMR entry so the base fields stay authoritative
// (sorting, cart, validators all rely on them). Runs BEFORE the validators.
const parseProductPrices = (req, res, next) => {
    let { prices } = req.body;
    if (prices === undefined) return next();

    if (typeof prices === 'string') {
        try {
            prices = JSON.parse(prices);
        } catch {
            prices = [];
        }
    }

    const clean = (Array.isArray(prices) ? prices : [])
        .filter((p) => p && SUPPORTED.includes(p.currency) && p.amount !== '' && p.amount != null)
        .map((p) => {
            const amount = Number(p.amount);
            let amountAfterDiscount =
                p.amountAfterDiscount === '' || p.amountAfterDiscount == null
                    ? undefined
                    : Number(p.amountAfterDiscount);
            // Drop an invalid (>= amount) or non-positive discount rather than reject.
            if (
                amountAfterDiscount === undefined ||
                Number.isNaN(amountAfterDiscount) ||
                amountAfterDiscount <= 0 ||
                amountAfterDiscount >= amount
            ) {
                amountAfterDiscount = undefined;
            }
            return { currency: p.currency, amount, amountAfterDiscount };
        })
        .filter((p) => !Number.isNaN(p.amount));

    req.body.prices = clean;

    // Mirror the OMR entry into the base fields the rest of the app reads.
    const base = clean.find((p) => p.currency === BASE_CURRENCY);
    if (base) {
        req.body.price = base.amount;
        if (base.amountAfterDiscount !== undefined) {
            req.body.priceAfterDiscount = base.amountAfterDiscount;
        } else {
            // No OMR discount — omit the field so the validator's optional()
            // check skips it (an empty string would fail isFloat).
            delete req.body.priceAfterDiscount;
        }
    }

    next();
};

// @desc Create a new product
// @route POST /api/v1/products
// @access Private/Admin


const createProduct = factory.createOne(ProductModel);

// @desc Get all products
// @route GET /api/v1/products
// @access Public

const getProducts = factory.getAll(ProductModel);
    // Build filter object

    // const queryObj = { ...req.query };
    // const excludedFields = ['page', 'limit', 'sort', 'sortBy', 'order', 'sortPreset', 'fields', 'keyword'];
    // excludedFields.forEach((field) => delete queryObj[field]);

    // let queryString = JSON.stringify(queryObj);
    // queryString = queryString.replace(/\b(gte|gt|lte|lt|in|nin)\b/g, (match) => `$${match}`);

    // const filterObject = JSON.parse(queryString);

    // if (req.query.colors && typeof req.query.colors === 'string') {
    //     filterObject.colors = { $in: req.query.colors.split(',').map((color) => color.trim()) };
    // }

    // if (req.query.subCategories && typeof req.query.subCategories === 'string') {
    //     filterObject.subCategories = {
    //         $in: req.query.subCategories.split(',').map((subCategoryId) => subCategoryId.trim())
    //     };
    // }

    // // Keyword search
    // if (req.query.keyword) {
    //     filterObject.$or = [
    //         { title: { $regex: req.query.keyword, $options: 'i' } },
    //         { description: { $regex: req.query.keyword, $options: 'i' } }
    //     ];
    // }

    // // Pagination
    // const page = Math.max(1, req.query.page * 1 || 1);
    // const limit = Math.max(1, req.query.limit * 1 || 5);
    // const skip = (page - 1) * limit;

    // //build mongoose query

    // let mongooseQuery = ProductModel.find(filterObject)
    //     .skip(skip)
    //     .limit(limit)
    //     .populate([{ path: 'category', select: 'name' }, { path: 'brand', select: 'name' }]);

    // // Sorting presets
    // const sortPresets = {
    //     newest: '-createdAt',
    //     oldest: 'createdAt',
    //     price_asc: 'price',
    //     price_desc: '-price',
    //     rating_desc: '-ratingsAverage',
    //     best_selling: '-sold',
    //     title_asc: 'title',
    //     title_desc: '-title'
    // };
    // // Sorting
    // if (req.query.sort) {
    //     mongooseQuery = mongooseQuery.sort(req.query.sort.split(',').join(' '));
    // } else if (req.query.sortPreset && sortPresets[req.query.sortPreset]) {
    //     mongooseQuery = mongooseQuery.sort(sortPresets[req.query.sortPreset]);
    // } else if (req.query.sortBy) {
    //     const sortOrder = req.query.order === 'asc' ? '' : '-';
    //     mongooseQuery = mongooseQuery.sort(`${sortOrder}${req.query.sortBy}`);
    // } else {
    //     mongooseQuery = mongooseQuery.sort('-createdAt');
    // }

    // // Field selection Limiting
    // if (req.query.fields) {
    //     mongooseQuery = mongooseQuery.select(req.query.fields.split(',').join(' '));
    // } else {
    //     mongooseQuery = mongooseQuery.select('-__v');
    // }

    // const products = await mongooseQuery;
    // const totalDocuments = await ProductModel.countDocuments(filterObject);

    // res.status(200).json({
    //     result: products.length,
    //     totalDocuments,
    //     currentPage: page,
    //     numberOfPages: Math.ceil(totalDocuments / limit),
    //     data: products
    // });
// })

const getProductById = asynchandler(async (req, res, next) => {
    const document = await ProductModel.findById(req.params.id).populate({
        path: 'reviews',
        select: 'title rating user createdAt',
        populate: { path: 'user', select: 'name profileImage' },
    });

    if (!document) {
        const ApiError = require('../utils/apiError');
        return next(new ApiError('Document not found', 404));
    }

    res.status(200).json({
        sucess: true,
        data: document,
    });
});

// @desc update product
// @route PUT/api/v1/products/:id
// @access Private/Admin

const updateProduct = factory.updateOne(ProductModel);

//@desc delete product
//@route DELETE /api/v1/products/:id
//@access Private/Admin

const deleteProduct =factory.deleteOne(ProductModel);


module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    uploadProductImages,
    resizeProductImages,
    parseProductPrices
}