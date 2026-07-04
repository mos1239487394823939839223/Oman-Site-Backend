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
    },
    // Optional scope. At most one may be set; both null = cart-wide coupon.
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        default: null
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    }
}, { timestamps: true });

// Treat empty strings from the client as "no scope" (cart-wide coupon).
couponSchema.pre('validate', function () {
    if (!this.product) this.product = undefined;
    if (!this.category) this.category = undefined;
});

// Enforce mutual exclusion of scope fields at the model level.
couponSchema.pre('save', function () {
    if (this.product && this.category) {
        throw new Error('A coupon cannot be scoped to both a product and a category');
    }
});

module.exports = mongoose.model('Coupon', couponSchema);
