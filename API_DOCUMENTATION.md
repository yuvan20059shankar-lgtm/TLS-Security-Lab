# API Documentation — TLS SECURITY LAB V3.0

## 1. Backend REST API Status
**No backend HTTP/REST API endpoints exist in this repository.** TLS Security Lab V3.0 is a pure client-side static web application.

## 2. Client-Side Browser & Module Interfaces
All cryptographic, validation, and persistence operations execute locally via browser APIs and global data modules:

### A. Web Crypto API (`window.crypto.subtle`)
| Operation | Algorithm / Parameters | Source Location |
|---|---|---|
| Symmetric Encryption | `AES-GCM` (128/256-bit key, 96-bit CSPRNG IV) | `script.js` (Practical Crypto Lab) |
| Key Agreement | `ECDH` (`P-256` curve, `deriveBits` 256-bit) | `script.js` (ECDHE Lab) |
| Asymmetric Encryption | `RSA-OAEP` (`2048`-bit, `SHA-256`) | `script.js` (RSA Lab) |
| Digital Signatures | `RSA-PSS` (`2048`-bit, `SHA-256`) | `script.js` (RSA Signature Lab) |
| Cryptographic Hashing | `SHA-256`, `SHA-384`, `SHA-512` | `script.js` (Hashing & Challenge Validator) |
| Password Key Derivation | `PBKDF2` (`SHA-256`, `100,000` iterations, 16-byte salt) | `script.js` (`hashPasswordPbkdf2`) |

### B. Static Data Module Interfaces
- `window.ACADEMY_DATA` ([academy-data.js](file:///d:/projects/cns%20working%20demo/academy-data.js)): 5 modules, 35 structured lessons.
- `window.QUIZ_BANK` ([quiz-data.js](file:///d:/projects/cns%20working%20demo/quiz-data.js)): Categorized MCQs (`Easy`, `Medium`, `Hard`) with explanations.
- `window.CHALLENGES_BANK` ([challenges-data.js](file:///d:/projects/cns%20working%20demo/challenges-data.js)): 16 auto-validated challenges across 8 categories with 4-tier progressive hints.
