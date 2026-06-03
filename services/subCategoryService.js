const subCategoryModel = require('../models/subCategoryModel');
const factory = require('./handlersFactory');


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
    deleteSubCategory
}