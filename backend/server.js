const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import configurations and middlewares
const config = require('./config/config');
const database = require('./config/database');
const { apiLimiter } = require('./middlewares/rateLimiter');
const { apiResponse } = require('./utils/helpers');

// Import routes
const licenseRoutes = require('./routes/licenseRoutes');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Add your frontend domains
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (config.server.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use('/api', apiLimiter);

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json(
    apiResponse(true, 'License System API is running', {
      version: '1.0.0',
      environment: config.server.env,
      timestamp: new Date().toISOString()
    })
  );
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json(
    apiResponse(true, 'API is healthy', {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    })
  );
});

// API routes
app.use('/api', licenseRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json(
    apiResponse(false, 'Endpoint not found', {
      path: req.originalUrl,
      method: req.method
    })
  );
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  
  // Don't leak error details in production
  const errorMessage = config.server.env === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(err.status || 500).json(
    apiResponse(false, errorMessage, 
      config.server.env === 'development' ? { stack: err.stack } : null
    )
  );
});

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close database connection
    database.close();
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const PORT = config.server.port;
const server = app.listen(PORT, () => {
  console.log(`
🚀 License System API Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 Environment: ${config.server.env}
🔗 Server URL: http://localhost:${PORT}
📊 API Status: http://localhost:${PORT}/api/status
🔑 Admin API Key: ${config.admin.apiKey}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Available Endpoints:
   POST /api/verify           - Verify license (Public)
   POST /api/create           - Create license (Admin)
   POST /api/reset-hwid       - Reset HWID (Admin)
   GET  /api/licenses         - Get all licenses (Admin)
   GET  /api/license/:key     - Get license details (Admin)
   PUT  /api/license/:key/status - Update license status (Admin)
   DELETE /api/license/:key   - Delete license (Admin)

🔒 Admin endpoints require X-API-Key header: ${config.admin.apiKey}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

module.exports = app;