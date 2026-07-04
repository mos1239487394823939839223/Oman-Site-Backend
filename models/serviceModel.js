const mongoose = require('mongoose');

// Home-page "services" / feature badges (e.g. Free Shipping, Support 24/7).
const serviceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Service title is required'],
        trim: true,
    },
    titleAr: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    descriptionAr: {
        type: String,
        trim: true,
    },
    active: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

serviceSchema.set('toJSON', {
    transform(_doc, ret) {
        delete ret.icon;
        return ret;
    }
});

const ServiceModel = mongoose.model('Service', serviceSchema);

module.exports = ServiceModel;
