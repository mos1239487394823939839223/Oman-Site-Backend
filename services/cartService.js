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
        .populate({ path: 'cartItems.product', select: 'title imageCover price priceAfterDiscount prices description' })
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

// @desc    Switch the cart's currency and re-resolve every line
// @route   PUT /api/v1/cart/currency
// @access  Protected/User
exports.setCartCurrency = asyncHandler(async (req, res, next) => {
    const { currency } = req.body;
    if (!isSupported(currency)) {
        return next(new ApiError('Unsupported currency', 400));
    }

    const cart = await CartModel.findOne({ user: req.user._id }).populate({
        path: 'cartItems.product',
        select: 'title imageCover price priceAfterDiscount prices description'
    });

    if (!cart) {
        return res.status(200).json({
            success: true,
            numOfCartItems: 0,
            data: emptyCartPayload(req.user._id),
        });
    }

    cart.currency = currency;
    // Re-snapshot each product line in the new currency; gifts stay free.
    cart.cartItems.forEach((item) => {
        if (item.product) {
            item.price = unitPriceForCurrency(item.product, currency);
        }
    });

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

    const cart = await CartModel.findOne({ user: req.user._id })
        .populate({ path: 'cartItems.product', select: 'title imageCover price priceAfterDiscount prices description category' });

    if (!cart || cart.cartItems.length === 0) {
        return next(new ApiError('Cart is empty', 400));
    }

    // Multiplier applied to a discounted unit price, e.g. 20% off -> 0.8
    const factor = (100 - coupon.discount) / 100;
    const isScoped = Boolean(coupon.product || coupon.category);

    // Original (pre-discount) unit price for a line, in the cart's currency.
    // Gift lines keep their stored price; product lines are recomputed from the
    // product so re-applying a coupon never stacks on a previously discounted price.
    const baseUnitPrice = (item) =>
        item.product ? unitPriceForCurrency(item.product, cart.currency) : item.price;

    // Whether this line falls within the coupon's scope.
    const lineMatches = (item) => {
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

    let originalTotal = 0;
    cart.cartItems.forEach((item) => {
        const base = baseUnitPrice(item);
        // Reset every line to its base price first (idempotent), then discount the
        // matching lines only when the coupon is scoped to a product/category.
        item.price = isScoped && lineMatches(item)
            ? parseFloat((base * factor).toFixed(2))
            : base;
        originalTotal += item.quantity * base;
    });

    cart.totalCartPrice = parseFloat(originalTotal.toFixed(2));

    if (isScoped) {
        // Discounted total = sum of the (possibly discounted) line prices.
        const discountedTotal = cart.cartItems.reduce(
            (sum, item) => sum + item.quantity * item.price,
            0
        );
        cart.totalPriceAfterDiscount = parseFloat(discountedTotal.toFixed(2));
    } else {
        // Cart-wide coupon: discount the whole cart, line prices unchanged.
        cart.totalPriceAfterDiscount = parseFloat((originalTotal * factor).toFixed(2));
    }

    await cart.save();

    res.status(200).json({
        success: true,
        numOfCartItems: cart.cartItems.length,
        // Echo the applied coupon (incl. scope) so the client can explain why only
        // some lines changed, e.g. "SAVE20 — applies to Silk Shirt only".
        coupon: {
            name: coupon.name,
            discount: coupon.discount,
            product: coupon.product,
            category: coupon.category
        },
        data: cart
    });
});
