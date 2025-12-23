// ================== BILL PAYMENTS DATA LOADER ==================

// Global variables for bill payments
window.billPaymentData = {
  bills: [],
  accounts: [],
  totalAmount: 0,
};

// ================== HELPER FUNCTIONS (defined outside try block) ==================

// Remove bill from UI without page refresh
function removeBillFromUI(billId, billAmount) {
  // 1. Remove bill card from DOM with animation
  const billCard = document.querySelector(`[data-bill-id="${billId}"]`);
  if (billCard) {
    billCard.style.transition = "all 0.3s ease-out";
    billCard.style.opacity = "0";
    billCard.style.transform = "scale(0.9)";
    setTimeout(() => {
      billCard.remove();

      // Check if no bills left - show empty state
      const billsGrid = document.querySelector(
        ".grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3"
      );
      if (billsGrid && billsGrid.children.length === 0) {
        billsGrid.innerHTML = `
          <div class="col-span-3 text-center py-12">
            <span class="material-symbols-outlined text-6xl text-atom-text-grey mb-4">check_circle</span>
            <p class="text-atom-text-grey text-lg">No outstanding bills. You're all caught up!</p>
          </div>
        `;
      }
    }, 300);
  }

  // 2. Remove bill from billPaymentData array
  const billIndex = window.billPaymentData.bills.findIndex(
    (b) => b._id === billId
  );
  if (billIndex > -1) {
    window.billPaymentData.bills.splice(billIndex, 1);
  }

  // 3. Update total amount
  window.billPaymentData.totalAmount -= billAmount;
  const newTotal = window.billPaymentData.totalAmount;
  const remainingBills = window.billPaymentData.bills.length;

  // 4. Update bill count header
  const billCountEl = document.querySelector("h3");
  if (billCountEl && billCountEl.textContent.includes("Outstanding Bills")) {
    billCountEl.textContent = `Outstanding Bills (${remainingBills})`;
  }

  // 5. Update "Pay All" button
  const payAllBtn = document.querySelector(".btn-gradient");
  if (payAllBtn) {
    if (remainingBills === 0) {
      payAllBtn.style.display = "none";
    } else {
      payAllBtn.innerHTML = `
        <span class="material-symbols-outlined text-lg">check_circle</span>
        Pay All (${formatCurrency(newTotal, "TRY")})
      `;
    }
  }

  console.log(
    `Bill removed from UI. Remaining: ${remainingBills} bills, Total: ${newTotal}`
  );
}

// Make removeBillFromUI available globally
window.removeBillFromUI = removeBillFromUI;

// Close account selection modal
function closeAccountSelectionModal() {
  var overlay = document.getElementById("accountSelectionOverlay");
  if (overlay) {
    overlay.classList.remove("active");
    setTimeout(function () {
      overlay.style.display = "none";
    }, 300);
  }
}
window.closeAccountSelectionModal = closeAccountSelectionModal;

// Show account selection helper
function showAccountSelection(overlay, title, accounts, resolve) {
  var titleEl = document.getElementById("accountSelectionTitle");
  var listEl = document.getElementById("accountSelectionList");
  var cancelBtn = document.getElementById("cancelAccountSelection");

  if (titleEl) titleEl.textContent = title;
  if (listEl) {
    listEl.innerHTML = "";
    accounts.forEach(function (acc) {
      var accountBtn = document.createElement("button");
      accountBtn.type = "button";
      accountBtn.className =
        "w-full bg-atom-bg hover:bg-atom-primary/10 rounded-2xl p-4 mb-3 text-left transition-all border border-transparent hover:border-atom-primary/20";
      accountBtn.innerHTML = `
        <div class="flex justify-between items-center">
          <div>
            <div class="font-bold text-atom-text-black">${
              acc.accountName || "Account"
            }</div>
            <div class="text-sm text-atom-text-grey mt-1">${
              acc.accountNumber || ""
            }</div>
          </div>
          <div class="text-right">
            <div class="font-bold text-atom-text-black">${formatCurrency(
              acc.balance || 0,
              acc.currency
            )}</div>
            <div class="text-xs text-atom-text-grey mt-1">${
              acc.currency
            }</div>
          </div>
        </div>
      `;
      accountBtn.addEventListener("click", function () {
        closeAccountSelectionModal();
        resolve(acc._id);
      });
      listEl.appendChild(accountBtn);
    });
  }

  if (cancelBtn) {
    cancelBtn.onclick = function () {
      closeAccountSelectionModal();
      resolve(null);
    };
  }

  overlay.style.display = "flex";
  overlay.classList.add("active");
}

// Account Selection Modal Function
window.showAccountSelectionModal = function (title, accounts) {
  return new Promise((resolve) => {
    var overlay = document.getElementById("accountSelectionOverlay");
    if (!overlay) {
      setTimeout(function () {
        overlay = document.getElementById("accountSelectionOverlay");
        if (!overlay) {
          resolve(null);
          return;
        }
        showAccountSelection(overlay, title, accounts, resolve);
      }, 100);
      return;
    }
    showAccountSelection(overlay, title, accounts, resolve);
  });
};

// Pay single bill function
window.payBill = async function (billId) {
  const { accounts, bills } = window.billPaymentData;

  console.log("payBill called with billId:", billId);
  console.log("Available accounts:", accounts);
  console.log("Available bills:", bills);

  if (!accounts || accounts.length === 0) {
    showResultModal({
      type: 'warning',
      title: 'No Accounts',
      message: 'No accounts available. Please create an account first.'
    });
    return;
  }

  // Find the bill to get amount
  const bill = bills.find((b) => b._id === billId);
  if (!bill) {
    showResultModal({
      type: 'error',
      title: 'Bill Not Found',
      message: 'The requested bill could not be found.'
    });
    console.log(
      "Bill not found. Looking for:",
      billId,
      "in",
      bills.map((b) => b._id)
    );
    return;
  }

  // Show account selection if multiple accounts
  let accountId;
  if (accounts.length === 1) {
    accountId = accounts[0]._id;
  } else {
    accountId = await window.showAccountSelectionModal(
      `Select account to pay ${formatCurrency(bill.amount, "TRY")} for ${
        bill.title
      }`,
      accounts
    );
    if (!accountId) return; // Cancelled
  }

  // Check balance
  const selectedAccount = accounts.find((a) => a._id === accountId);
  if (selectedAccount.balance < bill.amount) {
    showResultModal({
      type: 'error',
      title: 'Insufficient Funds',
      message: 'Your account balance is not sufficient for this payment.',
      details: {
        'Bill Amount': formatCurrency(bill.amount, 'TRY'),
        'Available Balance': formatCurrency(selectedAccount.balance, selectedAccount.currency)
      }
    });
    return;
  }

  try {
    console.log("Sending payment request:", { billId, accountId });

    const res = await fetch(`/api/bills/${billId}/pay`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ accountId }),
    });

    const data = await res.json();
    console.log("Payment response:", data);

    if (!res.ok) {
      const errorMessage = data.message || "Failed to pay bill";

      if (res.status === 400) {
        if (errorMessage.toLowerCase().includes("insufficient")) {
          showResultModal({
            type: 'error',
            title: 'Insufficient Balance',
            message: 'Please select a different account or add funds.'
          });
        } else if (errorMessage.toLowerCase().includes("already paid")) {
          showResultModal({
            type: 'info',
            title: 'Already Paid',
            message: 'This bill has already been paid.'
          });
          removeBillFromUI(billId, bill.amount);
        } else {
          showResultModal({
            type: 'error',
            title: 'Payment Failed',
            message: errorMessage
          });
        }
      } else if (res.status === 404) {
        showResultModal({
          type: 'error',
          title: 'Not Found',
          message: 'Bill or account not found. Please refresh the page and try again.'
        });
      } else if (res.status === 403) {
        showResultModal({
          type: 'error',
          title: 'Account Blocked',
          message: 'Your account is blocked or inactive. Please contact support.'
        });
      } else {
        showResultModal({
          type: 'error',
          title: 'Payment Failed',
          message: errorMessage
        });
      }
      return;
    }

    const newBalance =
      data.data?.newBalance ??
      data.newBalance ??
      selectedAccount.balance - bill.amount;

    showResultModal({
      type: 'success',
      title: 'Bill Paid',
      message: `${bill.title || 'Bill'} has been paid successfully.`,
      details: {
        'Bill': bill.title || 'Bill Payment',
        'Amount': formatCurrency(bill.amount, 'TRY'),
        'New Balance': formatCurrency(newBalance, selectedAccount.currency)
      }
    });

    // Remove bill from DOM without page refresh
    removeBillFromUI(billId, bill.amount);

    // Update account balance in local data
    selectedAccount.balance = newBalance;
  } catch (err) {
    console.error("Error paying bill:", err);

    if (err.name === "TypeError" && err.message.includes("fetch")) {
      showResultModal({
        type: 'error',
        title: 'Network Error',
        message: 'Please check your connection and try again.'
      });
    } else {
      showResultModal({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while paying the bill. Please try again.'
      });
    }
  }
};

// Pay all bills function
window.payAllBills = async function () {
  const { accounts, bills, totalAmount } = window.billPaymentData;

  if (!accounts || accounts.length === 0) {
    showResultModal({
      type: 'warning',
      title: 'No Accounts',
      message: 'No accounts available. Please create an account first.'
    });
    return;
  }

  if (!bills || bills.length === 0) {
    showResultModal({
      type: 'info',
      title: 'No Bills',
      message: 'No bills to pay. You\'re all caught up!'
    });
    return;
  }

  let accountId;
  if (accounts.length === 1) {
    accountId = accounts[0]._id;
  } else {
    accountId = await window.showAccountSelectionModal(
      `Select account to pay all bills (${formatCurrency(totalAmount, "TRY")})`,
      accounts
    );
    if (!accountId) return;
  }

  const selectedAccount = accounts.find((a) => a._id === accountId);
  if (selectedAccount.balance < totalAmount) {
    showResultModal({
      type: 'error',
      title: 'Insufficient Funds',
      message: 'Your account balance is not sufficient to pay all bills.',
      details: {
        'Total Bills': formatCurrency(totalAmount, 'TRY'),
        'Available Balance': formatCurrency(selectedAccount.balance, selectedAccount.currency)
      }
    });
    return;
  }

  // Use custom confirmation - for now we'll proceed directly
  // In future, you could create a confirmation modal

  try {
    let paidCount = 0;
    let lastBalance = selectedAccount.balance;
    const paidBillIds = [];
    const billsToPay = [...bills];

    for (const bill of billsToPay) {
      const res = await fetch(`/api/bills/${bill._id}/pay`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ accountId }),
      });

      if (res.ok) {
        const data = await res.json();
        paidCount++;
        lastBalance = data.data?.newBalance || lastBalance - bill.amount;
        paidBillIds.push({ id: bill._id, amount: bill.amount });
      } else {
        const errorData = await res.json();
        console.error(`Failed to pay bill ${bill.title}:`, errorData.message);
      }
    }

    if (paidCount === 0) {
      showResultModal({
        type: 'error',
        title: 'Payment Failed',
        message: 'Failed to pay any bills. Please try again.'
      });
      return;
    }

    // Remove all paid bills from UI without page refresh
    paidBillIds.forEach(({ id, amount }) => {
      removeBillFromUI(id, amount);
    });

    selectedAccount.balance = lastBalance;

    showResultModal({
      type: 'success',
      title: 'Bills Paid',
      message: `${paidCount} of ${billsToPay.length} bills paid successfully.`,
      details: {
        'Bills Paid': `${paidCount} / ${billsToPay.length}`,
        'Total Amount': formatCurrency(totalAmount, 'TRY'),
        'New Balance': formatCurrency(lastBalance, selectedAccount.currency)
      }
    });
  } catch (err) {
    console.error("Error paying all bills:", err);
    showResultModal({
      type: 'error',
      title: 'Error',
      message: 'An error occurred while paying bills. Please try again.'
    });
  }
};

// ================== EVENT LISTENER (defined outside try block) ==================
// Use event delegation for PAY buttons - works for dynamically created elements
document.addEventListener("click", async function (e) {
  const payBtn = e.target.closest(".pay-bill-btn");
  if (payBtn) {
    e.preventDefault();
    e.stopPropagation();
    const billId = payBtn.dataset.billId;
    if (billId) {
      await window.payBill(billId);
    }
  }
});

// ================== DATA LOADING (inside IIFE) ==================
(async function loadBillPaymentsData() {
  // Wait for auth check to complete (with timeout)
  await new Promise((resolve) => {
    if (window.currentUser) {
      resolve();
    } else {
      window.addEventListener("userLoaded", function handler() {
        window.removeEventListener("userLoaded", handler);
        resolve();
      });
    }
  });

  try {
    // Fetch all bills (pending and overdue)
    const allBills = await fetchUserBills();
    console.log("All bills fetched:", allBills);

    // Filter to get unpaid bills (pending or overdue status, and not isPaid)
    const bills = allBills.filter(
      (b) => (b.status === "pending" || b.status === "overdue") && !b.isPaid
    );
    console.log("Filtered unpaid bills:", bills);

    // Store in global scope
    window.billPaymentData.bills = bills;

    // Update bill count
    const billCountEl = document.querySelector("h3");
    if (billCountEl && billCountEl.textContent.includes("Outstanding Bills")) {
      billCountEl.textContent = `Outstanding Bills (${bills.length})`;
    }

    // Calculate total amount
    const totalAmount = bills.reduce(
      (sum, bill) => sum + (bill.amount || 0),
      0
    );
    window.billPaymentData.totalAmount = totalAmount;

    // Get user accounts for payment selection
    const accounts = await fetchUserAccounts();
    window.billPaymentData.accounts = accounts;
    console.log("Accounts loaded:", accounts);

    // Update "Pay All" button
    const payAllBtn = document.querySelector(".btn-gradient");
    if (payAllBtn) {
      if (bills.length === 0) {
        payAllBtn.style.display = "none";
      } else {
        payAllBtn.innerHTML = `
          <span class="material-symbols-outlined text-lg">check_circle</span>
          Pay All (${formatCurrency(totalAmount, "TRY")})
        `;
        payAllBtn.onclick = () => window.payAllBills();
      }
    }

    // Update bills grid
    const billsGrid = document.querySelector(
      ".grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3"
    );

    console.log("Bills grid element found:", !!billsGrid);
    console.log("Number of bills to render:", bills.length);

    if (billsGrid) {
      billsGrid.innerHTML = ""; // Clear existing bills

      if (bills.length === 0) {
        billsGrid.innerHTML = `
          <div class="col-span-3 text-center py-12">
            <span class="material-symbols-outlined text-6xl text-atom-text-grey mb-4">check_circle</span>
            <p class="text-atom-text-grey text-lg">No outstanding bills. You're all caught up!</p>
          </div>
        `;
        return;
      }

      // Icon mapping for bill types
      const billIcons = {
        electricity: {
          icon: "bolt",
          bgColor: "#fff7ed",
          textColor: "#f97316",
          blurColor: "rgba(249,115,22,0.05)",
        },
        water: {
          icon: "water_drop",
          bgColor: "#eff6ff",
          textColor: "#3b82f6",
          blurColor: "rgba(59,130,246,0.05)",
        },
        internet: {
          icon: "wifi",
          bgColor: "#faf5ff",
          textColor: "#a855f7",
          blurColor: "rgba(168,85,247,0.05)",
        },
        phone: {
          icon: "phone",
          bgColor: "#f0fdf4",
          textColor: "#22c55e",
          blurColor: "rgba(34,197,94,0.05)",
        },
        tv: {
          icon: "tv",
          bgColor: "#f9fafb",
          textColor: "#6b7280",
          blurColor: "rgba(107,114,128,0.05)",
        },
        gas: {
          icon: "local_fire_department",
          bgColor: "#fef2f2",
          textColor: "#ef4444",
          blurColor: "rgba(239,68,68,0.05)",
        },
        mobile: {
          icon: "smartphone",
          bgColor: "#f0fdfa",
          textColor: "#14b8a6",
          blurColor: "rgba(20,184,166,0.05)",
        },
        rent: {
          icon: "real_estate_agent",
          bgColor: "#ecfdf5",
          textColor: "#10b981",
          blurColor: "rgba(16,185,129,0.05)",
        },
        "credit-card": {
          icon: "credit_card",
          bgColor: "#eef2ff",
          textColor: "#6366f1",
          blurColor: "rgba(99,102,241,0.05)",
        },
        streaming: {
          icon: "subscriptions",
          bgColor: "#fdf2f8",
          textColor: "#ec4899",
          blurColor: "rgba(236,72,153,0.05)",
        },
        tuition: {
          icon: "school",
          bgColor: "#fffbeb",
          textColor: "#f59e0b",
          blurColor: "rgba(245,158,11,0.05)",
        },
        insurance: {
          icon: "health_and_safety",
          bgColor: "#ecfeff",
          textColor: "#06b6d4",
          blurColor: "rgba(6,182,212,0.05)",
        },
        gym: {
          icon: "fitness_center",
          bgColor: "#f7fee7",
          textColor: "#84cc16",
          blurColor: "rgba(132,204,22,0.05)",
        },
        utilities: {
          icon: "home",
          bgColor: "#f8fafc",
          textColor: "#64748b",
          blurColor: "rgba(100,116,139,0.05)",
        },
        other: {
          icon: "receipt_long",
          bgColor: "#f9fafb",
          textColor: "#6b7280",
          blurColor: "rgba(107,114,128,0.05)",
        },
        default: {
          icon: "receipt_long",
          bgColor: "#f9fafb",
          textColor: "#6b7280",
          blurColor: "rgba(107,114,128,0.05)",
        },
      };

      bills.forEach((bill) => {
        const billCard = document.createElement("div");
        billCard.className =
          "bg-white p-8 rounded-[30px] border border-white shadow-soft hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden";
        billCard.dataset.billId = bill._id;

        const category = bill.category || "other";
        const iconConfig = billIcons[category] || billIcons.default;

        // Calculate days until due date
        const dueDate = new Date(bill.dueDate);
        const today = new Date();
        const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        let daysLeftText, daysLeftStyle;
        if (daysLeft < 0) {
          daysLeftText = `${Math.abs(daysLeft)} days overdue`;
          daysLeftStyle = "color: #ef4444;";
        } else if (daysLeft === 0) {
          daysLeftText = "Due today";
          daysLeftStyle = "color: #ef4444;";
        } else if (daysLeft <= 3) {
          daysLeftText = `${daysLeft} days left`;
          daysLeftStyle = "color: #f97316;";
        } else {
          daysLeftText = `${daysLeft} days left`;
          daysLeftStyle = "color: #22c55e;";
        }

        billCard.innerHTML = `
          <button class="pay-bill-btn absolute top-8 right-8 text-xs font-bold text-atom-primary bg-gray-50 px-3 py-1.5 rounded-lg hover:bg-atom-primary hover:text-white transition-colors z-20" data-bill-id="${
            bill._id
          }">
            PAY
          </button>

          <div class="flex flex-col gap-8 relative z-10">
            <div class="size-16 rounded-2xl flex items-center justify-center shadow-sm" style="background-color: ${
              iconConfig.bgColor
            }; color: ${iconConfig.textColor};">
              <span class="material-symbols-outlined text-3xl icon-fill">${
                iconConfig.icon
              }</span>
            </div>
            <div class="flex flex-col gap-1">
              <h4 class="text-xl font-bold text-atom-text-black">${
                bill.title || "Bill"
              }</h4>
              <p class="text-sm text-atom-text-grey">${
                bill.companyName || ""
              }</p>
              <span class="text-3xl font-bold text-atom-text-black">${formatCurrency(
                bill.amount || 0,
                "TRY"
              )}</span>
            </div>
            <div class="flex items-center gap-2 text-xs font-medium text-atom-text-dark-grey bg-gray-50 w-fit px-3 py-2 rounded-xl">
              <span class="material-symbols-outlined text-lg text-atom-text-grey">calendar_today</span>
              <span>Due: ${formatDate(bill.dueDate)}</span>
              <span class="font-bold ml-1" style="${daysLeftStyle}">• ${daysLeftText}</span>
            </div>
          </div>
          <div class="absolute bottom-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-10 -mb-10 pointer-events-none transition-colors" style="background-color: ${
            iconConfig.blurColor
          };"></div>
        `;

        billsGrid.appendChild(billCard);
      });

      // Debug: Log all PAY buttons after rendering
      const payButtons = document.querySelectorAll(".pay-bill-btn");
      console.log("PAY buttons found after rendering:", payButtons.length);
      payButtons.forEach((btn, i) => {
        console.log(`  Button ${i + 1}: billId = ${btn.dataset.billId}`);
      });
    }
  } catch (err) {
    console.error("Error loading bill payments data:", err);
  }
})();
