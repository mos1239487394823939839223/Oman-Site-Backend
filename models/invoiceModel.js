const mongoose = require('mongoose');

// Instructions Thawani returns to redirect the customer to its hosted auth page.
const nextActionSchema = new mongoose.Schema({
    url: { type: String, trim: true },
    return_url: { type: String, trim: true }
}, { _id: false });

// Embedded Thawani Payment Intent (the charge attached to an invoice).
// Monetary amounts are in BAISA (1 OMR = 1000 baisa). `id: false` disables the
// Mongoose virtual so we can keep Thawani's real `id` field.
const paymentIntentSchema = new mongoose.Schema({
    // Thawani payment intent id.
    id: { type: String, trim: true },
    // Merchant-generated reference identifying the session.
    client_reference_id: { type: String, trim: true },
    // Amount intended to be collected, in baisa.
    amount: { type: Number, min: 0, default: 0 },
    currency: { type: String, trim: true, uppercase: true, default: 'OMR' },
    // Id of the payment method used in this charge.
    payment_method: { type: String, trim: true },
    // Redirect instructions for authenticating the payment.
    next_action: nextActionSchema,
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
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    created_at: { type: Date },
    expire_at: { type: Date }
}, { _id: false, id: false });

// A persisted Thawani subscription Invoice.
const invoiceSchema = new mongoose.Schema({
    // Thawani's invoice identifier (the `id` field in Thawani's Invoice object).
    invoice_id: {
        type: String,
        required: [true, 'invoice_id is required'],
        unique: true,
        trim: true
    },
    // Amount due by the customer, in baisa.
    amount_due: {
        type: Number,
        min: 0,
        default: 0
    },
    // Amount paid by the customer, in baisa.
    amount_paid: {
        type: Number,
        min: 0,
        default: 0
    },
    // Number of attempts made to pay this invoice.
    attempt_count: {
        type: Number,
        min: 0,
        default: 0
    },
    // Null normally; set to the next retry time if a recurring payment failed.
    next_payment_attempt: {
        type: Date,
        default: null
    },
    // Time at which Thawani created the invoice.
    created_at: {
        type: Date,
        default: Date.now
    },
    // The payment intent (charge) for this invoice.
    payment_intent: paymentIntentSchema
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
