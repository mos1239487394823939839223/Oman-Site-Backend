const mongoose = require('mongoose');

//1- creayte a schema
const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        minlength: [3, 'Category name must be at least 3 characters'],
        maxlength: [50, 'Category name must be less than 50 characters']
    },
    slug : {
        type : String,
        lowercase : true
    },
    image : {
        type : String,    }
}, {timestamps : true});

const setImageURL = (doc) => {
    if(doc.image){
        const imageURL = `${process.env.BASE_URL}/uploads/categories/${doc.image}`;
        doc.image = imageURL;
    }
};
// findOne , findAll , findById => post init
CategorySchema.post('init', (doc)=>{setImageURL(doc)});
// save => post save
CategorySchema.post('save', (doc)=>{setImageURL(doc)});

// 2- create a model
const CategoryModel = mongoose.model('Category',CategorySchema);

module.exports = CategoryModel;