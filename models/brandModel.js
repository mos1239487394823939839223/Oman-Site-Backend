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
}, {timestamps : true});

// 2- create a model
const BrandModel = mongoose.model('Brand',brandSchema);


module.exports = BrandModel;
