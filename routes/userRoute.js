const express = require('express');
const router = express.Router();

const {
	createUser,
	getUsers,
	getUserById,
	updateUser,
	deleteUser,
	uploadUserImage,
	resizeUserImage,
	changeUserPassword,
	getLoggedUserData,
	updateLoggedUserPassword,
	updateLoggedUserData,
	deleteMyAccount
} = require('../services/userService');

const {
	createUserValidator,
	updateUserValidator,
	getUserValidator,
	deleteUserValidator,
	changeUserPasswordValidator,
	updateLoggedUserDataValidator
} = require('../utils/validators/userValidator');

const authService = require('../services/authService');


router.route('/getMe').get(authService.protect, getLoggedUserData);
router.route('/updateMyData').put(authService.protect, updateLoggedUserDataValidator, updateLoggedUserData);
router.route('/changeMyPassword').put(authService.protect, updateLoggedUserPassword);
router.route('/deactivateMyAccount').delete(authService.protect, deleteMyAccount);

// Protect all routes after this middleware
router.use(authService.protect, authService.allowedTo(['admin', 'manager']));
router.route('/changePassword/:id').put(changeUserPasswordValidator, changeUserPassword);

router
	.route('/')
	.post(uploadUserImage, resizeUserImage, createUserValidator, createUser)
	.get(getUsers);

router
	.route('/:id')
	.get(getUserValidator, getUserById)
	.put(uploadUserImage, resizeUserImage, updateUserValidator, updateUser)
	.delete(deleteUserValidator, deleteUser);

module.exports = router;
