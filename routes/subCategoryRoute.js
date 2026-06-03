const express = require('express');
const {setCategoryIdToBody,getSubCategories,createSubCategory , subCategories , getSubCategoryById , updateSubCategory, deleteSubCategory} = require('../services/subCategoryService');
const {createSubCategoryValidator , updateSubCategoryValidator , getSubCategoryValidator,deleteSubCategoryValidator} = require('../utils/validators/subCategoryValidator');
const authService = require('../services/authService');

//mergeParams:true to access categoryId from categoryRoute

const router = express.Router({mergeParams:true});

router.route('/').post(authService.protect, authService.allowedTo(['admin','manager']), setCategoryIdToBody,createSubCategoryValidator, createSubCategory).get(getSubCategories);
router.route('/:id').get(getSubCategoryValidator, getSubCategoryById).put(authService.protect, authService.allowedTo(['admin','manager']), updateSubCategoryValidator, updateSubCategory).delete(authService.protect, authService.allowedTo(['admin']), deleteSubCategoryValidator, deleteSubCategory);

module.exports = router;