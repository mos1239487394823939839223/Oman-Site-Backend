const express = require('express');
const router = express.Router();
const {createCashOrder, getAllOrders , getSpecificOrder , filterOrderForLoggedUser} = require('../services/orderService');
const authService = require('../services/authService');

router.use(authService.protect);

router.route('/:cartId').post( createCashOrder,authService.allowedTo(['user']));
router.get('/',
    authService.allowedTo(['admin', 'manager', 'user']),
    filterOrderForLoggedUser,
    getAllOrders
);
router.get('/:id', getSpecificOrder);

module.exports = router;