const asyncHandler = require('express-async-handler');
const UserModel = require('../models/userModel');
const ApiError = require('../utils/apiError');

// @desc    Add address to logged user address list
// @route   POST /api/v1/addresses
// @access  Protected/User
exports.addAddress = asyncHandler(async (req, res, next) => {
    const user = await UserModel.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { addresses: req.body } },
        { new: true, runValidators: true }
    );

    if (!user) {
        return next(new ApiError('User not found', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Address added successfully',
        data: user.addresses
    });
});

// @desc    Remove address from logged user address list
// @route   DELETE /api/v1/addresses/:addressId
// @access  Protected/User
exports.removeAddress = asyncHandler(async (req, res, next) => {
    const user = await UserModel.findByIdAndUpdate(
        req.user._id,
        { $pull: { addresses: { _id: req.params.addressId } } },
        { new: true }
    );

    if (!user) {
        return next(new ApiError('User not found', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Address removed successfully',
        data: user.addresses
    });
});

// @desc    Get logged user addresses
// @route   GET /api/v1/addresses
// @access  Protected/User
exports.getAddresses = asyncHandler(async (req, res, next) => {
    const user = await UserModel.findById(req.user._id);

    if (!user) {
        return next(new ApiError('User not found', 404));
    }

    res.status(200).json({
        success: true,
        result: user.addresses.length,
        data: user.addresses
    });
});
