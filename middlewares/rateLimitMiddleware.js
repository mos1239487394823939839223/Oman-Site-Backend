const ApiError = require('../utils/apiError');

// Simple in-memory limiter: at most `max` requests per IP per `windowMs` for
// the routes it guards. Enough for one backend instance; it resets on restart.
// Relies on `trust proxy` (server.js) so req.ip is the client, not nginx.
const rateLimit = ({ windowMs, max, message }) => {
    const hits = new Map();

    // Drop expired entries now and then so the map can't grow without bound.
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of hits) {
            if (entry.resetAt <= now) hits.delete(key);
        }
    }, windowMs).unref();

    return (req, res, next) => {
        const now = Date.now();
        const key = req.ip;
        let entry = hits.get(key);
        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + windowMs };
            hits.set(key, entry);
        }
        entry.count += 1;
        if (entry.count > max) {
            res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
            return next(new ApiError(message, 429));
        }
        next();
    };
};

module.exports = rateLimit;
