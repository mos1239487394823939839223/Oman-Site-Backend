const {check, body} = require('express-validator');
const slugify = require('slugify');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const UserModel = require('../../models/userModel');
const bcrypt = require('bcryptjs');

exports.createUserValidator = [
    check('name')
        .notEmpty()
        .withMessage('User name is required')
        .isLength({ min: 3 , max: 50 })
        .withMessage('User name must be between 3 and 50 characters long')
        .custom((value, { req }) => {
        req.body.slug = slugify(value);
        return true;
    }),


    check('email')
        .notEmpty()
        .withMessage('User email is required')
        .isEmail()
        .withMessage('Invalid email address')
        .custom(async (value) => {
            const user = await UserModel.findOne({ email: value });
            if (user) {
                throw new Error('Email already in use');
            }
            return true;
        }),

    // passwordConfirm is optional; when provided it must match the password.
    check('passwordConfirm').optional(),

    check('password')
    .notEmpty()
    .withMessage('User password is required')
    .isLength({ min: 6 , max: 128 })
    .withMessage('User password must be between 6 and 128 characters long')
    .custom((value,{req})=>{
        if(req.body.passwordConfirm !== undefined && value !== req.body.passwordConfirm){
            throw new Error('Password confirmation does not match password');
        }
        return true;
    }).custom((value,{req})=>{
        if(value.toLowerCase().includes('password')){
            throw new Error('Password should not contain the word "password"');
        }
        return true;
    }),
    check('role')
        .optional()
        .isIn(['user', 'admin', 'manager'])
        .withMessage('Role must be one of: user, manager, admin'),
    check('profileImage').optional(),
    check('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Invalid phone number'),
    validatorMiddleware
];

exports.updateUserValidator = [
    check('name')
        .optional()
        .notEmpty()
        .withMessage('User name cannot be empty')
        .isLength({ min: 3 , max: 50 })
        .withMessage('User name must be between 3 and 50 characters long').custom((value, { req }) => {
        req.body.slug = slugify(value);
        return true;
    }),
    check('email').optional().notEmpty().withMessage('User email cannot be empty').isEmail().withMessage('Invalid email address').custom(async (value, { req })=>{
        const user = await UserModel.findOne({email:value});
        if(user && user._id.toString() !== req.params.id){
            throw new Error('Email already in use');
        }
        return true;
    }),
    check('role')
        .optional()
        .isIn(['user', 'admin', 'manager'])
        .withMessage('Role must be one of: user, manager, admin'),
        check('profileImage').optional(),
    check('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Invalid phone number'),

    validatorMiddleware
];

exports.getUserValidator = [
    check('id')
        .isMongoId()
        .withMessage('Invalid user ID'),
    validatorMiddleware
];

exports.deleteUserValidator = [
    check('id')
        .isMongoId()
        .withMessage('Invalid user ID'),
    validatorMiddleware
];

exports.deleteUserValidator = [
    check('id')
        .isMongoId()
        .withMessage('Invalid user ID'),
    validatorMiddleware
];

exports.changeUserPasswordValidator = [
    
    check('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
    
    check('passwordConfirm')
    .notEmpty()
    .withMessage('Password confirmation is required'),

    check('password')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 , max: 128 })
    .withMessage('New password must be between 6 and 128 characters long')
    .custom((value,{req})=>{
        if(value !== req.body.passwordConfirm){
            throw new Error('Password confirmation does not match new password');
        }
        if(value.toLowerCase().includes('password')){
            throw new Error('New password should not contain the word "password"');
        }

        return true;
    })
    .custom(async(value,{req})=>{
        const user = await UserModel.findById(req.params.id);
        if(!user){
            throw new Error('User not found');
        }
        const isMatch = await bcrypt.compare(value, user.password);
        if(isMatch){
            throw new Error('New password must be different from current password');
        }
        return true;
    })
    ,
    validatorMiddleware
]

exports.updateLoggedUserDataValidator = [
    check('name')
        .optional()
        .notEmpty()
        .withMessage('User name cannot be empty')
        .isLength({ min: 3 , max: 50 })
        .withMessage('User name must be between 3 and 50 characters long').custom((value, { req }) => {
        req.body.slug = slugify(value);
        return true;
    }),
    check('email').optional().notEmpty().withMessage('User email cannot be empty').isEmail().withMessage('Invalid email address').custom(async (value,{req})=>{
        const user = await UserModel.findOne({email:value});
        if(user && user._id.toString() !== req.user._id.toString()){
            throw new Error('Email already in use');
        }
        return true;
    }),
        check('profileImage').optional(),
    check('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Invalid phone number'),

    validatorMiddleware
];