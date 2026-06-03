const {check, body} = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const ReviewModel = require('../../models/reviewModel');

const validateReviewOwnership = async (reviewId, userId, message) => {
    const review = await ReviewModel.findById(reviewId);

    if (!review) {
        throw new Error('Review not found');
    }

    const reviewUserId = review.user._id ? review.user._id.toString() : review.user.toString();

    if (reviewUserId !== userId.toString()) {
        throw new Error(message);
    }

    return true;
};

exports.createReviewValidator = [
    check('title').optional(),
    check('rating')
    .notEmpty()
    .withMessage('Review rating is required')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Review rating must be a number between 1 and 5'),
    check('user')
    .isMongoId()
    .withMessage('Invalid user ID'),
    check('product')
    .isMongoId()
    .withMessage('Invalid product ID').custom((value, { req }) => {
        return ReviewModel.findOne({ user: req.body.user, product: req.body.product }).then((review) => {
            if (review) {
                return Promise.reject('You have already reviewed this product');
            }
        }); 
    }),

    validatorMiddleware
];

exports.updateReviewValidator = [
    check('id')
        .isMongoId()
        .withMessage('Invalid review ID')
        .custom((value, { req }) => validateReviewOwnership(value, req.user._id, 'You are not allowed to update this review')),
    validatorMiddleware
]; 

exports.getReviewValidator = [
    check('id')
        .isMongoId()
        .withMessage('Invalid review ID'),
    validatorMiddleware
];

exports.deleteReviewValidator = [
    check('id')
        .isMongoId()
        .withMessage('Invalid review ID')
        .custom((value, { req }) => {
            if (['admin', 'manager'].includes(req.user.role)) {
                return true;
            }

            return validateReviewOwnership(value, req.user._id, 'You are not allowed to delete this review');
        }),
    validatorMiddleware
];