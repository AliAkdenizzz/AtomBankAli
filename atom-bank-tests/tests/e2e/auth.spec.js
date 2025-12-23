/**
 * E2E Tests: Authentication Flows
 * Tests for login, registration, and logout user journeys
 * 
 * Test IDs: E2E-AUTH-01 to E2E-AUTH-10
 * Mapped Use Cases: UC-01 (Login), UC-02 (Register), UC-03 (Logout)
 */

const { test, expect } = require('@playwright/test');

// Test data
const TEST_USER = {
  name: 'E2E Test User',
  email: `e2e.test.${Date.now()}@example.com`,
  password: 'SecurePass123!'
};

const EXISTING_USER = {
  email: 'demo@atombank.com',
  password: 'Demo123!'
};

// Page Object helpers
class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"], input[type="email"], #email');
    this.passwordInput = page.locator('input[name="password"], input[type="password"], #password');
    this.loginButton = page.locator('button[type="submit"], .login-btn, #loginBtn');
    this.errorMessage = page.locator('.error-message, .alert-danger, .error, [role="alert"]');
    this.rememberMeCheckbox = page.locator('input[name="rememberMe"], #rememberMe');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}

class RegisterPage {
  constructor(page) {
    this.page = page;
    this.nameInput = page.locator('input[name="name"], #name');
    this.emailInput = page.locator('input[name="email"], input[type="email"], #email');
    this.passwordInput = page.locator('input[name="password"], input[type="password"], #password');
    this.confirmPasswordInput = page.locator('input[name="confirmPassword"], #confirmPassword');
    this.registerButton = page.locator('button[type="submit"], .register-btn, #registerBtn');
    this.errorMessage = page.locator('.error-message, .alert-danger, .error, [role="alert"]');
  }

  async goto() {
    await this.page.goto('/register');
  }

  async register(name, email, password, confirmPassword = null) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    if (this.confirmPasswordInput) {
      await this.confirmPasswordInput.fill(confirmPassword || password);
    }
    await this.registerButton.click();
  }
}

class DashboardPage {
  constructor(page) {
    this.page = page;
    this.welcomeMessage = page.locator('.welcome-message, .user-greeting, h1');
    this.logoutButton = page.locator('.logout-btn, #logoutBtn, [data-action="logout"]');
    this.accountSummary = page.locator('.account-summary, .accounts-list');
    this.userMenu = page.locator('.user-menu, .profile-dropdown');
  }

  async logout() {
    // Try clicking user menu first if exists
    if (await this.userMenu.isVisible()) {
      await this.userMenu.click();
    }
    await this.logoutButton.click();
  }
}

// ============================================
// REGISTRATION TESTS
// ============================================
test.describe('E2E-AUTH: Registration Flow', () => {
  test.describe('E2E-AUTH-01: Successful Registration', () => {
    test('should register new user and redirect to dashboard', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      
      // Fill registration form
      await registerPage.register(
        TEST_USER.name,
        TEST_USER.email,
        TEST_USER.password
      );
      
      // Should redirect to dashboard or login
      await expect(page).toHaveURL(/\/(dashboard|login)/);
      
      // If redirected to login, verify success message
      if (page.url().includes('login')) {
        const successMessage = page.locator('.success-message, .alert-success');
        await expect(successMessage).toBeVisible();
      }
    });
  });

  test.describe('E2E-AUTH-02: Registration Validation', () => {
    test('should show error for invalid email format', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      
      await registerPage.register(
        'Test User',
        'invalidemail',
        'SecurePass123!'
      );
      
      // Should show validation error
      await expect(registerPage.errorMessage).toBeVisible();
      // Should stay on register page
      await expect(page).toHaveURL(/register/);
    });

    test('should show error for weak password', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      
      await registerPage.register(
        'Test User',
        'test@example.com',
        'weak'
      );
      
      await expect(registerPage.errorMessage).toBeVisible();
    });

    test('should show error for empty fields', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      
      // Try to submit empty form
      await registerPage.registerButton.click();
      
      // Should show validation error or native validation
      const hasError = await registerPage.errorMessage.isVisible() ||
                       await registerPage.nameInput.evaluate(el => !el.checkValidity());
      expect(hasError).toBeTruthy();
    });
  });

  test.describe('E2E-AUTH-03: Duplicate Email', () => {
    test('should show error for already registered email', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      
      // Try to register with existing email
      await registerPage.register(
        'Another User',
        EXISTING_USER.email,
        'AnotherPass123!'
      );
      
      // Should show duplicate email error
      await expect(registerPage.errorMessage).toBeVisible();
      await expect(registerPage.errorMessage).toContainText(/already|exist|registered/i);
    });
  });
});

// ============================================
// LOGIN TESTS
// ============================================
test.describe('E2E-AUTH: Login Flow', () => {
  test.describe('E2E-AUTH-04: Successful Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      await loginPage.login(EXISTING_USER.email, EXISTING_USER.password);
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/dashboard/);
      
      // Dashboard should be visible
      const dashboardPage = new DashboardPage(page);
      await expect(dashboardPage.welcomeMessage).toBeVisible();
    });

    test('should store token in localStorage/sessionStorage', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      await loginPage.login(EXISTING_USER.email, EXISTING_USER.password);
      
      // Wait for redirect
      await page.waitForURL(/dashboard/);
      
      // Check for token
      const token = await page.evaluate(() => {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
      });
      
      expect(token).toBeTruthy();
    });
  });

  test.describe('E2E-AUTH-05: Invalid Credentials', () => {
    test('should show error for wrong password', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      await loginPage.login(EXISTING_USER.email, 'WrongPassword123!');
      
      // Should show error message
      await expect(loginPage.errorMessage).toBeVisible();
      await expect(loginPage.errorMessage).toContainText(/invalid|incorrect|wrong/i);
      
      // Should stay on login page
      await expect(page).toHaveURL(/login/);
    });

    test('should show error for non-existent user', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      await loginPage.login('nonexistent@example.com', 'SomePass123!');
      
      await expect(loginPage.errorMessage).toBeVisible();
    });
  });

  test.describe('E2E-AUTH-06: Empty Fields Validation', () => {
    test('should show error for empty email', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      await loginPage.passwordInput.fill('SomePassword123!');
      await loginPage.loginButton.click();
      
      // Should show validation error or native validation
      const hasError = await loginPage.errorMessage.isVisible() ||
                       await loginPage.emailInput.evaluate(el => !el.checkValidity());
      expect(hasError).toBeTruthy();
    });

    test('should show error for empty password', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      await loginPage.emailInput.fill('test@example.com');
      await loginPage.loginButton.click();
      
      const hasError = await loginPage.errorMessage.isVisible() ||
                       await loginPage.passwordInput.evaluate(el => !el.checkValidity());
      expect(hasError).toBeTruthy();
    });
  });
});

// ============================================
// LOGOUT TESTS
// ============================================
test.describe('E2E-AUTH: Logout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(EXISTING_USER.email, EXISTING_USER.password);
    await page.waitForURL(/dashboard/);
  });

  test.describe('E2E-AUTH-07: Successful Logout', () => {
    test('should logout and redirect to login page', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      
      await dashboardPage.logout();
      
      // Should redirect to login page
      await expect(page).toHaveURL(/login/);
    });

    test('should clear token on logout', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      
      await dashboardPage.logout();
      await page.waitForURL(/login/);
      
      // Check token is cleared
      const token = await page.evaluate(() => {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
      });
      
      expect(token).toBeFalsy();
    });
  });
});

// ============================================
// PROTECTED ROUTES TESTS
// ============================================
test.describe('E2E-AUTH: Protected Routes', () => {
  test.describe('E2E-AUTH-08: Unauthorized Access', () => {
    test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
      // Clear any existing tokens
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Try to access protected page
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/login/);
    });

    test('should redirect to login when accessing account page without auth', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      await page.goto('/account');
      
      await expect(page).toHaveURL(/login/);
    });
  });

  test.describe('E2E-AUTH-09: Session Persistence', () => {
    test('should maintain session on page refresh', async ({ page }) => {
      // Login first
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(EXISTING_USER.email, EXISTING_USER.password);
      await page.waitForURL(/dashboard/);
      
      // Refresh page
      await page.reload();
      
      // Should still be on dashboard
      await expect(page).toHaveURL(/dashboard/);
      
      const dashboardPage = new DashboardPage(page);
      await expect(dashboardPage.welcomeMessage).toBeVisible();
    });
  });
});

// ============================================
// REMEMBER ME TESTS
// ============================================
test.describe('E2E-AUTH: Remember Me', () => {
  test.describe('E2E-AUTH-10: Remember Me Functionality', () => {
    test('should use localStorage when remember me is checked', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      // Check remember me if exists
      if (await loginPage.rememberMeCheckbox.isVisible()) {
        await loginPage.rememberMeCheckbox.check();
      }
      
      await loginPage.login(EXISTING_USER.email, EXISTING_USER.password);
      await page.waitForURL(/dashboard/);
      
      // Check token is in localStorage (not sessionStorage)
      const localToken = await page.evaluate(() => localStorage.getItem('token'));
      expect(localToken).toBeTruthy();
    });
  });
});
