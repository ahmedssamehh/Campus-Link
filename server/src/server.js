require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocketServer } = require('./socket/chat.socket');
const { initChatWorker } = require('./workers/chat.worker');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection: %s', err.message);
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception: %s', err.message);
});

// Start the HTTP server immediately so Railway health checks pass
const server = http.createServer(app);
const io = initSocketServer(server);
logger.info('Socket.io initialized');
initChatWorker(io);
app.set('io', io);

server.listen(PORT, '0.0.0.0', () => {
    logger.info('Server running on port %d (%s)', PORT, process.env.NODE_ENV || 'development');
});

// Connect to MongoDB in the background
connectDB().catch((err) => {
    logger.error('MongoDB connection failed: %s', err.message);
});
