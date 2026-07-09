const asyncHandler = require('express-async-handler');
const sharp = require('sharp');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const subCategoryModel = require('../models/subCategoryModel');
const factory = require('./handlersFactory');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');


// upload single subcategory image
const uploadSubCategoryImage = uploadSingleImage('image');

// resize subcategory image
const resizeSubCategoryImage = asyncHandler(async (req, res, next) => {
    if (req.file) {
        const dir = 'uploads/subcategories';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const filename = `subcategory-${uuidv4()}-${Date.now()}.jpeg`;
        await sharp(req.file.buffer)
            // contain (no crop) + white padding so the whole image fits the card
            .resize(800, 800, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`${dir}/${filename}`);
        req.body.image = filename;
    }
    next();
});


const setCategoryIdToBody = (req,res,next) => {
    if(!req.body.category){
        req.body.category = req.params.categoryId;
    }
    next();
};


//@desc create a new sub category
//@route POST /api/v1/subcategories
//@access Private/Admin

const createSubCategory = factory.createOne(subCategoryModel);
//Nested route
//@desc get all sub categories for specific category
//@route GET /api/v1/categories/:categoryId/subcategories

//@desc get all sub categories
//@route GET /api/v1/subcategories
//@access Public

const getSubCategories = factory.getAll(subCategoryModel);

//@desc get sub category by id
//@route GET /api/v1/subcategories/:id
//@access Public

const getSubCategoryById = factory.getOne(subCategoryModel);

// @desc update sub category
// @route PUT/api/v1/subcategories/:id
// @access Private/Admin

const updateSubCategory = factory.updateOne(subCategoryModel);

//@desc delete sub category
//@route DELETE /api/v1/subcategories/:id
//@access Private/Admin

const deleteSubCategory = factory.deleteOne(subCategoryModel);

module.exports = {
    setCategoryIdToBody,
    createSubCategory,
    getSubCategories,
    getSubCategoryById,
    updateSubCategory,
    deleteSubCategory,
    uploadSubCategoryImage,
    resizeSubCategoryImage
}