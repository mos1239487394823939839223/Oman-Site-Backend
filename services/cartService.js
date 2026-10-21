const asyncHandler = require('express-async-handler');
const CartModel = require('../models/cartModel');
const ProductModel = require('../models/productModel');
const GiftModel = require('../models/giftModel');
const CouponModel = require('../models/couponModel');
const ApiError = require('../utils/apiError');
const { priceForCurrency, isSupported, BASE_CURRENCY } = require('../utils/currencies');

/** Effective (discounted if present) unit price of a product in a currency. */
const unitPriceForCurrency = (product, currency) => {
    const { amount, amountAfterDiscount } = priceForCurrency(product, currency);
    return typeof amountAfterDiscount === 'number' ? amountAfterDiscount : amount;
};

// 3 decimals: OMR has 3 (e.g. 0.105); 2-decimal currencies are unaffected.
const round = (n) => parseFloat(n.toFixed(3));

const PRODUCT_FIELDS = 'title imageCover price priceAfterDiscount prices description category';
const GIFT_FIELDS = 'title imageCover price priceAfterDiscount description';

/** Why a coupon can't be used by this user right now, or null if it can. */
const couponProblem = (coupon, userId) => {
    if (!coupon.expire || coupon.expire <= Date.now()) return 'Invalid or expired coupon code';
    if ((coupon.usedBy || []).some((id) => id.toString() === userId.toString())) {
        return 'You have already used this coupon';
    }
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
        return 'This coupon has reached its usage limit';
    }
    return null;
};

/** Whether a cart line falls within a coupon's product/category scope. */
const lineMatchesCoupon = (coupon, item) => {
    if (coupon.product) {
        return Boolean(item.product) && item.product._id.toString() === coupon.product.toString();
    }
    if (coupon.category) {
        const category = item.product && item.product.category;
        if (!category) return false;
        // category may be populated ({ _id, name }) or a raw ObjectId.
        const categoryId = category._id ? category._id.toString() : category.toString();
        return categoryId === coupon.category.toString();
    }
    return true; // cart-wide
};

/**
 * Re-price every line from the current product prices in the cart's currency
 * and (re)apply the cart's coupon. Called after every cart change so totals,
 * scoped line discounts and the coupon never go stale; a coupon that is no
 * longer usable is dropped. Leaves products, gifts and the coupon populated.
 */
const repriceCart = async (cart, userId) => {
    await cart.populate([
        { path: 'cartItems.product', select: PRODUCT_FIELDS },
        { path: 'cartItems.gift', select: GIFT_FIELDS },
        { path: 'coupon' },
    ]);

    // Drop lines whose product/gift has since been deleted.
    cart.cartItems = cart.cartItems.filter((item) => item.product || item.gift);

    let coupon = cart.coupon;
    if (coupon && couponProblem(coupon, userId)) {
        cart.coupon = null;
        coupon = null;
    }

    // Multiplier applied to a unit price, e.g. 20% off -> 0.8
    const factor = coupon ? (100 - coupon.discount) / 100 : 1;
    const isScoped = Boolean(coupon && (coupon.product || coupon.category));

    let originalTotal = 0;
    cart.cartItems.forEach((item) => {
        // Gifts are free; products are priced fresh so discounts never stack.
        const base = item.product ? unitPriceForCurrency(item.product, cart.currency) : item.price;
        item.price = isScoped && lineMatchesCoupon(coupon, item) ? round(base * factor) : base;
        originalTotal += item.quantity * base;
    });

    cart.totalCartPrice = round(originalTotal);
    if (!coupon) {
        cart.totalPriceAfterDiscount = undefined;
    } else if (isScoped) {
        // Discounted total = sum of the (possibly discounted) line prices.
        cart.totalPriceAfterDiscount = round(
            cart.cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0)
        );
    } else {
        // Cart-wide coupon: discount the whole cart, line prices unchanged.
        cart.totalPriceAfterDiscount = round(originalTotal * factor);
    }
};

/** Re-price, save, and send the cart in the shape every cart endpoint uses. */
const sendCart = async (cart, req, res, extra = {}) => {
    await repriceCart(cart, req.user._id);
    await cart.save();
    // Only the coupon summary goes to the client, not who else redeemed it.
    const data = cart.toJSON();
    data.coupon = cart.coupon
        ? { _id: cart.coupon._id, name: cart.coupon.name, discount: cart.coupon.discount, product: cart.coupon.product, category: cart.coupon.category }
        : null;
    res.status(200).json({
        success: true,
        ...extra,
        numOfCartItems: cart.cartItems.length,
        data
    });
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

    let cart = await CartModel.findOne({ user: req.user._id });

    // Determine the cart currency: explicit request → existing cart → base.
    const requestedCurrency = req.body.currency;
    const currency = isSupported(requestedCurrency)
        ? requestedCurrency
        : (cart && cart.currency) || BASE_CURRENCY;

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

        const itemPrice = unitPriceForCurrency(product, currency);
        cartItemPayload = { product: productId, color, price: itemPrice };
    }

    if (!cart) {
        cart = await CartModel.create({
            user: req.user._id,
            currency,
            cartItems: [cartItemPayload]
        });
    } else {
        cart.currency = currency;
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

    await sendCart(cart, req, res, { message });
});

// @desc    Get logged user cart
// @route   GET /api/v1/cart
// @access  Protected/User
exports.getLoggedUserCart = asyncHandler(async (req, res, next) => {
    const cart = await CartModel.findOne({ user: req.user._id });

    if (!cart) {
        return res.status(200).json({
            success: true,
            numOfCartItems: 0,
            data: emptyCartPayload(req.user._id),
        });
    }

    await sendCart(cart, req, res);
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

    await sendCart(cart, req, res);
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
    await sendCart(cart, req, res);
});

// @desc    Switch the cart's currency and re-resolve every line
// @route   PUT /api/v1/cart/currency
// @access  Protected/User
exports.setCartCurrency = asyncHandler(async (req, res, next) => {
    const { currency } = req.body;
    if (!isSupported(currency)) {
        return next(new ApiError('Unsupported currency', 400));
    }

    const cart = await CartModel.findOne({ user: req.user._id });

    if (!cart) {
        return res.status(200).json({
            success: true,
            numOfCartItems: 0,
            data: emptyCartPayload(req.user._id),
        });
    }

    // sendCart re-prices every line in the new currency; gifts stay free.
    cart.currency = currency;
    await sendCart(cart, req, res);
});

// @desc    Apply coupon to logged user cart
// @route   PUT /api/v1/cart/applyCoupon
// @access  Protected/User
exports.applyCoupon = asyncHandler(async (req, res, next) => {
    const coupon = await CouponModel.findOne({ name: req.body.coupon.toUpperCase() });
    if (!coupon) {
        return next(new ApiError('Invalid or expired coupon code', 400));
    }
    const problem = couponProblem(coupon, req.user._id);
    if (problem) {
        return next(new ApiError(problem, 400));
    }

    const cart = await CartModel.findOne({ user: req.user._id });
    if (!cart || cart.cartItems.length === 0) {
        return next(new ApiError('Cart is empty', 400));
    }

    // Remember the applied coupon so order placement can redeem it.
    cart.coupon = coupon._id;
    await sendCart(cart, req, res, {
        // Echo the applied coupon (incl. scope) so the client can explain why only
        // some lines changed, e.g. "SAVE20 — applies to Silk Shirt only".
        coupon: {
            name: coupon.name,
            discount: coupon.discount,
            product: coupon.product,
            category: coupon.category
        }
    });
});

// @desc    Remove the applied coupon from logged user cart
// @route   DELETE /api/v1/cart/coupon
// @access  Protected/User
exports.removeCoupon = asyncHandler(async (req, res, next) => {
    const cart = await CartModel.findOne({ user: req.user._id });
    if (!cart) {
        return res.status(200).json({
            success: true,
            numOfCartItems: 0,
            data: emptyCartPayload(req.user._id),
        });
    }
    cart.coupon = null;
    await sendCart(cart, req, res);
});
