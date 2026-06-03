const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, 'Coupon name is required'],
        unique: true,
        uppercase: true
    },
    expire: {
        type: Date,
        required: [true, 'Coupon expiry date is required']
    },
    discount: {
        type: Number,
        required: [true, 'Coupon discount value is required'],
        min: [1, 'Discount must be at least 1%'],
        max: [100, 'Discount cannot exceed 100%']
    }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
