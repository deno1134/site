require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  admin: {
    apiKey: process.env.ADMIN_API_KEY || 'admin-api-key-change-this',
    defaultUsername: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
    defaultPassword: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'
  },
  
  database: {
    path: process.env.DB_PATH || './database.sqlite'
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },
  
  license: {
    types: {
      TRIAL: '7d',
      MONTHLY: '30d',
      LIFETIME: null
    },
    statuses: {
      ACTIVE: 'active',
      EXPIRED: 'expired',
      SUSPENDED: 'suspended',
      BANNED: 'banned'
    }
  }
};

module.exports = config;