const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const factory = require("./handlersFactory");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const Gift = require("../models/giftModel");


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
    // 3) Create Order with default payment method cash
    const order = await Order.create({
        user: req.user._id,
        cartItems: cart.cartItems,
        shippingAddress: req.body.shippingAddress,
        totalOrderPrice: totalPrice,
        taxPrice,
        shippingPrice,
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
        
    }
    // 5) Clear Cart
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
