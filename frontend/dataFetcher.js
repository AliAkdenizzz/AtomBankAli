// ================== DATA FETCHER UTILITY ==================
// Helper functions to fetch user-specific data from API

/**
 * Get API base URL from config
 */
function getApiBaseUrl() {
  return window.API_BASE_URL || "";
}

/**
 * Get authentication token from storage
 */
function getAuthToken() {
  return (
    localStorage.getItem("atomBankToken") ||
    sessionStorage.getItem("atomBankToken")
  );
}

/**
 * Get auth headers for API requests
 */
function getAuthHeaders() {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    Authorization: token ? "Bearer " + token : "",
  };
}

/**
 * Fetch all accounts for the logged-in user
 * @returns {Promise<Array>} Array of account objects
 */
async function fetchUserAccounts() {
  try {
    const res = await fetch(getApiBaseUrl() + "/api/account", {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch accounts");
    }

    const data = await res.json();
    return data.accounts || [];
  } catch (err) {
    console.error("Error fetching accounts:", err);
    return [];
  }
}

/**
 * Fetch all transactions for a specific account
 * @param {string} accountId - Account ID
 * @returns {Promise<Array>} Array of transaction objects
 */
async function fetchAccountTransactions(accountId) {
  try {
    const res = await fetch(getApiBaseUrl() + "/api/account/" + accountId + "/history", {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Failed to fetch transactions:", res.status, errorData);
      throw new Error(errorData.message || "Failed to fetch transactions");
    }

    const data = await res.json();
    console.log(
      "Fetched " + (data.transactions?.length || 0) + " transactions for account " + accountId
    );
    return data.transactions || [];
  } catch (err) {
    console.error("Error fetching transactions:", err);
    return [];
  }
}

/**
 * Fetch all transactions from all accounts (for dashboard)
 * @returns {Promise<Array>} Array of all transactions with account info
 */
async function fetchAllTransactions() {
  try {
    const accounts = await fetchUserAccounts();
    console.log("Fetching transactions for " + accounts.length + " accounts");
    const allTransactions = [];

    for (const account of accounts) {
      const transactions = await fetchAccountTransactions(account._id);
      console.log(
        "Account " + account._id + " (" + account.accountName + "): " + transactions.length + " transactions"
      );
      transactions.forEach((tx) => {
        allTransactions.push({
          ...tx,
          accountName: account.accountName,
          accountNumber: account.accountNumber,
          currency: tx.currency || account.currency,
          date: tx.createdAt || tx.date || new Date(),
        });
      });
    }

    console.log("Total transactions fetched: " + allTransactions.length);
    return allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (err) {
    console.error("Error fetching all transactions:", err);
    return [];
  }
}

/**
 * Fetch all bills for the logged-in user
 * @param {string} status - Optional: 'paid' or 'unpaid'
 * @returns {Promise<Array>} Array of bill objects
 */
async function fetchUserBills(status) {
  try {
    var url = getApiBaseUrl() + "/api/bills";
    if (status) {
      url += "?status=" + status;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch bills");
    }

    const data = await res.json();
    return data.bills || [];
  } catch (err) {
    console.error("Error fetching bills:", err);
    return [];
  }
}

/**
 * Fetch full user profile (including accounts, bills, etc.)
 * @returns {Promise<Object>} User object with all data
 */
async function fetchUserProfile() {
  try {
    const res = await fetch(getApiBaseUrl() + "/api/user/me", {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch user profile");
    }

    const data = await res.json();
    return data.data || null;
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return null;
  }
}

/**
 * Calculate total balance across all accounts
 */
function calculateTotalBalance(accounts, currency) {
  if (!accounts || accounts.length === 0) return 0;

  const filtered = currency
    ? accounts.filter((acc) => acc.currency === currency)
    : accounts;

  return filtered.reduce((total, acc) => total + (acc.balance || 0), 0);
}

/**
 * Format currency amount
 */
function formatCurrency(amount, currency) {
  currency = currency || "TRY";
  if (amount === null || amount === undefined) return "0.00";
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "0.00";

  const symbols = {
    TRY: "₺",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };

  const symbol = symbols[currency] || currency;
  return (
    symbol +
    numAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/**
 * Format date for display
 */
function formatDate(date) {
  const d = new Date(date);
  const options = { day: "numeric", month: "short", year: "numeric" };
  return d.toLocaleDateString("en-US", options);
}

/**
 * Format date for transaction grouping (Today, Yesterday, etc.)
 */
function formatTransactionDate(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return "Today | " + d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return "Yesterday | " + d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  } else {
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  }
}

// Export functions for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    getApiBaseUrl,
    getAuthToken,
    getAuthHeaders,
    fetchUserAccounts,
    fetchAccountTransactions,
    fetchAllTransactions,
    fetchUserBills,
    fetchUserProfile,
    calculateTotalBalance,
    formatCurrency,
    formatDate,
    formatTransactionDate,
  };
}
