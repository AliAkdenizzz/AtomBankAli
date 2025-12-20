// IBAN validation for Turkish IBAN format
// TR IBAN format: TR + 2 digit check + 24 digit account
// Total: 26 characters (TR + 24 digits)

function validateIBAN(iban) {
  if (!iban || typeof iban !== "string") {
    return false;
  }

  const normalized = normalizeIBAN(iban);

  // Check if starts with TR
  if (!normalized.startsWith("TR")) {
    return false;
  }

  // Check length (TR + 24 digits = 26 characters)
  if (normalized.length !== 26) {
    return false;
  }

  // Check format: TR followed by 24 digits
  if (!/^TR\d{24}$/.test(normalized)) {
    return false;
  }

  return true;
}

function normalizeIBAN(iban) {
  if (!iban || typeof iban !== "string") {
    return "";
  }
  // Remove all spaces and convert to uppercase
  return iban.replace(/\s/g, "").toUpperCase();
}

module.exports = {
  validateIBAN,
  normalizeIBAN,
};
