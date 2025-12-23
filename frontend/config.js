// ================== API CONFIGURATION ==================
// This file configures the API base URL for different environments

// Set your Render backend URL here after deployment
const PRODUCTION_API_URL = "https://atombankali.onrender.com";

// Detect environment and set API base URL
const API_BASE_URL = window.location.hostname === "localhost"
  ? "" // Empty string for local development (same origin)
  : PRODUCTION_API_URL;

// Export for use in other scripts
window.API_BASE_URL = API_BASE_URL;

console.log("API Base URL:", API_BASE_URL || "(same origin)");
