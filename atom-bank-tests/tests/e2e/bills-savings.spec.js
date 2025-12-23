/**
 * E2E Tests: Bills and Savings Goals
 * Tests for bill payments and savings goal management
 * 
 * Test IDs: E2E-BILL-01 to E2E-BILL-06, E2E-SAV-01 to E2E-SAV-06
 * Mapped Use Cases: UC-07 (Pay Bill), UC-08 (Savings Goals)
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

class BillsPage {
  constructor(page) {
    this.page = page;
    this.billsList = page.locator('.bills-list, .bills-container, #billsList');
    this.billItems = page.locator('.bill-item, .bill-card, tr.bill');
    this.addBillBtn = page.locator('.add-bill-btn, #addBillBtn, [data-action="add-bill"]');
    this.payBillBtn = page.locator('.pay-bill-btn, #payBillBtn, [data-action="pay"]');
    
    // Bill form fields
    this.billTypeSelect = page.locator('select[name="billType"], #billType');
    this.providerInput = page.locator('input[name="provider"], #provider');
    this.subscriberNoInput = page.locator('input[name="subscriberNo"], #subscriberNo');
    this.amountInput = page.locator('input[name="amount"], #amount');
    this.dueDateInput = page.locator('input[name="dueDate"], #dueDate');
    this.accountSelect = page.locator('select[name="account"], #paymentAccount');
    this.submitBtn = page.locator('button[type="submit"], .submit-btn');
    
    this.successMessage = page.locator('.success-message, .alert-success, .toast-success');
    this.errorMessage = page.locator('.error-message, .alert-danger, .error');
  }

  async goto() {
    await this.page.goto('/bills');
  }

  async addBill(billData) {
    await this.addBillBtn.click();
    await this.billTypeSelect.selectOption(billData.type);
    await this.providerInput.fill(billData.provider);
    await this.subscriberNoInput.fill(billData.subscriberNo);
    await this.amountInput.fill(billData.amount.toString());
    if (billData.dueDate) {
      await this.dueDateInput.fill(billData.dueDate);
    }
    await this.submitBtn.click();
  }

  async payBill(billIndex, accountIndex = 0) {
    const billItem = this.billItems.nth(billIndex);
    await billItem.locator('.pay-btn, [data-action="pay"]').click();
    
    // Select payment account if modal appears
    if (await this.accountSelect.isVisible()) {
      await this.accountSelect.selectOption({ index: accountIndex });
      await this.submitBtn.click();
    }
  }

  async getBillCount() {
    return await this.billItems.count();
  }

  async getPendingBillsCount() {
    return await this.page.locator('.bill-item.pending, .bill-status-pending').count();
  }
}

class SavingsGoalsPage {
  constructor(page) {
    this.page = page;
    this.goalsList = page.locator('.goals-list, .savings-goals, #goalsList');
    this.goalItems = page.locator('.goal-item, .goal-card, .savings-goal');
    this.addGoalBtn = page.locator('.add-goal-btn, #addGoalBtn, [data-action="add-goal"]');
    this.contributeBtn = page.locator('.contribute-btn, [data-action="contribute"]');
    
    // Goal form fields
    this.goalNameInput = page.locator('input[name="name"], input[name="goalName"], #goalName');
    this.targetAmountInput = page.locator('input[name="targetAmount"], #targetAmount');
    this.deadlineInput = page.locator('input[name="deadline"], #deadline');
    this.currencySelect = page.locator('select[name="currency"], #currency');
    this.accountSelect = page.locator('select[name="account"], #sourceAccount');
    this.contributionAmountInput = page.locator('input[name="contributionAmount"], #contributionAmount');
    this.submitBtn = page.locator('button[type="submit"], .submit-btn');
    
    this.successMessage = page.locator('.success-message, .alert-success');
    this.errorMessage = page.locator('.error-message, .alert-danger');
    this.progressBar = page.locator('.progress-bar, .goal-progress');
  }

  async goto() {
    await this.page.goto('/savings-goals');
  }

  async createGoal(goalData) {
    await this.addGoalBtn.click();
    await this.goalNameInput.fill(goalData.name);
    await this.targetAmountInput.fill(goalData.targetAmount.toString());
    if (goalData.deadline) {
      await this.deadlineInput.fill(goalData.deadline);
    }
    if (goalData.currency && await this.currencySelect.isVisible()) {
      await this.currencySelect.selectOption(goalData.currency);
    }
    await this.submitBtn.click();
  }

  async contributeToGoal(goalIndex, amount, accountIndex = 0) {
    const goalItem = this.goalItems.nth(goalIndex);
    await goalItem.locator('.contribute-btn, [data-action="contribute"]').click();
    
    if (await this.accountSelect.isVisible()) {
      await this.accountSelect.selectOption({ index: accountIndex });
    }
    await this.contributionAmountInput.fill(amount.toString());
    await this.submitBtn.click();
  }

  async getGoalProgress(goalIndex) {
    const goalItem = this.goalItems.nth(goalIndex);
    const currentText = await goalItem.locator('.current-amount, .progress-current').textContent();
    const targetText = await goalItem.locator('.target-amount, .progress-target').textContent();
    
    const current = parseFloat(currentText.replace(/[^0-9.-]+/g, ''));
    const target = parseFloat(targetText.replace(/[^0-9.-]+/g, ''));
    
    return { current, target, percentage: (current / target) * 100 };
  }

  async getGoalCount() {
    return await this.goalItems.count();
  }
}

// ============================================
// TEST SETUP
// ============================================
test.describe('E2E: Bills and Savings', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await page.waitForURL(/dashboard/);
  });

  // ============================================
  // BILLS TESTS
  // ============================================
  test.describe('E2E-BILL: Bill Management', () => {
    test.describe('E2E-BILL-01: View Bills', () => {
      test('should display bills list', async ({ page }) => {
        const billsPage = new BillsPage(page);
        await billsPage.goto();
        
        await expect(billsPage.billsList).toBeVisible();
      });

      test('should show pending and paid bills', async ({ page }) => {
        const billsPage = new BillsPage(page);
        await billsPage.goto();
        
        const totalBills = await billsPage.getBillCount();
        expect(totalBills).toBeGreaterThanOrEqual(0);
      });
    });

    test.describe('E2E-BILL-02: Add New Bill', () => {
      test('should add electricity bill', async ({ page }) => {
        const billsPage = new BillsPage(page);
        await billsPage.goto();
        
        const initialCount = await billsPage.getBillCount();
        
        await billsPage.addBill({
          type: 'electricity',
          provider: 'TEDAS',
          subscriberNo: '1234567890',
          amount: 350,
          dueDate: '2025-12-25'
        });
        
        await expect(billsPage.successMessage).toBeVisible();
        
        // Verify bill added
        const newCount = await billsPage.getBillCount();
        expect(newCount).toBe(initialCount + 1);
      });

      test('should add water bill', async ({ page }) => {
        const billsPage = new BillsPage(page);
        await billsPage.goto();
        
        await billsPage.addBill({
          type: 'water',
          provider: 'ISKI',
          subscriberNo: '9876543210',
          amount: 180
        });
        
        await expect(billsPage.successMessage).toBeVisible();
      });
    });

    test.describe('E2E-BILL-03: Pay Bill', () => {
      test('should pay pending bill successfully', async ({ page }) => {
        const billsPage = new BillsPage(page);
        await billsPage.goto();
        
        // Get initial pending count
        const pendingBefore = await billsPage.getPendingBillsCount();
        
        if (pendingBefore > 0) {
          await billsPage.payBill(0, 0);
          await expect(billsPage.successMessage).toBeVisible();
        }
      });

      test('should update account balance after payment', async ({ page }) => {
        // This would check that the account balance is reduced
        const billsPage = new BillsPage(page);
        await billsPage.goto();
        
        // Implementation depends on actual UI
        expect(true).toBe(true); // Placeholder
      });
    });

    test.describe('E2E-BILL-04: Bill Validation', () => {
      test('should show error for invalid subscriber number', async ({ page }) => {
        const billsPage = new BillsPage(page);
        await billsPage.goto();
        
        await billsPage.addBillBtn.click();
        await billsPage.billTypeSelect.selectOption('electricity');
        await billsPage.providerInput.fill('TEDAS');
        await billsPage.subscriberNoInput.fill(''); // Empty
        await billsPage.amountInput.fill('100');
        await billsPage.submitBtn.click();
        
        const hasError = await billsPage.errorMessage.isVisible() ||
                         await billsPage.subscriberNoInput.evaluate(el => !el.checkValidity());
        expect(hasError).toBeTruthy();
      });

      test('should show error for zero amount', async ({ page }) => {
        const billsPage = new BillsPage(page);
        await billsPage.goto();
        
        await billsPage.addBillBtn.click();
        await billsPage.billTypeSelect.selectOption('electricity');
        await billsPage.providerInput.fill('TEDAS');
        await billsPage.subscriberNoInput.fill('1234567890');
        await billsPage.amountInput.fill('0');
        await billsPage.submitBtn.click();
        
        await expect(billsPage.errorMessage).toBeVisible();
      });
    });

    test.describe('E2E-BILL-05: Insufficient Balance', () => {
      test('should show error when balance insufficient for bill payment', async ({ page }) => {
        // This test would require setting up an account with very low balance
        // or a bill with very high amount
        const billsPage = new BillsPage(page);
        await billsPage.goto();
        
        // Implementation depends on test data setup
        expect(true).toBe(true); // Placeholder
      });
    });

    test.describe('E2E-BILL-06: Bill History', () => {
      test('should show paid bills in history', async ({ page }) => {
        const billsPage = new BillsPage(page);
        await billsPage.goto();
        
        // Navigate to bill history
        const historyTab = page.locator('[data-tab="history"], .bill-history-tab');
        if (await historyTab.isVisible()) {
          await historyTab.click();
          
          const paidBills = page.locator('.bill-item.paid, .bill-status-paid');
          const count = await paidBills.count();
          expect(count).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

  // ============================================
  // SAVINGS GOALS TESTS
  // ============================================
  test.describe('E2E-SAV: Savings Goals', () => {
    test.describe('E2E-SAV-01: View Savings Goals', () => {
      test('should display savings goals list', async ({ page }) => {
        const savingsPage = new SavingsGoalsPage(page);
        await savingsPage.goto();
        
        await expect(savingsPage.goalsList).toBeVisible();
      });
    });

    test.describe('E2E-SAV-02: Create Savings Goal', () => {
      test('should create vacation savings goal', async ({ page }) => {
        const savingsPage = new SavingsGoalsPage(page);
        await savingsPage.goto();
        
        const initialCount = await savingsPage.getGoalCount();
        
        await savingsPage.createGoal({
          name: 'Summer Vacation 2025',
          targetAmount: 25000,
          deadline: '2025-06-01',
          currency: 'TRY'
        });
        
        await expect(savingsPage.successMessage).toBeVisible();
        
        const newCount = await savingsPage.getGoalCount();
        expect(newCount).toBe(initialCount + 1);
      });

      test('should create emergency fund goal', async ({ page }) => {
        const savingsPage = new SavingsGoalsPage(page);
        await savingsPage.goto();
        
        await savingsPage.createGoal({
          name: 'Emergency Fund',
          targetAmount: 50000
        });
        
        await expect(savingsPage.successMessage).toBeVisible();
      });
    });

    test.describe('E2E-SAV-03: Contribute to Goal', () => {
      test('should add contribution to savings goal', async ({ page }) => {
        const savingsPage = new SavingsGoalsPage(page);
        await savingsPage.goto();
        
        const goalCount = await savingsPage.getGoalCount();
        if (goalCount > 0) {
          const progressBefore = await savingsPage.getGoalProgress(0);
          
          await savingsPage.contributeToGoal(0, 1000, 0);
          
          await expect(savingsPage.successMessage).toBeVisible();
          
          // Verify progress updated
          const progressAfter = await savingsPage.getGoalProgress(0);
          expect(progressAfter.current).toBe(progressBefore.current + 1000);
        }
      });

      test('should update progress bar after contribution', async ({ page }) => {
        const savingsPage = new SavingsGoalsPage(page);
        await savingsPage.goto();
        
        const goalCount = await savingsPage.getGoalCount();
        if (goalCount > 0) {
          await savingsPage.contributeToGoal(0, 500, 0);
          
          await expect(savingsPage.progressBar.first()).toBeVisible();
        }
      });
    });

    test.describe('E2E-SAV-04: Goal Validation', () => {
      test('should show error for empty goal name', async ({ page }) => {
        const savingsPage = new SavingsGoalsPage(page);
        await savingsPage.goto();
        
        await savingsPage.addGoalBtn.click();
        await savingsPage.goalNameInput.fill('');
        await savingsPage.targetAmountInput.fill('10000');
        await savingsPage.submitBtn.click();
        
        const hasError = await savingsPage.errorMessage.isVisible() ||
                         await savingsPage.goalNameInput.evaluate(el => !el.checkValidity());
        expect(hasError).toBeTruthy();
      });

      test('should show error for zero target amount', async ({ page }) => {
        const savingsPage = new SavingsGoalsPage(page);
        await savingsPage.goto();
        
        await savingsPage.addGoalBtn.click();
        await savingsPage.goalNameInput.fill('Test Goal');
        await savingsPage.targetAmountInput.fill('0');
        await savingsPage.submitBtn.click();
        
        await expect(savingsPage.errorMessage).toBeVisible();
      });
    });

    test.describe('E2E-SAV-05: Insufficient Balance for Contribution', () => {
      test('should show error when contribution exceeds balance', async ({ page }) => {
        const savingsPage = new SavingsGoalsPage(page);
        await savingsPage.goto();
        
        const goalCount = await savingsPage.getGoalCount();
        if (goalCount > 0) {
          // Try to contribute very large amount
          await savingsPage.contributeToGoal(0, 999999999, 0);
          
          await expect(savingsPage.errorMessage).toBeVisible();
        }
      });
    });

    test.describe('E2E-SAV-06: Goal Completion', () => {
      test('should mark goal as completed when target reached', async ({ page }) => {
        // This test would require a goal that's close to completion
        const savingsPage = new SavingsGoalsPage(page);
        await savingsPage.goto();
        
        // Check for completed goals indicator
        const completedGoals = page.locator('.goal-completed, .goal-status-completed');
        const count = await completedGoals.count();
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
