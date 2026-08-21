const mongoose = require('mongoose');

// A persisted mapping between our users and their Thawani customer record, so a
// returning shopper reuses the same Thawani customer (saved cards, etc.) instead
// of creating a new one each checkout.
const customerSchema = new mongoose.Schema({
    // Thawani's customer identifier (the `id` field in Thawani's Customer object).
    // Used when creating checkout sessions / payment intents for this customer.
    customer_id: {
        type: String,
        required: [true, 'customer_id is required'],
        unique: true,
        trim: true
    },
    // Our own unique reference sent to Thawani as `customer_client_id`
    // (e.g. the user's _id or email) to tie the Thawani customer to our system.
    customer_client_id: {
        type: String,
        required: [true, 'customer_client_id is required'],
        unique: true,
        trim: true
    },
    // Convenience link to the local user this Thawani customer belongs to.
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
