const asyncHandler = require('express-async-handler');
const UserModel = require('../models/userModel');
const ApiError = require('../utils/apiError');

// @desc    Add product to wishlist
// @route   POST /api/v1/wishlist
// @access  Protected/User
exports.addProductToWishlist = asyncHandler(async (req, res, next) => {
    const user = await UserModel.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { wishlist: req.body.productId } },
        { new: true }
    ).populate({ path: 'wishlist', select: 'title imageCover price priceAfterDiscount ratingsAverage' });

    if (!user) {
        return next(new ApiError('User not found', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Product added to wishlist',
        data: user.wishlist
    });
});

// @desc    Remove product from wishlist
// @route   DELETE /api/v1/wishlist/:productId
// @access  Protected/User
exports.removeProductFromWishlist = asyncHandler(async (req, res, next) => {
    const user = await UserModel.findByIdAndUpdate(
        req.user._id,
        { $pull: { wishlist: req.params.productId } },
        { new: true }
    ).populate({ path: 'wishlist', select: 'title imageCover price priceAfterDiscount ratingsAverage' });

    if (!user) {
        return next(new ApiError('User not found', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Product removed from wishlist',
        data: user.wishlist
    });
});

// @desc    Get logged-in user wishlist
// @route   GET /api/v1/wishlist
// @access  Protected/User
exports.getWishlist = asyncHandler(async (req, res, next) => {
    const user = await UserModel.findById(req.user._id)
        .populate({ path: 'wishlist', select: 'title imageCover price priceAfterDiscount ratingsAverage ratingsQuantity' });

    if (!user) {
        return next(new ApiError('User not found', 404));
    }

    res.status(200).json({
        success: true,
        result: user.wishlist.length,
        data: user.wishlist
    });
});
