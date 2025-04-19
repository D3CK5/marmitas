import { centralizedLogger } from '../utils/centralized-logging.utils.js';
import { logger } from '../utils/logger.utils.js';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Configurações para compliance
const complianceConfig = {
  complianceOfficerEmail: process.env.COMPLIANCE_OFFICER_EMAIL || 'compliance@marmitas.com',
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD
  }
};

/**
 * Compliance Service
 * 
 * Implements compliance framework functionalities including:
 * - Data retention policies
 * - Privacy checkpoints
 * - Compliance reporting
 * - Audit trail management
 */
class ComplianceService {
  private retentionPolicies: Map<string, number>;
  private emailTransporter: nodemailer.Transporter | null = null;
  private complianceOfficerEmail: string;
  private auditLogPath: string;
  
  constructor() {
    // Initialize data retention policies (in days)
    this.retentionPolicies = new Map<string, number>([
      ['user', 365 * 7], // 7 years for user data
      ['order', 365 * 5], // 5 years for order data
      ['payment', 365 * 5], // 5 years for payment data
      ['logs', 365 * 2], // 2 years for logs
      ['sessions', 90], // 90 days for session data
      ['temporary', 30], // 30 days for temporary data
    ]);
    
    this.complianceOfficerEmail = complianceConfig.complianceOfficerEmail;
    this.auditLogPath = path.join(process.cwd(), 'logs', 'audit-trail.log');
    
    // Initialize email transporter if SMTP config exists
    if (complianceConfig.smtp && complianceConfig.smtp.host) {
      this.emailTransporter = nodemailer.createTransport({
        host: complianceConfig.smtp.host,
        port: complianceConfig.smtp.port,
        secure: complianceConfig.smtp.secure,
        auth: {
          user: complianceConfig.smtp.user,
          pass: complianceConfig.smtp.password
        }
      });
    }
    
    logger.info('Compliance service initialized');
  }
  
  /**
   * Check if data should be retained based on data type and creation date
   * @param dataType Type of data
   * @param createdAt Creation date
   * @returns Boolean indicating if data should be retained
   */
  public shouldRetainData(dataType: string, createdAt: Date): boolean {
    const retentionDays = this.retentionPolicies.get(dataType) || 0;
    if (retentionDays === 0) {
      return true; // If no policy exists, retain by default
    }
    
    const retentionMilliseconds = retentionDays * 24 * 60 * 60 * 1000;
    const expiryDate = new Date(createdAt.getTime() + retentionMilliseconds);
    
    return expiryDate > new Date();
  }
  
  /**
   * Execute data retention cleanup
   * @param dataType Type of data to clean
   * @param cleanupFn Function to execute cleanup
   */
  public async executeRetentionPolicy(
    dataType: string, 
    cleanupFn: () => Promise<number>
  ): Promise<void> {
    try {
      const itemsRemoved = await cleanupFn();
      
      logger.info(`Retention policy executed for ${dataType}`, { itemsRemoved });
      centralizedLogger.logComplianceEvent(
        'retention_policy_executed',
        {
          message: `Removed ${itemsRemoved} expired ${dataType} items`
        }
      );
    } catch (error) {
      logger.error(`Error executing retention policy for ${dataType}`, { error });
      
      // Send alert to compliance officer
      this.sendComplianceAlert(
        'Retention Policy Failure',
        `Failed to execute retention policy for ${dataType}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Log data access for compliance purposes
   * @param userId User ID accessing data
   * @param dataType Type of data accessed
   * @param dataId ID of accessed data
   * @param action Action performed (read, write, delete)
   * @param reason Reason for access
   */
  public logDataAccess(
    userId: string,
    dataType: string,
    dataId: string,
    action: 'read' | 'write' | 'delete',
    reason?: string
  ): void {
    centralizedLogger.logDataAccess(action, `${dataType}/${dataId}`, userId, { reason });
  }
  
  /**
   * Generate compliance report
   * @param reportType Type of report
   * @param startDate Start date for report
   * @param endDate End date for report
   * @returns Path to generated report file
   */
  public async generateComplianceReport(
    reportType: 'data_access' | 'security_events' | 'retention' | 'full',
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    try {
      logger.info(`Generating ${reportType} compliance report`, { startDate, endDate });
      
      // Read audit log data
      const auditData = await this.readAuditLogData(startDate, endDate);
      
      // Filter data based on report type
      let filteredData: any[] = [];
      switch (reportType) {
        case 'data_access':
          filteredData = auditData.filter(entry => entry.eventType === 'data_access');
          break;
        case 'security_events':
          filteredData = auditData.filter(entry => 
            entry.eventType === 'security_event' || entry.eventType === 'auth_event'
          );
          break;
        case 'retention':
          filteredData = auditData.filter(entry => entry.eventType === 'retention');
          break;
        case 'full':
          filteredData = auditData;
          break;
      }
      
      // Generate report file
      const reportFilename = `compliance_${reportType}_${new Date().toISOString().slice(0,10)}.json`;
      const reportPath = path.join(process.cwd(), 'reports', reportFilename);
      
      // Ensure reports directory exists
      fs.mkdirSync(path.join(process.cwd(), 'reports'), { recursive: true });
      
      // Write report to file
      fs.writeFileSync(reportPath, JSON.stringify(filteredData, null, 2));
      
      // Log report generation
      centralizedLogger.logComplianceEvent(
        'report_generated',
        {
          message: `Generated ${reportType} compliance report for ${startDate.toISOString()} to ${endDate.toISOString()}`
        }
      );
      
      return reportPath;
    } catch (error) {
      logger.error('Error generating compliance report', { error, reportType });
      throw new Error(`Failed to generate compliance report: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Send compliance alert to compliance officer
   * @param subject Email subject
   * @param message Email message
   */
  public async sendComplianceAlert(subject: string, message: string): Promise<void> {
    if (!this.emailTransporter) {
      logger.warn('Email transporter not configured, cannot send compliance alert');
      return;
    }
    
    try {
      await this.emailTransporter.sendMail({
        from: `"Compliance System" <${complianceConfig.smtp?.user}>`,
        to: this.complianceOfficerEmail,
        subject: `[COMPLIANCE ALERT] ${subject}`,
        text: message,
        html: `<p>${message}</p>`
      });
      
      logger.info('Sent compliance alert', { subject });
    } catch (error) {
      logger.error('Failed to send compliance alert', { error, subject });
    }
  }
  
  /**
   * Read audit log data
   * @param startDate Start date for filtering
   * @param endDate End date for filtering
   * @returns Array of audit log entries
   */
  private async readAuditLogData(startDate: Date, endDate: Date): Promise<any[]> {
    if (!fs.existsSync(this.auditLogPath)) {
      return [];
    }
    
    const logContent = fs.readFileSync(this.auditLogPath, 'utf8');
    const lines = logContent.split('\n').filter(Boolean);
    
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    
    return lines
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      })
      .filter(entry => entry && entry.timestamp)
      .filter(entry => {
        const entryTime = new Date(entry.timestamp).getTime();
        return entryTime >= startTime && entryTime <= endTime;
      });
  }
  
  /**
   * Check privacy compliance for a user operation
   * @param operation Type of operation
   * @param data Data being processed
   * @returns Boolean indicating if operation complies with privacy policies
   */
  public checkPrivacyCompliance(
    operation: 'collect' | 'process' | 'share' | 'delete',
    data: { 
      dataTypes: string[], 
      purpose: string, 
      userConsent: boolean 
    }
  ): boolean {
    const { dataTypes, purpose, userConsent } = data;
    
    // Log the privacy check
    centralizedLogger.logComplianceEvent(
      'privacy_check',
      {
        operation,
        purpose,
        dataTypes
      }
    );
    
    // Enforce privacy rules
    if (!userConsent) {
      return false;
    }
    
    // Check for sensitive data types that require special handling
    const sensitiveTypes = dataTypes.filter(type => 
      ['health', 'financial', 'location', 'biometric'].includes(type)
    );
    
    // Special handling for sharing operations
    if (operation === 'share' && sensitiveTypes.length > 0) {
      // Log special handling of sensitive data
      centralizedLogger.logComplianceEvent(
        'sensitive_data_shared',
        {
          sensitiveTypes: sensitiveTypes.join(', '),
          operation,
          purpose
        }
      );
      
      // For actual implementation, additional checks would be done here
      // based on specific regulatory requirements
    }
    
    return true;
  }
}

export const complianceService = new ComplianceService(); 