# Feature Activation Control Implementation

## Overview
This document outlines the implementation of granular control mechanisms for feature activation and targeting within the feature flag system. Building upon the feature flag infrastructure, these controls enable precise targeting of features to specific users, user segments, environments, and other criteria during the frontend-backend separation transition.

## Targeting Rules and Criteria Structure

### Rule Structure Design
The targeting rule structure follows a hierarchical pattern allowing for flexible, composable targeting logic:

```typescript
interface TargetingRule {
  id: string;
  name: string;
  description: string;
  operator: 'AND' | 'OR' | 'NOT';
  conditions: TargetingCondition[];
  enabled: boolean;
}

interface TargetingCondition {
  attribute: string; // User attribute, context attribute, environment variable
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'matches' | 
            'greaterThan' | 'lessThan' | 'in' | 'notIn' | 'before' | 'after';
  value: any;
}
```

### Rule Types
1. **User Attribute Rules**: Target based on user properties (email, role, etc.)
2. **Context Rules**: Target based on environment, device, location
3. **Behavioral Rules**: Target based on user behavior or history
4. **Percentage Rollout Rules**: Target based on random percentage 
5. **Time-Based Rules**: Target based on date/time criteria
6. **Composite Rules**: Combine multiple rule types with logical operators

### Example Rule Definitions
```json
{
  "id": "rule-001",
  "name": "Internal Team Members",
  "description": "Target internal team members for early access",
  "operator": "OR",
  "conditions": [
    {
      "attribute": "email",
      "operator": "matches",
      "value": ".*@marmitas\\.com"
    },
    {
      "attribute": "groups",
      "operator": "contains",
      "value": "internal-testers"
    }
  ],
  "enabled": true
},
{
  "id": "rule-002",
  "name": "Premium Customers in Production",
  "description": "Target premium customers in production environment",
  "operator": "AND",
  "conditions": [
    {
      "attribute": "subscription",
      "operator": "equals",
      "value": "premium"
    },
    {
      "attribute": "environment",
      "operator": "equals",
      "value": "production"
    }
  ],
  "enabled": true
}
```

## User/Context Evaluation Implementation

### Backend User Context Management
```typescript
// user-context-service.ts
import { Request } from 'express';

export interface UserContext {
  key: string;
  email?: string;
  name?: string;
  groups: string[];
  subscription?: string;
  created?: Date;
  lastLogin?: Date;
  preferences?: Record<string, any>;
  customAttributes?: Record<string, any>;
}

export interface EnvironmentContext {
  environment: string;
  region: string;
  instanceId: string;
  version: string;
}

export interface ClientContext {
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  browser?: string;
  language?: string;
  timezone?: string;
}

export interface FeatureFlagContext {
  user: UserContext;
  environment: EnvironmentContext;
  client: ClientContext;
  session?: Record<string, any>;
}

export class ContextService {
  buildContext(req: Request): FeatureFlagContext {
    const user = this.buildUserContext(req);
    const environment = this.buildEnvironmentContext();
    const client = this.buildClientContext(req);
    
    return {
      user,
      environment,
      client,
      session: req.session || {}
    };
  }
  
  private buildUserContext(req: Request): UserContext {
    // Extract user info from authenticated request
    const user = req.user || {};
    
    return {
      key: user.id || 'anonymous',
      email: user.email,
      name: user.name,
      groups: user.roles || [],
      subscription: user.subscription,
      created: user.created ? new Date(user.created) : undefined,
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
      preferences: user.preferences || {},
      customAttributes: user.customAttributes || {}
    };
  }
  
  private buildEnvironmentContext(): EnvironmentContext {
    return {
      environment: process.env.NODE_ENV || 'development',
      region: process.env.REGION || 'local',
      instanceId: process.env.INSTANCE_ID || 'local-instance',
      version: process.env.APP_VERSION || '0.0.0'
    };
  }
  
  private buildClientContext(req: Request): ClientContext {
    // Basic client info extraction from request
    return {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      language: req.get('accept-language'),
      // Additional client info would be parsed from user-agent or client hints
    };
  }
}
```

### Frontend Context Provider
```tsx
// feature-context.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../auth/auth-context';

interface FeatureContext {
  user: {
    key: string;
    email?: string;
    groups: string[];
    subscription?: string;
    [key: string]: any;
  };
  client: {
    browserName: string;
    deviceType: string;
    language: string;
    timezone: string;
    [key: string]: any;
  };
  environment: {
    environment: string;
    region: string;
    version: string;
  };
}

const FeatureContextContext = createContext<FeatureContext>({
  user: { key: 'anonymous', groups: [] },
  client: { 
    browserName: '', 
    deviceType: '', 
    language: '', 
    timezone: '' 
  },
  environment: { 
    environment: 'development', 
    region: 'local', 
    version: '0.0.0' 
  }
});

export const FeatureContextProvider: React.FC = ({ children }) => {
  const { user } = useAuth();
  const [context, setContext] = useState<FeatureContext>({
    user: { key: 'anonymous', groups: [] },
    client: { 
      browserName: '', 
      deviceType: '', 
      language: '', 
      timezone: '' 
    },
    environment: { 
      environment: 'development', 
      region: 'local', 
      version: '0.0.0' 
    }
  });
  
  useEffect(() => {
    // Build user context from auth
    const userContext = {
      key: user?.id || 'anonymous',
      email: user?.email,
      groups: user?.roles || [],
      subscription: user?.subscription,
      ...user?.attributes
    };
    
    // Determine client context
    const clientContext = {
      browserName: getBrowserName(),
      deviceType: getDeviceType(),
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenSize: `${window.innerWidth}x${window.innerHeight}`
    };
    
    // Get environment from config
    const environmentContext = {
      environment: process.env.REACT_APP_ENVIRONMENT || 'development',
      region: process.env.REACT_APP_REGION || 'local',
      version: process.env.REACT_APP_VERSION || '0.0.0'
    };
    
    setContext({
      user: userContext,
      client: clientContext,
      environment: environmentContext
    });
  }, [user]);
  
  return (
    <FeatureContextContext.Provider value={context}>
      {children}
    </FeatureContextContext.Provider>
  );
};

export const useFeatureContext = () => useContext(FeatureContextContext);

// Helper functions
function getBrowserName() {
  const userAgent = navigator.userAgent;
  // Simplified browser detection
  if (userAgent.indexOf("Chrome") > -1) return "Chrome";
  if (userAgent.indexOf("Safari") > -1) return "Safari";
  if (userAgent.indexOf("Firefox") > -1) return "Firefox";
  if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) return "IE";
  if (userAgent.indexOf("Edge") > -1) return "Edge";
  return "Unknown";
}

function getDeviceType() {
  const userAgent = navigator.userAgent;
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    return "Mobile";
  }
  return "Desktop";
}
```

## Admin Interface for Flag Management

### Flag Management Dashboard
The flag management dashboard is implemented as a dedicated administration interface allowing authorized users to:

1. View all feature flags across the system
2. Create, edit, and delete feature flags
3. Configure targeting rules for flags
4. View flag usage analytics
5. Manage flag schedules and lifecycle

### Dashboard Components
```tsx
// flag-management-dashboard.tsx
import React, { useState, useEffect } from 'react';
import { FlagList } from './components/FlagList';
import { FlagEditor } from './components/FlagEditor';
import { TargetingRuleEditor } from './components/TargetingRuleEditor';
import { FlagAnalytics } from './components/FlagAnalytics';
import { useFlagManagement } from './hooks/useFlagManagement';

export const FlagManagementDashboard: React.FC = () => {
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'targeting' | 'analytics'>('details');
  const { flags, loading, error } = useFlagManagement();
  
  if (loading) return <div>Loading flag data...</div>;
  if (error) return <div>Error loading flag data: {error.message}</div>;
  
  const selectedFlagData = selectedFlag ? flags.find(f => f.key === selectedFlag) : null;
  
  return (
    <div className="flag-management-dashboard">
      <div className="sidebar">
        <h2>Feature Flags</h2>
        <FlagList 
          flags={flags} 
          selectedFlag={selectedFlag}
          onSelectFlag={setSelectedFlag}
        />
        <button className="create-flag-btn">Create New Flag</button>
      </div>
      
      <div className="main-content">
        {!selectedFlag ? (
          <div className="no-selection">
            <h3>Select a feature flag to manage</h3>
          </div>
        ) : (
          <>
            <div className="flag-header">
              <h2>{selectedFlagData?.name}</h2>
              <div className="flag-status">
                <span className={`status-indicator ${selectedFlagData?.enabled ? 'enabled' : 'disabled'}`}></span>
                {selectedFlagData?.enabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            
            <div className="tabs">
              <button 
                className={activeTab === 'details' ? 'active' : ''} 
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button 
                className={activeTab === 'targeting' ? 'active' : ''} 
                onClick={() => setActiveTab('targeting')}
              >
                Targeting
              </button>
              <button 
                className={activeTab === 'analytics' ? 'active' : ''} 
                onClick={() => setActiveTab('analytics')}
              >
                Analytics
              </button>
            </div>
            
            <div className="tab-content">
              {activeTab === 'details' && <FlagEditor flag={selectedFlagData} />}
              {activeTab === 'targeting' && <TargetingRuleEditor flag={selectedFlagData} />}
              {activeTab === 'analytics' && <FlagAnalytics flagKey={selectedFlag} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
```

### API Endpoints for Flag Management
```typescript
// flag-management-routes.ts
import { Router } from 'express';
import { FlagManagementController } from '../controllers/flag-management-controller';
import { authMiddleware } from '../middleware/auth-middleware';
import { permissionMiddleware } from '../middleware/permission-middleware';

const router = Router();
const controller = new FlagManagementController();

// Apply auth and permissions to all routes
router.use(authMiddleware);
router.use(permissionMiddleware('manage:feature-flags'));

// Flag CRUD operations
router.get('/flags', controller.listFlags);
router.get('/flags/:key', controller.getFlag);
router.post('/flags', controller.createFlag);
router.put('/flags/:key', controller.updateFlag);
router.delete('/flags/:key', controller.deleteFlag);

// Targeting rules
router.get('/flags/:key/rules', controller.listRules);
router.post('/flags/:key/rules', controller.createRule);
router.put('/flags/:key/rules/:ruleId', controller.updateRule);
router.delete('/flags/:key/rules/:ruleId', controller.deleteRule);

// Flag operations
router.post('/flags/:key/enable', controller.enableFlag);
router.post('/flags/:key/disable', controller.disableFlag);
router.post('/flags/:key/archive', controller.archiveFlag);

// Analytics
router.get('/flags/:key/analytics', controller.getFlagAnalytics);

export default router;
```

## Percentage Rollout Implementation

### Percentage-Based Targeting
```typescript
// percentage-targeting.ts
import crypto from 'crypto';

export class PercentageTargeting {
  /**
   * Determines if a user is within the specified percentage for a feature rollout
   * @param userId Unique identifier for the user
   * @param featureKey Feature flag key
   * @param percentage Target percentage (0-100)
   * @returns Boolean indicating if the user is within the target percentage
   */
  isUserInPercentage(userId: string, featureKey: string, percentage: number): boolean {
    if (percentage >= 100) return true;
    if (percentage <= 0) return false;
    
    // Create a deterministic hash based on user ID and feature key
    const hash = crypto
      .createHash('sha256')
      .update(`${userId}:${featureKey}`)
      .digest('hex');
    
    // Convert first 4 bytes of hash to a number between 0-100
    const hashValue = parseInt(hash.substring(0, 8), 16) % 100;
    
    // User is included if their hash value is less than the percentage
    return hashValue < percentage;
  }
  
  /**
   * Gets gradual rollout percentages for a staged rollout
   * @param startDate Start date of the rollout
   * @param endDate End date of the rollout
   * @param targetPercentage Final percentage to reach
   * @returns Current percentage for the rollout
   */
  calculateRolloutPercentage(
    startDate: Date, 
    endDate: Date, 
    targetPercentage: number
  ): number {
    const now = new Date();
    
    // If before start date, return 0
    if (now < startDate) return 0;
    
    // If after end date, return target percentage
    if (now > endDate) return targetPercentage;
    
    // Calculate percentage based on elapsed time
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsedDuration = now.getTime() - startDate.getTime();
    const completionRatio = elapsedDuration / totalDuration;
    
    // Return current percentage (rounded to nearest integer)
    return Math.round(targetPercentage * completionRatio);
  }
}
```

## Scheduled Flag Changes

### Scheduling System
```typescript
// flag-scheduler.ts
import { CronJob } from 'cron';
import { FeatureFlagService } from './feature-flag-service';

interface ScheduledChange {
  id: string;
  flagKey: string;
  operation: 'enable' | 'disable' | 'setPercentage' | 'updateTargeting';
  value?: any;
  cronExpression: string;
  enabled: boolean;
  description: string;
  createdBy: string;
  createdAt: Date;
}

export class FlagScheduler {
  private jobs: Map<string, CronJob> = new Map();
  private flagService: FeatureFlagService;
  
  constructor(flagService: FeatureFlagService) {
    this.flagService = flagService;
  }
  
  async initialize(): Promise<void> {
    // Load scheduled changes from database
    const scheduledChanges = await this.loadScheduledChanges();
    
    // Initialize cron jobs for each scheduled change
    scheduledChanges.forEach(change => {
      if (change.enabled) {
        this.scheduleChange(change);
      }
    });
    
    console.log(`Initialized ${this.jobs.size} scheduled flag changes`);
  }
  
  private async loadScheduledChanges(): Promise<ScheduledChange[]> {
    // In a real implementation, this would load from database
    // Mock implementation for documentation purposes
    return [];
  }
  
  scheduleChange(change: ScheduledChange): void {
    const job = new CronJob(
      change.cronExpression, 
      () => this.executeChange(change),
      null, // onComplete
      true, // start
      'UTC' // timezone
    );
    
    this.jobs.set(change.id, job);
    console.log(`Scheduled change ${change.id} for flag ${change.flagKey}`);
  }
  
  async executeChange(change: ScheduledChange): Promise<void> {
    console.log(`Executing scheduled change ${change.id} for flag ${change.flagKey}`);
    
    try {
      switch (change.operation) {
        case 'enable':
          await this.flagService.updateFlag(change.flagKey, { enabled: true });
          break;
          
        case 'disable':
          await this.flagService.updateFlag(change.flagKey, { enabled: false });
          break;
          
        case 'setPercentage':
          await this.flagService.updateRolloutPercentage(change.flagKey, change.value);
          break;
          
        case 'updateTargeting':
          await this.flagService.updateTargeting(change.flagKey, change.value);
          break;
      }
      
      // Log successful execution
      await this.logChangeExecution(change, true);
    } catch (error) {
      console.error(`Error executing scheduled change ${change.id}:`, error);
      
      // Log failed execution
      await this.logChangeExecution(change, false, error);
    }
  }
  
  private async logChangeExecution(
    change: ScheduledChange, 
    success: boolean, 
    error?: any
  ): Promise<void> {
    // In a real implementation, this would log to database
    console.log(`Change execution ${success ? 'succeeded' : 'failed'}: ${change.id}`);
  }
  
  cancelScheduledChange(changeId: string): boolean {
    const job = this.jobs.get(changeId);
    
    if (job) {
      job.stop();
      this.jobs.delete(changeId);
      console.log(`Canceled scheduled change ${changeId}`);
      return true;
    }
    
    return false;
  }
  
  shutdown(): void {
    // Stop all scheduled jobs
    for (const [id, job] of this.jobs.entries()) {
      job.stop();
      console.log(`Stopped scheduled change ${id}`);
    }
    
    this.jobs.clear();
  }
}
```

## Documentation of Targeting Strategies

### Common Targeting Strategies

#### 1. Staged Rollout Strategy
A gradual release of features to increasing percentages of users over time:

```json
{
  "strategy": "staged-rollout",
  "phases": [
    {
      "percentage": 5,
      "duration": "3d",
      "targetGroups": ["internal-testers"]
    },
    {
      "percentage": 20,
      "duration": "5d",
      "targetGroups": ["beta-users", "premium-users"]
    },
    {
      "percentage": 50,
      "duration": "7d"
    },
    {
      "percentage": 100,
      "duration": "5d"
    }
  ]
}
```

#### 2. Role-Based Strategy
Target specific user roles or permission levels:

```json
{
  "strategy": "role-based",
  "includedRoles": ["admin", "manager", "premium"],
  "excludedRoles": ["guest", "trial"]
}
```

#### 3. Progressive Environment Strategy
Roll out sequentially through environments:

```json
{
  "strategy": "progressive-environment",
  "sequence": [
    {
      "environment": "development",
      "percentage": 100,
      "minDuration": "2d"
    },
    {
      "environment": "staging",
      "percentage": 100,
      "minDuration": "5d",
      "requiredMetrics": {
        "errorRate": { "operator": "lessThan", "value": 0.01 }
      }
    },
    {
      "environment": "production",
      "percentage": 20,
      "minDuration": "3d",
      "requiredMetrics": {
        "errorRate": { "operator": "lessThan", "value": 0.005 },
        "performance": { "operator": "greaterThan", "value": 0.95 }
      }
    },
    {
      "environment": "production",
      "percentage": 100
    }
  ]
}
```

## Conclusion
The feature activation control implementation provides a powerful and flexible system for controlling the rollout of features during the frontend-backend separation. By implementing sophisticated targeting rules, user context evaluation, and administrative control interfaces, we enable precise control over which users see which features, minimizing risk during the transition. 