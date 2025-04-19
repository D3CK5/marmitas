import { centralizedLogger } from '../utils/centralized-logging.utils.js';
import { logger } from '../utils/logger.utils.js';
import { config } from '../config/app.config.js';
import * as nodemailer from 'nodemailer';

/**
 * Security Monitoring Service
 * 
 * Detects security events and anomalies in the application
 * and provides alerting capabilities
 */
export class SecurityMonitoringService {
  private initialized = false;
  private attackPatterns: Map<string, RegExp[]> = new Map();
  private suspiciousIps: Set<string> = new Set();
  private failedLoginAttempts: Map<string, { count: number, lastAttempt: number }> = new Map();
  private emailTransporter: nodemailer.Transporter | null = null;
  
  // Thresholds for alerts
  private readonly FAILED_LOGIN_THRESHOLD = 5;
  private readonly LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private readonly ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
  private lastAlertSent = new Map<string, number>();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the security monitoring service
   */
  private async initialize() {
    try {
      // Load attack patterns
      this.loadAttackPatterns();
      
      // Initialize email transporter if configured
      if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
        this.emailTransporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT, 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: process.env.SMTP_USER ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          } : undefined
        });
      }
      
      // Schedule periodic cleanup of tracking data
      setInterval(() => this.cleanupTrackingData(), 60 * 60 * 1000); // Every hour
      
      this.initialized = true;
      logger.info('Security monitoring service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize security monitoring service', { error });
    }
  }

  /**
   * Load attack pattern signatures from files or configuration
   */
  private loadAttackPatterns() {
    try {
      // SQL Injection patterns
      this.attackPatterns.set('sql-injection', [
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
        /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
        /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
        /exec(\s|\+)+(s|x)p\w+/i,
        /UNION\s+ALL\s+SELECT/i
      ]);
      
      // XSS patterns
      this.attackPatterns.set('xss', [
        /((\%3C)|<)((\%2F)|\/)*[a-z0-9\%]+((\%3E)|>)/i,
        /((\%3C)|<)((\%69)|i|(\%49))((\%6D)|m|(\%4D))((\%67)|g|(\%47))[^\n]+((\%3E)|>)/i,
        /((\%3C)|<)[^\n]+((\%3E)|>)/i,
        /alert\(.*\)/i,
        /javascript:/i,
        /onerror=/i,
        /onload=/i
      ]);
      
      // Path traversal patterns
      this.attackPatterns.set('path-traversal', [
        /\.\.\//i,
        /\.\.\\\\i/,
        /%2e%2e%2f/i,
        /%252e%252e%252f/i,
        /\.\.%2f/i
      ]);
      
      // Command injection patterns
      this.attackPatterns.set('command-injection', [
        /;.*?[|]/i,
        /;.*?&/i,
        /`.*?`/i,
        /\$\(.*?\)/i
      ]);
      
      logger.info('Attack patterns loaded', { 
        patternCount: Array.from(this.attackPatterns.entries())
          .reduce((total, [_, patterns]) => total + patterns.length, 0)
      });
    } catch (error) {
      logger.error('Failed to load attack patterns', { error });
    }
  }

  /**
   * Analyze a HTTP request for security threats
   * @param req Express request object or relevant parts
   */
  analyzeRequest(req: {
    ip: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    query: Record<string, any>;
    body: any;
  }) {
    if (!this.initialized) {
      logger.warn('Security monitoring service not initialized');
      return;
    }
    
    try {
      // Combine request data for analysis
      const requestData = {
        url: req.url,
        queryString: JSON.stringify(req.query),
        body: typeof req.body === 'object' ? JSON.stringify(req.body) : String(req.body || ''),
        userAgent: req.headers['user-agent'] || '',
        referer: req.headers['referer'] || req.headers['referrer'] || '',
        ip: req.ip
      };
      
      // Check for known attack patterns
      const detectedThreats = this.detectThreats(requestData);
      
      // If threats detected, log and alert
      if (detectedThreats.length > 0) {
        const threatData = {
          ip: req.ip,
          method: req.method,
          url: req.url,
          userAgent: req.headers['user-agent'],
          threats: detectedThreats
        };
        
        // Log the security event
        centralizedLogger.logSecurityEvent('threat_detected', threatData);
        
        // Track suspicious IP
        this.suspiciousIps.add(req.ip);
        
        // Send alert if not in cooldown
        this.sendSecurityAlert('SECURITY_THREAT', 'Potential security threat detected', threatData);
      }
    } catch (error) {
      logger.error('Error analyzing request for security threats', { error });
    }
  }

  /**
   * Detect threats in the provided request data
   * @param requestData Request data to analyze
   * @returns Array of detected threat types
   */
  private detectThreats(requestData: Record<string, string>): string[] {
    const detectedThreats: string[] = [];
    
    // Check each attack pattern type
    for (const [threatType, patterns] of this.attackPatterns.entries()) {
      // For each pattern, check all relevant request data
      for (const pattern of patterns) {
        if (
          pattern.test(requestData.url) ||
          pattern.test(requestData.queryString) ||
          pattern.test(requestData.body)
        ) {
          detectedThreats.push(threatType);
          break; // Only add each threat type once
        }
      }
    }
    
    return detectedThreats;
  }

  /**
   * Track and analyze authentication events for suspicious activity
   * @param event Authentication event details
   */
  trackAuthEvent(event: {
    type: 'success' | 'failure';
    userId: string;
    ip: string;
    userAgent: string;
    timestamp: number;
  }) {
    if (!this.initialized) {
      logger.warn('Security monitoring service not initialized');
      return;
    }
    
    try {
      if (event.type === 'failure') {
        const key = `${event.userId}:${event.ip}`;
        const record = this.failedLoginAttempts.get(key) || { count: 0, lastAttempt: 0 };
        
        // Reset count if outside the time window
        if (event.timestamp - record.lastAttempt > this.LOGIN_WINDOW_MS) {
          record.count = 0;
        }
        
        // Increment counter and update timestamp
        record.count++;
        record.lastAttempt = event.timestamp;
        this.failedLoginAttempts.set(key, record);
        
        // Check if threshold exceeded
        if (record.count >= this.FAILED_LOGIN_THRESHOLD) {
          const alertData = {
            userId: event.userId,
            ip: event.ip,
            userAgent: event.userAgent,
            attemptCount: record.count,
            timeWindow: `${this.LOGIN_WINDOW_MS / 60000} minutes`
          };
          
          // Log security event
          centralizedLogger.logSecurityEvent('brute_force_attempt', alertData);
          
          // Add to suspicious IPs
          this.suspiciousIps.add(event.ip);
          
          // Send alert
          this.sendSecurityAlert(
            'BRUTE_FORCE', 
            `Possible brute force attack: ${record.count} failed login attempts`,
            alertData
          );
        }
      } else {
        // Successful login - check if from suspicious IP
        if (this.suspiciousIps.has(event.ip)) {
          const alertData = {
            userId: event.userId,
            ip: event.ip,
            userAgent: event.userAgent,
            timestamp: new Date(event.timestamp).toISOString()
          };
          
          // Log security event
          centralizedLogger.logSecurityEvent('login_from_suspicious_ip', alertData);
          
          // Send alert
          this.sendSecurityAlert(
            'SUSPICIOUS_LOGIN',
            `Login from previously flagged suspicious IP address`,
            alertData
          );
        }
      }
    } catch (error) {
      logger.error('Error tracking authentication event', { error, event });
    }
  }

  /**
   * Track and analyze user activity for suspicious patterns
   * @param event User activity event details
   */
  trackUserActivity(event: {
    userId: string;
    action: string;
    resource: string;
    ip: string;
    timestamp: number;
  }) {
    if (!this.initialized) {
      logger.warn('Security monitoring service not initialized');
      return;
    }
    
    try {
      // Additional user activity monitoring could be implemented here
      // For example, detecting unusual access patterns or data exfiltration
      
      // For now, just log the activity for audit purposes
      centralizedLogger.logDataAccess(
        event.action,
        event.resource,
        event.userId,
        {
          ip: event.ip,
          timestamp: new Date(event.timestamp).toISOString()
        }
      );
    } catch (error) {
      logger.error('Error tracking user activity', { error, event });
    }
  }

  /**
   * Send a security alert through configured channels
   * @param alertType Type of security alert
   * @param message Human-readable alert message
   * @param data Alert details
   */
  private async sendSecurityAlert(alertType: string, message: string, data: Record<string, any>) {
    try {
      // Check alert cooldown to prevent alert flooding
      const alertKey = `${alertType}:${JSON.stringify(data)}`;
      const lastSent = this.lastAlertSent.get(alertKey) || 0;
      const now = Date.now();
      
      if (now - lastSent < this.ALERT_COOLDOWN_MS) {
        logger.debug('Skipping alert due to cooldown', { alertType, timeSinceLastAlert: now - lastSent });
        return;
      }
      
      // Update last sent timestamp
      this.lastAlertSent.set(alertKey, now);
      
      // Log the alert
      logger.warn(`SECURITY ALERT: ${message}`, { alertType, ...data });
      
      // Send email alert if configured
      if (this.emailTransporter && process.env.SECURITY_ALERT_EMAIL) {
        await this.emailTransporter.sendMail({
          from: process.env.SMTP_FROM || 'security@marmitas.com',
          to: process.env.SECURITY_ALERT_EMAIL,
          subject: `[SECURITY ALERT] ${alertType}: ${message}`,
          text: `
Security Alert: ${alertType}
Message: ${message}
Time: ${new Date().toISOString()}
Environment: ${config.app.nodeEnv}

Details:
${JSON.stringify(data, null, 2)}
`,
          html: `
<h2>Security Alert: ${alertType}</h2>
<p><strong>Message:</strong> ${message}</p>
<p><strong>Time:</strong> ${new Date().toISOString()}</p>
<p><strong>Environment:</strong> ${config.app.nodeEnv}</p>

<h3>Details:</h3>
<pre>${JSON.stringify(data, null, 2)}</pre>
`
        });
        
        logger.info('Security alert email sent', { alertType, recipient: process.env.SECURITY_ALERT_EMAIL });
      }
      
      // Additional alert channels could be implemented here
      // For example, SMS, Slack, PagerDuty, etc.
      
    } catch (error) {
      logger.error('Failed to send security alert', { error, alertType, message });
    }
  }

  /**
   * Periodically clean up tracking data to prevent memory leaks
   */
  private cleanupTrackingData() {
    try {
      const now = Date.now();
      
      // Clean up failed login attempts older than the time window
      for (const [key, record] of this.failedLoginAttempts.entries()) {
        if (now - record.lastAttempt > this.LOGIN_WINDOW_MS) {
          this.failedLoginAttempts.delete(key);
        }
      }
      
      // Clean up alert cooldown entries older than the cooldown period
      for (const [key, timestamp] of this.lastAlertSent.entries()) {
        if (now - timestamp > this.ALERT_COOLDOWN_MS) {
          this.lastAlertSent.delete(key);
        }
      }
      
      // Log cleanup results
      logger.debug('Cleaned up security monitoring tracking data', {
        remainingFailedLoginEntries: this.failedLoginAttempts.size,
        remainingAlertCooldownEntries: this.lastAlertSent.size
      });
      
    } catch (error) {
      logger.error('Error cleaning up security monitoring tracking data', { error });
    }
  }

  /**
   * Check if security monitoring service is properly initialized
   * @returns true if initialized, false otherwise
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const securityMonitoringService = new SecurityMonitoringService(); 