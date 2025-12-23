/**
 * Integration Tests: Authentication API
 * Tests for /api/auth endpoints (register, login, logout)
 * 
 * Test IDs: IT-AUTH-01 to IT-AUTH-15
 */

const request = require('supertest');
const mongoose = require('mongoose');
const testData = require('../fixtures/testData.json');

// Note: In real implementation, import your Express app
// const app = require('../../server');

// Mock Express app for demonstration
const express = require('express');
const app = express();
app.use(express.json());

// Mock user storage (in real tests, this uses MongoDB)
let mockUsers = [];
let mockTokens = new Set();

// Mock auth routes
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }
  
  // Password validation
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }
  
  // Check duplicate email
  if (mockUsers.find(u => u.email === email)) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }
  
  // Create user
  const user = {
    _id: new mongoose.Types.ObjectId().toString(),
    name,
    email,
    password: 'hashed_' + password, // Mock hash
    role: 'user',
    status: 'active',
    accounts: []
  };
  mockUsers.push(user);
  
  // Generate token
  const token = `mock_token_${user._id}`;
  
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    token,
    user: { id: user._id, name: user.name, email: user.email }
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  
  const user = mockUsers.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  
  // Check password (mock)
  if (user.password !== 'hashed_' + password) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  
  // Check user status
  if (user.status === 'blocked') {
    return res.status(403).json({ success: false, message: 'Account is blocked' });
  }
  
  if (user.status === 'inactive') {
    return res.status(403).json({ success: false, message: 'Account is inactive' });
  }
  
  const token = `mock_token_${user._id}`;
  mockTokens.add(token);
  
  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    mockTokens.delete(token);
  }
  res.status(200).json({ success: true, message: 'Logout successful' });
});

app.get('/api/auth/me', (req, res) => {
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
  
  res.status(200).json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

// ============================================
// TEST SUITES
// ============================================

describe('Authentication API', () => {
  beforeEach(() => {
    // Reset mock data before each test
    mockUsers = [];
    mockTokens = new Set();
  });

  // ============================================
  // REGISTRATION TESTS
  // ============================================
  describe('POST /api/auth/register', () => {
    describe('IT-AUTH-01: Successful registration', () => {
      test('should register new user with valid data', async () => {
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'SecurePass123!'
        };

        const res = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
        expect(res.body.user.email).toBe(userData.email);
        expect(res.body.user.name).toBe(userData.name);
      });

      test('should not return password in response', async () => {
        const res = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Test User',
            email: 'test@example.com',
            password: 'SecurePass123!'
          })
          .expect(201);

        expect(res.body.user.password).toBeUndefined();
      });
    });

    describe('IT-AUTH-02: Missing required fields', () => {
      test('should return 400 when name is missing', async () => {
        const res = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: 'SecurePass123!'
          })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('required');
      });

      test('should return 400 when email is missing', async () => {
        const res = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Test User',
            password: 'SecurePass123!'
          })
          .expect(400);

        expect(res.body.success).toBe(false);
      });

      test('should return 400 when password is missing', async () => {
        const res = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Test User',
            email: 'test@example.com'
          })
          .expect(400);

        expect(res.body.success).toBe(false);
      });
    });

    describe('IT-AUTH-03: Invalid email format', () => {
      test.each(testData.invalidInputs.emails)(
        'should return 400 for invalid email: %s',
        async (email) => {
          const res = await request(app)
            .post('/api/auth/register')
            .send({
              name: 'Test User',
              email: email,
              password: 'SecurePass123!'
            });

          // Empty email returns 400 for "required", others for "invalid format"
          expect(res.status).toBe(400);
          expect(res.body.success).toBe(false);
        }
      );
    });

    describe('IT-AUTH-04: Weak password', () => {
      test('should return 400 for short password', async () => {
        const res = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Test User',
            email: 'test@example.com',
            password: 'short'
          })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('8 characters');
      });
    });

    describe('IT-AUTH-05: Duplicate email', () => {
      test('should return 400 when email already registered', async () => {
        // First registration
        await request(app)
          .post('/api/auth/register')
          .send({
            name: 'First User',
            email: 'duplicate@example.com',
            password: 'SecurePass123!'
          })
          .expect(201);

        // Second registration with same email
        const res = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Second User',
            email: 'duplicate@example.com',
            password: 'AnotherPass123!'
          })
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('already registered');
      });
    });
  });

  // ============================================
  // LOGIN TESTS
  // ============================================
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'SecurePass123!'
        });
    });

    describe('IT-AUTH-06: Successful login', () => {
      test('should login with valid credentials', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'SecurePass123!'
          })
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
        expect(res.body.user.email).toBe('test@example.com');
      });

      test('should return user role in response', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'SecurePass123!'
          })
          .expect(200);

        expect(res.body.user.role).toBe('user');
      });
    });

    describe('IT-AUTH-07: Missing credentials', () => {
      test('should return 400 when email is missing', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ password: 'SecurePass123!' })
          .expect(400);

        expect(res.body.success).toBe(false);
      });

      test('should return 400 when password is missing', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com' })
          .expect(400);

        expect(res.body.success).toBe(false);
      });
    });

    describe('IT-AUTH-08: Invalid credentials', () => {
      test('should return 401 for wrong password', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'WrongPassword123!'
          })
          .expect(401);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Invalid credentials');
      });

      test('should return 401 for non-existent email', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'SecurePass123!'
          })
          .expect(401);

        expect(res.body.success).toBe(false);
      });
    });

    describe('IT-AUTH-09: Blocked user', () => {
      test('should return 403 for blocked user', async () => {
        // Manually block the user
        mockUsers[0].status = 'blocked';

        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'SecurePass123!'
          })
          .expect(403);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('blocked');
      });
    });

    describe('IT-AUTH-10: Inactive user', () => {
      test('should return 403 for inactive user', async () => {
        mockUsers[0].status = 'inactive';

        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'SecurePass123!'
          })
          .expect(403);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('inactive');
      });
    });
  });

  // ============================================
  // LOGOUT TESTS
  // ============================================
  describe('POST /api/auth/logout', () => {
    describe('IT-AUTH-11: Successful logout', () => {
      test('should logout successfully', async () => {
        const res = await request(app)
          .post('/api/auth/logout')
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('Logout successful');
      });
    });
  });

  // ============================================
  // GET CURRENT USER TESTS
  // ============================================
  describe('GET /api/auth/me', () => {
    let authToken;

    beforeEach(async () => {
      // Register and login to get token
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'SecurePass123!'
        });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!'
        });

      authToken = loginRes.body.token;
    });

    describe('IT-AUTH-12: Get current user with valid token', () => {
      test('should return current user data', async () => {
        const res = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.user.email).toBe('test@example.com');
      });
    });

    describe('IT-AUTH-13: Get current user without token', () => {
      test('should return 401 without authorization header', async () => {
        const res = await request(app)
          .get('/api/auth/me')
          .expect(401);

        expect(res.body.success).toBe(false);
      });
    });

    describe('IT-AUTH-14: Get current user with invalid token', () => {
      test('should return 401 with invalid token', async () => {
        const res = await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalid_token')
          .expect(401);

        expect(res.body.success).toBe(false);
      });
    });
  });
});
