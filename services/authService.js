
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const asynchandler = require('express-async-handler');
const UserModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const apiError = require('../utils/apiError');
const sendEmail = require('../utils/sendEmail');
const generateToken = require('../utils/generateToken');



//@desc User signup
//@route POST /api/v1/auth/signup
//@access Public


exports.signup = asynchandler(async (req, res) => {
    const { name, email, password, phone } = req.body;
    const user = await UserModel.create({ name, email, password, phone });
    const token = generateToken(user._id);
    res.status(201).json({ message: 'User registered successfully', user, token });
});

//@desc User login
//@route POST /api/v1/auth/login
//@access Public
exports.login = asynchandler(async (req, res) => {
    // Check if email and password are provided
    // Check if user exists and password is correct
    // If valid, generate JWT token and send response
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
        throw new apiError('Invalid email or password', 401);
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new apiError('Invalid email or password', 401);
    }
    const token = generateToken(user._id);
    res.json({ message: 'User logged in successfully', user, token });
});

//@desc User logout
//@route POST /api/v1/auth/logout
//@access Private/Protected
exports.logout = asynchandler(async (req, res) => {
    req.user.passwordChangedAt = Date.now();
    await req.user.save({ validateBeforeSave: false });

    res.status(200).json({ message: 'User logged out successfully' });
});


exports.protect = asynchandler(async (req, res, next) => {
    //1)check if token exists
    //2)check if token is valid
    //3)check if user still exists
    //4)check if user changed password after token was issued

    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        throw new apiError('You are not logged in! Please log in to get access.', 401);
    }
    //2)check if token is valid
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw new apiError('Your session has expired. Please log in again.', 401);
        }
        throw new apiError('Invalid token. Please log in again.', 401);
    }
    //3)check if user still exists
    const currentUser = await UserModel.findById(decoded.id);
    if (!currentUser) {
        throw new apiError('The user belonging to this token does no longer exist.', 401);
    }
    //4)check if user changed password after token was issued
    // Assuming you have a method to check if the password was changed after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        throw new apiError('User recently changed password! Please log in again.', 401);
    }
    req.user = currentUser;
    next();
});



//@desc Restrict to specific roles
//@access Private/Admin

exports.allowedTo = (...roles) => {
    const allowedRoles = roles.flat();
    // roles can be passed as allowedTo('admin', 'manager') or allowedTo(['admin', 'manager'])
    // access req.user.role to check if the user's role is in the allowed roles
    return asynchandler(async (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            throw new apiError('You are not allowed to perform this action', 403);
        }
        next();
    });
};


//@desc Reset password
//@route POST /api/v1/auth/forgetPassword
//@access Public


//@desc Forget password - send reset code to email
//@route POST /api/v1/auth/forgetPassword
//@access Public
exports.forgetPassword = asynchandler(async (req, res, next) => {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email) {
        throw new apiError('Email is required.', 400);
    }

    // 1) Get user based on email
    const user = await UserModel.findOne({ email });
    if (!user) {
        throw new apiError('There is no user with that email address.', 404);
    }

    // 2) Generate random 6-digit reset code, hash it, and save with expiry
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetCode = crypto.createHash('sha256').update(resetCode).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.passwordResetVerified = false;
    await user.save({ validateBeforeSave: false });

    // 3) Send reset code via email
    try {
        await sendEmail({
            to: user.email,
            subject: 'Your password reset code (valid for 10 minutes)',
            text: `Hi ${user.name},\n\nYour password reset code is: ${resetCode}\n\nIf you did not request a password reset, please ignore this email.`,
        });
    } catch (err) {
        console.error('Email send error:', err);
        user.passwordResetCode = undefined;
        user.passwordResetExpires = undefined;
        user.passwordResetVerified = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new apiError(`There was an error sending the email. Try again later. ${err.message}`, 500));
    }

    res.status(200).json({ status: 'success', message: 'Reset code sent to email' });
});

//@desc Verify reset code
//@route POST /api/v1/auth/verifyResetCode
//@access Public
exports.verifyResetCode = asynchandler(async (req, res, next) => {
    // 1) Hash the provided reset code and find user with matching code and valid expiry
    // 2) If valid, set passwordResetVerified to true
    // 3) If invalid, return error
    const hashedCode = crypto.createHash('sha256').update(req.body.resetCode).digest('hex');

    const user = await UserModel.findOne({
        passwordResetCode: hashedCode,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
        throw new apiError('Reset code is invalid or has expired.', 400);
    }

    user.passwordResetVerified = true;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ status: 'success', message: 'Reset code verified' });
});

//@desc Reset password
//@route PUT /api/v1/auth/resetPassword
//@access Public
exports.resetPassword = asynchandler(async (req, res, next) => {
    // 1) Get user based on email
    // 2) Check if reset code is verified
    // 3) If verified, update password and clear reset code fields

    const email = (req.body.email || '').trim().toLowerCase();

    const user = await UserModel.findOne({ email });
    if (!user) {
        throw new apiError('There is no user with that email address.', 404);
    }

    if (!user.passwordResetVerified) {
        throw new apiError('Reset code has not been verified.', 400);
    }

    user.password = req.body.newPassword;
    
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.status(200).json({ status: 'success', token });
});