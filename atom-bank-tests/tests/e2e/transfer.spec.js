/**
 * E2E Tests: Transfer and Transaction Flows
 * Tests for deposits, withdrawals, and transfers
 * 
 * Test IDs: E2E-TR-01 to E2E-TR-12
 * Mapped Use Cases: UC-04 (Transfer), UC-05 (Deposit), UC-06 (Withdraw)
 */

const { test, expect } = require('@playwright/test');

// Test credentials
const TEST_USER = {
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

class DashboardPage {
  constructor(page) {
    this.page = page;
    this.accountCards = page.locator('.account-card, .account-item');
    this.totalBalance = page.locator('.total-balance, .balance-summary');
    this.quickTransferBtn = page.locator('[data-action="transfer"], .quick-transfer, #transferBtn');
    this.depositBtn = page.locator('[data-action="deposit"], .deposit-btn, #depositBtn');
    this.withdrawBtn = page.locator('[data-action="withdraw"], .withdraw-btn, #withdrawBtn');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async getAccountBalance(accountIndex = 0) {
    const balanceEl = this.accountCards.nth(accountIndex).locator('.balance, .account-balance');
    const balanceText = await balanceEl.textContent();
    return parseFloat(balanceText.replace(/[^0-9.-]+/g, ''));
  }
}

class TransferPage {
  constructor(page) {
    this.page = page;
    this.fromAccountSelect = page.locator('select[name="fromAccount"], #fromAccount');
    this.toAccountSelect = page.locator('select[name="toAccount"], #toAccount');
    this.amountInput = page.locator('input[name="amount"], #amount');
    this.descriptionInput = page.locator('input[name="description"], textarea[name="description"], #description');
    this.submitButton = page.locator('button[type="submit"], .transfer-btn, #submitTransfer');
    this.successMessage = page.locator('.success-message, .alert-success, .toast-success');
    this.errorMessage = page.locator('.error-message, .alert-danger, .error');
    
    // External transfer fields
    this.transferTypeToggle = page.locator('[data-type="external"], .external-tab, #externalTransfer');
    this.ibanInput = page.locator('input[name="iban"], #receiverIban');
    this.receiverNameInput = page.locator('input[name="receiverName"], #receiverName');
  }

  async goto() {
    await this.page.goto('/transfer');
  }

  async selectFromAccount(accountIndex) {
    await this.fromAccountSelect.selectOption({ index: accountIndex });
  }

  async selectToAccount(accountIndex) {
    await this.toAccountSelect.selectOption({ index: accountIndex });
  }

  async fillAmount(amount) {
    await this.amountInput.fill(amount.toString());
  }

  async fillDescription(description) {
    if (await this.descriptionInput.isVisible()) {
      await this.descriptionInput.fill(description);
    }
  }

  async submitInternalTransfer(fromIndex, toIndex, amount, description = '') {
    await this.selectFromAccount(fromIndex);
    await this.selectToAccount(toIndex);
    await this.fillAmount(amount);
    await this.fillDescription(description);
    await this.submitButton.click();
  }

  async submitExternalTransfer(fromIndex, iban, receiverName, amount, description = '') {
    // Switch to external transfer if needed
    if (await this.transferTypeToggle.isVisible()) {
      await this.transferTypeToggle.click();
    }
    
    await this.selectFromAccount(fromIndex);
    await this.ibanInput.fill(iban);
    await this.receiverNameInput.fill(receiverName);
    await this.fillAmount(amount);
    await this.fillDescription(description);
    await this.submitButton.click();
  }
}

class DepositPage {
  constructor(page) {
    this.page = page;
    this.accountSelect = page.locator('select[name="account"], #accountSelect');
    this.amountInput = page.locator('input[name="amount"], #amount');
    this.submitButton = page.locator('button[type="submit"], .deposit-btn, #submitDeposit');
    this.successMessage = page.locator('.success-message, .alert-success');
    this.errorMessage = page.locator('.error-message, .alert-danger');
  }

  async goto() {
    await this.page.goto('/deposit');
  }

  async deposit(accountIndex, amount) {
    await this.accountSelect.selectOption({ index: accountIndex });
    await this.amountInput.fill(amount.toString());
    await this.submitButton.click();
  }
}

class WithdrawPage {
  constructor(page) {
    this.page = page;
    this.accountSelect = page.locator('select[name="account"], #accountSelect');
    this.amountInput = page.locator('input[name="amount"], #amount');
    this.submitButton = page.locator('button[type="submit"], .withdraw-btn, #submitWithdraw');
    this.successMessage = page.locator('.success-message, .alert-success');
    this.errorMessage = page.locator('.error-message, .alert-danger');
  }

  async goto() {
    await this.page.goto('/withdraw');
  }

  async withdraw(accountIndex, amount) {
    await this.accountSelect.selectOption({ index: accountIndex });
    await this.amountInput.fill(amount.toString());
    await this.submitButton.click();
  }
}

class TransactionHistoryPage {
  constructor(page) {
    this.page = page;
    this.transactionList = page.locator('.transaction-list, .transactions, #transactionList');
    this.transactionItems = page.locator('.transaction-item, .transaction-row, tr.transaction');
    this.filterSelect = page.locator('select[name="filter"], #transactionFilter');
    this.dateRangeStart = page.locator('input[name="startDate"], #startDate');
    this.dateRangeEnd = page.locator('input[name="endDate"], #endDate');
  }

  async goto(accountId = '') {
    const url = accountId ? `/transactions/${accountId}` : '/transactions';
    await this.page.goto(url);
  }

  async getTransactionCount() {
    return await this.transactionItems.count();
  }

  async getLatestTransaction() {
    const firstItem = this.transactionItems.first();
    return {
      type: await firstItem.locator('.transaction-type, .type').textContent(),
      amount: await firstItem.locator('.transaction-amount, .amount').textContent()
    };
  }

  async filterByType(type) {
    await this.filterSelect.selectOption(type);
  }
}

// ============================================
// TEST SETUP
// ============================================
test.describe('E2E-TR: Transaction Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await page.waitForURL(/dashboard/);
  });

  // ============================================
  // DEPOSIT TESTS
  // ============================================
  test.describe('E2E-TR: Deposit Flow', () => {
    test.describe('E2E-TR-01: Successful Deposit', () => {
      test('should deposit valid amount to account', async ({ page }) => {
        const dashboardPage = new DashboardPage(page);
        const initialBalance = await dashboardPage.getAccountBalance(0);
        
        const depositPage = new DepositPage(page);
        await depositPage.goto();
        
        const depositAmount = 1000;
        await depositPage.deposit(0, depositAmount);
        
        // Should show success message
        await expect(depositPage.successMessage).toBeVisible();
        
        // Verify balance updated
        await dashboardPage.goto();
        const newBalance = await dashboardPage.getAccountBalance(0);
        expect(newBalance).toBe(initialBalance + depositAmount);
      });

      test('should deposit decimal amount', async ({ page }) => {
        const depositPage = new DepositPage(page);
        await depositPage.goto();
        
        await depositPage.deposit(0, 500.50);
        
        await expect(depositPage.successMessage).toBeVisible();
      });
    });

    test.describe('E2E-TR-02: Invalid Deposit', () => {
      test('should show error for zero amount', async ({ page }) => {
        const depositPage = new DepositPage(page);
        await depositPage.goto();
        
        await depositPage.deposit(0, 0);
        
        await expect(depositPage.errorMessage).toBeVisible();
      });

      test('should show error for negative amount', async ({ page }) => {
        const depositPage = new DepositPage(page);
        await depositPage.goto();
        
        await depositPage.amountInput.fill('-100');
        await depositPage.submitButton.click();
        
        // Should show error or native validation
        const hasError = await depositPage.errorMessage.isVisible() ||
                         await depositPage.amountInput.evaluate(el => !el.checkValidity());
        expect(hasError).toBeTruthy();
      });
    });
  });

  // ============================================
  // WITHDRAWAL TESTS
  // ============================================
  test.describe('E2E-TR: Withdrawal Flow', () => {
    test.describe('E2E-TR-03: Successful Withdrawal', () => {
      test('should withdraw valid amount from account', async ({ page }) => {
        const dashboardPage = new DashboardPage(page);
        const initialBalance = await dashboardPage.getAccountBalance(0);
        
        const withdrawPage = new WithdrawPage(page);
        await withdrawPage.goto();
        
        const withdrawAmount = 500;
        await withdrawPage.withdraw(0, withdrawAmount);
        
        await expect(withdrawPage.successMessage).toBeVisible();
        
        // Verify balance updated
        await dashboardPage.goto();
        const newBalance = await dashboardPage.getAccountBalance(0);
        expect(newBalance).toBe(initialBalance - withdrawAmount);
      });
    });

    test.describe('E2E-TR-04: Insufficient Balance', () => {
      test('should show error when withdrawing more than balance', async ({ page }) => {
        const dashboardPage = new DashboardPage(page);
        const currentBalance = await dashboardPage.getAccountBalance(0);
        
        const withdrawPage = new WithdrawPage(page);
        await withdrawPage.goto();
        
        // Try to withdraw more than balance
        await withdrawPage.withdraw(0, currentBalance + 10000);
        
        await expect(withdrawPage.errorMessage).toBeVisible();
        await expect(withdrawPage.errorMessage).toContainText(/insufficient|balance|enough/i);
      });
    });
  });

  // ============================================
  // INTERNAL TRANSFER TESTS
  // ============================================
  test.describe('E2E-TR: Internal Transfer Flow', () => {
    test.describe('E2E-TR-05: Successful Internal Transfer', () => {
      test('should transfer between own accounts', async ({ page }) => {
        const transferPage = new TransferPage(page);
        await transferPage.goto();
        
        const transferAmount = 1000;
        await transferPage.submitInternalTransfer(0, 1, transferAmount, 'Test transfer');
        
        await expect(transferPage.successMessage).toBeVisible();
      });

      test('should update both account balances', async ({ page }) => {
        const dashboardPage = new DashboardPage(page);
        await dashboardPage.goto();
        
        const fromBalance = await dashboardPage.getAccountBalance(0);
        const toBalance = await dashboardPage.getAccountBalance(1);
        
        const transferPage = new TransferPage(page);
        await transferPage.goto();
        
        const transferAmount = 500;
        await transferPage.submitInternalTransfer(0, 1, transferAmount);
        
        await expect(transferPage.successMessage).toBeVisible();
        
        // Verify balances
        await dashboardPage.goto();
        expect(await dashboardPage.getAccountBalance(0)).toBe(fromBalance - transferAmount);
        expect(await dashboardPage.getAccountBalance(1)).toBe(toBalance + transferAmount);
      });
    });

    test.describe('E2E-TR-06: Same Account Transfer', () => {
      test('should prevent transfer to same account', async ({ page }) => {
        const transferPage = new TransferPage(page);
        await transferPage.goto();
        
        // Select same account for from and to
        await transferPage.selectFromAccount(0);
        await transferPage.selectToAccount(0);
        await transferPage.fillAmount(100);
        await transferPage.submitButton.click();
        
        await expect(transferPage.errorMessage).toBeVisible();
        await expect(transferPage.errorMessage).toContainText(/same|cannot/i);
      });
    });

    test.describe('E2E-TR-07: Insufficient Balance Transfer', () => {
      test('should show error for insufficient balance', async ({ page }) => {
        const dashboardPage = new DashboardPage(page);
        const currentBalance = await dashboardPage.getAccountBalance(0);
        
        const transferPage = new TransferPage(page);
        await transferPage.goto();
        
        await transferPage.submitInternalTransfer(0, 1, currentBalance + 10000);
        
        await expect(transferPage.errorMessage).toBeVisible();
      });
    });
  });

  // ============================================
  // EXTERNAL TRANSFER TESTS
  // ============================================
  test.describe('E2E-TR: External Transfer Flow', () => {
    test.describe('E2E-TR-08: Successful External Transfer', () => {
      test('should transfer to valid IBAN', async ({ page }) => {
        const transferPage = new TransferPage(page);
        await transferPage.goto();
        
        await transferPage.submitExternalTransfer(
          0,
          'TR330006100519786457841999',
          'Jane Doe',
          500,
          'External payment'
        );
        
        await expect(transferPage.successMessage).toBeVisible();
      });
    });

    test.describe('E2E-TR-09: Invalid IBAN', () => {
      test('should show error for invalid IBAN format', async ({ page }) => {
        const transferPage = new TransferPage(page);
        await transferPage.goto();
        
        await transferPage.submitExternalTransfer(
          0,
          'INVALID_IBAN',
          'Jane Doe',
          500
        );
        
        await expect(transferPage.errorMessage).toBeVisible();
        await expect(transferPage.errorMessage).toContainText(/iban|invalid|format/i);
      });

      test('should show error for short IBAN', async ({ page }) => {
        const transferPage = new TransferPage(page);
        await transferPage.goto();
        
        await transferPage.submitExternalTransfer(
          0,
          'TR12345',
          'Jane Doe',
          500
        );
        
        await expect(transferPage.errorMessage).toBeVisible();
      });
    });

    test.describe('E2E-TR-10: Missing Receiver Info', () => {
      test('should show error for missing receiver name', async ({ page }) => {
        const transferPage = new TransferPage(page);
        await transferPage.goto();
        
        // Switch to external if needed
        if (await transferPage.transferTypeToggle.isVisible()) {
          await transferPage.transferTypeToggle.click();
        }
        
        await transferPage.selectFromAccount(0);
        await transferPage.ibanInput.fill('TR330006100519786457841999');
        // Skip receiver name
        await transferPage.fillAmount(500);
        await transferPage.submitButton.click();
        
        const hasError = await transferPage.errorMessage.isVisible() ||
                         await transferPage.receiverNameInput.evaluate(el => !el.checkValidity());
        expect(hasError).toBeTruthy();
      });
    });
  });

  // ============================================
  // TRANSACTION HISTORY TESTS
  // ============================================
  test.describe('E2E-TR: Transaction History', () => {
    test.describe('E2E-TR-11: View Transaction History', () => {
      test('should display transaction history', async ({ page }) => {
        const historyPage = new TransactionHistoryPage(page);
        await historyPage.goto();
        
        await expect(historyPage.transactionList).toBeVisible();
        const count = await historyPage.getTransactionCount();
        expect(count).toBeGreaterThan(0);
      });

      test('should show new transaction in history', async ({ page }) => {
        // Make a deposit first
        const depositPage = new DepositPage(page);
        await depositPage.goto();
        await depositPage.deposit(0, 777);
        await expect(depositPage.successMessage).toBeVisible();
        
        // Check transaction history
        const historyPage = new TransactionHistoryPage(page);
        await historyPage.goto();
        
        const latestTx = await historyPage.getLatestTransaction();
        expect(latestTx.type.toLowerCase()).toContain('deposit');
        expect(latestTx.amount).toContain('777');
      });
    });

    test.describe('E2E-TR-12: Filter Transactions', () => {
      test('should filter by transaction type', async ({ page }) => {
        const historyPage = new TransactionHistoryPage(page);
        await historyPage.goto();
        
        // Filter by deposits
        await historyPage.filterByType('deposit');
        
        // All visible transactions should be deposits
        const items = historyPage.transactionItems;
        const count = await items.count();
        
        for (let i = 0; i < Math.min(count, 5); i++) {
          const typeText = await items.nth(i).locator('.transaction-type, .type').textContent();
          expect(typeText.toLowerCase()).toContain('deposit');
        }
      });
    });
  });
});
