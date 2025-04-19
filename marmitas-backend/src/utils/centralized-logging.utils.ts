import { createLogger, format, transports, Logger } from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from '../config/app.config.js';
import { logger as baseLogger } from './logger.utils.js';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Centralized Logging Service
 * 
 * Provides centralized logging capabilities with structured logs
 * and multiple transport options for comprehensive audit trail
 */
export class CentralizedLogger {
  private centralLogger: Logger = createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp(),
      format.json()
    ),
    transports: [
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple()
        )
      })
    ]
  });
  
  private initialized = false;
  private readonly serviceName: string;
  private readonly environment: string;

  constructor() {
    this.serviceName = 'marmitas-api';
    this.environment = config.app.nodeEnv;
    this.initializeLogger();
  }

  /**
   * Initialize the centralized logger with appropriate transports
   */
  private initializeLogger() {
    try {
      // Define log format 
      const logFormat = format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        format.errors({ stack: true }),
        format.metadata(),
        format.json()
      );

      // Setup transports
      const logTransports = [
        // Security audit log file for all security events
        new transports.File({
          filename: path.join(logsDir, 'security-audit.log'),
          level: 'info',
          maxsize: 10485760, // 10MB
          maxFiles: 30,
        }),

        // Dedicated audit log file for compliance 
        new transports.File({
          filename: path.join(logsDir, 'audit-trail.log'),
          level: 'info',
          maxsize: 10485760, // 10MB
          maxFiles: 30,
        }),

        // Performance log file for tracking performance metrics
        new transports.File({
          filename: path.join(logsDir, 'performance.log'),
          level: 'info',
          maxsize: 5242880, // 5MB
          maxFiles: 10,
        }),

        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        })
      ];

      // Create centralized logger
      this.centralLogger = createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: logFormat,
        defaultMeta: {
          service: this.serviceName,
          environment: this.environment
        },
        transports: logTransports
      });

      this.initialized = true;
      baseLogger.info('Centralized logging service initialized successfully');
    } catch (error) {
      baseLogger.error('Failed to initialize centralized logging service', { error });
    }
  }

  /**
   * Log security event for audit purposes
   * @param action Security action being performed
   * @param data Additional data about the event
   */
  logSecurityEvent(action: string, data: Record<string, any>) {
    if (!this.initialized) {
      baseLogger.error('Centralized logging service not initialized');
      return;
    }

    this.centralLogger.info(`Security event: ${action}`, {
      ...data,
      eventType: 'security',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log compliance event for audit purposes
   * @param action Compliance action being performed
   * @param data Additional data about the event
   */
  logComplianceEvent(action: string, data: Record<string, any>) {
    if (!this.initialized) {
      baseLogger.error('Centralized logging service not initialized');
      return;
    }

    this.centralLogger.info(`Compliance event: ${action}`, {
      ...data,
      eventType: 'compliance',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log data access event for audit purposes
   * @param action Data access action (read, write, update, delete)
   * @param resource Resource being accessed
   * @param userId User performing the action
   * @param data Additional data about the access
   */
  logDataAccess(action: string, resource: string, userId: string, data: Record<string, any> = {}) {
    if (!this.initialized) {
      baseLogger.error('Centralized logging service not initialized');
      return;
    }

    this.centralLogger.info(`Data access: ${action} on ${resource}`, {
      action,
      resource,
      userId,
      ...data,
      eventType: 'data_access',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log authentication event for audit purposes
   * @param action Authentication action (login, logout, token_refresh, etc.)
   * @param userId User ID (if available)
   * @param data Additional data about the authentication event
   */
  logAuthEvent(action: string, userId: string | null, data: Record<string, any> = {}) {
    if (!this.initialized) {
      baseLogger.error('Centralized logging service not initialized');
      return;
    }

    this.centralLogger.info(`Authentication event: ${action}`, {
      action,
      userId: userId || 'anonymous',
      ...data,
      eventType: 'authentication',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log performance metric for monitoring
   * @param action Performance action being measured
   * @param durationMs Duration in milliseconds
   * @param data Additional performance data
   */
  logPerformance(action: string, durationMs: number, data: Record<string, any> = {}) {
    if (!this.initialized) {
      baseLogger.error('Centralized logging service not initialized');
      return;
    }

    this.centralLogger.info(`Performance: ${action}`, {
      action,
      durationMs,
      ...data,
      eventType: 'performance',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log system event for audit purposes
   * @param action System action being performed
   * @param data Additional data about the event
   */
  logSystemEvent(action: string, data: Record<string, any> = {}) {
    if (!this.initialized) {
      baseLogger.error('Centralized logging service not initialized');
      return;
    }

    this.centralLogger.info(`System event: ${action}`, {
      action,
      ...data,
      eventType: 'system',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check if logging service is properly initialized
   * @returns true if initialized, false otherwise
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  setupElasticsearch(): boolean {
    try {
      this.centralLogger.add(
        new transports.File({
          filename: 'logs/centralized.log',
          level: 'info',
          format: format.combine(
            format.timestamp(),
            format.json()
          )
        })
      );
      
      return true;
    } catch (error) {
      console.error('Failed to setup Elasticsearch transport', error);
      return false;
    }
  }
}

// Export singleton instance
export const centralizedLogger = new CentralizedLogger(); 