const mongoose = require('mongoose');

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
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
