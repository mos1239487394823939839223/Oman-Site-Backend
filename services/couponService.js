const CouponModel = require('../models/couponModel');
const factory = require('./handlersFactory');

// @desc    Get all coupons
// @route   GET /api/v1/coupons
// @access  Protected/Admin-Manager
exports.getCoupons = factory.getAll(CouponModel);

// @desc    Get specific coupon
// @route   GET /api/v1/coupons/:id
// @access  Protected/Admin-Manager
exports.getCoupon = factory.getOne(CouponModel);

// @desc    Create coupon
// @route   POST /api/v1/coupons
// @access  Protected/Admin-Manager
exports.createCoupon = factory.createOne(CouponModel);

// @desc    Update coupon
// @route   PUT /api/v1/coupons/:id
// @access  Protected/Admin-Manager
exports.updateCoupon = factory.updateOne(CouponModel);

// @desc    Delete coupon
// @route   DELETE /api/v1/coupons/:id
// @access  Protected/Admin
exports.deleteCoupon = factory.deleteOne(CouponModel);
