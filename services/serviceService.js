const ServiceModel = require('../models/serviceModel');
const factory = require('./handlersFactory');

// @desc Get all services
// @route GET /api/v1/services
// @access Public
const getServices = factory.getAll(ServiceModel);

// @desc Get service by id
// @route GET /api/v1/services/:id
// @access Public
const getServiceById = factory.getOne(ServiceModel);

// @desc Create a new service
// @route POST /api/v1/services
// @access Private/Admin
const createService = factory.createOne(ServiceModel);

// @desc Update service
// @route PUT /api/v1/services/:id
// @access Private/Admin
const updateService = factory.updateOne(ServiceModel);

// @desc Delete service
// @route DELETE /api/v1/services/:id
// @access Private/Admin
const deleteService = factory.deleteOne(ServiceModel);

module.exports = {
    getServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
};
