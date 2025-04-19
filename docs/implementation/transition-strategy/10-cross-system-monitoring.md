# Cross-System Monitoring Implementation

## Overview
This document details the implementation of a unified monitoring system that covers both legacy and new systems during the frontend-backend separation transition process.

## Monitoring Architecture

### Core Components
The cross-system monitoring architecture consists of the following key components:

1. **Metric Collection Service**: Gathers metrics from both systems
2. **Log Aggregation System**: Centralizes logs from all components
3. **Health Check Service**: Verifies availability of system components
4. **Unified Dashboard**: Provides visualization of monitoring data
5. **Alert Management**: Manages and routes system alerts

## Metric Collection Implementation

```typescript
// metric-collection-service.ts
export interface MetricDefinition {
  name: string;
  description: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  unit?: string;
  labels?: string[];
}

export interface MetricValue {
  name: string;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

export class MetricCollectionService {
  private metrics: Map<string, MetricDefinition> = new Map();
  private collectors: MetricCollector[] = [];
  
  constructor() {
    // Initialize with default metrics for system monitoring
    this.registerCommonMetrics();
  }
  
  private registerCommonMetrics(): void {
    // Register standard system metrics
    this.registerMetric({
      name: 'system_cpu_usage',
      description: 'CPU usage percentage',
      type: 'gauge',
      unit: 'percent'
    });
    
    this.registerMetric({
      name: 'system_memory_usage',
      description: 'Memory usage',
      type: 'gauge',
      unit: 'bytes'
    });
    
    this.registerMetric({
      name: 'http_request_duration',
      description: 'HTTP request duration',
      type: 'histogram',
      unit: 'ms',
      labels: ['method', 'path', 'status']
    });
    
    this.registerMetric({
      name: 'http_request_count',
      description: 'HTTP request count',
      type: 'counter',
      labels: ['method', 'path', 'status']
    });
  }
  
  registerMetric(definition: MetricDefinition): void {
    this.metrics.set(definition.name, definition);
  }
  
  registerCollector(collector: MetricCollector): void {
    this.collectors.push(collector);
  }
  
  async collectMetrics(): Promise<MetricValue[]> {
    const results: MetricValue[] = [];
    
    for (const collector of this.collectors) {
      const metrics = await collector.collect();
      results.push(...metrics);
    }
    
    return results;
  }
  
  getMetricDefinition(name: string): MetricDefinition | undefined {
    return this.metrics.get(name);
  }
  
  getAllMetricDefinitions(): MetricDefinition[] {
    return Array.from(this.metrics.values());
  }
}

export interface MetricCollector {
  collect(): Promise<MetricValue[]>;
}

// Legacy system metric collector
export class LegacySystemCollector implements MetricCollector {
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  async collect(): Promise<MetricValue[]> {
    // In a real implementation, this would make API calls to the legacy system
    // For documentation purposes, we return mock metrics
    return [
      {
        name: 'system_cpu_usage',
        value: 45.2,
        timestamp: new Date(),
        labels: { system: 'legacy' }
      },
      {
        name: 'system_memory_usage',
        value: 1073741824, // 1GB in bytes
        timestamp: new Date(),
        labels: { system: 'legacy' }
      }
    ];
  }
}

// New system metric collector
export class NewSystemCollector implements MetricCollector {
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  async collect(): Promise<MetricValue[]> {
    // In a real implementation, this would make API calls to the new system
    // For documentation purposes, we return mock metrics
    return [
      {
        name: 'system_cpu_usage',
        value: 32.7,
        timestamp: new Date(),
        labels: { system: 'new' }
      },
      {
        name: 'system_memory_usage',
        value: 805306368, // 768MB in bytes
        timestamp: new Date(),
        labels: { system: 'new' }
      }
    ];
  }
}
```

## Log Aggregation Implementation

```typescript
// log-aggregation-service.ts
export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  source: {
    system: 'legacy' | 'new';
    service: string;
    host?: string;
  };
  metadata?: Record<string, any>;
}

export class LogAggregationService {
  private logStorage: LogStorage;
  private logProcessors: LogProcessor[] = [];
  
  constructor(storage: LogStorage) {
    this.logStorage = storage;
  }
  
  registerProcessor(processor: LogProcessor): void {
    this.logProcessors.push(processor);
  }
  
  async processLog(entry: LogEntry): Promise<void> {
    // Apply processors to log entry
    let processedEntry = entry;
    for (const processor of this.logProcessors) {
      processedEntry = await processor.process(processedEntry);
    }
    
    // Store the processed log entry
    await this.logStorage.store(processedEntry);
  }
  
  async query(options: LogQueryOptions): Promise<LogEntry[]> {
    return this.logStorage.query(options);
  }
}

export interface LogStorage {
  store(entry: LogEntry): Promise<void>;
  query(options: LogQueryOptions): Promise<LogEntry[]>;
}

export interface LogQueryOptions {
  startTime?: Date;
  endTime?: Date;
  levels?: Array<'debug' | 'info' | 'warn' | 'error' | 'fatal'>;
  systems?: Array<'legacy' | 'new'>;
  services?: string[];
  searchText?: string;
  limit?: number;
  offset?: number;
}

export interface LogProcessor {
  process(entry: LogEntry): Promise<LogEntry>;
}

// Enrichment processor that adds additional metadata to logs
export class LogEnrichmentProcessor implements LogProcessor {
  async process(entry: LogEntry): Promise<LogEntry> {
    const enriched = { ...entry };
    
    // Add environment information
    enriched.metadata = {
      ...enriched.metadata,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || 'unknown'
    };
    
    return enriched;
  }
}

// Correlation processor that links related logs
export class LogCorrelationProcessor implements LogProcessor {
  async process(entry: LogEntry): Promise<LogEntry> {
    const correlated = { ...entry };
    
    // Extract and standardize correlation IDs from metadata
    if (correlated.metadata) {
      const requestId = 
        correlated.metadata.requestId || 
        correlated.metadata.request_id || 
        correlated.metadata.req_id;
      
      if (requestId) {
        correlated.metadata.correlationId = requestId;
      }
    }
    
    return correlated;
  }
}
```

## Health Check Implementation

```typescript
// health-check-service.ts
export interface HealthStatus {
  status: 'up' | 'down' | 'degraded';
  checks: HealthCheckResult[];
  timestamp: Date;
}

export interface HealthCheckResult {
  component: string;
  status: 'up' | 'down' | 'degraded';
  details?: Record<string, any>;
  message?: string;
  lastChecked: Date;
}

export interface HealthCheck {
  name: string;
  check(): Promise<HealthCheckResult>;
}

export class HealthCheckService {
  private checks: Map<string, HealthCheck> = new Map();
  private cachedStatus: HealthStatus | null = null;
  private lastCheckTime: number = 0;
  private cacheTimeMs: number = 10000; // 10 seconds
  
  registerCheck(check: HealthCheck): void {
    this.checks.set(check.name, check);
  }
  
  async getStatus(force: boolean = false): Promise<HealthStatus> {
    const now = Date.now();
    
    // Return cached status if not expired and force flag not set
    if (
      !force && 
      this.cachedStatus && 
      now - this.lastCheckTime < this.cacheTimeMs
    ) {
      return this.cachedStatus;
    }
    
    // Perform all health checks
    const checkResults: HealthCheckResult[] = [];
    
    for (const check of this.checks.values()) {
      try {
        const result = await check.check();
        checkResults.push(result);
      } catch (error) {
        // If check throws an exception, consider it down
        checkResults.push({
          component: check.name,
          status: 'down',
          details: { error: String(error) },
          message: 'Health check failed with error',
          lastChecked: new Date()
        });
      }
    }
    
    // Determine overall status
    let overallStatus: 'up' | 'down' | 'degraded' = 'up';
    
    if (checkResults.some(r => r.status === 'down')) {
      overallStatus = 'down';
    } else if (checkResults.some(r => r.status === 'degraded')) {
      overallStatus = 'degraded';
    }
    
    // Update cache
    this.cachedStatus = {
      status: overallStatus,
      checks: checkResults,
      timestamp: new Date()
    };
    this.lastCheckTime = now;
    
    return this.cachedStatus;
  }
}

// Legacy system health check
export class LegacySystemHealthCheck implements HealthCheck {
  name = 'legacy-system';
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  async check(): Promise<HealthCheckResult> {
    try {
      // In a real implementation, this would make an API call to the health endpoint
      // For documentation purposes, we simulate a check
      
      // Simulate successful check
      return {
        component: this.name,
        status: 'up',
        details: {
          responseTime: 120, // ms
          version: '1.5.2'
        },
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        component: this.name,
        status: 'down',
        details: { error: String(error) },
        message: 'Failed to connect to legacy system',
        lastChecked: new Date()
      };
    }
  }
}

// New system health check
export class NewSystemHealthCheck implements HealthCheck {
  name = 'new-system';
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  async check(): Promise<HealthCheckResult> {
    try {
      // In a real implementation, this would make an API call to the health endpoint
      // For documentation purposes, we simulate a check
      
      // Simulate successful check
      return {
        component: this.name,
        status: 'up',
        details: {
          responseTime: 85, // ms
          version: '2.0.1'
        },
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        component: this.name,
        status: 'down',
        details: { error: String(error) },
        message: 'Failed to connect to new system',
        lastChecked: new Date()
      };
    }
  }
}
```

## Unified Dashboard Implementation

```typescript
// unified-dashboard.ts
export interface DashboardConfig {
  title: string;
  description?: string;
  refreshInterval: number; // in seconds
  layout: DashboardLayout;
  panels: DashboardPanel[];
}

export interface DashboardLayout {
  columns: number;
  rows: number;
}

export interface DashboardPanel {
  id: string;
  title: string;
  type: 'metric' | 'health' | 'logs' | 'text';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: any;
}

export class DashboardService {
  private dashboards: Map<string, DashboardConfig> = new Map();
  
  createDashboard(id: string, config: DashboardConfig): void {
    this.dashboards.set(id, config);
  }
  
  getDashboard(id: string): DashboardConfig | undefined {
    return this.dashboards.get(id);
  }
  
  updateDashboard(id: string, config: Partial<DashboardConfig>): void {
    const existing = this.dashboards.get(id);
    if (!existing) throw new Error(`Dashboard ${id} not found`);
    
    this.dashboards.set(id, { ...existing, ...config });
  }
  
  deleteDashboard(id: string): boolean {
    return this.dashboards.delete(id);
  }
  
  listDashboards(): Array<{ id: string; title: string; description?: string }> {
    return Array.from(this.dashboards.entries()).map(([id, config]) => ({
      id,
      title: config.title,
      description: config.description
    }));
  }
}

// Default dashboard creation for cross-system monitoring
export function createDefaultDashboards(dashboardService: DashboardService): void {
  // System overview dashboard
  dashboardService.createDashboard('system-overview', {
    title: 'System Overview',
    description: 'Overview of both legacy and new systems',
    refreshInterval: 30,
    layout: { columns: 12, rows: 12 },
    panels: [
      {
        id: 'health-status',
        title: 'System Health',
        type: 'health',
        position: { x: 0, y: 0, width: 12, height: 3 },
        config: {
          showDetails: true
        }
      },
      {
        id: 'cpu-usage',
        title: 'CPU Usage',
        type: 'metric',
        position: { x: 0, y: 3, width: 6, height: 4 },
        config: {
          metric: 'system_cpu_usage',
          visualization: 'line',
          compareBy: 'system'
        }
      },
      {
        id: 'memory-usage',
        title: 'Memory Usage',
        type: 'metric',
        position: { x: 6, y: 3, width: 6, height: 4 },
        config: {
          metric: 'system_memory_usage',
          visualization: 'line',
          compareBy: 'system'
        }
      },
      {
        id: 'error-logs',
        title: 'Error Logs',
        type: 'logs',
        position: { x: 0, y: 7, width: 12, height: 5 },
        config: {
          levels: ['error', 'fatal'],
          limit: 100,
          showSource: true
        }
      }
    ]
  });
  
  // HTTP performance dashboard
  dashboardService.createDashboard('http-performance', {
    title: 'HTTP Performance',
    description: 'Performance metrics for HTTP endpoints',
    refreshInterval: 15,
    layout: { columns: 12, rows: 12 },
    panels: [
      {
        id: 'request-count',
        title: 'Request Count',
        type: 'metric',
        position: { x: 0, y: 0, width: 6, height: 4 },
        config: {
          metric: 'http_request_count',
          visualization: 'bar',
          groupBy: 'path'
        }
      },
      {
        id: 'request-duration',
        title: 'Request Duration',
        type: 'metric',
        position: { x: 6, y: 0, width: 6, height: 4 },
        config: {
          metric: 'http_request_duration',
          visualization: 'heatmap',
          groupBy: 'path'
        }
      },
      {
        id: 'status-codes',
        title: 'Status Codes',
        type: 'metric',
        position: { x: 0, y: 4, width: 12, height: 4 },
        config: {
          metric: 'http_request_count',
          visualization: 'pie',
          groupBy: 'status'
        }
      }
    ]
  });
}
```

## Integration of Components

The unified monitoring system integrates all components to provide comprehensive visibility into both legacy and new systems during the transition process. The integration is managed through a central monitoring service:

```typescript
// monitoring-service.ts
export class MonitoringService {
  private metricService: MetricCollectionService;
  private logService: LogAggregationService;
  private healthService: HealthCheckService;
  private dashboardService: DashboardService;
  
  constructor(
    metricService: MetricCollectionService,
    logService: LogAggregationService,
    healthService: HealthCheckService,
    dashboardService: DashboardService
  ) {
    this.metricService = metricService;
    this.logService = logService;
    this.healthService = healthService;
    this.dashboardService = dashboardService;
    
    // Initialize with default configuration
    this.initialize();
  }
  
  private initialize(): void {
    // Register standard collectors
    this.metricService.registerCollector(
      new LegacySystemCollector('http://legacy-system.example.com')
    );
    this.metricService.registerCollector(
      new NewSystemCollector('http://new-system.example.com')
    );
    
    // Register log processors
    this.logService.registerProcessor(new LogEnrichmentProcessor());
    this.logService.registerProcessor(new LogCorrelationProcessor());
    
    // Register health checks
    this.healthService.registerCheck(
      new LegacySystemHealthCheck('http://legacy-system.example.com')
    );
    this.healthService.registerCheck(
      new NewSystemHealthCheck('http://new-system.example.com')
    );
    
    // Create default dashboards
    createDefaultDashboards(this.dashboardService);
  }
  
  async getSystemStatus(): Promise<{
    health: HealthStatus;
    recentMetrics: MetricValue[];
    recentLogs: LogEntry[];
  }> {
    // Get current health status
    const health = await this.healthService.getStatus();
    
    // Get recent metrics
    const metrics = await this.metricService.collectMetrics();
    
    // Get recent logs (errors only for status overview)
    const logs = await this.logService.query({
      levels: ['error', 'fatal'],
      limit: 10
    });
    
    return {
      health,
      recentMetrics: metrics,
      recentLogs: logs
    };
  }
}
```

## Implementation Process

### Step 1: Metric Collection Setup

1. Implement the metric collection service
2. Create connectors for both legacy and new systems
3. Define key metrics for transition monitoring

### Step 2: Log Aggregation Setup

1. Implement the log aggregation service
2. Establish log collection mechanisms from both systems
3. Configure log processing and correlation

### Step 3: Health Check Implementation

1. Implement the health check service
2. Create system-specific health checks
3. Establish health status evaluation logic

### Step 4: Dashboard Creation

1. Implement the dashboard service
2. Create standard monitoring dashboards
3. Configure visualization for cross-system metrics

### Step 5: Integration and Testing

1. Implement the unified monitoring service
2. Test integration with both systems
3. Validate dashboard functionality and data accuracy

## Validation Approach

### Verification Process
1. Verify metric collection from all critical components
2. Test log aggregation and search capabilities
3. Validate health check effectiveness across systems
4. Confirm dashboard visibility and usability
5. Evaluate system status accuracy

### Success Criteria
1. All defined metrics are properly collected from both systems
2. Logs from all components are successfully aggregated
3. Health checks accurately reflect system status
4. Dashboards provide clear visibility into cross-system performance
5. Status reporting enables effective monitoring during transition

## Conclusion

The cross-system monitoring implementation provides unified visibility into both legacy and new systems during the frontend-backend separation. By centralizing metrics, logs, and health status information, the monitoring system enables effective tracking of system performance and rapid identification of issues that may arise during the transition process. 