import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Supabase configuration
 */
export interface SupabaseConfig {
  url?: string;
  serviceKey?: string;
}

// Verificação de variáveis críticas em ambiente de produção
if (process.env.NODE_ENV === 'production') {
  const criticalEnvVars = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'SUPABASE_SERVICE_KEY',
    'SUPABASE_URL'
  ];
  
  const missingVars = criticalEnvVars.filter(varName => !process.env[varName] || process.env[varName].includes('your_') || process.env[varName] === '${' + varName + '}');
  
  if (missingVars.length > 0) {
    const errorMsg = `Configuração de produção incompleta. Variáveis não definidas corretamente: ${missingVars.join(', ')}`;
    console.error('\x1b[31m%s\x1b[0m', errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Application configuration
 */
export const config = {
  app: {
    port: process.env.PORT || 3000,
    httpsPort: process.env.HTTPS_PORT || 3443,
    nodeEnv: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || '/api',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    httpsEnabled: process.env.HTTPS_ENABLED === 'true',
    forceHttps: process.env.FORCE_HTTPS === 'true'
  },
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET,
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
  },
  security: {
    bcryptSaltRounds: 10,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100, // 100 requests per window
    hstsMaxAge: 31536000, // 1 year in seconds
    hstsIncludeSubDomains: true,
    hstsPreload: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https://storage.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: ["'self'", 'https://*.marmitas.com'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    corsSettings: {
      allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'Origin', 'X-Requested-With'],
      exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
      maxAge: 86400 // 24 hours
    },
    // Data encryption settings
    encryption: {
      enabled: process.env.ENCRYPTION_ENABLED === 'true',
      keyPath: process.env.ENCRYPTION_KEY_PATH,
      keyBackupDir: process.env.ENCRYPTION_KEY_BACKUP_DIR,
      algorithm: 'aes-256-gcm' // Advanced encryption standard with GCM mode
    },
    // Key rotation settings
    keyRotation: {
      enabled: process.env.KEY_ROTATION_ENABLED === 'true' || true,
      keyRotationDays: parseInt(process.env.KEY_ROTATION_DAYS || '90', 10), // Default: 90 days
      automaticRotation: process.env.AUTOMATIC_KEY_ROTATION === 'true' || true
    }
  },
  // WebSocket server configuration
  websocket: {
    path: process.env.WS_PATH || '/ws',
    maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS || '1000', 10),
    maxPayload: process.env.WS_MAX_PAYLOAD || '100kb',
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10), // 30 seconds
    staleConnectionTimeout: parseInt(process.env.WS_STALE_TIMEOUT || '120000', 10), // 2 minutes
    monitoringInterval: parseInt(process.env.WS_MONITORING_INTERVAL || '60000', 10), // 1 minute
    // Security options
    requireAuthentication: process.env.WS_REQUIRE_AUTH === 'true' || false,
    allowAnonymousSubscriptions: process.env.WS_ALLOW_ANON_SUBS === 'true' || true
  },
  // Supabase configuration
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_KEY
  } as SupabaseConfig
};

export default config; 