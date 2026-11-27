# TLS SECURITY LAB V3.0

**Interactive Network Security, Cryptography & Student Learning Platform (B.Tech CSE)**

An interactive, browser-native cybersecurity laboratory and student learning platform built with **HTML5**, **CSS3**, **Vanilla JavaScript**, and the **Web Crypto API (`window.crypto.subtle`)**. Designed for B.Tech Computer Science & Engineering students studying **Network Security** and **Cryptography**.

---

## 1. Project Overview
TLS Security Lab V3.0 combines real in-browser cryptographic execution (AES-GCM, RSA-2048, ECDHE P-256, SHA-256/384/512) with animated protocol simulations, safe attack demonstrations, structured learning modules, auto-validated practical challenges, quizzes, PDF reporting, QR-verified certificates, and personalized student profiles.

## 2. Problem Statement
Traditional cryptography and network security courses rely heavily on static slides and theoretical equations. Students often struggle to visualize how TLS 1.3 1-RTT handshakes, ephemeral Diffie-Hellman key agreement, X.509 certificate chains, and authenticated encryption work together to defeat real-world network attacks.

## 3. Project Objectives
- Provide an interactive, zero-setup educational lab running directly in modern web browsers.
- Execute real cryptographic primitives using the native **Web Crypto API** rather than mock strings.
- Offer a complete **Student Learning Mode** with lessons, quizzes, hands-on challenges, analytics, certificates, and customizable profiles.

## 4. Key Features
- **Security Operations Dashboard**: Real-time TLS Security Score (0–100), Connection Monitor, TLS 1.2 vs 1.3 Doughnut Chart, and Handshake Analytics.
- **TLS Handshake Simulator**: 5-stage conceptual overview and 8-message detailed TLS 1.3 flow with packet flight animations.
- **Certificate Inspector**: X.509 chain validation across Valid, Expired, Untrusted Root CA, and Domain Mismatch scenarios.
- **Practical Crypto Lab**: Real Web Crypto API execution for **AES-128/256-GCM**, **RSA-2048 OAEP & PSS Signatures**, **ECDHE P-256 Key Exchange**, and **SHA-256/384/512** avalanche hashing.
- **TLS 1.2 vs TLS 1.3 Benchmark**: Interactive comparison matrix and Chart.js latency visualization.
- **Attack Playground**: Safe animated simulations of **MITM**, **Replay**, **Eavesdropping**, **Certificate Spoofing**, and **Data Tampering** with TLS Shield defense.
- **Student Learning Platform**:
  - **Student Dashboard** with live KPIs, daily challenge, and activity log.
  - **Learning Academy** (5 modules, 35 structured lessons).
  - **Quiz Center** (topic-wise MCQs, Easy/Medium/Hard, timer, explanations).
  - **Practical Challenges** (16 auto-validated challenges across 8 categories with 4-tier progressive hints).
  - **Progress & Achievements** (6 auto-unlocked badges, 7-day activity calendar, Chart.js analytics).
  - **Security Reports & Certificates** (PDF export via `jsPDF`, printable preview, QR-verified completion certificates).
  - **Student Profile & Settings** (PBKDF2-SHA256 local password protection, themes, font scale, density, data export).

## 5. Student Mode Explanation
Student Mode tracks real lesson completions, lab executions, quiz attempts, challenge scores, and active study time persistently in `localStorage`. All statistics, badges, reports, and completion certificates are computed strictly from actual recorded student activity.

## 6. Technology Stack
- **Frontend**: HTML5, CSS3 (Burgundy Black `#160810` + Neon Pink `#FF6685` theme + Light Theme), Vanilla JavaScript (ES6+)
- **Cryptography**: Native Browser **Web Crypto API** (`window.crypto.subtle`, `window.crypto.getRandomValues`)
- **Visualization & Export**: Chart.js (CDN), `qrcode-generator` (CDN), `jsPDF` (CDN)
- **Persistence**: Browser `localStorage`
- **Hosting Config**: Static hosting ready for Vercel (`vercel.json`)

## 7. Screenshots
See [`screenshots/README.md`](./screenshots/README.md) for capture instructions. *(Screenshots should be captured from a live browser session.)*

## 8. System Architecture
TLS Security Lab V3.0 is a **pure client-side static web application** with no separate backend server or SQL database. See [`PROJECT_ARCHITECTURE.md`](./PROJECT_ARCHITECTURE.md) for full component and Mermaid diagrams.

## 9. Installation & Running
See [`INSTALLATION.md`](./INSTALLATION.md) for step-by-step setup. Quick start:
```powershell
# Using Node.js static server or VS Code Live Server, or open index.html directly
npx serve . -l 3000
```
Then open `http://localhost:3000/`. *(No backend server or `.env` configuration is required.)*

## 10. API & Database Overview
- **API**: No backend REST API exists; all cryptographic operations use the browser Web Crypto API. See [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md).
- **Database**: Persistence uses structured `localStorage` collections. See [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md).

## 11. Testing Instructions
- **Syntax Verification**:
  ```powershell
  node -c script.js
  node -c academy-data.js
  node -c quiz-data.js
  node -c challenges-data.js
  ```
- **Manual Browser QA**: Open `http://localhost:3000/` and test all 15 sidebar tabs, Web Crypto operations, Quiz submission, Challenge validation, PDF export, Certificate verification, and Profile settings.

## 12. Security Considerations
- Salted **PBKDF2-SHA256** (`100,000` iterations, 16-byte CSPRNG salt) for local account passwords.
- HTML escaping (`escapeHtml`) on user-supplied report/certificate fields and `<meta http-equiv="Content-Security-Policy">` in `index.html`.
- See [`SECURITY.md`](./SECURITY.md) for full details and client-side storage boundaries.

## 13. Future Enhancements
- Optional backend REST API (Node.js/Express) + PostgreSQL for multi-device sync and server-side certificate verification.
- Optional AI Cybersecurity Tutor microservice with server-side API key management.
- PCAP upload parser for real Wireshark trace inspection.

## 14. Contributors & Contributing
Contributions are welcome! Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## 15. License
Provided for academic and educational use in B.Tech Network Security and Cryptography coursework.
