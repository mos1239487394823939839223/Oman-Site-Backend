const mongoose = require('mongoose');

//1- creayte a schema
const ProductSchema = new mongoose.Schema({
    title:{
        type:String,
        required:[true,'Product title is required'],
        unique:true,
        minlength:[3,'Product title must be at least 3 characters'],
        maxlength:[100,'Product title must be less than 100 characters'],
        trim:true
    },
    slug:{
        type:String,
        lowercase:true
    },
    description:{
        type:String,
        required:[true,'Product description is required'],
        minlength:[20,'Product description must be at least 20 characters'] 
    },
    price:{
        type:Number,
        trim:true,
        required:[true,'Product price is required'],
        min:[0,'Product price must be greater than or equal to 0']
    },
    priceAfterDiscount:{
        type:Number,
        validate:{
            validator:function(value){
                return value < this.price;
            },
            message:'Price after discount must be less than price'
        }
    },
    quantity:{
        type:Number,
        required:[true,'Product quantity is required'],
        min:[0,'Product quantity must be greater than or equal to 0']
    },
    sold:{
        type:Number,
        default:0
    },
    imageCover:{
        type:String,
        required:[true,'Product image cover is required']
    },
    images:[String],
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Category',
        required:[true,'Product must belong to a category']
    },
    subCategories:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'SubCategory'
    }],
    brand:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Brand'
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    ratingsAverage:{
        type:Number,
        default: 0,
        min:[0,'Rating must be greater than or equal to 0'],
        max:[5,'Rating must be less than or equal to 5']
    },
    colors:[String],
    bestSeller:{
        type:Boolean,
        default:false
    },
},{
    timestamps : true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

ProductSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'product',
    localField: '_id'
});

ProductSchema.pre(/^find/, function () {
    this.populate({ path: 'category', select: 'name' })
        .populate({ path: 'subCategories', select: 'name' })
        .populate({ path: 'brand', select: 'name' });
});

const setImageURL = (doc) => {
    if(doc.imageCover && !doc.imageCover.startsWith('http')){
        doc.imageCover = `${process.env.BASE_URL}/uploads/products/${doc.imageCover}`;
    }
    if(doc.images && doc.images.length > 0){
        doc.images = doc.images.map(image =>
            image.startsWith('http') ? image : `${process.env.BASE_URL}/uploads/products/${image}`
        );
    }
};
// findOne , findAll , findById => post init
ProductSchema.post('init', (doc)=>{setImageURL(doc)});
// save => post save
ProductSchema.post('save', (doc)=>{setImageURL(doc)});

module.exports = mongoose.model('Product',ProductSchema);