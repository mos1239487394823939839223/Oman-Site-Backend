const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Roles allowed to receive real-time admin notifications
const ADMIN_ROLES = ['admin', 'manager'];
const ADMIN_ROOM = 'admins';

let io;

// Authenticate a socket handshake with the same JWT used by the REST API.
// Only admins/managers are allowed to connect; everyone else is rejected.
const authenticateSocket = async (socket, next) => {
    try {
        const token =
            socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
            return next(new Error('Authentication error: no token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return next(new Error('Authentication error: user no longer exists'));
        }
        if (!ADMIN_ROLES.includes(user.role)) {
            return next(new Error('Authorization error: admins only'));
        }

        socket.user = user;
        next();
    } catch (err) {
        next(new Error('Authentication error: invalid or expired token'));
    }
};

// Initialize Socket.IO on top of the existing HTTP server.
const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.use(authenticateSocket);

    io.on('connection', (socket) => {
        socket.join(ADMIN_ROOM);
        console.log(`Admin connected to notifications: ${socket.user.email}`);

        socket.on('disconnect', () => {
            console.log(`Admin disconnected: ${socket.user.email}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized. Call initSocket(server) first.');
    }
    return io;
};

// Emit a new-order notification to every connected admin.
// Safe to call before init / with no listeners — it just no-ops.
const notifyNewOrder = (order) => {
    if (!io || !order) return;

    const payload = {
        id: order._id,
        user: order.user,
        totalOrderPrice: order.totalOrderPrice,
        itemCount: Array.isArray(order.cartItems) ? order.cartItems.length : 0,
        paymentMethod: order.paymentMethod,
        isPaid: order.isPaid,
        createdAt: order.createdAt,
    };

    io.to(ADMIN_ROOM).emit('order:new', payload);
};

// Close Socket.IO and release the HTTP server (needed for clean nodemon restarts).
const closeSocket = () =>
    new Promise((resolve) => {
        if (!io) return resolve();
        io.close(() => resolve());
    });

module.exports = { initSocket, getIO, notifyNewOrder, closeSocket, ADMIN_ROOM };
