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


router.post('/signup', signupValidator, signup);
router.post('/login', loginValidator, login);
router.post('/logout', protect, logout);
router.post('/forgetPassword', forgetPasswordValidator, forgetPassword);
router.post('/verifyResetCode', verifyResetCodeValidator, verifyResetCode);
router.put('/resetPassword', resetPasswordValidator, resetPassword);

module.exports = router;
