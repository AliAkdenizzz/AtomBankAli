// ================== UTILITY FUNCTIONS ==================

// Get authentication headers from localStorage
function getAuthHeaders() {
  const token =
    localStorage.getItem("atomBankToken") ||
    sessionStorage.getItem("atomBankToken");
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  };
}

// Format currency amount
function formatCurrency(amount, currency = "TRY") {
  if (amount === null || amount === undefined) return "0.00";
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "0.00";

  const currencySymbols = {
    TRY: "₺",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };

  const symbol = currencySymbols[currency] || currency;
  return (
    symbol +
    numAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

// Format date to readable format
function formatDate(date) {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";

  const options = { year: "numeric", month: "short", day: "numeric" };
  return d.toLocaleDateString("en-US", options);
}

// ================== ADMIN API FUNCTIONS ==================

// Fetch all users
async function fetchAdminUsers() {
  try {
    const res = await fetch("/api/admin/users", {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        console.error("Unauthorized access. Redirecting to login...");
        window.location.href = "/index.html";
        return null;
      }
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to fetch users");
    }

    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error("Error fetching admin users:", err);
    if (err.message.includes("Unauthorized") || err.message.includes("403")) {
      window.location.href = "/index.html";
    }
    return [];
  }
}

// Fetch all transactions (with optional filters)
async function fetchAdminTransactions(filters = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (filters.userId) queryParams.append("userId", filters.userId);
    if (filters.type) queryParams.append("type", filters.type);
    if (filters.status) queryParams.append("status", filters.status);

    const url = `/api/admin/transactions${
      queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;

    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        console.error("Unauthorized access. Redirecting to login...");
        window.location.href = "/index.html";
        return null;
      }
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to fetch transactions");
    }

    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error("Error fetching admin transactions:", err);
    if (err.message.includes("Unauthorized") || err.message.includes("403")) {
      window.location.href = "/index.html";
    }
    return [];
  }
}

// Toggle user block status
async function toggleUserBlock(userId) {
  try {
    const res = await fetch(`/api/admin/users/${userId}/block`, {
      method: "PUT",
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        console.error("Unauthorized access. Redirecting to login...");
        window.location.href = "/index.html";
        return null;
      }
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to toggle user block");
    }

    const data = await res.json();
    return data.data || null;
  } catch (err) {
    console.error("Error toggling user block:", err);
    if (err.message.includes("Unauthorized") || err.message.includes("403")) {
      window.location.href = "/index.html";
    }
    throw err;
  }
}
