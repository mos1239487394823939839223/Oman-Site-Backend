const mongoose = require('mongoose');
const { SUPPORTED, BASE_CURRENCY } = require('../utils/currencies');

const cartSchema = new mongoose.Schema({
    cartItems: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
        },
        gift: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Gift',
        },
        quantity: {
            type: Number,
            default: 1
        },
        color: {
            type: String,
            trim: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
    totalCartPrice: {
        type: Number,
        default: 0
    },
    totalPriceAfterDiscount: {
        type: Number
    },
    // The coupon currently applied to this cart (if any). Recorded on apply so
    // that placing the order can redeem it (increment usage / mark the user).
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null
    },
    // The single currency this whole cart is priced in. Item `price` snapshots
    // are stored in this currency; switching it re-resolves every line.
    currency: {
        type: String,
        enum: SUPPORTED,
        default: BASE_CURRENCY
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
