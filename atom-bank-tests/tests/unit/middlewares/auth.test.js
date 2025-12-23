/**
 * Unit Tests: Authorization Middleware
 * Tests for JWT authentication and role-based access control
 * 
 * Test IDs: UT-AUTH-01 to UT-AUTH-12
 */

const jwt = require('jsonwebtoken');

// Test secret key
const JWT_SECRET = 'test-secret-key-for-jwt';

// ============================================
// MOCK MIDDLEWARE FUNCTIONS
// ============================================

// Mock getAccessToRoute middleware
const getAccessToRoute = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // Check if authorization header exists
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided'
    });
  }
  
  // Check Bearer format
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token format. Use: Bearer <token>'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Verify token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

// Mock getAdminAccess middleware
const getAdminAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  
  next();
};

// Mock checkUserStatus middleware
const checkUserStatus = (allowedStatuses = ['active']) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!allowedStatuses.includes(req.user.status)) {
      return res.status(403).json({
        success: false,
        message: `Account status '${req.user.status}' is not allowed for this operation`
      });
    }
    
    next();
  };
};

// ============================================
// HELPER FUNCTIONS FOR TESTS
// ============================================

const createMockRequest = (overrides = {}) => ({
  headers: {},
  user: null,
  body: {},
  params: {},
  query: {},
  ...overrides
});

const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const generateToken = (payload, options = {}) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h', ...options });
};

// ============================================
// AUTHENTICATION MIDDLEWARE TESTS
// ============================================
describe('Authentication Middleware (getAccessToRoute)', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = jest.fn();
  });

  describe('UT-AUTH-01: Missing authorization header', () => {
    test('should return 401 when no authorization header', () => {
      getAccessToRoute(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'No authorization token provided'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('UT-AUTH-02: Invalid token format', () => {
    test('should return 401 for non-Bearer token', () => {
      mockReq.headers.authorization = 'Basic sometoken';
      
      getAccessToRoute(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token format. Use: Bearer <token>'
      });
    });

    test('should return 401 for token without Bearer prefix', () => {
      mockReq.headers.authorization = 'sometoken';
      
      getAccessToRoute(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('UT-AUTH-03: Invalid token', () => {
    test('should return 401 for malformed token', () => {
      mockReq.headers.authorization = 'Bearer invalid.token.here';
      
      getAccessToRoute(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token'
      });
    });

    test('should return 401 for token signed with different secret', () => {
      const wrongToken = jwt.sign({ id: '123' }, 'wrong-secret');
      mockReq.headers.authorization = `Bearer ${wrongToken}`;
      
      getAccessToRoute(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token'
      });
    });
  });

  describe('UT-AUTH-04: Expired token', () => {
    test('should return 401 for expired token', () => {
      const expiredToken = jwt.sign(
        { id: '123', name: 'Test', role: 'user' },
        JWT_SECRET,
        { expiresIn: '-1h' } // Already expired
      );
      mockReq.headers.authorization = `Bearer ${expiredToken}`;
      
      getAccessToRoute(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token has expired'
      });
    });
  });

  describe('UT-AUTH-05: Valid token', () => {
    test('should call next() and set req.user for valid token', () => {
      const payload = { id: '123', name: 'Test User', role: 'user' };
      const token = generateToken(payload);
      mockReq.headers.authorization = `Bearer ${token}`;
      
      getAccessToRoute(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe('123');
      expect(mockReq.user.name).toBe('Test User');
      expect(mockReq.user.role).toBe('user');
    });

    test('should preserve all token payload fields', () => {
      const payload = { 
        id: '456', 
        name: 'Admin User', 
        role: 'admin',
        email: 'admin@test.com'
      };
      const token = generateToken(payload);
      mockReq.headers.authorization = `Bearer ${token}`;
      
      getAccessToRoute(mockReq, mockRes, mockNext);
      
      expect(mockReq.user.email).toBe('admin@test.com');
    });
  });
});

// ============================================
// ADMIN ACCESS MIDDLEWARE TESTS
// ============================================
describe('Admin Access Middleware (getAdminAccess)', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = jest.fn();
  });

  describe('UT-AUTH-06: No authenticated user', () => {
    test('should return 401 when req.user is not set', () => {
      getAdminAccess(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
    });
  });

  describe('UT-AUTH-07: Non-admin user', () => {
    test('should return 403 for regular user', () => {
      mockReq.user = { id: '123', name: 'User', role: 'user' };
      
      getAdminAccess(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Admin access required'
      });
    });

    test('should return 403 for undefined role', () => {
      mockReq.user = { id: '123', name: 'User' };
      
      getAdminAccess(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('UT-AUTH-08: Admin user', () => {
    test('should call next() for admin user', () => {
      mockReq.user = { id: '123', name: 'Admin', role: 'admin' };
      
      getAdminAccess(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});

// ============================================
// USER STATUS MIDDLEWARE TESTS
// ============================================
describe('User Status Middleware (checkUserStatus)', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = jest.fn();
  });

  describe('UT-AUTH-09: No authenticated user', () => {
    test('should return 401 when req.user is not set', () => {
      const middleware = checkUserStatus(['active']);
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('UT-AUTH-10: Blocked user', () => {
    test('should return 403 for blocked user', () => {
      mockReq.user = { id: '123', status: 'blocked' };
      const middleware = checkUserStatus(['active']);
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Account status 'blocked' is not allowed for this operation"
      });
    });
  });

  describe('UT-AUTH-11: Inactive user', () => {
    test('should return 403 for inactive user when only active allowed', () => {
      mockReq.user = { id: '123', status: 'inactive' };
      const middleware = checkUserStatus(['active']);
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should allow inactive user when inactive is in allowed list', () => {
      mockReq.user = { id: '123', status: 'inactive' };
      const middleware = checkUserStatus(['active', 'inactive']);
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('UT-AUTH-12: Active user', () => {
    test('should call next() for active user', () => {
      mockReq.user = { id: '123', status: 'active' };
      const middleware = checkUserStatus(['active']);
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

// ============================================
// TOKEN HELPER TESTS
// ============================================
describe('Token Helpers', () => {
  describe('UT-AUTH-13: Token generation', () => {
    test('should generate valid JWT token', () => {
      const payload = { id: '123', name: 'Test', role: 'user' };
      const token = generateToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should include payload in generated token', () => {
      const payload = { id: '456', name: 'Admin', role: 'admin' };
      const token = generateToken(payload);
      const decoded = jwt.verify(token, JWT_SECRET);
      
      expect(decoded.id).toBe('456');
      expect(decoded.name).toBe('Admin');
      expect(decoded.role).toBe('admin');
    });

    test('should include expiration in token', () => {
      const payload = { id: '123' };
      const token = generateToken(payload);
      const decoded = jwt.verify(token, JWT_SECRET);
      
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe('UT-AUTH-14: Token verification', () => {
    test('should verify valid token', () => {
      const payload = { id: '123' };
      const token = generateToken(payload);
      
      expect(() => jwt.verify(token, JWT_SECRET)).not.toThrow();
    });

    test('should throw for invalid token', () => {
      expect(() => jwt.verify('invalid.token', JWT_SECRET)).toThrow();
    });

    test('should throw for wrong secret', () => {
      const payload = { id: '123' };
      const token = generateToken(payload);
      
      expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
    });
  });
});
