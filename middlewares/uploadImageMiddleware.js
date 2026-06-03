const multer = require('multer');
const ApiError = require('../utils/apiError');

const multerOptions =()=>{

// Disk storage configuration for multer : if you don't want to make image processing and you want to save the image as it is in the server you can use disk storage and specify the destination and filename for the uploaded images.

// const multerStorage = multer.diskStorage({
//     destination: (req,res,cb)=>{
//         cb(null,'uploads/categories');
//     },
//     filename: function (req, file, cb) {
//         //category-{id}-Date.now().ext
//     const uniqueSuffix = uuidv4() + '-' + Date.now();
//     const ext = file.mimetype.split('/')[1];
//     const filename = `category-${uniqueSuffix}.${ext}`;
//     cb(null, filename);
//   }
// });

    const multerStorage = multer.memoryStorage();

    const multerFilter=(req,file,cb)=>{
    if(file.mimetype.startsWith('image')){
        cb(null,true);
    }else{
        cb(new ApiError('Only images are allowed', 400),false);
    }
}
    const upload = multer({ 
        storage: multerStorage ,
        fileFilter: multerFilter
    });
    return upload;
}
const uploadSingleImage = (fieldName) => {
    return multerOptions().single(fieldName);
}
const uploadMixOfImages = (arrayOfFields)=>{
    return multerOptions().fields(arrayOfFields);
}

module.exports = {
    uploadSingleImage,
    uploadMixOfImages,

}