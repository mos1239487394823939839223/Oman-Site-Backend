const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, 'Subcategory name is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Subcategory name must be at least 3 characters long'],
        maxlength: [50, 'Subcategory name must be less than 50 characters long']
    },
    slug:String,
    image:{
        type: String,
    },
    category:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Category',
        required: [true, 'Subcategory must belong to a category']
    }
},{timestamps:true});

const setImageURL = (doc) => {
    if(doc.image && !doc.image.startsWith('http')){
        doc.image = `${process.env.BASE_URL}/uploads/subcategories/${doc.image}`;
    }
};
// findOne , findAll , findById => post init
subCategorySchema.post('init', (doc)=>{setImageURL(doc)});
// save => post save
subCategorySchema.post('save', (doc)=>{setImageURL(doc)});

const SubCategory = mongoose.model('SubCategory', subCategorySchema);
module.exports = SubCategory;