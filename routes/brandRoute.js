const express = require('express');
const router = express.Router();
const {createBrand , getBrands , getBrandById , updateBrand, deleteBrand} = require('../services/brandService');
const {createBrandValidator , updateBrandValidator , getBrandValidator , deleteBrandValidator} = require('../utils/validators/brandValidator');
const authService = require('../services/authService');


router.route('/').post(authService.protect, authService.allowedTo(['admin','manager']), createBrandValidator, createBrand).get(getBrands);
router.route('/:id').get(getBrandValidator, getBrandById).put(authService.protect, authService.allowedTo(['admin','manager']), updateBrandValidator, updateBrand).delete(authService.protect, authService.allowedTo(['admin']), deleteBrandValidator, deleteBrand);

module.exports = router;
