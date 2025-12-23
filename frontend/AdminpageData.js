// ================== GLOBAL STATE ==================
let adminUsers = [];
let adminTransactions = [];
let selectedUserId = null;
let showAllUsers = false; // Track if we're showing all users or just 3

// ================== INITIALIZATION ==================
document.addEventListener("DOMContentLoaded", async () => {
  // Check token exists
  const token =
    localStorage.getItem("atomBankToken") ||
    sessionStorage.getItem("atomBankToken");
  if (!token) {
    window.location.href = "/index.html";
    return;
  }

  // Verify admin access
  try {
    const res = await fetch("/api/user/me", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("Unauthorized");
    }

    const data = await res.json();

    // Check if user is admin
    if (!data.data || data.data.role !== "admin") {
      alert("Access denied. Admin only.");
      window.location.href = "/dashboard.html";
      return;
    }

    // Store current user
    window.currentUser = {
      id: data.data._id,
      name: data.data.name,
      role: data.data.role,
      token: token,
    };
  } catch (err) {
    console.error("Auth check failed:", err);
    localStorage.removeItem("atomBankToken");
    sessionStorage.removeItem("atomBankToken");
    window.location.href = "/index.html";
    return;
  }

  // Load initial data
  await loadUsers();
  await loadTransactions({});

  // Set up event listeners
  setupEventListeners();
});

// ================== DATA LOADING ==================

// Load users from backend
async function loadUsers() {
  try {
    adminUsers = await fetchAdminUsers();
    if (adminUsers && adminUsers.length > 0) {
      renderUserTable(adminUsers);
      updateUserCount(adminUsers.length);
    } else {
      // Show empty state
      renderUserTable([]);
      updateUserCount(0);
    }
  } catch (err) {
    console.error("Error loading users:", err);
    alert("Failed to load users. Please refresh the page or contact support.");
    // Show empty state on error
    renderUserTable([]);
    updateUserCount(0);
  }
}

// Load transactions from backend
async function loadTransactions(filters = {}) {
  try {
    adminTransactions = await fetchAdminTransactions(filters);
    if (adminTransactions && adminTransactions.length > 0) {
      renderTransactions(adminTransactions);
    } else {
      renderTransactions([]);
    }
  } catch (err) {
    console.error("Error loading transactions:", err);
    // Show error message to user
    const errorMsg = filters.userId
      ? "Failed to load transactions for this user."
      : "Failed to load transactions. Please try again.";
    alert(errorMsg);
    // Show empty state on error
    renderTransactions([]);
  }
}

// ================== RENDERING ==================

// Render user table
function renderUserTable(users) {
  const tbody = document.getElementById("adminUsersTableBody");
  if (!tbody) return;

  // Clear existing rows (except header)
  tbody.innerHTML = "";

  if (!users || users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-8 text-center text-gray-500">
          No users found
        </td>
      </tr>
    `;
    // Hide "View All Users" button when no users
    const viewAllContainer = document.getElementById("view-all-container");
    if (viewAllContainer) {
      viewAllContainer.style.display = "none";
    }
    return;
  }

  // Limit to 3 users if not showing all
  const usersToRender = showAllUsers ? users : users.slice(0, 3);

  // Always show "View All Users" button if there are more than 3 users
  const viewAllContainer = document.getElementById("view-all-container");
  if (viewAllContainer) {
    if (users.length > 3) {
      viewAllContainer.style.display = "flex";
      // Update button text based on current state
      const viewAllBtn = document.getElementById("view-all-users-btn");
      if (viewAllBtn) {
        const span = viewAllBtn.querySelector("span");
        if (span) {
          span.textContent = showAllUsers ? "Show Less" : "View All Users";
        }
        // Update icon direction
        const icon = viewAllBtn.querySelector(".material-symbols-outlined");
        if (icon) {
          icon.textContent = showAllUsers ? "arrow_back" : "arrow_forward";
        }
      }
    } else {
      viewAllContainer.style.display = "none";
    }
  }

  usersToRender.forEach((user) => {
    const row = document.createElement("tr");
    row.className =
      "hover:bg-gray-50/80 transition-colors group admin-user-row";
    row.dataset.userId = user._id;

    // Status pill
    let statusHtml = "";
    if (user.blocked === true) {
      statusHtml = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700"><span class="size-1.5 rounded-full bg-red-500"></span>Blocked</span>`;
    } else if (user.blocked === false && user.isActive === true) {
      statusHtml = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"><span class="size-1.5 rounded-full bg-green-500 animate-pulse"></span>Active</span>`;
    } else {
      statusHtml = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-600 border border-yellow-100"><span class="size-1.5 rounded-full bg-yellow-500"></span>Inactive</span>`;
    }

    // Block/Unblock button
    const blockButtonText = user.blocked ? "Unblock" : "Block";
    const blockButtonClass = user.blocked
      ? "text-slate-600 hover:text-slate-900 font-medium text-xs border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-all admin-block-btn"
      : "text-gray-400 hover:text-red-500 hover:bg-red-50 font-medium text-xs border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all admin-block-btn";

    // Role display
    const roleDisplay =
      user.role === "admin"
        ? "Admin"
        : user.role === "user"
        ? "Personal"
        : user.role || "Personal";

    // Avatar URL
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.fullName || user.name || "User"
    )}&background=random`;

    row.innerHTML = `
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            <img src="${avatarUrl}" alt="User" class="w-full h-full object-cover">
          </div>
          <div class="flex flex-col">
            <span class="font-bold text-slate-900">${
              user.fullName || user.name || "N/A"
            }</span>
            <span class="text-xs text-gray-400">${user.email || "N/A"}</span>
          </div>
        </div>
      </td>
      <td class="px-6 py-4">${roleDisplay}</td>
      <td class="px-6 py-4">${statusHtml}</td>
      <td class="px-6 py-4">${formatDate(user.createdAt)}</td>
      <td class="px-6 py-4 text-right">
        <button class="${blockButtonClass}" data-user-id="${
      user._id
    }">${blockButtonText}</button>
      </td>
    `;

    tbody.appendChild(row);
  });

  // Attach click handlers
  attachUserTableHandlers();
}

// Render transactions table
function renderTransactions(transactions) {
  const tbody = document.getElementById("adminTransactionsTableBody");
  if (!tbody) return;

  // Clear existing rows
  tbody.innerHTML = "";

  if (!transactions || transactions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-gray-500">
          No transactions found
        </td>
      </tr>
    `;
    return;
  }

  transactions.forEach((tx) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50/80 transition-colors cursor-pointer";

    // Transaction type icon and label
    const typeConfig = getTransactionTypeConfig(tx.type);
    const typeHtml = `
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-gray-400 text-lg">${typeConfig.icon}</span>
        <span>${typeConfig.label}</span>
      </div>
    `;

    // Status pill
    const statusConfig = getStatusConfig(tx.status);
    const statusHtml = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig.class}">${statusConfig.text}</span>`;

    // Amount formatting
    const amountColor =
      tx.type === "deposit" ||
      tx.type === "transfer-in" ||
      tx.type === "exchange-in"
        ? "text-green-600"
        : "text-slate-900";
    const amountPrefix =
      tx.type === "deposit" ||
      tx.type === "transfer-in" ||
      tx.type === "exchange-in"
        ? "+"
        : "";
    const amountHtml = `<span class="font-bold ${amountColor}">${amountPrefix}${formatCurrency(
      tx.amount,
      tx.currency
    )}</span>`;

    // Transaction ID (short format)
    const txId = tx._id
      ? `#TRX-${tx._id.toString().substring(18, 24)}`
      : "#TRX-XXXXXX";

    row.innerHTML = `
      <td class="px-6 py-4 font-mono text-xs text-gray-400">${txId}</td>
      <td class="px-6 py-4 font-medium text-slate-900">${
        tx.userName || "N/A"
      }</td>
      <td class="px-6 py-4">${typeHtml}</td>
      <td class="px-6 py-4">${formatDate(tx.createdAt || tx.date)}</td>
      <td class="px-6 py-4">${amountHtml}</td>
      <td class="px-6 py-4 text-right">${statusHtml}</td>
    `;

    tbody.appendChild(row);
  });
}

// ================== HELPER FUNCTIONS ==================

// Get transaction type configuration
function getTransactionTypeConfig(type) {
  const configs = {
    "transfer-in": { icon: "swap_horiz", label: "Transfer" },
    "transfer-out": { icon: "swap_horiz", label: "Transfer" },
    "transfer-ext": { icon: "swap_horiz", label: "Transfer" },
    "bill-payment": { icon: "payments", label: "Bill Payment" },
    deposit: { icon: "savings", label: "Deposit" },
    withdraw: { icon: "account_balance", label: "Withdrawal" },
    "exchange-in": { icon: "currency_exchange", label: "Currency Exchange" },
    "exchange-out": { icon: "currency_exchange", label: "Currency Exchange" },
    "goal-contrib": { icon: "savings", label: "Savings Goal" },
  };
  return (
    configs[type] || { icon: "account_balance", label: type || "Transaction" }
  );
}

// Get status configuration
function getStatusConfig(status) {
  const configs = {
    completed: {
      class: "bg-green-50 text-green-600 border border-green-100",
      text: "Completed",
    },
    pending: {
      class: "bg-yellow-50 text-yellow-600 border border-yellow-100",
      text: "Pending",
    },
    failed: {
      class: "bg-red-50 text-red-600 border border-red-100",
      text: "Failed",
    },
    cancelled: {
      class: "bg-gray-50 text-gray-600 border border-gray-100",
      text: "Cancelled",
    },
  };
  return (
    configs[status] || {
      class: "bg-gray-50 text-gray-600 border border-gray-100",
      text: status || "Unknown",
    }
  );
}

// Update user count badge
function updateUserCount(count) {
  const badge = document.querySelector(
    "span.bg-gray-100.text-gray-600.text-xs"
  );
  if (badge) {
    badge.textContent = `${count} Users`;
  }
}

// ================== EVENT HANDLERS ==================

// Setup event listeners
function setupEventListeners() {
  // User table click handler (event delegation)
  const userTable = document.getElementById("adminUsersTableBody");
  if (userTable) {
    userTable.addEventListener("click", onUsersTableClick);
  }

  // Search input handler
  const searchInput = document.getElementById("userSearchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", filterUsers);
  }

  // View All button handler
  const viewAllBtn = document.getElementById("view-all-users-btn");
  if (viewAllBtn) {
    viewAllBtn.addEventListener("click", toggleAllUsers);
  }

  // Logout button handler
  const logoutBtn = document.getElementById("adminLogoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleAdminLogout);
  }

  // Transaction type filter handler
  const transactionTypeFilter = document.getElementById(
    "transactionTypeFilter"
  );
  if (transactionTypeFilter) {
    transactionTypeFilter.addEventListener(
      "change",
      handleTransactionTypeFilter
    );
  }
}

// Attach user table handlers
function attachUserTableHandlers() {
  // Handlers are attached via event delegation in setupEventListeners
}

// User table click handler
async function onUsersTableClick(e) {
  const blockBtn = e.target.closest(".admin-block-btn");
  if (blockBtn) {
    e.stopPropagation();
    const userId = blockBtn.dataset.userId;
    await handleUserBlock(userId);
    return;
  }

  // If clicking on row (not button)
  const row = e.target.closest("tr.admin-user-row");
  if (row) {
    const userId = row.dataset.userId;
    await handleUserSelect(userId);
  }
}

// Handle user block/unblock
async function handleUserBlock(userId) {
  try {
    const result = await toggleUserBlock(userId);
    if (result) {
      // Update local state
      const userIndex = adminUsers.findIndex((u) => u._id === userId);
      if (userIndex !== -1) {
        adminUsers[userIndex].blocked = result.blocked;
        // Re-render table
        renderUserTable(adminUsers);
        // Show success message
        const message = result.blocked
          ? "User has been blocked successfully."
          : "User has been unblocked successfully.";
        console.log(message);
      }
    } else {
      alert("Failed to block/unblock user. Please try again.");
    }
  } catch (err) {
    console.error("Error blocking user:", err);
    alert("Failed to block/unblock user: " + (err.message || "Unknown error"));
  }
}

// Handle user selection
async function handleUserSelect(userId) {
  const user = adminUsers.find((u) => u._id === userId);
  if (!user) {
    console.warn("User not found:", userId);
    return;
  }

  // Log user details to console with full details
  console.log("Selected user:", {
    _id: user._id,
    name: user.name,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    blocked: user.blocked,
    isActive: user.isActive,
    createdAt: user.createdAt,
    accounts: user.accounts || [],
    bills: user.bills || [],
    transactions: user.transactions || [],
  });

  // Update selected state
  selectedUserId = userId;

  // Highlight selected row
  document.querySelectorAll("tr.admin-user-row").forEach((row) => {
    row.classList.remove("bg-gray-50", "border-l-4", "border-l-primary");
  });
  const selectedRow = document.querySelector(`tr[data-user-id="${userId}"]`);
  if (selectedRow) {
    selectedRow.classList.add("bg-gray-50", "border-l-4", "border-l-primary");
  }

  // Load transactions for this user
  await loadTransactions({ userId });
}

// Filter users by search input
function filterUsers() {
  const searchInput = document.getElementById("userSearchInput");
  if (!searchInput) return;

  const filter = searchInput.value.toLowerCase().trim();

  if (filter === "") {
    renderUserTable(adminUsers);
    return;
  }

  const filtered = adminUsers.filter((user) => {
    const name = (user.fullName || user.name || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    return name.includes(filter) || email.includes(filter);
  });

  renderUserTable(filtered);
}

// Make filterUsers globally available
window.filterUsers = filterUsers;

// Toggle all users view (for "View All Users" button)
function toggleAllUsers() {
  showAllUsers = !showAllUsers;

  // Re-render the table with the new state
  // If there's a search filter active, use filtered users, otherwise use all users
  const searchInput = document.getElementById("userSearchInput");
  const filter = searchInput ? searchInput.value.toLowerCase().trim() : "";

  let usersToRender = adminUsers;
  if (filter !== "") {
    usersToRender = adminUsers.filter((user) => {
      const name = (user.fullName || user.name || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      return name.includes(filter) || email.includes(filter);
    });
  }

  renderUserTable(usersToRender);

  // Button text and icon are updated in renderUserTable, but we can also update here for immediate feedback
  const viewAllBtn = document.getElementById("view-all-users-btn");
  if (viewAllBtn) {
    const span = viewAllBtn.querySelector("span");
    if (span) {
      span.textContent = showAllUsers ? "Show Less" : "View All Users";
    }
    // Update icon direction
    const icon = viewAllBtn.querySelector(".material-symbols-outlined");
    if (icon) {
      icon.textContent = showAllUsers ? "arrow_back" : "arrow_forward";
    }
  }
}

// Make toggleAllUsers globally available
window.toggleAllUsers = toggleAllUsers;

// ================== SIDEBAR TOGGLE (from original HTML) ==================

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("mobile-overlay");
  if (!sidebar || !overlay) return;

  let isSidebarOpen = sidebar.classList.contains("-translate-x-full") === false;

  if (isSidebarOpen) {
    // Close Sidebar
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("opacity-0");
    setTimeout(() => {
      overlay.classList.add("hidden");
    }, 300);
  } else {
    // Open Sidebar
    sidebar.classList.remove("-translate-x-full");
    overlay.classList.remove("hidden");
    setTimeout(() => {
      overlay.classList.remove("opacity-0");
    }, 10);
  }
}

// Make toggleSidebar globally available
window.toggleSidebar = toggleSidebar;

// ================== LOGOUT HANDLER ==================

// Handle admin logout
async function handleAdminLogout() {
  const confirmMsg = "Are you sure you want to log out?";
  if (!confirm(confirmMsg)) {
    return;
  }

  const token =
    localStorage.getItem("atomBankToken") ||
    sessionStorage.getItem("atomBankToken");

  localStorage.removeItem("atomBankToken");
  sessionStorage.removeItem("atomBankToken");

  try {
    await fetch("/api/auth/logout", {
      method: "GET",
      headers: token ? { Authorization: "Bearer " + token } : {},
    });
  } catch (err) {
    console.warn("Logout request error:", err);
  }

  window.location.href = "/index.html";
}

// ================== TRANSACTION TYPE FILTER ==================

// Handle transaction type filter change
async function handleTransactionTypeFilter(e) {
  const selectedType = e.target.value;

  // Build filters object
  const filters = {};

  // If a user is selected, keep the userId filter
  if (selectedUserId) {
    filters.userId = selectedUserId;
  }

  // Add type filter if not "All Types"
  if (selectedType) {
    filters.type = selectedType;
  }

  // Reload transactions with new filter
  await loadTransactions(filters);
}

// Set current date
document.addEventListener("DOMContentLoaded", () => {
  const dateElement = document.getElementById("current-date");
  if (dateElement) {
    const now = new Date();
    const options = { year: "numeric", month: "short" };
    dateElement.textContent = now.toLocaleDateString("en-US", options);
  }
});
