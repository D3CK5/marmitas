import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { apiRoutes } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { config } from './config/app.config.js';
import { jwtService } from './services/jwt.service.js';
import { httpsConfig } from './config/https.config.js';
import { apiGateway } from './config/api-gateway.config.js';
import { logger, logStream } from './utils/logger.utils.js';
import { securityHeaders } from './middleware/security.middleware.js';
import { v4 as uuidv4 } from 'uuid';
import { websocketService } from './services/websocket.service.js';
import { websocketAuthService } from './services/websocket-auth.service.js';
import { websocketConnectionService } from './services/websocket-connection.service.js';
import { websocketSubscriptionService } from './services/websocket-subscription.service.js';
import { websocketSubscriptionStorageService } from './services/websocket-subscription-storage.service.js';
import { websocketSubscriptionHandlersService } from './services/websocket-subscription-handlers.service.js';

// Load environment variables
dotenv.config();

// Create Express server
const app = express();
const httpPort = config.app.port;
const httpsPort = config.app.httpsPort;

// Add request ID to each request
app.use((req, res, next) => {
  const requestId = uuidv4();
  res.setHeader('X-Request-ID', requestId);
  next();
});

// Security middleware
app.use(helmet({
  // Configure Content Security Policy
  contentSecurityPolicy: {
    directives: config.security.contentSecurityPolicy.directives
  },
  // Configure HTTP Strict Transport Security
  hsts: {
    maxAge: config.security.hstsMaxAge,
    includeSubDomains: config.security.hstsIncludeSubDomains,
    preload: config.security.hstsPreload
  },
  // Prevent iframe embedding
  frameguard: { action: 'deny' },
  // Enable XSS protection
  xssFilter: true,
  // No sniffing MIME types
  noSniff: true
}));

// Apply security headers directly for more control
app.use(securityHeaders);

// CORS configuration
app.use(cors({
  origin: config.app.corsOrigin,
  credentials: config.security.corsSettings.credentials,
  methods: config.security.corsSettings.methods,
  allowedHeaders: config.security.corsSettings.allowedHeaders,
  exposedHeaders: [
    ...config.security.corsSettings.exposedHeaders,
    'X-Request-ID' // Add Request ID to exposed headers
  ],
  maxAge: config.security.corsSettings.maxAge
}));

// Parse JSON request bodies with size limit
app.use(express.json({ limit: '1mb' }));

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Parse cookies
app.use(cookieParser());

// Enhanced request logging
app.use(morgan('combined', {
  stream: logStream,
  skip: (req) => req.url === '/health' // Skip health check logs
}));

// Force HTTPS in production
if (config.app.forceHttps) {
  app.use((req, res, next) => {
    if (req.secure) {
      next();
    } else {
      // Redirect to HTTPS
      const httpsUrl = `https://${req.hostname}:${httpsPort}${req.url}`;
      res.redirect(httpsUrl);
    }
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.app.nodeEnv,
    https: Boolean(req.secure)
  });
});

// Initialize API Gateway
const apiRouter = apiGateway.initialize();

// Register routes with API Gateway
apiGateway.registerRoute('/', apiRoutes, {
  description: 'Main API routes'
});

// Use API Gateway for all API routes
app.use(config.app.apiPrefix, apiRouter);

// WebSocket metrics endpoint
app.get(`${config.app.apiPrefix}/websocket-metrics`, (req, res) => {
  const metrics = {
    connections: websocketConnectionService.getMetrics(),
    subscriptions: websocketSubscriptionService.getMetrics(),
    storage: websocketSubscriptionStorageService.getStats(),
    handlers: websocketSubscriptionHandlersService.getStats(),
    timestamp: new Date().toISOString()
  };
  
  res.status(200).json(metrics);
});

// Not found handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Clean expired refresh tokens periodically
setInterval(() => {
  jwtService.cleanupExpiredTokens();
}, 1000 * 60 * 60); // Clean up every hour

// Start HTTP server
const httpServer = app.listen(httpPort, () => {
  logger.info(`HTTP server running on port ${httpPort}`, {
    environment: config.app.nodeEnv,
    port: httpPort
  });
  
  // Initialize WebSocket server with the HTTP server
  websocketService.initialize(httpServer);
  websocketAuthService.initialize();
  websocketConnectionService.initialize();
  
  // Initialize WebSocket subscription services
  websocketSubscriptionStorageService.initialize();
  websocketSubscriptionService.initialize();
  websocketSubscriptionHandlersService.initialize();
  
  logger.info('WebSocket server started and ready to accept connections', {
    path: config.websocket?.path || '/ws'
  });
});

// Start HTTPS server if enabled
if (config.app.httpsEnabled) {
  const httpsServer = httpsConfig.createServer(app);
  
  if (httpsServer) {
    httpsServer.listen(httpsPort, () => {
      logger.info(`HTTPS server running on port ${httpsPort}`, {
        environment: config.app.nodeEnv,
        port: httpsPort,
        tlsVersion: '1.3'
      });
      
      // Initialize WebSocket server with the HTTPS server too
      websocketService.initialize(httpsServer);
      
      logger.info('WebSocket server also attached to HTTPS server', {
        path: config.websocket?.path || '/ws'
      });
    });
  } else {
    logger.error('HTTPS server could not be started. Check certificate configuration.');
  }
}

// Handle graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown`);
  
  // Shutdown WebSocket services
  websocketConnectionService.shutdown();
  websocketService.shutdown();
  
  // Close HTTP server
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  
  // Force close after timeout
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT')); 