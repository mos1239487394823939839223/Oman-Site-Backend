const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.addToCartValidator = [
    check('productId')
        .optional()
        .isMongoId().withMessage('Invalid product ID'),
    check('giftId')
        .optional()
        .isMongoId().withMessage('Invalid gift ID'),
    check('color')
        .optional()
        .isString().withMessage('Color must be a string'),
    check('productId').custom((value, { req }) => {
        const hasProduct = Boolean(value);
        const hasGift = Boolean(req.body.giftId);
        if (!hasProduct && !hasGift) {
            throw new Error('Product ID or gift ID is required');
        }
        if (hasProduct && hasGift) {
            throw new Error('Provide either productId or giftId, not both');
        }
        return true;
    }),
    validatorMiddleware
];

exports.removeCartItemValidator = [
    check('itemId')
        .isMongoId().withMessage('Invalid cart item ID'),
    validatorMiddleware
];

exports.updateCartItemValidator = [
    check('itemId')
        .isMongoId().withMessage('Invalid cart item ID'),
    check('quantity')
        .notEmpty().withMessage('Quantity is required')
        .isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    validatorMiddleware
];

exports.applyCouponValidator = [
    check('coupon')
        .notEmpty().withMessage('Coupon code is required')
        .isString().withMessage('Coupon code must be a string'),
    validatorMiddleware
];
