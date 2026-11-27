# Security Policy — TLS SECURITY LAB V3.0

## 1. Authentication & Password Protection
- Local student account passwords are never stored in plaintext or logged to the console.
- Passwords are derived using **Web Crypto PBKDF2-SHA256** (`100,000` iterations) with a **16-byte CSPRNG random salt** (`window.crypto.getRandomValues`) and verified with `constantTimeEqual()`.
- Resuming a logged-out session or deleting a local account requires re-entering the current password when a password is configured.

## 2. Cryptographic Key Handling
- **AES-GCM**: Uses `crypto.subtle.generateKey` and a fresh 96-bit CSPRNG IV on every encryption.
- **ECDHE P-256 & RSA-2048**: Private keys remain inside Web Crypto `CryptoKey` handles and are never exported or logged.

## 3. Frontend & Browser Security
- `index.html` includes `Content-Security-Policy` and `Referrer-Policy: strict-origin-when-cross-origin` meta tags.
- `vercel.json` configures `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Permissions-Policy`.
- User-controlled strings rendered in reports and certificate verification views are sanitized via `escapeHtml()`.

## 4. Data Protection & Scope Limitations
- Certificate verification omits personal student details and displays only credential validity, title, ID, issue date, and platform.
- JSON data export (`#btnPrivacyExport`) explicitly excludes `tls_lab_account_auth_v1` password hashes.
- **Scope Note**: Because persistence uses client-side `localStorage`, browser DevTools users can inspect or clear their own local state. Server-side enforcement requires a backend API if deployed in a graded multi-user environment.

## 5. Reporting a Vulnerability
Please open a private issue or contact the repository maintainers with reproduction steps and affected file paths. Do not test against external third-party hosts.
