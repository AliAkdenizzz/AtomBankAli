# Quick Transfer & API URL Fix

## Problem Description

When accessing the application from Vercel (`atom-bank-ali.vercel.app`), API requests were being sent to the Vercel domain instead of the Render backend (`atombankali.onrender.com`). This caused 404 errors because Vercel doesn't have the backend routes.

### Error Messages
- `POST https://atom-bank-ali.vercel.app/api/transactions/transfer-external 404 (Not Found)`
- `GET https://atom-bank-ali.vercel.app/api/smart/spending?period=monthly 404`
- `Unexpected token 'T', "The page c"... is not valid JSON`

### Root Cause
Several fetch calls in the frontend were using relative URLs (`/api/...`) instead of the configured `API_BASE_URL`. This works locally (same origin), but fails in production where frontend and backend are on different domains.

---

## Files Changed

### 1. `frontend/config.js`
**Change:** Updated placeholder API URL to actual Render URL

```diff
- const PRODUCTION_API_URL = "https://your-backend.onrender.com";
+ const PRODUCTION_API_URL = "https://atombankali.onrender.com";
```

---

### 2. `frontend/dashboard.html`

#### Line 651 - Quick Transfer API Call
**Change:** Added `getApiBaseUrl()` prefix to transfer-external endpoint

```diff
- const res = await fetch('/api/transactions/transfer-external', {
+ const res = await fetch(getApiBaseUrl() + '/api/transactions/transfer-external', {
```

#### Line 512 - Search by Phone API Call
**Change:** Added `getApiBaseUrl()` prefix to search-by-phone endpoint

```diff
- const res = await fetch(`/api/user/search-by-phone?phone=${encodeURIComponent(phone)}`, {
+ const res = await fetch(getApiBaseUrl() + `/api/user/search-by-phone?phone=${encodeURIComponent(phone)}`, {
```

#### Line 778 - Spending Analysis API Call
**Change:** Added `getApiBaseUrl()` prefix to smart/spending endpoint

```diff
- const res = await fetch(`/api/smart/spending?period=${period}`, {
+ const res = await fetch(getApiBaseUrl() + `/api/smart/spending?period=${period}`, {
```

---

### 3. `frontend/currencyexchange.html`

#### Line 509 - Exchange Rates API Call
**Change:** Added `window.API_BASE_URL` prefix to exchange/rates endpoint

```diff
- const res = await fetch(`/api/exchange/rates?baseCurrency=${baseCurrency}`, {
+ const res = await fetch((window.API_BASE_URL || "") + `/api/exchange/rates?baseCurrency=${baseCurrency}`, {
```

---

### 4. `frontend/billpaymentsData.js`

#### Line 232 - Pay Single Bill API Call
**Change:** Added `getApiBaseUrl()` prefix to bills pay endpoint

```diff
- const res = await fetch(`/api/bills/${billId}/pay`, {
+ const res = await fetch(getApiBaseUrl() + `/api/bills/${billId}/pay`, {
```

#### Line 384 - Pay Multiple Bills API Call
**Change:** Added `getApiBaseUrl()` prefix to bills pay endpoint (batch payment)

```diff
- const res = await fetch(`/api/bills/${bill._id}/pay`, {
+ const res = await fetch(getApiBaseUrl() + `/api/bills/${bill._id}/pay`, {
```

---

### 5. `frontend/smartassistant.html`

#### Line 786 - Chatbot Chat API Call
**Change:** Added `getApiBaseUrl()` prefix to chatbot/chat endpoint

```diff
- const response = await fetch('/api/chatbot/chat', {
+ const response = await fetch(getApiBaseUrl() + '/api/chatbot/chat', {
```

#### Line 831 - Chatbot Quick Actions API Call
**Change:** Added `getApiBaseUrl()` prefix to chatbot/quick-actions endpoint

```diff
- const response = await fetch('/api/chatbot/quick-actions', {
+ const response = await fetch(getApiBaseUrl() + '/api/chatbot/quick-actions', {
```

#### Line 878 - Chatbot Help API Call
**Change:** Added `getApiBaseUrl()` prefix to chatbot/help endpoint

```diff
- const response = await fetch('/api/chatbot/help', {
+ const response = await fetch(getApiBaseUrl() + '/api/chatbot/help', {
```

#### Line 912 - Chatbot Session Delete API Call
**Change:** Added `getApiBaseUrl()` prefix to chatbot/session endpoint

```diff
- fetch('/api/chatbot/session', {
+ fetch(getApiBaseUrl() + '/api/chatbot/session', {
```

---

## Summary of Changes

| File | Lines Changed | Endpoints Fixed |
|------|---------------|-----------------|
| `config.js` | 1 | API Base URL |
| `dashboard.html` | 3 | transfer-external, search-by-phone, smart/spending |
| `currencyexchange.html` | 1 | exchange/rates |
| `billpaymentsData.js` | 2 | bills/pay (single & batch) |
| `smartassistant.html` | 4 | chatbot/chat, quick-actions, help, session |

**Total: 11 fetch calls fixed across 5 files**

---

## Technical Details

### How `getApiBaseUrl()` Works
```javascript
// In config.js
const PRODUCTION_API_URL = "https://atombankali.onrender.com";
const API_BASE_URL = window.location.hostname === "localhost"
  ? "" // Empty string for local development (same origin)
  : PRODUCTION_API_URL;
window.API_BASE_URL = API_BASE_URL;

// In dataFetcher.js
function getApiBaseUrl() {
  return window.API_BASE_URL || "";
}
```

### Why This Fix Works
- **Local Development:** `window.location.hostname === "localhost"` returns `true`, so `API_BASE_URL` is empty string, and requests go to same origin
- **Production (Vercel):** `window.location.hostname` is `atom-bank-ali.vercel.app`, so `API_BASE_URL` is `https://atombankali.onrender.com`, and requests go to Render backend

---

## Testing Checklist

- [ ] Quick Transfer works on Vercel
- [ ] Search by Phone works on Vercel
- [ ] Spending Analysis chart loads on Vercel
- [ ] Currency Exchange rates load on Vercel
- [ ] Bill Payments work on Vercel
- [ ] Smart Assistant chatbot works on Vercel
- [ ] All features still work on localhost

---

## Date
December 23, 2024
