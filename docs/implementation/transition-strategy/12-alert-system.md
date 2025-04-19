# Alert System Implementation

## Overview
This document outlines the implementation of a comprehensive alert system for rapid detection of issues during the frontend-backend separation transition. The alert system enables timely responses to problems, minimizing the impact on users and business operations.

## Alert System Architecture

### Core Components
The alert system architecture consists of the following key components:

1. **Alert Manager**: Central coordination of alerts
2. **Alert Rules Engine**: Defines and evaluates alert conditions
3. **Notification Service**: Delivers alerts through various channels
4. **Escalation Manager**: Handles alert escalations based on severity
5. **Alert Dashboard**: Visualizes active and historical alerts

## Alert Manager Implementation

```typescript
// alert-manager.ts
export interface AlertDefinition {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'availability' | 'performance' | 'error' | 'business' | 'security';
  sources: Array<'legacy' | 'new' | 'both'>;
  conditions: AlertCondition[];
  throttling?: {
    period: string; // e.g., "5m", "1h"
    maxAlerts: number;
  };
}

export interface AlertCondition {
  type: 'threshold' | 'absence' | 'rate_of_change' | 'anomaly';
  metric?: string;
  query?: string;
  operator?: '>' | '>=' | '<' | '<=' | '==' | '!=';
  threshold?: number;
  duration?: string; // e.g., "5m", "1h"
  parameters?: Record<string, any>;
}

export interface Alert {
  id: string;
  definitionId: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'availability' | 'performance' | 'error' | 'business' | 'security';
  source: 'legacy' | 'new' | 'both';
  status: 'active' | 'acknowledged' | 'resolved';
  value?: number;
  condition: AlertCondition;
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export class AlertManager {
  private definitions: Map<string, AlertDefinition> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private notificationService: NotificationService;
  private escalationManager: EscalationManager;
  
  constructor(
    notificationService: NotificationService,
    escalationManager: EscalationManager
  ) {
    this.notificationService = notificationService;
    this.escalationManager = escalationManager;
  }
  
  registerAlertDefinition(definition: AlertDefinition): void {
    this.definitions.set(definition.id, definition);
  }
  
  getAlertDefinition(id: string): AlertDefinition | undefined {
    return this.definitions.get(id);
  }
  
  getAllAlertDefinitions(): AlertDefinition[] {
    return Array.from(this.definitions.values());
  }
  
  createAlert(
    definitionId: string,
    source: 'legacy' | 'new' | 'both',
    value: number,
    metadata?: Record<string, any>
  ): Alert | null {
    const definition = this.definitions.get(definitionId);
    if (!definition) {
      throw new Error(`Alert definition ${definitionId} not found`);
    }
    
    // Check if alert is throttled
    if (this.isThrottled(definitionId)) {
      console.log(`Alert ${definitionId} throttled, skipping creation`);
      return null;
    }
    
    // Create new alert
    const alertId = `alert-${definitionId}-${Date.now()}`;
    const alert: Alert = {
      id: alertId,
      definitionId,
      name: definition.name,
      description: definition.description,
      severity: definition.severity,
      category: definition.category,
      source,
      status: 'active',
      value,
      condition: definition.conditions[0], // Simplified for documentation
      createdAt: new Date(),
      metadata
    };
    
    // Store alert
    this.activeAlerts.set(alertId, alert);
    
    // Trigger notifications
    this.notifyAlert(alert);
    
    // Check if escalation is needed based on severity
    if (alert.severity === 'critical' || alert.severity === 'high') {
      this.escalationManager.escalateAlert(alert);
    }
    
    return alert;
  }
  
  acknowledgeAlert(alertId: string, userId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert || alert.status === 'resolved') return false;
    
    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;
    
    this.activeAlerts.set(alertId, alert);
    
    // Notify acknowledgment
    this.notificationService.notifyAlertUpdate(alert);
    
    return true;
  }
  
  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;
    
    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    
    // Move to historical storage in a real implementation
    this.activeAlerts.delete(alertId);
    
    // Notify resolution
    this.notificationService.notifyAlertUpdate(alert);
    
    return true;
  }
  
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values())
      .filter(a => a.status === 'active' || a.status === 'acknowledged');
  }
  
  getActiveAlertsByDefinition(definitionId: string): Alert[] {
    return this.getActiveAlerts()
      .filter(a => a.definitionId === definitionId);
  }
  
  private isThrottled(definitionId: string): boolean {
    const definition = this.definitions.get(definitionId);
    if (!definition || !definition.throttling) return false;
    
    const { period, maxAlerts } = definition.throttling;
    
    // Parse throttling period
    const match = period.match(/^(\d+)([mhd])$/);
    if (!match) return false;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    let milliseconds = 0;
    
    // Convert to milliseconds
    switch (unit) {
      case 'm': milliseconds = value * 60 * 1000; break;
      case 'h': milliseconds = value * 60 * 60 * 1000; break;
      case 'd': milliseconds = value * 24 * 60 * 60 * 1000; break;
    }
    
    // Calculate time threshold
    const threshold = new Date(Date.now() - milliseconds);
    
    // Count alerts in the throttling period
    const recentAlerts = Array.from(this.activeAlerts.values())
      .filter(a => a.definitionId === definitionId && a.createdAt > threshold);
    
    return recentAlerts.length >= maxAlerts;
  }
  
  private notifyAlert(alert: Alert): void {
    this.notificationService.notifyNewAlert(alert);
  }
}
```

## Alert Rules Engine Implementation

```typescript
// alert-rules-engine.ts
export class AlertRulesEngine {
  private metricService: MetricService;
  private alertManager: AlertManager;
  private evaluationIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  constructor(
    metricService: MetricService,
    alertManager: AlertManager
  ) {
    this.metricService = metricService;
    this.alertManager = alertManager;
  }
  
  startEvaluation(): void {
    // Start evaluation for all alert definitions
    for (const definition of this.alertManager.getAllAlertDefinitions()) {
      this.startAlertEvaluation(definition);
    }
  }
  
  stopEvaluation(): void {
    // Stop all evaluation intervals
    for (const interval of this.evaluationIntervals.values()) {
      clearInterval(interval);
    }
    this.evaluationIntervals.clear();
  }
  
  startAlertEvaluation(definition: AlertDefinition): void {
    // Stop existing evaluation if running
    if (this.evaluationIntervals.has(definition.id)) {
      clearInterval(this.evaluationIntervals.get(definition.id));
    }
    
    // Determine evaluation interval (default: 1 minute)
    const interval = this.getEvaluationInterval(definition);
    
    // Start new evaluation interval
    const timer = setInterval(() => {
      this.evaluateAlertDefinition(definition);
    }, interval);
    
    this.evaluationIntervals.set(definition.id, timer);
  }
  
  private getEvaluationInterval(definition: AlertDefinition): number {
    // Parse the shortest duration from conditions to determine evaluation frequency
    let shortestDuration = 60000; // Default: 1 minute
    
    for (const condition of definition.conditions) {
      if (condition.duration) {
        const durationMs = this.parseDuration(condition.duration);
        shortestDuration = Math.min(shortestDuration, durationMs / 5); // Evaluate at 1/5 of duration
      }
    }
    
    // Ensure reasonable limits (minimum 5 seconds, maximum 5 minutes)
    return Math.min(Math.max(shortestDuration, 5000), 300000);
  }
  
  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 60000; // Default: 1 minute
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 60000;
    }
  }
  
  async evaluateAlertDefinition(definition: AlertDefinition): Promise<void> {
    for (const source of definition.sources) {
      for (const condition of definition.conditions) {
        try {
          const result = await this.evaluateCondition(condition, source);
          
          if (result.triggered) {
            // Create alert
            this.alertManager.createAlert(
              definition.id,
              source,
              result.value,
              result.metadata
            );
          }
        } catch (error) {
          console.error(`Error evaluating condition for alert ${definition.id}:`, error);
        }
      }
    }
  }
  
  private async evaluateCondition(
    condition: AlertCondition,
    source: 'legacy' | 'new' | 'both'
  ): Promise<{
    triggered: boolean;
    value: number;
    metadata?: Record<string, any>;
  }> {
    switch (condition.type) {
      case 'threshold':
        return this.evaluateThresholdCondition(condition, source);
      case 'absence':
        return this.evaluateAbsenceCondition(condition, source);
      case 'rate_of_change':
        return this.evaluateRateOfChangeCondition(condition, source);
      case 'anomaly':
        return this.evaluateAnomalyCondition(condition, source);
      default:
        throw new Error(`Unsupported condition type: ${(condition as any).type}`);
    }
  }
  
  private async evaluateThresholdCondition(
    condition: AlertCondition,
    source: 'legacy' | 'new' | 'both'
  ): Promise<{ triggered: boolean; value: number; metadata?: Record<string, any> }> {
    if (!condition.metric || !condition.operator || condition.threshold === undefined) {
      throw new Error('Invalid threshold condition: missing required fields');
    }
    
    // Get metric value
    const value = await this.metricService.getMetricValue(condition.metric, source);
    
    // Evaluate condition
    let triggered = false;
    switch (condition.operator) {
      case '>': triggered = value > condition.threshold; break;
      case '>=': triggered = value >= condition.threshold; break;
      case '<': triggered = value < condition.threshold; break;
      case '<=': triggered = value <= condition.threshold; break;
      case '==': triggered = value === condition.threshold; break;
      case '!=': triggered = value !== condition.threshold; break;
    }
    
    return {
      triggered,
      value,
      metadata: {
        threshold: condition.threshold,
        operator: condition.operator
      }
    };
  }
  
  // Other condition evaluators would be implemented similarly
  private async evaluateAbsenceCondition(
    condition: AlertCondition,
    source: 'legacy' | 'new' | 'both'
  ): Promise<{ triggered: boolean; value: number; metadata?: Record<string, any> }> {
    // Simplified implementation for documentation
    return { triggered: false, value: 0 };
  }
  
  private async evaluateRateOfChangeCondition(
    condition: AlertCondition,
    source: 'legacy' | 'new' | 'both'
  ): Promise<{ triggered: boolean; value: number; metadata?: Record<string, any> }> {
    // Simplified implementation for documentation
    return { triggered: false, value: 0 };
  }
  
  private async evaluateAnomalyCondition(
    condition: AlertCondition,
    source: 'legacy' | 'new' | 'both'
  ): Promise<{ triggered: boolean; value: number; metadata?: Record<string, any> }> {
    // Simplified implementation for documentation
    return { triggered: false, value: 0 };
  }
}

// Interface for metric service (simplified)
interface MetricService {
  getMetricValue(metric: string, source: 'legacy' | 'new' | 'both'): Promise<number>;
}
```

## Notification Service Implementation

```typescript
// notification-service.ts
export interface NotificationConfig {
  channels: {
    email?: {
      smtpServer: string;
      from: string;
    };
    slack?: {
      webhookUrl: string;
      channel: string;
    };
    sms?: {
      provider: string;
      apiKey: string;
    };
    pagerDuty?: {
      serviceKey: string;
    };
  };
}

export interface NotificationTarget {
  type: 'user' | 'team' | 'channel';
  id: string;
}

export type NotificationChannel = 'email' | 'slack' | 'sms' | 'pagerDuty';

export interface NotificationRequest {
  recipient: NotificationTarget;
  channel: NotificationChannel;
  subject: string;
  message: string;
  details?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  recipient: string;
  error?: string;
  timestamp: Date;
}

export class NotificationService {
  private config: NotificationConfig;
  
  constructor(config: NotificationConfig) {
    this.config = config;
  }
  
  async notifyNewAlert(alert: Alert): Promise<NotificationResult[]> {
    // In a real implementation, this would determine recipients based on alert properties
    // For documentation purposes, we'll use a simplified approach
    
    const results: NotificationResult[] = [];
    
    // Determine notification channels based on severity
    const channels: NotificationChannel[] = [];
    switch (alert.severity) {
      case 'critical':
        channels.push('email', 'slack', 'sms', 'pagerDuty');
        break;
      case 'high':
        channels.push('email', 'slack', 'pagerDuty');
        break;
      case 'medium':
        channels.push('email', 'slack');
        break;
      case 'low':
        channels.push('slack');
        break;
    }
    
    // Send notifications through each channel
    for (const channel of channels) {
      try {
        await this.sendNotification({
          recipient: { type: 'team', id: 'ops-team' },
          channel,
          subject: `[${alert.severity.toUpperCase()}] ${alert.name}`,
          message: alert.description,
          details: {
            alertId: alert.id,
            value: alert.value,
            timestamp: alert.createdAt,
            source: alert.source
          }
        });
        
        results.push({
          success: true,
          channel,
          recipient: 'ops-team',
          timestamp: new Date()
        });
      } catch (error) {
        results.push({
          success: false,
          channel,
          recipient: 'ops-team',
          error: String(error),
          timestamp: new Date()
        });
      }
    }
    
    return results;
  }
  
  async notifyAlertUpdate(alert: Alert): Promise<NotificationResult[]> {
    // Simplified implementation for alert updates
    return [];
  }
  
  async sendNotification(
    request: NotificationRequest
  ): Promise<void> {
    switch (request.channel) {
      case 'email':
        await this.sendEmailNotification(request);
        break;
      case 'slack':
        await this.sendSlackNotification(request);
        break;
      case 'sms':
        await this.sendSmsNotification(request);
        break;
      case 'pagerDuty':
        await this.sendPagerDutyNotification(request);
        break;
      default:
        throw new Error(`Unsupported notification channel: ${request.channel}`);
    }
  }
  
  private async sendEmailNotification(request: NotificationRequest): Promise<void> {
    // In a real implementation, this would send an email
    // For documentation purposes, we log the action
    console.log(`Sending email notification to ${request.recipient.id}`);
    console.log(`Subject: ${request.subject}`);
    console.log(`Message: ${request.message}`);
  }
  
  private async sendSlackNotification(request: NotificationRequest): Promise<void> {
    // In a real implementation, this would post to Slack
    // For documentation purposes, we log the action
    console.log(`Sending Slack notification to ${request.recipient.id}`);
    console.log(`Message: ${request.subject} - ${request.message}`);
  }
  
  private async sendSmsNotification(request: NotificationRequest): Promise<void> {
    // In a real implementation, this would send an SMS
    // For documentation purposes, we log the action
    console.log(`Sending SMS notification to ${request.recipient.id}`);
    console.log(`Message: ${request.subject} - ${request.message}`);
  }
  
  private async sendPagerDutyNotification(request: NotificationRequest): Promise<void> {
    // In a real implementation, this would create a PagerDuty incident
    // For documentation purposes, we log the action
    console.log(`Creating PagerDuty incident for ${request.recipient.id}`);
    console.log(`Summary: ${request.subject}`);
    console.log(`Details: ${request.message}`);
  }
}
```

## Escalation Manager Implementation

```typescript
// escalation-manager.ts
export interface EscalationPolicy {
  id: string;
  name: string;
  description: string;
  levels: EscalationLevel[];
}

export interface EscalationLevel {
  level: number;
  delay: string; // e.g., "15m", "1h"
  targets: Array<{
    type: 'user' | 'team';
    id: string;
  }>;
  channels: NotificationChannel[];
}

export class EscalationManager {
  private policies: Map<string, EscalationPolicy> = new Map();
  private activeEscalations: Map<string, NodeJS.Timeout[]> = new Map();
  private notificationService: NotificationService;
  
  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }
  
  registerPolicy(policy: EscalationPolicy): void {
    this.policies.set(policy.id, policy);
  }
  
  getPolicy(id: string): EscalationPolicy | undefined {
    return this.policies.get(id);
  }
  
  async escalateAlert(alert: Alert): Promise<void> {
    // Determine which policy to use based on alert category/severity
    const policyId = this.getPolicyIdForAlert(alert);
    const policy = this.policies.get(policyId);
    
    if (!policy) {
      console.warn(`No escalation policy found for alert: ${alert.id}`);
      return;
    }
    
    const timers: NodeJS.Timeout[] = [];
    
    // Schedule escalations for each level
    let cumulativeDelay = 0;
    
    for (const level of policy.levels) {
      const delayMs = this.parseDuration(level.delay);
      cumulativeDelay += delayMs;
      
      const timer = setTimeout(async () => {
        // Check if alert is still active before escalating
        const activeAlerts = await this.getActiveAlertById(alert.id);
        if (!activeAlerts) {
          return; // Alert no longer active
        }
        
        // Send notifications to all targets at this level
        for (const target of level.targets) {
          for (const channel of level.channels) {
            await this.notificationService.sendNotification({
              recipient: {
                type: target.type,
                id: target.id
              },
              channel,
              subject: `[ESCALATION] ${alert.name}`,
              message: `Escalating alert: ${alert.description}`,
              details: {
                alertId: alert.id,
                value: alert.value,
                timestamp: alert.createdAt,
                source: alert.source,
                escalationLevel: level.level
              }
            });
          }
        }
      }, cumulativeDelay);
      
      timers.push(timer);
    }
    
    // Store timers so they can be cancelled if alert is resolved
    this.activeEscalations.set(alert.id, timers);
  }
  
  cancelEscalation(alertId: string): void {
    const timers = this.activeEscalations.get(alertId);
    if (timers) {
      for (const timer of timers) {
        clearTimeout(timer);
      }
      this.activeEscalations.delete(alertId);
    }
  }
  
  private getPolicyIdForAlert(alert: Alert): string {
    // In a real implementation, this would determine the appropriate policy
    // based on alert properties (category, severity, source, etc.)
    // For documentation purposes, we'll use a simplified approach
    
    switch (alert.severity) {
      case 'critical':
        return 'critical-policy';
      case 'high':
        return 'high-priority-policy';
      default:
        return 'default-policy';
    }
  }
  
  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 60000; // Default: 1 minute
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 60000;
    }
  }
  
  private async getActiveAlertById(alertId: string): Promise<boolean> {
    // In a real implementation, this would check if the alert is still active
    // For documentation purposes, we'll assume it's active
    return true;
  }
}
```

## Default Alert Definitions

Here are examples of default alert definitions for the transition monitoring:

```typescript
// default-alerts.ts
const defaultAlerts: AlertDefinition[] = [
  {
    id: 'service-availability',
    name: 'Service Availability Alert',
    description: 'Alert when a service becomes unavailable',
    severity: 'critical',
    category: 'availability',
    sources: ['legacy', 'new'],
    conditions: [
      {
        type: 'threshold',
        metric: 'service_health',
        operator: '<',
        threshold: 1,
        duration: '1m'
      }
    ],
    throttling: {
      period: '15m',
      maxAlerts: 1
    }
  },
  {
    id: 'high-error-rate',
    name: 'High Error Rate Alert',
    description: 'Alert when error rate exceeds threshold',
    severity: 'high',
    category: 'error',
    sources: ['legacy', 'new'],
    conditions: [
      {
        type: 'threshold',
        metric: 'error_rate',
        operator: '>',
        threshold: 0.05, // 5%
        duration: '5m'
      }
    ],
    throttling: {
      period: '30m',
      maxAlerts: 2
    }
  },
  {
    id: 'performance-degradation',
    name: 'Performance Degradation Alert',
    description: 'Alert when response time exceeds threshold',
    severity: 'medium',
    category: 'performance',
    sources: ['legacy', 'new'],
    conditions: [
      {
        type: 'threshold',
        metric: 'response_time_p95',
        operator: '>',
        threshold: 500, // milliseconds
        duration: '10m'
      }
    ]
  },
  {
    id: 'feature-flag-drift',
    name: 'Feature Flag Configuration Drift',
    description: 'Alert when feature flag configurations diverge between environments',
    severity: 'high',
    category: 'error',
    sources: ['both'],
    conditions: [
      {
        type: 'threshold',
        metric: 'feature_flag_drift_count',
        operator: '>',
        threshold: 0,
        duration: '5m'
      }
    ]
  },
  {
    id: 'user-impact',
    name: 'User Impact Alert',
    description: 'Alert when user-impacting metrics degrade',
    severity: 'high',
    category: 'business',
    sources: ['legacy', 'new'],
    conditions: [
      {
        type: 'threshold',
        metric: 'user_success_rate',
        operator: '<',
        threshold: 0.95, // 95%
        duration: '15m'
      }
    ]
  }
];
```

## Implementation Process

### Step 1: Alert Definition and Configuration

1. Define alert thresholds and conditions
2. Configure notification channels and recipients
3. Establish escalation policies

### Step 2: Alert Detection Implementation

1. Implement the alert rules engine
2. Create metric collection integrations
3. Develop condition evaluation logic

### Step 3: Notification System Setup

1. Implement notification service
2. Configure communication channels
3. Establish message templates

### Step 4: Escalation Management Implementation

1. Implement escalation policies
2. Create escalation levels and schedules
3. Develop target selection logic

### Step 5: Testing and Validation

1. Test alert creation and notification delivery
2. Validate escalation processes
3. Verify end-to-end alert functionality

## Validation Approach

### Verification Process
1. Verify alert detection for various system conditions
2. Test notification delivery across all channels
3. Validate escalation path functionality
4. Review alert playbooks for clarity and effectiveness
5. Confirm on-call system functionality

### Success Criteria
1. Alerts trigger correctly based on defined thresholds
2. Notifications deliver reliably to appropriate recipients
3. Escalation processes follow defined policies
4. Alert management system handles high alert volumes efficiently
5. End-to-end alert time meets response time requirements

## Conclusion

The alert system implementation provides a comprehensive mechanism for detecting and responding to issues during the frontend-backend separation transition. By enabling rapid notification and escalation of problems, the system ensures timely responses that minimize impacts on users and business operations. This implementation is critical for maintaining system reliability and providing confidence throughout the transition process. 