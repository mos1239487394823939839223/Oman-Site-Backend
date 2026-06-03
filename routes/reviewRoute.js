const express = require('express');
const router = express.Router({ mergeParams: true });
const {getReviewById,getReviews,updateReview,createReview,deleteReview, setProductIdAndUserIdToBody, createFilterObject} = require('../services/reviewService');
const {createBrandValidator} = require('../utils/validators/brandValidator');
const authService = require('../services/authService');
const { createReviewValidator , updateReviewValidator, deleteReviewValidator } = require('../utils/validators/reviewValidator');


router.route('/')
.get(createFilterObject, getReviews)
.post(authService.protect, authService.allowedTo(['user']), setProductIdAndUserIdToBody, createReviewValidator ,createReview);

router.route('/:id')
.get(getReviewById)
.put(authService.protect, authService.allowedTo(['user']), updateReviewValidator, updateReview)
.delete(authService.protect, authService.allowedTo(['admin','manager','user']), deleteReviewValidator, deleteReview);

module.exports = router;