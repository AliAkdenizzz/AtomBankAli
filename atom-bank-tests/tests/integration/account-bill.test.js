/**
 * Integration Tests: Account & Bill API
 * Tests for /api/account and /api/bills endpoints
 * 
 * Test IDs: IT-ACC-01 to IT-ACC-10, IT-BILL-01 to IT-BILL-08
 */

const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');

// Mock Express app
const app = express();
app.use(express.json());

// Mock data
let mockUsers = [];
let mockAccounts = new Map();

// Auth middleware mock
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  const token = authHeader.split(' ')[1];
  const userId = token.replace('mock_token_', '');
  const user = mockUsers.find(u => u._id === userId);
  if (!user) {
    return res.status(401).json({ success: false, message: 'User not found' });
  }
  req.user = user;
  next();
};

// ============================================
// MOCK ACCOUNT ROUTES
// ============================================

// Get all accounts
app.get('/api/account', authMiddleware, (req, res) => {
  const accounts = mockAccounts.get(req.user._id) || [];
  res.status(200).json({
    success: true,
    accounts: accounts.map(a => ({
      _id: a._id,
      accountNumber: a.accountNumber,
      iban: a.iban,
      accountType: a.accountType,
      currency: a.currency,
      balance: a.balance,
      status: a.status
    }))
  });
});

// Get single account
app.get('/api/account/:id', authMiddleware, (req, res) => {
  const accounts = mockAccounts.get(req.user._id) || [];
  const account = accounts.find(a => a._id === req.params.id);
  
  if (!account) {
    return res.status(404).json({ success: false, message: 'Account not found' });
  }
  
  res.status(200).json({ success: true, account });
});

// Create account
app.post('/api/account', authMiddleware, (req, res) => {
  const { accountType, currency } = req.body;
  
  const validTypes = ['checking', 'savings', 'investment'];
  const validCurrencies = ['TRY', 'USD', 'EUR'];
  
  if (!accountType || !validTypes.includes(accountType)) {
    return res.status(400).json({ success: false, message: 'Invalid account type' });
  }
  
  if (!currency || !validCurrencies.includes(currency)) {
    return res.status(400).json({ success: false, message: 'Invalid currency' });
  }
  
  // Check account limit (max 5 accounts)
  const existingAccounts = mockAccounts.get(req.user._id) || [];
  if (existingAccounts.length >= 5) {
    return res.status(400).json({ success: false, message: 'Maximum account limit reached' });
  }
  
  const newAccount = {
    _id: new mongoose.Types.ObjectId().toString(),
    accountNumber: Math.random().toString().slice(2, 14),
    iban: 'TR33' + Math.random().toString().slice(2, 26),
    accountType,
    currency,
    balance: 0,
    status: 'active',
    transactions: [],
    createdAt: new Date()
  };
  
  existingAccounts.push(newAccount);
  mockAccounts.set(req.user._id, existingAccounts);
  
  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    account: newAccount
  });
});

// Close account
app.put('/api/account/:id/close', authMiddleware, (req, res) => {
  const accounts = mockAccounts.get(req.user._id) || [];
  const account = accounts.find(a => a._id === req.params.id);
  
  if (!account) {
    return res.status(404).json({ success: false, message: 'Account not found' });
  }
  
  if (account.balance > 0) {
    return res.status(400).json({ success: false, message: 'Cannot close account with positive balance' });
  }
  
  if (account.status === 'closed') {
    return res.status(400).json({ success: false, message: 'Account is already closed' });
  }
  
  account.status = 'closed';
  
  res.status(200).json({
    success: true,
    message: 'Account closed successfully'
  });
});

// ============================================
// MOCK BILL ROUTES
// ============================================

// Get all bills
app.get('/api/bills', authMiddleware, (req, res) => {
  const bills = req.user.bills || [];
  res.status(200).json({ success: true, bills });
});

// Add bill
app.post('/api/bills', authMiddleware, (req, res) => {
  const { billType, provider, subscriberNo, amount, dueDate } = req.body;
  
  const validTypes = ['electricity', 'water', 'gas', 'internet', 'phone'];
  
  if (!billType || !validTypes.includes(billType)) {
    return res.status(400).json({ success: false, message: 'Invalid bill type' });
  }
  
  if (!provider || provider.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Provider is required' });
  }
  
  if (!subscriberNo || subscriberNo.length < 5) {
    return res.status(400).json({ success: false, message: 'Invalid subscriber number' });
  }
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }
  
  const newBill = {
    _id: new mongoose.Types.ObjectId().toString(),
    billType,
    provider,
    subscriberNo,
    amount,
    currency: 'TRY',
    dueDate: dueDate || null,
    status: 'pending',
    createdAt: new Date()
  };
  
  req.user.bills = req.user.bills || [];
  req.user.bills.push(newBill);
  
  res.status(201).json({
    success: true,
    message: 'Bill added successfully',
    bill: newBill
  });
});

// Pay bill
app.post('/api/bills/:id/pay', authMiddleware, (req, res) => {
  const { accountId } = req.body;
  
  const bill = (req.user.bills || []).find(b => b._id === req.params.id);
  if (!bill) {
    return res.status(404).json({ success: false, message: 'Bill not found' });
  }
  
  if (bill.status === 'paid') {
    return res.status(400).json({ success: false, message: 'Bill is already paid' });
  }
  
  const accounts = mockAccounts.get(req.user._id) || [];
  const account = accounts.find(a => a._id === accountId);
  
  if (!account) {
    return res.status(404).json({ success: false, message: 'Account not found' });
  }
  
  if (account.status !== 'active') {
    return res.status(400).json({ success: false, message: 'Account is not active' });
  }
  
  if (account.balance < bill.amount) {
    return res.status(400).json({ success: false, message: 'Insufficient balance' });
  }
  
  // Process payment
  account.balance -= bill.amount;
  bill.status = 'paid';
  bill.paidAt = new Date();
  bill.paidFromAccount = accountId;
  
  // Add transaction
  account.transactions = account.transactions || [];
  account.transactions.push({
    _id: new mongoose.Types.ObjectId().toString(),
    type: 'bill-payment',
    amount: bill.amount,
    currency: bill.currency,
    description: `${bill.billType} bill payment - ${bill.provider}`,
    date: new Date(),
    status: 'completed'
  });
  
  res.status(200).json({
    success: true,
    message: 'Bill paid successfully',
    newBalance: account.balance
  });
});

// Delete bill
app.delete('/api/bills/:id', authMiddleware, (req, res) => {
  const billIndex = (req.user.bills || []).findIndex(b => b._id === req.params.id);
  
  if (billIndex === -1) {
    return res.status(404).json({ success: false, message: 'Bill not found' });
  }
  
  const bill = req.user.bills[billIndex];
  if (bill.status === 'paid') {
    return res.status(400).json({ success: false, message: 'Cannot delete paid bill' });
  }
  
  req.user.bills.splice(billIndex, 1);
  
  res.status(200).json({
    success: true,
    message: 'Bill deleted successfully'
  });
});

// ============================================
// TEST SUITES
// ============================================

describe('Account API', () => {
  let authToken;
  let userId;
  let testAccount;

  beforeEach(() => {
    mockUsers = [];
    mockAccounts = new Map();
    
    userId = new mongoose.Types.ObjectId().toString();
    mockUsers.push({
      _id: userId,
      name: 'Test User',
      email: 'test@example.com',
      status: 'active',
      bills: []
    });
    authToken = `mock_token_${userId}`;
    
    testAccount = {
      _id: new mongoose.Types.ObjectId().toString(),
      accountNumber: '1234567890',
      iban: 'TR330006100519786457841326',
      accountType: 'checking',
      currency: 'TRY',
      balance: 10000,
      status: 'active',
      transactions: []
    };
    mockAccounts.set(userId, [testAccount]);
  });

  // ============================================
  // GET ACCOUNTS TESTS
  // ============================================
  describe('GET /api/account', () => {
    describe('IT-ACC-01: Get all accounts', () => {
      test('should return user accounts', async () => {
        const res = await request(app)
          .get('/api/account')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.accounts).toHaveLength(1);
        expect(res.body.accounts[0].accountNumber).toBe('1234567890');
      });

      test('should not include sensitive transaction data in list', async () => {
        const res = await request(app)
          .get('/api/account')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        
        // Full transaction list should not be in summary
        expect(res.body.accounts[0].transactions).toBeUndefined();
      });
    });

    describe('IT-ACC-02: Unauthorized access', () => {
      test('should return 401 without token', async () => {
        const res = await request(app)
          .get('/api/account')
          .expect(401);
        
        expect(res.body.success).toBe(false);
      });
    });
  });

  // ============================================
  // GET SINGLE ACCOUNT TESTS
  // ============================================
  describe('GET /api/account/:id', () => {
    describe('IT-ACC-03: Get account details', () => {
      test('should return account with full details', async () => {
        const res = await request(app)
          .get(`/api/account/${testAccount._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.account._id).toBe(testAccount._id);
        expect(res.body.account.balance).toBe(10000);
      });
    });

    describe('IT-ACC-04: Non-existent account', () => {
      test('should return 404 for non-existent account', async () => {
        const res = await request(app)
          .get('/api/account/nonexistent123')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
        
        expect(res.body.success).toBe(false);
      });
    });
  });

  // ============================================
  // CREATE ACCOUNT TESTS
  // ============================================
  describe('POST /api/account', () => {
    describe('IT-ACC-05: Create new account', () => {
      test('should create checking account', async () => {
        const res = await request(app)
          .post('/api/account')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            accountType: 'checking',
            currency: 'USD'
          })
          .expect(201);
        
        expect(res.body.success).toBe(true);
        expect(res.body.account.accountType).toBe('checking');
        expect(res.body.account.currency).toBe('USD');
        expect(res.body.account.balance).toBe(0);
      });

      test('should create savings account', async () => {
        const res = await request(app)
          .post('/api/account')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            accountType: 'savings',
            currency: 'TRY'
          })
          .expect(201);
        
        expect(res.body.account.accountType).toBe('savings');
      });

      test('should generate unique IBAN', async () => {
        const res = await request(app)
          .post('/api/account')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            accountType: 'checking',
            currency: 'EUR'
          })
          .expect(201);
        
        expect(res.body.account.iban).toMatch(/^TR/);
        expect(res.body.account.iban).not.toBe(testAccount.iban);
      });
    });

    describe('IT-ACC-06: Invalid account type', () => {
      test('should reject invalid account type', async () => {
        const res = await request(app)
          .post('/api/account')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            accountType: 'premium',
            currency: 'TRY'
          })
          .expect(400);
        
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Invalid account type');
      });
    });

    describe('IT-ACC-07: Invalid currency', () => {
      test('should reject invalid currency', async () => {
        const res = await request(app)
          .post('/api/account')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            accountType: 'checking',
            currency: 'BTC'
          })
          .expect(400);
        
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Invalid currency');
      });
    });

    describe('IT-ACC-08: Account limit', () => {
      test('should reject when max accounts reached', async () => {
        // Add 4 more accounts (total 5)
        for (let i = 0; i < 4; i++) {
          mockAccounts.get(userId).push({
            _id: new mongoose.Types.ObjectId().toString(),
            accountType: 'checking',
            currency: 'TRY',
            status: 'active'
          });
        }
        
        const res = await request(app)
          .post('/api/account')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            accountType: 'checking',
            currency: 'TRY'
          })
          .expect(400);
        
        expect(res.body.message).toContain('limit');
      });
    });
  });

  // ============================================
  // CLOSE ACCOUNT TESTS
  // ============================================
  describe('PUT /api/account/:id/close', () => {
    describe('IT-ACC-09: Close account with zero balance', () => {
      test('should close account successfully', async () => {
        testAccount.balance = 0;
        
        const res = await request(app)
          .put(`/api/account/${testAccount._id}/close`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(testAccount.status).toBe('closed');
      });
    });

    describe('IT-ACC-10: Cannot close account with balance', () => {
      test('should reject closing account with positive balance', async () => {
        const res = await request(app)
          .put(`/api/account/${testAccount._id}/close`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);
        
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('positive balance');
      });
    });
  });
});

// ============================================
// BILL API TESTS
// ============================================
describe('Bill API', () => {
  let authToken;
  let userId;
  let testAccount;

  beforeEach(() => {
    mockUsers = [];
    mockAccounts = new Map();
    
    userId = new mongoose.Types.ObjectId().toString();
    mockUsers.push({
      _id: userId,
      name: 'Test User',
      email: 'test@example.com',
      status: 'active',
      bills: []
    });
    authToken = `mock_token_${userId}`;
    
    testAccount = {
      _id: new mongoose.Types.ObjectId().toString(),
      accountNumber: '1234567890',
      iban: 'TR330006100519786457841326',
      accountType: 'checking',
      currency: 'TRY',
      balance: 10000,
      status: 'active',
      transactions: []
    };
    mockAccounts.set(userId, [testAccount]);
  });

  // ============================================
  // GET BILLS TESTS
  // ============================================
  describe('GET /api/bills', () => {
    describe('IT-BILL-01: Get all bills', () => {
      test('should return empty bills list initially', async () => {
        const res = await request(app)
          .get('/api/bills')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.bills).toHaveLength(0);
      });
    });
  });

  // ============================================
  // ADD BILL TESTS
  // ============================================
  describe('POST /api/bills', () => {
    describe('IT-BILL-02: Add valid bill', () => {
      test('should add electricity bill', async () => {
        const res = await request(app)
          .post('/api/bills')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            billType: 'electricity',
            provider: 'TEDAS',
            subscriberNo: '1234567890',
            amount: 350,
            dueDate: '2025-12-25'
          })
          .expect(201);
        
        expect(res.body.success).toBe(true);
        expect(res.body.bill.billType).toBe('electricity');
        expect(res.body.bill.status).toBe('pending');
      });

      test('should add water bill', async () => {
        const res = await request(app)
          .post('/api/bills')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            billType: 'water',
            provider: 'ISKI',
            subscriberNo: '9876543210',
            amount: 180
          })
          .expect(201);
        
        expect(res.body.bill.billType).toBe('water');
      });
    });

    describe('IT-BILL-03: Invalid bill type', () => {
      test('should reject invalid bill type', async () => {
        const res = await request(app)
          .post('/api/bills')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            billType: 'invalid',
            provider: 'Test',
            subscriberNo: '1234567890',
            amount: 100
          })
          .expect(400);
        
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Invalid bill type');
      });
    });

    describe('IT-BILL-04: Missing fields', () => {
      test('should reject missing provider', async () => {
        const res = await request(app)
          .post('/api/bills')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            billType: 'electricity',
            subscriberNo: '1234567890',
            amount: 100
          })
          .expect(400);
        
        expect(res.body.success).toBe(false);
      });

      test('should reject invalid subscriber number', async () => {
        const res = await request(app)
          .post('/api/bills')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            billType: 'electricity',
            provider: 'TEDAS',
            subscriberNo: '123', // Too short
            amount: 100
          })
          .expect(400);
        
        expect(res.body.success).toBe(false);
      });

      test('should reject zero amount', async () => {
        const res = await request(app)
          .post('/api/bills')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            billType: 'electricity',
            provider: 'TEDAS',
            subscriberNo: '1234567890',
            amount: 0
          })
          .expect(400);
        
        expect(res.body.success).toBe(false);
      });
    });
  });

  // ============================================
  // PAY BILL TESTS
  // ============================================
  describe('POST /api/bills/:id/pay', () => {
    let testBill;

    beforeEach(async () => {
      // Add a test bill
      const res = await request(app)
        .post('/api/bills')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          billType: 'electricity',
          provider: 'TEDAS',
          subscriberNo: '1234567890',
          amount: 350
        });
      testBill = res.body.bill;
    });

    describe('IT-BILL-05: Pay bill successfully', () => {
      test('should pay bill and update balance', async () => {
        const initialBalance = testAccount.balance;
        
        const res = await request(app)
          .post(`/api/bills/${testBill._id}/pay`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ accountId: testAccount._id })
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.newBalance).toBe(initialBalance - testBill.amount);
      });
    });

    describe('IT-BILL-06: Insufficient balance', () => {
      test('should reject payment with insufficient balance', async () => {
        testAccount.balance = 100; // Less than bill amount
        
        const res = await request(app)
          .post(`/api/bills/${testBill._id}/pay`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ accountId: testAccount._id })
          .expect(400);
        
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Insufficient');
      });
    });

    describe('IT-BILL-07: Already paid bill', () => {
      test('should reject paying already paid bill', async () => {
        // Pay once
        await request(app)
          .post(`/api/bills/${testBill._id}/pay`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ accountId: testAccount._id });
        
        // Try to pay again
        const res = await request(app)
          .post(`/api/bills/${testBill._id}/pay`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ accountId: testAccount._id })
          .expect(400);
        
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('already paid');
      });
    });
  });

  // ============================================
  // DELETE BILL TESTS
  // ============================================
  describe('DELETE /api/bills/:id', () => {
    describe('IT-BILL-08: Delete pending bill', () => {
      test('should delete pending bill', async () => {
        // Add a bill first
        const addRes = await request(app)
          .post('/api/bills')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            billType: 'water',
            provider: 'ISKI',
            subscriberNo: '9876543210',
            amount: 180
          });
        
        const billId = addRes.body.bill._id;
        
        const res = await request(app)
          .delete(`/api/bills/${billId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        
        expect(res.body.success).toBe(true);
      });
    });
  });
});
