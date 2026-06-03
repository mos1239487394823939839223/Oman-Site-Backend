class ApiFeatures {
    constructor(mongooseQuery, queryString) {
        this.mongooseQuery = mongooseQuery;
        this.queryString = queryString;
    }

    filter(){
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'limit', 'sort', 'sortBy', 'order', 'sortPreset', 'fields', 'keyword'];
        
        excludedFields.forEach((field) => delete queryObj[field]);

        let queryString = JSON.stringify(queryObj);
        queryString = queryString.replace(/\b(gte|gt|lte|lt|in|nin)\b/g, (match) => `$${match}`);

        const filterObject = JSON.parse(queryString);

     if (this.queryString.colors && typeof this.queryString.colors === 'string') {
            filterObject.colors = { $in: this.queryString.colors.split(',').map((color) => color.trim()) };
        }

        if (this.queryString.subCategories && typeof this.queryString.subCategories === 'string') {
            filterObject.subCategories = {
                $in: this.queryString.subCategories.split(',').map((subCategoryId) => subCategoryId.trim())
            };
        }

        if (this.queryString.bestSeller !== undefined) {
            filterObject.bestSeller =
                this.queryString.bestSeller === 'true' || this.queryString.bestSeller === true;
        }

        this.mongooseQuery = this.mongooseQuery.find(filterObject);
        return this;
    }

    sort(){
            const sortPresets = {
        newest: '-createdAt',
        oldest: 'createdAt',
        price_asc: 'price',
        price_desc: '-price',
        rating_desc: '-ratingsAverage',
        best_selling: '-sold',
        title_asc: 'title',
        title_desc: '-title'
    };
    if (this.queryString.sort) {
        this.mongooseQuery = this.mongooseQuery.sort(this.queryString.sort.split(',').join(' '));
    } else if (this.queryString.sortPreset && sortPresets[this.queryString.sortPreset]) {
        this.mongooseQuery = this.mongooseQuery.sort(sortPresets[this.queryString.sortPreset]);
    } else if (this.queryString.sortBy) {
        const sortOrder = this.queryString.order === 'asc' ? '' : '-';
        this.mongooseQuery = this.mongooseQuery.sort(`${sortOrder}${this.queryString.sortBy}`);
    } else {
        this.mongooseQuery = this.mongooseQuery.sort('-createdAt');
    }
            return this;
     }

     limitFields(){
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.mongooseQuery = this.mongooseQuery.select(fields);
        } else {
            this.mongooseQuery = this.mongooseQuery.select('-__v');
        }
        return this;
     }

     paginate(countDocuments){
        const page = Math.max(1, this.queryString.page * 1 || 1);
        const limit = Math.max(1, this.queryString.limit * 1 || 5);
        const skip = (page - 1) * limit;

        const paginationResult = {};
        paginationResult.currentPage = page;
        paginationResult.limit = limit;
        paginationResult.skip = skip;  
        paginationResult.hasNextPage = page * limit < countDocuments;
        paginationResult.hasPrevPage = page > 1;
        paginationResult.totalDocuments = countDocuments;
        paginationResult.numberOfPages = Math.ceil(countDocuments / limit);

        this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
        this.paginationResult = paginationResult;
        return this;
     }

     search(){
        if (this.queryString.keyword) {
            const keyword = this.queryString.keyword;
            this.mongooseQuery = this.mongooseQuery.find({
                $or: [
                    { title: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } }
                ]
            });
        }
        return this;
     }
}

module.exports = ApiFeatures;