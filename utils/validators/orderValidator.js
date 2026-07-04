const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const { ORDER_STATUS_VALUES } = require('../orderStatuses');

exports.updateOrderStatusValidator = [
    check('id').isMongoId().withMessage('Invalid order ID'),
    check('status')
        .notEmpty().withMessage('Order status is required')
        .isIn(ORDER_STATUS_VALUES)
        .withMessage(`Status must be one of: ${ORDER_STATUS_VALUES.join(', ')}`),
    validatorMiddleware
];
