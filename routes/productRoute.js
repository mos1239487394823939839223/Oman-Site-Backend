const express = require('express');
const router = express.Router();
const reviewRoute = require('./reviewRoute');

const {
	createProduct,
	getProducts,
	getProductById,
	updateProduct,
	deleteProduct,
	uploadProductImages,
	resizeProductImages
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


router
	.route('/')
	.post(authService.protect, authService.allowedTo(['admin','manager']), uploadProductImages, resizeProductImages, createProductValidator, createProduct)
	.get(getProductsValidator, getProducts);

router
	.route('/:id')
	.get(getProductByIdValidator, getProductById)
	.put(authService.protect, authService.allowedTo(['admin','manager']), uploadProductImages, resizeProductImages, updateProductValidator, updateProduct)
	.delete(authService.protect, authService.allowedTo(['admin']), deleteProductValidator, deleteProduct);

module.exports = router;
