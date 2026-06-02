// Performance Test Suite for Sudhan Textile ERP
// Run with: k6 run performance-tests.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const yarnReceiptDuration = new Trend('yarn_receipt_creation_duration');

// Test configuration
export const options = {
    stages: [
        { duration: '1m', target: 10 },  // Ramp up to 10 users
        { duration: '3m', target: 10 },  // Stay at 10 users for 3 minutes
        { duration: '1m', target: 25 },  // Ramp up to 25 users
        { duration: '3m', target: 25 },  // Stay at 25 users
        { duration: '1m', target: 50 },  // Ramp up to 50 users
        { duration: '3m', target: 50 },  // Stay at 50 users
        { duration: '2m', target: 0 },   // Ramp down to 0 users
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
        errors: ['rate<0.1'],              // Error rate should be less than 10%
    },
};

const BASE_URL = 'http://localhost:5000/api';

// Test data
const TEST_USER = {
    username: 'admin',
    password: 'Admin@123'
};

let authToken = '';

export function setup() {
    // Login once to get auth token
    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(TEST_USER), {
        headers: { 'Content-Type': 'application/json' },
    });

    check(loginRes, {
        'setup login successful': (r) => r.status === 200,
    });

    const body = JSON.parse(loginRes.body);
    return { token: body.token };
}

export default function (data) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.token}`
    };

    // Test 1: Authentication (login)
    testLogin();

    sleep(1);

    // Test 2: Read operations (Master Data)
    testReadMasterData(headers);

    sleep(1);

    // Test 3: Yarn Receipt Creation (Write-heavy operation)
    testYarnReceiptCreation(headers);

    sleep(2);

    // Test 4: Reports (Heavy read with joins)
    testReports(headers);

    sleep(1);
}

function testLogin() {
    const start = Date.now();
    const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify(TEST_USER), {
        headers: { 'Content-Type': 'application/json' },
    });

    const success = check(res, {
        'login status is 200': (r) => r.status === 200,
        'login has token': (r) => JSON.parse(r.body).token !== undefined,
    });

    errorRate.add(!success);
    loginDuration.add(Date.now() - start);
}

function testReadMasterData(headers) {
    const endpoints = [
        '/masters/yarn-counts',
        '/masters/loom-types',
        '/parties',
    ];

    endpoints.forEach(endpoint => {
        const res = http.get(`${BASE_URL}${endpoint}`, { headers });
        
        const success = check(res, {
            [`${endpoint} status is 200`]: (r) => r.status === 200,
        });

        errorRate.add(!success);
    });
}

function testYarnReceiptCreation(headers) {
    const yarnReceipt = {
        partyId: 1,
        receiptDate: new Date().toISOString(),
        vehicleNumber: 'TN01AB1234',
        challanNumber: 'CH' + Math.floor(Math.random() * 10000),
        challanDate: new Date().toISOString(),
        remarks: 'Load test receipt',
        details: [
            {
                yarnCountId: 1,
                numberOfBags: 10,
                grossWeight: 100,
                tareWeight: 10,
                netWeight: 90
            }
        ]
    };

    const start = Date.now();
    const res = http.post(`${BASE_URL}/yarn-receipts`, JSON.stringify(yarnReceipt), { headers });

    const success = check(res, {
        'yarn receipt creation status is 200/201': (r) => r.status === 200 || r.status === 201,
    });

    errorRate.add(!success);
    yarnReceiptDuration.add(Date.now() - start);
}

function testReports(headers) {
    // Test stock report (involves joins and aggregations)
    const res = http.get(`${BASE_URL}/reports/stock-summary`, { headers });

    const success = check(res, {
        'stock report status is 200': (r) => r.status === 200,
        'stock report has data': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body !== null;
            } catch {
                return false;
            }
        },
    });

    errorRate.add(!success);
}

export function teardown(data) {
    console.log('Performance test completed');
}
