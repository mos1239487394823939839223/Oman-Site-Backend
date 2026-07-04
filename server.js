const path = require('path')

const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');

dotenv.config({path:'./config.env'});

const ApiError = require('./utils/apiError');
const dbConnection = require('./config/dbConnection');
const globalErrorHandler = require('./middlewares/errorMiddleware');
const mountRoutes = require('./routes/index');
const { initSocket, closeSocket } = require('./config/socket');

// Connect to MongoDB
dbConnection();

const port = process.env.PORT || 8000;
const app = express();

app.use(compression());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options(/.*/, cors());

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


const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Stop the other process or change PORT in config.env.`);
    } else {
        console.error('Server failed to start:', err.message);
    }
    process.exit(1);
});

// Initialize real-time layer (admin order notifications)
initSocket(server);

const shutdown = async (signal) => {
    console.log(`${signal} received — closing server`);
    await closeSocket();
    server.close(() => process.exit(0));
    // Force exit if open Socket.IO / HTTP connections prevent a clean close
    setTimeout(() => process.exit(0), 2000).unref();
};

process.on('SIGTERM', () => { shutdown('SIGTERM'); });
process.on('SIGINT', () => { shutdown('SIGINT'); });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.name} - ${err.message}`);
    if (err.stack) console.error(err.stack);
    server.close(() => {
        console.log('Shutting down server due to unhandled promise rejection');
        process.exit(1);
    });
});