/**
 * k6 Performance Tests - Stress Test
 * Tests application behavior under extreme load conditions
 * 
 * Test IDs: STRESS-01 to STRESS-03
 * 
 * Run with: k6 run tests/performance/stress-test.js
 * Run with env: k6 run -e BASE_URL=http://localhost:5000 tests/performance/stress-test.js
 */

import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTrend = new Trend('response_time');
const requestsPerSecond = new Counter('requests_per_second');
const successfulLogins = new Counter('successful_logins');
const failedRequests = new Counter('failed_requests');

// Stress test configuration
export const options = {
  scenarios: {
    // STRESS-01: Breaking point test
    breaking_point: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 500,
      stages: [
        { duration: '30s', target: 10 },   // Start with 10 req/s
        { duration: '1m', target: 50 },    // Ramp to 50 req/s
        { duration: '1m', target: 100 },   // Ramp to 100 req/s
        { duration: '1m', target: 200 },   // Ramp to 200 req/s
        { duration: '1m', target: 300 },   // Ramp to 300 req/s (stress)
        { duration: '1m', target: 400 },   // Ramp to 400 req/s (high stress)
        { duration: '30s', target: 0 },    // Recovery
      ],
      tags: { test: 'breaking_point' },
    },
  },
  
  thresholds: {
    http_req_duration: ['p(95)<2000'],      // Allow higher latency under stress
    http_req_failed: ['rate<0.10'],         // Allow up to 10% failure under stress
    error_rate: ['rate<0.15'],              // Custom error rate
    response_time: ['p(99)<5000'],          // 99% under 5s even under stress
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

const TEST_USERS = [
  { email: 'stress1@atombank.com', password: 'Stress123!' },
  { email: 'stress2@atombank.com', password: 'Stress123!' },
  { email: 'stress3@atombank.com', password: 'Stress123!' },
  { email: 'demo@atombank.com', password: 'Demo123!' },
];

function getRandomUser() {
  return TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
}

function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// ============================================
// STRESS-01: CONCURRENT LOGIN STRESS
// ============================================
function stressLogin() {
  const user = getRandomUser();
  const startTime = Date.now();
  
  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'login' },
    timeout: '10s',
  });
  
  const duration = Date.now() - startTime;
  responseTrend.add(duration);
  requestsPerSecond.add(1);
  
  const success = check(res, {
    'login response received': (r) => r !== null,
    'login status OK': (r) => r.status === 200 || r.status === 429, // 429 = rate limited, acceptable
    'login has body': (r) => r.body !== null,
  });
  
  if (res.status === 200 && res.json('token')) {
    successfulLogins.add(1);
    return res.json('token');
  }
  
  if (res.status === 429) {
    // Rate limited - not an error, just stressed
    console.log('Rate limited - server protecting itself');
    return null;
  }
  
  errorRate.add(!success);
  if (!success) {
    failedRequests.add(1);
  }
  
  return null;
}

// ============================================
// STRESS-02: API ENDPOINT STRESS
// ============================================
function stressAPI(token) {
  if (!token) return;
  
  const endpoints = [
    { method: 'GET', url: '/api/account', name: 'accounts' },
    { method: 'GET', url: '/api/bills', name: 'bills' },
    { method: 'GET', url: '/api/auth/me', name: 'profile' },
  ];
  
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const startTime = Date.now();
  
  let res;
  if (endpoint.method === 'GET') {
    res = http.get(`${BASE_URL}${endpoint.url}`, {
      headers: getAuthHeaders(token),
      tags: { endpoint: endpoint.name },
      timeout: '10s',
    });
  }
  
  const duration = Date.now() - startTime;
  responseTrend.add(duration);
  requestsPerSecond.add(1);
  
  const success = check(res, {
    'API response received': (r) => r !== null,
    'API status OK or rate limited': (r) => r.status === 200 || r.status === 429,
  });
  
  errorRate.add(!success);
  if (!success && res.status !== 429) {
    failedRequests.add(1);
  }
}

// ============================================
// STRESS-03: TRANSACTION STRESS
// ============================================
function stressTransaction(token) {
  if (!token) return;
  
  // First get accounts
  const accountsRes = http.get(`${BASE_URL}/api/account`, {
    headers: getAuthHeaders(token),
    timeout: '10s',
  });
  
  if (accountsRes.status !== 200) return;
  
  const accounts = accountsRes.json('accounts');
  if (!accounts || accounts.length < 1) return;
  
  // Random transaction type
  const transactionTypes = ['deposit', 'withdraw'];
  const txType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
  const amount = Math.floor(Math.random() * 100) + 1;
  
  const startTime = Date.now();
  let res;
  
  if (txType === 'deposit') {
    res = http.post(`${BASE_URL}/api/transactions/deposit`, JSON.stringify({
      accountId: accounts[0]._id,
      amount: amount,
      description: 'k6 stress test',
    }), {
      headers: getAuthHeaders(token),
      tags: { endpoint: 'deposit' },
      timeout: '15s',
    });
  } else {
    res = http.post(`${BASE_URL}/api/transactions/withdraw`, JSON.stringify({
      accountId: accounts[0]._id,
      amount: amount,
      description: 'k6 stress test',
    }), {
      headers: getAuthHeaders(token),
      tags: { endpoint: 'withdraw' },
      timeout: '15s',
    });
  }
  
  const duration = Date.now() - startTime;
  responseTrend.add(duration);
  requestsPerSecond.add(1);
  
  const success = check(res, {
    'transaction response received': (r) => r !== null,
    'transaction completed or handled': (r) => r.status === 200 || r.status === 400 || r.status === 429,
  });
  
  if (!success) {
    failedRequests.add(1);
  }
  errorRate.add(!success);
}

// ============================================
// MAIN STRESS TEST FUNCTION
// ============================================
export default function() {
  // Randomly choose test type
  const testWeight = Math.random();
  
  if (testWeight < 0.5) {
    // 50% - Login stress
    const token = stressLogin();
    if (token) {
      sleep(0.1);
      stressAPI(token);
    }
  } else if (testWeight < 0.8) {
    // 30% - API stress (with cached token)
    const token = stressLogin();
    if (token) {
      stressAPI(token);
      stressAPI(token);
      stressAPI(token);
    }
  } else {
    // 20% - Transaction stress
    const token = stressLogin();
    if (token) {
      stressTransaction(token);
    }
  }
  
  // Minimal sleep to maximize stress
  sleep(0.1);
}

// ============================================
// SETUP
// ============================================
export function setup() {
  console.log('\n🔥 STRESS TEST STARTING 🔥');
  console.log(`Target: ${BASE_URL}`);
  console.log('This test will push the system to its limits!\n');
  
  // Warm-up request
  const res = http.get(`${BASE_URL}/api/health || ${BASE_URL}`);
  console.log(`Server status: ${res.status}`);
  
  return { startTime: Date.now() };
}

// ============================================
// TEARDOWN
// ============================================
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000 / 60;
  console.log(`\n🏁 STRESS TEST COMPLETED 🏁`);
  console.log(`Duration: ${duration.toFixed(2)} minutes`);
}

// ============================================
// HANDLE SUMMARY
// ============================================
export function handleSummary(data) {
  const summary = {
    type: 'stress_test',
    timestamp: new Date().toISOString(),
    metrics: {
      totalRequests: data.metrics.http_reqs?.values?.count || 0,
      failedRequests: data.metrics.failed_requests?.values?.count || 0,
      successfulLogins: data.metrics.successful_logins?.values?.count || 0,
      avgResponseTime: data.metrics.response_time?.values?.avg || 0,
      p95ResponseTime: data.metrics.response_time?.values?.['p(95)'] || 0,
      p99ResponseTime: data.metrics.response_time?.values?.['p(99)'] || 0,
      maxResponseTime: data.metrics.response_time?.values?.max || 0,
      errorRate: data.metrics.error_rate?.values?.rate || 0,
    },
    thresholds: Object.keys(data.thresholds || {}).reduce((acc, key) => {
      acc[key] = data.thresholds[key].ok ? 'PASSED' : 'FAILED';
      return acc;
    }, {}),
  };
  
  let textOutput = '\n';
  textOutput += '╔════════════════════════════════════════════════════╗\n';
  textOutput += '║           STRESS TEST RESULTS                       ║\n';
  textOutput += '╠════════════════════════════════════════════════════╣\n';
  textOutput += `║ Total Requests:      ${String(summary.metrics.totalRequests).padStart(10)}              ║\n`;
  textOutput += `║ Failed Requests:     ${String(summary.metrics.failedRequests).padStart(10)}              ║\n`;
  textOutput += `║ Successful Logins:   ${String(summary.metrics.successfulLogins).padStart(10)}              ║\n`;
  textOutput += `║ Avg Response Time:   ${String(summary.metrics.avgResponseTime.toFixed(0) + 'ms').padStart(10)}              ║\n`;
  textOutput += `║ P95 Response Time:   ${String(summary.metrics.p95ResponseTime.toFixed(0) + 'ms').padStart(10)}              ║\n`;
  textOutput += `║ P99 Response Time:   ${String(summary.metrics.p99ResponseTime.toFixed(0) + 'ms').padStart(10)}              ║\n`;
  textOutput += `║ Max Response Time:   ${String(summary.metrics.maxResponseTime.toFixed(0) + 'ms').padStart(10)}              ║\n`;
  textOutput += `║ Error Rate:          ${String((summary.metrics.errorRate * 100).toFixed(2) + '%').padStart(10)}              ║\n`;
  textOutput += '╠════════════════════════════════════════════════════╣\n';
  textOutput += '║ THRESHOLD RESULTS:                                  ║\n';
  
  Object.keys(summary.thresholds).forEach(key => {
    const status = summary.thresholds[key] === 'PASSED' ? '✓' : '✗';
    textOutput += `║   ${status} ${key.substring(0, 40).padEnd(40)}   ║\n`;
  });
  
  textOutput += '╚════════════════════════════════════════════════════╝\n';
  
  return {
    'stdout': textOutput,
    'test-results/stress-test-summary.json': JSON.stringify(summary, null, 2),
  };
}
