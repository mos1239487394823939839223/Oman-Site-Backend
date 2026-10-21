const express = require('express');
const router = express.Router();
const reviewRoute = require('./reviewRoute');

const {
	createProduct,
	getProducts,
	getProductById,
	updateProduct,
	deleteProduct,
	applySubCategoryDiscount,
	applyProductDiscount,
	uploadProductImages,
	resizeProductImages,
	parseProductPrices
} = require('../services/productService');

const {
	createProductValidator,
	updateProductValidator,
	getProductByIdValidator,
	deleteProductValidator,
	getProductsValidator
} = require('../utils/validators/productValidator');

const authService = require('../services/authService');

router.use('/:productId/reviews', reviewRoute);

// Apply / clear a percentage discount for every product in a subcategory.
router.put(
	'/discount/subcategory/:subCategoryId',
	authService.protect,
	authService.allowedTo(['admin', 'manager']),
	applySubCategoryDiscount
);

// Apply / clear a percentage discount for a single product.
router.put(
	'/:id/discount',
	authService.protect,
	authService.allowedTo(['admin', 'manager']),
	getProductByIdValidator,
	applyProductDiscount
);


router
	.route('/')
	.post(authService.protect, authService.allowedTo(['admin','manager']), uploadProductImages, resizeProductImages, parseProductPrices, createProductValidator, createProduct)
	.get(getProductsValidator, getProducts);

router
	.route('/:id')
	.get(getProductByIdValidator, getProductById)
	.put(authService.protect, authService.allowedTo(['admin','manager']), uploadProductImages, resizeProductImages, parseProductPrices, updateProductValidator, updateProduct)
	.delete(authService.protect, authService.allowedTo(['admin']), deleteProductValidator, deleteProduct);

module.exports = router;
