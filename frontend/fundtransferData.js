// Get API base URL
function getApiBaseUrl() { return window.API_BASE_URL || ""; }

// ================== FUND TRANSFER DATA LOADER ==================

// Store verified recipient info from IBAN lookup
window.verifiedRecipient = null;
let ibanVerifyTimeout = null;

// Verify IBAN and get real recipient name
async function verifyIbanAndGetRecipient(iban) {
  if (!iban || iban.length < 10) {
    window.verifiedRecipient = null;
    updateRecipientStatus(null);
    return null;
  }

  try {
    const token = localStorage.getItem("atomBankToken") || sessionStorage.getItem("atomBankToken");
    const res = await fetch(getApiBaseUrl() + "/api/transactions/verify-iban", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? "Bearer " + token : "",
      },
      body: JSON.stringify({ iban }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        window.verifiedRecipient = {
          fullName: data.data.fullName,
          isAtomBank: data.data.isAtomBank,
          currency: data.data.currency,
        };
        updateRecipientStatus(window.verifiedRecipient);
        return window.verifiedRecipient;
      }
    }
  } catch (err) {
    console.error("IBAN verification error:", err);
  }

  window.verifiedRecipient = null;
  updateRecipientStatus(null);
  return null;
}

// Update UI to show verified recipient status
function updateRecipientStatus(recipient) {
  // Find or create status element
  let statusEl = document.getElementById("recipientVerifyStatus");
  const nameInput = document.getElementById("inputName");

  if (!nameInput) return;

  if (!statusEl) {
    statusEl = document.createElement("div");
    statusEl.id = "recipientVerifyStatus";
    statusEl.className = "mt-2 text-sm flex items-center gap-2";
    nameInput.parentElement.appendChild(statusEl);
  }

  if (recipient) {
    const bankBadge = recipient.isAtomBank
      ? '<span class="bg-atom-primary/20 text-atom-primary px-2 py-0.5 rounded-full text-xs font-bold">Atom Bank</span>'
      : '<span class="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">External</span>';

    statusEl.innerHTML = `
      <span class="material-symbols-outlined text-green-500 text-base">verified</span>
      <span class="text-green-600 font-medium">Verified:</span>
      <span class="text-atom-text-black font-semibold">${recipient.fullName}</span>
      ${bankBadge}
    `;
    statusEl.style.display = "flex";

    // Auto-fill the name field with verified name
    if (nameInput) {
      nameInput.value = recipient.fullName;
      nameInput.readOnly = true;
      nameInput.classList.add("bg-green-50", "border-green-200");
    }
  } else {
    statusEl.style.display = "none";
    if (nameInput) {
      nameInput.readOnly = false;
      nameInput.classList.remove("bg-green-50", "border-green-200");
    }
  }
}

(async function loadFundTransferData() {
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
    const accounts = await fetchUserAccounts();

    if (accounts.length === 0) {
      // No accounts - show message
      const form = document.querySelector("form");
      if (form) {
        form.innerHTML =
          '<div class="text-center py-12"><p class="text-atom-text-grey">No accounts available. Please create an account first.</p></div>';
      }
      return;
    }

    // Populate "From Account" dropdown (Source Account select)
    // Find the first select that's not in formSaved (same approach as currency exchange)
    const allSelects = document.querySelectorAll("select");
    let fromAccountSelect = null;
    for (const select of allSelects) {
      if (!select.closest("#formSaved")) {
        fromAccountSelect = select;
        break;
      }
    }

    if (fromAccountSelect) {
      fromAccountSelect.innerHTML = "";
      accounts.forEach((account) => {
        const option = document.createElement("option");
        option.value = account._id;
        const formattedAccountNo =
          account.accountNumber.match(/.{1,4}/g)?.join(" ") ||
          account.accountNumber;
        option.textContent = `${
          account.accountName
        } - ${formattedAccountNo.substring(0, 4)}...${formattedAccountNo.slice(
          -4
        )} - ${account.currency}`;
        option.dataset.balance = account.balance;
        option.dataset.currency = account.currency;
        option.dataset.iban = account.iban || "";
        fromAccountSelect.appendChild(option);
      });

      // Update balance when account changes
      fromAccountSelect.addEventListener("change", (e) => {
        const selectedOption =
          fromAccountSelect.options[fromAccountSelect.selectedIndex];
        const balance = parseFloat(selectedOption.dataset.balance) || 0;
        const currency = selectedOption.dataset.currency || "TRY";
        const balanceEl = document.getElementById("availBalance");
        if (balanceEl) {
          balanceEl.textContent = formatCurrency(balance, currency);
        }

        // Update currency display
        const currencyDisplay = document.getElementById("currencyDisplay");
        if (currencyDisplay) {
          currencyDisplay.textContent = currency;
        }

        // Update IBAN display
        const ibanEl = document.getElementById("displayIban");
        if (ibanEl && selectedOption.dataset.iban) {
          const iban = selectedOption.dataset.iban;
          const formattedIban = iban.match(/.{1,4}/g)?.join(" ") || iban;
          ibanEl.textContent =
            formattedIban.length > 20
              ? formattedIban.substring(0, 20) + "..."
              : formattedIban;
          ibanEl.dataset.fullIban = iban;
        } else if (ibanEl) {
          ibanEl.textContent = "-";
        }

        // Re-validate form when account changes
        if (typeof validateForm === "function") {
          validateForm();
        }
      });

      // Set initial balance and currency
      if (accounts.length > 0) {
        const firstAccount = accounts[0];
        const balanceEl = document.getElementById("availBalance");
        if (balanceEl) {
          balanceEl.textContent = formatCurrency(
            firstAccount.balance || 0,
            firstAccount.currency
          );
        }
        const currencyDisplay = document.getElementById("currencyDisplay");
        if (currencyDisplay) {
          currencyDisplay.textContent = firstAccount.currency || "TRY";
        }
      }
    }

    // Fetch and populate saved recipients
    const savedSelect = document
      .getElementById("formSaved")
      ?.querySelector("select");
    if (savedSelect) {
      try {
        const token = getAuthToken();
        const res = await fetch(getApiBaseUrl() + "/api/user/recipients/list", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? "Bearer " + token : "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          const recipients = data.data || data.recipients || [];

          savedSelect.innerHTML = "";
          if (recipients.length === 0) {
            const option = document.createElement("option");
            option.textContent = "No saved recipients";
            option.disabled = true;
            savedSelect.appendChild(option);
          } else {
            recipients.forEach((recipient) => {
              const option = document.createElement("option");
              option.value = recipient._id;
              const formattedIban =
                recipient.iban.match(/.{1,4}/g)?.join(" ") || recipient.iban;
              const displayIban =
                formattedIban.length > 20
                  ? formattedIban.substring(0, 20) + "..."
                  : formattedIban;
              const currency = recipient.currency || "TRY";
              option.textContent = `${recipient.name} (${displayIban}) [${currency}]`;
              option.dataset.iban = recipient.iban;
              option.dataset.name = recipient.name;
              option.dataset.currency = currency;
              savedSelect.appendChild(option);
            });
          }
        }
      } catch (err) {
        console.error("Error fetching saved recipients:", err);
      }
    }

    // Handle saved recipient selection
    if (savedSelect) {
      savedSelect.addEventListener("change", (e) => {
        const selectedOption = savedSelect.options[savedSelect.selectedIndex];
        if (selectedOption.value && selectedOption.dataset.iban) {
          // Auto-fill IBAN and name fields when saved recipient is selected
          const ibanInput = document.getElementById("inputIban");
          const nameInput = document.getElementById("inputName");
          if (ibanInput) ibanInput.value = selectedOption.dataset.iban;
          if (nameInput) nameInput.value = selectedOption.dataset.name || "";
          if (typeof validateForm === "function") {
            validateForm();
          }
        }
      });
    }

    // Handle adding new recipient to saved list
    const ibanInput = document.getElementById("inputIban");
    if (ibanInput && ibanInput.parentElement) {
      // Check if save button already exists
      let addRecipientBtn = document.getElementById("addRecipientBtn");
      if (!addRecipientBtn) {
        addRecipientBtn = document.createElement("button");
        addRecipientBtn.type = "button";
        addRecipientBtn.id = "addRecipientBtn";
        addRecipientBtn.className =
          "absolute right-3 top-1/2 -translate-y-1/2 bg-atom-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1 hover:bg-atom-secondary";
        addRecipientBtn.innerHTML =
          '<span class="material-symbols-outlined text-sm">bookmark_add</span> Save';
        ibanInput.parentElement.appendChild(addRecipientBtn);
      }

      addRecipientBtn.onclick = async () => {
        const iban = ibanInput.value.trim();
        const name = document.getElementById("inputName")?.value.trim();

        if (!iban || !name) {
          showResultModal({
            type: 'warning',
            title: 'Missing Information',
            message: 'Please enter both IBAN and recipient name to save.'
          });
          return;
        }

        // Get selected account's currency for the recipient
        const allSelects = document.querySelectorAll("select");
        let fromAccountSelect = null;
        for (const select of allSelects) {
          if (!select.closest("#formSaved")) {
            fromAccountSelect = select;
            break;
          }
        }
        const selectedOption = fromAccountSelect?.options[fromAccountSelect?.selectedIndex];
        const currency = selectedOption?.dataset.currency || "TRY";

        try {
          const token = getAuthToken();
          const res = await fetch(getApiBaseUrl() + "/api/user/recipients/add", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? "Bearer " + token : "",
            },
            body: JSON.stringify({ name, iban, currency }),
          });

          if (res.ok) {
            showResultModal({
              type: 'success',
              title: 'Recipient Saved',
              message: 'Recipient has been saved successfully!',
              onClose: () => location.reload()
            });
          } else {
            const data = await res.json();
            showResultModal({
              type: 'error',
              title: 'Save Failed',
              message: data.message || 'Failed to save recipient.'
            });
          }
        } catch (err) {
          console.error("Error saving recipient:", err);
          showResultModal({
            type: 'error',
            title: 'Error',
            message: 'An error occurred while saving recipient.'
          });
        }
      };
    }

    // Handle paste button
    const pasteBtn = document.getElementById("pasteBtn");
    if (pasteBtn) {
      pasteBtn.addEventListener("click", async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (ibanInput) {
            ibanInput.value = text.trim();
            if (typeof validateForm === "function") {
              validateForm();
            }
          }
        } catch (err) {
          console.error("Error pasting:", err);
          showResultModal({
            type: 'error',
            title: 'Paste Failed',
            message: 'Failed to paste from clipboard.'
          });
        }
      });
    }

    // Validation function
    function validateForm() {
      const inputIban = document.getElementById("inputIban");
      const inputName = document.getElementById("inputName");
      const inputAmount = document.getElementById("inputAmount");
      // Try to get the button from window.transferBtn first (cloned button), then fall back to getElementById
      const btnTransfer =
        window.transferBtn || document.getElementById("btnTransfer");

      if (!btnTransfer) {
        console.log("Transfer button not found");
        return;
      }

      const amount = parseFloat(inputAmount?.value) || 0;
      let isValid = false;

      if (amount > 0) {
        const activeMode = window.activeMode || "new";
        if (activeMode === "new") {
          // Require IBAN verification + verified name
          if (
            inputIban &&
            inputIban.value.length > 5 &&
            window.verifiedRecipient &&
            window.verifiedRecipient.fullName
          ) {
            isValid = true;
          }
        } else {
          // Saved recipient mode
          if (savedSelect) {
            const selectedRecipient =
              savedSelect.options[savedSelect.selectedIndex];
            if (
              selectedRecipient &&
              selectedRecipient.value &&
              !selectedRecipient.disabled
            ) {
              isValid = true;
            }
          }
        }
      }

      if (isValid) {
        btnTransfer.disabled = false;
        btnTransfer.classList.remove(
          "bg-gray-200",
          "text-gray-400",
          "cursor-not-allowed",
          "shadow-none"
        );
        btnTransfer.classList.add(
          "btn-gradient",
          "shadow-glow",
          "hover:scale-[1.01]"
        );
        btnTransfer.style.cursor = "pointer";
      } else {
        btnTransfer.disabled = true;
        btnTransfer.classList.add(
          "bg-gray-200",
          "text-gray-400",
          "cursor-not-allowed",
          "shadow-none"
        );
        btnTransfer.classList.remove(
          "btn-gradient",
          "shadow-glow",
          "hover:scale-[1.01]"
        );
        btnTransfer.style.cursor = "not-allowed";
      }
    }

    // Make validateForm globally accessible
    window.validateForm = validateForm;

    // Add event listeners for validation
    const inputIban = document.getElementById("inputIban");
    const inputName = document.getElementById("inputName");
    const inputAmount = document.getElementById("inputAmount");

    if (inputIban) {
      inputIban.addEventListener("input", validateForm);

      // Add IBAN verification on input (debounced)
      inputIban.addEventListener("input", (e) => {
        // Clear previous timeout
        if (ibanVerifyTimeout) {
          clearTimeout(ibanVerifyTimeout);
        }

        // Reset verification status while typing
        window.verifiedRecipient = null;
        const statusEl = document.getElementById("recipientVerifyStatus");
        if (statusEl) {
          statusEl.innerHTML = '<span class="text-atom-text-grey text-xs">Verifying IBAN...</span>';
          statusEl.style.display = "block";
        }

        // Debounce - wait 800ms after user stops typing
        ibanVerifyTimeout = setTimeout(async () => {
          const iban = e.target.value.trim().replace(/\s/g, "");
          if (iban.length >= 15) {
            await verifyIbanAndGetRecipient(iban);
            validateForm();
          } else {
            updateRecipientStatus(null);
          }
        }, 800);
      });
    }
    if (inputName) {
      inputName.addEventListener("input", validateForm);
    }
    if (inputAmount) {
      inputAmount.addEventListener("input", validateForm);
    }
    if (savedSelect) {
      savedSelect.addEventListener("change", validateForm);
    }

    // Handle transfer button click
    const btnTransfer = document.getElementById("btnTransfer");
    if (btnTransfer) {
      // Remove any existing event listeners by cloning
      const newBtn = btnTransfer.cloneNode(true);
      btnTransfer.parentNode.replaceChild(newBtn, btnTransfer);

      newBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Check if button is disabled
        if (newBtn.disabled) {
          console.log("Button is disabled, validation may have failed");
          return;
        }

        // Get activeMode from window (set by inline script)
        const activeMode = window.activeMode || "new";

        // Find the from account select (first select that's not in formSaved)
        const allSelects = document.querySelectorAll("select");
        let fromAccountSelect = null;
        for (const select of allSelects) {
          if (!select.closest("#formSaved")) {
            fromAccountSelect = select;
            break;
          }
        }

        const fromAccountId = fromAccountSelect?.value;
        const inputAmountEl = document.getElementById("inputAmount");
        const amount = parseFloat(inputAmountEl?.value);
        const inputIbanEl = document.getElementById("inputIban");
        const inputNameEl = document.getElementById("inputName");
        const iban = inputIbanEl?.value.trim();
        const recipientName = inputNameEl?.value.trim();

        if (!fromAccountId || !amount || amount <= 0) {
          showResultModal({
            type: 'warning',
            title: 'Missing Information',
            message: 'Please fill in all required fields.'
          });
          return;
        }

        // Get saved select reference
        const savedSelectEl = document
          .getElementById("formSaved")
          ?.querySelector("select");

        if (activeMode === "new") {
          if (!iban || !recipientName) {
            showResultModal({
              type: 'warning',
              title: 'Missing Information',
              message: 'Please enter IBAN and recipient name.'
            });
            return;
          }
        } else {
          // Saved recipient mode
          const selectedRecipient =
            savedSelectEl?.options[savedSelectEl.selectedIndex];
          if (
            !selectedRecipient ||
            !selectedRecipient.value ||
            selectedRecipient.disabled
          ) {
            showResultModal({
              type: 'warning',
              title: 'No Recipient Selected',
              message: 'Please select a saved recipient.'
            });
            return;
          }
        }

        // Get saved recipient data if in saved mode
        let finalIban = iban;
        let finalRecipientName = recipientName;
        let recipientCurrency = null;

        if (activeMode === "saved" && savedSelectEl) {
          const selectedRecipient =
            savedSelectEl.options[savedSelectEl.selectedIndex];
          if (selectedRecipient) {
            finalIban = selectedRecipient.dataset.iban || iban;
            finalRecipientName =
              selectedRecipient.dataset.name || recipientName;
            recipientCurrency = selectedRecipient.dataset.currency || null;
          }
        }

        // Get source account currency
        const selectedFromOption =
          fromAccountSelect.options[fromAccountSelect.selectedIndex];
        const sourceAccountCurrency = selectedFromOption?.dataset.currency || "TRY";

        // Check currency match for saved recipients
        if (recipientCurrency && recipientCurrency !== sourceAccountCurrency) {
          showResultModal({
            type: 'error',
            title: 'Currency Mismatch',
            message: 'Cannot transfer between different currencies.',
            details: {
              'Source Account': sourceAccountCurrency,
              'Recipient Account': recipientCurrency
            }
          });
          return;
        }

        // NAME VERIFICATION - Only for new recipients (not saved)
        if (activeMode === "new") {
          // Use the VERIFIED recipient name from IBAN lookup, not user-entered name
          const verifiedName = window.verifiedRecipient?.fullName;

          if (!verifiedName) {
            showResultModal({
              type: 'warning',
              title: 'IBAN Not Verified',
              message: 'Please wait for IBAN verification to complete before transferring.'
            });
            return;
          }

          // Use the verified name for verification modal
          const verified = await showNameVerification({
            recipientName: verifiedName,
            amount: formatCurrency(amount, sourceAccountCurrency),
            iban: finalIban
          });

          if (!verified) {
            return; // User cancelled or verification failed
          }

          // Use verified name for the actual transfer
          finalRecipientName = verifiedName;
        }

        // Show loading state
        const originalText = newBtn.innerHTML;
        newBtn.innerHTML =
          '<span class="material-symbols-outlined animate-spin">sync</span> Processing...';
        newBtn.disabled = true;

        try {
          const token = getAuthToken();
          const res = await fetch(getApiBaseUrl() + "/api/transactions/transfer-external", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? "Bearer " + token : "",
            },
            body: JSON.stringify({
              accountId: fromAccountId,
              toIBAN: finalIban,
              recipientName: finalRecipientName,
              amount,
              description: `Transfer to ${finalRecipientName}`,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            showResultModal({
              type: 'error',
              title: 'Transfer Failed',
              message: data.message || 'Transfer could not be completed.'
            });
            newBtn.innerHTML = originalText;
            newBtn.disabled = false;
            return;
          }

          // Calculate new balance
          const currentBalance = parseFloat(selectedFromOption?.dataset.balance) || 0;
          const newBalance = currentBalance - amount;

          // Check if "Save this payee" toggle is checked (only for new recipients)
          const savePayeeToggle = document.getElementById('savePayeeToggle');
          if (activeMode === 'new' && savePayeeToggle && savePayeeToggle.checked && finalIban && finalRecipientName) {
            // Save the recipient silently
            try {
              await fetch(getApiBaseUrl() + "/api/user/recipients/add", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: token ? "Bearer " + token : "",
                },
                body: JSON.stringify({
                  name: finalRecipientName,
                  iban: finalIban,
                  currency: sourceAccountCurrency
                }),
              });
            } catch (saveErr) {
              console.error("Error saving recipient:", saveErr);
              // Don't show error - transfer was still successful
            }
          }

          showResultModal({
            type: 'success',
            title: 'Transfer Successful',
            message: 'Your funds have been transferred successfully.',
            details: {
              'Amount': formatCurrency(amount, sourceAccountCurrency),
              'Recipient': finalRecipientName,
              'New Balance': formatCurrency(newBalance, sourceAccountCurrency)
            },
            onClose: () => location.reload()
          });
        } catch (err) {
          console.error("Transfer error:", err);
          showResultModal({
            type: 'error',
            title: 'Error',
            message: 'An error occurred during transfer. Please try again.'
          });
          newBtn.innerHTML = originalText;
          newBtn.disabled = false;
        }
      });

      // Update the reference for validateForm
      window.transferBtn = newBtn;
    }

    function getAuthToken() {
      return (
        localStorage.getItem("atomBankToken") ||
        sessionStorage.getItem("atomBankToken")
      );
    }
  } catch (err) {
    console.error("Error loading fund transfer data:", err);
  }
})();
