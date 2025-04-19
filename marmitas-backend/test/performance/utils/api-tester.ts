/**
 * API Performance Tester
 * 
 * Utility for running performance tests against API endpoints
 * using Autocannon and processing the results.
 */

import autocannon, { Result } from 'autocannon';
import { writeFileSync } from 'fs';
import path from 'path';
import { BASE_CONFIG, API_ENDPOINTS } from '../config';
import { 
  processAutocannonResult, 
  saveTestResult, 
  formatTestResult, 
  TestResult 
} from './metrics';

// Default headers for API requests
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Interface for test options
export interface ApiTestOptions {
  endpoint: string;
  method: string;
  url?: string;
  payload?: any;
  headers?: Record<string, string>;
  auth?: { token?: string; };
  queryParams?: Record<string, string>;
  concurrency?: number;
  duration?: number;
  connections?: number;
  pipelining?: number;
  workers?: number;
  setupFn?: () => Promise<any>;
  teardownFn?: () => Promise<void>;
}

/**
 * Run a performance test against a specific API endpoint
 */
export const runApiTest = async (options: ApiTestOptions): Promise<TestResult> => {
  const {
    endpoint,
    method,
    url,
    payload,
    headers = {},
    auth,
    queryParams = {},
    concurrency = BASE_CONFIG.concurrency.default,
    duration = BASE_CONFIG.duration.default,
    connections = concurrency,
    pipelining = 1,
    workers = 1,
    setupFn,
    teardownFn
  } = options;

  // Run any setup function if provided
  let setupData;
  if (setupFn) {
    console.log(`Running setup function for ${method} ${endpoint}...`);
    setupData = await setupFn();
  }

  // Construct the full URL with query parameters
  const baseUrl = url || BASE_CONFIG.getEndpointUrl(endpoint);
  const queryString = Object.keys(queryParams).length > 0
    ? '?' + new URLSearchParams(queryParams).toString()
    : '';
  const fullUrl = `${baseUrl}${queryString}`;

  // Build request headers
  const requestHeaders = {
    ...DEFAULT_HEADERS,
    ...headers
  };

  if (auth?.token) {
    requestHeaders['Authorization'] = `Bearer ${auth.token}`;
  }

  // Configure autocannon options
  const cannonOptions: autocannon.Options = {
    url: fullUrl,
    method: method as any,
    headers: requestHeaders,
    connections,
    pipelining,
    duration,
    workers,
    title: `${method} ${endpoint}`,
    excludeErrorStats: false
  };

  // Add body if payload is provided and method supports it
  if (payload && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    const jsonBody = JSON.stringify(payload);
    cannonOptions.body = jsonBody;
    cannonOptions.headers = {
      ...cannonOptions.headers,
      'Content-Length': Buffer.byteLength(jsonBody).toString()
    };
  }

  console.log(`Starting performance test for ${method} ${endpoint}...`);
  console.log(`URL: ${fullUrl}`);
  console.log(`Concurrency: ${concurrency}, Duration: ${duration}s`);

  try {
    // Run the performance test
    const results = await new Promise<Result>((resolve, reject) => {
      autocannon(cannonOptions, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });

    // Process and save results
    const testResult = processAutocannonResult(results, endpoint, method, concurrency);
    
    // Include setup data in metadata if available
    if (setupData) {
      testResult.metadata = { ...testResult.metadata, setupData };
    }
    
    // Save raw results for debugging
    const rawResultsPath = path.join(
      BASE_CONFIG.output.dir, 
      `raw_${endpoint.replace(/\//g, '_')}_${method}_${concurrency}users_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    writeFileSync(rawResultsPath, JSON.stringify(results, null, 2));

    // Save processed results
    const resultPath = saveTestResult(testResult);
    
    console.log(`Test completed for ${method} ${endpoint}`);
    console.log(formatTestResult(testResult));
    console.log(`Results saved to: ${resultPath}`);
    console.log(`Raw data saved to: ${rawResultsPath}`);

    // Run teardown if provided
    if (teardownFn) {
      console.log(`Running teardown function for ${method} ${endpoint}...`);
      await teardownFn();
    }

    return testResult;
  } catch (error) {
    console.error(`Test failed for ${method} ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Run performance tests for a group of API endpoints
 */
export const runApiTestGroup = async (
  endpointKeys: string[], 
  options: Partial<ApiTestOptions> = {}
): Promise<Record<string, TestResult>> => {
  const results: Record<string, TestResult> = {};
  
  for (const key of endpointKeys) {
    const endpoint = API_ENDPOINTS[key];
    if (!endpoint) {
      console.warn(`Endpoint "${key}" not found in API_ENDPOINTS configuration. Skipping...`);
      continue;
    }
    
    try {
      const testResult = await runApiTest({
        ...endpoint,
        ...options
      });
      
      results[key] = testResult;
    } catch (error) {
      console.error(`Failed to run test for "${key}":`, error);
    }
  }
  
  return results;
};

/**
 * Utility to run performance tests for all defined API endpoints
 */
export const runAllApiTests = async (
  options: Partial<ApiTestOptions> = {}
): Promise<Record<string, TestResult>> => {
  return runApiTestGroup(Object.keys(API_ENDPOINTS), options);
};

export default {
  runApiTest,
  runApiTestGroup,
  runAllApiTests
}; 

