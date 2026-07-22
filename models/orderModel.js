const mongoose = require('mongoose');
const { ORDER_STATUS_VALUES } = require('../utils/orderStatuses');
const { SUPPORTED, BASE_CURRENCY } = require('../utils/currencies');

const orderSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true,'The Order must belong to a user']
    },
    cartItems:[
        {
            product:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            },
            gift:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Gift'
            },
            name: {type: String},
            quantity: {type: Number},
            image: {type: String},
            price: {type: Number},
        }
    ],

    shippingAddress:{
        address:{type: String},
        phone:{type: String},
        city:{type: String},
        postalCode:{type: String},
        country:{type: String}
    },
  
    taxPrice:{
        type: Number,
        default: 0.0
    },
    shippingPrice:{
        type: Number,
        default: 0.0
    },
    totalOrderPrice:{
        type: Number,
        default: 0.0
    },
    // Currency all monetary fields on this order are expressed in.
    currency:{
        type: String,
        enum: SUPPORTED,
        default: BASE_CURRENCY
    },
      paymentMethod:{
        type: String,
        enum: ['card','cash'],
        default: 'cash',
    },
    isPaid:{
        type: Boolean,
        default: false
    },
    isPaidAt:{
        type: Date
    },
    isDelivered:{
        type: Boolean,
        default: false
    },
    isDeliveredAt:{
        type: Date
    },
    status: {
        type: String,
        enum: ORDER_STATUS_VALUES,
        default: 'pending'
    },
    statusUpdatedAt: {
        type: Date
    }

},{timestamps: true});

orderSchema.pre(/^find/, function(){
    this.populate({
        path: 'user',
        select: 'name email'
    }).populate({
        path: 'cartItems.product',
        select: 'title imageCover'
    }).populate({
        path: 'cartItems.gift',
        select: 'title imageCover price'
    });
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;