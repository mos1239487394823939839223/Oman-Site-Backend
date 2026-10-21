const express = require('express');
const router = express.Router();

const {
	signup,
	login,
	logout,
	forgetPassword,
	verifyResetCode,
	resetPassword,
	protect,
} = require('../services/authService');

const {
	signupValidator,
	loginValidator,
	forgetPasswordValidator,
	verifyResetCodeValidator,
	resetPasswordValidator,
} = require('../utils/validators/authValidator');


const rateLimit = require('../middlewares/rateLimitMiddleware');

// Slow down password guessing and brute-forcing the 6-digit reset code.
const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	message: 'Too many login attempts. Please try again in a few minutes.',
});
const resetLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	message: 'Too many attempts. Please try again in a few minutes.',
});

router.post('/signup', signupValidator, signup);
router.post('/login', loginLimiter, loginValidator, login);
router.post('/logout', protect, logout);
router.post('/forgetPassword', resetLimiter, forgetPasswordValidator, forgetPassword);
router.post('/verifyResetCode', resetLimiter, verifyResetCodeValidator, verifyResetCode);
router.put('/resetPassword', resetLimiter, resetPasswordValidator, resetPassword);

module.exports = router;
