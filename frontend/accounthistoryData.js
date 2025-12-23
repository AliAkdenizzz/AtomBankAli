// ================== ACCOUNT HISTORY DATA LOADER ==================

// ================== PDF RECEIPT GENERATOR ==================
function generateTransactionReceipt(transaction, accountInfo) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Colors
  const primaryColor = [99, 102, 241]; // Indigo - atom-primary
  const textBlack = [2, 6, 23];
  const textGrey = [107, 114, 128];

  // Helper functions
  const formatReceiptDate = (date) => {
    return new Date(date).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatReceiptCurrency = (amount, currency) => {
    const symbols = { TRY: "₺", USD: "$", EUR: "€", GBP: "£" };
    const symbol = symbols[currency] || currency;
    return `${symbol}${Number(amount).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
    })}`;
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      deposit: "Deposit",
      withdraw: "Withdrawal",
      "transfer-in": "Incoming Transfer",
      "transfer-out": "Outgoing Transfer",
      "transfer-ext": "External Transfer",
      "bill-payment": "Bill Payment",
      "exchange-in": "Currency Exchange (In)",
      "exchange-out": "Currency Exchange (Out)",
      "goal-contrib": "Savings Goal Contribution",
    };
    return labels[type] || type;
  };

  // Page setup
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 50, "F");

  // Bank name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("ATOM BANK", pageWidth / 2, 25, { align: "center" });

  // Receipt title
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Transaction Receipt", pageWidth / 2, 38, { align: "center" });

  y = 65;

  // Reference number
  doc.setTextColor(...textGrey);
  doc.setFontSize(9);
  doc.text("Reference Number", 20, y);
  doc.setTextColor(...textBlack);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  const refNumber = transaction._id
    ? `TXN-${transaction._id.slice(-12).toUpperCase()}`
    : `TXN-${Date.now()}`;
  doc.text(refNumber, 20, y + 6);

  // Date
  doc.setTextColor(...textGrey);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Date & Time", pageWidth - 20, y, { align: "right" });
  doc.setTextColor(...textBlack);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(
    formatReceiptDate(transaction.createdAt || transaction.date || new Date()),
    pageWidth - 20,
    y + 6,
    { align: "right" }
  );

  y += 25;

  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(20, y, pageWidth - 20, y);

  y += 15;

  // Transaction Type
  doc.setTextColor(...textGrey);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Transaction Type", 20, y);
  doc.setTextColor(...textBlack);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(getTransactionTypeLabel(transaction.type), 20, y + 7);

  y += 22;

  // From Account
  doc.setTextColor(...textGrey);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("From Account", 20, y);
  doc.setTextColor(...textBlack);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(accountInfo.accountNumber || "N/A", 20, y + 7);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textGrey);
  doc.text(
    `${accountInfo.currency} Account - ${
      accountInfo.accountName || "My Account"
    }`,
    20,
    y + 14
  );

  y += 28;

  // To Account/Recipient (for transfers)
  if (transaction.toIBAN || transaction.recipientName) {
    doc.setTextColor(...textGrey);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Recipient", 20, y);
    doc.setTextColor(...textBlack);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(transaction.recipientName || "N/A", 20, y + 7);
    if (transaction.toIBAN) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textGrey);
      doc.text(transaction.toIBAN, 20, y + 14);
    }
    y += 28;
  }

  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.line(20, y, pageWidth - 20, y);

  y += 15;

  // Amount Box
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(20, y, pageWidth - 40, 35, 3, 3, "F");

  doc.setTextColor(...textGrey);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Amount", 30, y + 12);

  const isNegative = [
    "withdraw",
    "transfer-out",
    "transfer-ext",
    "bill-payment",
    "exchange-out",
    "goal-contrib",
  ].includes(transaction.type);
  doc.setTextColor(
    isNegative ? 239 : 34,
    isNegative ? 68 : 197,
    isNegative ? 68 : 94
  );
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  const amountText = `${isNegative ? "- " : "+ "}${formatReceiptCurrency(
    transaction.amount,
    transaction.currency || accountInfo.currency
  )}`;
  doc.text(amountText, pageWidth - 30, y + 24, { align: "right" });

  y += 50;

  // Description
  if (transaction.description) {
    doc.setTextColor(...textGrey);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Description", 20, y);
    doc.setTextColor(...textBlack);
    doc.setFontSize(10);
    doc.text(transaction.description, 20, y + 7);
    y += 20;
  }

  // Status
  doc.setTextColor(...textGrey);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Status", 20, y);
  doc.setTextColor(34, 197, 94); // Green for completed
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(
    "✓ " +
      (transaction.status === "completed"
        ? "Completed"
        : transaction.status || "Completed"),
    20,
    y + 7
  );

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 30;

  doc.setDrawColor(229, 231, 235);
  doc.line(20, footerY - 10, pageWidth - 20, footerY - 10);

  doc.setTextColor(...textGrey);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generated on ${formatReceiptDate(new Date())}`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );
  doc.text(
    "Atom Bank | Digital Banking Solutions",
    pageWidth / 2,
    footerY + 6,
    { align: "center" }
  );
  doc.text(
    "This is an electronically generated receipt.",
    pageWidth / 2,
    footerY + 12,
    { align: "center" }
  );

  // Download
  const fileName = `AtomBank_Receipt_${refNumber}_${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;
  doc.save(fileName);
}

// Make it globally available
window.generateTransactionReceipt = generateTransactionReceipt;

(async function loadAccountHistoryData() {
  // Wait for auth check to complete (with timeout)
  await new Promise((resolve) => {
    if (window.currentUser) {
      resolve();
    } else {
      // Listen for userLoaded event
      window.addEventListener("userLoaded", function handler() {
        window.removeEventListener("userLoaded", handler);
        resolve();
      });
    }
  });

  try {
    const accounts = await fetchUserAccounts();

    if (accounts.length === 0) {
      // No accounts - show empty state
      const accountsGrid = document.querySelector(".grid.grid-cols-1");
      if (accountsGrid) {
        accountsGrid.innerHTML =
          '<div class="col-span-2 text-center py-12"><p class="text-atom-text-grey">No accounts found. Please create an account first.</p></div>';
      }
      return;
    }

    // Update account cards with real data
    const accountsGrid = document.querySelector(
      ".grid.grid-cols-1.lg\\:grid-cols-2"
    );
    if (accountsGrid) {
      accountsGrid.innerHTML = ""; // Clear existing cards

      accounts.forEach((account) => {
        const card = document.createElement("div");
        card.className =
          "bg-white rounded-[30px] flex overflow-hidden shadow-soft border border-white h-72 relative group transition-all hover:-translate-y-1 hover:shadow-card-hover";

        // Use simpler color mapping to avoid Tailwind dynamic class issues
        let currencyColor = "purple";
        let currencyIcon = "account_balance_wallet";
        if (account.currency === "EUR") {
          currencyColor = "emerald";
          currencyIcon = "euro_symbol";
        } else if (account.currency === "USD") {
          currencyColor = "blue";
          currencyIcon = "attach_money";
        }

        card.innerHTML = `
          <div class="flex-1 p-8 flex flex-col justify-between relative z-10">
            <div class="flex items-start justify-between">
              <div class="bg-${currencyColor}-50 p-3 rounded-2xl border border-${currencyColor}-100 shadow-sm">
                <span class="material-symbols-outlined text-${currencyColor}-600">${currencyIcon}</span>
              </div>
              <span class="text-xs font-bold text-${currencyColor}-600 uppercase tracking-wider bg-${currencyColor}-50 px-3 py-1 rounded-full">${
          account.currency
        } Account</span>
            </div>
            <div class="flex flex-col gap-4">
              <div>
                <span class="text-4xl font-semibold text-atom-text-black tracking-tight">${formatCurrency(
                  account.balance || 0,
                  account.currency
                )}</span>
                <div class="flex items-center gap-2 mt-2">
                  <span class="text-[10px] text-atom-text-grey font-bold uppercase tracking-widest">${
                    account.accountName || "Account"
                  }</span>
                </div>
              </div>
              <div class="flex justify-between items-end border-t border-gray-50 pt-4">
                <div class="flex flex-col gap-1">
                  <span class="text-[10px] text-atom-text-grey font-bold uppercase tracking-widest">Account Details</span>
                  <span class="text-sm text-atom-text-dark-grey font-mono tracking-wide">${
                    account.accountNumber || "N/A"
                  }</span>
                </div>
              </div>
            </div>
          </div>
          <button data-account-id="${account._id}" data-currency="${
          account.currency
        }" class="history-btn w-16 bg-gray-50/80 backdrop-blur-sm border-l border-white flex flex-col items-center justify-center gap-4 text-atom-text-grey hover:text-${currencyColor}-600 hover:bg-${currencyColor}-50 transition-all cursor-pointer group-hover:w-20 duration-300">
            <span class="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">history</span>
            <span class="vertical-text text-[10px] font-bold tracking-widest uppercase rotate-180">History</span>
          </button>
        `;

        // Add click handler
        const historyBtn = card.querySelector(".history-btn");
        if (historyBtn) {
          historyBtn.addEventListener("click", () => {
            openHistoryModal(account._id, account.currency);
          });
        }

        accountsGrid.appendChild(card);
      });
    }

    // Update modal function to use account ID instead of currency
    window.openHistoryModal = async function (accountId, currency) {
      const modal = document.getElementById("historyModal");
      const modalTitle = document.getElementById("modalTitle");
      const tableBody = document.getElementById("tableBody");

      if (!modal || !modalTitle || !tableBody) return;

      modalTitle.innerText = currency + " Account History";

      // Find the account info for PDF generation
      const currentAccount = accounts.find((acc) => acc._id === accountId) || {
        accountNumber: "N/A",
        accountName: "Account",
        currency: currency,
      };

      // Fetch transactions for this account
      const transactions = await fetchAccountTransactions(accountId);

      // Clear and populate table
      tableBody.innerHTML = "";

      if (transactions.length === 0) {
        tableBody.innerHTML =
          '<tr><td colspan="5" class="py-8 text-center text-atom-text-grey">No transactions found</td></tr>';
      } else {
        transactions.forEach((tx, index) => {
          const tr = document.createElement("tr");
          tr.className =
            "border-b border-gray-50 hover:bg-gray-50/50 transition-colors";

          const isNegative = [
            "withdraw",
            "transfer-out",
            "transfer-ext",
            "bill-payment",
            "exchange-out",
            "goal-contrib",
          ].includes(tx.type);
          const amountColor = isNegative
            ? "text-red-500"
            : "text-atom-secondary";
          const amountPrefix = isNegative ? "- " : "+ ";
          const statusBadge = `<span class="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-500 font-semibold">${
            tx.status === "completed" ? "Completed" : tx.status || "Completed"
          }</span>`;

          // Use createdAt if available, otherwise date
          const txDate = tx.createdAt || tx.date || new Date();

          // Format transaction descriptions
          let displayDescription = tx.description || tx.type;
          if (tx.type === "deposit") {
            displayDescription = tx.description || "Deposit";
          } else if (tx.type === "withdraw") {
            displayDescription = tx.description || "Withdrawal";
          }

          tr.innerHTML = `
            <td class="py-4 pl-2">${formatDate(txDate)}</td>
            <td class="py-4 font-semibold text-atom-text-black">${displayDescription}</td>
            <td class="py-4">${statusBadge}</td>
            <td class="py-4 text-right pr-6 font-mono font-bold ${amountColor}">${amountPrefix}${formatCurrency(
            tx.amount,
            tx.currency || "TRY"
          )}</td>
            <td class="py-4 text-center pl-4 pr-2">
              <button class="receipt-download-btn" data-tx-index="${index}" title="Download Receipt">
                <span class="material-symbols-outlined">download</span>
              </button>
            </td>
          `;

          // Add click handler for download button
          const downloadBtn = tr.querySelector(".receipt-download-btn");
          downloadBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            generateTransactionReceipt(tx, currentAccount);
          });

          tableBody.appendChild(tr);
        });
      }

      // Show Modal
      modal.classList.remove("modal-enter");
      modal.classList.add("modal-active");
    };

    window.closeHistoryModal = function () {
      const modal = document.getElementById("historyModal");
      if (modal) {
        modal.classList.remove("modal-active");
        modal.classList.add("modal-enter");
      }
    };

    // Create Account functionality - now handled by main.js overlay
    // The "Open New Account" button in accounthistory.html will use the global overlay
  } catch (err) {
    console.error("Error loading account history data:", err);
  }
})();
