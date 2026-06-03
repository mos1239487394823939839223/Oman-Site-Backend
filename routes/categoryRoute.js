const express = require('express');
const router = express.Router();
const {createCategory , getCategories , getCategoryById , updateCategory, deleteCategory,uploadCategoryImage, resizeCategoryImage} = require('../services/categoryService');
const {createCategoryValidator , updateCategoryValidator , getCategoryValidator , deleteCategoryValidator} = require('../utils/validators/categoryValidator');
const subCategoryRoute = require('../routes/subCategoryRoute');
const authService = require('../services/authService');


router.use('/:categoryId/subcategories', subCategoryRoute);
router.route('/').get(getCategories).post(authService.protect,authService.allowedTo(['admin','manager']),uploadCategoryImage,resizeCategoryImage,createCategoryValidator, createCategory);
router.route('/:id').get(getCategoryValidator,getCategoryById).put(authService.protect,authService.allowedTo(['admin','manager']),uploadCategoryImage,resizeCategoryImage,updateCategoryValidator, updateCategory).delete(authService.protect,authService.allowedTo(['admin']),deleteCategoryValidator,deleteCategory);

module.exports = router;