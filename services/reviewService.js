const asynchandler = require('express-async-handler');
const Review = require('../models/reviewModel');
const factory = require('./handlersFactory');

const setProductIdAndUserIdToBody = (req, res, next) => {
    if (!req.body.product) {
        req.body.product = req.params.productId;
    }

    if (!req.body.user) {
        req.body.user = req.user._id;
    }

    next();
};

const createFilterObject = (req, res, next) => {
    if (req.params.productId) {
        req.filterObj = { product: req.params.productId };
    }

    next();
};

// @desc Create a new review
// @route POST /api/v1/reviews
// @access Private/Protected/User
const createReview = factory.createOne(Review);

// @desc Get all reviews
// @route GET /api/v1/reviews
// @access Public
const getReviews = factory.getAll(Review);

// @desc get review by id
// @route GET /api/v1/reviews/:id
// @access Public
const getReviewById = factory.getOne(Review);

// @desc update review
// @route PUT/api/v1/reviews/:id
// @access Private/Protected/User
const updateReview = factory.updateOne(Review);

//@desc delete review
//@route DELETE /api/v1/reviews/:id
//@access Private/Protected/Admin-Manager-User
const deleteReview = factory.deleteOne(Review);


module.exports = {
    setProductIdAndUserIdToBody,
    createFilterObject,
    createReview,
    getReviews,
    getReviewById,
    updateReview,
    deleteReview
}