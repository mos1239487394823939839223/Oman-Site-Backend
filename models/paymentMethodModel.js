const mongoose = require('mongoose');

// A saved card (Thawani Payment Method) belonging to a customer. All fields are
// read-only values Thawani returns — we never store the full card number.
const paymentMethodSchema = new mongoose.Schema({
    // Thawani's payment method identifier (the `id` field in Thawani's object).
    payment_method_id: {
        type: String,
        required: [true, 'payment_method_id is required'],
        unique: true,
        trim: true
    },
    // First six digits of the card (issuer identification number).
    bin: {
        type: Number
    },
    // Masked card, only the last four digits are shown (e.g. "XXXX XXXX XXXX 4242").
    masked_card: {
        type: String,
        trim: true
    },
    expiry_month: {
        type: Number,
        min: 1,
        max: 12
    },
    expiry_year: {
        type: Number
    },
    // Customer-chosen nickname for the card.
    nickname: {
        type: String,
        trim: true
    },
    brand: {
        type: String,
        enum: ['Visa', 'MasterCard']
    },
    card_type: {
        type: String,
        enum: ['Debit', 'Credit']
    },
    // Convenience link to the customer this saved card belongs to.
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    }
}, { timestamps: true });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
