const {check, body} = require('express-validator');
const slugify = require('slugify');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const UserModel = require('../../models/userModel');

exports.signupValidator = [
    
    check('name')
        .notEmpty()
        .withMessage('User name is required')
        .isLength({ min: 3 , max: 50 })
        .withMessage('User name must be between 3 and 50 characters long')
        .custom((value, { req }) => {
        req.body.slug = slugify(value);
        return true;
    }),
    check('email').notEmpty().withMessage('User email is required').isEmail().withMessage('Invalid email address').custom(async (value)=>{
        const user = await UserModel.findOne({email:value});
        if(user){
            throw new Error('Email already in use');
        }
        return true;
    }),
    
    check('password')
    .notEmpty()
    .withMessage('User password is required')
    .isLength({ min: 6 , max: 128 })
    .withMessage('User password must be between 6 and 128 characters long')
    .custom((value,{req})=>{
        if(value !== req.body.passwordConfirm){
            throw new Error('Password confirmation does not match password');
        }
        return true;
    }).custom((value,{req})=>{
        if(value.toLowerCase().includes('password')){
            throw new Error('Password should not contain the word "password"');
        }
        return true;
    }),


    check('passwordConfirm')
    .notEmpty()
    .withMessage('Password confirmation is required'),
    
    validatorMiddleware
]; 

exports.loginValidator = [
    check('email')
    .notEmpty()
    .withMessage('User email is required')
    .isEmail()
    .withMessage('Invalid email address'),
    
    check('password')
    .notEmpty()
    .withMessage('User password is required'),
    
    validatorMiddleware
];

exports.forgetPasswordValidator = [
    check('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email address'),
    validatorMiddleware,
];

exports.verifyResetCodeValidator = [
    check('resetCode')
        .notEmpty().withMessage('Reset code is required')
        .isLength({ min: 6, max: 6 }).withMessage('Reset code must be 6 digits')
        .isNumeric().withMessage('Reset code must contain only digits'),
    validatorMiddleware,
];

exports.resetPasswordValidator = [
    check('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email address'),
    check('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 6, max: 128 }).withMessage('Password must be between 6 and 128 characters')
        .custom((value) => {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password should not contain the word "password"');
            }
            return true;
        }),
    check('newPasswordConfirm')
        .notEmpty().withMessage('Password confirmation is required')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Password confirmation does not match');
            }
            return true;
        }),
    validatorMiddleware,
];
