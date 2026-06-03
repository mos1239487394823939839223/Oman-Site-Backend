const ApiError = require('../utils/apiError');

const globaleErrorHandler = (err, req, res, next) => {
    let error = err;

    if (error.name === 'CastError')error = new ApiError(`Invalid ${error.path}: ${error.value}`, 400);

    error.statusCode = error.statusCode || 500;
    error.status = error.status || 'error';

    if (process.env.NODE_ENV === 'development')return sendErrorForDev(error, res);

    return sendErrorForProd(error, res);
};

const sendErrorForDev = (err, res) => {
    return res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message || 'Internal Server Error',
        stack: err.stack
    });
};

const handleJWTErrorInvalidSignature = () => new ApiError('Invalid token. Please log in again!', 401);
const handleJWTErrorExpired = () => new ApiError('Your token has expired! Please log in again.', 401);

const sendErrorForProd = (err, res) => {
    let error = err;

    if (error.name === 'JsonWebTokenError') error = handleJWTErrorInvalidSignature();
    if (error.name === 'TokenExpiredError') error = handleJWTErrorExpired();
    
    // Operational, trusted error: send message to client
    if (error.isOperational) {
        return res.status(error.statusCode).json({
            status: error.status,
            message: error.message || 'Internal Server Error'
        });
    }
    

    return res.status(500).json({
        status: 'error',
        message: 'Something went wrong'
    });
};

module.exports = globaleErrorHandler;
