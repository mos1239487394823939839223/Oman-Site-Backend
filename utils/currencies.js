// Shared currency configuration for multi-currency product pricing.
// Base currency is OMR — the product's legacy `price`/`priceAfterDiscount`
// fields are always the OMR amount and stay the source of truth.

const BASE_CURRENCY = 'OMR';

const CURRENCIES = {
    OMR: { symbol: 'ر.ع.', decimals: 3, stripeFactor: 1000, stripeRoundTo: 10 },
    AED: { symbol: 'د.إ', decimals: 2, stripeFactor: 100, stripeRoundTo: 1 },
    SAR: { symbol: 'ر.س', decimals: 2, stripeFactor: 100, stripeRoundTo: 1 },
    USD: { symbol: '$', decimals: 2, stripeFactor: 100, stripeRoundTo: 1 },
};

const SUPPORTED = Object.keys(CURRENCIES);

const isSupported = (code) => SUPPORTED.includes(code);

/**
 * Resolve a product's (or cart item's) price in a given currency.
 * Falls back to the base OMR `price`/`priceAfterDiscount` when the product
 * has no per-currency entry for `code` (old products, partially filled ones).
 * @returns {{ amount: number, amountAfterDiscount: (number|undefined) }}
 */
const priceForCurrency = (product = {}, code = BASE_CURRENCY) => {
    const entries = Array.isArray(product.prices) ? product.prices : [];
    const entry = entries.find((p) => p && p.currency === code);
    if (entry && typeof entry.amount === 'number') {
        return {
            amount: entry.amount,
            amountAfterDiscount:
                typeof entry.amountAfterDiscount === 'number'
                    ? entry.amountAfterDiscount
                    : undefined,
        };
    }
    // Fallback to the base OMR amount.
    return {
        amount: typeof product.price === 'number' ? product.price : 0,
        amountAfterDiscount:
            typeof product.priceAfterDiscount === 'number'
                ? product.priceAfterDiscount
                : undefined,
    };
};

/** The effective unit price (discounted if present) for a currency. */
const effectivePrice = (product, code = BASE_CURRENCY) => {
    const { amount, amountAfterDiscount } = priceForCurrency(product, code);
    return typeof amountAfterDiscount === 'number' ? amountAfterDiscount : amount;
};

/**
 * Convert a human amount into Stripe's smallest-unit integer for the currency.
 * OMR is a 3-decimal currency: amounts are in thousandths and must be a
 * multiple of 10 (Stripe requirement), so we round to the nearest 10.
 */
const toStripeAmount = (amount, code = BASE_CURRENCY) => {
    const cfg = CURRENCIES[code] || CURRENCIES[BASE_CURRENCY];
    const raw = Math.round((amount || 0) * cfg.stripeFactor);
    if (cfg.stripeRoundTo > 1) {
        return Math.round(raw / cfg.stripeRoundTo) * cfg.stripeRoundTo;
    }
    return raw;
};

module.exports = {
    BASE_CURRENCY,
    CURRENCIES,
    SUPPORTED,
    isSupported,
    priceForCurrency,
    effectivePrice,
    toStripeAmount,
};
