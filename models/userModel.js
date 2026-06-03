const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'User name is required'],
        trim:true,
        minlength:[3,'Too short user name'],
        maxlength:[100,'Too long user name']
    },
    slug:{
        type:String,
        lowercase:true,    },
    email:{
        type:String,
        required:[true,'User email is required'],
        unique:true,
        lowercase:true,
        trim:true
    },
    password:{
        type:String,
        required:[true,'User password is required'],
        minlength:[6,'Too short user password'],
        maxlength:[128,'Too long user password']
    },
    role:{
        type:String,
        enum:['user','admin','manager'],
        default:'user'
    },
    phone:{
        type:String,
        trim:true,
        minlength:[10,'Too short user phone number'],
        maxlength:[15,'Too long user phone number']
    },
    profileImage:{
        type:String,
        trim:true
    },
    active:{
        type:Boolean,
        default:true
    },
    passwordChangedAt:{
        type:Date
    },
    passwordResetCode:{
        type:String
    },
    passwordResetExpires:{
        type:Date
    },
    passwordResetVerified:{
        type:Boolean
    },
    wishlist:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    addresses:[{
        alias:{
            type:String,
            required:[true,'Address alias is required']
        },
        details:{
            type:String,
            required:[true,'Address details are required']
        },
        phone:{
            type:String,
            trim:true
        },
        city:{
            type:String,
            trim:true
        },
        postalCode:{
            type:String,
            trim:true
        }
    }]
},{
    timestamps:true
});


userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    // Hash the password before saving
    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.pre(/^find/, function () {
    this.where({ active: { $ne: false } });
});

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

const userModel = mongoose.model('User',userSchema);

module.exports = userModel;