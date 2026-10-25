const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { startReminderScheduler } = require('./services/reminderService');

// Load environment variables
dotenv.config();

const app = express();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters');
}

// Middleware
app.disable('x-powered-by');
app.use(helmet());
const allowedOrigins = new Set((process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(origin => origin.trim()));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origin is not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use('/api', (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const origin = req.get('Origin');
  if (origin && !allowedOrigins.has(origin)) return res.status(403).json({ error: 'Request origin is not allowed' });
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
  connectDB().then(() => {
    startReminderScheduler();
    server = app.listen(PORT, () => console.log(`[MediTrack Server] Running on port ${PORT}`));
  }).catch(err => {
    console.error(`[Database] Startup failed: ${err.message}`);
    process.exitCode = 1;
  });
}

const shutdown = () => {
  if (server) server.close(() => require('mongoose').connection.close(false).finally(() => process.exit(0)));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = app;
