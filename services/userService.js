const UserModel = require('../models/userModel');
const asynchandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

const factory = require('./handlersFactory');
const { uploadSingleImage} = require('../middlewares/uploadImageMiddleware');
const ApiError = require('../utils/apiError');
const bcrypt = require('bcryptjs');

const uploadUserImage = uploadSingleImage('profileImage');
const generateToken = require('../utils/generateToken');

const resizeUserImage =asynchandler(async (req,res,next)=>{
    const filename = `user-${uuidv4()}-${Date.now()}.jpeg`;
    if(req.file){
        await sharp(req.file.buffer)
        .resize(600,600)
        .toFormat('jpeg')
        .jpeg({quality:90})
        .toFile(`uploads/users/${filename}`);
        req.body.profileImage = filename;

    }
    next();
});

const buildUserUpdateData = (body) => {
    const updateData = {};
    ['name', 'email', 'phone', 'profileImage', 'slug'].forEach((field) => {
        if (body[field] !== undefined) {
            updateData[field] = body[field];
        }
    });

    return updateData;
};

// @desc Create a new user
// @route POST /api/v1/users
// @access Private/Admin


const createUser =factory.createOne(UserModel);

// @desc Get all users
// @route GET /api/v1/users
// @access Private/Admin

const getUsers = factory.getAll(UserModel);

// @desc get user by id
// @route GET /api/v1/users/:id
// @access Private/Admin

const getUserById = factory.getOne(UserModel);

// @desc update user
// @route PUT/api/v1/users/:id
// @access Private/Admin

const updateUser = asynchandler(async (req,res,next)=>{
    const id = req.params.id;
    const updateData = buildUserUpdateData(req.body);
    // This handler is restricted to admin/manager (see userRoute), so allow
    // changing the role here. It is intentionally NOT part of the shared
    // buildUserUpdateData helper, which also serves updateMyData — otherwise a
    // regular user could escalate their own role.
    if (req.body.role !== undefined) {
        updateData.role = req.body.role;
    }
    const document = await UserModel.findByIdAndUpdate(
        id,
        updateData,
        {new:true, runValidators:true}
    );
    if(!document){
        return next(new ApiError('User not found', 404));
    }
    res.status(200).json({
        sucess:true,
        data:document
    });
});
// desc change user password
// route PUT /api/v1/users/:id/changePassword
// access Private/Admin


const changeUserPassword = asynchandler(async(req,res,next)=>{
    const id = req.params.id;
    const document = await UserModel.findByIdAndUpdate(id, {password:bcrypt.hashSync(req.body.password, 10), passwordChangedAt: Date.now()}, {new:true});
    if(!document){
        return next(new ApiError('User not found', 404));
    }
    res.status(200).json({
        sucess:true,
        data:document
    });
})

//@desc delete user
//@route DELETE /api/v1/users/:id
//@access Private/Admin

const deleteUser = factory.inactiveOne(UserModel);

// @desc get logged in user data
// @route GET /api/v1/users/getMe
// @access Private/Protected

const getLoggedUserData = asynchandler(async(req,res,next)=>{
    const user = await UserModel.findById(req.user._id);
    res.status(200).json({ data: user });
});


// @desc change my password
// @route PUT /api/v1/users/changeMyPassword
// @access Private/Protected

const updateLoggedUserPassword = asynchandler(async(req,res,next)=>{
    //1) get user from collection
    //2) check if posted current password is correct
    //3) if so, update password
    //4) log user in, send JWT

    if(!req.body.currentPassword || !req.body.newPassword){
        return next(new ApiError('currentPassword and newPassword are required', 400));
    }

    const user = await UserModel.findById(req.user._id);

    if(!user){
        return next(new ApiError('User not found', 404));
    }
    const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
    if(!isMatch){
        return next(new ApiError('Current password is incorrect', 400));
    }
    user.password = bcrypt.hashSync(req.body.newPassword, 10);
    user.passwordChangedAt = Date.now();
    await user.save();
    const token = generateToken(user._id);
    res.status(200).json({ message: 'Password changed successfully', token });

});

// @desc update logged in user data
// @route PUT /api/v1/users/updateMyData
// @access Private/Protected

const updateLoggedUserData = asynchandler(async(req,res,next)=>{
    //1) get user from collection
    //2) update user data (name, email, phone, profileImage)
    //3) send response
    const updateData = buildUserUpdateData(req.body);
    const user = await UserModel.findByIdAndUpdate(req.user._id, updateData, {new:true});
    if(!user){
        return next(new ApiError('User not found', 404));
    }
    res.status(200).json({
        sucess:true,
        data:user
    });
});
// @desc deactivate logged in user account
// @route DELETE /api/v1/users/deleteMyAccount
// @access Private/Protected
const deleteMyAccount = asynchandler(async(req,res,next)=>{
    const user = await UserModel.findByIdAndUpdate(req.user._id, {active:false}, {new:true});
    if(!user){
        return next(new ApiError('User not found', 404));
    }
    res.status(204).json({
        sucess:true,
        data:null
    });
});
module.exports = {
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
}