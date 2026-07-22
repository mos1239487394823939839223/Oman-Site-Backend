const stipe = require("stripe")(process.env.STRIPE_SECRET);
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const factory = require("./handlersFactory");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const Gift = require("../models/giftModel");
const { ORDER_STATUSES } = require("../utils/orderStatuses");
const { notifyNewOrder } = require("../config/socket");
const { toStripeAmount, BASE_CURRENCY } = require("../utils/currencies");

const applyOrderStatus = (order, status) => {
    order.status = status;
    order.statusUpdatedAt = Date.now();

    if (status === 'delivered') {
        order.isDelivered = true;
        if (!order.isDeliveredAt) order.isDeliveredAt = Date.now();
    }
};


exports.filterOrderForLoggedUser = asyncHandler(async (req, res, next) => {
    let filter = {};
    if (req.user.role === "user") {req.filterObj = { user: req.user._id }; }
    next();
});   

// @desc Create new Order
// @route POST /api/v1/orders/cartId
// @ access Private/User

exports.createCashOrder = asyncHandler(async (req, res, next) => {
    // app settings

    const taxPrice = 0;
    const shippingPrice = 0;

    // 1) Get Cart based on cartId

    const cart = await Cart.findById(req.params.cartId);
    if(!cart){
        return next(new ApiError("There is no cart for this id",404));
    }


    // 2) Calculate Order Price based on cart price + tax + shipping (if there is a copon apply it and use the discounted price);
    const cartPrice =
        typeof cart.totalPriceAfterDiscount === "number"
            ? cart.totalPriceAfterDiscount
            : cart.totalCartPrice;

    if (typeof cartPrice !== "number" || Number.isNaN(cartPrice)) {
        return next(new ApiError("Cart total price is invalid", 400));
    }

    const totalPrice = cartPrice + taxPrice + shippingPrice;
    // 3) Create Order with default payment method cash. The order inherits the
    //    cart's currency; item prices/totals are already snapshotted in it.
    const order = await Order.create({
        user: req.user._id,
        cartItems: cart.cartItems,
        shippingAddress: req.body.shippingAddress,
        totalOrderPrice: totalPrice,
        taxPrice,
        shippingPrice,
        currency: cart.currency || BASE_CURRENCY,
        paymentMethod: "cash"
    });

    // 4) Decrease product quantity, increase sold count
    if(order){
        const productBulkOptions = cart.cartItems
            .filter((item) => item.product)
            .map((item) => ({
                updateOne: {
                    filter: { _id: item.product },
                    update: { $inc: { quantity: -item.quantity, sold: +item.quantity } }
                }
            }));

        const giftBulkOptions = cart.cartItems
            .filter((item) => item.gift)
            .map((item) => ({
                updateOne: {
                    filter: { _id: item.gift },
                    update: { $inc: { quantity: -item.quantity, sold: +item.quantity } }
                }
            }));

        if (productBulkOptions.length > 0) {
            await Product.bulkWrite(productBulkOptions, {});
        }

        if (giftBulkOptions.length > 0) {
            await Gift.bulkWrite(giftBulkOptions, {});
        }

        await Cart.findByIdAndDelete(req.params.cartId);

        // 5) Notify admins in real time about the incoming order
        notifyNewOrder(order);
    }
    // 6) Send order created email with order details to user email

    res.status(200).json({ message: "Order created successfully" , debugger: order});
});

// @desc Get All orders
// @route GET /api/v1/orders
// @ access Private/User-admin-manager

 
exports.getAllOrders = factory.getAll(Order);


// @desc specific order
// @route GET /api/v1/orders/:id
// @ access Private/User-admin-manager

exports.getSpecificOrder = factory.getOne(Order);

// @desc Get available order statuses (for admin dropdown)
// @route GET /api/v1/orders/statuses
// @access Protected/Admin-Manager-User
exports.getOrderStatuses = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        data: ORDER_STATUSES
    });
});

// @desc Update order status
// @route PUT /api/v1/orders/:id/status
// @access Protected/Admin-Manager
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ApiError('There is no order for this id', 404));
    }

    applyOrderStatus(order, req.body.status);
    await order.save();

    res.status(200).json({
        success: true,
        message: 'Order status updated successfully',
        data: order
    });
});

// @desc Update order to paid
// @route PUT /api/v1/orders/:id/pay
// @ access Private/User-admin-manager

exports.updateOrderToPaid = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ApiError("There is no order for this id", 404));
    }
    order.isPaid = true;
    order.isPaidAt = Date.now();
    if (order.status === 'pending') {
        applyOrderStatus(order, 'confirmed');
    }
    await order.save();
    // Notify admins in real time that a (card) order was paid
    notifyNewOrder(order);
    res.status(200).json({ success: true, message: "Order paid successfully", data: order });
});

// @desc Update order to delivered
// @route PUT /api/v1/orders/:id/deliver
// @ access Private/User-admin-manager

exports.updateOrderToDelivered = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ApiError("There is no order for this id", 404));
    }
    applyOrderStatus(order, 'delivered');
    await order.save();
    res.status(200).json({ success: true, message: "Order delivered successfully", data: order });
});



// @desc Get Checkout Session from stripe and send it to frontend
// @route GET /api/v1/orders/checkout-session/cartId
// @ access Private/User

exports.CheckoutSession = asyncHandler(async (req, res, next) => {
    
    // 1) Get Cart based on cartId
    const cart = await Cart.findById(req.params.cartId)
        .populate('cartItems.product', 'title imageCover')
        .populate('cartItems.gift', 'title imageCover');
    if(!cart){
        return next(new ApiError("There is no cart for this id",404));
    }
    //2) Calculate Order Price based on cart price + tax + shipping (if there is a copon apply it and use the discounted price);
    const cartPrice =
        typeof cart.totalPriceAfterDiscount === "number"
            ? cart.totalPriceAfterDiscount
            : cart.totalCartPrice;

    if (typeof cartPrice !== "number" || Number.isNaN(cartPrice)) {
        return next(new ApiError("Cart total price is invalid", 400));
    }


    // 3) Create stripe checkout session, and send it as response to frontend.
    //    Prices are already snapshotted in the cart's currency; convert to
    //    Stripe's smallest unit per currency (OMR is 3-decimal, others 2).
    const orderCurrency = cart.currency || BASE_CURRENCY;
    const stripeCurrency = orderCurrency.toLowerCase();
    const session = await stipe.checkout.sessions.create({
        line_items: [
            ...cart.cartItems.map((item) => {
                if (item.product) {
                    return {
                        price_data: {
                            currency: stripeCurrency,
                            product_data: {
                                name: item.product.title,
                                images: [item.product.imageCover]
                            },
                            unit_amount: toStripeAmount(item.price, orderCurrency)
                        },
                        quantity: item.quantity
                    };
                } else if (item.gift) {
                    return {
                        price_data: {
                            currency: stripeCurrency,
                            product_data: {
                                name: item.gift.title,
                                images: [item.gift.imageCover]
                            },
                            unit_amount: toStripeAmount(item.price, orderCurrency)
                        },
                        quantity: item.quantity
                    };
                }
            }).filter(Boolean)
        ],
        mode: "payment",
        success_url: `${req.protocol}://${req.get("host")}/orders`,
        cancel_url: `${req.protocol}://${req.get("host")}/cart`,
        customer_email: req.user.email,
        client_reference_id: req.params.cartId,
        metadata: { shippingAddress: req.body.shippingAddress ? JSON.stringify(req.body.shippingAddress) : "" }  
    });

    res.status(200).json({ session });
});