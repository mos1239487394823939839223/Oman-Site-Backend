const path = require('path')

const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');

dotenv.config({path:'./config.env'});

const ApiError = require('./utils/apiError');
const dbConnection = require('./config/dbConnection');
const globalErrorHandler = require('./middlewares/errorMiddleware');
const mountRoutes = require('./routes/index');

// Connect to MongoDB
dbConnection();

const port = process.env.PORT || 8000;
const app = express();

// middleware
if(process.env.NODE_ENV === 'development') {
    console.log('Morgan enabled');
    app.use(morgan('dev'));
}

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // mount routes

mountRoutes(app);

app.use((req, res, next) => {
        next(new ApiError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);


const server =app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log(`Unhandled Rejection: ${err.name} - ${err.message}`);
    server.close(() => {
        console.log('Shutting down server due to unhandled promise rejection');
        process.exit(1);
    });
});