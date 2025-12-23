// Auth Guard - Include this script at the top of all protected pages
(function() {
  var token = localStorage.getItem("atomBankToken") || sessionStorage.getItem("atomBankToken");
  var apiBaseUrl = window.API_BASE_URL || "";

  if (!token) {
    window.location.href = "/index.html";
    return;
  }

  // Store token globally for API calls
  window.atomBankToken = token;

  // Helper function for authenticated API calls
  window.authFetch = function(url, options) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers["Authorization"] = "Bearer " + token;
    // Prepend API base URL if the URL starts with /api
    if (url.startsWith("/api")) {
      url = apiBaseUrl + url;
    }
    return fetch(url, options);
  };

  // Fetch current user info and set window.currentUser
  fetch(apiBaseUrl + "/api/user/me", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    }
  })
  .then(function(res) {
    if (!res.ok) {
      throw new Error("Failed to fetch user");
    }
    return res.json();
  })
  .then(function(data) {
    window.currentUser = data.data || data.user || data;
    console.log("Current user loaded:", window.currentUser);

    // Dispatch event so other scripts know user is ready
    window.dispatchEvent(new CustomEvent("userLoaded", { detail: window.currentUser }));
  })
  .catch(function(err) {
    console.error("Error fetching current user:", err);
    // Set empty user object so scripts don't hang
    window.currentUser = {};
    window.dispatchEvent(new CustomEvent("userLoaded", { detail: {} }));
  });
})();
