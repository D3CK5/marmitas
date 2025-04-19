/**
 * Performance Test Metrics Utilities
 * 
 * This file provides utilities for collecting, processing, and comparing
 * performance metrics across test runs.
 */

import fs from 'fs';
import path from 'path';
import { BASE_CONFIG, BASELINE_METRICS } from '../config';

// Basic metric types
export interface Latency {
  min: number;
  max: number;
  mean: number;
  median: number;
  p95: number;
  p99: number;
  stddev: number;
}

export interface Throughput {
  rps: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  timeoutRequests?: number;
}

export interface ErrorRate {
  rate: number;
  count: number;
  total: number;
  types?: Record<string, number>;
}

export interface MemoryUsage {
  rss: number;    // Resident Set Size - total memory allocated
  heapTotal: number;  // V8 heap allocated
  heapUsed: number;   // V8 heap actually used
  external: number;   // Memory used by C++ objects bound to JS objects
  arrayBuffers?: number; // Memory used by ArrayBuffers and SharedArrayBuffers
}

export interface CpuUsage {
  user: number;   // User CPU time used
  system: number; // System CPU time used
  percent: number; // CPU percentage used (0-100)
}

// Complete test result interface
export interface TestResult {
  timestamp: string;
  endpoint: string;
  method: string;
  duration: number;
  concurrency: number;
  latency: Latency;
  throughput: Throughput;
  errorRate: ErrorRate;
  memory?: MemoryUsage;
  cpu?: CpuUsage;
  metadata?: Record<string, any>;
}

// Comparison result interface
export interface ComparisonResult {
  endpoint: string;
  method: string;
  baseline: TestResult;
  current: TestResult;
  differences: {
    latency: Record<keyof Latency, number>;
    throughput: Record<keyof Throughput, number>;
    errorRate: Record<keyof ErrorRate, number>;
    memory?: Record<keyof MemoryUsage, number>;
    cpu?: Record<keyof CpuUsage, number>;
  };
  // Differences as percentages (positive = worse, negative = better)
  percentChanges: {
    latency: Record<keyof Latency, number>;
    throughput: Record<keyof Throughput, number>;
    errorRate: Record<keyof ErrorRate, number>;
    memory?: Record<keyof MemoryUsage, number>;
    cpu?: Record<keyof CpuUsage, number>;
  };
  // Overall assessment
  assessment: {
    passed: boolean;
    issues: string[];
    improvements: string[];
    summary: string;
  };
}

/**
 * Save test results to a JSON file
 */
export const saveTestResult = (result: TestResult, filename?: string): string => {
  BASE_CONFIG.ensureDirectoriesExist();
  
  // Generate a filename if not provided
  const actualFilename = filename || 
    `${result.endpoint.replace(/\//g, '_')}_${result.method}_${result.concurrency}users_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  
  const filepath = path.join(BASE_CONFIG.output.dir, actualFilename);
  
  // Write the result to the file
  fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
  
  return filepath;
};

/**
 * Load test results from a JSON file
 */
export const loadTestResult = (filepath: string): TestResult => {
  const fileContent = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(fileContent) as TestResult;
};

/**
 * Convert raw autocannon results to our TestResult format
 */
export const processAutocannonResult = (
  rawResult: any, 
  endpoint: string, 
  method: string, 
  concurrency: number
): TestResult => {
  const { latency, requests, throughput, errors, duration, start } = rawResult;
  
  return {
    timestamp: new Date(start).toISOString(),
    endpoint,
    method,
    duration: duration / 1000, // Convert from ms to seconds
    concurrency,
    latency: {
      min: latency.min,
      max: latency.max,
      mean: latency.average,
      median: latency.p50,
      p95: latency.p95,
      p99: latency.p99,
      stddev: latency.stddev
    },
    throughput: {
      rps: throughput.average,
      totalRequests: requests.total,
      successfulRequests: requests.sent - errors,
      failedRequests: errors
    },
    errorRate: {
      rate: errors === 0 ? 0 : errors / requests.total,
      count: errors,
      total: requests.total
    }
  };
};

/**
 * Compare current test results with baseline
 */
export const compareWithBaseline = (
  current: TestResult, 
  baseline: TestResult
): ComparisonResult => {
  // Calculate differences
  const latencyDiff = {
    min: current.latency.min - baseline.latency.min,
    max: current.latency.max - baseline.latency.max,
    mean: current.latency.mean - baseline.latency.mean,
    median: current.latency.median - baseline.latency.median,
    p95: current.latency.p95 - baseline.latency.p95,
    p99: current.latency.p99 - baseline.latency.p99,
    stddev: current.latency.stddev - baseline.latency.stddev
  };
  
  const throughputDiff = {
    rps: current.throughput.rps - baseline.throughput.rps,
    totalRequests: current.throughput.totalRequests - baseline.throughput.totalRequests,
    successfulRequests: current.throughput.successfulRequests - baseline.throughput.successfulRequests,
    failedRequests: current.throughput.failedRequests - baseline.throughput.failedRequests
  };
  
  const errorRateDiff = {
    rate: current.errorRate.rate - baseline.errorRate.rate,
    count: current.errorRate.count - baseline.errorRate.count,
    total: current.errorRate.total - baseline.errorRate.total
  };
  
  // Calculate percent changes
  const latencyPctChange = {
    min: percentChange(baseline.latency.min, current.latency.min),
    max: percentChange(baseline.latency.max, current.latency.max),
    mean: percentChange(baseline.latency.mean, current.latency.mean),
    median: percentChange(baseline.latency.median, current.latency.median),
    p95: percentChange(baseline.latency.p95, current.latency.p95),
    p99: percentChange(baseline.latency.p99, current.latency.p99),
    stddev: percentChange(baseline.latency.stddev, current.latency.stddev)
  };
  
  const throughputPctChange = {
    rps: percentChange(baseline.throughput.rps, current.throughput.rps) * -1, // Invert so positive = better
    totalRequests: percentChange(baseline.throughput.totalRequests, current.throughput.totalRequests) * -1,
    successfulRequests: percentChange(baseline.throughput.successfulRequests, current.throughput.successfulRequests) * -1,
    failedRequests: percentChange(baseline.throughput.failedRequests, current.throughput.failedRequests)
  };
  
  const errorRatePctChange = {
    rate: percentChange(baseline.errorRate.rate, current.errorRate.rate),
    count: percentChange(baseline.errorRate.count, current.errorRate.count),
    total: percentChange(baseline.errorRate.total, current.errorRate.total)
  };
  
  // Analyze results
  const issues: string[] = [];
  const improvements: string[] = [];
  
  // Check latency degradation
  if (latencyPctChange.p95 > 10) {
    issues.push(`P95 latency increased by ${latencyPctChange.p95.toFixed(2)}%`);
  }
  if (latencyPctChange.p95 < -10) {
    improvements.push(`P95 latency decreased by ${Math.abs(latencyPctChange.p95).toFixed(2)}%`);
  }
  
  // Check throughput degradation
  if (throughputPctChange.rps < -10) {
    issues.push(`Throughput decreased by ${Math.abs(throughputPctChange.rps).toFixed(2)}%`);
  }
  if (throughputPctChange.rps > 10) {
    improvements.push(`Throughput increased by ${throughputPctChange.rps.toFixed(2)}%`);
  }
  
  // Check error rate
  if (errorRatePctChange.rate > 0 && current.errorRate.rate > 0.01) {
    issues.push(`Error rate increased to ${(current.errorRate.rate * 100).toFixed(2)}%`);
  }
  
  // Determine overall assessment
  const hasCriticalIssues = 
    latencyPctChange.p95 > 20 || 
    throughputPctChange.rps < -20 || 
    (current.errorRate.rate > 0.05 && errorRatePctChange.rate > 0);
  
  let summary = '';
  if (issues.length === 0 && improvements.length === 0) {
    summary = 'Performance is equivalent to baseline.';
  } else if (issues.length === 0) {
    summary = `Performance improved: ${improvements.join(', ')}`;
  } else if (improvements.length === 0) {
    summary = `Performance degraded: ${issues.join(', ')}`;
  } else {
    summary = `Mixed results: ${improvements.join(', ')} but ${issues.join(', ')}`;
  }
  
  return {
    endpoint: current.endpoint,
    method: current.method,
    baseline,
    current,
    differences: {
      latency: latencyDiff,
      throughput: throughputDiff,
      errorRate: errorRateDiff
    },
    percentChanges: {
      latency: latencyPctChange,
      throughput: throughputPctChange,
      errorRate: errorRatePctChange
    },
    assessment: {
      passed: !hasCriticalIssues,
      issues,
      improvements,
      summary
    }
  };
};

/**
 * Calculate percentage change between two values
 * Returns positive number if newValue is worse, negative if better
 */
const percentChange = (baseValue: number, newValue: number): number => {
  if (baseValue === 0) return newValue === 0 ? 0 : 100;
  return ((newValue - baseValue) / Math.abs(baseValue)) * 100;
};

/**
 * Get formatted output for displaying test results
 */
export const formatTestResult = (result: TestResult): string => {
  return `
Test Results for ${result.method} ${result.endpoint}
=====================================
Timestamp: ${result.timestamp}
Duration: ${result.duration}s
Concurrency: ${result.concurrency} users

Latency:
  Min: ${result.latency.min.toFixed(2)}ms
  Mean: ${result.latency.mean.toFixed(2)}ms
  Median: ${result.latency.median.toFixed(2)}ms
  P95: ${result.latency.p95.toFixed(2)}ms
  P99: ${result.latency.p99.toFixed(2)}ms
  Max: ${result.latency.max.toFixed(2)}ms

Throughput:
  Requests/sec: ${result.throughput.rps.toFixed(2)}
  Total Requests: ${result.throughput.totalRequests}
  Successful: ${result.throughput.successfulRequests}
  Failed: ${result.throughput.failedRequests}

Error Rate: ${(result.errorRate.rate * 100).toFixed(2)}%
  `;
};

/**
 * Get formatted output for comparison results
 */
export const formatComparisonResult = (comparison: ComparisonResult): string => {
  const { current, baseline, percentChanges, assessment } = comparison;
  
  return `
Comparison Results for ${current.method} ${current.endpoint}
=====================================
Duration: ${current.duration}s
Concurrency: ${current.concurrency} users

Latency (current → baseline):
  Median: ${current.latency.median.toFixed(2)}ms → ${baseline.latency.median.toFixed(2)}ms (${formatPercent(percentChanges.latency.median)})
  P95: ${current.latency.p95.toFixed(2)}ms → ${baseline.latency.p95.toFixed(2)}ms (${formatPercent(percentChanges.latency.p95)})
  P99: ${current.latency.p99.toFixed(2)}ms → ${baseline.latency.p99.toFixed(2)}ms (${formatPercent(percentChanges.latency.p99)})

Throughput:
  Requests/sec: ${current.throughput.rps.toFixed(2)} → ${baseline.throughput.rps.toFixed(2)} (${formatPercent(percentChanges.throughput.rps * -1)})

Error Rate: ${(current.errorRate.rate * 100).toFixed(2)}% → ${(baseline.errorRate.rate * 100).toFixed(2)}% (${formatPercent(percentChanges.errorRate.rate)})

Assessment: ${assessment.passed ? 'PASSED' : 'FAILED'}
${assessment.summary}

${assessment.improvements.length > 0 ? `Improvements:\n  ${assessment.improvements.join('\n  ')}\n` : ''}
${assessment.issues.length > 0 ? `Issues:\n  ${assessment.issues.join('\n  ')}\n` : ''}
  `;
};

/**
 * Format percentage for display
 */
const formatPercent = (value: number): string => {
  const formatted = Math.abs(value).toFixed(2) + '%';
  if (value > 0) return `+${formatted} (worse)`;
  if (value < 0) return `-${formatted} (better)`;
  return `${formatted} (no change)`;
};

export default {
  saveTestResult,
  loadTestResult,
  processAutocannonResult,
  compareWithBaseline,
  formatTestResult,
  formatComparisonResult
}; 