// ================== CURRENCY EXCHANGE DATA LOADER ==================
// Loads user accounts and exchange rates for the currency exchange page

(async function loadCurrencyExchangeData() {
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

  try {
    // Fetch user accounts
    const accounts = await fetchUserAccounts();
    console.log("Currency Exchange: Loaded", accounts.length, "accounts");

    // Store accounts globally for use in inline script
    window.userAccounts = accounts;

    if (accounts.length === 0) {
      // No accounts - show message
      const exchangeCard = document.querySelector(
        ".bg-white.rounded-\\[30px\\]"
      );
      if (exchangeCard) {
        exchangeCard.innerHTML = `
          <div class="text-center py-12">
            <span class="material-symbols-outlined text-6xl text-atom-text-grey mb-4">account_balance_wallet</span>
            <p class="text-atom-text-grey text-lg">No accounts available.</p>
            <p class="text-atom-text-grey">Please create an account first.</p>
          </div>
        `;
      }
      return;
    }

    // Populate account select dropdown
    const accountSelect = document.querySelector(
      "select:not(#toCurrencySelect)"
    );
    if (accountSelect) {
      accountSelect.innerHTML = "";

      accounts.forEach((account) => {
        const option = document.createElement("option");
        option.value = account._id;
        option.dataset.currency = account.currency;
        option.dataset.balance = account.balance || 0;

        // Format account number
        const formattedAccountNo =
          account.accountNumber?.match(/.{1,4}/g)?.join(" ") ||
          account.accountNumber ||
          "****";

        option.textContent = `${
          account.accountName || "Account"
        } - ${formattedAccountNo.substring(0, 9)}... (${account.currency})`;
        accountSelect.appendChild(option);
      });

      // Update balance display for first account
      const firstAccount = accounts[0];
      const balanceEl = document.getElementById("availBalance");
      if (balanceEl && firstAccount) {
        balanceEl.textContent = formatCurrency(
          firstAccount.balance || 0,
          firstAccount.currency
        );
      }

      // Update "From" currency display
      const labelFrom = document.getElementById("labelFrom");
      const iconFrom = document.getElementById("iconFrom");
      if (labelFrom && firstAccount) {
        labelFrom.textContent = firstAccount.currency;
      }
      if (iconFrom && firstAccount) {
        iconFrom.textContent = getCurrencyIcon(firstAccount.currency);
      }

      // Add change event listener
      accountSelect.addEventListener("change", function () {
        const selectedOption =
          accountSelect.options[accountSelect.selectedIndex];
        const balance = parseFloat(selectedOption.dataset.balance) || 0;
        const currency = selectedOption.dataset.currency || "TRY";

        // Update balance display
        if (balanceEl) {
          balanceEl.textContent = formatCurrency(balance, currency);
        }

        // Update "From" currency
        if (labelFrom) {
          labelFrom.textContent = currency;
        }
        if (iconFrom) {
          iconFrom.textContent = getCurrencyIcon(currency);
        }

        // Update unit labels
        const unitSell = document.getElementById("unitSell");
        if (unitSell) {
          unitSell.textContent = currency;
        }

        // Update UI if function exists
        if (typeof window.updateUI === "function") {
          window.updateUI();
        }

        // Fetch rates for this currency
        if (typeof window.fetchRatesForCurrency === "function") {
          window.fetchRatesForCurrency(currency);
        }
      });
    }

    // Fetch initial exchange rates
    const firstCurrency = accounts[0]?.currency || "TRY";
    await fetchExchangeRatesForPage(firstCurrency);

    // Update UI after data is loaded
    if (typeof window.updateUI === "function") {
      window.updateUI();
    }
  } catch (err) {
    console.error("Error loading currency exchange data:", err);
  }
})();

/**
 * Get currency icon for Material Symbols
 */
function getCurrencyIcon(currency) {
  const icons = {
    TRY: "currency_lira",
    USD: "attach_money",
    EUR: "euro",
    GBP: "currency_pound",
  };
  return icons[currency] || "payments";
}

/**
 * Fetch exchange rates and store globally
 */
async function fetchExchangeRatesForPage(baseCurrency) {
  try {
    const token = getAuthToken();
    const res = await fetch(
      `/api/exchange/rates?baseCurrency=${baseCurrency}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? "Bearer " + token : "",
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      // Store rates globally
      if (!window.exchangeRates) {
        window.exchangeRates = {};
      }
      // Handle both response formats: data.rates or data.data.rates
      window.exchangeRates[baseCurrency] =
        data.data?.rates || data.rates || data.data || {};
      console.log(
        `Rates for ${baseCurrency}:`,
        window.exchangeRates[baseCurrency]
      );

      // Update rate display
      const toCurrency =
        document.getElementById("toCurrencySelect")?.value || "USD";
      const rate = window.exchangeRates[baseCurrency]?.[toCurrency];
      const rateDisplay = document.getElementById("rateDisplay");

      if (rateDisplay && rate) {
        const inverseRate = 1 / rate;
        rateDisplay.textContent = `1 ${toCurrency} = ${inverseRate.toFixed(
          2
        )} ${baseCurrency}`;
      }
    }
  } catch (err) {
    console.error("Error fetching exchange rates:", err);
  }
}
