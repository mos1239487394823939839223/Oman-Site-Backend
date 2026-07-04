const express = require('express');
const router = express.Router();
const {
    createCashOrder,
    getAllOrders,
    getSpecificOrder,
    filterOrderForLoggedUser,
    updateOrderToDelivered,
    updateOrderToPaid,
    updateOrderStatus,
    getOrderStatuses,
    CheckoutSession
} = require('../services/orderService');
const authService = require('../services/authService');
const { updateOrderStatusValidator } = require('../utils/validators/orderValidator');

router.use(authService.protect);

router.get('/statuses', getOrderStatuses);
router.get(
    '/checkout-session/:cartId',
    authService.allowedTo(['user']),
    CheckoutSession
);
router.get(
    '/',
    authService.allowedTo(['admin', 'manager', 'user']),
    filterOrderForLoggedUser,
    getAllOrders
);
router.route('/:cartId').post(authService.allowedTo(['user','admin','manager']), createCashOrder);
router.put(
    '/:id/status',
    authService.allowedTo(['admin', 'manager']),
    updateOrderStatusValidator,
    updateOrderStatus
);
router.put('/:id/pay', authService.allowedTo(['admin', 'manager']), updateOrderToPaid);
router.put('/:id/deliver', authService.allowedTo(['admin', 'manager']), updateOrderToDelivered);
router.get('/:id', getSpecificOrder);

module.exports = router;
