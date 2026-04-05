const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');

// ─── Allowed Origins ─────────────────────────────────────────────────────────
const allowedOrigins = Array.from(new Set([
    ...(process.env.CLIENT_URL || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    'http://localhost:3000',
    'http://localhost:3001',
]));

const corsOptions = {
    origin(origin, callback) {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        logger.warn('Blocked by CORS: %s', origin);
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
};

// ─── Express App ─────────────────────────────────────────────────────────────
const app = express();

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── 1. CORS — must be first, before everything else ─────────────────────────
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ─── 2. Security headers ────────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── 3. Rate limiting: 200 requests per 15 minutes per IP ──────────────────
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ─── 4. Body parsing ────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── 5. Static files ────────────────────────────────────────────────────────
app.use('/uploads', express.static(uploadsDir));

// ─── 6. Health check ────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
    res.json({ success: true, message: 'Campus Link API is running', version: '1.0.0' });
});

// ─── 7. API Routes ──────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/groups', require('./routes/group.routes'));
app.use('/api/chats', require('./routes/chat.routes'));
app.use('/api/announcements', require('./routes/announcement.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/discussion', require('./routes/discussion.routes'));

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global error handler ────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
    // Surface CORS rejections as 403 instead of a generic 500
    if (err.message && err.message.includes('not allowed by CORS')) {
        return res.status(403).json({ success: false, message: err.message });
    }

    logger.error(err.message, { stack: err.stack, url: req.originalUrl, method: req.method });
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message || 'Internal server error',
    });
});

// Re-export allowedOrigins so Socket.IO can share the same list
app.locals.allowedOrigins = allowedOrigins;

module.exports = app;