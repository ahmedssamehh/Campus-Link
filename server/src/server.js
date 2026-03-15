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
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception: %s', err.message);
    process.exit(1);
});

connectDB().then(() => {
    const server = http.createServer(app);
    const io = initSocketServer(server);
    logger.info('Socket.io initialized');

    initChatWorker(io);
    app.set('io', io);

    server.listen(PORT, () => {
        logger.info('Server running on port %d (%s)', PORT, process.env.NODE_ENV || 'development');
    });
});
