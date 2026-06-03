const mongoose = require('mongoose');
const Product = require('./productModel');

const reviewSchema = new mongoose.Schema({
    title:{
        type: String,
    },
    rating:{
        type: Number,
        required: true,
        min: [1,'Rating must be at least 1'],
        max: [5,'Rating must be at most 5']
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    }
},{timestamps: true});

reviewSchema.statics.calcAverageRatingsAndQuantity = async function (productId) {
    const stats = await this.aggregate([
        {
            $match: { product: productId }
        },
        {
            $group: {
                _id: '$product',
                ratingsQuantity: { $sum: 1 },
                ratingsAverage: { $avg: '$rating' }
            }
        }
    ]);

    if (stats.length > 0) {
        await Product.findByIdAndUpdate(productId, {
            ratingsQuantity: stats[0].ratingsQuantity,
            ratingsAverage: Number(stats[0].ratingsAverage.toFixed(2))
        });
        return;
    }

    await Product.findByIdAndUpdate(productId, {
        ratingsQuantity: 0,
        ratingsAverage: 0
    });
};

reviewSchema.post('save', async function () {
    await this.constructor.calcAverageRatingsAndQuantity(this.product);
});

reviewSchema.pre(/^findOneAnd/, async function () {
    this.review = await this.model.findOne(this.getFilter()).select('product');
});

reviewSchema.post(/^findOneAnd/, async function () {
    if (this.review) {
        await this.review.constructor.calcAverageRatingsAndQuantity(this.review.product);
    }
});

reviewSchema.pre(/^find/, function () {
    this.populate({ path: 'user', select: 'name profileImage' })
        .populate({ path: 'product', select: 'title imageCover' });
});

module.exports = mongoose.model('Review', reviewSchema);