const express = require('express');
const router = express.Router();

const authService = require('../services/authService');
const {
    addProductToCart,
    getLoggedUserCart,
    removeSpecificCartItem,
    clearCart,
    updateCartItemQuantity,
    applyCoupon
} = require('../services/cartService');
const {
    addToCartValidator,
    removeCartItemValidator,
    updateCartItemValidator,
    applyCouponValidator
} = require('../utils/validators/cartValidator');

router.use(authService.protect, authService.allowedTo(['user', 'admin', 'manager']));

router
    .route('/')
    .get(getLoggedUserCart)
    .post(addToCartValidator, addProductToCart)
    .delete(clearCart);

// applyCoupon must be defined before /:itemId to avoid route conflict
router.put('/applyCoupon', applyCouponValidator, applyCoupon);

router
    .route('/:itemId')
    .put(updateCartItemValidator, updateCartItemQuantity)
    .delete(removeCartItemValidator, removeSpecificCartItem);

module.exports = router;
