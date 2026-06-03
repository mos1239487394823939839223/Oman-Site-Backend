const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');

const {
    addAddress,
    removeAddress,
    getAddresses
} = require('../services/addressService');

const authService = require('../services/authService');

const addAddressValidator = [
    check('alias')
        .notEmpty().withMessage('Address alias is required'),
    check('details')
        .notEmpty().withMessage('Address details are required'),
    check('phone')
        .optional()
        .isMobilePhone().withMessage('Invalid phone number'),
    check('postalCode')
        .optional()
        .isPostalCode('any').withMessage('Invalid postal code'),
    validatorMiddleware
];

const removeAddressValidator = [
    check('addressId')
        .isMongoId().withMessage('Invalid address ID'),
    validatorMiddleware
];

router.use(authService.protect, authService.allowedTo(['user', 'admin', 'manager']));

router
    .route('/')
    .get(getAddresses)
    .post(addAddressValidator, addAddress);

router
    .route('/:addressId')
    .delete(removeAddressValidator, removeAddress);

module.exports = router;
