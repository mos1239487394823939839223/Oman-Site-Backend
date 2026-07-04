const express = require('express');
const router = express.Router();
const {
    getServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
} = require('../services/serviceService');
const {
    createServiceValidator,
    updateServiceValidator,
    getServiceValidator,
    deleteServiceValidator,
} = require('../utils/validators/serviceValidator');
const authService = require('../services/authService');

router
    .route('/')
    .get(getServices) // public
    .post(
        authService.protect,
        authService.allowedTo(['admin', 'manager']),
        createServiceValidator,
        createService
    );

router
    .route('/:id')
    .get(getServiceValidator, getServiceById) // public
    .put(
        authService.protect,
        authService.allowedTo(['admin', 'manager']),
        updateServiceValidator,
        updateService
    )
    .delete(
        authService.protect,
        authService.allowedTo(['admin']),
        deleteServiceValidator,
        deleteService
    );

module.exports = router;
