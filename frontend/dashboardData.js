// ================== DASHBOARD DATA LOADER ==================
// Loads and displays user-specific data on dashboard page

(async function loadDashboardData() {
  // Wait for auth check to complete
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

  // Update user info in UI
  const user = window.currentUser || {};

  // Update welcome message
  const welcomeNameEl = document.getElementById("welcomeUserName");
  if (welcomeNameEl && user.firstName) {
    welcomeNameEl.textContent = user.firstName;
  }

  // Update sidebar profile name
  const profileNameEl = document.getElementById("profileName");
  if (profileNameEl && (user.firstName || user.lastName)) {
    profileNameEl.textContent =
      [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";
  }

  // Update sidebar profile occupation/role
  const profileOccupationEl = document.getElementById("profileOccupation");
  if (profileOccupationEl) {
    profileOccupationEl.textContent =
      user.role === "admin" ? "Administrator" : "Premium User";
  }

  try {
    // Fetch user accounts
    const accounts = await fetchUserAccounts();

    if (accounts.length === 0) {
      // No accounts yet - show default or empty state
      return;
    }

    // Get primary account (first account or first TRY account)
    const tryAccounts = accounts.filter((acc) => acc.currency === "TRY");
    const primaryAccount =
      tryAccounts.length > 0 ? tryAccounts[0] : accounts[0];

    if (!primaryAccount) {
      return;
    }

    // Update balance card with primary account
    const balanceEl = document.querySelector(".bank_balance_card .balance");
    if (balanceEl) {
      balanceEl.textContent = formatCurrency(
        primaryAccount.balance || 0,
        primaryAccount.currency
      );
    }

    // Update account number
    const accountNoEl = document.querySelector(
      ".bank_balance_card .account_no .no"
    );
    if (accountNoEl && primaryAccount.accountNumber) {
      // Format account number: 4567 8910 1121 3141
      const formatted =
        primaryAccount.accountNumber.match(/.{1,4}/g)?.join(" ") ||
        primaryAccount.accountNumber;
      accountNoEl.textContent = formatted;
    }

    // Fetch and display recent transactions
    const allTransactions = await fetchAllTransactions();
    const recentTransactions = allTransactions.slice(0, 10); // Last 10 transactions

    // Group transactions by date
    const transactionsByDate = {};
    recentTransactions.forEach((tx) => {
      // Use createdAt if available, otherwise use date
      const txDate = tx.createdAt || tx.date || new Date();
      const dateKey = formatTransactionDate(txDate);
      if (!transactionsByDate[dateKey]) {
        transactionsByDate[dateKey] = [];
      }
      transactionsByDate[dateKey].push(tx);
    });

    // Clear existing transaction list
    const transactionInfoContainer = document.querySelector(
      "main .transaction_info"
    );
    if (transactionInfoContainer && transactionInfoContainer.parentElement) {
      // Remove all existing transaction_info divs except the first one (we'll use it as template)
      const allTransactionInfos = document.querySelectorAll(
        "main .transaction_info"
      );
      allTransactionInfos.forEach((el, index) => {
        if (index > 0) el.remove();
      });
    }

    // Display transactions grouped by date
    const transactionsContainer = document.getElementById(
      "transactionsContainer"
    );
    const mainElement = document.querySelector("main");

    if (transactionsContainer) {
      // Remove existing transaction sections from container
      const existingSections =
        transactionsContainer.querySelectorAll(".transaction_info");
      existingSections.forEach((section) => section.remove());

      // If no transactions, show message
      if (Object.keys(transactionsByDate).length === 0) {
        const emptySection = document.createElement("div");
        emptySection.className = "transaction_info";
        emptySection.innerHTML =
          '<div class="transaction_date">No recent transactions</div>';
        transactionsContainer.appendChild(emptySection);
      }

      // Add new transaction sections to container
      Object.keys(transactionsByDate).forEach((dateKey) => {
        const section = document.createElement("div");
        section.className = "transaction_info";

        const dateHeader = document.createElement("div");
        dateHeader.className = "transaction_date";
        dateHeader.textContent = dateKey;
        section.appendChild(dateHeader);

        transactionsByDate[dateKey].forEach((tx) => {
          const txDiv = document.createElement("div");
          txDiv.className = "transaction_data";

          const isNegative = [
            "withdraw",
            "transfer-out",
            "transfer-ext",
            "bill-payment",
            "exchange-out",
            "goal-contrib",
          ].includes(tx.type);

          // Deposit should be positive (green), withdraw negative (red)
          const iconColor = isNegative ? "rgba(255,0,0,1)" : "#24cca7";
          const iconPath = isNegative
            ? "M5 11h14v2H5z" // Minus icon
            : "M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"; // Plus icon

          // Format transaction descriptions
          let displayDescription = tx.description || tx.type;
          if (tx.type === "deposit") {
            displayDescription = tx.description || "Deposit";
          } else if (tx.type === "withdraw") {
            displayDescription = tx.description || "Withdrawal";
          }

          txDiv.innerHTML = `
              <div class="get_send_money">
                <span class="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="none" d="M0 0h24v24H0z" />
                    <path d="${iconPath}" fill="${iconColor}" />
                  </svg>
                </span>
                <div class="trasaction_details">
                  <p class="transaction_metadata">${displayDescription}</p>
                  <p>${tx.accountName || ""}</p>
                </div>
              </div>
              <p class="transaction_value">${formatCurrency(
                Math.abs(tx.amount),
                tx.currency || "TRY"
              )}</p>
            `;

          section.appendChild(txDiv);
        });

        transactionsContainer.appendChild(section);
      });
    }

    // Update account swiper with user accounts
    const swiperWrapper = document.querySelector(".swiper-wrapper");
    if (swiperWrapper && accounts.length > 0) {
      swiperWrapper.innerHTML = ""; // Clear existing slides

      accounts.forEach((account) => {
        const slide = document.createElement("div");
        slide.className = "swiper-slide";

        // Create account card similar to balance card style
        const card = document.createElement("div");
        card.className = "bank_balance_card";
        card.style.cssText =
          "min-height: 200px; display: flex; flex-direction: column; justify-content: space-between; padding: 1.5rem;";

        const formattedBalance = formatCurrency(
          account.balance || 0,
          account.currency
        );
        const formattedAccountNo =
          account.accountNumber.match(/.{1,4}/g)?.join(" ") ||
          account.accountNumber;

        card.innerHTML = `
            <p style="font-size: 0.9rem; color: rgba(255,255,255,0.7); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em;">${
              account.accountName || "Account"
            }</p>
            <p class="balance" style="font-size: 2.5rem; font-weight: 700; margin: 10px 0;">${formattedBalance}</p>
            <div class="account_no" style="margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
              <span style="flex: 1;">Account No : <span class="no">${formattedAccountNo}</span></span>
              <button class="view_account_no swiper-card-eye-btn" data-account-no="${formattedAccountNo}" aria-label="show_ac" style="flex-shrink: 0; background: transparent; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center;">
                <span class="material-symbols-outlined" style="font-size: 18px; color: rgba(255,255,255,0.8);">visibility</span>
              </button>
            </div>
          `;

        slide.appendChild(card);
        swiperWrapper.appendChild(slide);
      });

      // Reinitialize Swiper with accounts
      if (typeof Swiper !== "undefined") {
        // Destroy existing swiper if any
        if (window.accountSwiper) {
          window.accountSwiper.destroy(true, true);
        }

        // Use requestAnimationFrame for immediate update without delay
        requestAnimationFrame(() => {
          window.accountSwiper = new Swiper(".mySwiper", {
            effect: "cards",
            grabCursor: true,
            touchRatio: 1.5, // More sensitive touch
            touchAngle: 45, // Allow diagonal swipes
            threshold: 10, // Lower threshold for easier swipe
            resistance: true,
            resistanceRatio: 0.5, // Less resistance at edges
            speed: 300, // Faster transition
            navigation: {
              nextEl: ".swipe_next",
              prevEl: ".swipe_previous",
            },
            pagination: {
              el: ".swiper-page",
              clickable: true,
            },
          });

          // Update balance card when swiper changes (immediate, no delay)
          window.accountSwiper.on("slideChange", function () {
            const activeIndex = window.accountSwiper.activeIndex;
            const activeAccount = accounts[activeIndex];

            if (activeAccount) {
              // Update main balance card
              const balanceEl = document.querySelector(
                ".bank_balance_card .balance"
              );
              if (balanceEl) {
                balanceEl.textContent = formatCurrency(
                  activeAccount.balance || 0,
                  activeAccount.currency
                );
              }

              const accountNoEl = document.querySelector(
                ".bank_balance_card .account_no .no"
              );
              if (accountNoEl) {
                const formatted =
                  activeAccount.accountNumber.match(/.{1,4}/g)?.join(" ") ||
                  activeAccount.accountNumber;
                // Preserve visibility state
                const wasHidden =
                  accountNoEl.textContent === "**** **** **** ****";
                accountNoEl.textContent = formatted;
                if (wasHidden) {
                  accountNoEl.textContent = "**** **** **** ****";
                }
              }
            }
          });

          // Add eye icon handlers for swiper cards (immediate)
          requestAnimationFrame(() => {
            const swiperEyeBtns = document.querySelectorAll(
              ".swiper-card-eye-btn"
            );
            swiperEyeBtns.forEach((btn) => {
              btn.addEventListener("click", function (e) {
                e.stopPropagation(); // Prevent swiper swipe
                const accountNoSpan = btn
                  .closest(".account_no")
                  .querySelector(".no");
                const isVisible =
                  accountNoSpan.textContent !== "**** **** **** ****";
                const originalNo = btn.dataset.accountNo;

                if (isVisible) {
                  // Hide account number - show closed eye
                  accountNoSpan.textContent = "**** **** **** ****";
                  btn.innerHTML =
                    '<span class="material-symbols-outlined" style="font-size: 18px; color: rgba(255,255,255,0.8);">visibility_off</span>';
                } else {
                  // Show account number - show open eye
                  accountNoSpan.textContent = originalNo;
                  btn.innerHTML =
                    '<span class="material-symbols-outlined" style="font-size: 18px; color: rgba(255,255,255,0.8);">visibility</span>';
                }
              });
            });
          });
        });
      }
    }
  } catch (err) {
    console.error("Error loading dashboard data:", err);
  }
})();
