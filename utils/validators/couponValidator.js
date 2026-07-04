const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.createCouponValidator = [
    check('name')
        .notEmpty().withMessage('Coupon name is required')
        .isLength({ min: 3, max: 30 }).withMessage('Coupon name must be between 3 and 30 characters'),
    check('expire')
        .notEmpty().withMessage('Expiry date is required')
        .isISO8601().withMessage('Invalid date format (use ISO 8601: YYYY-MM-DD)')
        .custom((value) => {
            if (new Date(value) <= new Date()) {
                throw new Error('Expiry date must be in the future');
            }
            return true;
        }),
    check('discount')
        .notEmpty().withMessage('Discount value is required')
        .isFloat({ min: 1, max: 100 }).withMessage('Discount must be between 1 and 100'),
    check('product')
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId().withMessage('Invalid product ID'),
    check('category')
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId().withMessage('Invalid category ID')
        .custom((value, { req }) => {
            if (value && req.body.product) {
                throw new Error('A coupon cannot be scoped to both a product and a category');
            }
            return true;
        }),
    validatorMiddleware
];

exports.updateCouponValidator = [
    check('id')
        .isMongoId().withMessage('Invalid coupon ID'),
    check('name')
        .optional()
        .isLength({ min: 3, max: 30 }).withMessage('Coupon name must be between 3 and 30 characters'),
    check('expire')
        .optional()
        .isISO8601().withMessage('Invalid date format (use ISO 8601: YYYY-MM-DD)')
        .custom((value) => {
            if (new Date(value) <= new Date()) {
                throw new Error('Expiry date must be in the future');
            }
            return true;
        }),
    check('discount')
        .optional()
        .isFloat({ min: 1, max: 100 }).withMessage('Discount must be between 1 and 100'),
    check('product')
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId().withMessage('Invalid product ID'),
    check('category')
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId().withMessage('Invalid category ID')
        .custom((value, { req }) => {
            if (value && req.body.product) {
                throw new Error('A coupon cannot be scoped to both a product and a category');
            }
            return true;
        }),
    validatorMiddleware
];

exports.getCouponValidator = [
    check('id').isMongoId().withMessage('Invalid coupon ID'),
    validatorMiddleware
];

exports.deleteCouponValidator = [
    check('id').isMongoId().withMessage('Invalid coupon ID'),
    validatorMiddleware
];
