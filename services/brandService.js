const BrandModel = require('../models/brandModel');

const factory = require('./handlersFactory');

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
}
