# Security Policy & Implementation

This document outlines the security features, implementation details, and best practices for the SonarLabs Analytics Dashboard.

---

## 🔐 Authentication & Authorization

- **Mock OAuth 2.0**: The app uses a mock OAuth 2.0 flow for demonstration, with hardcoded users and roles (`admin`, `analyst`, `viewer`).
- **Role-Based Access Control (RBAC)**: All sensitive UI and API actions are gated by user role, enforced via a centralized `useAuth()` hook.
- **Session Persistence**: Auth state is stored in `localStorage` and rehydrated on app load.
- **Best Practice**: For production, integrate a real OAuth provider (e.g., Google, Auth0) and use secure, HTTP-only cookies for session management.

---

## 🔒 Data Encryption

- **Field-Level Encryption**: Sensitive fields (`siteName`, `siteId`) are encrypted before being stored in IndexedDB using AES-GCM via the Web Crypto API.
- **Key Management**: In the demo, encryption keys are hardcoded. **In production, use environment variables or a secrets manager.**
- **Fallbacks**: Encryption/decryption errors are caught and logged; the app fails gracefully to avoid data loss or crashes.

---

## 🗄️ Data Storage & Privacy

- **IndexedDB**: All analytics data is stored locally in the browser, encrypted at rest.
- **Data Pruning**: Old analytics records are pruned (removed) after 1 hour to minimize data exposure and storage risk.
- **Export Controls**: Data exports (CSV, PDF) are only available to authenticated users.

---

## 🛡️ Application Security

- **Content Security Policy (CSP)**: (Planned) Add CSP headers to restrict script and resource loading.
- **XSS Protection**: All user input is sanitized; React escapes output by default.
- **CSRF Protection**: (Planned) Use anti-CSRF tokens for any future API endpoints that mutate data.
- **Dependency Management**: Regularly update dependencies and monitor for vulnerabilities using `npm audit` or GitHub Dependabot.

---

## 🕵️ Monitoring & Logging

- **Centralized Logger**: All errors (encryption, WebSocket, IndexedDB) are logged via a central utility.
- **Monitoring Hooks**: Sentry and StatsD integration stubs are present for error and performance monitoring.
- **Best Practice**: In production, enable Sentry or another monitoring tool for real-time alerting.

---

## 🚨 Known Limitations (Demo Mode)

- **Mock Auth**: No real user authentication; do not use in production as-is.
- **Hardcoded Keys**: Encryption keys are not securely managed.
- **No Rate Limiting**: No backend API, so no rate limiting or brute-force protection.
- **No Audit Logging**: No persistent audit trail for sensitive actions.

---


