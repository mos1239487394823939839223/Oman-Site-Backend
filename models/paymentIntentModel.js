const mongoose = require('mongoose');

// Instructions Thawani returns to redirect the customer to its hosted auth page.
const nextActionSchema = new mongoose.Schema({
    // URL to redirect the customer to, to authenticate the payment.
    url: { type: String, trim: true },
    // URL the customer is returned to after authenticating.
    return_url: { type: String, trim: true }
}, { _id: false });

// A persisted Thawani Payment Intent (a charge). Monetary amounts are in BAISA
// (1 OMR = 1000 baisa).
const paymentIntentSchema = new mongoose.Schema({
    // Thawani's payment intent identifier (the `id` field in Thawani's object).
    payment_intent_id: {
        type: String,
        required: [true, 'payment_intent_id is required'],
        unique: true,
        trim: true
    },
    // Merchant-generated reference identifying the session.
    client_reference_id: {
        type: String,
        trim: true
    },
    // Amount intended to be collected, in baisa.
    amount: {
        type: Number,
        min: 0,
        default: 0
    },
    // Thawani settles in Omani Rial by default.
    currency: {
        type: String,
        trim: true,
        uppercase: true,
        default: 'OMR'
    },
    // Id of the payment method used in this charge.
    payment_method: {
        type: String,
        trim: true
    },
    // Redirect instructions for authenticating the payment.
    next_action: nextActionSchema,
    // Status of this payment intent.
    status: {
        type: String,
        enum: [
            'requires_payment_method',
            'requires_action',
            'requires_confirmation',
            'succeeded',
            'cancelled'
        ],
        default: 'requires_payment_method'
    },
    // Arbitrary key/value metadata forwarded to/from Thawani.
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    // Time at which Thawani created the payment intent.
    created_at: {
        type: Date,
        default: Date.now
    },
    // Time at which the payment intent expires.
    expire_at: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('PaymentIntent', paymentIntentSchema);
