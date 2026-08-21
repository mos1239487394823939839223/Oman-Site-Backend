const stipe = require("stripe")(process.env.STRIPE_SECRET);
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const factory = require("./handlersFactory");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const Gift = require("../models/giftModel");
const Coupon = require("../models/couponModel");
const Checkout = require("../models/checkoutModel");
const thawaniService = require("./thawaniService");
const { ORDER_STATUSES } = require("../utils/orderStatuses");
const { notifyNewOrder } = require("../config/socket");
const { toStripeAmount, effectivePrice, BASE_CURRENCY } = require("../utils/currencies");

const applyOrderStatus = (order, status) => {
    order.status = status;
    order.statusUpdatedAt = Date.now();

    if (status === 'delivered') {
        order.isDelivered = true;
        if (!order.isDeliveredAt) order.isDeliveredAt = Date.now();
    }
};

// Redeem a coupon when an order is actually placed: record the user and bump the
// count, but only if they haven't redeemed it before and the usage limit (number
// of people) hasn't been reached. The conditional update makes this race-safe.
const redeemCoupon = async (couponId, userId) => {
    if (!couponId) return;
    await Coupon.updateOne(
        {
            _id: couponId,
            usedBy: { $ne: userId },
            $or: [
                { usageLimit: null },
                { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
            ]
        },
        {
            $addToSet: { usedBy: userId },
            $inc: { usedCount: 1 }
        }
    );
};

// Create the order from a cart and run all the side effects: decrement stock,
// redeem the coupon, notify admins, and clear the cart. Shared by the cash and
// Thawani (card) flows so they stay in lockstep.
const placeOrderFromCart = async ({ cart, userId, shippingAddress, paymentMethod, isPaid, totalOrderPrice, currency }) => {
    const order = await Order.create({
        user: userId,
        cartItems: cart.cartItems,
        shippingAddress,
        totalOrderPrice,
        taxPrice: 0,
        shippingPrice: 0,
        currency,
        paymentMethod,
        isPaid: !!isPaid,
        isPaidAt: isPaid ? Date.now() : undefined,
        status: isPaid ? 'confirmed' : 'pending',
        statusUpdatedAt: Date.now(),
    });

    const productBulkOptions = cart.cartItems
        .filter((item) => item.product)
        .map((item) => ({
            updateOne: {
                filter: { _id: item.product._id || item.product },
                update: { $inc: { quantity: -item.quantity, sold: +item.quantity } }
            }
        }));
    const giftBulkOptions = cart.cartItems
        .filter((item) => item.gift)
        .map((item) => ({
            updateOne: {
                filter: { _id: item.gift._id || item.gift },
                update: { $inc: { quantity: -item.quantity, sold: +item.quantity } }
            }
        }));

    if (productBulkOptions.length > 0) await Product.bulkWrite(productBulkOptions, {});
    if (giftBulkOptions.length > 0) await Gift.bulkWrite(giftBulkOptions, {});

    await redeemCoupon(cart.coupon, userId);
    await Cart.findByIdAndDelete(cart._id);
    notifyNewOrder(order);

    return order;
};

// Thawani only settles in OMR, but the cart may be displayed in another currency.
// Price the card charge from each product's OMR amount and preserve any coupon
// discount via the (currency-independent) cart discount ratio. Returns the human
// OMR total and the integer baisa amount Thawani expects.
const computeOmrCharge = (cart) => {
    let omrSubtotal = 0;
    for (const item of cart.cartItems) {
        // Gifts are free (price forced to 0), so they add nothing to the charge.
        if (item.product) {
            omrSubtotal += (item.quantity || 1) * effectivePrice(item.product, BASE_CURRENCY);
        }
    }
    const factor = (cart.totalCartPrice > 0 && typeof cart.totalPriceAfterDiscount === 'number')
        ? cart.totalPriceAfterDiscount / cart.totalCartPrice
        : 1;
    const omrTotal = omrSubtotal * factor;
    return { omrTotal, omrBaisa: toStripeAmount(omrTotal, BASE_CURRENCY) };
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
    // 3) Create the order (payment method cash). The order inherits the cart's
    //    currency; item prices/totals are already snapshotted in it. The shared
    //    helper also decrements stock, redeems the coupon, and clears the cart.
    const order = await placeOrderFromCart({
        cart,
        userId: req.user._id,
        shippingAddress: req.body.shippingAddress,
        paymentMethod: "cash",
        isPaid: false,
        totalOrderPrice: totalPrice,
        currency: cart.currency || BASE_CURRENCY,
    });

    res.status(200).json({ message: "Order created successfully" , debugger: order});
});

// @desc    Start a Thawani card payment for a cart
// @route   POST /api/v1/orders/thawani/session/:cartId
// @access  Protected/User
// Creates a Thawani checkout session priced in OMR, persists a Checkout record
// with the data needed to place the order once payment is confirmed, and returns
// the hosted pay URL the client should redirect to.
exports.createThawaniSession = asyncHandler(async (req, res, next) => {
    const cart = await Cart.findById(req.params.cartId)
        .populate('cartItems.product', 'title price priceAfterDiscount prices');
    if (!cart) {
        return next(new ApiError('There is no cart for this id', 404));
    }
    if (!cart.cartItems || cart.cartItems.length === 0) {
        return next(new ApiError('Cart is empty', 400));
    }

    const { omrTotal, omrBaisa } = computeOmrCharge(cart);
    // Thawani's minimum payable amount is 100 baisa (0.100 OMR).
    if (omrBaisa < 100) {
        return next(new ApiError('Order total is below the minimum payable amount (0.100 OMR)', 400));
    }

    const clientRef = String(cart._id);
    const frontend = process.env.FRONTEND_URL || '';
    const successUrl = `${frontend}/payment/success?ref=${clientRef}`;
    const cancelUrl = `${frontend}/cart`;
    const products = [
        { name: `Order ${clientRef.slice(-8).toUpperCase()}`, quantity: 1, unit_amount: omrBaisa },
    ];

    const session = await thawaniService.createCheckoutSession({
        clientReferenceId: clientRef,
        products,
        successUrl,
        cancelUrl,
        metadata: { cartId: clientRef, userId: String(req.user._id) },
    });

    // Persist our own record with everything needed to place the order at confirm.
    await Checkout.findOneAndUpdate(
        { session_id: session.session_id },
        {
            session_id: session.session_id,
            client_reference_id: clientRef,
            products,
            total_amount: omrBaisa,
            currency: BASE_CURRENCY,
            success_url: successUrl,
            cancel_url: cancelUrl,
            payment_status: session.payment_status || 'unpaid',
            mode: 'payment',
            metadata: {
                userId: String(req.user._id),
                shippingAddress: req.body.shippingAddress || {},
                omrTotal,
            },
            created_at: session.created_at ? new Date(session.created_at) : new Date(),
            expire_at: session.expire_at ? new Date(session.expire_at) : undefined,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
        status: 'success',
        session_id: session.session_id,
        payUrl: thawaniService.payUrl(session.session_id),
    });
});

// @desc    Confirm a Thawani payment and place the order
// @route   POST /api/v1/orders/thawani/confirm
// @access  Protected/User
// The success page calls this with the checkout ref (cart id) or session_id.
// It verifies the payment with Thawani and, if paid, places the order once
// (idempotent on repeat calls / refreshes).
exports.confirmThawaniPayment = asyncHandler(async (req, res, next) => {
    const { session_id: sessionId, ref } = req.body;

    const checkout = sessionId
        ? await Checkout.findOne({ session_id: sessionId })
        : await Checkout.findOne({ client_reference_id: ref }).sort({ createdAt: -1 });
    if (!checkout) {
        return next(new ApiError('Checkout session not found', 404));
    }

    const meta = checkout.metadata || {};
    // Only the buyer may confirm their own checkout.
    if (meta.userId && String(meta.userId) !== String(req.user._id)) {
        return next(new ApiError('You are not allowed to confirm this payment', 403));
    }

    // Idempotency: if we already placed the order for this checkout, return it.
    if (meta.orderId) {
        const existing = await Order.findById(meta.orderId);
        if (existing) {
            return res.status(200).json({ status: 'success', paid: true, data: existing });
        }
    }

    // Verify the real status with Thawani.
    const session = await thawaniService.getCheckoutSession(checkout.session_id);
    checkout.payment_status = session.payment_status || checkout.payment_status;
    if (session.invoice) checkout.invoice = session.invoice;

    if (checkout.payment_status !== 'paid') {
        await checkout.save();
        return res.status(200).json({ status: 'success', paid: false, payment_status: checkout.payment_status });
    }

    // Paid. Load the cart and place the order (in OMR — what was actually charged).
    const cart = await Cart.findById(checkout.client_reference_id);
    if (!cart) {
        // Cart already consumed (e.g. a double confirm that raced) — report paid.
        await checkout.save();
        return res.status(200).json({ status: 'success', paid: true, data: null, message: 'Payment received' });
    }

    const order = await placeOrderFromCart({
        cart,
        userId: meta.userId || req.user._id,
        shippingAddress: meta.shippingAddress || {},
        paymentMethod: 'card',
        isPaid: true,
        totalOrderPrice: typeof meta.omrTotal === 'number' ? meta.omrTotal : (checkout.total_amount / 1000),
        currency: BASE_CURRENCY,
    });

    checkout.metadata = { ...meta, orderId: String(order._id) };
    checkout.markModified('metadata');
    await checkout.save();

    res.status(200).json({ status: 'success', paid: true, data: order });
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