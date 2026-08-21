const ApiError = require('../utils/apiError');

// Thawani REST base. UAT (test): https://uatcheckout.thawani.om
// Production: https://checkout.thawani.om — switch via THAWANI_BASE_URL.
const BASE_URL = process.env.THAWANI_BASE_URL || 'https://uatcheckout.thawani.om';
const API_KEY = process.env.THAWANI_API_KEY;
const PUBLISHABLE_KEY = process.env.THAWANI_PUBLISHABLE_KEY;

/**
 * Low-level call to the Thawani API. Thawani wraps every response in
 * `{ success, code, description, data }`; this returns the inner `data`
 * and throws an ApiError on any transport or business failure.
 */
async function thawaniRequest(path, { method = 'GET', body } = {}) {
    if (!API_KEY) {
        throw new ApiError('Thawani is not configured (missing THAWANI_API_KEY)', 500);
    }

    let res;
    try {
        res = await fetch(`${BASE_URL}/api/v1${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'thawani-api-key': API_KEY,
            },
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch (err) {
        throw new ApiError(`Could not reach Thawani: ${err.message}`, 502);
    }

    const payload = await res.json().catch(() => ({}));
    if (!res.ok || payload.success === false) {
        const msg = payload.description || payload.message || `request failed (${res.status})`;
        throw new ApiError(`Thawani: ${msg}`, 502);
    }
    return payload.data;
}

/**
 * Create a hosted checkout session.
 * @param {object} p
 * @param {string} p.clientReferenceId  our reference (e.g. the cart id)
 * @param {Array<{name:string, quantity:number, unit_amount:number}>} p.products  amounts in baisa
 * @param {string} p.successUrl
 * @param {string} p.cancelUrl
 * @param {object} [p.metadata]
 */
exports.createCheckoutSession = ({ clientReferenceId, products, successUrl, cancelUrl, metadata }) =>
    thawaniRequest('/checkout/session', {
        method: 'POST',
        body: {
            client_reference_id: clientReferenceId,
            mode: 'payment',
            products,
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: metadata || {},
        },
    });

/** Retrieve a checkout session (to verify payment_status). */
exports.getCheckoutSession = (sessionId) =>
    thawaniRequest(`/checkout/session/${sessionId}`);

/** The hosted page the customer must be redirected to in order to pay. */
exports.payUrl = (sessionId) =>
    `${BASE_URL}/pay/${sessionId}?key=${PUBLISHABLE_KEY}`;
