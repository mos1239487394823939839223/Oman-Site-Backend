const ApiError = require('../utils/apiError');
const ApiFeatures = require('../utils/apiFeatures');
const asyncHandler = require('express-async-handler');


exports.deleteOne = (Model) => {
    return asyncHandler(async(req,res,next)=>{
    const {id}= req.params;
    const document = await Model.findByIdAndDelete(id);
    if(!document){
        return next(new ApiError('Document not found', 404));
    }
    res.status(204).send();
})}


exports.inactiveOne = (Model) => {
    return asyncHandler(async(req,res,next)=>{
    const {id}= req.params;
    const document = await Model.findByIdAndUpdate(id, { active:  false}, { new: false });
    if(!document){
        return next(new ApiError('Document not found', 404));
    }
    res.status(204).send();
})}

exports.updateOne = (Model) => {
    return asyncHandler(async(req,res,next)=>{
    const {id}=req.params;
    const document = await Model.findById(id);
    if(!document){
        return next(new ApiError('Document not found', 404));
    }
    Object.assign(document, req.body);
    const updated = await document.save();
    res.status(200).json({
        sucess:true,
        data:updated
    });
})}


exports.createOne = (Model)=>{
    return asyncHandler(async(req,res,next)=>{
    const document = await Model.create(req.body);
        res.status(201).json({
            sucess:true,
            data:document
        }); })
}

exports.getOne = (Model) => {return asyncHandler(async(req,res,next)=>{
    const {id}=req.params;
    const document = await Model.findById(id);
    if(!document){
        return next(new ApiError('Document not found', 404));
    }
    res.status(200).json({
        sucess:true,
        data:document
    });
})}

exports.getAll = (Model) => {
    return asyncHandler(async(req,res,next)=>{
        const filter = req.filterObj || {};
        const countQuery = new ApiFeatures(Model.find(filter), req.query).filter().search();
        const totalDocuments = await Model.countDocuments(countQuery.mongooseQuery.getFilter());
        const apiFeatures = new ApiFeatures(Model.find(filter), req.query).filter().search().sort().limitFields().paginate(totalDocuments);
        const {mongooseQuery, paginationResult} = apiFeatures;
        const documents = await mongooseQuery;
    
        res.status(200).json({
            result: documents.length,
            totalDocuments,
            currentPage: paginationResult.currentPage,
            numberOfPages: paginationResult.numberOfPages,
            data: documents
        });
    })
}   