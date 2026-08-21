const mongoose = require('mongoose');

// A persisted record of a Thawani Checkout Session, mirroring the fields the
// Thawani API returns so orders can be reconciled against the payment that
// created them. Monetary amounts are in BAISA (1 OMR = 1000 baisa).
const checkoutSchema = new mongoose.Schema({
    // Thawani checkout session id. Unique per session; used to build the pay URL
    // (https://checkout.thawani.om/pay/{session_id}?key={publishable_key}).
    session_id: {
        type: String,
        required: [true, 'session_id is required'],
        unique: true,
        trim: true
    },
    // Our own reference we passed to Thawani (e.g. the cart id or order ref).
    client_reference_id: {
        type: String,
        trim: true
    },
    // Thawani customer token/id, if a saved customer was attached.
    customer_id: {
        type: String,
        trim: true
    },
    products: [{
        name: { type: String, trim: true },
        quantity: { type: Number, min: 0, default: 0 },
        // Unit price in baisa (1 OMR = 1000 baisa).
        unit_amount: { type: Number, min: 0, default: 0 }
    }],
    // Order total in baisa (Thawani total_amount).
    total_amount: {
        type: Number,
        min: 0,
        default: 0
    },
    // Thawani settles in Omani Rial only.
    currency: {
        type: String,
        trim: true,
        uppercase: true,
        default: 'OMR'
    },
    success_url: {
        type: String,
        trim: true
    },
    cancel_url: {
        type: String,
        trim: true
    },
    // Thawani session payment status.
    payment_status: {
        type: String,
        enum: ['unpaid', 'paid', 'cancelled'],
        default: 'unpaid'
    },
    // Thawani session mode: payment | subscription.
    mode: {
        type: String,
        trim: true,
        default: 'payment'
    },
    // Thawani invoice reference, when one is generated.
    invoice: {
        type: String,
        trim: true
    },
    // Arbitrary key/value metadata forwarded to/from Thawani.
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    // Thawani timestamps for the session.
    created_at: {
        type: Date,
        default: Date.now
    },
    expire_at: {
        type: Date
    },
    // Thawani subscription object, when mode === 'subscription'.
    subscription: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

module.exports = mongoose.model('Checkout', checkoutSchema);
