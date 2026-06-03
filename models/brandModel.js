const mongoose = require('mongoose');

//1- creayte a schema
const brandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Brand name is required'],
        unique: true,
        minlength: [3, 'Brand name must be at least 3 characters'],
        maxlength: [50, 'Brand name must be less than 50 characters']
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
        const imageURL = `${process.env.BASE_URL}/brands/${doc.image}`;
        doc.image = imageURL;
    }
};
// findOne , findAll , findById => post init
brandSchema.post('init', (doc)=>{setImageURL(doc)});
// save => post save
brandSchema.post('save', (doc)=>{setImageURL(doc)});

// 2- create a model
const BrandModel = mongoose.model('Brand',brandSchema);


module.exports = BrandModel;