const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { stopLocalMongo } = connectDB;
const errorHandler = require('./middleware/errorHandler');
const { startReminderScheduler } = require('./services/reminderService');

// Load environment variables
dotenv.config();

const app = express();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('[Security Warning] JWT_SECRET was missing or under 32 characters. Generated an automatic secure secret for this instance.');
    process.env.JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(32).toString('hex');
  } else {
    process.env.JWT_SECRET = 'meditrack_default_dev_secret_key_32_characters_long';
  }
}

// Middleware
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());

const cleanOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);
const allowedOrigins = new Set(cleanOrigins);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const cleanOrigin = origin.trim().replace(/\/+$/, '');

  if (allowedOrigins.has(cleanOrigin) || allowedOrigins.has('*')) {
    return true;
  }

  // Localhost in development/test
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) {
    return true;
  }

  // Support Vercel and Render preview domains matching configured domains
  for (const allowed of allowedOrigins) {
    if (allowed.includes('vercel.app')) {
      try {
        const allowedHost = new URL(allowed).hostname;
        const originHost = new URL(cleanOrigin).hostname;
        const baseName = allowedHost.replace('.vercel.app', '').split('-')[0];
        if (originHost.endsWith('.vercel.app') && originHost.includes(baseName)) {
          return true;
        }
      } catch {}
    }
  }

  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: "${origin}". Configured CLIENT_URL: ${process.env.CLIENT_URL}`);
      callback(new Error('Origin is not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use('/api', (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const origin = req.get('Origin');
  if (origin && !isOriginAllowed(origin)) {
    console.warn(`[Origin Check] Blocked ${req.method} ${req.originalUrl} from origin: "${origin}"`);
    return res.status(403).json({ error: 'Request origin is not allowed' });
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads/profile', express.static(path.join(__dirname, 'uploads/profile'), { dotfiles: 'deny', index: false, maxAge: '1d' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'MediTrack API is running' });
});

// Database readiness guard for functional API routes
app.use('/api', (req, res, next) => {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    connectDB().catch(() => {});
    return res.status(503).json({
      error: 'Database is unavailable or connecting. In MongoDB Atlas (cloud.mongodb.com), go to Network Access and add 0.0.0.0/0 (Allow Access from Anywhere).',
    });
  }
  next();
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api/medication-logs', require('./routes/logRoutes'));
app.use('/api/schedule', require('./routes/scheduleRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/caregiver', require('./routes/caregiverRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/reminders', require('./routes/notificationRoutes'));

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let server;
if (require.main === module) {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MediTrack Server] Running on port ${PORT}`);
  });

  connectDB().then(() => {
    startReminderScheduler();
  }).catch(err => {
    console.error(`[Database] Startup warning: ${err.message}`);
  });
}

const shutdown = () => {
  if (server) server.close(async () => {
    await require('mongoose').connection.close(false);
    await stopLocalMongo();
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = app;
