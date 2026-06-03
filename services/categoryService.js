const asynchandler = require('express-async-handler');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const factory = require('./handlersFactory');
const { uploadSingleImage} = require('../middlewares/uploadImageMiddleware');
const CategoryModel = require('../models/categoryModel');


// upload single category image
const uploadCategoryImage = uploadSingleImage('image');

// resize category image
const resizeCategoryImage =asynchandler(async (req,res,next)=>{
    const filename = `category-${uuidv4()}-${Date.now()}.jpeg`;
    if(req.file){
        await sharp(req.file.buffer)
        .resize(600,600)
        .toFormat('jpeg')
        .jpeg({quality:90})
        .toFile(`uploads/categories/${filename}`);
        req.body.image = filename;

    }

    next();
});

// @desc Create a new category
// @route POST /api/v1/categories
// @access Private/Admin


const createCategory = factory.createOne(CategoryModel);

// @desc Get all categories
// @route GET /api/v1/categories
// @access Public

const getCategories = factory.getAll(CategoryModel);


const getCategoryById = factory.getOne(CategoryModel);
// @desc update category
// @route PUT/api/v1/categories/:id
// @access Private/Admin

const updateCategory = factory.updateOne(CategoryModel);

//@desc delete category
//@route DELETE /api/v1/categories/:id
//@access Private/Admin

const deleteCategory = factory.deleteOne(CategoryModel);


module.exports = {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    uploadCategoryImage,
    resizeCategoryImage
}