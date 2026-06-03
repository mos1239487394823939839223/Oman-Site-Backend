const express = require('express');
const router = express.Router();
const {createBrand , getBrands , getBrandById , updateBrand, deleteBrand,uploadBrandImage,resizeBrandImage} = require('../services/brandService');
const {createBrandValidator , updateBrandValidator , getBrandValidator , deleteBrandValidator} = require('../utils/validators/brandValidator');
const authService = require('../services/authService');


router.route('/').post(authService.protect, authService.allowedTo(['admin','manager']), uploadBrandImage, resizeBrandImage,createBrandValidator, createBrand).get(getBrands);
router.route('/:id').get(getBrandValidator, getBrandById).put(authService.protect, authService.allowedTo(['admin','manager']), resizeBrandImage,updateBrandValidator, updateBrand).delete(authService.protect, authService.allowedTo(['admin']), deleteBrandValidator, deleteBrand);

module.exports = router;