// Get API base URL
function getApiBaseUrl() { return window.API_BASE_URL || ""; }

// ================== AUTH GUARD + USER INFO ==================
async function checkAuthAndLoadUser() {
  var token =
    localStorage.getItem("atomBankToken") ||
    sessionStorage.getItem("atomBankToken");

  if (!token) {
    window.location.href = "/index.html";
    return;
  }

  try {
    var res = await fetch(getApiBaseUrl() + "/api/user/me", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    if (!res.ok) {
      throw new Error("Unauthorized");
    }

    var data = await res.json(); // { success, data: { id, name } }
    var name = data && data.data && data.data.name ? data.data.name : "User";

    // Overview'daki "Hi User" yazılarını güncelle
    var overviewDescs = document.querySelectorAll(".overview_text .desc");
    for (var i = 0; i < overviewDescs.length; i++) {
      if (typeof window.t !== "undefined") {
        overviewDescs[i].textContent = window.t("welcome", { name: name });
      } else {
        overviewDescs[i].textContent = "Hi " + name + ", welcome back!";
      }
    }

    // Sidebar profile name
    var profileNameEl = document.getElementById("profileName");
    if (profileNameEl) {
      profileNameEl.textContent = name;
    }

    // Sidebar profile image - update on all pages
    var sidebarProfileImg = document.getElementById("sidebarProfileImg");
    if (sidebarProfileImg && data.data.profile_image) {
      sidebarProfileImg.src =
        "/uploads/profile-images/" + data.data.profile_image;
    }

    // Store user data globally for use in other scripts
    window.currentUser = {
      id: data.data.id,
      name: name,
      token: token,
    };

    // Load user preferences (darkMode and language)
    if (data.data.preferences) {
      // Dark mode
      if (data.data.preferences.darkMode !== undefined) {
        var darkModeValue = data.data.preferences.darkMode === true;
        applyDarkMode(darkModeValue);
        localStorage.setItem(
          "atomBankDarkMode",
          darkModeValue ? "true" : "false"
        );
      }

      // Language
      if (data.data.preferences.language) {
        var userLanguage = data.data.preferences.language;
        applyLanguage(userLanguage);
        localStorage.setItem("atomBankLanguage", userLanguage);
      }
    }
  } catch (err) {
    console.error("Auth check failed:", err);
    localStorage.removeItem("atomBankToken");
    sessionStorage.removeItem("atomBankToken");
    window.location.href = "/index.html";
  }
}

checkAuthAndLoadUser();

// ================== DARK MODE & LANGUAGE ==================
// Apply dark mode to body
function applyDarkMode(enabled) {
  if (enabled) {
    document.body.classList.remove("light");
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
    document.body.classList.add("light");
  }
}

// Apply language preference
function applyLanguage(lang) {
  document.documentElement.setAttribute("lang", lang);
  // Update all elements with data-i18n attribute
  updateTranslations();
}

// Update all translations on the page
function updateTranslations() {
  if (typeof window.t === "undefined") {
    // Translations.js not loaded yet
    return;
  }

  // Update all elements with data-i18n attribute
  var elements = document.querySelectorAll("[data-i18n]");
  elements.forEach(function (element) {
    var key = element.getAttribute("data-i18n");
    if (key) {
      // Check if it's an input/button with value attribute
      if (element.tagName === "INPUT" || element.tagName === "BUTTON") {
        var valueAttr = element.getAttribute("data-i18n-value");
        if (valueAttr) {
          element.value = window.t(valueAttr);
        } else {
          element.textContent = window.t(key);
        }
      } else {
        element.textContent = window.t(key);
      }
    }
  });

  // Update placeholders
  var placeholderElements = document.querySelectorAll(
    "[data-i18n-placeholder]"
  );
  placeholderElements.forEach(function (element) {
    var key = element.getAttribute("data-i18n-placeholder");
    if (key) {
      element.placeholder = window.t(key);
    }
  });
}

// Load dark mode and language from localStorage on page load
document.addEventListener("DOMContentLoaded", function () {
  var savedDarkMode = localStorage.getItem("atomBankDarkMode") === "true";
  applyDarkMode(savedDarkMode);

  var savedLanguage = localStorage.getItem("atomBankLanguage") || "en";
  applyLanguage(savedLanguage);

  // Update translations after a short delay to ensure translations.js is loaded
  setTimeout(function () {
    updateTranslations();
  }, 100);
});

// ================== LOGOUT ==================
async function handleLogout() {
  var confirmMsg =
    typeof window.t !== "undefined"
      ? window.t("sureLogout")
      : "Are you sure you want to log out?";
  if (!confirm(confirmMsg)) {
    return;
  }

  var token =
    localStorage.getItem("atomBankToken") ||
    sessionStorage.getItem("atomBankToken");

  localStorage.removeItem("atomBankToken");
  sessionStorage.removeItem("atomBankToken");

  try {
    await fetch(getApiBaseUrl() + "/api/auth/logout", {
      method: "GET",
      headers: token ? { Authorization: "Bearer " + token } : {},
    });
  } catch (err) {
    console.warn("Logout request error:", err);
  }

  window.location.href = "/index.html";
}

// Attach logout handlers - works on all pages
document.addEventListener("DOMContentLoaded", function () {
  var logoutIcon = document.getElementById("logoutIcon");
  var navLogoutBtn = document.getElementById("navLogout");

  if (logoutIcon) {
    logoutIcon.addEventListener("click", handleLogout);
  }

  if (navLogoutBtn) {
    navLogoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      handleLogout();
    });
  }
});

// ================== SIDEBAR TOGGLE (MOBILE) ==================
var sidebar = document.getElementById("sidebar");
var menuBtn = document.getElementById("menu_btn");
var closeBtn = document.getElementById("btn_close");

if (menuBtn && sidebar) {
  menuBtn.addEventListener("click", function () {
    sidebar.classList.add("show_sidebar");
  });
}

if (closeBtn && sidebar) {
  closeBtn.addEventListener("click", function () {
    sidebar.classList.remove("show_sidebar");
  });
}

// ================== QUICK TRANSFER (DEMO HANDLER) ==================
function handleTransferSubmit(e) {
  e.preventDefault();
  alert("Quick transfer submitted (frontend demo).");
  return false;
}

// Swiper initialization (for placeholder cards or if dashboardData.js hasn't loaded yet)
document.addEventListener("DOMContentLoaded", function () {
  // Initialize Swiper if it exists and hasn't been initialized
  if (typeof Swiper !== "undefined" && !window.accountSwiper) {
    const swiperEl = document.querySelector(".mySwiper");
    if (swiperEl) {
      window.accountSwiper = new Swiper(".mySwiper", {
        effect: "cards",
        grabCursor: true,
        navigation: {
          nextEl: ".swipe_next",
          prevEl: ".swipe_previous",
        },
        pagination: {
          el: ".swiper-page",
          clickable: true,
        },
      });
    }
  }
});

// ================== COLLAPSIBLE TRANSACTIONS ==================
var toggleTransactionsBtn = document.getElementById("toggleTransactions");
var transactionsContainer = document.getElementById("transactionsContainer");

if (toggleTransactionsBtn && transactionsContainer) {
  var isExpanded = true;

  toggleTransactionsBtn.addEventListener("click", function () {
    isExpanded = !isExpanded;
    if (isExpanded) {
      transactionsContainer.classList.remove("collapsed");
    } else {
      transactionsContainer.classList.add("collapsed");
    }
  });
}

// ================== PROFILE MODAL ==================
// Create Profile Overlay dynamically
function createProfileOverlay() {
  // Check if overlay already exists
  if (document.getElementById("profileOverlay")) {
    return;
  }

  var overlayHTML = `
    <div class="profile-overlay" id="profileOverlay">
      <div class="profile-modal">
        <h3 data-i18n="editProfile">Edit Profile</h3>
        <form id="profileForm">
          <!-- Profile Image Upload -->
          <div class="form-group">
            <label data-i18n="profileImage">Profile Image</label>
            <div class="profile-image-upload">
              <div class="profile-image-circle">
                <img id="profileImagePreview" src="./images/profile.jpg" alt="Profile Preview">
                <div class="profile-image-overlay">
                  <span class="material-symbols-outlined">camera_alt</span>
                  <span class="upload-text" data-i18n="uploadImage">Upload</span>
                </div>
                <input type="file" id="profileImageInput" accept="image/jpeg,image/jpg,image/png">
              </div>
            </div>
          </div>

          <!-- Name Fields -->
          <div class="form-row">
            <div class="form-group">
              <label data-i18n="firstName">First Name</label>
              <input type="text" id="editFirstName" data-i18n-placeholder="firstName" placeholder="First Name">
            </div>
            <div class="form-group">
              <label data-i18n="lastName">Last Name</label>
              <input type="text" id="editLastName" data-i18n-placeholder="lastName" placeholder="Last Name">
            </div>
          </div>

          <!-- Contact Info -->
          <div class="form-group">
            <label data-i18n="phoneNumber">Phone Number</label>
            <input type="text" id="editPhone" placeholder="5551234567">
          </div>

          <!-- Address Section -->
          <div class="form-section">
            <div class="form-section-title" data-i18n="address">Address</div>
            <div class="form-group">
              <label data-i18n="street">Street</label>
              <input type="text" id="editStreet" placeholder="123 Main St">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label data-i18n="city">City</label>
                <input type="text" id="editCity" placeholder="Istanbul">
              </div>
              <div class="form-group">
                <label data-i18n="state">State</label>
                <input type="text" id="editState" placeholder="Marmara">
              </div>
            </div>
            <div class="form-group">
              <label data-i18n="postalCode">Postal Code</label>
              <input type="text" id="editZip" placeholder="34000">
            </div>
          </div>

          <!-- Preferences Section -->
          <div class="form-section">
            <div class="form-section-title" data-i18n="preferences">Preferences</div>
            <div class="checkbox-group">
              <input type="checkbox" id="prefNewsletter">
              <label for="prefNewsletter" data-i18n="subscribeNewsletter">Subscribe to Newsletter</label>
            </div>
            <div class="checkbox-group">
              <input type="checkbox" id="prefSms">
              <label for="prefSms" data-i18n="enableSms">Enable SMS Notifications</label>
            </div>
            <div class="checkbox-group">
              <input type="checkbox" id="prefDark">
              <label for="prefDark" data-i18n="useDarkMode">Use Dark Mode</label>
            </div>
            <div class="checkbox-group" style="flex-direction: column; align-items: flex-start; gap: 8px;">
              <label for="prefLanguage" style="margin-bottom: 0;" data-i18n="language">Language / Dil:</label>
              <select id="prefLanguage" style="width: 100%; padding: 10px 15px; border-radius: 10px; border: 1px solid #e2e8f0; font-family: var(--font-poppins); font-size: 14px; color: var(--text-black); background: #ffffff; outline: none; transition: 0.3s;">
                <option value="en">English</option>
                <option value="tr">Türkçe</option>
              </select>
            </div>
          </div>

          <!-- Password Change Trigger -->
          <button type="button" class="btn-change-pass" id="btnOpenPassword" data-i18n="changePassword">
            Change Password
          </button>

          <!-- Action Buttons -->
          <div class="modal-buttons">
            <button type="button" class="btn-cancel" id="cancelProfile" data-i18n="cancel">Cancel</button>
            <button type="submit" class="btn-save" data-i18n="saveChanges">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", overlayHTML);
}

// Create Password Overlay dynamically
function createPasswordOverlay() {
  // Check if overlay already exists
  if (document.getElementById("passwordOverlay")) {
    return;
  }

  var overlayHTML = `
    <div class="profile-overlay password-overlay" id="passwordOverlay">
      <div class="profile-modal" style="max-width: 400px;">
        <h3 data-i18n="changePasswordTitle">Change Password</h3>
        <form id="passwordForm">
          <div class="form-group">
            <label data-i18n="currentPassword">Current Password</label>
            <input type="password" id="currentPass" placeholder="••••••" required>
          </div>
          <div class="form-group">
            <label data-i18n="newPassword">New Password</label>
            <input type="password" id="newPass" placeholder="••••••" required>
          </div>
          <div class="form-group">
            <label data-i18n="confirmPassword">Confirm New Password</label>
            <input type="password" id="confirmPass" placeholder="••••••" required>
          </div>

          <div class="modal-buttons">
            <button type="button" class="btn-cancel" id="cancelPassword" data-i18n="cancel">Cancel</button>
            <button type="submit" class="btn-save" data-i18n="changePassword">Update Password</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", overlayHTML);
}

// Create Account Overlay dynamically
function createAccountOverlay() {
  // Check if overlay already exists
  if (document.getElementById("createAccountOverlay")) {
    return;
  }

  var overlayHTML = `
    <div class="profile-overlay" id="createAccountOverlay" style="display: none;">
      <div class="profile-modal" style="max-width: 500px;">
        <h3>Create New Account</h3>
        <div id="createAccountAlert" style="display: none; padding: 10px; margin-bottom: 15px; border-radius: 8px; font-size: 0.85rem;"></div>
        <form id="createAccountForm">
          <div class="form-group">
            <label>Account Name</label>
            <input type="text" id="createAccountName" placeholder="e.g., Savings Account" required>
          </div>
          <div class="form-group">
            <label>Account Type</label>
            <select id="createAccountType" required>
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="deposit">Deposit</option>
              <option value="investment">Investment</option>
            </select>
          </div>
          <div class="form-group">
            <label>Currency</label>
            <select id="createAccountCurrency" required>
              <option value="TRY">TRY (Turkish Lira)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="GBP">GBP (British Pound)</option>
            </select>
          </div>
          <div class="modal-buttons">
            <button type="button" class="btn-cancel" id="cancelCreateAccount">Cancel</button>
            <button type="submit" class="btn-save">Create Account</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", overlayHTML);
}

// Create Account Selection Overlay (for bill payments)
function createAccountSelectionOverlay() {
  // Check if overlay already exists
  if (document.getElementById("accountSelectionOverlay")) {
    return;
  }

  var overlayHTML = `
    <div class="profile-overlay" id="accountSelectionOverlay" style="display: none;">
      <div class="profile-modal" style="max-width: 500px;">
        <h3 id="accountSelectionTitle">Select Account</h3>
        <div id="accountSelectionList" style="max-height: 400px; overflow-y: auto; margin-bottom: 20px;">
          <!-- Accounts will be populated here -->
        </div>
        <div class="modal-buttons">
          <button type="button" class="btn-cancel" id="cancelAccountSelection">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", overlayHTML);
}

// Initialize profile modal when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  // Create overlays first, before trying to access them
  createProfileOverlay();
  createPasswordOverlay();
  createAccountOverlay();
  createAccountSelectionOverlay();

  // Verify overlays were created
  var profileOverlayCheck = document.getElementById("profileOverlay");
  var passwordOverlayCheck = document.getElementById("passwordOverlay");
  var createAccountOverlayCheck = document.getElementById(
    "createAccountOverlay"
  );
  if (!profileOverlayCheck) {
    console.error("Failed to create profile overlay");
  }
  if (!passwordOverlayCheck) {
    console.error("Failed to create password overlay");
  }
  if (!createAccountOverlayCheck) {
    console.error("Failed to create createAccountOverlay");
  } else {
    console.log("Create Account Overlay created successfully");
  }

  // Now get references to the elements
  var profileCard = document.getElementById("profileCard");
  var profileEditIcon = document.getElementById("profileEditIcon");
  var profileOverlay = document.getElementById("profileOverlay");
  var cancelProfileBtn = document.getElementById("cancelProfile");
  var profileForm = document.getElementById("profileForm");
  var passwordOverlay = document.getElementById("passwordOverlay");
  var btnOpenPassword = document.getElementById("btnOpenPassword");
  var cancelPasswordBtn = document.getElementById("cancelPassword");
  var passwordForm = document.getElementById("passwordForm");
  var profileImageInput = document.getElementById("profileImageInput");
  var profileImagePreview = document.getElementById("profileImagePreview");

  // Form inputs
  var editFirstName = document.getElementById("editFirstName");
  var editLastName = document.getElementById("editLastName");
  var editPhone = document.getElementById("editPhone");
  var editStreet = document.getElementById("editStreet");
  var editCity = document.getElementById("editCity");
  var editState = document.getElementById("editState");
  var editZip = document.getElementById("editZip");
  var prefNewsletter = document.getElementById("prefNewsletter");
  var prefSms = document.getElementById("prefSms");
  var prefDark = document.getElementById("prefDark");
  var prefLanguage = document.getElementById("prefLanguage");

  // DOM elements to update
  var profileNameEl = document.getElementById("profileName");
  var sidebarProfileImg = document.getElementById("sidebarProfileImg");

  // Open Profile Modal
  function openProfileModal() {
    // Re-fetch overlay in case it wasn't found initially
    var overlay = document.getElementById("profileOverlay");
    if (!overlay) {
      console.error("Profile overlay not found. Creating it now...");
      createProfileOverlay();
      overlay = document.getElementById("profileOverlay");
      if (!overlay) {
        console.error("Failed to create profile overlay");
        return;
      }
    }
    // Load current user data
    loadUserDataIntoForm();
    // Update translations
    updateTranslations();
    overlay.classList.add("active");
  }

  // Close Profile Modal
  function closeProfileModal() {
    var overlay = document.getElementById("profileOverlay");
    if (!overlay) return;
    overlay.classList.remove("active");
    if (profileForm) profileForm.reset();
  }

  // Load user data into form
  async function loadUserDataIntoForm() {
    try {
      var token =
        localStorage.getItem("atomBankToken") ||
        sessionStorage.getItem("atomBankToken");

      var res = await fetch(getApiBaseUrl() + "/api/user/me", {
        method: "GET",
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch user data");
      }

      var data = await res.json();
      var user = data.data;

      // Split fullName or name into first/last
      var fullName = user.fullName || user.name || "";
      var nameParts = fullName.trim().split(" ");
      if (editFirstName) {
        editFirstName.value = nameParts[0] || "";
      }
      if (editLastName) {
        editLastName.value = nameParts.slice(1).join(" ") || "";
      }

      // Fill other fields
      if (editPhone) editPhone.value = user.phone || "";

      // Address
      if (user.address) {
        if (editStreet) editStreet.value = user.address.street || "";
        if (editCity) editCity.value = user.address.city || "";
        if (editState) editState.value = user.address.state || "";
        if (editZip)
          editZip.value = user.address.postalCode || user.address.zip || "";
      }

      // Preferences - Use localStorage as source of truth to avoid theme flicker
      // The checkbox should reflect current state from localStorage, not from API
      var currentDarkMode = localStorage.getItem("atomBankDarkMode") === "true";
      var currentLanguage = localStorage.getItem("atomBankLanguage") || "en";

      if (user.preferences) {
        // Handle nested notifications structure
        if (prefNewsletter) {
          prefNewsletter.checked =
            user.preferences.notifications?.email !== false;
        }
        if (prefSms) {
          prefSms.checked = user.preferences.notifications?.sms === true;
        }
        // darkMode preference - only set checkbox, DON'T apply to prevent theme flicker
        if (prefDark) {
          // Use current localStorage value (what user sees now), not API value
          prefDark.checked = currentDarkMode;
        }
        // Language preference - only set dropdown, DON'T apply to prevent language flicker
        if (prefLanguage) {
          prefLanguage.value = currentLanguage;
        }
      } else {
        // Load from localStorage if not in user preferences
        if (prefDark) {
          prefDark.checked = currentDarkMode;
        }
        if (prefLanguage) {
          prefLanguage.value = currentLanguage;
        }
      }

      // Profile image
      if (user.profile_image) {
        var imgUrl = "/uploads/profile-images/" + user.profile_image;
        if (profileImagePreview) profileImagePreview.src = imgUrl;
        if (sidebarProfileImg) sidebarProfileImg.src = imgUrl;
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    }
  }

  // Dark mode toggle event listener
  if (prefDark) {
    prefDark.addEventListener("change", function () {
      applyDarkMode(prefDark.checked);
      localStorage.setItem(
        "atomBankDarkMode",
        prefDark.checked ? "true" : "false"
      );
    });
  }

  // Language change event listener
  if (prefLanguage) {
    prefLanguage.addEventListener("change", function () {
      applyLanguage(prefLanguage.value);
      localStorage.setItem("atomBankLanguage", prefLanguage.value);
      // Update translations immediately
      updateTranslations();
    });
  }

  // Event Listeners for profile edit icon (if exists - only on dashboard)
  if (profileEditIcon) {
    profileEditIcon.addEventListener("click", function (e) {
      e.stopPropagation();
      openProfileModal();
    });
  }

  if (cancelProfileBtn) {
    cancelProfileBtn.addEventListener("click", closeProfileModal);
  }

  // Close on overlay click (but not on modal content)
  if (profileOverlay) {
    profileOverlay.addEventListener("click", function (e) {
      // Only close if clicking directly on the overlay background, not on modal content
      if (e.target === profileOverlay) {
        closeProfileModal();
      }
    });

    // Prevent modal content clicks from closing the overlay
    var profileModal = profileOverlay.querySelector(".profile-modal");
    if (profileModal) {
      profileModal.addEventListener("click", function (e) {
        e.stopPropagation(); // Prevent click from bubbling to overlay
      });
    }
  }

  // Profile Image Upload - Circle click handled by input overlay
  if (profileImageInput) {
    profileImageInput.addEventListener("change", async function (e) {
      var file = e.target.files[0];
      if (!file) return;

      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        alert("Please select a JPG or PNG image file.");
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("Image size must be less than 10MB.");
        return;
      }

      // Preview image
      var reader = new FileReader();
      reader.onload = function (event) {
        if (profileImagePreview) {
          profileImagePreview.src = event.target.result;
        }
      };
      reader.readAsDataURL(file);

      // Upload to server
      try {
        var token =
          localStorage.getItem("atomBankToken") ||
          sessionStorage.getItem("atomBankToken");

        var formData = new FormData();
        formData.append("profile_image", file);

        var res = await fetch(getApiBaseUrl() + "/api/user/profile-image", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
          },
          body: formData,
        });

        if (!res.ok) {
          var errorData = await res.json();
          throw new Error(errorData.message || "Upload failed");
        }

        var data = await res.json();
        alert("Profile image uploaded successfully!");

        // Update sidebar image on all pages
        if (data.data) {
          var allProfileImgs = document.querySelectorAll("#sidebarProfileImg");
          allProfileImgs.forEach(function (img) {
            img.src = "/uploads/profile-images/" + data.data;
          });
        }
      } catch (err) {
        console.error("Upload error:", err);
        alert("Failed to upload image: " + err.message);
      }
    });
  }

  // Save Profile - Only when Save button is clicked
  if (profileForm) {
    profileForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      e.stopPropagation(); // Prevent any event bubbling

      // Disable submit button to prevent double submission
      var saveBtn = profileForm.querySelector('button[type="submit"]');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent =
          typeof window.t !== "undefined" ? window.t("saving") : "Saving...";
      }

      try {
        var token =
          localStorage.getItem("atomBankToken") ||
          sessionStorage.getItem("atomBankToken");

        if (!token) {
          var authErrorMsg =
            typeof window.t !== "undefined"
              ? window.t("authRequired")
              : "Authentication required. Please log in again.";
          throw new Error(authErrorMsg);
        }

        // Build update object with ALL form data (even if empty)
        var updateData = {};

        // Name - always send if fields exist
        var firstName = editFirstName ? editFirstName.value.trim() : "";
        var lastName = editLastName ? editLastName.value.trim() : "";
        if (firstName || lastName) {
          updateData.fullName = (firstName + " " + lastName).trim();
          updateData.name = firstName || updateData.fullName; // Use fullName if firstName is empty
        }

        // Contact - always send if fields exist
        if (editPhone) updateData.phone = editPhone.value.trim();

        // Address - always send if fields exist (even if empty, merge with existing)
        var address = {};
        if (editStreet) address.street = editStreet.value.trim();
        if (editCity) address.city = editCity.value.trim();
        if (editState) address.state = editState.value.trim();
        if (editZip) address.postalCode = editZip.value.trim();

        // Only add address to updateData if at least one field has a value
        if (Object.values(address).some((val) => val)) {
          updateData.address = address;
        }

        // Preferences - always send if checkboxes exist
        if (
          prefNewsletter !== null ||
          prefSms !== null ||
          prefDark !== null ||
          prefLanguage !== null
        ) {
          var preferences = {};
          // Build notifications object properly
          preferences.notifications = {};
          if (prefNewsletter !== null) {
            preferences.notifications.email = prefNewsletter.checked;
          }
          if (prefSms !== null) {
            preferences.notifications.sms = prefSms.checked;
          }
          // Keep push notification default
          preferences.notifications.push = true;

          // twoFactorAuth must be an object, not undefined
          preferences.twoFactorAuth = {
            enabled: false,
          };

          // Dark mode preference
          if (prefDark !== null) {
            preferences.darkMode = prefDark.checked;
            // Apply dark mode immediately
            applyDarkMode(prefDark.checked);
            // Save to localStorage
            localStorage.setItem(
              "atomBankDarkMode",
              prefDark.checked ? "true" : "false"
            );
          }

          // Language preference
          if (prefLanguage !== null) {
            preferences.language = prefLanguage.value;
            // Apply language immediately
            applyLanguage(prefLanguage.value);
            // Save to localStorage
            localStorage.setItem("atomBankLanguage", prefLanguage.value);
          }

          updateData.preferences = preferences;
        }

        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
          alert("No changes to save.");
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = "Save Changes";
          }
          return;
        }

        // Send update request
        var res = await fetch(getApiBaseUrl() + "/api/user/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify(updateData),
        });

        if (!res.ok) {
          var errorData = await res.json();
          throw new Error(errorData.message || "Update failed");
        }

        var data = await res.json();

        // Update UI with new data
        if (data.data) {
          var user = data.data;
          if (profileNameEl) {
            profileNameEl.textContent = user.fullName || user.name || "User";
          }

          // Update profile image on all pages
          if (user.profile_image) {
            var allProfileImgs =
              document.querySelectorAll("#sidebarProfileImg");
            allProfileImgs.forEach(function (img) {
              img.src = "/uploads/profile-images/" + user.profile_image;
            });
          }
          // Update welcome messages
          var overviewDescs = document.querySelectorAll(".overview_text .desc");
          var userName = user.fullName || user.name || "User";
          for (var i = 0; i < overviewDescs.length; i++) {
            if (typeof window.t !== "undefined") {
              overviewDescs[i].textContent = window.t("welcome", {
                name: userName,
              });
            } else {
              overviewDescs[i].textContent =
                "Hi " + userName + ", welcome back!";
            }
          }

          // Update translations after profile update
          updateTranslations();
        }

        // Show success message and close modal
        var successMsg =
          typeof window.t !== "undefined"
            ? window.t("profileUpdated")
            : "Profile updated successfully!";
        alert(successMsg);
        closeProfileModal();
      } catch (err) {
        console.error("Update error:", err);
        var errorMsg =
          typeof window.t !== "undefined"
            ? window.t("profileUpdateFailed")
            : "Failed to update profile";
        alert(errorMsg + ": " + err.message);
      } finally {
        // Re-enable submit button
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent =
            typeof window.t !== "undefined"
              ? window.t("saveChanges")
              : "Save Changes";
        }
      }
    });
  }

  // ================== PASSWORD CHANGE MODAL ==================
  if (btnOpenPassword) {
    btnOpenPassword.addEventListener("click", function () {
      passwordOverlay.classList.add("active");
    });
  }

  if (cancelPasswordBtn) {
    cancelPasswordBtn.addEventListener("click", function () {
      passwordOverlay.classList.remove("active");
      if (passwordForm) passwordForm.reset();
    });
  }

  if (passwordOverlay) {
    passwordOverlay.addEventListener("click", function (e) {
      if (e.target === passwordOverlay) {
        passwordOverlay.classList.remove("active");
        if (passwordForm) passwordForm.reset();
      }
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      var currentPass = document.getElementById("currentPass");
      var newPass = document.getElementById("newPass");
      var confirmPass = document.getElementById("confirmPass");

      if (!currentPass || !newPass || !confirmPass) return;

      var current = currentPass.value;
      var newP = newPass.value;
      var confirm = confirmPass.value;

      // Validation
      if (newP !== confirm) {
        var errorMsg =
          typeof window.t !== "undefined"
            ? window.t("passwordsNotMatch")
            : "New passwords do not match!";
        alert(errorMsg);
        return;
      }

      if (newP.length < 6) {
        var errorMsg =
          typeof window.t !== "undefined"
            ? window.t("passwordTooShort")
            : "Password must be at least 6 characters.";
        alert(errorMsg);
        return;
      }

      try {
        var token =
          localStorage.getItem("atomBankToken") ||
          sessionStorage.getItem("atomBankToken");

        var res = await fetch(getApiBaseUrl() + "/api/auth/change-password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            oldPassword: current,
            newPassword: newP,
          }),
        });

        if (!res.ok) {
          var errorData = await res.json();
          throw new Error(errorData.message || "Password change failed");
        }

        var successMsg =
          typeof window.t !== "undefined"
            ? window.t("passwordChanged")
            : "Password changed successfully!";
        alert(successMsg);
        passwordOverlay.classList.remove("active");
        passwordForm.reset();
      } catch (err) {
        console.error("Password change error:", err);
        var errorMsg =
          typeof window.t !== "undefined"
            ? window.t("passwordChangeFailed")
            : "Failed to change password";
        alert(errorMsg + ": " + err.message);
      }
    });
  }

  // Initialize profile card click handlers on all pages
  var profileCard = document.getElementById("profileCard");
  if (profileCard) {
    profileCard.addEventListener("click", function (e) {
      // Don't open if clicking the logout icon
      if (e.target.closest("#logoutIcon")) return;
      openProfileModal();
    });
  }

  // Initialize "Open new account" link handlers on all pages
  var openAccountLinks = document.querySelectorAll(
    'a[aria-label="open-account"]'
  );
  openAccountLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      openCreateAccountModal();
    });
  });

  // Initialize "Open New Account" buttons (using querySelectorAll for multiple buttons)
  var createAccountBtns = document.querySelectorAll(
    "#createAccountBtn, .createAccountBtn"
  );
  createAccountBtns.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      openCreateAccountModal();
    });
  });

  // Create Account Modal Functions
  function openCreateAccountModal() {
    var overlay = document.getElementById("createAccountOverlay");
    if (!overlay) {
      createAccountOverlay();
      overlay = document.getElementById("createAccountOverlay");
    }
    if (overlay) {
      // Force reflow to ensure display is set before adding active class
      overlay.style.display = "flex";
      // Use requestAnimationFrame to ensure smooth transition
      requestAnimationFrame(function () {
        overlay.classList.add("active");
      });
    } else {
      console.error("Failed to create or find createAccountOverlay");
    }
  }

  function closeCreateAccountModal() {
    var overlay = document.getElementById("createAccountOverlay");
    if (overlay) {
      overlay.classList.remove("active");
      setTimeout(function () {
        overlay.style.display = "none";
      }, 300);
      var form = document.getElementById("createAccountForm");
      if (form) form.reset();
      var alert = document.getElementById("createAccountAlert");
      if (alert) {
        alert.style.display = "none";
        alert.textContent = "";
      }
    }
  }

  // Create Account Form Handler
  var createAccountForm = document.getElementById("createAccountForm");
  if (createAccountForm) {
    createAccountForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      var accountName = document
        .getElementById("createAccountName")
        .value.trim();
      var accountType = document.getElementById("createAccountType").value;
      var accountCurrency = document.getElementById(
        "createAccountCurrency"
      ).value;
      var alert = document.getElementById("createAccountAlert");

      if (!accountName) {
        if (alert) {
          alert.style.display = "block";
          alert.style.backgroundColor = "#fee";
          alert.style.color = "#c33";
          alert.textContent = "Account name is required";
        }
        return;
      }

      try {
        var token =
          localStorage.getItem("atomBankToken") ||
          sessionStorage.getItem("atomBankToken");
        if (!token) {
          if (alert) {
            alert.style.display = "block";
            alert.style.backgroundColor = "#fee";
            alert.style.color = "#c33";
            alert.textContent = "Please login again";
          }
          return;
        }

        var response = await fetch(getApiBaseUrl() + "/api/account", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            accountName: accountName,
            type: accountType,
            currency: accountCurrency,
          }),
        });

        var data = await response.json();

        if (response.ok && data.success) {
          if (alert) {
            alert.style.display = "block";
            alert.style.backgroundColor = "#dfd";
            alert.style.color = "#3a3";
            alert.textContent = "Account created successfully!";
          }
          createAccountForm.reset();

          setTimeout(function () {
            closeCreateAccountModal();
            window.location.reload();
          }, 1000);
        } else {
          if (alert) {
            alert.style.display = "block";
            alert.style.backgroundColor = "#fee";
            alert.style.color = "#c33";
            alert.textContent = data.message || "Failed to create account";
          }
        }
      } catch (err) {
        console.error("Error creating account:", err);
        if (alert) {
          alert.style.display = "block";
          alert.style.backgroundColor = "#fee";
          alert.style.color = "#c33";
          alert.textContent = "An error occurred. Please try again.";
        }
      }
    });
  }

  // Cancel Create Account Button
  var cancelCreateAccountBtn = document.getElementById("cancelCreateAccount");
  if (cancelCreateAccountBtn) {
    cancelCreateAccountBtn.addEventListener("click", closeCreateAccountModal);
  }

  // Close Create Account Overlay on background click
  var createAccountOverlayEl = document.getElementById("createAccountOverlay");
  if (createAccountOverlayEl) {
    createAccountOverlayEl.addEventListener("click", function (e) {
      if (e.target === createAccountOverlayEl) {
        closeCreateAccountModal();
      }
    });
  }

  // Make functions globally available
  window.openCreateAccountModal = openCreateAccountModal;
  window.closeCreateAccountModal = closeCreateAccountModal;

  // Account Selection Overlay handlers
  var accountSelectionOverlayEl = document.getElementById(
    "accountSelectionOverlay"
  );
  if (accountSelectionOverlayEl) {
    accountSelectionOverlayEl.addEventListener("click", function (e) {
      if (e.target === accountSelectionOverlayEl) {
        if (window.closeAccountSelectionModal) {
          window.closeAccountSelectionModal();
        }
      }
    });
  }
}); // End of DOMContentLoaded

// ================== GLOBAL RESULT MODAL ==================
/**
 * Shows a result modal with different states
 * @param {Object} options
 * @param {string} options.type - 'success' | 'error' | 'warning' | 'info'
 * @param {string} options.title - Modal title
 * @param {string} options.message - Modal message
 * @param {Object} options.details - Optional details object { label: value }
 * @param {string} options.buttonText - Optional button text (default: 'OK')
 * @param {Function} options.onClose - Optional callback when modal closes
 */
function showResultModal(options) {
  const { type = 'info', title, message, details = null, buttonText = 'OK', onClose = null } = options;

  // Ensure modal exists, inject if not
  let modal = document.getElementById('resultModal');
  if (!modal) {
    injectResultModal();
    modal = document.getElementById('resultModal');
  }

  const iconContainer = document.getElementById('resultModalIcon');
  const titleEl = document.getElementById('resultModalTitle');
  const messageEl = document.getElementById('resultModalMessage');
  const detailsEl = document.getElementById('resultModalDetails');
  const btnEl = document.getElementById('resultModalBtn');

  // Icon mapping
  const icons = {
    success: { icon: 'check_circle', class: 'icon-success' },
    error: { icon: 'error', class: 'icon-error' },
    warning: { icon: 'warning', class: 'icon-warning' },
    info: { icon: 'info', class: 'icon-info' }
  };

  const iconConfig = icons[type] || icons.info;

  // Set content
  iconContainer.className = `result-icon ${iconConfig.class}`;
  iconContainer.innerHTML = `<span class="material-symbols-outlined">${iconConfig.icon}</span>`;

  titleEl.textContent = title;
  messageEl.textContent = message;
  btnEl.textContent = buttonText;

  // Handle details
  if (details && Object.keys(details).length > 0) {
    detailsEl.classList.remove('hidden');
    detailsEl.innerHTML = Object.entries(details)
      .map(([label, value]) => `
        <div class="result-detail-row">
          <span class="result-detail-label">${label}</span>
          <span class="result-detail-value">${value}</span>
        </div>
      `).join('');
  } else {
    detailsEl.classList.add('hidden');
  }

  // Store callback
  window._resultModalOnClose = onClose;

  // Show modal
  modal.classList.add('active');

  // Close on Escape
  document.addEventListener('keydown', handleResultModalEscape);
}

function closeResultModal() {
  const modal = document.getElementById('resultModal');
  if (modal) {
    modal.classList.remove('active');

    // Call callback if exists
    if (typeof window._resultModalOnClose === 'function') {
      setTimeout(() => {
        window._resultModalOnClose();
        window._resultModalOnClose = null;
      }, 300);
    }
  }
  document.removeEventListener('keydown', handleResultModalEscape);
}

function handleResultModalEscape(e) {
  if (e.key === 'Escape') closeResultModal();
}

function injectResultModal() {
  const modalHTML = `
    <div id="resultModal" class="result-modal-overlay">
      <div class="result-modal-backdrop" onclick="closeResultModal()"></div>
      <div class="result-modal-content">
        <div id="resultModalIcon" class="result-icon"></div>
        <h3 id="resultModalTitle" class="result-modal-title"></h3>
        <p id="resultModalMessage" class="result-modal-message"></p>
        <div id="resultModalDetails" class="result-modal-details hidden"></div>
        <button onclick="closeResultModal()" id="resultModalBtn" class="result-modal-btn">OK</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Global access
window.showResultModal = showResultModal;
window.closeResultModal = closeResultModal;

// ================== NAME VERIFICATION MODAL ==================
let _verificationResolve = null;
let _correctName = null;

/**
 * Masks a name for verification
 * "Ayşe Yılmaz" -> "A*** Y*****"
 */
function maskName(fullName) {
  if (!fullName) return '***';
  return fullName
    .split(' ')
    .map(word => {
      if (word.length <= 1) return word;
      return word[0].toUpperCase() + '*'.repeat(word.length - 1);
    })
    .join(' ');
}

function maskIban(iban) {
  if (!iban) return '****';
  const clean = iban.replace(/\s/g, '');
  if (clean.length < 8) return '****';
  return clean.slice(0, 4) + ' **** **** ' + clean.slice(-4);
}

/**
 * Shows name verification modal
 * @param {Object} options
 * @param {string} options.recipientName - The actual recipient name
 * @param {string} options.amount - Formatted amount string
 * @param {string} options.iban - IBAN (will be partially masked)
 * @returns {Promise<boolean>} - true if verified, false if cancelled
 */
function showNameVerification(options) {
  return new Promise((resolve) => {
    const { recipientName, amount, iban } = options;

    _verificationResolve = resolve;
    _correctName = recipientName.toLowerCase().trim();

    // Ensure modal exists
    let modal = document.getElementById('nameVerificationModal');
    if (!modal) {
      injectNameVerificationModal();
      modal = document.getElementById('nameVerificationModal');
    }

    // Set content
    document.getElementById('maskedNameDisplay').textContent = maskName(recipientName);
    document.getElementById('verifyAmount').textContent = amount;
    document.getElementById('verifyIban').textContent = maskIban(iban);

    // Reset input
    const input = document.getElementById('nameVerificationInput');
    input.value = '';
    document.getElementById('nameVerificationError').classList.add('hidden');

    // Reset button state
    const confirmBtn = document.getElementById('confirmVerificationBtn');
    confirmBtn.disabled = true;
    confirmBtn.className = 'verification-btn verification-btn-disabled';

    // Add input listener
    input.oninput = () => {
      const inputValue = input.value.toLowerCase().trim();
      const isMatch = inputValue === _correctName;

      document.getElementById('nameVerificationError').classList.add('hidden');

      if (isMatch) {
        confirmBtn.disabled = false;
        confirmBtn.className = 'verification-btn verification-btn-active';
      } else {
        confirmBtn.disabled = true;
        confirmBtn.className = 'verification-btn verification-btn-disabled';
      }
    };

    // Enter key to confirm
    input.onkeydown = (e) => {
      if (e.key === 'Enter' && !confirmBtn.disabled) {
        confirmNameVerification();
      }
    };

    // Show modal
    modal.classList.add('active');
    setTimeout(() => input.focus(), 100);

    // Escape key
    document.addEventListener('keydown', handleVerificationEscape);
  });
}

function confirmNameVerification() {
  const input = document.getElementById('nameVerificationInput');
  const inputValue = input.value.toLowerCase().trim();

  if (inputValue === _correctName) {
    closeNameVerificationModal();
    if (_verificationResolve) {
      _verificationResolve(true);
      _verificationResolve = null;
    }
  } else {
    document.getElementById('nameVerificationError').classList.remove('hidden');
    input.focus();
  }
}

function cancelNameVerification() {
  closeNameVerificationModal();
  if (_verificationResolve) {
    _verificationResolve(false);
    _verificationResolve = null;
  }
}

function closeNameVerificationModal() {
  const modal = document.getElementById('nameVerificationModal');
  if (modal) {
    modal.classList.remove('active');
  }
  document.removeEventListener('keydown', handleVerificationEscape);
  _correctName = null;
}

function handleVerificationEscape(e) {
  if (e.key === 'Escape') cancelNameVerification();
}

function injectNameVerificationModal() {
  const modalHTML = `
    <div id="nameVerificationModal" class="verification-modal-overlay">
      <div class="verification-modal-backdrop" onclick="cancelNameVerification()"></div>
      <div class="verification-modal-content">
        <div class="verification-header">
          <div class="verification-icon">
            <span class="material-symbols-outlined">verified_user</span>
          </div>
          <h3 class="verification-title">Verify Recipient</h3>
          <p class="verification-subtitle">Please type the recipient's full name to confirm</p>
        </div>

        <div class="verification-masked-name">
          <span class="verification-label">RECIPIENT NAME</span>
          <p id="maskedNameDisplay" class="verification-masked-text">A*** Y*****</p>
        </div>

        <div class="verification-details">
          <div class="verification-detail-row">
            <span>Amount</span>
            <span id="verifyAmount" class="verification-detail-value">₺0.00</span>
          </div>
          <div class="verification-detail-row">
            <span>IBAN</span>
            <span id="verifyIban" class="verification-detail-value verification-iban">TR** **** ****</span>
          </div>
        </div>

        <div class="verification-input-group">
          <label class="verification-input-label">Type the full name to confirm</label>
          <input
            type="text"
            id="nameVerificationInput"
            class="verification-input"
            placeholder="Enter recipient name..."
            autocomplete="off"
          />
          <p id="nameVerificationError" class="verification-error hidden">
            Name does not match. Please try again.
          </p>
        </div>

        <div class="verification-buttons">
          <button onclick="cancelNameVerification()" class="verification-btn verification-btn-cancel">
            Cancel
          </button>
          <button onclick="confirmNameVerification()" id="confirmVerificationBtn" class="verification-btn verification-btn-disabled" disabled>
            Confirm Transfer
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Global access
window.showNameVerification = showNameVerification;
window.confirmNameVerification = confirmNameVerification;
window.cancelNameVerification = cancelNameVerification;
window.maskName = maskName;
window.maskIban = maskIban;
