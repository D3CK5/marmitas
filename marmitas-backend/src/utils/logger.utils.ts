import { createLogger, format, transports } from 'winston';
import fs from 'fs';
import path from 'path';
import { config } from '../config/app.config.js';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log formats
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...rest }) => {
    const restString = Object.keys(rest).length ? 
      `\n${JSON.stringify(rest, null, 2)}` : '';
    return `${timestamp} ${level}: ${message}${restString}`;
  })
);

// Create logger instance
export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'marmitas-api',
    environment: config.app.nodeEnv
  },
  transports: [
    // Write all logs to console
    new transports.Console({
      format: consoleFormat
    }),
    // Write all logs to appropriate files
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Dedicated security audit log file
    new transports.File({
      filename: path.join(logsDir, 'security-audit.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      format: format.combine(
        format.timestamp(),
        format.json()
      )
    })
  ],
  exceptionHandlers: [
    new transports.File({ 
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ],
  rejectionHandlers: [
    new transports.File({ 
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// Create a stream object for Morgan
export const logStream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

export default logger; 