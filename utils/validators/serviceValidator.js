const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.createServiceValidator = [
    check('title')
        .notEmpty()
        .withMessage('Service title is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Service title must be between 1 and 100 characters'),
    check('titleAr').optional().isLength({ max: 100 }),
    check('description').optional().isLength({ max: 500 }),
    check('descriptionAr').optional().isLength({ max: 500 }),
    check('active').optional().isBoolean().withMessage('Active must be a boolean'),
    validatorMiddleware
];

exports.updateServiceValidator = [
    check('id').isMongoId().withMessage('Invalid service ID'),
    check('title')
        .optional()
        .notEmpty()
        .withMessage('Service title cannot be empty')
        .isLength({ min: 1, max: 100 })
        .withMessage('Service title must be between 1 and 100 characters'),
    check('titleAr').optional().isLength({ max: 100 }),
    check('description').optional().isLength({ max: 500 }),
    check('descriptionAr').optional().isLength({ max: 500 }),
    check('active').optional().isBoolean().withMessage('Active must be a boolean'),
    validatorMiddleware
];

exports.getServiceValidator = [
    check('id').isMongoId().withMessage('Invalid service ID'),
    validatorMiddleware
];

exports.deleteServiceValidator = [
    check('id').isMongoId().withMessage('Invalid service ID'),
    validatorMiddleware
];
