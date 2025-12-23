const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Increase timeout for setup
jest.setTimeout(30000);

// Before all tests - start MongoDB memory server
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  console.log(`MongoDB Memory Server started at ${mongoUri}`);
});

// After each test - clear all collections
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

// After all tests - disconnect and stop server
afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
  console.log('MongoDB Memory Server stopped');
});

// Global test utilities
global.testUtils = {
  // Create a test user with default values
  createTestUser: async (overrides = {}) => {
    const User = require('../models/user');
    const bcrypt = require('bcryptjs');
    
    const defaultUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: await bcrypt.hash('Test123!', 10),
      role: 'user',
      status: 'active',
      accounts: [],
      bills: [],
      savingsGoals: [],
      savedRecipients: [],
      ...overrides
    };
    
    return await User.create(defaultUser);
  },
  
  // Create test account for a user
  createTestAccount: (overrides = {}) => {
    return {
      accountNumber: '1234567890',
      iban: 'TR123456789012345678901234',
      accountType: 'checking',
      currency: 'TRY',
      balance: 10000,
      status: 'active',
      transactions: [],
      ...overrides
    };
  },
  
  // Create test transaction
  createTestTransaction: (overrides = {}) => {
    return {
      type: 'deposit',
      amount: 1000,
      currency: 'TRY',
      description: 'Test transaction',
      date: new Date(),
      status: 'completed',
      ...overrides
    };
  },
  
  // Generate valid JWT token for testing
  generateTestToken: (userId, role = 'user') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { id: userId, name: 'Test User', role },
      process.env.JWT_SECRET_KEY || 'test-secret-key',
      { expiresIn: '1h' }
    );
  }
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET_KEY = 'test-secret-key-for-jwt';
process.env.JWT_EXPIRE = '1h';
