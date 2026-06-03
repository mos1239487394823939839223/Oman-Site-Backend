const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');

const {
    addProductToWishlist,
    removeProductFromWishlist,
    getWishlist
} = require('../services/wishlistService');

const authService = require('../services/authService');

const addToWishlistValidator = [
    check('productId')
        .notEmpty().withMessage('Product ID is required')
        .isMongoId().withMessage('Invalid product ID'),
    validatorMiddleware
];

const removeFromWishlistValidator = [
    check('productId')
        .isMongoId().withMessage('Invalid product ID'),
    validatorMiddleware
];

router.use(authService.protect, authService.allowedTo(['user', 'admin', 'manager']));

router
    .route('/')
    .get(getWishlist)
    .post(addToWishlistValidator, addProductToWishlist);

router
    .route('/:productId')
    .delete(removeFromWishlistValidator, removeProductFromWishlist);

module.exports = router;
