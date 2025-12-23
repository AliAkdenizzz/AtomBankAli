/**
 * Integration Tests: Transaction API
 * Tests for /api/transactions endpoints (deposit, withdraw, transfer)
 * 
 * Test IDs: IT-TR-01 to IT-TR-20
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
  if (user.status === 'blocked') {
    return res.status(403).json({ success: false, message: 'Account is blocked' });
  }
  req.user = user;
  next();
};

// ============================================
// MOCK ROUTES
// ============================================

// Deposit
app.post('/api/transactions/deposit', authMiddleware, (req, res) => {
  const { accountId, amount, description } = req.body;
  
  // Validation
  if (!accountId) {
    return res.status(400).json({ success: false, message: 'Account ID is required' });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Valid amount is required' });
  }
  if (amount > 1000000) {
    return res.status(400).json({ success: false, message: 'Amount exceeds maximum limit' });
  }
  
  // Find account
  const userAccounts = mockAccounts.get(req.user._id) || [];
  const account = userAccounts.find(a => a._id === accountId);
  if (!account) {
    return res.status(404).json({ success: false, message: 'Account not found' });
  }
  if (account.status !== 'active') {
    return res.status(400).json({ success: false, message: 'Account is not active' });
  }
  
  // Create transaction
  const transaction = {
    _id: new mongoose.Types.ObjectId().toString(),
    type: 'deposit',
    amount,
    currency: account.currency,
    description: description || 'Deposit',
    date: new Date(),
    status: 'completed',
    balanceAfter: account.balance + amount
  };
  
  // Update balance
  account.balance += amount;
  account.transactions = account.transactions || [];
  account.transactions.push(transaction);
  
  res.status(200).json({
    success: true,
    message: 'Deposit successful',
    transaction,
    newBalance: account.balance
  });
});

// Withdraw
app.post('/api/transactions/withdraw', authMiddleware, (req, res) => {
  const { accountId, amount, description } = req.body;
  
  if (!accountId) {
    return res.status(400).json({ success: false, message: 'Account ID is required' });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Valid amount is required' });
  }
  
  const userAccounts = mockAccounts.get(req.user._id) || [];
  const account = userAccounts.find(a => a._id === accountId);
  if (!account) {
    return res.status(404).json({ success: false, message: 'Account not found' });
  }
  if (account.status !== 'active') {
    return res.status(400).json({ success: false, message: 'Account is not active' });
  }
  if (amount > account.balance) {
    return res.status(400).json({ success: false, message: 'Insufficient balance' });
  }
  
  const transaction = {
    _id: new mongoose.Types.ObjectId().toString(),
    type: 'withdrawal',
    amount,
    currency: account.currency,
    description: description || 'Withdrawal',
    date: new Date(),
    status: 'completed',
    balanceAfter: account.balance - amount
  };
  
  account.balance -= amount;
  account.transactions = account.transactions || [];
  account.transactions.push(transaction);
  
  res.status(200).json({
    success: true,
    message: 'Withdrawal successful',
    transaction,
    newBalance: account.balance
  });
});

// Internal Transfer
app.post('/api/transactions/transfer-internal', authMiddleware, (req, res) => {
  const { fromAccountId, toAccountId, amount, description } = req.body;
  
  if (!fromAccountId || !toAccountId) {
    return res.status(400).json({ success: false, message: 'Both account IDs are required' });
  }
  if (fromAccountId === toAccountId) {
    return res.status(400).json({ success: false, message: 'Cannot transfer to same account' });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Valid amount is required' });
  }
  
  const userAccounts = mockAccounts.get(req.user._id) || [];
  const fromAccount = userAccounts.find(a => a._id === fromAccountId);
  const toAccount = userAccounts.find(a => a._id === toAccountId);
  
  if (!fromAccount || !toAccount) {
    return res.status(404).json({ success: false, message: 'One or both accounts not found' });
  }
  if (fromAccount.status !== 'active' || toAccount.status !== 'active') {
    return res.status(400).json({ success: false, message: 'Both accounts must be active' });
  }
  if (amount > fromAccount.balance) {
    return res.status(400).json({ success: false, message: 'Insufficient balance' });
  }
  
  // Create transactions
  const timestamp = new Date();
  const transferId = new mongoose.Types.ObjectId().toString();
  
  fromAccount.balance -= amount;
  toAccount.balance += amount;
  
  const outTransaction = {
    _id: new mongoose.Types.ObjectId().toString(),
    type: 'transfer-out',
    amount,
    currency: fromAccount.currency,
    description: description || 'Internal transfer',
    date: timestamp,
    status: 'completed',
    relatedTransferId: transferId,
    toAccountId
  };
  
  const inTransaction = {
    _id: new mongoose.Types.ObjectId().toString(),
    type: 'transfer-in',
    amount,
    currency: toAccount.currency,
    description: description || 'Internal transfer',
    date: timestamp,
    status: 'completed',
    relatedTransferId: transferId,
    fromAccountId
  };
  
  fromAccount.transactions = fromAccount.transactions || [];
  toAccount.transactions = toAccount.transactions || [];
  fromAccount.transactions.push(outTransaction);
  toAccount.transactions.push(inTransaction);
  
  res.status(200).json({
    success: true,
    message: 'Transfer successful',
    transferId,
    fromBalance: fromAccount.balance,
    toBalance: toAccount.balance
  });
});

// External Transfer
app.post('/api/transactions/transfer-external', authMiddleware, (req, res) => {
  const { fromAccountId, receiverIban, receiverName, amount, description } = req.body;
  
  if (!fromAccountId) {
    return res.status(400).json({ success: false, message: 'Account ID is required' });
  }
  if (!receiverIban) {
    return res.status(400).json({ success: false, message: 'Receiver IBAN is required' });
  }
  if (!receiverName) {
    return res.status(400).json({ success: false, message: 'Receiver name is required' });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Valid amount is required' });
  }
  
  // IBAN validation
  const ibanRegex = /^TR[0-9]{24}$/;
  if (!ibanRegex.test(receiverIban)) {
    return res.status(400).json({ success: false, message: 'Invalid IBAN format' });
  }
  
  const userAccounts = mockAccounts.get(req.user._id) || [];
  const account = userAccounts.find(a => a._id === fromAccountId);
  
  if (!account) {
    return res.status(404).json({ success: false, message: 'Account not found' });
  }
  if (account.status !== 'active') {
    return res.status(400).json({ success: false, message: 'Account is not active' });
  }
  if (amount > account.balance) {
    return res.status(400).json({ success: false, message: 'Insufficient balance' });
  }
  
  // Check if self-transfer (same IBAN)
  if (account.iban === receiverIban) {
    return res.status(400).json({ success: false, message: 'Cannot transfer to your own account via external transfer' });
  }
  
  const transaction = {
    _id: new mongoose.Types.ObjectId().toString(),
    type: 'transfer-external',
    amount,
    currency: account.currency,
    description: description || 'External transfer',
    date: new Date(),
    status: 'completed',
    receiverIban,
    receiverName,
    balanceAfter: account.balance - amount
  };
  
  account.balance -= amount;
  account.transactions = account.transactions || [];
  account.transactions.push(transaction);
  
  res.status(200).json({
    success: true,
    message: 'External transfer initiated',
    transaction,
    newBalance: account.balance
  });
});

// Get transaction history
app.get('/api/transactions/:accountId', authMiddleware, (req, res) => {
  const { accountId } = req.params;
  const { limit = 50, offset = 0, type } = req.query;
  
  const userAccounts = mockAccounts.get(req.user._id) || [];
  const account = userAccounts.find(a => a._id === accountId);
  
  if (!account) {
    return res.status(404).json({ success: false, message: 'Account not found' });
  }
  
  let transactions = account.transactions || [];
  
  // Filter by type if specified
  if (type) {
    transactions = transactions.filter(t => t.type === type);
  }
  
  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Pagination
  const total = transactions.length;
  transactions = transactions.slice(Number(offset), Number(offset) + Number(limit));
  
  res.status(200).json({
    success: true,
    transactions,
    pagination: {
      total,
      limit: Number(limit),
      offset: Number(offset)
    }
  });
});

// ============================================
// TEST SUITES
// ============================================

describe('Transaction API', () => {
  let authToken;
  let userId;
  let testAccount;

  beforeEach(() => {
    // Reset mock data
    mockUsers = [];
    mockAccounts = new Map();
    
    // Create test user
    userId = new mongoose.Types.ObjectId().toString();
    mockUsers.push({
      _id: userId,
      name: 'Test User',
      email: 'test@example.com',
      status: 'active'
    });
    authToken = `mock_token_${userId}`;
    
    // Create test account
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
  // DEPOSIT TESTS
  // ============================================
  describe('POST /api/transactions/deposit', () => {
    describe('IT-TR-01: Successful deposit', () => {
      test('should deposit valid amount', async () => {
        const initialBalance = testAccount.balance;
        const depositAmount = 5000;

        const res = await request(app)
          .post('/api/transactions/deposit')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            accountId: testAccount._id,
            amount: depositAmount,
            description: 'Test deposit'
          })
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.newBalance).toBe(initialBalance + depositAmount);
        expect(res.body.transaction.type).toBe('deposit');
        expect(res.body.transaction.amount).toBe(depositAmount);
      });

      test('should deposit decimal amount', async () => {
        const res = await request(app)
          .post('/api/transactions/deposit')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            accountId: testAccount._id,
            amount: 100.50
          })
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.transaction.amount).toBe(100.50);
      });
    });

    describe('IT-TR-02: Invalid deposit amount', () => {
      test('should reject zero amount', async () => {
        const res = await request(app)
          .post('/api/transactions/deposit')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            accountId: testAccount._id,
            amount: 0
          })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Valid amount');
      });

      test('should reject negative amount', async () => {
        const res = await request(app)
          .post('/api/transactions/deposit')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            accountId: testAccount._id,
            amount: -100
          })
          .expect(400);

        expect(res.body.success).toBe(false);
      });

      test('should reject amount exceeding limit', async () => {
        const res = await request(app)
          .post('/api/transactions/deposit')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            accountId: testAccount._id,
            amount: 2000000
          })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('exceeds');
      });
    });

    describe('IT-TR-03: Invalid account', () => {
      test('should reject non-existent account', async () => {
        const res = await request(app)
          .post('/api/transactions/deposit')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            accountId: 'nonexistent123',
            amount: 1000
          })
          .expect(404);

        expect(res.body.success).toBe(false);
      });

      test('should reject closed account', async () => {
        testAccount.status = 'closed';

        const res = await request(app)
          .post('/api/transactions/deposit')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            accountId: testAccount._id,
            amount: 1000
          })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('not active');
      });
    });

    describe('IT-TR-04: Authentication required', () => {
      test('should reject deposit without token', async () => {
        const res = await request(app)
          .post('/api/transactions/deposit')
          .send({
            accountId: testAccount._id,
            amount: 1000
          })
          .expect(401);

        expect(res.body.success).toBe(false);
      });
    });
  });

  // ============================================
  // WITHDRAWAL TESTS
  // ============================================
  describe('POST /api/transactions/withdraw', () => {
    describe('IT-TR-05: Successful withdrawal', () => {
      test('should withdraw valid amount', async () => {
        const initialBalance = testAccount.balance;
        const withdrawAmount = 2000;

        const res = await request(app)
          .post('/api/transactions/withdraw')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            accountId: testAccount._id,
            amount: withdrawAmount
          })
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.newBalance).toBe(initialBalance - withdrawAmount);
        expect(res.body.transaction.type).toBe('withdrawal');
      });

      test('should allow withdrawal of entire balance', async () => {
        const res = await request(app)
          .post('/api/transactions/withdraw')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            accountId: testAccount._id,
            amount: testAccount.balance
          })
          .expect(200);

        expect(res.body.newBalance).toBe(0);
      });
    });

    describe('IT-TR-06: Insufficient balance', () => {
      test('should reject withdrawal exceeding balance', async () => {
        const res = await request(app)
          .post('/api/transactions/withdraw')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            accountId: testAccount._id,
            amount: testAccount.balance + 1000
          })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Insufficient balance');
      });
    });

    describe('IT-TR-07: Invalid withdrawal', () => {
      test('should reject zero amount', async () => {
        const res = await request(app)
          .post('/api/transactions/withdraw')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            accountId: testAccount._id,
            amount: 0
          })
          .expect(400);

        expect(res.body.success).toBe(false);
      });

      test('should reject negative amount', async () => {
        const res = await request(app)
          .post('/api/transactions/withdraw')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            accountId: testAccount._id,
            amount: -500
          })
          .expect(400);

        expect(res.body.success).toBe(false);
      });
    });
  });

  // ============================================
  // INTERNAL TRANSFER TESTS
  // ============================================
  describe('POST /api/transactions/transfer-internal', () => {
    let secondAccount;

    beforeEach(() => {
      // Create second account for transfers
      secondAccount = {
        _id: new mongoose.Types.ObjectId().toString(),
        accountNumber: '1234567891',
        iban: 'TR330006100519786457841327',
        accountType: 'savings',
        currency: 'TRY',
        balance: 5000,
        status: 'active',
        transactions: []
      };
      mockAccounts.get(userId).push(secondAccount);
    });

    describe('IT-TR-08: Successful internal transfer', () => {
      test('should transfer between own accounts', async () => {
        const transferAmount = 3000;
        const initialFromBalance = testAccount.balance;
        const initialToBalance = secondAccount.balance;

        const res = await request(app)
          .post('/api/transactions/transfer-internal')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            fromAccountId: testAccount._id,
            toAccountId: secondAccount._id,
            amount: transferAmount
          })
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.fromBalance).toBe(initialFromBalance - transferAmount);
        expect(res.body.toBalance).toBe(initialToBalance + transferAmount);
      });
    });

    describe('IT-TR-09: Same account transfer', () => {
      test('should reject transfer to same account', async () => {
        const res = await request(app)
          .post('/api/transactions/transfer-internal')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            fromAccountId: testAccount._id,
            toAccountId: testAccount._id,
            amount: 1000
          })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('same account');
      });
    });

    describe('IT-TR-10: Insufficient balance transfer', () => {
      test('should reject transfer exceeding balance', async () => {
        const res = await request(app)
          .post('/api/transactions/transfer-internal')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            fromAccountId: testAccount._id,
            toAccountId: secondAccount._id,
            amount: testAccount.balance + 5000
          })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Insufficient');
      });
    });

    describe('IT-TR-11: Inactive account transfer', () => {
      test('should reject transfer from inactive account', async () => {
        testAccount.status = 'inactive';

        const res = await request(app)
          .post('/api/transactions/transfer-internal')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            fromAccountId: testAccount._id,
            toAccountId: secondAccount._id,
            amount: 1000
          })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('active');
      });

      test('should reject transfer to inactive account', async () => {
        secondAccount.status = 'closed';

        const res = await request(app)
          .post('/api/transactions/transfer-internal')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            fromAccountId: testAccount._id,
            toAccountId: secondAccount._id,
            amount: 1000
          })
          .expect(400);

        expect(res.body.success).toBe(false);
      });
    });
  });

  // ============================================
  // EXTERNAL TRANSFER TESTS
  // ============================================
  describe('POST /api/transactions/transfer-external', () => {
    describe('IT-TR-12: Successful external transfer', () => {
      test('should transfer to valid IBAN', async () => {
        const transferAmount = 5000;

        const res = await request(app)
          .post('/api/transactions/transfer-external')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            fromAccountId: testAccount._id,
            receiverIban: 'TR330006100519786457841999',
            receiverName: 'Jane Doe',
            amount: transferAmount,
            description: 'Test external transfer'
          })
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.transaction.type).toBe('transfer-external');
        expect(res.body.transaction.receiverIban).toBe('TR330006100519786457841999');
      });
    });

    describe('IT-TR-13: Invalid IBAN', () => {
      test('should reject invalid IBAN format', async () => {
        const res = await request(app)
          .post('/api/transactions/transfer-external')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            fromAccountId: testAccount._id,
            receiverIban: 'INVALID_IBAN',
            receiverName: 'Jane Doe',
            amount: 1000
          })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Invalid IBAN');
      });

      test('should reject non-Turkish IBAN', async () => {
        const res = await request(app)
          .post('/api/transactions/transfer-external')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            fromAccountId: testAccount._id,
            receiverIban: 'DE89370400440532013000',
            receiverName: 'Hans Mueller',
            amount: 1000
          })
          .expect(400);

        expect(res.body.success).toBe(false);
      });
    });

    describe('IT-TR-14: Self-transfer prevention', () => {
      test('should reject transfer to own IBAN', async () => {
        const res = await request(app)
          .post('/api/transactions/transfer-external')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            fromAccountId: testAccount._id,
            receiverIban: testAccount.iban,
            receiverName: 'Test User',
            amount: 1000
          })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('own account');
      });
    });

    describe('IT-TR-15: Missing receiver info', () => {
      test('should reject missing receiver name', async () => {
        const res = await request(app)
          .post('/api/transactions/transfer-external')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            fromAccountId: testAccount._id,
            receiverIban: 'TR330006100519786457841999',
            amount: 1000
          })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Receiver name');
      });
    });
  });

  // ============================================
  // TRANSACTION HISTORY TESTS
  // ============================================
  describe('GET /api/transactions/:accountId', () => {
    beforeEach(() => {
      // Add some test transactions
      testAccount.transactions = [
        { _id: '1', type: 'deposit', amount: 5000, date: new Date('2025-01-01') },
        { _id: '2', type: 'withdrawal', amount: 1000, date: new Date('2025-01-02') },
        { _id: '3', type: 'deposit', amount: 2000, date: new Date('2025-01-03') },
        { _id: '4', type: 'transfer-external', amount: 500, date: new Date('2025-01-04') }
      ];
    });

    describe('IT-TR-16: Get transaction history', () => {
      test('should return transaction history', async () => {
        const res = await request(app)
          .get(`/api/transactions/${testAccount._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.transactions).toHaveLength(4);
        expect(res.body.pagination.total).toBe(4);
      });

      test('should return transactions sorted by date descending', async () => {
        const res = await request(app)
          .get(`/api/transactions/${testAccount._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const dates = res.body.transactions.map(t => new Date(t.date).getTime());
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
        }
      });
    });

    describe('IT-TR-17: Filter transactions by type', () => {
      test('should filter by deposit type', async () => {
        const res = await request(app)
          .get(`/api/transactions/${testAccount._id}?type=deposit`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.transactions.every(t => t.type === 'deposit')).toBe(true);
        expect(res.body.transactions).toHaveLength(2);
      });
    });

    describe('IT-TR-18: Pagination', () => {
      test('should respect limit parameter', async () => {
        const res = await request(app)
          .get(`/api/transactions/${testAccount._id}?limit=2`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.transactions).toHaveLength(2);
        expect(res.body.pagination.limit).toBe(2);
        expect(res.body.pagination.total).toBe(4);
      });

      test('should respect offset parameter', async () => {
        const res = await request(app)
          .get(`/api/transactions/${testAccount._id}?limit=2&offset=2`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.transactions).toHaveLength(2);
        expect(res.body.pagination.offset).toBe(2);
      });
    });

    describe('IT-TR-19: Non-existent account', () => {
      test('should return 404 for non-existent account', async () => {
        const res = await request(app)
          .get('/api/transactions/nonexistent123')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(res.body.success).toBe(false);
      });
    });
  });

  // ============================================
  // BLOCKED USER TESTS
  // ============================================
  describe('IT-TR-20: Blocked user transactions', () => {
    test('should reject all transactions for blocked user', async () => {
      mockUsers[0].status = 'blocked';

      const res = await request(app)
        .post('/api/transactions/deposit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountId: testAccount._id,
          amount: 1000
        })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('blocked');
    });
  });
});
