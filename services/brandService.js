const BrandModel = require('../models/brandModel');
const asynchandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

const factory = require('./handlersFactory');
const { uploadSingleImage} = require('../middlewares/uploadImageMiddleware');


const uploadBrandImage = uploadSingleImage('image');

const resizeBrandImage =asynchandler(async (req,res,next)=>{
    const filename = `brand-${uuidv4()}-${Date.now()}.jpeg`;
    if(req.file){
        await sharp(req.file.buffer)
        .resize(600,600)
        .toFormat('jpeg')
        .jpeg({quality:90})
        .toFile(`uploads/brands/${filename}`);
        req.body.image = filename;

    }

    next();
});
// @desc Create a new brand
// @route POST /api/v1/brands
// @access Private/Admin


const createBrand =factory.createOne(BrandModel);

// @desc Get all brands
// @route GET /api/v1/brands
// @access Public

const getBrands = factory.getAll(BrandModel);

// @desc get brand by id
// @route GET /api/v1/brands/:id
// @access Public

const getBrandById = factory.getOne(BrandModel);

// @desc update brand
// @route PUT/api/v1/brands/:id
// @access Private/Admin

const updateBrand = factory.updateOne(BrandModel);

//@desc delete brand
//@route DELETE /api/v1/brands/:id
//@access Private/Admin

const deleteBrand = factory.deleteOne(BrandModel);


module.exports = {
    createBrand,
    getBrands,
    getBrandById,
    updateBrand,
    deleteBrand,
    uploadBrandImage,
    resizeBrandImage
}