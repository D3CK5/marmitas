import { isDevelopment } from './config';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  prefix: string;
}

/**
 * Default logger configuration
 */
const defaultConfig: LoggerConfig = {
  minLevel: isDevelopment() ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  prefix: '[Marmitas]'
};

/**
 * Logger utility for frontend
 */
class Logger {
  private config: LoggerConfig = { ...defaultConfig };
  
  /**
   * Configure the logger
   * @param config Logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Log a debug message
   * @param message The message to log
   * @param data Additional data to log
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }
  
  /**
   * Log an info message
   * @param message The message to log
   * @param data Additional data to log
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }
  
  /**
   * Log a warning message
   * @param message The message to log
   * @param data Additional data to log
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }
  
  /**
   * Log an error message
   * @param message The message to log
   * @param data Additional data to log
   */
  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }
  
  /**
   * Log a message with the specified level
   * @param level The log level
   * @param message The message to log
   * @param data Additional data to log
   */
  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const formattedMessage = `${this.config.prefix} [${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (this.config.enableConsole) {
      this.logToConsole(level, formattedMessage, data);
    }
  }
  
  /**
   * Check if the message should be logged based on minimum log level
   * @param level The log level to check
   * @returns Whether the message should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const minLevelIndex = levels.indexOf(this.config.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= minLevelIndex;
  }
  
  /**
   * Log a message to the console
   * @param level The log level
   * @param message The formatted message
   * @param data Additional data to log
   */
  private logToConsole(level: LogLevel, message: string, data?: any): void {
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(message, data ?? '');
        break;
      case LogLevel.INFO:
        console.info(message, data ?? '');
        break;
      case LogLevel.WARN:
        console.warn(message, data ?? '');
        break;
      case LogLevel.ERROR:
        console.error(message, data ?? '');
        break;
    }
  }
}

// Export singleton instance
export const logger = new Logger(); 