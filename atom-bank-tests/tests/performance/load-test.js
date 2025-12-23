/**
 * k6 Performance Tests - Load Test
 * Tests application performance under normal and peak load
 * 
 * Test IDs: PERF-01 to PERF-05
 * 
 * Run with: k6 run tests/performance/load-test.js
 * Run with options: k6 run --vus 50 --duration 1m tests/performance/load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const loginDuration = new Trend('login_duration');
const dashboardDuration = new Trend('dashboard_duration');
const transferDuration = new Trend('transfer_duration');
const transactionCount = new Counter('transactions_completed');

// Test configuration
export const options = {
  // Test scenarios
  scenarios: {
    // Scenario 1: Constant load test
    constant_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2m',
      tags: { scenario: 'constant' },
    },
    // Scenario 2: Ramping load test
    ramping_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },   // Ramp up to 20 users
        { duration: '1m', target: 50 },    // Ramp up to 50 users
        { duration: '30s', target: 100 },  // Peak at 100 users
        { duration: '1m', target: 100 },   // Stay at peak
        { duration: '30s', target: 0 },    // Ramp down
      ],
      tags: { scenario: 'ramping' },
      startTime: '2m30s', // Start after constant load
    },
    // Scenario 3: Spike test
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },   // Normal load
        { duration: '10s', target: 200 },  // Spike!
        { duration: '30s', target: 200 },  // Stay at spike
        { duration: '10s', target: 10 },   // Back to normal
        { duration: '30s', target: 10 },   // Recovery
      ],
      tags: { scenario: 'spike' },
      startTime: '6m', // Start after ramping
    },
  },
  
  // Thresholds for pass/fail
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95% under 500ms, 99% under 1s
    http_req_failed: ['rate<0.01'],                  // Less than 1% failure rate
    error_rate: ['rate<0.05'],                       // Custom error rate under 5%
    login_duration: ['p(95)<1000'],                  // Login under 1s for 95%
    dashboard_duration: ['p(95)<800'],               // Dashboard under 800ms for 95%
    transfer_duration: ['p(95)<1500'],               // Transfer under 1.5s for 95%
  },
};

// Base URL - change to your actual server URL
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Test data
const TEST_USERS = [
  { email: 'test1@atombank.com', password: 'Test123!' },
  { email: 'test2@atombank.com', password: 'Test123!' },
  { email: 'test3@atombank.com', password: 'Test123!' },
  { email: 'demo@atombank.com', password: 'Demo123!' },
];

// Helper function to get random user
function getRandomUser() {
  return TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
}

// Helper function to get auth headers
function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// ============================================
// PERF-01: LOGIN PERFORMANCE
// ============================================
function testLogin() {
  const user = getRandomUser();
  
  const startTime = Date.now();
  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'Login' },
  });
  const duration = Date.now() - startTime;
  
  loginDuration.add(duration);
  
  const success = check(res, {
    'login status is 200': (r) => r.status === 200,
    'login has token': (r) => r.json('token') !== undefined,
    'login under 1s': () => duration < 1000,
  });
  
  errorRate.add(!success);
  
  return res.json('token');
}

// ============================================
// PERF-02: DASHBOARD LOAD PERFORMANCE
// ============================================
function testDashboard(token) {
  const startTime = Date.now();
  const res = http.get(`${BASE_URL}/api/account`, {
    headers: getAuthHeaders(token),
    tags: { name: 'Dashboard' },
  });
  const duration = Date.now() - startTime;
  
  dashboardDuration.add(duration);
  
  const success = check(res, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard has accounts': (r) => r.json('accounts') !== undefined,
    'dashboard under 800ms': () => duration < 800,
  });
  
  errorRate.add(!success);
  
  return res.json('accounts');
}

// ============================================
// PERF-03: TRANSACTION HISTORY PERFORMANCE
// ============================================
function testTransactionHistory(token, accountId) {
  const res = http.get(`${BASE_URL}/api/transactions/${accountId}?limit=50`, {
    headers: getAuthHeaders(token),
    tags: { name: 'TransactionHistory' },
  });
  
  const success = check(res, {
    'history status is 200': (r) => r.status === 200,
    'history has transactions': (r) => r.json('transactions') !== undefined,
  });
  
  errorRate.add(!success);
  
  return res.json('transactions');
}

// ============================================
// PERF-04: TRANSFER PERFORMANCE
// ============================================
function testTransfer(token, fromAccountId, toAccountId) {
  const amount = Math.floor(Math.random() * 100) + 1; // Random 1-100
  
  const startTime = Date.now();
  const res = http.post(`${BASE_URL}/api/transactions/transfer-internal`, JSON.stringify({
    fromAccountId: fromAccountId,
    toAccountId: toAccountId,
    amount: amount,
    description: 'k6 performance test',
  }), {
    headers: getAuthHeaders(token),
    tags: { name: 'Transfer' },
  });
  const duration = Date.now() - startTime;
  
  transferDuration.add(duration);
  
  const success = check(res, {
    'transfer status is 200': (r) => r.status === 200,
    'transfer successful': (r) => r.json('success') === true,
    'transfer under 1.5s': () => duration < 1500,
  });
  
  if (success) {
    transactionCount.add(1);
  }
  
  errorRate.add(!success);
}

// ============================================
// PERF-05: DEPOSIT PERFORMANCE
// ============================================
function testDeposit(token, accountId) {
  const amount = Math.floor(Math.random() * 1000) + 100; // Random 100-1100
  
  const res = http.post(`${BASE_URL}/api/transactions/deposit`, JSON.stringify({
    accountId: accountId,
    amount: amount,
    description: 'k6 performance test deposit',
  }), {
    headers: getAuthHeaders(token),
    tags: { name: 'Deposit' },
  });
  
  const success = check(res, {
    'deposit status is 200': (r) => r.status === 200,
    'deposit successful': (r) => r.json('success') === true,
  });
  
  if (success) {
    transactionCount.add(1);
  }
  
  errorRate.add(!success);
}

// ============================================
// MAIN TEST FUNCTION
// ============================================
export default function() {
  group('User Session', function() {
    // Step 1: Login
    group('Login', function() {
      const token = testLogin();
      if (!token) {
        console.error('Login failed, skipping remaining tests');
        return;
      }
      
      sleep(1);
      
      // Step 2: Load Dashboard
      group('Dashboard', function() {
        const accounts = testDashboard(token);
        
        if (accounts && accounts.length > 0) {
          sleep(0.5);
          
          // Step 3: View Transaction History
          group('Transaction History', function() {
            testTransactionHistory(token, accounts[0]._id);
          });
          
          sleep(0.5);
          
          // Step 4: Make Deposit (50% of time)
          if (Math.random() < 0.5) {
            group('Deposit', function() {
              testDeposit(token, accounts[0]._id);
            });
          }
          
          sleep(0.5);
          
          // Step 5: Make Transfer (if multiple accounts)
          if (accounts.length >= 2) {
            group('Transfer', function() {
              testTransfer(token, accounts[0]._id, accounts[1]._id);
            });
          }
        }
      });
    });
  });
  
  // Random think time between iterations (1-3 seconds)
  sleep(Math.random() * 2 + 1);
}

// ============================================
// SETUP FUNCTION
// ============================================
export function setup() {
  console.log('Starting performance tests...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Users: ${TEST_USERS.length}`);
  
  // Verify server is up
  const res = http.get(`${BASE_URL}/api/health || ${BASE_URL}`);
  if (res.status !== 200) {
    console.warn('Server may not be responding correctly');
  }
  
  return { startTime: Date.now() };
}

// ============================================
// TEARDOWN FUNCTION
// ============================================
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`\nPerformance test completed in ${duration.toFixed(2)} seconds`);
}

// ============================================
// HANDLE SUMMARY
// ============================================
export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    totalRequests: data.metrics.http_reqs.values.count,
    failedRequests: data.metrics.http_req_failed.values.passes,
    avgResponseTime: data.metrics.http_req_duration.values.avg,
    p95ResponseTime: data.metrics.http_req_duration.values['p(95)'],
    p99ResponseTime: data.metrics.http_req_duration.values['p(99)'],
    errorRate: data.metrics.error_rate ? data.metrics.error_rate.values.rate : 0,
    transactionsCompleted: data.metrics.transactions_completed ? data.metrics.transactions_completed.values.count : 0,
    thresholds: data.thresholds,
  };
  
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'test-results/k6-summary.json': JSON.stringify(summary, null, 2),
  };
}

// Simple text summary function
function textSummary(data, options) {
  let output = '\n========================================\n';
  output += '    ATOM BANK - PERFORMANCE TEST RESULTS    \n';
  output += '========================================\n\n';
  
  output += `Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  output += `Failed Requests: ${data.metrics.http_req_failed.values.passes}\n`;
  output += `Average Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  output += `P95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  output += `P99 Response Time: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  
  if (data.metrics.transactions_completed) {
    output += `Transactions Completed: ${data.metrics.transactions_completed.values.count}\n`;
  }
  
  output += '\nThreshold Results:\n';
  Object.keys(data.thresholds || {}).forEach(key => {
    const passed = data.thresholds[key].ok;
    output += `  ${passed ? '✓' : '✗'} ${key}: ${passed ? 'PASSED' : 'FAILED'}\n`;
  });
  
  output += '\n========================================\n';
  
  return output;
}
