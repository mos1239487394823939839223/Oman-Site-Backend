const mongoose = require('mongoose');

// A single refund against a payment. Amounts are in BAISA (1 OMR = 1000 baisa).
const refundSchema = new mongoose.Schema({
    // Amount refunded, in baisa.
    amount: { type: Number, min: 0, default: 0 },
    // Thawani refund identifier.
    refund_id: { type: String, trim: true },
    // Id of the payment that was refunded.
    payment_id: { type: String, trim: true },
    // Status of this refund.
    status: { type: String, enum: ['successful', 'failed'] },
    // Reason for the refund.
    reason: { type: String, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    created_at: { type: Date }
}, { _id: false });

// A persisted Thawani Payment (a paid charge). Amounts are in BAISA.
const paymentSchema = new mongoose.Schema({
    // Merchant/business activity name.
    activity: {
        type: String,
        trim: true
    },
    // Thawani's payment identifier — used to identify the paid charge.
    payment_id: {
        type: String,
        required: [true, 'payment_id is required'],
        unique: true,
        trim: true
    },
    // Masked card, only the last four digits are shown.
    masked_card: {
        type: String,
        trim: true
    },
    // Identifies whether the card is debit or credit.
    card_type: {
        type: String,
        trim: true
    },
    // Payment status; use it to decide when to fulfil the order.
    status: {
        type: String,
        enum: ['inProccess', 'successful', 'failed']
    },
    // Amount collected by this payment, in baisa.
    amount: {
        type: Number,
        min: 0,
        default: 0
    },
    // Fee collected by this payment, in baisa.
    fee: {
        type: Number,
        min: 0,
        default: 0
    },
    // Whether this payment has been refunded.
    refunded: {
        type: Boolean,
        default: false
    },
    // Refunds issued against this payment.
    refunds: [refundSchema],
    // Id of the payment intent associated with this charge, if any.
    payment_intent: {
        type: String,
        trim: true
    },
    // Invoice id of the checkout session associated with this charge, if any.
    checkout_invoice: {
        type: String,
        trim: true
    },
    // Time at which Thawani created the payment.
    created_at: {
        type: Date,
        default: Date.now
    },
    // Free-text reason describing the transaction.
    reason: {
        type: String,
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
