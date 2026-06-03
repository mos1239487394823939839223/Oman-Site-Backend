const express = require('express');
const router = express.Router();

const authService = require('../services/authService');
const {
    getCoupons,
    getCoupon,
    createCoupon,
    updateCoupon,
    deleteCoupon
} = require('../services/couponService');
const {
    createCouponValidator,
    updateCouponValidator,
    getCouponValidator,
    deleteCouponValidator
} = require('../utils/validators/couponValidator');

router.use(authService.protect, authService.allowedTo(['admin', 'manager']));

router
    .route('/')
    .get(getCoupons)
    .post(createCouponValidator, createCoupon);

router
    .route('/:id')
    .get(getCouponValidator, getCoupon)
    .put(updateCouponValidator, updateCoupon)
    .delete(authService.allowedTo(['admin']), deleteCouponValidator, deleteCoupon);

module.exports = router;
