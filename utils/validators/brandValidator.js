const {check, body} = require('express-validator');
const slugify = require('slugify');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.createBrandValidator = [
    check('name')
        .notEmpty()
        .withMessage('Brand name is required')
        .isLength({ min: 3 , max: 50 })
        .withMessage('Brand name must be between 3 and 50 characters long'),
        body('name').custom((value, { req }) => {
        req.body.slug = slugify(value);
        return true;
    }),
    validatorMiddleware
];

exports.updateBrandValidator = [
    check('name')
        .optional()
        .notEmpty()
        .withMessage('Brand name cannot be empty')
        .isLength({ min: 3 , max: 50 })
        .withMessage('Brand name must be between 3 and 50 characters long')
        ,
    body('name').custom((value, { req }) => {
        req.body.slug = slugify(value);
        return true;
    }),
    validatorMiddleware
]; 

exports.getBrandValidator = [
    check('id')
        .isMongoId()
        .withMessage('Invalid brand ID'),
    validatorMiddleware
];

exports.deleteBrandValidator = [
    check('id')
        .isMongoId()
        .withMessage('Invalid brand ID'),
    validatorMiddleware
];