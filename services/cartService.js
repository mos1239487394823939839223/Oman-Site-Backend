const asyncHandler = require('express-async-handler');
const CartModel = require('../models/cartModel');
const ProductModel = require('../models/productModel');
const GiftModel = require('../models/giftModel');
const CouponModel = require('../models/couponModel');
const ApiError = require('../utils/apiError');

/**
 * Recalculates totalCartPrice from cartItems and clears any applied discount.
 */
const calcTotalCartPrice = (cart) => {
    let total = 0;
    cart.cartItems.forEach((item) => {
        total += item.quantity * item.price;
    });
    cart.totalCartPrice = parseFloat(total.toFixed(2));
    cart.totalPriceAfterDiscount = undefined;
};

const emptyCartPayload = (userId) => ({
    user: userId,
    cartItems: [],
    totalCartPrice: 0,
});

// @desc    Add product to cart (or increment qty if already present with same color)
// @route   POST /api/v1/cart
// @access  Protected/User
exports.addProductToCart = asyncHandler(async (req, res, next) => {
    
    const { productId, giftId, color } = req.body;

    let cartItemPayload;
    let message = 'Product added to cart successfully';

    if (giftId) {
        const gift = await GiftModel.findById(giftId);
        if (!gift) {
            return next(new ApiError(`No gift found for id: ${giftId}`, 404));
        }

        cartItemPayload = { gift: giftId, color, price: 0 };
        message = 'Gift added to cart successfully';
    } else {
        const product = await ProductModel.findById(productId);
        if (!product) {
            return next(new ApiError(`No product found for id: ${productId}`, 404));
        }

        const itemPrice = product.priceAfterDiscount || product.price;
        cartItemPayload = { product: productId, color, price: itemPrice };
    }

    let cart = await CartModel.findOne({ user: req.user._id });

    if (!cart) {
        cart = await CartModel.create({
            user: req.user._id,
            cartItems: [cartItemPayload]
        });
    } else {
        const itemIndex = cart.cartItems.findIndex((item) => {
            if (giftId) {
                return item.gift && item.gift.toString() === giftId && item.color === color;
            }
            return item.product && item.product.toString() === productId && item.color === color;
        });

        if (itemIndex > -1) {
            cart.cartItems[itemIndex].quantity += 1;
        } else {
            cart.cartItems.push(cartItemPayload);
        }
    }

    calcTotalCartPrice(cart);
    await cart.save();

    res.status(200).json({
        success: true,
        message,
        numOfCartItems: cart.cartItems.length,
        data: cart
    });
});

// @desc    Get logged user cart
// @route   GET /api/v1/cart
// @access  Protected/User
exports.getLoggedUserCart = asyncHandler(async (req, res, next) => {
    const cart = await CartModel.findOne({ user: req.user._id })
        .populate({ path: 'cartItems.product', select: 'title imageCover price priceAfterDiscount description' })
        .populate({ path: 'cartItems.gift', select: 'title imageCover price priceAfterDiscount description' });

    if (!cart) {
        return res.status(200).json({
            success: true,
            numOfCartItems: 0,
            data: emptyCartPayload(req.user._id),
        });
    }

    res.status(200).json({
        success: true,
        numOfCartItems: cart.cartItems.length,
        data: cart
    });
});

// @desc    Remove specific cart item
// @route   DELETE /api/v1/cart/:itemId
// @access  Protected/User
exports.removeSpecificCartItem = asyncHandler(async (req, res, next) => {
    const cart = await CartModel.findOneAndUpdate(
        { user: req.user._id },
        { $pull: { cartItems: { _id: req.params.itemId } } },
        { new: true }
    );

    if (!cart) {
        return res.status(200).json({
            success: true,
            numOfCartItems: 0,
            data: emptyCartPayload(req.user._id),
        });
    }

    calcTotalCartPrice(cart);
    await cart.save();

    res.status(200).json({
        success: true,
        numOfCartItems: cart.cartItems.length,
        data: cart
    });
});

// @desc    Clear logged user cart
// @route   DELETE /api/v1/cart
// @access  Protected/User
exports.clearCart = asyncHandler(async (req, res, next) => {
    await CartModel.findOneAndDelete({ user: req.user._id });
    res.status(204).send();
});

// @desc    Update specific cart item quantity
// @route   PUT /api/v1/cart/:itemId
// @access  Protected/User
exports.updateCartItemQuantity = asyncHandler(async (req, res, next) => {
    const { quantity } = req.body;

    const cart = await CartModel.findOne({ user: req.user._id });
    if (!cart) {
        return res.status(200).json({
            success: true,
            numOfCartItems: 0,
            data: emptyCartPayload(req.user._id),
        });
    }

    const itemIndex = cart.cartItems.findIndex(
        (item) => item._id.toString() === req.params.itemId
    );

    if (itemIndex === -1) {
        return next(new ApiError(`No item found with id: ${req.params.itemId}`, 404));
    }

    cart.cartItems[itemIndex].quantity = quantity;
    calcTotalCartPrice(cart);
    await cart.save();

    res.status(200).json({
        success: true,
        numOfCartItems: cart.cartItems.length,
        data: cart
    });
});

// @desc    Apply coupon to logged user cart
// @route   PUT /api/v1/cart/applyCoupon
// @access  Protected/User
exports.applyCoupon = asyncHandler(async (req, res, next) => {
    const coupon = await CouponModel.findOne({
        name: req.body.coupon.toUpperCase(),
        expire: { $gt: Date.now() }
    });

    if (!coupon) {
        return next(new ApiError('Invalid or expired coupon code', 400));
    }

    const cart = await CartModel.findOne({ user: req.user._id });
    if (!cart || cart.cartItems.length === 0) {
        return next(new ApiError('Cart is empty', 400));
    }

    const discount = (cart.totalCartPrice * coupon.discount) / 100;
    cart.totalPriceAfterDiscount = parseFloat((cart.totalCartPrice - discount).toFixed(2));
    await cart.save();

    res.status(200).json({
        success: true,
        numOfCartItems: cart.cartItems.length,
        data: cart
    });
});
