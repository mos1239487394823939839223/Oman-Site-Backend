const {check, body} = require('express-validator');
const slugify = require('slugify');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.createCategoryValidator = [
    check('name')
        .notEmpty()
        .withMessage('Category name is required')
        .isLength({ min: 3 , max: 50 })
        .withMessage('Category name must be between 3 and 50 characters long'),
        body('name').custom((value, { req }) => {
        req.body.slug = slugify(value);
        return true;
    }),
    validatorMiddleware
];

exports.updateCategoryValidator = [
    check('name')
        .optional()
        .notEmpty()
        .withMessage('Category name cannot be empty')
        .isLength({ min: 3 , max: 50 })
        .withMessage('Category name must be between 3 and 50 characters long'),
    body('name').custom((value, { req }) => {
        req.body.slug = slugify(value);
        return true;
    }),
    validatorMiddleware
]; 

exports.getCategoryValidator = [
    check('id')
        .isMongoId()
        .withMessage('Invalid category ID'),
    validatorMiddleware
];

exports.deleteCategoryValidator = [
    check('id')
        .isMongoId()
        .withMessage('Invalid category ID'),
    validatorMiddleware
];