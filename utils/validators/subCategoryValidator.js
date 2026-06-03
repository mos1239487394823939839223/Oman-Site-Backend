const {check, body} = require('express-validator');
const slugify = require('slugify');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.createSubCategoryValidator = [
    check('name')
        .notEmpty()
        .withMessage('SubCategory name is required')
        .isLength({ min: 3 , max: 50 })
        .withMessage('SubCategory name must be between 3 and 50 characters long'),
    check('category')
        .notEmpty()
        .withMessage('Category ID is required')
        .isMongoId()
        .withMessage('Invalid category ID'),
        body('name').custom((value, { req }) => {
        req.body.slug = slugify(value);
        return true;
    }),
    validatorMiddleware
];

exports.updateSubCategoryValidator = [
    check('name')
        .optional()
        .notEmpty()
        .withMessage('SubCategory name cannot be empty')
        .isLength({ min: 3 , max: 50 })
        .withMessage('SubCategory name must be between 3 and 50 characters long'),
    check('category')
        .optional()
        .notEmpty()
        .withMessage('Category ID cannot be empty')
        .isMongoId()
        .withMessage('Invalid category ID'),
    body('name').custom((value, { req }) => {
        if (value) {
            req.body.slug = slugify(value);
        }
        return true;
    }),
    validatorMiddleware
];

exports.getSubCategoryValidator = [
    check('id')
        .isMongoId()
        .withMessage('Invalid subcategory ID'),
    validatorMiddleware
];

exports.deleteSubCategoryValidator = [
    check('id')
        .isMongoId()
        .withMessage('Invalid subcategory ID'),
    validatorMiddleware
];
